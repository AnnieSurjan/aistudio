const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');
const { fetchQBTransactions, getValidQBAccessToken } = require('./quickbooks');
const { fetchXeroTransactions, getValidXeroAccessToken } = require('./xero');

// --- Duplicate Detection (server-side, mirrors frontend logic) ---
function detectDuplicates(transactions) {
  const groups = [];
  const processedIds = new Set();

  for (let i = 0; i < transactions.length; i++) {
    const t1 = transactions[i];
    if (processedIds.has(t1.id)) continue;

    const potentialGroup = [t1];
    let reason = '';
    let confidence = 0;

    for (let j = i + 1; j < transactions.length; j++) {
      const t2 = transactions[j];
      if (processedIds.has(t2.id)) continue;

      if (t1.currency !== t2.currency) continue;

      const sameDate = t1.date === t2.date;
      const sameAmount = Math.abs(t1.amount - t2.amount) < 0.01;
      const sameEntity = t1.entityName.toLowerCase() === t2.entityName.toLowerCase();
      const sameMemo = t1.memo && t2.memo && t1.memo === t2.memo;
      const sameId = t1.id === t2.id;
      const closeAmount = Math.abs(t1.amount - t2.amount) <= 1.0 && !sameAmount;

      let isDuplicate = false;

      if (sameDate && sameEntity && sameAmount) {
        reason = `Exact Match (${t1.currency}): Date, Entity & Amount`;
        confidence = 0.99;
        isDuplicate = true;
      } else if (sameDate && sameAmount) {
        reason = `Exact Match (${t1.currency}): Date & Amount`;
        confidence = 0.95;
        isDuplicate = true;
      } else if (sameMemo) {
        reason = 'Duplicate Memo detected';
        confidence = 0.85;
        isDuplicate = true;
      } else if (sameId) {
        reason = 'Duplicate Transaction ID';
        confidence = 1.0;
        isDuplicate = true;
      } else if (closeAmount && (sameDate || sameEntity)) {
        reason = `Fuzzy Match (${t1.currency}): Close Amount`;
        confidence = 0.75;
        isDuplicate = true;
      }

      if (isDuplicate) {
        potentialGroup.push(t2);
        processedIds.add(t2.id);
      }
    }

    if (potentialGroup.length > 1) {
      processedIds.add(t1.id);
      groups.push({
        reason: reason || 'Potential Duplicate',
        transactions: potentialGroup,
        confidenceScore: confidence,
      });
    }
  }

  return groups;
}

// GET /api/cron/scheduled-scan - Utemezett scan futtatas
router.get('/scheduled-scan', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();
    const now = new Date();

    const { data: schedules, error: schedulesError } = await supabase
      .from('scan_schedules')
      .select('*')
      .eq('is_active', true);

    if (schedulesError) throw schedulesError;

    if (!schedules || schedules.length === 0) {
      return res.json({ message: 'No active schedules', scansTriggered: 0 });
    }

    let scansTriggered = 0;
    const results = [];

    for (const schedule of schedules) {
      const shouldRun = checkIfShouldRun(schedule, now);

      if (shouldRun) {
        try {
          const result = await triggerScan(supabase, schedule);
          results.push({ schedule_id: schedule.id, ...result });

          await supabase
            .from('scan_schedules')
            .update({
              last_run_at: now.toISOString(),
              next_run_at: calculateNextRun(schedule, now).toISOString(),
            })
            .eq('id', schedule.id);

          scansTriggered++;
        } catch (scanErr) {
          console.error(`[Cron] Scan failed for schedule ${schedule.id}:`, scanErr.message);
          results.push({ schedule_id: schedule.id, error: scanErr.message });
        }
      }
    }

    res.json({
      message: 'Scheduled scan check complete',
      scansTriggered,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error in scheduled scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function checkIfShouldRun(schedule, now) {
  const [scheduleHour] = schedule.time_of_day.split(':').map(Number);
  const currentHour = now.getUTCHours();

  if (currentHour !== scheduleHour) return false;

  if (schedule.frequency === 'daily') return true;
  if (schedule.frequency === 'weekly') return now.getUTCDay() === schedule.day_of_week;
  if (schedule.frequency === 'monthly') return now.getUTCDate() === schedule.day_of_month;

  return false;
}

function calculateNextRun(schedule, from) {
  const [hour, minute] = schedule.time_of_day.split(':').map(Number);
  const next = new Date(from);

  if (schedule.frequency === 'daily') {
    next.setUTCDate(next.getUTCDate() + 1);
  } else if (schedule.frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (schedule.frequency === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }

  next.setUTCHours(hour, minute, 0, 0);
  return next;
}

async function triggerScan(supabase, schedule) {
  const userId = schedule.user_id;

  // 1. Create scan_history record
  const { data: scan, error: scanError } = await supabase
    .from('scan_history')
    .insert({
      user_id: userId,
      quickbooks_connection_id: schedule.quickbooks_connection_id || null,
      scan_type: 'scheduled',
      status: 'running',
      total_transactions: 0,
      duplicates_found: 0,
      duplicates_resolved: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (scanError) throw scanError;

  try {
    // 2. Fetch real transactions from all active connections for this user
    let allTransactions = [];
    const sources = [];

    // QuickBooks
    const { data: qbConn } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (qbConn) {
      try {
        const accessToken = await getValidQBAccessToken(qbConn);
        const qbTransactions = await fetchQBTransactions(accessToken, qbConn.realm_id);
        allTransactions = [...allTransactions, ...qbTransactions];
        sources.push(`QuickBooks (${qbConn.company_name || qbConn.realm_id}): ${qbTransactions.length}`);
        console.log(`[Cron] QB: Fetched ${qbTransactions.length} transactions`);
      } catch (qbErr) {
        console.error('[Cron] QB fetch failed:', qbErr.message);
        sources.push(`QuickBooks: ERROR - ${qbErr.message}`);
      }
    }

    // Xero
    const { data: xeroConn } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (xeroConn) {
      try {
        const accessToken = await getValidXeroAccessToken(xeroConn);
        const xeroTransactions = await fetchXeroTransactions(accessToken, xeroConn.tenant_id);
        allTransactions = [...allTransactions, ...xeroTransactions];
        sources.push(`Xero (${xeroConn.tenant_name || xeroConn.tenant_id}): ${xeroTransactions.length}`);
        console.log(`[Cron] Xero: Fetched ${xeroTransactions.length} transactions`);
      } catch (xeroErr) {
        console.error('[Cron] Xero fetch failed:', xeroErr.message);
        sources.push(`Xero: ERROR - ${xeroErr.message}`);
      }
    }

    if (allTransactions.length === 0) {
      // No live data available - mark scan as completed with 0 results
      await supabase
        .from('scan_history')
        .update({
          status: 'completed',
          total_transactions: 0,
          duplicates_found: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scan.id);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'scan_complete',
        title: 'Scheduled Scan - No Data',
        message: 'No active accounting connections found. Connect QuickBooks or Xero to scan real transactions.',
        metadata: { scan_id: scan.id, sources },
        is_read: false,
        created_at: new Date().toISOString(),
      });

      return { scan_id: scan.id, status: 'no_data', sources };
    }

    // 3. Run duplicate detection
    const duplicateGroups = detectDuplicates(allTransactions);
    console.log(`[Cron] Detected ${duplicateGroups.length} duplicate groups from ${allTransactions.length} transactions`);

    // 4. Insert duplicate records into DB
    const duplicateRecords = [];
    for (const group of duplicateGroups) {
      // For each pair in the group, create a duplicate_transactions record
      const original = group.transactions[0];
      for (let k = 1; k < group.transactions.length; k++) {
        const dup = group.transactions[k];
        duplicateRecords.push({
          scan_id: scan.id,
          user_id: userId,
          original_transaction_id: original.id,
          duplicate_transaction_id: dup.id,
          transaction_type: original.type,
          amount: original.amount,
          transaction_date: original.date || new Date().toISOString(),
          vendor_name: original.entityName,
          description: group.reason,
          confidence_score: group.confidenceScore,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }

    if (duplicateRecords.length > 0) {
      await supabase.from('duplicate_transactions').insert(duplicateRecords);
    }

    // 5. Update scan_history
    await supabase
      .from('scan_history')
      .update({
        status: 'completed',
        total_transactions: allTransactions.length,
        duplicates_found: duplicateRecords.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id);

    // 6. Notify user
    const sourceNames = sources.join(', ');
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'scan_complete',
      title: 'Scheduled Scan Complete',
      message: duplicateRecords.length > 0
        ? `Found ${duplicateRecords.length} potential duplicates in ${allTransactions.length} transactions (${sourceNames}).`
        : `Scanned ${allTransactions.length} transactions (${sourceNames}). No duplicates found.`,
      metadata: {
        scan_id: scan.id,
        duplicates_count: duplicateRecords.length,
        total_transactions: allTransactions.length,
        sources,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      scan_id: scan.id,
      status: 'completed',
      total_transactions: allTransactions.length,
      duplicates_found: duplicateRecords.length,
      sources,
    };
  } catch (error) {
    // Mark scan as failed
    await supabase
      .from('scan_history')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id);

    throw error;
  }
}

module.exports = router;
