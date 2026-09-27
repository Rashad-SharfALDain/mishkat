import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run, queryOne } from '../db/database';
import { requireAuth, requireAdmin, requireStrictAdmin, AuthRequest } from '../middleware/auth';
import { notifyLinkedParents, notifyStudent } from '../utils/notifications';

const router = Router();

// ========================================================
// 1. PERIODS & DIMENSIONS CONFIGURATION
// ========================================================

// GET /api/evaluations/periods
router.get('/periods', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const periods = await query(`
      SELECT * FROM evaluation_periods ORDER BY start_date DESC
    `);
    res.json({ success: true, periods });
  } catch (error) {
    console.error('Error fetching evaluation periods:', error);
    res.status(500).json({ error: 'تعذر جلب فترات التقييم' });
  }
});

// POST /api/evaluations/periods (Strict Admin only)
router.post('/periods', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { academic_year, period_name, start_date, end_date, status } = req.body;
    if (!academic_year || !period_name || !start_date || !end_date) {
      res.status(400).json({ error: 'جميع حقول الفترة الأكاديمية مطلوبة' });
      return;
    }

    const id = uuidv4();
    await run(`
      INSERT INTO evaluation_periods (id, academic_year, period_name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, academic_year, period_name.trim(), start_date, end_date, status || 'active']);

    const period = await queryOne('SELECT * FROM evaluation_periods WHERE id = ?', [id]);
    res.status(201).json({ success: true, message: 'تم إنشاء الفترة بنجاح', period });
  } catch (error) {
    console.error('Error creating evaluation period:', error);
    res.status(500).json({ error: 'تعذر إنشاء فترة التقييم' });
  }
});

// GET /api/evaluations/dimensions
router.get('/dimensions', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dimensions = await query(`
      SELECT * FROM evaluation_dimensions WHERE status = 'active' ORDER BY sort_order ASC
    `);

    // Parse qualitative_scale JSON
    const parsed = dimensions.map((d: any) => ({
      ...d,
      qualitative_scale: typeof d.qualitative_scale === 'string'
        ? JSON.parse(d.qualitative_scale)
        : d.qualitative_scale,
    }));

    res.json({ success: true, dimensions: parsed });
  } catch (error) {
    console.error('Error fetching evaluation dimensions:', error);
    res.status(500).json({ error: 'تعذر جلب محاور التقييم' });
  }
});

// ========================================================
// 2. STUDENT EVALUATIONS (HYBRID MODE)
// ========================================================

// GET /api/evaluations/student/:studentId
router.get('/student/:studentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { period_id } = req.query;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    // Strict Anti-IDOR Authorization Check:
    const isStaff = user.role === 'admin' || user.role === 'supervisor';
    if (user.role === 'student') {
      const own = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!own || own.id !== studentId) {
        res.status(403).json({ error: 'غير مصرح: لا يمكنك الاطلاع على تقييمات طلاب آخرين' });
        return;
      }
    } else if (user.role === 'parent') {
      const link = await queryOne(`
        SELECT id FROM parent_student
        WHERE parent_user_id = ? AND student_id = ? AND status = 'active'
      `, [user.id, studentId]);
      if (!link) {
        res.status(403).json({ error: 'غير مصرح: هذا الطالب غير مسجل ضمن قائمة الأبناء المرتبطة بحسابك' });
        return;
      }
    } else if (!isStaff) {
      res.status(403).json({ error: 'غير مصرح للوصول إلى التقييمات' });
      return;
    }

    // Fetch student basic details
    const student = await queryOne(`
      SELECT s.id, s.student_number, a.student_name, s.educational_track, s.current_level
      FROM students s
      LEFT JOIN applicants a ON a.id = s.applicant_id
      WHERE s.id = ?
    `, [studentId]);

    if (!student) {
      res.status(404).json({ error: 'لم يتم العثور على سجل الطالب' });
      return;
    }

    // Query evaluations
    let sql = `
      SELECT e.*, d.dimension_name, d.weight, d.max_score, d.sort_order,
             u.name as evaluator_name, p.period_name, p.academic_year
      FROM evaluations e
      JOIN evaluation_dimensions d ON d.id = e.dimension_id
      JOIN evaluation_periods p ON p.id = e.period_id
      LEFT JOIN users u ON u.id = e.evaluated_by
      WHERE e.student_id = ?
    `;
    const params: any[] = [studentId];

    if (period_id) {
      sql += ' AND e.period_id = ?';
      params.push(period_id);
    }

    // Confidentiality rule: Students & Parents can only see PUBLISHED evaluations
    if (!isStaff) {
      sql += " AND e.evaluation_status = 'published'";
    }

    sql += ' ORDER BY d.sort_order ASC';
    const evaluations = await query(sql, params);

    // Calculate hybrid weighted scores
    let totalWeightedScore = 0;
    let totalWeightEvaluated = 0;

    for (const ev of evaluations) {
      if (typeof ev.numerical_score === 'number' && ev.numerical_score !== null) {
        const weight = ev.weight || 20.0;
        const maxScore = ev.max_score || 100.0;
        totalWeightedScore += (ev.numerical_score / maxScore) * weight;
        totalWeightEvaluated += weight;
      }
    }

    const overallScore = totalWeightEvaluated > 0
      ? Math.round((totalWeightedScore / totalWeightEvaluated) * 100)
      : null;

    let overallRating = null;
    if (overallScore !== null) {
      if (overallScore >= 90) overallRating = 'ممتاز';
      else if (overallScore >= 80) overallRating = 'جيد جدًا';
      else if (overallScore >= 65) overallRating = 'جيد';
      else overallRating = 'يحتاج متابعة';
    }

    res.json({
      success: true,
      student,
      summary: {
        total_evaluations: evaluations.length,
        overall_score: overallScore,
        overall_rating: overallRating,
        evaluation_mode: 'hybrid',
      },
      evaluations,
    });
  } catch (error) {
    console.error('Error fetching student evaluations:', error);
    res.status(500).json({ error: 'تعذر جلب سجل التقييمات' });
  }
});

// POST /api/evaluations/student/:studentId
// Record or update evaluation (Admin / Supervisor)
router.post('/student/:studentId', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { period_id, dimension_id, qualitative_rating, numerical_score, supervisor_notes, evaluation_status } = req.body;

    if (!period_id || !dimension_id) {
      res.status(400).json({ error: 'معرف الفترة ومعرف المحور مطلوبان للتقييم' });
      return;
    }

    // Validate numerical score bounds if provided
    if (numerical_score !== undefined && numerical_score !== null) {
      const num = Number(numerical_score);
      if (isNaN(num) || num < 0 || num > 100) {
        res.status(400).json({ error: 'الدرجة الرقمية يجب أن تكون رقمًا بين 0 و 100' });
        return;
      }
    }

    const evaluatorId = req.user?.id || 'admin';
    const status = evaluation_status || 'draft';

    // Check if an evaluation already exists for this student, period, and dimension
    const existing = await queryOne(`
      SELECT id FROM evaluations
      WHERE student_id = ? AND period_id = ? AND dimension_id = ?
    `, [studentId, period_id, dimension_id]);

    if (existing) {
      await run(`
        UPDATE evaluations
        SET qualitative_rating = ?, numerical_score = ?, supervisor_notes = ?,
            evaluated_by = ?, evaluation_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        qualitative_rating || null,
        numerical_score !== undefined ? Number(numerical_score) : null,
        supervisor_notes || null,
        evaluatorId,
        status,
        existing.id,
      ]);
      res.json({ success: true, message: 'تم تحديث التقييم بنجاح', evaluation_id: existing.id });
    } else {
      const evalId = uuidv4();
      await run(`
        INSERT INTO evaluations (
          id, period_id, student_id, dimension_id, qualitative_rating,
          numerical_score, supervisor_notes, evaluated_by, evaluation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evalId,
        period_id,
        studentId,
        dimension_id,
        qualitative_rating || null,
        numerical_score !== undefined ? Number(numerical_score) : null,
        supervisor_notes || null,
        evaluatorId,
        status,
      ]);
      res.status(201).json({ success: true, message: 'تم رصد التقييم بنجاح', evaluation_id: evalId });
    }
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'تعذر رصد التقييم التربوي' });
  }
});

// POST /api/evaluations/periods/:periodId/publish
// Officially publish all evaluations for a period (Strict Admin only)
router.post('/periods/:periodId/publish', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { periodId } = req.params;

    // Check period
    const period = await queryOne('SELECT * FROM evaluation_periods WHERE id = ?', [periodId]);
    if (!period) {
      res.status(404).json({ error: 'الفترة الأكاديمية غير موجودة' });
      return;
    }

    // Publish all draft/submitted evaluations in this period
    await run(`
      UPDATE evaluations
      SET evaluation_status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE period_id = ? AND evaluation_status != 'published'
    `, [periodId]);

    // Find all distinct evaluated students in this period
    const evaluatedStudents = await query<{ student_id: string }>(`
      SELECT DISTINCT student_id FROM evaluations WHERE period_id = ?
    `, [periodId]);

    // Send notifications to all evaluated students and their parents
    for (const item of evaluatedStudents) {
      const notifTitle = '🌟 اعتماد التقييم التعليمي والقيمي';
      const notifMsg = `تم اعتماد ونشر نتائج التقييم التربوي للفترة (${period.period_name}). يمكنكم الآن الاطلاع على النتائج والتوجيهات النوعية عبر البوابة.`;

      await notifyStudent(item.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'evaluation',
        referenceEntityType: 'evaluations',
        referenceEntityId: periodId,
      });

      await notifyLinkedParents(item.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'evaluation',
        referenceEntityType: 'evaluations',
        referenceEntityId: periodId,
      });
    }

    res.json({
      success: true,
      message: `تم اعتماد ونشر نتائج التقييم رسميًا لـ (${evaluatedStudents.length}) طالب، وإرسال التنبيهات اللازمة.`,
    });
  } catch (error) {
    console.error('Error publishing evaluations:', error);
    res.status(500).json({ error: 'تعذر اعتماد ونشر التقييمات' });
  }
});

export default router;
