const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// GET /api/companies - Cegek lekerese
router.get('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const userId = req.query.userId || 'user-1';

    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .order('is_active', { ascending: false })
      .order('connected_at', { ascending: false });

    if (error) throw error;

    res.json({ companies: data || [] });
  } catch (error) {
    console.error('[API] Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// POST /api/companies - Uj ceg kapcsolat letrehozasa
router.post('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const {
      userId = 'user-1',
      companyId,
      companyName,
      realmId,
      accessToken,
      refreshToken,
    } = req.body;

    const { data, error } = await supabase
      .from('quickbooks_connections')
      .insert({
        user_id: userId,
        company_id: companyId,
        company_name: companyName,
        realm_id: realmId,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_active: false,
        connected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Ertesites letrehozasa
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'info',
      title: 'Company Connected',
      message: `${companyName} has been connected to Dup-Detect`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    res.json({ company: data });
  } catch (error) {
    console.error('[API] Error creating company connection:', error);
    res.status(500).json({ error: 'Failed to create company connection' });
  }
});

// POST /api/companies/set-active - Aktiv ceg beallitasa
router.post('/set-active', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const { userId = 'user-1', companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Osszes ceg deaktivalasa
    await supabase
      .from('quickbooks_connections')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Kivalasztott ceg aktivalasa
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ company: data });
  } catch (error) {
    console.error('[API] Error setting active company:', error);
    res.status(500).json({ error: 'Failed to set active company' });
  }
});

module.exports = router;
