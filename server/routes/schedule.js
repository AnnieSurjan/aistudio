const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// GET /api/schedule - Utemezesek lekerese
router.get('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const userId = req.query.userId || 'user-1';

    const { data, error } = await supabase
      .from('scan_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ schedules: data || [] });
  } catch (error) {
    console.error('[API] Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// POST /api/schedule - Uj utemezes letrehozasa
router.post('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const {
      userId = 'user-1',
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      timezone,
      isActive,
    } = req.body;

    const nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay, timezone);

    const { data, error } = await supabase
      .from('scan_schedules')
      .insert({
        user_id: userId,
        frequency,
        day_of_week: dayOfWeek,
        day_of_month: dayOfMonth,
        time_of_day: timeOfDay,
        timezone,
        is_active: isActive,
        next_run_at: nextRunAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'info',
      title: 'Schedule Created',
      message: `Automated scans will run ${frequency} at ${timeOfDay}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    res.json({ schedule: data });
  } catch (error) {
    console.error('[API] Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// PATCH /api/schedule - Utemezes frissitese
router.patch('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const {
      scheduleId,
      userId = 'user-1',
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      timezone,
      isActive,
    } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID required' });
    }

    const nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay, timezone);

    const { data, error } = await supabase
      .from('scan_schedules')
      .update({
        frequency,
        day_of_week: dayOfWeek,
        day_of_month: dayOfMonth,
        time_of_day: timeOfDay,
        timezone,
        is_active: isActive,
        next_run_at: nextRunAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ schedule: data });
  } catch (error) {
    console.error('[API] Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// DELETE /api/schedule - Utemezes torlese
router.delete('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const scheduleId = req.query.scheduleId;
    const userId = req.query.userId || 'user-1';

    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID required' });
    }

    const { error } = await supabase
      .from('scan_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

function calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay, timezone) {
  const now = new Date();
  const [hour, minute] = timeOfDay.split(':').map(Number);
  const next = new Date(now);

  next.setUTCHours(hour, minute, 0, 0);

  if (next <= now) {
    if (frequency === 'daily') {
      next.setUTCDate(next.getUTCDate() + 1);
    } else if (frequency === 'weekly' && dayOfWeek !== null) {
      const currentDay = next.getUTCDay();
      const daysUntilTarget = ((dayOfWeek - currentDay + 7) % 7) || 7;
      next.setUTCDate(next.getUTCDate() + daysUntilTarget);
    } else if (frequency === 'monthly' && dayOfMonth !== null) {
      next.setUTCMonth(next.getUTCMonth() + 1);
      next.setUTCDate(dayOfMonth);
    }
  }

  return next;
}

module.exports = router;
