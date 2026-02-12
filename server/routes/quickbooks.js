const express = require('express');
const router = express.Router();

// POST /api/quickbooks/transactions - QuickBooks tranzakciok lekerese
router.post('/transactions', async (req, res) => {
  try {
    const { access_token, company_id } = req.body;

    if (!access_token || !company_id) {
      return res.status(400).json({ error: 'Missing access token or company ID' });
    }

    console.log('[API] Fetching QB data for company:', company_id);

    const apiBaseUrl = 'https://sandbox-quickbooks.api.intuit.com';

    const [transactionsRes, invoicesRes, billsRes] = await Promise.all([
      fetch(
        `${apiBaseUrl}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Purchase startPosition 1 maxResults 100')}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
        }
      ),
      fetch(
        `${apiBaseUrl}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Invoice startPosition 1 maxResults 100')}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
        }
      ),
      fetch(
        `${apiBaseUrl}/v3/company/${company_id}/query?query=${encodeURIComponent('select * from Bill startPosition 1 maxResults 100')}`,
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
