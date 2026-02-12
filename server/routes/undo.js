const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// POST /api/undo/resolve - Duplikatum feloldas visszavonasa (auth szukseges)
router.post('/resolve', requireAuth, async (req, res) => {
  try {
    const { duplicate_id, reason } = req.body;

    if (!duplicate_id) {
      return res.status(400).json({ error: 'Missing required field: duplicate_id' });
    }

    // Duplikatum tranzakcio lekerese
    const { data: duplicate, error: dupError } = await req.supabase
      .from('duplicate_transactions')
      .select('*')
      .eq('id', duplicate_id)
      .eq('user_id', req.user.id)
      .single();

    if (dupError || !duplicate) {
      return res.status(404).json({ error: 'Duplicate not found' });
    }

    if (duplicate.status !== 'resolved') {
      return res.status(400).json({ error: 'Can only undo resolved duplicates' });
    }

    // Undo tortenelem rekord
    const { data: undoRecord, error: undoError } = await req.supabase
      .from('undo_history')
      .insert({
        user_id: req.user.id,
        duplicate_id,
        original_transaction_id: duplicate.transaction_id_1,
        duplicate_transaction_id: duplicate.transaction_id_2,
        action_type: 'duplicate_resolution_undo',
        reason,
        undone_by: req.user.id,
      })
      .select()
      .single();

    if (undoError) {
      console.error('[Undo] Undo record creation error:', undoError);
      return res.status(500).json({ error: 'Failed to create undo record' });
    }

    // Duplikatum statusz visszaallitasa
    const { error: updateError } = await req.supabase
      .from('duplicate_transactions')
      .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
      .eq('id', duplicate_id);

    if (updateError) {
      console.error('[Undo] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to undo resolution' });
    }

    // Utolso muvelet frissitese
    await req.supabase
      .from('user_last_action')
      .upsert({
        user_id: req.user.id,
        last_action_type: 'duplicate_resolution_undo',
        last_action_id: duplicate_id,
        can_undo: false,
        last_action_at: new Date().toISOString(),
      })
      .eq('user_id', req.user.id);

    // Tevekenyseg logolasa
    await req.supabase.from('activity_history').insert({
      user_id: req.user.id,
      action_type: 'duplicate_resolution_undo',
      actor_id: req.user.id,
      actor_name: req.user.user_metadata?.name || req.user.email,
      target_id: duplicate_id,
      target_type: 'duplicate_transaction',
      summary: 'Undone duplicate resolution for transaction pair',
      details: {
        original_transaction: duplicate.transaction_id_1,
        duplicate_transaction: duplicate.transaction_id_2,
        reason,
      },
    });

    res.json({ data: undoRecord });
  } catch (error) {
    console.error('[Undo] Resolve endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/undo/history - Undo tortenelem lekerese (auth szukseges)
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');

    const { data, error, count } = await req.supabase
      .from('undo_history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Undo] History fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch undo history' });
    }

    res.json({ data, count, limit, offset });
  } catch (error) {
    console.error('[Undo] History endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/undo/batch - Tomeges undo (auth szukseges)
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const { duplicate_ids, reason } = req.body;

    if (!duplicate_ids || duplicate_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required field: duplicate_ids' });
    }

    // Batch queue rekord
    const { data: batchRecord, error: batchError } = await req.supabase
      .from('undo_batch_queue')
      .insert({
        user_id: req.user.id,
        duplicate_ids,
        total_items: duplicate_ids.length,
        status: 'processing',
        reason,
      })
      .select()
      .single();

    if (batchError) {
      console.error('[Undo] Batch creation error:', batchError);
      return res.status(500).json({ error: 'Failed to create batch undo' });
    }

    const undoResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const duplicateId of duplicate_ids) {
      try {
        const { data: duplicate } = await req.supabase
          .from('duplicate_transactions')
          .select('*')
          .eq('id', duplicateId)
          .eq('user_id', req.user.id)
          .single();

        if (!duplicate || duplicate.status !== 'resolved') {
          failureCount++;
          continue;
        }

        const { data: undoRecord } = await req.supabase
          .from('undo_history')
          .insert({
            user_id: req.user.id,
            duplicate_id: duplicateId,
            original_transaction_id: duplicate.transaction_id_1,
            duplicate_transaction_id: duplicate.transaction_id_2,
            action_type: 'duplicate_resolution_undo',
            reason,
            undone_by: req.user.id,
            batch_id: batchRecord.id,
          })
          .select()
          .single();

        await req.supabase
          .from('duplicate_transactions')
          .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
          .eq('id', duplicateId);

        undoResults.push({ duplicate_id: duplicateId, status: 'success', undo_record: undoRecord });
        successCount++;
      } catch (error) {
        console.error(`[Undo] Batch error for ${duplicateId}:`, error);
        failureCount++;
        undoResults.push({ duplicate_id: duplicateId, status: 'failed', error: 'Failed to undo' });
      }
    }

    await req.supabase
      .from('undo_batch_queue')
      .update({
        status: 'completed',
        processed_items: successCount,
        failed_items: failureCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchRecord.id);

    res.json({
      data: {
        batch_id: batchRecord.id,
        total: duplicate_ids.length,
        success_count: successCount,
        failure_count: failureCount,
        results: undoResults,
      },
    });
  } catch (error) {
    console.error('[Undo] Batch endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/undo/last-action - Utolso muvelet lekerese (auth szukseges)
router.get('/last-action', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('user_last_action')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Undo] Last action fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch last action' });
    }

    res.json({ data: data || null });
  } catch (error) {
    console.error('[Undo] Last action endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
