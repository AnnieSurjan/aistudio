const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// POST /api/webhooks/quickbooks - Receive QuickBooks webhook notifications
router.post('/quickbooks', async (req, res) => {
  try {
    // QB sends a challenge on webhook registration
    if (req.body?.eventNotifications === undefined && req.query?.challengeToken) {
      return res.send(req.query.challengeToken);
    }

    // Verify webhook signature from Intuit
    const signature = req.headers['intuit-signature'];
    const webhookVerifierToken = process.env.QB_WEBHOOK_VERIFIER_TOKEN;

    if (webhookVerifierToken && signature) {
      const hash = crypto.createHmac('sha256', webhookVerifierToken)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (hash !== signature) {
        console.warn('[Webhook/QB] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const notifications = req.body?.eventNotifications || [];
    console.log(`[Webhook/QB] Received ${notifications.length} event notifications`);

    const supabase = getAdminClient();

    for (const notification of notifications) {
      const realmId = notification.realmId;
      const events = notification.dataChangeEvent?.entities || [];

      // Find user by realm_id
      const { data: connection } = await supabase
        .from('quickbooks_connections')
        .select('user_id, company_name')
        .eq('realm_id', realmId)
        .eq('is_active', true)
        .maybeSingle();

      if (!connection) {
        console.warn(`[Webhook/QB] No connection found for realm ${realmId}`);
        continue;
      }

      const userId = connection.user_id;
      const changedEntities = events.filter(e =>
        ['Invoice', 'Bill', 'Purchase', 'Payment'].includes(e.name)
      );

      if (changedEntities.length > 0) {
        // Create a notification for the user about new/changed transactions
        const entityNames = [...new Set(changedEntities.map(e => e.name))];
        const operations = [...new Set(changedEntities.map(e => e.operation))];

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'info',
          title: 'QuickBooks Data Changed',
          message: `${changedEntities.length} ${entityNames.join('/')} ${operations.join('/')} detected in ${connection.company_name}. Consider running a scan to check for duplicates.`,
          is_read: false,
          created_at: new Date().toISOString(),
        });

        // Store webhook event for processing
        await supabase.from('webhook_events').insert({
          user_id: userId,
          source: 'quickbooks',
          realm_id: realmId,
          event_type: 'data_change',
          payload: { entities: changedEntities },
          status: 'pending',
          created_at: new Date().toISOString(),
        });

        console.log(`[Webhook/QB] Notified user ${userId} about ${changedEntities.length} changes in ${connection.company_name}`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Webhook/QB] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/webhooks/xero - Receive Xero webhook notifications
router.post('/xero', async (req, res) => {
  try {
    // Xero sends intent-to-receive validation
    const xeroSignature = req.headers['x-xero-signature'];
    const webhookKey = process.env.XERO_WEBHOOK_KEY;

    if (webhookKey && xeroSignature) {
      const hash = crypto.createHmac('sha256', webhookKey)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (hash !== xeroSignature) {
        // Xero expects 401 for intent-to-receive validation failure
        return res.status(401).send('');
      }
    }

    // Intent-to-receive validation: Xero sends empty events array
    if (req.body?.events?.length === 0) {
      return res.status(200).send('');
    }

    const events = req.body?.events || [];
    console.log(`[Webhook/Xero] Received ${events.length} events`);

    const supabase = getAdminClient();

    for (const event of events) {
      const tenantId = event.tenantId;
      const eventType = event.eventType; // CREATE, UPDATE, DELETE
      const eventCategory = event.eventCategory; // INVOICE, CONTACT, etc.

      // Find user by tenant_id
      const { data: connection } = await supabase
        .from('xero_connections')
        .select('user_id, tenant_name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();

      if (!connection) continue;

      const userId = connection.user_id;

      // Only care about financial transaction events
      const financialCategories = ['INVOICE', 'BANK_TRANSACTION', 'PAYMENT', 'BILL'];
      if (financialCategories.includes(eventCategory)) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'info',
          title: 'Xero Data Changed',
          message: `${eventCategory} ${eventType.toLowerCase()} detected in ${connection.tenant_name}. Consider running a scan.`,
          is_read: false,
          created_at: new Date().toISOString(),
        });

        await supabase.from('webhook_events').insert({
          user_id: userId,
          source: 'xero',
          tenant_id: tenantId,
          event_type: `${eventCategory}_${eventType}`,
          payload: event,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

        console.log(`[Webhook/Xero] Notified user ${userId} about ${eventCategory} ${eventType} in ${connection.tenant_name}`);
      }
    }

    res.status(200).send('');
  } catch (error) {
    console.error('[Webhook/Xero] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/webhooks/events - Get recent webhook events for user
router.get('/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ events: data || [] });
  } catch (error) {
    console.error('[Webhooks] Events error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
});

// POST /api/webhooks/settings - Save webhook notification preferences
router.post('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { autoScanOnChange, notifyOnNewTransactions } = req.body;

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('webhook_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const settings = {
      user_id: userId,
      auto_scan_on_change: autoScanOnChange ?? true,
      notify_on_new_transactions: notifyOnNewTransactions ?? true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('webhook_settings').update(settings).eq('id', existing.id);
    } else {
      settings.created_at = new Date().toISOString();
      await supabase.from('webhook_settings').insert(settings);
    }

    res.json({ message: 'Webhook settings saved', settings });
  } catch (error) {
    console.error('[Webhooks] Settings error:', error);
    res.status(500).json({ error: 'Failed to save webhook settings' });
  }
});

// GET /api/webhooks/settings - Get webhook notification preferences
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    res.json({
      settings: data ? {
        autoScanOnChange: data.auto_scan_on_change,
        notifyOnNewTransactions: data.notify_on_new_transactions,
      } : { autoScanOnChange: true, notifyOnNewTransactions: true },
    });
  } catch (error) {
    console.error('[Webhooks] Get settings error:', error);
    res.status(500).json({ error: 'Failed to get webhook settings' });
  }
});

module.exports = router;
