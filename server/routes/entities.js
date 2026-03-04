const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// GET /api/entities - List all entities for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('accounting_entities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ entities: data || [] });
  } catch (error) {
    console.error('[Entities] List error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

// POST /api/entities - Create a new entity
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, source, sourceId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    const supabase = getAdminClient();

    // Check entity limit based on plan
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const plan = subscription?.plan || 'Starter';
    const limits = { Starter: 1, Professional: 5, Enterprise: 999 };
    const maxEntities = limits[plan] || 1;

    const { count } = await supabase
      .from('accounting_entities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count >= maxEntities) {
      return res.status(403).json({
        error: `Entity limit reached (${maxEntities}). Upgrade your plan for more entities.`,
        currentCount: count,
        limit: maxEntities,
        plan,
      });
    }

    const { data, error } = await supabase
      .from('accounting_entities')
      .insert({
        user_id: userId,
        name,
        type: type || 'business',
        source: source || null,
        source_id: sourceId || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ entity: data });
  } catch (error) {
    console.error('[Entities] Create error:', error);
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

// PATCH /api/entities/:id - Update entity
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const entityId = req.params.id;
    const { name, isActive } = req.body;

    const supabase = getAdminClient();

    const update = { updated_at: new Date().toISOString() };
    if (name !== undefined) update.name = name;
    if (isActive !== undefined) update.is_active = isActive;

    const { data, error } = await supabase
      .from('accounting_entities')
      .update(update)
      .eq('id', entityId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ entity: data });
  } catch (error) {
    console.error('[Entities] Update error:', error);
    res.status(500).json({ error: 'Failed to update entity' });
  }
});

// DELETE /api/entities/:id - Delete entity
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const entityId = req.params.id;

    const supabase = getAdminClient();

    const { error } = await supabase
      .from('accounting_entities')
      .delete()
      .eq('id', entityId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[Entities] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete entity' });
  }
});

// POST /api/entities/:id/set-active - Set entity as the active one for scans
router.post('/:id/set-active', async (req, res) => {
  try {
    const userId = req.user.id;
    const entityId = req.params.id;
    const supabase = getAdminClient();

    // Deactivate all others
    await supabase
      .from('accounting_entities')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Activate selected
    const { data, error } = await supabase
      .from('accounting_entities')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', entityId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ entity: data, message: `${data.name} is now the active entity` });
  } catch (error) {
    console.error('[Entities] Set active error:', error);
    res.status(500).json({ error: 'Failed to set active entity' });
  }
});

module.exports = router;
