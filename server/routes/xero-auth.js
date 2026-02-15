const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// --- Xero OAuth 2.0 config ---
const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';
const XERO_SCOPES = 'openid profile email accounting.transactions.read offline_access';

function getClientId() {
  return process.env.XERO_CLIENT_ID;
}

function getClientSecret() {
  return process.env.XERO_CLIENT_SECRET;
}

function getRedirectUri() {
  return process.env.XERO_REDIRECT_URI;
}

// In-memory state store (CSRF)
const pendingStates = new Map();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingStates) {
    if (now - val.created > 10 * 60 * 1000) {
      pendingStates.delete(key);
    }
  }
}, 10 * 60 * 1000);

// GET /auth/xero - Start Xero OAuth flow
router.get('/xero', (req, res) => {
  try {
    const clientId = getClientId();
    const redirectUri = getRedirectUri();

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: 'Xero OAuth not configured. Set XERO_CLIENT_ID and XERO_REDIRECT_URI.',
      });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const frontendRedirect = req.query.redirectUri || process.env.FRONTEND_URL || '';

    pendingStates.set(state, {
      frontendRedirect,
      created: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: XERO_SCOPES,
      state,
    });

    const authUrl = `${XERO_AUTH_URL}?${params.toString()}`;
    console.log('[Xero Auth] Redirecting to Xero OAuth:', authUrl);

    res.json({ url: authUrl });
  } catch (error) {
    console.error('[Xero Auth] Error starting OAuth flow:', error);
    res.status(500).json({ error: 'Failed to start Xero OAuth flow' });
  }
});

// GET /auth/xero/callback - Handle OAuth callback from Xero
router.get('/xero/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error('[Xero Auth] OAuth error:', oauthError);
      return redirectToFrontend(res, '', 'error', `Xero OAuth denied: ${oauthError}`);
    }

    if (!code) {
      return redirectToFrontend(res, '', 'error', 'Missing authorization code');
    }

    // Validate CSRF state
    const stateData = pendingStates.get(state);
    if (!stateData) {
      console.error('[Xero Auth] Invalid or expired state token');
      return redirectToFrontend(res, '', 'error', 'Invalid state token');
    }
    const frontendRedirect = stateData.frontendRedirect || '';
    pendingStates.delete(state);

    // Exchange code for tokens
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const redirectUri = getRedirectUri();
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('[Xero Auth] Exchanging code for tokens...');

    const tokenRes = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error('[Xero Auth] Token exchange failed:', tokenRes.status, errorBody);
      return redirectToFrontend(res, frontendRedirect, 'error', 'Xero token exchange failed');
    }

    const tokens = await tokenRes.json();
    console.log('[Xero Auth] Tokens received, expires_in:', tokens.expires_in);

    // Fetch Xero tenant connections to get tenantId and org name
    const connectionsRes = await fetch(XERO_CONNECTIONS_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let tenantId = '';
    let tenantName = 'Xero Organisation';

    if (connectionsRes.ok) {
      const connections = await connectionsRes.json();
      if (connections.length > 0) {
        tenantId = connections[0].tenantId;
        tenantName = connections[0].tenantName || tenantName;
        console.log('[Xero Auth] Tenant:', tenantId, tenantName);
      }
    } else {
      console.warn('[Xero Auth] Could not fetch tenant connections');
    }

    // Save to Supabase
    try {
      const supabase = getAdminClient();

      const { data: existing } = await supabase
        .from('xero_connections')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('xero_connections')
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            tenant_name: tenantName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        console.log('[Xero Auth] Updated existing connection for tenant:', tenantId);
      } else {
        await supabase.from('xero_connections').insert({
          user_id: 'user-1',
          tenant_id: tenantId,
          tenant_name: tenantName,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
          connected_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('[Xero Auth] Created new connection for tenant:', tenantId);
      }

      // Audit log (best-effort)
      try {
        await supabase.from('audit_logs').insert({
          user_id: 'user-1',
          action: 'xero_connected',
          details: `Connected Xero organisation: ${tenantName} (${tenantId})`,
          created_at: new Date().toISOString(),
        });
      } catch (_) { /* ignore */ }
    } catch (dbError) {
      console.warn('[Xero Auth] Supabase save failed (non-fatal):', dbError.message);
    }

    redirectToFrontend(res, frontendRedirect, 'xero_success');
  } catch (error) {
    console.error('[Xero Auth] Callback error:', error);
    let errorRedirect = '';
    if (req.query.state) {
      const sd = pendingStates.get(req.query.state);
      if (sd?.frontendRedirect) errorRedirect = sd.frontendRedirect;
      pendingStates.delete(req.query.state);
    }
    redirectToFrontend(res, errorRedirect, 'error', 'Internal server error');
  }
});

// POST /auth/xero/refresh - Refresh Xero access token
router.post('/xero/refresh', async (req, res) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const supabase = getAdminClient();
    const { data: connection, error: dbError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (dbError || !connection) {
      return res.status(404).json({ error: 'Xero connection not found' });
    }

    const tokens = await refreshXeroToken(connection.refresh_token);

    await supabase
      .from('xero_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    res.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    });
  } catch (error) {
    console.error('[Xero Auth] Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh Xero token' });
  }
});

// --- Helper functions ---

async function refreshXeroToken(refreshToken) {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    throw new Error(`Xero token refresh failed: ${tokenRes.status} ${errorBody}`);
  }

  return tokenRes.json();
}

function redirectToFrontend(res, frontendUrl, status, errorMsg) {
  const url = frontendUrl || process.env.FRONTEND_URL || '';
  const params = new URLSearchParams({ status });
  if (errorMsg) params.set('error', errorMsg);
  const redirectTarget = `${url}/?${params.toString()}`;
  console.log('[Xero Auth] Redirecting to frontend:', redirectTarget);
  res.redirect(redirectTarget);
}

module.exports = router;
module.exports.refreshXeroToken = refreshXeroToken;
