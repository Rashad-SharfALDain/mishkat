import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run, queryOne } from '../db/database';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/contact (Public inquiry form)
router.post('/contact', rateLimiter(25, 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message, _honeypot } = req.body;

    // Spam honeypot detection
    if (_honeypot && String(_honeypot).trim().length > 0) {
      res.status(400).json({ error: 'تم اكتشاف نشاط غير مصرح به.' });
      return;
    }

    if (!name || name.trim().length < 3) {
      res.status(400).json({ error: 'يرجى كتابة الاسم الكريم' });
      return;
    }
    if (!phone || phone.trim().length < 8) {
      res.status(400).json({ error: 'يرجى كتابة رقم الهاتف للتواصل' });
      return;
    }
    if (!subject || subject.trim().length < 3) {
      res.status(400).json({ error: 'يرجى تحديد موضوع الرسالة' });
      return;
    }
    if (!message || message.trim().length < 10) {
      res.status(400).json({ error: 'يرجى كتابة نص الرسالة (١٠ أحرف على الأقل)' });
      return;
    }

    const messageId = uuidv4();
    await run(`
      INSERT INTO contact_messages (id, name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'new')
    `, [
      messageId,
      name.trim(),
      email ? email.trim() : null,
      phone.trim(),
      subject.trim(),
      message.trim(),
    ]);

    res.status(201).json({
      success: true,
      message: 'شكرًا لتواصلك معنا. تم استلام رسالتك بنجاح وسيقوم فريق الدار بالرد عليك في أقرب وقت.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'تعذر إرسال الرسالة، يرجى المحاولة لاحقًا.' });
  }
});

// GET /api/admin/messages (Admin view)
router.get('/admin/messages', requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: 'تعذر جلب الرسائل' });
  }
});

// PATCH /api/admin/messages/:id (Update status)
router.patch('/admin/messages/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await run('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'تم تحديث حالة الرسالة' });
  } catch (error) {
    res.status(500).json({ error: 'تعذر تحديث حالة الرسالة' });
  }
});

export default router;
