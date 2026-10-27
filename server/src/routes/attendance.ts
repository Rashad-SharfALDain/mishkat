import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run, queryOne } from '../db/database';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { createNotification, notifyLinkedParents, notifyStudent } from '../utils/notifications';
import { enrichWithLegalNameMetadata } from '../utils/legalName';

const router = Router();

// ========================================================
// 1. SESSIONS MANAGEMENT (ADMIN / SUPERVISOR)
// ========================================================

// GET /api/attendance/sessions
router.get('/sessions', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, program_id, status } = req.query;
    let sql = `
      SELECT s.*, p.title as program_title, u.name as supervisor_name,
        (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_records_count
      FROM sessions s
      LEFT JOIN programs p ON p.id = s.program_id
      LEFT JOIN users u ON u.id = s.supervisor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      sql += ' AND s.session_date = ?';
      params.push(date);
    }
    if (program_id) {
      sql += ' AND s.program_id = ?';
      params.push(program_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.session_date DESC, s.start_time DESC';
    const sessions = await query(sql, params);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة الجلسات واللقاءات' });
  }
});

// POST /api/attendance/sessions
router.post('/sessions', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { program_id, title, session_date, start_time, end_time, supervisor_id, location } = req.body;
    if (!title || !session_date) {
      res.status(400).json({ error: 'عنوان الجلسة وتاريخ الانعقاد مطلوبان' });
      return;
    }

    const id = uuidv4();
    await run(`
      INSERT INTO sessions (
        id, program_id, title, session_date, start_time, end_time,
        supervisor_id, location, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [
      id,
      program_id || null,
      title.trim(),
      session_date,
      start_time || null,
      end_time || null,
      supervisor_id || req.user?.id,
      location || 'المقر الرئيسي للمؤسسة',
    ]);

    const session = await queryOne('SELECT * FROM sessions WHERE id = ?', [id]);
    res.status(201).json({ success: true, message: 'تمت جدولة اللقاء بنجاح', session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'تعذر إنشاء اللقاء التعليمي' });
  }
});

// GET /api/attendance/sessions/:id
router.get('/sessions/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await queryOne(`
      SELECT s.*, p.title as program_title, u.name as supervisor_name
      FROM sessions s
      LEFT JOIN programs p ON p.id = s.program_id
      LEFT JOIN users u ON u.id = s.supervisor_id
      WHERE s.id = ?
    `, [id]);

    if (!session) {
      res.status(404).json({ error: 'لم يتم العثور على الجلسة' });
      return;
    }

    // Fetch enrolled students and their attendance status for this session
    const attendanceRecords = await query(`
      SELECT st.id as student_id, st.student_number, a.student_name, st.legal_full_name, st.name_verification_status, st.educational_track,
             att.id as attendance_id, att.status as attendance_status, att.notes, att.recorded_at
      FROM students st
      LEFT JOIN applicants a ON a.id = st.applicant_id
      LEFT JOIN attendance att ON att.student_id = st.id AND att.session_id = ?
      WHERE st.academic_status = 'نشط'
      ORDER BY st.student_number ASC
    `, [id]);

    const students = (attendanceRecords || []).map((r: any) => enrichWithLegalNameMetadata(r));
    res.json({ success: true, session, students });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'تعذر جلب تفاصيل الجلسة' });
  }
});

// POST /api/attendance/sessions/:id/records
// Batch record attendance for students in a session
router.post('/sessions/:id/records', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: sessionId } = req.params;
    const { records } = req.body; // Array of { student_id, status, notes }

    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'يجب تزويد سجلات حضور صالحة للطلاب' });
      return;
    }

    const session = await queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
    if (!session) {
      res.status(404).json({ error: 'الجلسة غير موجودة' });
      return;
    }

    const validStatuses = ['حاضر', 'غائب', 'متأخر', 'مستأذن', 'غياب بعذر'];
    const recorderId = req.user?.id || 'admin';

    for (const rec of records) {
      if (!rec.student_id || !validStatuses.includes(rec.status)) {
        continue;
      }

      // Check if attendance record already exists
      const existing = await queryOne(`
        SELECT id, status FROM attendance
        WHERE session_id = ? AND student_id = ?
      `, [sessionId, rec.student_id]);

      if (existing) {
        await run(`
          UPDATE attendance
          SET status = ?, notes = ?, recorded_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [rec.status, rec.notes || null, recorderId, existing.id]);
      } else {
        const attId = uuidv4();
        await run(`
          INSERT INTO attendance (id, session_id, student_id, status, recorded_by, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [attId, sessionId, rec.student_id, rec.status, recorderId, rec.notes || null]);
      }

      // Automated internal notification trigger upon Absence or Late
      if (rec.status === 'غائب' || rec.status === 'متأخر') {
        const isLate = rec.status === 'متأخر';
        const notifTitle = isLate ? 'تنبيه: تسجيل تأخر عن اللقاء التعليمي' : 'تنبيه انضباط: تسجيل غياب عن اللقاء التعليمي';
        const notifMsg = isLate
          ? `تم رصد تأخر الطالب في اللقاء التعليمي "${session.title}" بتاريخ ${session.session_date}. نأمل الالتزام بالمواعيد الرسمية.`
          : `تم رصد غياب الطالب عن اللقاء التعليمي "${session.title}" بتاريخ ${session.session_date}. يحق لك تقديم عذر رسمي خلال مهلة أقصاها 48 ساعة.`;

        await notifyStudent(rec.student_id, {
          title: notifTitle,
          message: notifMsg,
          notificationType: isLate ? 'late' : 'absence',
          referenceEntityType: 'attendance',
          referenceEntityId: sessionId,
        });

        await notifyLinkedParents(rec.student_id, {
          title: notifTitle,
          message: notifMsg,
          notificationType: isLate ? 'late' : 'absence',
          referenceEntityType: 'attendance',
          referenceEntityId: sessionId,
        });

        // Check cumulative unexcused absences threshold (3 absences -> warning)
        if (rec.status === 'غائب') {
          const absenceCountRow = await queryOne<{ cnt: number }>(`
            SELECT COUNT(*) as cnt FROM attendance
            WHERE student_id = ? AND status = 'غائب'
          `, [rec.student_id]);

          const unexcusedCount = absenceCountRow?.cnt || 0;
          if (unexcusedCount >= 3) {
            const warningTitle = '⚠️ إنذار انضباط أول: تجاوز حد الغياب المسموح به';
            const warningMsg = `سجل الطالب تراكم (${unexcusedCount}) حالات غياب غير مبررة بعذر رسمي. نسترعي اهتمامكم لتقديم الأعذار أو مراجعة الإدارة لتفادي الحسم من التقييم القيمي.`;

            await notifyStudent(rec.student_id, {
              title: warningTitle,
              message: warningMsg,
              notificationType: 'warning',
              referenceEntityType: 'attendance',
              referenceEntityId: sessionId,
            });

            await notifyLinkedParents(rec.student_id, {
              title: warningTitle,
              message: warningMsg,
              notificationType: 'warning',
              referenceEntityType: 'attendance',
              referenceEntityId: sessionId,
            });
          }
        }
      }
    }

    // Mark session as completed
    await run('UPDATE sessions SET status = ? WHERE id = ?', ['completed', sessionId]);

    res.json({ success: true, message: 'تم رصد الحضور بنجاح وإرسال التنبيهات اللازمة' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'تعذر رصد سجل الحضور' });
  }
});

// ========================================================
// 2. STUDENT ATTENDANCE HISTORY & IDOR-PROTECTED LOOKUP
// ========================================================

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    // Strict IDOR Verification:
    // 1. Admin/Supervisor can access any student
    // 2. Student can only access their own student record
    // 3. Parent can only access their actively linked children
    if (user.role === 'student') {
      const ownStudent = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!ownStudent || ownStudent.id !== studentId) {
        res.status(403).json({ error: 'غير مصرح: لا يمكنك استعراض سجلات طلاب آخرين' });
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
    } else if (user.role !== 'admin' && user.role !== 'supervisor') {
      res.status(403).json({ error: 'غير مصرح للوصول إلى سجل الحضور' });
      return;
    }

    // Fetch student summary
    const student = await queryOne(`
      SELECT s.id, s.student_number, a.student_name, s.legal_full_name, s.name_verification_status, s.educational_track
      FROM students s
      LEFT JOIN applicants a ON a.id = s.applicant_id
      WHERE s.id = ?
    `, [studentId]);

    if (!student) {
      res.status(404).json({ error: 'لم يتم العثور على سجل الطالب' });
      return;
    }

    // Fetch all attendance records
    const records = await query(`
      SELECT a.id, a.session_id, a.status, a.notes, a.recorded_at, a.excuse_id,
             s.title as session_title, s.session_date, s.start_time, s.location,
             e.review_status as excuse_status, e.reason as excuse_reason
      FROM attendance a
      JOIN sessions s ON s.id = a.session_id
      LEFT JOIN attendance_excuses e ON e.id = a.excuse_id
      WHERE a.student_id = ?
      ORDER BY s.session_date DESC, s.start_time DESC
    `, [studentId]);

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let leave = 0;

    for (const r of records) {
      if (r.status === 'حاضر') present++;
      else if (r.status === 'غائب') absent++;
      else if (r.status === 'متأخر') late++;
      else if (r.status === 'غياب بعذر') excused++;
      else if (r.status === 'مستأذن') leave++;
    }

    const totalSessions = records.length;
    // Discipline rate calculation: present (100%), excused (100%), leave (100%), late (50%), absent (0%)
    const disciplineRate = totalSessions > 0
      ? Math.round(((present + excused + leave + (late * 0.5)) / totalSessions) * 100)
      : 100;

    res.json({
      success: true,
      student: enrichWithLegalNameMetadata(student),
      summary: {
        total_sessions: totalSessions,
        present,
        absent,
        late,
        excused,
        leave,
        discipline_rate: disciplineRate,
        unexcused_absences: absent,
        warning_triggered: absent >= 3,
      },
      records,
    });
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ error: 'تعذر جلب سجل الحضور' });
  }
});

// ========================================================
// 3. ATTENDANCE EXCUSES WORKFLOW
// ========================================================

// POST /api/attendance/excuses
// Submit an excuse (By student for themselves, or parent for their child)
router.post('/excuses', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, session_id, excuse_date, excuse_type, reason, document_url } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    if (!student_id || !excuse_date || !excuse_type || !reason) {
      res.status(400).json({ error: 'جميع حقول العذر الإلزامية مطلوبة (معرف الطالب، التاريخ، النوع، والسبب)' });
      return;
    }

    // IDOR Verification
    if (user.role === 'student') {
      const own = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!own || own.id !== student_id) {
        res.status(403).json({ error: 'غير مصرح: لا يمكنك تقديم عذر لطالب آخر' });
        return;
      }
    } else if (user.role === 'parent') {
      const link = await queryOne(`
        SELECT id FROM parent_student
        WHERE parent_user_id = ? AND student_id = ? AND status = 'active'
      `, [user.id, student_id]);
      if (!link) {
        res.status(403).json({ error: 'غير مصرح: الطالب غير مرتبط بحساب ولي الأمر' });
        return;
      }
    } else if (user.role !== 'admin' && user.role !== 'supervisor') {
      res.status(403).json({ error: 'غير مصرح لك بتقديم الأعذار' });
      return;
    }

    // Check 48-hour deadline window
    const targetDate = new Date(excuse_date);
    const now = new Date();
    const diffHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);

    // If more than 48 hours passed since the absence date, only admin can bypass
    if (diffHours > 48 && user.role !== 'admin') {
      res.status(400).json({
        error: 'انقضت المهلة النظامية لتقديم العذر (48 ساعة من موعد الغياب). يرجى مراجعة إدارة المؤسسة مباشرة.',
      });
      return;
    }

    const excuseId = uuidv4();
    await run(`
      INSERT INTO attendance_excuses (
        id, student_id, session_id, excuse_date, submitted_by_user_id,
        submitted_by_role, excuse_type, reason, document_url, review_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      excuseId,
      student_id,
      session_id || null,
      excuse_date,
      user.id,
      user.role,
      excuse_type,
      reason.trim(),
      document_url || null,
    ]);

    // Notify admins of new pending excuse
    const admins = await query<{ id: string }>('SELECT id FROM users WHERE role = ?', ['admin']);
    for (const adm of admins) {
      await createNotification({
        recipientUserId: adm.id,
        recipientRole: 'admin',
        title: 'طلب عذر غياب جديد للمراجعة',
        message: `تم تقديم طلب عذر غياب جديد للطالب بتاريخ ${excuse_date} وهو بانتظار الاعتماد.`,
        notificationType: 'excuse_status',
        referenceEntityType: 'attendance_excuses',
        referenceEntityId: excuseId,
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب العذر بنجاح وهو قيد المراجعة والاعتماد من الإدارة',
      excuse_id: excuseId,
    });
  } catch (error) {
    console.error('Error submitting excuse:', error);
    res.status(500).json({ error: 'تعذر تقديم طلب العذر' });
  }
});

// GET /api/attendance/excuses
router.get('/excuses', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'جلسة المستخدم غير صالحة' });
      return;
    }

    let sql = `
      SELECT e.*, st.student_number, a.student_name, st.legal_full_name, st.name_verification_status, u.name as reviewer_name,
             s.title as session_title
      FROM attendance_excuses e
      JOIN students st ON st.id = e.student_id
      LEFT JOIN applicants a ON a.id = st.applicant_id
      LEFT JOIN users u ON u.id = e.reviewed_by
      LEFT JOIN sessions s ON s.id = e.session_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.role === 'student') {
      const own = await queryOne('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!own) {
        res.json({ success: true, excuses: [] });
        return;
      }
      sql += ' AND e.student_id = ?';
      params.push(own.id);
    } else if (user.role === 'parent') {
      sql += ` AND e.student_id IN (
        SELECT student_id FROM parent_student WHERE parent_user_id = ? AND status = 'active'
      )`;
      params.push(user.id);
    }

    sql += ' ORDER BY e.created_at DESC';
    const rows = await query(sql, params);
    const excuses = (rows || []).map((e: any) => enrichWithLegalNameMetadata(e));
    res.json({ success: true, excuses });
  } catch (error) {
    console.error('Error listing excuses:', error);
    res.status(500).json({ error: 'تعذر جلب طلبات الأعذار' });
  }
});

// PATCH /api/attendance/excuses/:id/review
router.patch('/excuses/:id/review', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { review_status, reviewer_notes } = req.body;

    if (!['approved', 'rejected'].includes(review_status)) {
      res.status(400).json({ error: 'حالة المراجعة يجب أن تكون "approved" أو "rejected"' });
      return;
    }

    const excuse = await queryOne(`
      SELECT e.*, st.student_number, a.student_name
      FROM attendance_excuses e
      JOIN students st ON st.id = e.student_id
      LEFT JOIN applicants a ON a.id = st.applicant_id
      WHERE e.id = ?
    `, [id]);

    if (!excuse) {
      res.status(404).json({ error: 'طلب العذر غير موجود' });
      return;
    }

    const reviewerId = req.user?.id || 'admin';
    await run(`
      UPDATE attendance_excuses
      SET review_status = ?, reviewer_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [review_status, reviewer_notes || null, reviewerId, id]);

    // If approved, update attendance status to 'غياب بعذر' and link excuse_id
    if (review_status === 'approved') {
      // Find matching attendance record
      if (excuse.session_id) {
        await run(`
          UPDATE attendance
          SET status = 'غياب بعذر', excuse_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ? AND student_id = ?
        `, [id, excuse.session_id, excuse.student_id]);
      } else {
        // Find attendance record by excuse_date
        await run(`
          UPDATE attendance
          SET status = 'غياب بعذر', excuse_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE student_id = ? AND session_id IN (
            SELECT id FROM sessions WHERE session_date = ?
          )
        `, [id, excuse.student_id, excuse.excuse_date]);
      }

      const notifTitle = '✅ تم قبول عذر الغياب رسميًا';
      const notifMsg = `تمت مراجعة وقبول عذر الغياب المقدم للطالب عن موعد (${excuse.excuse_date})، وتعديل الحالة إلى "غياب بعذر" دون أي حسم.`;

      await notifyStudent(excuse.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'excuse_status',
        referenceEntityType: 'attendance_excuses',
        referenceEntityId: id,
      });

      await notifyLinkedParents(excuse.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'excuse_status',
        referenceEntityType: 'attendance_excuses',
        referenceEntityId: id,
      });
    } else {
      const notifTitle = '❌ نتيجة مراجعة عذر الغياب';
      const notifMsg = `تمت مراجعة عذر الغياب عن موعد (${excuse.excuse_date}) ولم يُعتمد. ${reviewer_notes ? 'السبب: ' + reviewer_notes : ''}`;

      await notifyStudent(excuse.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'excuse_status',
        referenceEntityType: 'attendance_excuses',
        referenceEntityId: id,
      });

      await notifyLinkedParents(excuse.student_id, {
        title: notifTitle,
        message: notifMsg,
        notificationType: 'excuse_status',
        referenceEntityType: 'attendance_excuses',
        referenceEntityId: id,
      });
    }

    res.json({
      success: true,
      message: review_status === 'approved' ? 'تم قبول العذر وتحديث سجل الحضور' : 'تم رفض العذر وإشعار مقدم الطلب',
    });
  } catch (error) {
    console.error('Error reviewing excuse:', error);
    res.status(500).json({ error: 'تعذر مراجعة طلب العذر' });
  }
});

export default router;
