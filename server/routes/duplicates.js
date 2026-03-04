const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { fetchQBTransactions, getValidQBAccessToken } = require('./quickbooks');
const { fetchXeroTransactions, getValidXeroAccessToken } = require('./xero');

const QB_API_BASE_URL = process.env.QB_API_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com';
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';

// POST /api/duplicates/void - Void/delete a transaction in QB or Xero
router.post('/void', async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId, transactionType, source } = req.body;

    if (!transactionId || !source) {
      return res.status(400).json({ error: 'transactionId and source (quickbooks/xero) are required' });
    }

    const supabase = getAdminClient();
    let result;

    if (source === 'quickbooks') {
      result = await voidQBTransaction(supabase, userId, transactionId, transactionType);
    } else if (source === 'xero') {
      result = await voidXeroTransaction(supabase, userId, transactionId, transactionType);
    } else {
      return res.status(400).json({ error: 'Invalid source. Must be "quickbooks" or "xero".' });
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'duplicate_voided',
        details: `Voided ${transactionType || 'transaction'} ${transactionId} in ${source}`,
        created_at: new Date().toISOString(),
      });
    } catch (_) { /* audit logging is best-effort */ }

    // Create notification
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'success',
        title: 'Duplicate Resolved',
        message: `Transaction ${transactionId} has been voided in ${source}.`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Duplicates] Void error:', error);
    res.status(500).json({ error: error.message || 'Failed to void transaction' });
  }
});

// POST /api/duplicates/mark - Mark a transaction as duplicate (flag without deleting)
router.post('/mark', async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId, transactionType, source, note } = req.body;

    if (!transactionId || !source) {
      return res.status(400).json({ error: 'transactionId and source are required' });
    }

    const supabase = getAdminClient();

    // Store the duplicate marking in our database
    await supabase.from('marked_duplicates').insert({
      user_id: userId,
      transaction_id: transactionId,
      transaction_type: transactionType || 'Unknown',
      source,
      note: note || '',
      status: 'marked',
      created_at: new Date().toISOString(),
    });

    // If QB, add a private note to the transaction
    if (source === 'quickbooks') {
      try {
        await addQBMemo(supabase, userId, transactionId, transactionType, '[DUP-DETECT] Marked as duplicate');
      } catch (err) {
        console.warn('[Duplicates] Could not add QB memo:', err.message);
      }
    }

    // If Xero, add a reference note
    if (source === 'xero') {
      try {
        await addXeroNote(supabase, userId, transactionId, transactionType, '[DUP-DETECT] Marked as duplicate');
      } catch (err) {
        console.warn('[Duplicates] Could not add Xero note:', err.message);
      }
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'duplicate_marked',
        details: `Marked ${transactionType || 'transaction'} ${transactionId} as duplicate in ${source}`,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    res.json({ success: true, message: `Transaction ${transactionId} marked as duplicate` });
  } catch (error) {
    console.error('[Duplicates] Mark error:', error);
    res.status(500).json({ error: 'Failed to mark transaction as duplicate' });
  }
});

// POST /api/duplicates/bulk-void - Void multiple transactions at once
router.post('/bulk-void', async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions array is required' });
    }

    if (transactions.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 transactions per bulk operation' });
    }

    const supabase = getAdminClient();
    const results = [];

    for (const txn of transactions) {
      try {
        let result;
        if (txn.source === 'quickbooks') {
          result = await voidQBTransaction(supabase, userId, txn.transactionId, txn.transactionType);
        } else if (txn.source === 'xero') {
          result = await voidXeroTransaction(supabase, userId, txn.transactionId, txn.transactionType);
        }
        results.push({ transactionId: txn.transactionId, success: true, ...result });
      } catch (err) {
        results.push({ transactionId: txn.transactionId, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'bulk_void',
        details: `Bulk voided ${successCount}/${transactions.length} transactions`,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    res.json({ success: true, results, summary: { total: transactions.length, succeeded: successCount, failed: transactions.length - successCount } });
  } catch (error) {
    console.error('[Duplicates] Bulk void error:', error);
    res.status(500).json({ error: 'Bulk void operation failed' });
  }
});

// GET /api/duplicates/marked - Get all marked duplicates for user
router.get('/marked', async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('marked_duplicates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ duplicates: data || [] });
  } catch (error) {
    console.error('[Duplicates] Get marked error:', error);
    res.status(500).json({ error: 'Failed to fetch marked duplicates' });
  }
});

// --- QB Helpers ---

async function voidQBTransaction(supabase, userId, transactionId, transactionType) {
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('No active QuickBooks connection');

  const accessToken = await getValidQBAccessToken(connection);
  const realmId = connection.realm_id;

  // Map transaction type to QB entity name
  const entityMap = {
    Invoice: 'Invoice',
    Bill: 'Bill',
    Purchase: 'Purchase',
    Payment: 'Payment',
    JournalEntry: 'JournalEntry',
  };
  const entity = entityMap[transactionType] || 'Purchase';

  // First, read the current transaction to get SyncToken
  const readRes = await fetch(
    `${QB_API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!readRes.ok) {
    const errBody = await readRes.text();
    throw new Error(`Failed to read QB transaction: ${readRes.status} ${errBody}`);
  }

  const txnData = await readRes.json();
  const syncToken = txnData[entity]?.SyncToken;

  if (!syncToken) throw new Error('Could not get SyncToken for transaction');

  // Void the transaction (QB supports ?operation=void for invoices, bills)
  const voidRes = await fetch(
    `${QB_API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}?operation=void`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Id: transactionId,
        SyncToken: syncToken,
      }),
    }
  );

  if (!voidRes.ok) {
    // Fallback: try delete instead of void
    const deleteRes = await fetch(
      `${QB_API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}?operation=delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          Id: transactionId,
          SyncToken: syncToken,
        }),
      }
    );

    if (!deleteRes.ok) {
      const errBody = await deleteRes.text();
      throw new Error(`Failed to void/delete QB transaction: ${errBody}`);
    }

    return { action: 'deleted', source: 'quickbooks' };
  }

  return { action: 'voided', source: 'quickbooks' };
}

async function addQBMemo(supabase, userId, transactionId, transactionType, memo) {
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!connection) return;

  const accessToken = await getValidQBAccessToken(connection);
  const realmId = connection.realm_id;

  const entityMap = { Invoice: 'invoice', Bill: 'bill', Purchase: 'purchase', Payment: 'payment' };
  const entity = entityMap[transactionType] || 'purchase';

  const readRes = await fetch(
    `${QB_API_BASE_URL}/v3/company/${realmId}/${entity}/${transactionId}`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
  );

  if (!readRes.ok) return;

  const txnData = await readRes.json();
  const entityKey = Object.keys(txnData).find(k => k !== 'time');
  if (!entityKey) return;

  const txn = txnData[entityKey];
  const existingMemo = txn.PrivateNote || txn.Reference || '';

  // Update with memo
  await fetch(
    `${QB_API_BASE_URL}/v3/company/${realmId}/${entity}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Id: transactionId,
        SyncToken: txn.SyncToken,
        sparse: true,
        PrivateNote: existingMemo ? `${existingMemo}\n${memo}` : memo,
      }),
    }
  );
}

// --- Xero Helpers ---

async function voidXeroTransaction(supabase, userId, transactionId, transactionType) {
  const { data: connection } = await supabase
    .from('xero_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('No active Xero connection');

  const accessToken = await getValidXeroAccessToken(connection);
  const tenantId = connection.tenant_id;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'xero-tenant-id': tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // For invoices/bills: set status to VOIDED
  if (['Invoice', 'Bill'].includes(transactionType)) {
    const voidRes = await fetch(`${XERO_API_BASE}/Invoices/${transactionId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ InvoiceID: transactionId, Status: 'VOIDED' }),
    });

    if (!voidRes.ok) {
      const errBody = await voidRes.text();
      throw new Error(`Failed to void Xero invoice: ${errBody}`);
    }

    return { action: 'voided', source: 'xero' };
  }

  // For bank transactions: delete
  const deleteRes = await fetch(`${XERO_API_BASE}/BankTransactions/${transactionId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ BankTransactionID: transactionId, Status: 'DELETED' }),
  });

  if (!deleteRes.ok) {
    const errBody = await deleteRes.text();
    throw new Error(`Failed to delete Xero bank transaction: ${errBody}`);
  }

  return { action: 'deleted', source: 'xero' };
}

async function addXeroNote(supabase, userId, transactionId, transactionType, note) {
  const { data: connection } = await supabase
    .from('xero_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!connection) return;

  const accessToken = await getValidXeroAccessToken(connection);
  const tenantId = connection.tenant_id;

  // Add history note to the transaction
  await fetch(`${XERO_API_BASE}/Invoices/${transactionId}/History`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'xero-tenant-id': tenantId,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      HistoryRecords: [{ Details: note }],
    }),
  });
}

module.exports = router;
