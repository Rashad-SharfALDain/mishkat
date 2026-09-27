import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, run, queryOne } from '../db/database';
import { requireAdmin, requireStrictAdmin, AuthRequest } from '../middleware/auth';
import { validateFourPartLegalName } from '../utils/arabicName';

const router = Router();

// Helper to generate next unique student number: STU-YYYY-XXXXX
async function generateStudentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;
  
  // Find highest number for the current year
  const rows = await query<{ student_number: string }>(`
    SELECT student_number FROM students 
    WHERE student_number LIKE ? 
    ORDER BY student_number DESC 
    LIMIT 1
  `, [`${prefix}%`]);

  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].student_number;
    const parts = lastNum.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
}

// Generate secure temporary password satisfying complexity rules
function generateTempPassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Mishkat#${randomPart}2026!`;
}

// Helper to record audit log
async function logAudit(userId: string | undefined, action: string, entityType: string, entityId: string, metadata: any) {
  try {
    await run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), userId || null, action, entityType, entityId, JSON.stringify(metadata)]);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

// POST /api/admin/students/from-applicant/:applicantId
// Create student record + user account from an accepted applicant (Strict Admin only)
router.post('/students/from-applicant/:applicantId', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicantId } = req.params;

    // 1. Fetch applicant
    const applicant = await queryOne('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    if (!applicant) {
      res.status(404).json({ error: 'طلب التسجيل غير موجود' });
      return;
    }

    // 2. Enforce business rule: applicant must be accepted ('مقبول')
    if (applicant.status !== 'مقبول') {
      res.status(400).json({
        error: `لا يمكن إنشاء حساب طالب إلا للمتقدمين المقبولين رسميًا. حالة الطلب الحالية: "${applicant.status}"`,
      });
      return;
    }

    // 3. Verify student does not already exist
    const existingStudent = await queryOne('SELECT id, student_number FROM students WHERE applicant_id = ?', [applicantId]);
    if (existingStudent) {
      res.status(400).json({
        error: `حساب الطالب منشأ مسبقًا لهذا المتقدم برقم: ${existingStudent.student_number}`,
        student_number: existingStudent.student_number,
      });
      return;
    }

    // 4. Generate unique student number & temporary setup credentials
    const studentNumber = await generateStudentNumber();
    const tempPassword = generateTempPassword();
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    // Assign student email or identifier email
    let studentEmail = (applicant.email && applicant.email.trim() !== '')
      ? applicant.email.trim().toLowerCase()
      : `${studentNumber.toLowerCase()}@mishkat.student`;

    // Check if user account with this email already exists
    let existingUser = await queryOne<{ id: string; role: string }>('SELECT id, role FROM users WHERE email = ?', [studentEmail]);
    if (existingUser) {
      const isLinkedToStudent = await queryOne('SELECT id FROM students WHERE user_id = ?', [existingUser.id]);
      if (isLinkedToStudent || existingUser.role === 'admin') {
        // Ensure complete account isolation by assigning dedicated student email
        studentEmail = `${studentNumber.toLowerCase()}@mishkat.student`;
        existingUser = null;
      }
    }

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      // Update role and set password
      await run(`
        UPDATE users 
        SET role = 'student', password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [passwordHash, userId]);
    } else {
      userId = uuidv4();
      const displayName = applicant.legal_full_name || applicant.student_name;
      await run(`
        INSERT INTO users (id, name, email, phone, password_hash, role, must_change_password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'student', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [userId, displayName, studentEmail, applicant.phone, passwordHash]);
    }

    // 5. Determine primary track
    let chosenTrack = 'العلوم الشرعية';
    try {
      const tracks = typeof applicant.interested_tracks === 'string'
        ? JSON.parse(applicant.interested_tracks || '[]')
        : (applicant.interested_tracks || []);
      if (Array.isArray(tracks) && tracks.length > 0) {
        chosenTrack = tracks[0];
      }
    } catch {
      // keep fallback
    }

    // 6. Create Student Record (inheriting legal four-part name & verification attributes)
    const studentId = uuidv4();
    const admissionDate = new Date().toISOString().split('T')[0];

    const studentLegalFull = applicant.legal_full_name || applicant.student_name;
    const studentVerificationStatus = applicant.name_verification_status || 'legacy_unverified';

    await run(`
      INSERT INTO students (
        id, applicant_id, user_id, student_number, admission_date,
        academic_status, current_grade, current_level, educational_track,
        emergency_contact,
        legal_first_name, legal_second_name, legal_third_name, legal_fourth_name,
        legal_full_name, normalized_legal_name, legal_name_normalized,
        name_verification_status, name_verified_from, name_verified_by, name_verified_at,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        'نشط', ?, 'المستوى الأول', ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      studentId,
      applicantId,
      userId,
      studentNumber,
      admissionDate,
      applicant.grade,
      chosenTrack,
      applicant.guardian_phone || applicant.phone,
      applicant.legal_first_name || null,
      applicant.legal_second_name || null,
      applicant.legal_third_name || null,
      applicant.legal_fourth_name || null,
      studentLegalFull,
      applicant.normalized_legal_name || null,
      applicant.legal_name_normalized || applicant.normalized_legal_name || null,
      studentVerificationStatus,
      applicant.name_verified_from || null,
      applicant.name_verified_by || null,
      applicant.name_verified_at || null,
    ]);

    // 7. Seed initial active activities for this student
    const activeActivities = await query<{ id: string }>('SELECT id FROM activities WHERE status = "active"');
    for (const act of activeActivities) {
      await run(`
        INSERT OR IGNORE INTO student_activities (id, student_id, activity_id, status, created_at)
        VALUES (?, ?, ?, 'لم يبدأ', CURRENT_TIMESTAMP)
      `, [uuidv4(), studentId, act.id]);
    }

    // 8. Update applicant status to 'مكتمل' (accepted & fully enrolled)
    await run('UPDATE applicants SET status = "مكتمل", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [applicantId]);

    // 9. Audit log
    await logAudit(req.user?.id, 'CREATE_STUDENT_ACCOUNT', 'students', studentId, {
      student_number: studentNumber,
      applicant_id: applicantId,
      student_name: applicant.student_name,
      email: studentEmail,
    });

    res.status(201).json({
      success: true,
      message: `تم اعتماد وتسجيل الطالب بنجاح، وإصدار الرقم الأكاديمي: ${studentNumber}`,
      student: {
        id: studentId,
        student_number: studentNumber,
        student_name: applicant.student_name,
        admission_date: admissionDate,
        academic_status: 'نشط',
        current_grade: applicant.grade,
        educational_track: chosenTrack,
      },
      credentials: {
        identifier: studentNumber,
        email: studentEmail,
        temporary_password: tempPassword,
        must_change_password: true,
      },
    });
  } catch (error) {
    console.error('Error creating student from applicant:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء إنشاء ملف الطالب' });
  }
});

// GET /api/admin/students
// List, search, and filter enrolled students
router.get('/students', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, track } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.student_number,
        s.admission_date,
        s.academic_status,
        s.current_grade,
        s.current_level,
        s.educational_track,
        s.legal_first_name,
        s.legal_second_name,
        s.legal_third_name,
        s.legal_fourth_name,
        s.legal_full_name,
        s.name_verification_status,
        s.created_at,
        a.id as applicant_id,
        COALESCE(s.legal_full_name, a.legal_full_name, a.student_name) as student_name,
        a.student_name as legacy_student_name,
        a.city,
        a.school,
        a.phone,
        a.guardian_name,
        a.guardian_relationship,
        a.guardian_phone,
        u.id as user_id,
        u.email as user_email,
        u.must_change_password
      FROM students s
      LEFT JOIN applicants a ON a.id = s.applicant_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'الكل') {
      sql += ' AND s.academic_status = ?';
      params.push(status);
    }

    if (track && track !== 'الكل') {
      sql += ' AND s.educational_track = ?';
      params.push(track);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      sql += ' AND (s.student_number LIKE ? OR a.student_name LIKE ? OR a.phone LIKE ? OR a.school LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY s.created_at DESC';

    const students = await query(sql, params);
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة الطلاب' });
  }
});

// GET /api/admin/students/:id
// Get detailed student profile for admin
router.get('/students/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await queryOne(`
      SELECT 
        s.*,
        a.student_name,
        a.application_number,
        a.date_of_birth,
        a.gender,
        a.city,
        a.school,
        a.phone as applicant_phone,
        a.email as applicant_email,
        a.guardian_name,
        a.guardian_relationship,
        a.guardian_phone,
        a.academic_level,
        a.interested_tracks,
        a.motivation,
        a.skills,
        a.leadership_experience,
        u.email as account_email,
        u.must_change_password
      FROM students s
      LEFT JOIN applicants a ON a.id = s.applicant_id
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
    `, [id]);

    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    // Parse tracks if JSON string
    if (typeof student.interested_tracks === 'string') {
      try {
        student.interested_tracks = JSON.parse(student.interested_tracks);
      } catch {
        student.interested_tracks = [];
      }
    }

    // Count activities summary
    const activityStats = await queryOne(`
      SELECT 
        COUNT(*) as total_activities,
        SUM(CASE WHEN status = 'تم التسليم' OR status = 'تم التقييم' THEN 1 ELSE 0 END) as completed_activities
      FROM student_activities
      WHERE student_id = ?
    `, [id]);

    res.json({
      success: true,
      student,
      activity_stats: {
        total: activityStats?.total_activities || 0,
        completed: activityStats?.completed_activities || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تفاصيل ملف الطالب' });
  }
});

// PATCH /api/admin/students/:id
// Update student academic status, assigned track, or legal name parts (Strict Admin only)
router.patch('/students/:id', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      academic_status,
      educational_track,
      current_grade,
      current_level,
      emergency_contact,
      legal_first_name: reqFirst,
      legal_second_name: reqSecond,
      legal_third_name: reqThird,
      legal_fourth_name: reqFourth,
      name_verification_status: reqVerificationStatus,
      name_verified_from: reqVerifiedFrom,
      name_verification_notes: reqVerificationNotes,
    } = req.body;

    const student = await queryOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    const auditChanges: Record<string, any> = {};

    if (academic_status !== undefined) {
      const allowedStatuses = ['نشط', 'متوقف مؤقتًا', 'متخرج', 'منسحب', 'غير نشط'];
      if (!allowedStatuses.includes(academic_status)) {
        res.status(400).json({ error: `الحالة الأكاديمية غير صالحة. الخيارات المتاحة: ${allowedStatuses.join('، ')}` });
        return;
      }
      updates.push('academic_status = ?');
      params.push(academic_status);
      auditChanges['academic_status'] = { old: student.academic_status, new: academic_status };
    }

    if (educational_track !== undefined) {
      updates.push('educational_track = ?');
      params.push(educational_track);
    }

    if (current_grade !== undefined) {
      updates.push('current_grade = ?');
      params.push(current_grade);
    }

    if (current_level !== undefined) {
      updates.push('current_level = ?');
      params.push(current_level);
    }

    if (emergency_contact !== undefined) {
      updates.push('emergency_contact = ?');
      params.push(emergency_contact);
    }

    // Legal Name updates
    let updatedFullName: string | null = null;
    if (
      reqFirst !== undefined ||
      reqSecond !== undefined ||
      reqThird !== undefined ||
      reqFourth !== undefined
    ) {
      const candidateFirst = reqFirst !== undefined ? reqFirst : student.legal_first_name;
      const candidateSecond = reqSecond !== undefined ? reqSecond : student.legal_second_name;
      const candidateThird = reqThird !== undefined ? reqThird : student.legal_third_name;
      const candidateFourth = reqFourth !== undefined ? reqFourth : student.legal_fourth_name;

      const nameValidation = validateFourPartLegalName({
        legal_first_name: candidateFirst,
        legal_second_name: candidateSecond,
        legal_third_name: candidateThird,
        legal_fourth_name: candidateFourth,
      });

      if (!nameValidation.valid || !nameValidation.data) {
        res.status(400).json({
          error: nameValidation.errors.join('، '),
          errors: nameValidation.errors,
        });
        return;
      }

      const {
        legal_first_name,
        legal_second_name,
        legal_third_name,
        legal_fourth_name,
        legal_full_name,
        normalized_legal_name,
      } = nameValidation.data;

      updates.push(
        'legal_first_name = ?',
        'legal_second_name = ?',
        'legal_third_name = ?',
        'legal_fourth_name = ?',
        'legal_full_name = ?',
        'normalized_legal_name = ?',
        'legal_name_normalized = ?'
      );
      params.push(
        legal_first_name,
        legal_second_name,
        legal_third_name,
        legal_fourth_name,
        legal_full_name,
        normalized_legal_name,
        normalized_legal_name
      );

      updatedFullName = legal_full_name;
      auditChanges['legal_full_name'] = { old: student.legal_full_name, new: legal_full_name };

      if (student.name_verification_status === 'verified') {
        updates.push(
          "name_verification_status = 'pending'",
          'name_verified_by = NULL',
          'name_verified_at = NULL'
        );
        auditChanges['name_verification_status'] = { old: 'verified', new: 'pending' };
      }
    }

    // Verification status update (Strict Admin only)
    if (reqVerificationStatus !== undefined) {
      if (reqVerificationStatus === 'verified') {
        const hasParts =
          (reqFirst || student.legal_first_name) &&
          (reqSecond || student.legal_second_name) &&
          (reqThird || student.legal_third_name) &&
          (reqFourth || student.legal_fourth_name);

        if (!hasParts) {
          res.status(400).json({
            error: 'لا يمكن اعتماد الاسم القانوني للطالب قبل اكتمال حقول الاسم الرباعي الأربعة.',
          });
          return;
        }

        updates.push(
          "name_verification_status = 'verified'",
          'name_verified_from = ?',
          'name_verified_by = ?',
          'name_verified_at = CURRENT_TIMESTAMP'
        );
        params.push(reqVerifiedFrom || 'national_id', req.user?.id);
        if (reqVerificationNotes) {
          updates.push('name_verification_notes = ?');
          params.push(reqVerificationNotes);
        }

        auditChanges['name_verification_status'] = {
          old: student.name_verification_status,
          new: 'verified',
        };
      } else {
        updates.push('name_verification_status = ?');
        params.push(reqVerificationStatus);
        auditChanges['name_verification_status'] = {
          old: student.name_verification_status,
          new: reqVerificationStatus,
        };
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);

    // Sync users table name if legal_full_name was updated
    if (updatedFullName && student.user_id) {
      await run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        updatedFullName,
        student.user_id,
      ]);
    }

    // Audit log
    await logAudit(req.user?.id, 'UPDATE_STUDENT_RECORD', 'students', id, {
      student_number: student.student_number,
      changes: auditChanges,
    });

    res.json({ success: true, message: 'تم تحديث بيانات الطالب بنجاح' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'تعذر تحديث بيانات الطالب' });
  }
});

// POST /api/admin/students/:id/verify-name
// Strictly verify the legal four-part name of a student (Strict Admin only)
router.post('/students/:id/verify-name', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, status, decision, verified_from, notes } = req.body;

    const student = await queryOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const resolvedAction = (action || decision || status || 'verify').toLowerCase().trim();

    if (!['verify', 'verified', 'reject', 'rejected', 'correction_requested'].includes(resolvedAction)) {
      res.status(400).json({
        error: 'إجراء التحقق غير صالح. الخيارات المتاحة: verify, reject, correction_requested',
      });
      return;
    }

    if (resolvedAction === 'verify' || resolvedAction === 'verified') {
      if (!student.legal_first_name || !student.legal_second_name || !student.legal_third_name || !student.legal_fourth_name) {
        res.status(400).json({
          error: 'لا يمكن اعتماد الاسم القانوني قبل اكتمال حقول الاسم الرباعي الأربعة للطالب.',
        });
        return;
      }

      const verifiedFrom = verified_from || 'national_id';
      const verificationNotes = (notes && typeof notes === 'string' && notes.trim().length > 0)
        ? notes.trim()
        : 'تم اعتماد وتوثيق الاسم القانوني الرباعي للطالب';

      await run(`
        UPDATE students
        SET name_verification_status = 'verified',
            name_verified_from = ?,
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [verifiedFrom, req.user?.id, verificationNotes, id]);

      if (student.applicant_id) {
        await run(`
          UPDATE applicants
          SET name_verification_status = 'verified',
              name_verified_from = ?,
              name_verified_by = ?,
              name_verified_at = CURRENT_TIMESTAMP,
              name_verification_notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [verifiedFrom, req.user?.id, verificationNotes, student.applicant_id]);

        await run(`
          UPDATE applicant_documents
          SET verification_status = 'verified',
              verified_by = ?,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE applicant_id = ?
        `, [req.user?.id, student.applicant_id]);
      }

      await logAudit(req.user?.id, 'LEGAL_NAME_VERIFIED', 'students', id, {
        previous_status: student.name_verification_status,
        new_status: 'verified',
        legal_full_name: student.legal_full_name,
        verified_from: verifiedFrom,
        notes: verificationNotes,
      });

      res.json({
        success: true,
        message: 'تم اعتماد وتوثيق الاسم القانوني الرباعي للطالب بنجاح',
        name_verification_status: 'verified',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }

    if (resolvedAction === 'reject' || resolvedAction === 'rejected') {
      if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
        res.status(400).json({ error: 'يرجى تدوين سبب رفض اعتماد الاسم والوثيقة في خانة الملاحظات (إلزامي).' });
        return;
      }
      const rejectionReason = notes.trim();

      await run(`
        UPDATE students
        SET name_verification_status = 'rejected',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user?.id, rejectionReason, id]);

      if (student.applicant_id) {
        await run(`
          UPDATE applicants
          SET name_verification_status = 'rejected',
              name_verified_by = ?,
              name_verified_at = CURRENT_TIMESTAMP,
              name_verification_notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [req.user?.id, rejectionReason, student.applicant_id]);

        await run(`
          UPDATE applicant_documents
          SET verification_status = 'rejected',
              rejection_reason = ?,
              verified_by = ?,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE applicant_id = ?
        `, [rejectionReason, req.user?.id, student.applicant_id]);
      }

      await logAudit(req.user?.id, 'LEGAL_NAME_REJECTED', 'students', id, {
        previous_status: student.name_verification_status,
        new_status: 'rejected',
        legal_full_name: student.legal_full_name,
        rejection_reason: rejectionReason,
      });

      res.json({
        success: true,
        message: 'تم تسجيل رفض اعتماد الاسم والوثيقة للطالب بنجاح',
        name_verification_status: 'rejected',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }

    if (resolvedAction === 'correction_requested') {
      if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
        res.status(400).json({ error: 'يرجى تدوين الملاحظات والمطلوب تصحيحه بدقة في خانة الملاحظات (إلزامي).' });
        return;
      }
      const correctionNotes = notes.trim();

      await run(`
        UPDATE students
        SET name_verification_status = 'correction_requested',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user?.id, correctionNotes, id]);

      if (student.applicant_id) {
        await run(`
          UPDATE applicants
          SET name_verification_status = 'correction_requested',
              name_verified_by = ?,
              name_verified_at = CURRENT_TIMESTAMP,
              name_verification_notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [req.user?.id, correctionNotes, student.applicant_id]);

        await run(`
          UPDATE applicant_documents
          SET verification_status = 'pending',
              rejection_reason = ?,
              verified_by = ?,
              verified_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE applicant_id = ?
        `, [correctionNotes, req.user?.id, student.applicant_id]);
      }

      await logAudit(req.user?.id, 'LEGAL_NAME_CORRECTION_REQUESTED', 'students', id, {
        previous_status: student.name_verification_status,
        new_status: 'correction_requested',
        legal_full_name: student.legal_full_name,
        correction_notes: correctionNotes,
      });

      res.json({
        success: true,
        message: 'تم تسجيل طلب تصحيح الاسم والوثيقة للطالب بنجاح',
        name_verification_status: 'correction_requested',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }
  } catch (error) {
    console.error('Error verifying student legal name:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء اعتماد الاسم القانوني للطالب' });
  }
});

// POST /api/admin/students/:id/reset-access
// Reset student password and force change on next login (Strict Admin only)
router.post('/students/:id/reset-access', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await queryOne<{ id: string; user_id: string; student_number: string }>(`
      SELECT id, user_id, student_number FROM students WHERE id = ?
    `, [id]);

    if (!student) {
      res.status(404).json({ error: 'ملف الطالب غير موجود' });
      return;
    }

    const tempPassword = generateTempPassword();
    const newHash = bcrypt.hashSync(tempPassword, 10);

    await run(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newHash, student.user_id]);

    // Audit log
    await logAudit(req.user?.id, 'RESET_STUDENT_ACCESS', 'students', id, {
      student_number: student.student_number,
    });

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة مرور الطالب بنجاح',
      student_number: student.student_number,
      temporary_password: tempPassword,
    });
  } catch (error) {
    console.error('Error resetting student access:', error);
    res.status(500).json({ error: 'تعذر إعادة تعيين كلمة مرور الطالب' });
  }
});

export default router;
