const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

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

    for (const schedule of schedules) {
      const shouldRun = checkIfShouldRun(schedule, now);

      if (shouldRun) {
        await triggerScan(supabase, schedule);

        await supabase
          .from('scan_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: calculateNextRun(schedule, now).toISOString(),
          })
          .eq('id', schedule.id);

        scansTriggered++;
      }
    }

    res.json({
      message: 'Scheduled scan check complete',
      scansTriggered,
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
  const { data: scan, error: scanError } = await supabase
    .from('scan_history')
    .insert({
      user_id: schedule.user_id,
      quickbooks_connection_id: schedule.quickbooks_connection_id,
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

  const mockDuplicates = generateMockDuplicates(scan.id, schedule.user_id);

  if (mockDuplicates.length > 0) {
    await supabase.from('duplicate_transactions').insert(mockDuplicates);
  }

  await supabase
    .from('scan_history')
    .update({
      status: 'completed',
      total_transactions: 100,
      duplicates_found: mockDuplicates.length,
      completed_at: new Date().toISOString(),
    })
    .eq('id', scan.id);

  await supabase.from('notifications').insert({
    user_id: schedule.user_id,
    type: 'scan_complete',
    title: 'Scheduled Scan Complete',
    message: `Found ${mockDuplicates.length} potential duplicates in your QuickBooks data.`,
    metadata: { scan_id: scan.id, duplicates_count: mockDuplicates.length },
    is_read: false,
    created_at: new Date().toISOString(),
  });
}

function generateMockDuplicates(scanId, userId) {
  const count = Math.floor(Math.random() * 4) + 2;
  const duplicates = [];
  const vendors = ['Acme Corp', 'Tech Supplies Inc', 'Office Depot', 'Amazon Business', 'Staples'];

  for (let i = 0; i < count; i++) {
    const amount = (Math.random() * 1000 + 100).toFixed(2);
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];

    duplicates.push({
      scan_id: scanId,
      user_id: userId,
      original_transaction_id: `QBO-${Date.now()}-${i}-A`,
      duplicate_transaction_id: `QBO-${Date.now()}-${i}-B`,
      transaction_type: 'Expense',
      amount: parseFloat(amount),
      transaction_date: new Date().toISOString(),
      vendor_name: vendor,
      description: `Payment to ${vendor}`,
      confidence_score: Math.random() * 0.3 + 0.7,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  return duplicates;
}

module.exports = router;
