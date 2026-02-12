const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// POST /api/audit/log - Audit log letrehozasa (auth szukseges)
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { action, resource_type, resource_id, description, changes, status, error_message } =
      req.body;

    if (!action || !resource_type || !description) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: action, resource_type, description' });
    }

    const ip_address =
      req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
    const user_agent = req.headers['user-agent'] || undefined;

    const { data, error } = await req.supabase
      .from('audit_logs')
      .insert({
        user_id: req.user.id,
        action,
        resource_type,
        resource_id,
        description,
        changes,
        ip_address,
        user_agent,
        status: status || 'completed',
        error_message,
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Log creation error:', error);
      return res.status(500).json({ error: 'Failed to create audit log' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('[Audit] Log endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit/activity - Tevekenyseg tortenelem (auth szukseges)
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    const actionType = req.query.action_type;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    let query = req.supabase
      .from('activity_history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (actionType) query = query.eq('action_type', actionType);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Audit] Activity history fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch activity history' });
    }

    res.json({ data, total: count, limit, offset });
  } catch (error) {
    console.error('[Audit] Activity endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/audit/export - Export generalas (auth szukseges)
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { type, scope, startDate, endDate, scanId } = req.body;

    if (!type || !scope) {
      return res.status(400).json({ error: 'Missing required fields: type, scope' });
    }

    // Audit log adatok lekerese
    let query = req.supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (scope === 'date_range' && startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (scope === 'scan_id' && scanId) {
      query = query.eq('scan_id', scanId);
    }

    const { data: activities, error } = await query;

    if (error) throw error;

    const rows = activities || [];

    // CSV generalas
    const headers = ['Date', 'Action', 'Details', 'Status'];
    const csvRows = rows.map((row) =>
      [row.created_at, row.action, row.details || '', row.status || '']
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    );
    const content = [headers.join(','), ...csvRows].join('\n');

    let contentType = 'text/plain';
    let fileName = `activity-export-${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'csv':
        contentType = 'text/csv';
        fileName += '.csv';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName += '.xlsx';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        fileName += '.pdf';
        break;
    }

    // Export tortenelem logolasa
    await req.supabase.from('export_history').insert({
      user_id: req.user.id,
      export_type: type,
      scope,
      row_count: rows.length,
      created_at: new Date().toISOString(),
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    console.error('[Audit] Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// GET /api/audit/exports - Export tortenelem lekerese (auth szukseges)
router.get('/exports', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20');
    const offset = parseInt(req.query.offset || '0');
    const status = req.query.status;

    let query = req.supabase
      .from('export_history')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Audit] Export history fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch export history' });
    }

    res.json({ data, total: count, limit, offset });
  } catch (error) {
    console.error('[Audit] Export endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/audit/exports - Uj export rekord (auth szukseges)
router.post('/exports', requireAuth, async (req, res) => {
  try {
    const { export_type, scope, filter_params } = req.body;

    if (!export_type || !scope) {
      return res.status(400).json({ error: 'Missing required fields: export_type, scope' });
    }

    const { data, error } = await req.supabase
      .from('export_history')
      .insert({
        user_id: req.user.id,
        export_type,
        scope,
        filter_params,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Export creation error:', error);
      return res.status(500).json({ error: 'Failed to create export' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('[Audit] Export POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit/settings - Beallitasok audit tortenelem (auth szukseges)
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    const settingKey = req.query.setting_key;

    let query = req.supabase
      .from('settings_audit')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (settingKey) query = query.eq('setting_key', settingKey);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Audit] Settings audit fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch settings audit' });
    }

    res.json({ data, total: count, limit, offset });
  } catch (error) {
    console.error('[Audit] Settings endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/audit/settings - Beallitasok valtozas logolasa (auth szukseges)
router.post('/settings', requireAuth, async (req, res) => {
  try {
    const { setting_key, old_value, new_value, reason } = req.body;

    if (!setting_key || new_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields: setting_key, new_value' });
    }

    const { data, error } = await req.supabase
      .from('settings_audit')
      .insert({
        user_id: req.user.id,
        modified_by: req.user.id,
        setting_key,
        old_value,
        new_value,
        reason,
      })
      .select()
      .single();

    if (error) {
      console.error('[Audit] Settings audit creation error:', error);
      return res.status(500).json({ error: 'Failed to create settings audit' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('[Audit] Settings POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
