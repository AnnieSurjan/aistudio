const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { refreshAccessToken } = require('./auth');

const API_BASE_URL = process.env.QB_API_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com';

// Helper: Transform QB Purchase to our Transaction format
function transformPurchase(p) {
  return {
    id: p.Id,
    date: p.TxnDate,
    amount: parseFloat(p.TotalAmt) || 0,
    currency: p.CurrencyRef?.value || 'USD',
    type: 'Purchase',
    entityName: p.EntityRef?.name || 'Unknown Vendor',
    account: p.AccountRef?.name || '',
    memo: p.PrivateNote || '',
    status: 'pending',
  };
}

// Helper: Transform QB Invoice to our Transaction format
function transformInvoice(inv) {
  return {
    id: inv.Id,
    date: inv.TxnDate,
    amount: parseFloat(inv.TotalAmt) || 0,
    currency: inv.CurrencyRef?.value || 'USD',
    type: 'Invoice',
    entityName: inv.CustomerRef?.name || 'Unknown Customer',
    account: inv.DepositToAccountRef?.name || 'Accounts Receivable',
    memo: inv.PrivateNote || '',
    status: 'pending',
  };
}

// Helper: Transform QB Bill to our Transaction format
function transformBill(bill) {
  return {
    id: bill.Id,
    date: bill.TxnDate,
    amount: parseFloat(bill.TotalAmt) || 0,
    currency: bill.CurrencyRef?.value || 'USD',
    type: 'Bill',
    entityName: bill.VendorRef?.name || 'Unknown Vendor',
    account: bill.APAccountRef?.name || 'Accounts Payable',
    memo: bill.PrivateNote || '',
    status: 'pending',
  };
}

// Helper: Ensure we have a valid access token (refresh if expired)
async function getValidAccessToken(connection) {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('[QB] Token expired or expiring soon, refreshing...');
    const tokens = await refreshAccessToken(connection.refresh_token);

    // Update tokens in DB
    const supabase = getAdminClient();
    await supabase
      .from('quickbooks_connections')
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

// Helper: Fetch all transactions from QB API
async function fetchQBTransactions(accessToken, realmId) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  const [purchaseRes, invoiceRes, billRes] = await Promise.all([
    fetch(
      `${API_BASE_URL}/v3/company/${realmId}/query?query=${encodeURIComponent('select * from Purchase startPosition 1 maxResults 500')}`,
      { headers }
    ),
    fetch(
      `${API_BASE_URL}/v3/company/${realmId}/query?query=${encodeURIComponent('select * from Invoice startPosition 1 maxResults 500')}`,
      { headers }
    ),
    fetch(
      `${API_BASE_URL}/v3/company/${realmId}/query?query=${encodeURIComponent('select * from Bill startPosition 1 maxResults 500')}`,
      { headers }
    ),
  ]);

  // Check for auth errors (401 means token is invalid even after refresh)
  if (purchaseRes.status === 401 || invoiceRes.status === 401 || billRes.status === 401) {
    throw new Error('QB_AUTH_EXPIRED');
  }

  const [purchaseData, invoiceData, billData] = await Promise.all([
    purchaseRes.ok ? purchaseRes.json() : { QueryResponse: {} },
    invoiceRes.ok ? invoiceRes.json() : { QueryResponse: {} },
    billRes.ok ? billRes.json() : { QueryResponse: {} },
  ]);

  const purchases = (purchaseData.QueryResponse?.Purchase || []).map(transformPurchase);
  const invoices = (invoiceData.QueryResponse?.Invoice || []).map(transformInvoice);
  const bills = (billData.QueryResponse?.Bill || []).map(transformBill);

  return [...purchases, ...invoices, ...bills];
}

// GET /api/quickbooks/scan - Fetch and transform QB transactions for scanning
// This is the main endpoint the frontend uses for real QB data
router.get('/scan', async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('[QB Scan] Starting scan for user:', userId);

    // 1. Get the active QB connection from Supabase
    const supabase = getAdminClient();
    const { data: connection, error: dbError } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (dbError || !connection) {
      console.log('[QB Scan] No active QB connection found for user:', userId);
      return res.status(404).json({
        error: 'No active QuickBooks connection found. Please connect QuickBooks first.',
        code: 'NO_CONNECTION',
      });
    }

    console.log('[QB Scan] Found connection for realm:', connection.realm_id, 'company:', connection.company_name);

    // 2. Ensure we have a valid access token
    let accessToken;
    try {
      accessToken = await getValidAccessToken(connection);
    } catch (refreshError) {
      console.error('[QB Scan] Token refresh failed:', refreshError.message);
      return res.status(401).json({
        error: 'QuickBooks token expired. Please reconnect QuickBooks.',
        code: 'TOKEN_EXPIRED',
      });
    }

    // 3. Fetch and transform transactions
    const transactions = await fetchQBTransactions(accessToken, connection.realm_id);

    console.log('[QB Scan] Fetched', transactions.length, 'total transactions from QB');

    res.json({
      success: true,
      transactions,
      meta: {
        companyName: connection.company_name,
        realmId: connection.realm_id,
        fetchedAt: new Date().toISOString(),
        totalCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('[QB Scan] Error:', error);

    if (error.message === 'QB_AUTH_EXPIRED') {
      return res.status(401).json({
        error: 'QuickBooks authentication expired. Please reconnect.',
        code: 'TOKEN_EXPIRED',
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch QuickBooks transactions',
    });
  }
});

// POST /api/quickbooks/transactions - QuickBooks tranzakciok lekerese (legacy, direct token)
router.post('/transactions', async (req, res) => {
  try {
    const { access_token, company_id } = req.body;

    if (!access_token || !company_id) {
      return res.status(400).json({ error: 'Missing access token or company ID' });
    }

    console.log('[API] Fetching QB data for company:', company_id);

    const [transactionsRes, invoicesRes, billsRes] = await Promise.all([
      fetch(
        `${API_BASE_URL}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Purchase startPosition 1 maxResults 100')}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
        }
      ),
      fetch(
        `${API_BASE_URL}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Invoice startPosition 1 maxResults 100')}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
        }
      ),
      fetch(
        `${API_BASE_URL}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Bill startPosition 1 maxResults 100')}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
        }
      ),
    ]);

    console.log('[API] Response statuses:', {
      transactions: transactionsRes.status,
      invoices: invoicesRes.status,
      bills: billsRes.status,
    });

    if (!transactionsRes.ok) {
      const errorText = await transactionsRes.text();
      console.error('[API] Transactions error:', errorText);
      throw new Error(`Transactions API error: ${transactionsRes.status} - ${errorText}`);
    }

    const [transactions, invoices, bills] = await Promise.all([
      transactionsRes.json(),
      invoicesRes.json(),
      billsRes.json(),
    ]);

    console.log('[API] Data fetched:', {
      transactions: transactions.QueryResponse?.Purchase?.length || 0,
      invoices: transactions.QueryResponse?.Invoice?.length || 0,
      bills: transactions.QueryResponse?.Bill?.length || 0,
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.QueryResponse?.Purchase || [],
        invoices: invoices.QueryResponse?.Invoice || [],
        bills: bills.QueryResponse?.Bill || [],
      },
    });
  } catch (error) {
    console.error('[API] QB transactions error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch QuickBooks data',
    });
  }
});

module.exports = router;
