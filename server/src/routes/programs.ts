import { Router, Request, Response } from 'express';
import { query } from '../db/database';

const router = Router();

// GET /api/programs (Public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query('SELECT * FROM programs WHERE status = "active" ORDER BY sort_order ASC');
    const programs = rows.map((p) => ({
      ...p,
      topics: typeof p.topics === 'string' ? JSON.parse(p.topics) : p.topics,
    }));
    res.json({ success: true, programs });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'تعذر جلب المسارات التعليمية' });
  }
});

export default router;
