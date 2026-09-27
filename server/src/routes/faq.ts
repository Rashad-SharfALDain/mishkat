import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run, queryOne } from '../db/database';
import { requireStrictAdmin } from '../middleware/auth';

const router = Router();

// GET /api/faq (Public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await query('SELECT * FROM faq WHERE status = "published" ORDER BY sort_order ASC');
    res.json({ success: true, faqs });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'تعذر جلب الأسئلة الشائعة' });
  }
});

// POST /api/faq (Strict Admin only)
router.post('/', requireStrictAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category, sort_order } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: 'يرجى إدخال السؤال والإجابة' });
      return;
    }
    const id = uuidv4();
    await run(
      'INSERT INTO faq (id, question, answer, category, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, question.trim(), answer.trim(), category || 'عام', sort_order || 0]
    );
    res.status(201).json({ success: true, message: 'تمت إضافة السؤال بنجاح', id });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة السؤال' });
  }
});

// PUT /api/faq/:id (Strict Admin only)
router.put('/:id', requireStrictAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { question, answer, category, sort_order, status } = req.body;
    await run(
      'UPDATE faq SET question = ?, answer = ?, category = ?, sort_order = ?, status = ? WHERE id = ?',
      [question, answer, category, sort_order, status || 'published', id]
    );
    res.json({ success: true, message: 'تم تحديث السؤال بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث السؤال' });
  }
});

// DELETE /api/faq/:id (Strict Admin only)
router.delete('/:id', requireStrictAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await run('DELETE FROM faq WHERE id = ?', [id]);
    res.json({ success: true, message: 'تم حذف السؤال بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف السؤال' });
  }
});

export default router;
