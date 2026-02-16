const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { refreshXeroToken } = require('./xero-auth');

const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';

// Helper: Transform Xero Invoice (ACCREC = sales invoice, ACCPAY = bill) to our Transaction format
function transformInvoice(inv) {
  const isBill = inv.Type === 'ACCPAY';
  return {
    id: inv.InvoiceID,
    date: inv.DateString || inv.Date || '',
    amount: parseFloat(inv.Total) || 0,
    currency: inv.CurrencyCode || 'USD',
    type: isBill ? 'Bill' : 'Invoice',
    entityName: inv.Contact?.Name || 'Unknown',
    account: isBill ? 'Accounts Payable' : 'Accounts Receivable',
    memo: inv.Reference || '',
    status: 'pending',
  };
}

// Helper: Transform Xero BankTransaction to our Transaction format
function transformBankTransaction(bt) {
  const isSpend = bt.Type === 'SPEND';
  return {
    id: bt.BankTransactionID,
    date: bt.DateString || bt.Date || '',
    amount: parseFloat(bt.Total) || 0,
    currency: bt.CurrencyCode || 'USD',
    type: isSpend ? 'Purchase' : 'Payment',
    entityName: bt.Contact?.Name || 'Unknown',
    account: bt.BankAccount?.Name || '',
    memo: bt.Reference || '',
    status: 'pending',
  };
}

// Helper: Ensure we have a valid Xero access token
async function getValidAccessToken(connection) {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('[Xero] Token expired or expiring soon, refreshing...');
    const tokens = await refreshXeroToken(connection.refresh_token);

    const supabase = getAdminClient();
    await supabase
      .from('xero_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return tokens.access_token;
  }

  return connection.access_token;
}

// Helper: Fetch all transactions from Xero API
async function fetchXeroTransactions(accessToken, tenantId) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'xero-tenant-id': tenantId,
    Accept: 'application/json',
  };

  const [invoicesRes, bankTxnRes] = await Promise.all([
    fetch(`${XERO_API_BASE}/Invoices?page=1`, { headers }),
    fetch(`${XERO_API_BASE}/BankTransactions?page=1`, { headers }),
  ]);

  if (invoicesRes.status === 401 || bankTxnRes.status === 401) {
    throw new Error('XERO_AUTH_EXPIRED');
  }

  const [invoicesData, bankTxnData] = await Promise.all([
    invoicesRes.ok ? invoicesRes.json() : { Invoices: [] },
    bankTxnRes.ok ? bankTxnRes.json() : { BankTransactions: [] },
  ]);

  const invoices = (invoicesData.Invoices || []).map(transformInvoice);
  const bankTransactions = (bankTxnData.BankTransactions || []).map(transformBankTransaction);

  return [...invoices, ...bankTransactions];
}

// GET /api/xero/scan - Fetch and transform Xero transactions for scanning
router.get('/scan', async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[Xero Scan] Starting scan for user:', userId);

    const supabase = getAdminClient();
    const { data: connection, error: dbError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (dbError || !connection) {
      console.log('[Xero Scan] No active Xero connection found for user:', userId);
      return res.status(404).json({
        error: 'No active Xero connection found. Please connect Xero first.',
        code: 'NO_CONNECTION',
      });
    }

    console.log('[Xero Scan] Found connection for tenant:', connection.tenant_id, 'org:', connection.tenant_name);

    let accessToken;
    try {
      accessToken = await getValidAccessToken(connection);
    } catch (refreshError) {
      console.error('[Xero Scan] Token refresh failed:', refreshError.message);
      return res.status(401).json({
        error: 'Xero token expired. Please reconnect Xero.',
        code: 'TOKEN_EXPIRED',
      });
    }

    const transactions = await fetchXeroTransactions(accessToken, connection.tenant_id);

    console.log('[Xero Scan] Fetched', transactions.length, 'total transactions from Xero');

    res.json({
      success: true,
      transactions,
      meta: {
        companyName: connection.tenant_name,
        tenantId: connection.tenant_id,
        fetchedAt: new Date().toISOString(),
        totalCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('[Xero Scan] Error:', error);

    if (error.message === 'XERO_AUTH_EXPIRED') {
      return res.status(401).json({
        error: 'Xero authentication expired. Please reconnect.',
        code: 'TOKEN_EXPIRED',
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Xero transactions',
    });
  }
});

module.exports = router;
