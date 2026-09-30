const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications - Get user notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT 
        id,
        user_id as userId,
        booking_id as bookingId,
        title,
        message,
        type,
        is_read as isRead,
        created_at as createdAt
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Server error retrieving notifications.' });
  }
});

// PATCH /api/notifications/:id/read - Mark one notification as read
router.patch('/:id/read', requireAuth, (req, res) => {
  try {
    const notifId = req.params.id;
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this notification.' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);

    return res.json({ message: 'Notification marked as read.', id: notifId });
  } catch (err) {
    console.error('Error updating notification:', err);
    return res.status(500).json({ message: 'Server error updating notification.' });
  }
});

// PATCH /api/notifications/read-all - Mark all user notifications as read
router.patch('/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all read:', err);
    return res.status(500).json({ message: 'Server error updating notifications.' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const notifId = req.params.id;
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this notification.' });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(notifId);
    return res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    return res.status(500).json({ message: 'Server error deleting notification.' });
  }
});

module.exports = router;
