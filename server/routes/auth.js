const express = require('express');
const router = express.Router();

// GET /auth/quickbooks - QuickBooks OAuth initializalas
// A frontend innen kapja meg az OAuth URL-t ahova atiranyitja a felhasznalot
router.get('/quickbooks', (req, res) => {
  try {
    const { redirectUri } = req.query;

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const qbRedirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

    if (!clientId) {
      return res.status(500).json({ error: 'QuickBooks client ID not configured' });
    }

    if (!redirectUri) {
      return res.status(400).json({ error: 'Missing redirectUri parameter' });
    }

    // State parameter a CSRF vedelem miatt (frontend redirect URI-t taroljuk benne)
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const scope = 'com.intuit.quickbooks.accounting';
    const authBaseUrl = 'https://appcenter.intuit.com/connect/oauth2';

    const authUrl = new URL(authBaseUrl);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('redirect_uri', qbRedirectUri || `${req.protocol}://${req.get('host')}/auth/quickbooks/callback`);
    authUrl.searchParams.set('state', state);

    console.log('[Auth] QuickBooks OAuth URL generated for redirect:', redirectUri);

    res.json({ url: authUrl.toString() });
  } catch (error) {
    console.error('[Auth] QuickBooks OAuth init error:', error);
    res.status(500).json({ error: 'Failed to initialize QuickBooks OAuth' });
  }
});

// GET /auth/quickbooks/callback - QuickBooks OAuth callback
// Az Intuit ide iranyitja vissza a felhasznalot az OAuth utan
router.get('/quickbooks/callback', async (req, res) => {
  try {
    const { code, state, realmId } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // State dekodolasa - benne van a frontend redirectUri
    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const qbRedirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

    // Authorization code -> access token csere
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: qbRedirectUri || `${req.protocol}://${req.get('host')}/auth/quickbooks/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Auth] Token exchange failed:', errorText);
      return res.redirect(`${parsedState.redirectUri}?status=error&message=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    console.log('[Auth] QuickBooks OAuth successful for realm:', realmId);

    // TODO: Token-eket adatbazisba menteni (Supabase)
    // Egyenlore a frontend-re iranyitunk status=success-el

    const frontendRedirect = new URL(parsedState.redirectUri);
    frontendRedirect.searchParams.set('status', 'success');
    if (realmId) {
      frontendRedirect.searchParams.set('realmId', realmId);
    }

    res.redirect(frontendRedirect.toString());
  } catch (error) {
    console.error('[Auth] QuickBooks callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = router;
