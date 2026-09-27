import { Router, Request, Response } from 'express';
import { query, run, queryOne } from '../db/database';
import { requireStrictAdmin } from '../middleware/auth';

const router = Router();

// GET /api/settings (Public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{ key: string; value: string; description: string }>('SELECT key, value, description FROM settings');
    const settingsObj: Record<string, string> = {};
    rows.forEach((row) => {
      settingsObj[row.key] = row.value;
    });
    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'تعذر جلب إعدادات المؤسسة' });
  }
});

// PUT /api/settings (Strict Admin protected)
router.put('/', requireStrictAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'بيانات الإعدادات غير صحيحة' });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await run(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
        [key, String(value)]
      );
    }

    res.json({ success: true, message: 'تم حفظ وتحديث الإعدادات بنجاح' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ الإعدادات' });
  }
});

export default router;
