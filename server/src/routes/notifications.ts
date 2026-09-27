import { Router, Response } from 'express';
import { query, run, queryOne } from '../db/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
// Get in-app notifications for authenticated user
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    const notifications = await query(`
      SELECT * FROM notifications
      WHERE recipient_user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCountRow = await queryOne<{ cnt: number }>(`
      SELECT COUNT(*) as cnt FROM notifications
      WHERE recipient_user_id = ? AND is_read = 0
    `, [userId]);

    res.json({
      success: true,
      unread_count: unreadCountRow?.cnt || 0,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'تعذر جلب الإشعارات' });
  }
});

// PATCH /api/notifications/:id/read
// Mark a single notification as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    const notification = await queryOne('SELECT id FROM notifications WHERE id = ? AND recipient_user_id = ?', [id, userId]);
    if (!notification) {
      res.status(404).json({ error: 'الإشعار غير موجود' });
      return;
    }

    await run(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND recipient_user_id = ?
    `, [id, userId]);

    res.json({ success: true, message: 'تم تحديد الإشعار كمقروء' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'تعذر تحديث حالة الإشعار' });
  }
});

// POST /api/notifications/mark-all-read
// Mark all notifications as read for current user
router.post('/mark-all-read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    await run(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE recipient_user_id = ? AND is_read = 0
    `, [userId]);

    res.json({ success: true, message: 'تم تحديد كافة الإشعارات كمقروءة' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'تعذر تحديث الإشعارات' });
  }
});

export default router;
