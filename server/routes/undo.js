const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ============================================================
// In-memory undo store
// Szerver ujrainditaskor minden adat elveszik - ez szandekos.
// Az undo csak rovid tavu biztonsagi halo (utolso torles visszavonasa).
// ============================================================

// Map<userId, Array<UndoRecord>>
const undoHistoryStore = new Map();

// Map<userId, { lastActionType, lastActionId, canUndo, lastActionAt, data }>
const lastActionStore = new Map();

// Map<batchId, BatchRecord>
const batchStore = new Map();

function generateId() {
  return crypto.randomUUID();
}

function getUserHistory(userId) {
  if (!undoHistoryStore.has(userId)) {
    undoHistoryStore.set(userId, []);
  }
  return undoHistoryStore.get(userId);
}

// POST /api/undo/resolve - Duplikatum feloldas visszavonasa
router.post('/resolve', async (req, res) => {
  try {
    const { duplicate_id, reason, duplicate_data } = req.body;
    const userId = req.user.id;

    if (!duplicate_id) {
      return res.status(400).json({ error: 'Missing required field: duplicate_id' });
    }

    const undoRecord = {
      id: generateId(),
      user_id: userId,
      duplicate_id,
      action_type: 'duplicate_resolution_undo',
      reason: reason || null,
      undone_by: userId,
      data: duplicate_data || null,
      created_at: new Date().toISOString(),
    };

    const history = getUserHistory(userId);
    history.unshift(undoRecord);

    // Utolso muvelet frissitese
    lastActionStore.set(userId, {
      user_id: userId,
      last_action_type: 'duplicate_resolution_undo',
      last_action_id: duplicate_id,
      can_undo: false,
      last_action_at: new Date().toISOString(),
    });

    console.log(`[Undo] User ${userId} undid resolution for duplicate ${duplicate_id}`);
    res.json({ data: undoRecord });
  } catch (error) {
    console.error('[Undo] Resolve endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/undo/history - Undo tortenelem lekerese
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');

    const history = getUserHistory(userId);
    const paged = history.slice(offset, offset + limit);

    res.json({ data: paged, count: history.length, limit, offset });
  } catch (error) {
    console.error('[Undo] History endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/undo/batch - Tomeges undo
router.post('/batch', async (req, res) => {
  try {
    const userId = req.user.id;
    const { duplicate_ids, reason } = req.body;

    if (!duplicate_ids || duplicate_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required field: duplicate_ids' });
    }

    const batchId = generateId();
    const history = getUserHistory(userId);
    const undoResults = [];

    for (const duplicateId of duplicate_ids) {
      const undoRecord = {
        id: generateId(),
        user_id: userId,
        duplicate_id: duplicateId,
        action_type: 'duplicate_resolution_undo',
        reason: reason || null,
        undone_by: userId,
        batch_id: batchId,
        created_at: new Date().toISOString(),
      };

      history.unshift(undoRecord);
      undoResults.push({ duplicate_id: duplicateId, status: 'success', undo_record: undoRecord });
    }

    batchStore.set(batchId, {
      id: batchId,
      user_id: userId,
      total_items: duplicate_ids.length,
      processed_items: duplicate_ids.length,
      failed_items: 0,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    console.log(`[Undo] User ${userId} batch-undid ${duplicate_ids.length} duplicates`);

    res.json({
      data: {
        batch_id: batchId,
        total: duplicate_ids.length,
        success_count: duplicate_ids.length,
        failure_count: 0,
        results: undoResults,
      },
    });
  } catch (error) {
    console.error('[Undo] Batch endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/undo/last-action - Utolso muvelet lekerese
router.get('/last-action', async (req, res) => {
  try {
    const userId = req.user.id;
    const lastAction = lastActionStore.get(userId) || null;

    res.json({ data: lastAction });
  } catch (error) {
    console.error('[Undo] Last action endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
