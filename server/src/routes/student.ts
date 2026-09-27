import { Router, Response } from 'express';
import { query, run, queryOne } from '../db/database';
import { requireStudent, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to safely get the authenticated student record
async function getAuthenticatedStudent(userId: string | undefined) {
  if (!userId) return null;
  return await queryOne(`
    SELECT s.*, a.student_name, a.city, a.school, a.phone as applicant_phone,
           a.guardian_name, a.guardian_relationship, a.guardian_phone,
           a.date_of_birth, a.gender, u.email as account_email
    FROM students s
    LEFT JOIN applicants a ON a.id = s.applicant_id
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.user_id = ?
  `, [userId]);
}

// GET /api/student/dashboard
// Returns overview data for the authenticated student's portal home
router.get('/dashboard', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'لم يتم العثور على سجل الطالب' });
      return;
    }

    // 1. Fetch assigned program details
    const program = await queryOne(`
      SELECT id, title, description, category, topics
      FROM programs
      WHERE title LIKE ? OR category LIKE ?
      LIMIT 1
    `, [`%${student.educational_track}%`, `%${student.educational_track}%`]);

    let parsedTopics = [];
    if (program && typeof program.topics === 'string') {
      try {
        parsedTopics = JSON.parse(program.topics);
      } catch {
        parsedTopics = [];
      }
    }

    // 2. Fetch student activities summary
    const activitySummary = await queryOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'تم التسليم' OR status = 'تم التقييم' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'لم يبدأ' OR status = 'قيد التنفيذ' THEN 1 ELSE 0 END) as pending
      FROM student_activities
      WHERE student_id = ?
    `, [student.id]);

    // 3. Fetch latest announcements
    const announcements = await query(`
      SELECT id, title, content, publish_date
      FROM announcements
      WHERE status = 'published'
        AND audience IN ('all', 'all_students')
      ORDER BY publish_date DESC, created_at DESC
      LIMIT 3
    `);

    // 4. Fetch recent activities
    const recentActivities = await query(`
      SELECT sa.id as student_activity_id, sa.status, sa.submitted_at, sa.evaluation,
             a.id as activity_id, a.title, a.activity_type, a.due_date
      FROM student_activities sa
      JOIN activities a ON a.id = sa.activity_id
      WHERE sa.student_id = ?
      ORDER BY sa.created_at DESC
      LIMIT 4
    `, [student.id]);

    res.json({
      success: true,
      student: {
        id: student.id,
        student_number: student.student_number,
        student_name: student.student_name,
        academic_status: student.academic_status,
        current_grade: student.current_grade,
        current_level: student.current_level,
        educational_track: student.educational_track,
        admission_date: student.admission_date,
      },
      program: program ? { ...program, topics: parsedTopics } : null,
      stats: {
        activities_total: activitySummary?.total || 0,
        activities_completed: activitySummary?.completed || 0,
        activities_pending: activitySummary?.pending || 0,
        // Transparent note: Attendance and formal certificate issuance are handled in upcoming releases
        attendance_status: 'قيد التفعيل في المرحلة القادمة',
        certificates_count: 0,
      },
      announcements,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'تعذر جلب بيانات لوحة تحكم الطالب' });
  }
});

// GET /api/student/profile
// Returns the student's profile (strictly isolated to own data)
router.get('/profile', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    res.json({
      success: true,
      profile: {
        student_number: student.student_number,
        student_name: student.student_name,
        academic_status: student.academic_status,
        current_grade: student.current_grade,
        current_level: student.current_level,
        educational_track: student.educational_track,
        admission_date: student.admission_date,
        school: student.school,
        city: student.city,
        phone: student.applicant_phone,
        email: student.account_email,
        guardian_name: student.guardian_name,
        guardian_relationship: student.guardian_relationship,
        emergency_contact: student.emergency_contact || student.guardian_phone,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
      },
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الملف الشخصي' });
  }
});

// PATCH /api/student/profile
// Student can only update their own non-academic contact fields
router.patch('/profile', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const { emergency_contact, phone } = req.body;

    // Reject any attempt to modify immutable fields
    const illegalFields = ['student_number', 'academic_status', 'current_grade', 'current_level', 'educational_track', 'admission_date', 'id'];
    for (const field of illegalFields) {
      if (req.body[field] !== undefined) {
        res.status(403).json({ error: `غير مصرح بتعديل حقل "${field}". البيانات الأكاديمية يتم تعديلها من قِبل إدارة المؤسسة فقط.` });
        return;
      }
    }

    if (emergency_contact !== undefined) {
      await run('UPDATE students SET emergency_contact = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [emergency_contact, student.id]);
    }

    if (phone !== undefined && student.applicant_id) {
      await run('UPDATE applicants SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone, student.applicant_id]);
      await run('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone, student.user_id]);
    }

    res.json({ success: true, message: 'تم تحديث بيانات الاتصال بنجاح' });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'تعذر حفظ تعديلات الملف الشخصي' });
  }
});

// GET /api/student/program
// Educational program assigned to the student
router.get('/program', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const program = await queryOne(`
      SELECT * FROM programs 
      WHERE title LIKE ? OR category LIKE ?
      LIMIT 1
    `, [`%${student.educational_track}%`, `%${student.educational_track}%`]);

    let topics = [];
    if (program && typeof program.topics === 'string') {
      try {
        topics = JSON.parse(program.topics);
      } catch {
        topics = [];
      }
    }

    res.json({
      success: true,
      track_name: student.educational_track,
      program: program ? { ...program, topics } : null,
      level: student.current_level,
    });
  } catch (error) {
    console.error('Error fetching student program:', error);
    res.status(500).json({ error: 'تعذر جلب تفاصيل المسار التعليمي' });
  }
});

// GET /api/student/activities
// All activities assigned to the student
router.get('/activities', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const activities = await query(`
      SELECT 
        sa.id as student_activity_id,
        sa.status,
        sa.submission_content,
        sa.submitted_at,
        sa.evaluation,
        sa.evaluator_notes,
        a.id as activity_id,
        a.title,
        a.description,
        a.activity_type,
        a.due_date
      FROM student_activities sa
      JOIN activities a ON a.id = sa.activity_id
      WHERE sa.student_id = ?
      ORDER BY 
        CASE 
          WHEN sa.status = 'قيد التنفيذ' THEN 1
          WHEN sa.status = 'لم يبدأ' THEN 2
          WHEN sa.status = 'تم التسليم' THEN 3
          ELSE 4
        END,
        a.due_date ASC
    `, [student.id]);

    res.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching student activities:', error);
    res.status(500).json({ error: 'تعذر جلب الأنشطة والمهام' });
  }
});

// POST /api/student/activities/:studentActivityId/submit
// Submit an activity response
router.post('/activities/:studentActivityId/submit', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentActivityId } = req.params;
    const { submission_content } = req.body;

    if (!submission_content || submission_content.trim().length < 5) {
      res.status(400).json({ error: 'يرجى كتابة محتوى أو ملخص الإنجاز (٥ أحرف على الأقل)' });
      return;
    }

    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    // Verify activity belongs to this student (Strict IDOR prevention)
    const record = await queryOne(`
      SELECT id, status FROM student_activities 
      WHERE id = ? AND student_id = ?
    `, [studentActivityId, student.id]);

    if (!record) {
      res.status(404).json({ error: 'النشاط غير موجود أو غير مرتبط بحسابك' });
      return;
    }

    await run(`
      UPDATE student_activities
      SET status = 'تم التسليم',
          submission_content = ?,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [submission_content.trim(), studentActivityId]);

    res.json({
      success: true,
      message: 'تم تسليم النشاط بنجاح! سيتم مراجعته وتقييمه من قِبل المشرف التربوي.',
    });
  } catch (error) {
    console.error('Error submitting activity:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسليم النشاط' });
  }
});

// GET /api/student/announcements
// Announcements relevant to the student
router.get('/announcements', requireStudent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await getAuthenticatedStudent(req.user?.id);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const announcements = await query(`
      SELECT id, title, content, audience, publish_date, created_at
      FROM announcements
      WHERE status = 'published'
        AND audience IN ('all', 'all_students')
      ORDER BY publish_date DESC, created_at DESC
    `);

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'تعذر جلب الإعلانات' });
  }
});

export default router;
