const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../lib/supabase');

// GET /api/notifications - Ertesitesek lekerese
router.get('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const userId = req.query.userId || 'user-1';
    const unreadOnly = req.query.unreadOnly === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      notifications: data || [],
      unreadCount: data?.filter((n) => !n.is_read).length || 0,
    });
  } catch (error) {
    console.error('[API] Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications - Uj ertesites letrehozasa
router.post('/', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const { userId = 'user-1', type, title, message, metadata } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata: metadata || {},
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ notification: data });
  } catch (error) {
    console.error('[API] Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// POST /api/notifications/mark-read - Ertesites olvasttkent jelolese
router.post('/mark-read', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const { notificationId, userId = 'user-1' } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ notification: data });
  } catch (error) {
    console.error('[API] Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read - Osszes ertesites olvasottkent jelolese
router.post('/mark-all-read', async (req, res) => {
  try {
    const supabase = getAdminClient();
    const { userId = 'user-1' } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;

    res.json({
      updated: data?.length || 0,
      notifications: data,
    });
  } catch (error) {
    console.error('[API] Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = router;
