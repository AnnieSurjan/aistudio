const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// --- Intuit OAuth 2.0 config ---
const INTUIT_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const INTUIT_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_SCOPES = 'com.intuit.quickbooks.accounting';

function getClientId() {
  return process.env.QUICKBOOKS_CLIENT_ID;
}

function getClientSecret() {
  return process.env.QUICKBOOKS_CLIENT_SECRET;
}

function getRedirectUri() {
  // The callback URL registered in Intuit Developer portal
  return process.env.QUICKBOOKS_REDIRECT_URI;
}

// In-memory state store (for CSRF protection)
// In production with multiple instances, use Redis or DB
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

// GET /auth/quickbooks - Start OAuth flow
router.get('/quickbooks', (req, res) => {
  try {
    const clientId = getClientId();
    const redirectUri = getRedirectUri();

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        error: 'QuickBooks OAuth not configured. Set QUICKBOOKS_CLIENT_ID and QUICKBOOKS_REDIRECT_URI.',
      });
    }

    // Generate CSRF state token
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
      scope: QB_SCOPES,
      state,
    });

    const authUrl = `${INTUIT_AUTH_URL}?${params.toString()}`;
    console.log('[Auth] Redirecting to Intuit OAuth:', authUrl);

    // Return the URL for the frontend to redirect to
    res.json({ url: authUrl });
  } catch (error) {
    console.error('[Auth] Error starting OAuth flow:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

// GET /auth/quickbooks/callback - Handle OAuth callback from Intuit
router.get('/quickbooks/callback', async (req, res) => {
  try {
    const { code, realmId, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error('[Auth] OAuth error from Intuit:', oauthError);
      return redirectToFrontend(res, state, 'error', `OAuth denied: ${oauthError}`);
    }

    if (!code || !realmId) {
      return redirectToFrontend(res, state, 'error', 'Missing code or realmId');
    }

    // Validate CSRF state
    const stateData = pendingStates.get(state);
    if (!stateData) {
      console.error('[Auth] Invalid or expired state token');
      return redirectToFrontend(res, null, 'error', 'Invalid state token');
    }
    pendingStates.delete(state);

    // Exchange authorization code for tokens
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const redirectUri = getRedirectUri();

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('[Auth] Exchanging code for tokens, realmId:', realmId);

    const tokenRes = await fetch(INTUIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error('[Auth] Token exchange failed:', tokenRes.status, errorBody);
      return redirectToFrontend(res, state, 'error', 'Token exchange failed');
    }

    const tokens = await tokenRes.json();
    console.log('[Auth] Tokens received, expires_in:', tokens.expires_in);

    // Fetch company info from QuickBooks
    const companyName = await fetchCompanyName(tokens.access_token, realmId);

    // Save to Supabase
    const supabase = getAdminClient();

    // Check if this realmId already exists
    const { data: existing } = await supabase
      .from('quickbooks_connections')
      .select('id')
      .eq('realm_id', realmId)
      .maybeSingle();

    if (existing) {
      // Update existing connection
      await supabase
        .from('quickbooks_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          company_name: companyName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      console.log('[Auth] Updated existing connection for realm:', realmId);
    } else {
      // Create new connection
      await supabase.from('quickbooks_connections').insert({
        user_id: 'user-1',
        company_id: realmId,
        company_name: companyName,
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
        connected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log('[Auth] Created new connection for realm:', realmId);
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: 'user-1',
      action: 'quickbooks_connected',
      details: `Connected QuickBooks company: ${companyName} (${realmId})`,
      created_at: new Date().toISOString(),
    }).catch(() => {}); // Don't fail if audit table doesn't exist

    // Redirect to frontend with success
    redirectToFrontend(res, state, 'success');
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    redirectToFrontend(res, req.query.state, 'error', 'Internal server error');
  }
});

// POST /auth/quickbooks/refresh - Refresh access token
router.post('/quickbooks/refresh', async (req, res) => {
  try {
    const { realmId } = req.body;

    if (!realmId) {
      return res.status(400).json({ error: 'realmId is required' });
    }

    const supabase = getAdminClient();
    const { data: connection, error: dbError } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('realm_id', realmId)
      .single();

    if (dbError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const tokens = await refreshAccessToken(connection.refresh_token);

    // Update tokens in DB
    await supabase
      .from('quickbooks_connections')
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
    console.error('[Auth] Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// --- Helper functions ---

async function refreshAccessToken(refreshToken) {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch(INTUIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    throw new Error(`Token refresh failed: ${tokenRes.status} ${errorBody}`);
  }

  return tokenRes.json();
}

async function fetchCompanyName(accessToken, realmId) {
  try {
    const apiBase = process.env.QB_API_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com';
    const res = await fetch(
      `${apiBase}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.CompanyInfo?.CompanyName || `Company ${realmId}`;
    }
  } catch (e) {
    console.warn('[Auth] Could not fetch company name:', e.message);
  }
  return `Company ${realmId}`;
}

function redirectToFrontend(res, state, status, errorMsg) {
  // Determine frontend URL
  let frontendUrl = process.env.FRONTEND_URL || '';

  // Check if state has a stored frontend redirect
  if (state) {
    const stateData = pendingStates.get(state);
    if (stateData?.frontendRedirect) {
      frontendUrl = stateData.frontendRedirect;
    }
  }

  // Fallback: redirect to same origin (works when frontend is served by same server)
  if (!frontendUrl) {
    frontendUrl = '';
  }

  const params = new URLSearchParams({ status });
  if (errorMsg) params.set('error', errorMsg);

  res.redirect(`${frontendUrl}/?${params.toString()}`);
}

module.exports = router;
module.exports.refreshAccessToken = refreshAccessToken;
