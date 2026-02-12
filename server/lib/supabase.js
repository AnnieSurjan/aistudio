const { createClient } = require('@supabase/supabase-js');

// Admin client (service role key) - minden muvelethez hasznalhato
function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// User client - a felhasznalo JWT token-jevel autentikalt
function getUserClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

module.exports = { getAdminClient, getUserClient };
