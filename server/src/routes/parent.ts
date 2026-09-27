import { Router, Response } from 'express';
import { query, run, queryOne } from '../db/database';
import { requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to verify that the student is actively linked to this parent (Strict IDOR prevention)
async function verifyParentStudentLink(parentUserId: string, studentId: string): Promise<any | null> {
  return await queryOne(`
    SELECT ps.id as link_id, ps.relationship as link_relationship, ps.is_primary,
           s.id, s.student_number, s.admission_date, s.academic_status,
           s.current_grade, s.current_level, s.educational_track,
           a.student_name, a.school, a.city, a.date_of_birth, a.gender
    FROM parent_student ps
    JOIN students s ON s.id = ps.student_id
    LEFT JOIN applicants a ON a.id = s.applicant_id
    WHERE ps.parent_user_id = ? AND s.id = ? AND ps.status = 'active'
  `, [parentUserId, studentId]);
}

// GET /api/parent/dashboard
// Overview data for the authenticated parent's portal
router.get('/dashboard', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    if (!parentUserId) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    // 1. Fetch parent record
    const parent = await queryOne(`
      SELECT id, full_name, relationship, phone, email, address, status
      FROM parents
      WHERE user_id = ?
    `, [parentUserId]);

    if (!parent) {
      res.status(404).json({ error: 'لم يتم العثور على سجل ولي الأمر' });
      return;
    }

    // 2. Fetch all linked children (Strictly filtered to authenticated parent)
    const children = await query(`
      SELECT 
        s.id,
        s.student_number,
        s.admission_date,
        s.academic_status,
        s.current_grade,
        s.current_level,
        s.educational_track,
        a.student_name,
        a.school,
        a.city,
        ps.relationship as guardian_relation,
        ps.is_primary
      FROM parent_student ps
      JOIN students s ON s.id = ps.student_id
      LEFT JOIN applicants a ON a.id = s.applicant_id
      WHERE ps.parent_user_id = ? AND ps.status = 'active'
      ORDER BY ps.is_primary DESC, s.created_at ASC
    `, [parentUserId]);

    // 3. Announcements for parents
    const announcements = await query(`
      SELECT id, title, content, publish_date
      FROM announcements
      WHERE status = 'published' AND audience IN ('all', 'parents')
      ORDER BY publish_date DESC, created_at DESC
      LIMIT 3
    `);

    res.json({
      success: true,
      parent,
      children,
      announcements,
      stats: {
        children_count: children.length,
        attendance_status: 'سيتم تفعيل متابعة الحضور قريبًا',
        evaluations_status: 'التقييمات التربوية تُنشر فور اعتمادها من المشرفين',
      },
    });
  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    res.status(500).json({ error: 'تعذر جلب بيانات لوحة تحكم ولي الأمر' });
  }
});

// GET /api/parent/profile
// Returns parent profile information
router.get('/profile', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const parent = await queryOne(`
      SELECT p.id, p.full_name, p.relationship, p.phone, p.email, p.address, p.status, p.created_at,
             u.email as user_email
      FROM parents p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
    `, [parentUserId]);

    if (!parent) {
      res.status(404).json({ error: 'ملف ولي الأمر غير موجود' });
      return;
    }

    res.json({ success: true, profile: parent });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الملف الشخصي' });
  }
});

// PATCH /api/parent/profile
// Parent can only update their own contact details (phone, address, email)
router.patch('/profile', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;

    // Reject modification of unauthorized/institutional fields
    const illegalFields = ['id', 'user_id', 'status', 'relationship', 'national_id', 'role', 'students'];
    for (const field of illegalFields) {
      if (req.body[field] !== undefined) {
        res.status(403).json({
          error: `غير مصرح بتعديل حقل "${field}". تعديل العلاقات وحالات الحساب يتم عبر إدارة المؤسسة فقط.`,
        });
        return;
      }
    }

    const { phone, address, email } = req.body;
    const parent = await queryOne('SELECT id, user_id FROM parents WHERE user_id = ?', [parentUserId]);
    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone.trim());
      await run('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone.trim(), parentUserId]);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address.trim());
    }

    if (email !== undefined && email.trim() !== '') {
      // Check if email already taken by another user
      const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [email.trim().toLowerCase(), parentUserId]);
      if (existing) {
        res.status(400).json({ error: 'البريد الإلكتروني مستخدم لحساب آخر مسبقًا' });
        return;
      }
      updates.push('email = ?');
      params.push(email.trim().toLowerCase());
      await run('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [email.trim().toLowerCase(), parentUserId]);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(parent.id);
      await run(`UPDATE parents SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({ success: true, message: 'تم تحديث بيانات الاتصال بنجاح' });
  } catch (error) {
    console.error('Error updating parent profile:', error);
    res.status(500).json({ error: 'تعذر حفظ تعديلات الملف الشخصي' });
  }
});

// GET /api/parent/students
// Returns all students linked to the authenticated parent
router.get('/students', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const students = await query(`
      SELECT 
        s.id,
        s.student_number,
        s.admission_date,
        s.academic_status,
        s.current_grade,
        s.current_level,
        s.educational_track,
        a.student_name,
        a.school,
        a.city,
        ps.relationship as guardian_relation,
        ps.is_primary
      FROM parent_student ps
      JOIN students s ON s.id = ps.student_id
      LEFT JOIN applicants a ON a.id = s.applicant_id
      WHERE ps.parent_user_id = ? AND ps.status = 'active'
      ORDER BY ps.is_primary DESC, s.created_at ASC
    `, [parentUserId]);

    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching parent students:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة الأبناء' });
  }
});

// GET /api/parent/students/:id
// Get single child profile (Strict IDOR authorization check)
router.get('/students/:id', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const { id } = req.params;

    const child = await verifyParentStudentLink(parentUserId!, id);
    if (!child) {
      res.status(403).json({ error: 'غير مصرح: هذا الطالب غير مسجل ضمن قائمة الأبناء المرتبطة بحسابك' });
      return;
    }

    // Return strictly non-confidential student profile (NO internal notes or reviewer data)
    res.json({
      success: true,
      student: {
        id: child.id,
        student_number: child.student_number,
        student_name: child.student_name,
        academic_status: child.academic_status,
        current_grade: child.current_grade,
        current_level: child.current_level,
        educational_track: child.educational_track,
        admission_date: child.admission_date,
        school: child.school,
        city: child.city,
        guardian_relationship: child.link_relationship,
        is_primary: Boolean(child.is_primary),
      },
    });
  } catch (error) {
    console.error('Error fetching child profile:', error);
    res.status(500).json({ error: 'تعذر جلب ملف الطالب' });
  }
});

// GET /api/parent/students/:id/attendance
// Attendance foundation for child (Strict IDOR check; transparent placeholder, no fake data)
router.get('/students/:id/attendance', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const { id } = req.params;

    const child = await verifyParentStudentLink(parentUserId!, id);
    if (!child) {
      res.status(403).json({ error: 'غير مصرح: هذا الطالب غير مسجل ضمن قائمة الأبناء المرتبطة بحسابك' });
      return;
    }

    // Fetch real attendance records if any exist
    const records = await query(`
      SELECT a.id, a.session_id, a.status, a.notes, a.recorded_at, a.excuse_id,
             s.title as session_title, s.session_date, s.start_time, s.location
      FROM attendance a
      JOIN sessions s ON s.id = a.session_id
      WHERE a.student_id = ?
      ORDER BY s.session_date DESC
    `, [child.id]);

    let present = 0;
    let absent = 0;
    let excused = 0;
    for (const r of records) {
      if (r.status === 'حاضر') present++;
      else if (r.status === 'غائب') absent++;
      else if (r.status === 'غياب بعذر' || r.status === 'مستأذن') excused++;
    }

    const totalSessions = records.length;
    const rate = totalSessions > 0 ? Math.round(((present + excused) / totalSessions) * 100) : null;

    res.json({
      success: true,
      student_id: child.id,
      student_name: child.student_name,
      status_message: totalSessions > 0 ? 'سجل الحضور محدث ومتاح للمتابعة' : 'سيتم تفعيل متابعة الحضور قريبًا',
      attendance_rate: rate,
      summary: {
        present,
        absent,
        excused,
        total_sessions: totalSessions,
      },
      records,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'تعذر جلب سجل الحضور' });
  }
});

// GET /api/parent/students/:id/progress
// Educational progress foundation (Strict IDOR check; returns published evaluations)
router.get('/students/:id/progress', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const { id } = req.params;

    const child = await verifyParentStudentLink(parentUserId!, id);
    if (!child) {
      res.status(403).json({ error: 'غير مصرح: هذا الطالب غير مسجل ضمن قائمة الأبناء المرتبطة بحسابك' });
      return;
    }

    const categories = [
      { name: 'العلوم الشرعية', description: 'التأصيل الشرعي والتطبيقات القيمية المعاصرة' },
      { name: 'العلوم والمعارف', description: 'التفكير النقدي، مهارات القراءة، والوعي المعرفي' },
      { name: 'بناء الشخصية', description: 'الانضباط الذاتي، تحمل المسؤولية، والذكاء الاجتماعي' },
      { name: 'القيادة', description: 'المبادرة، العمل الجماعي، وإدارة المشاريع' },
      { name: 'الأنشطة والمبادرات', description: 'المشاركة الفاعلة والمبادرات التطوعية المجتمعية' },
    ];

    // Fetch published evaluations only for privacy
    const publishedEvals = await query(`
      SELECT e.*, d.dimension_name, d.weight, d.max_score, p.period_name
      FROM evaluations e
      JOIN evaluation_dimensions d ON d.id = e.dimension_id
      JOIN evaluation_periods p ON p.id = e.period_id
      WHERE e.student_id = ? AND e.evaluation_status = 'published'
      ORDER BY d.sort_order ASC
    `, [child.id]);

    res.json({
      success: true,
      student_id: child.id,
      student_name: child.student_name,
      educational_track: child.educational_track,
      current_level: child.current_level,
      status_message: publishedEvals.length > 0
        ? 'تم اعتماد التقييمات التربوية والقيمية'
        : 'التقييمات التربوية قيد الإعداد للاعتماد من المشرفين في المرحلة القادمة',
      categories,
      scores: publishedEvals,
    });

  } catch (error) {
    console.error('Error fetching educational progress:', error);
    res.status(500).json({ error: 'تعذر جلب بيانات التقدم التعليمي' });
  }
});

// GET /api/parent/students/:id/activities
// Read-only activities for the linked child (Strict IDOR check)
router.get('/students/:id/activities', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parentUserId = req.user?.id;
    const { id } = req.params;

    const child = await verifyParentStudentLink(parentUserId!, id);
    if (!child) {
      res.status(403).json({ error: 'غير مصرح: هذا الطالب غير مسجل ضمن قائمة الأبناء المرتبطة بحسابك' });
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
    `, [child.id]);

    res.json({
      success: true,
      student_id: child.id,
      student_name: child.student_name,
      activities,
    });
  } catch (error) {
    console.error('Error fetching child activities:', error);
    res.status(500).json({ error: 'تعذر جلب أنشطة الطالب' });
  }
});

// GET /api/parent/announcements
// Announcements relevant to parents
router.get('/announcements', requireParent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcements = await query(`
      SELECT id, title, content, audience, publish_date, created_at
      FROM announcements
      WHERE status = 'published'
        AND audience IN ('all', 'parents')
      ORDER BY publish_date DESC, created_at DESC
    `);

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'تعذر جلب الإعلانات' });
  }
});

export default router;
