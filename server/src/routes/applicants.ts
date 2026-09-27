import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run, queryOne } from '../db/database';
import { requireAuth, requireAdmin, requireStrictAdmin, AuthRequest } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateFourPartLegalName, normalizeArabicText, detectPotentialDuplicate } from '../utils/arabicName';
import { recordAudit } from '../utils/auditLogger';

const router = Router();

// POST /api/apply (Public registration endpoint)
router.post('/apply', rateLimiter(25, 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check if registration is open
    const regStatus = await queryOne('SELECT value FROM settings WHERE key = "registration_status"');
    if (regStatus && regStatus.value === 'closed') {
      res.status(403).json({
        error: 'التسجيل مغلق حاليًا، يرجى متابعة الإعلانات القادمة لمواعيد فتح باب القبول.',
      });
      return;
    }

    const {
      legal_first_name: rawFirstName,
      legal_second_name: rawSecondName,
      legal_third_name: rawThirdName,
      legal_fourth_name: rawFourthName,
      student_name: rawStudentName,
      name_verification_status: clientStatus,
      date_of_birth,
      gender,
      grade,
      school,
      city,
      phone,
      email,
      guardian_name,
      guardian_relationship,
      guardian_phone,
      guardian_email,
      academic_level,
      interested_tracks,
      motivation,
      skills,
      leadership_experience,
    } = req.body;

    // Security invariant: Client cannot set status to 'verified'
    if (clientStatus === 'verified' || req.body.name_verified_by || req.body.name_verified_at) {
      res.status(400).json({
        error: 'لا يمكن تعيين حالة التحقق من الاسم إلى معتمد عبر واجهة التسجيل أو العميل.',
      });
      return;
    }

    // Resolve four legal name parts (from explicit fields or 4-part student_name)
    let firstName = rawFirstName;
    let secondName = rawSecondName;
    let thirdName = rawThirdName;
    let fourthName = rawFourthName;

    if (
      firstName === undefined &&
      secondName === undefined &&
      thirdName === undefined &&
      fourthName === undefined &&
      rawStudentName
    ) {
      const parts = rawStudentName.trim().split(/\s+/);
      if (parts.length === 4) {
        firstName = parts[0];
        secondName = parts[1];
        thirdName = parts[2];
        fourthName = parts[3];
      }
    }

    // Strict Server-side Legal Name Validation
    const nameValidation = validateFourPartLegalName({
      legal_first_name: firstName,
      legal_second_name: secondName,
      legal_third_name: thirdName,
      legal_fourth_name: fourthName,
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

    // Standard field validations
    if (!date_of_birth) {
      res.status(400).json({ error: 'يرجى تحديد تاريخ ميلاد الطالب' });
      return;
    }
    if (!gender) {
      res.status(400).json({ error: 'يرجى تحديد الجنس' });
      return;
    }
    if (!grade) {
      res.status(400).json({ error: 'يرجى اختيار الصف الدراسي' });
      return;
    }
    if (!school) {
      res.status(400).json({ error: 'يرجى كتابة اسم المدرسة الحالية' });
      return;
    }
    if (!city) {
      res.status(400).json({ error: 'يرجى كتابة المدينة' });
      return;
    }
    if (!phone || phone.trim().length < 8) {
      res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح للطالب' });
      return;
    }
    if (!guardian_name || guardian_name.trim().length < 4) {
      res.status(400).json({ error: 'يرجى كتابة اسم ولي الأمر بالكامل' });
      return;
    }
    if (!guardian_relationship) {
      res.status(400).json({ error: 'يرجى تحديد صلة القرابة بولي الأمر' });
      return;
    }
    if (!guardian_phone || guardian_phone.trim().length < 8) {
      res.status(400).json({ error: 'يرجى إدخال رقم هاتف ولي الأمر' });
      return;
    }
    if (!motivation || motivation.trim().length < 15) {
      res.status(400).json({ error: 'يرجى كتابة نبذة كافية عن سبب الرغبة في الالتحاق بالبرنامج (١٥ حرفاً على الأقل)' });
      return;
    }

    // 2. Duplicate similarity detection (informational flag, non-blocking)
    const duplicateCheck = await detectPotentialDuplicate(
      normalized_legal_name,
      date_of_birth,
      phone.trim()
    );

    let initialNotes = '';
    if (duplicateCheck.hasMatch) {
      const matchTypeLabel = duplicateCheck.matchedType === 'student' ? 'طالب حالي' : 'طلب تقديم سابق';
      const levelLabel = duplicateCheck.matchLevel === 'probable_duplicate' ? 'تطابق محتمل جداً (الاسم وتاريخ الميلاد/الهاتف)' : 'تشابه اسم محتمل';
      initialNotes = `[تنبيه تدقيق: ${levelLabel} مع ${matchTypeLabel} رقم ${duplicateCheck.matchedIdentifier} (${duplicateCheck.matchedName})]`;
    }

    // 3. Generate unique application number (e.g. APP-2026-00001)
    const countRow = await queryOne('SELECT COUNT(*) as cnt FROM applicants');
    const nextSeq = (countRow?.cnt || 0) + 1;
    const year = new Date().getFullYear();
    const appNumber = `APP-${year}-${String(nextSeq).padStart(5, '0')}`;
    const applicantId = uuidv4();

    // 4. Insert applicant with 4-part legal name and pending status
    await run(`
      INSERT INTO applicants (
        id, application_number, student_name,
        legal_first_name, legal_second_name, legal_third_name, legal_fourth_name,
        legal_full_name, normalized_legal_name, legal_name_normalized,
        name_verification_status, name_verified_from, name_verified_by, name_verified_at,
        date_of_birth, gender,
        grade, school, city, phone, email, guardian_name,
        guardian_relationship, guardian_phone, guardian_email,
        academic_level, interested_tracks, motivation, skills,
        leadership_experience, status, internal_notes
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        'pending', 'self_declared', NULL, NULL,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, 'جديد', ?
      )
    `, [
      applicantId,
      appNumber,
      legal_full_name, // student_name synced for backwards compatibility
      legal_first_name,
      legal_second_name,
      legal_third_name,
      legal_fourth_name,
      legal_full_name,
      normalized_legal_name,
      normalized_legal_name,
      date_of_birth,
      gender,
      grade,
      school.trim(),
      city.trim(),
      phone.trim(),
      email ? email.trim() : null,
      guardian_name.trim(),
      guardian_relationship.trim(),
      guardian_phone.trim(),
      guardian_email ? guardian_email.trim() : null,
      academic_level || 'جيد جدًا',
      Array.isArray(interested_tracks) ? JSON.stringify(interested_tracks) : interested_tracks,
      motivation.trim(),
      skills ? skills.trim() : '',
      leadership_experience ? leadership_experience.trim() : '',
      initialNotes,
    ]);

    // 5. Audit trail: Log registration with legal name
    await recordAudit(
      null,
      'APPLICANT_REGISTRATION',
      'applicants',
      applicantId,
      {
        application_number: appNumber,
        legal_full_name,
        name_verification_status: 'pending',
        duplicate_check: duplicateCheck.hasMatch ? duplicateCheck.matchLevel : 'no_match',
      },
      req.ip
    );

    // 6. Record fee placeholder in payments
    const feeSetting = await queryOne('SELECT value FROM settings WHERE key = "registration_fee"');
    const feeAmount = feeSetting ? parseFloat(feeSetting.value) : 500;
    const paymentId = uuidv4();
    await run(`
      INSERT INTO payments (id, application_id, amount, currency, payment_status, payment_type, notes)
      VALUES (?, ?, ?, 'SAR', 'pending', 'registration', 'مساهمة رمزية - قابلة للإعفاء أو الكفالة')
    `, [paymentId, applicantId, feeAmount]);

    res.status(201).json({
      success: true,
      applicant_id: applicantId,
      application_number: appNumber,
      student_name: legal_full_name,
      legal_full_name,
      name_verification_status: 'pending',
      duplicate_flag: duplicateCheck.hasMatch ? duplicateCheck.matchLevel : undefined,
      message: 'تم استلام طلب التسجيل بنجاح، وستتم مراجعته من قِبل لجنة القبول والتسجيل والتواصل معكم.',
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلب التسجيل، يرجى المحاولة مرة أخرى.' });
  }
});

// GET /api/admin/dashboard (Admin overview statistics)
router.get('/admin/dashboard', requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalRow = await queryOne('SELECT COUNT(*) as count FROM applicants');
    const newRow = await queryOne('SELECT COUNT(*) as count FROM applicants WHERE status = "جديد"');
    const inReviewRow = await queryOne('SELECT COUNT(*) as count FROM applicants WHERE status = "قيد المراجعة"');
    const acceptedRow = await queryOne('SELECT COUNT(*) as count FROM applicants WHERE status = "مقبول"');
    const rejectedRow = await queryOne('SELECT COUNT(*) as count FROM applicants WHERE status = "مرفوض"');
    const completedRow = await queryOne('SELECT COUNT(*) as count FROM applicants WHERE status = "مكتمل"');
    const studentsTotalRow = await queryOne('SELECT COUNT(*) as count FROM students');

    const recentApplicants = await query(`
      SELECT id, application_number, student_name, grade, city, phone, status, created_at
      FROM applicants
      ORDER BY created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      stats: {
        total: totalRow?.count || 0,
        new: newRow?.count || 0,
        inReview: inReviewRow?.count || 0,
        accepted: acceptedRow?.count || 0,
        rejected: rejectedRow?.count || 0,
        completed: completedRow?.count || 0,
        studentsCount: studentsTotalRow?.count || 0,
      },
      recentApplicants,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'تعذر جلب إحصائيات لوحة التحكم' });
  }
});

// GET /api/admin/applicants (List and filter applicants)
router.get('/admin/applicants', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    let sql = 'SELECT * FROM applicants WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'الكل') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      sql += ' AND (student_name LIKE ? OR application_number LIKE ? OR phone LIKE ? OR school LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query(sql, params);
    const applicants = rows.map((app) => ({
      ...app,
      interested_tracks: typeof app.interested_tracks === 'string'
        ? JSON.parse(app.interested_tracks || '[]')
        : (app.interested_tracks || []),
    }));

    res.json({ success: true, applicants });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة المتقدمين' });
  }
});

// GET /api/admin/applicants/:id (Single applicant details)
router.get('/admin/applicants/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const applicant = await queryOne(`
      SELECT a.*, u.name as name_verified_by_name
      FROM applicants a
      LEFT JOIN users u ON u.id = a.name_verified_by
      WHERE a.id = ?
    `, [id]);

    if (!applicant) {
      res.status(404).json({ error: 'طلب التسجيل غير موجود' });
      return;
    }

    applicant.interested_tracks = typeof applicant.interested_tracks === 'string'
      ? JSON.parse(applicant.interested_tracks || '[]')
      : (applicant.interested_tracks || []);

    const payment = await queryOne('SELECT * FROM payments WHERE application_id = ?', [id]);
    const existingStudent = await queryOne('SELECT id, student_number, academic_status, created_at FROM students WHERE applicant_id = ?', [id]);

    res.json({ success: true, applicant, payment, existing_student: existingStudent });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تفاصيل الطلب' });
  }
});

// PATCH /api/admin/applicants/:id (Update status, legal name parts, and internal notes)
router.patch('/admin/applicants/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      internal_notes,
      legal_first_name: reqFirst,
      legal_second_name: reqSecond,
      legal_third_name: reqThird,
      legal_fourth_name: reqFourth,
      name_verification_status: reqVerificationStatus,
      name_verified_from: reqVerifiedFrom,
      name_verification_notes: reqVerificationNotes,
    } = req.body;

    const applicant = await queryOne('SELECT * FROM applicants WHERE id = ?', [id]);
    if (!applicant) {
      res.status(404).json({ error: 'طلب التسجيل غير موجود' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];
    const auditChanges: Record<string, { old: any; new: any }> = {};

    // 1. Status update
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      auditChanges['status'] = { old: applicant.status, new: status };
    }

    // 2. Internal notes update
    if (internal_notes !== undefined) {
      updates.push('internal_notes = ?');
      params.push(internal_notes);
    }

    // 3. Legal Name parts update (if provided)
    if (
      reqFirst !== undefined ||
      reqSecond !== undefined ||
      reqThird !== undefined ||
      reqFourth !== undefined
    ) {
      const candidateFirst = reqFirst !== undefined ? reqFirst : applicant.legal_first_name;
      const candidateSecond = reqSecond !== undefined ? reqSecond : applicant.legal_second_name;
      const candidateThird = reqThird !== undefined ? reqThird : applicant.legal_third_name;
      const candidateFourth = reqFourth !== undefined ? reqFourth : applicant.legal_fourth_name;

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
        'legal_name_normalized = ?',
        'student_name = ?'
      );
      params.push(
        legal_first_name,
        legal_second_name,
        legal_third_name,
        legal_fourth_name,
        legal_full_name,
        normalized_legal_name,
        normalized_legal_name,
        legal_full_name
      );

      auditChanges['legal_full_name'] = {
        old: applicant.legal_full_name || applicant.student_name,
        new: legal_full_name,
      };

      // If name was previously verified and parts were edited, reset to pending
      if (applicant.name_verification_status === 'verified') {
        updates.push(
          "name_verification_status = 'pending'",
          'name_verified_by = NULL',
          'name_verified_at = NULL'
        );
        auditChanges['name_verification_status'] = { old: 'verified', new: 'pending' };
      }
    }

    // 4. Verification status update (Strict Admin ONLY)
    if (reqVerificationStatus !== undefined) {
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          error: 'غير مصرح: تعديل حالة التحقق من الاسم القانوني مقتصر على الإدارة العليا للمؤسسة فقط (Strict Admin)',
        });
        return;
      }

      if (reqVerificationStatus === 'verified') {
        // Enforce: Must have 4 parts before verifying
        const hasParts =
          (reqFirst || applicant.legal_first_name) &&
          (reqSecond || applicant.legal_second_name) &&
          (reqThird || applicant.legal_third_name) &&
          (reqFourth || applicant.legal_fourth_name);

        if (!hasParts) {
          res.status(400).json({
            error: 'لا يمكن اعتماد الاسم القانوني قبل استكمال أجزاء الاسم الرباعي الأربعة للمتقدم.',
          });
          return;
        }

        updates.push(
          "name_verification_status = 'verified'",
          'name_verified_from = ?',
          'name_verified_by = ?',
          'name_verified_at = CURRENT_TIMESTAMP'
        );
        params.push(reqVerifiedFrom || 'national_id', req.user.id);
        if (reqVerificationNotes) {
          updates.push('name_verification_notes = ?');
          params.push(reqVerificationNotes);
        }

        auditChanges['name_verification_status'] = {
          old: applicant.name_verification_status,
          new: 'verified',
        };
      } else {
        updates.push('name_verification_status = ?');
        params.push(reqVerificationStatus);
        auditChanges['name_verification_status'] = {
          old: applicant.name_verification_status,
          new: reqVerificationStatus,
        };
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'لا توجد بيانات للتعديل' });
      return;
    }

    updates.push('reviewed_by = ?');
    params.push(req.user?.name || 'الإدارة');
    updates.push('reviewed_at = CURRENT_TIMESTAMP');
    updates.push('updated_at = CURRENT_TIMESTAMP');

    params.push(id);
    const sql = `UPDATE applicants SET ${updates.join(', ')} WHERE id = ?`;
    await run(sql, params);

    // Audit log if any meaningful fields changed
    if (Object.keys(auditChanges).length > 0) {
      await recordAudit(
        req.user?.id,
        'UPDATE_APPLICANT_DETAILS',
        'applicants',
        id,
        auditChanges,
        req.ip
      );
    }

    res.json({ success: true, message: 'تم تحديث بيانات الطلب بنجاح' });
  } catch (error) {
    console.error('Error updating applicant:', error);
    res.status(500).json({ error: 'تعذر تحديث حالة الطلب' });
  }
});

// POST /api/admin/applicants/:id/verify-name
// Human Verification of legal four-part name & identity document (Strict Admin only)
router.post('/admin/applicants/:id/verify-name', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, status, decision, verified_from, notes, second_approver } = req.body;

    const applicant = await queryOne('SELECT * FROM applicants WHERE id = ?', [id]);
    if (!applicant) {
      res.status(404).json({ error: 'طلب التسجيل غير موجود' });
      return;
    }

    const resolvedAction = (action || decision || status || 'verify').toLowerCase().trim();

    if (!['verify', 'verified', 'reject', 'rejected', 'correction_requested'].includes(resolvedAction)) {
      res.status(400).json({
        error: 'إجراء التحقق غير صالح. الخيارات المتاحة: verify (اعتماد), reject (رفض), correction_requested (طلب تصحيح).',
      });
      return;
    }

    // 1. Action: VERIFY
    if (resolvedAction === 'verify' || resolvedAction === 'verified') {
      if (!applicant.legal_first_name || !applicant.legal_second_name || !applicant.legal_third_name || !applicant.legal_fourth_name) {
        res.status(400).json({
          error: 'لا يمكن اعتماد الاسم القانوني قبل اكتمال حقول الاسم الرباعي الأربعة للمتقدم.',
        });
        return;
      }

      const verifiedFrom = verified_from || 'national_id';
      const verificationNotes = (notes && typeof notes === 'string' && notes.trim().length > 0)
        ? notes.trim()
        : 'تم اعتماد وتوثيق الاسم القانوني الرباعي ومطابقته للوثيقة الرسمية';

      await run(`
        UPDATE applicants
        SET name_verification_status = 'verified',
            name_verified_from = ?,
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            name_second_approver = ?,
            name_second_approved_at = CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE name_second_approved_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [verifiedFrom, req.user?.id, verificationNotes, second_approver || null, second_approver || null, id]);

      // Update applicant_documents to verified
      await run(`
        UPDATE applicant_documents
        SET verification_status = 'verified',
            verified_by = ?,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [req.user?.id, id]);

      // Also update student record if already enrolled
      await run(`
        UPDATE students
        SET name_verification_status = 'verified',
            name_verified_from = ?,
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [verifiedFrom, req.user?.id, verificationNotes, id]);

      await recordAudit(
        req.user?.id,
        'LEGAL_NAME_VERIFIED',
        'applicants',
        id,
        {
          previous_status: applicant.name_verification_status,
          new_status: 'verified',
          legal_full_name: applicant.legal_full_name,
          verified_from: verifiedFrom,
          verified_by: req.user?.id,
          second_approver: second_approver || null,
          notes: verificationNotes,
        },
        req.ip
      );

      res.json({
        success: true,
        message: 'تم اعتماد وتوثيق الاسم القانوني الرباعي بنجاح',
        name_verification_status: 'verified',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }

    // 2. Action: REJECT
    if (resolvedAction === 'reject' || resolvedAction === 'rejected') {
      if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
        res.status(400).json({
          error: 'يرجى تدوين سبب رفض اعتماد الاسم والوثيقة في خانة الملاحظات (إلزامي).',
        });
        return;
      }

      const rejectionReason = notes.trim();

      await run(`
        UPDATE applicants
        SET name_verification_status = 'rejected',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user?.id, rejectionReason, id]);

      // Update applicant_documents to rejected
      await run(`
        UPDATE applicant_documents
        SET verification_status = 'rejected',
            rejection_reason = ?,
            verified_by = ?,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [rejectionReason, req.user?.id, id]);

      // Update student record if enrolled
      await run(`
        UPDATE students
        SET name_verification_status = 'rejected',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [req.user?.id, rejectionReason, id]);

      await recordAudit(
        req.user?.id,
        'LEGAL_NAME_REJECTED',
        'applicants',
        id,
        {
          previous_status: applicant.name_verification_status,
          new_status: 'rejected',
          legal_full_name: applicant.legal_full_name,
          rejection_reason: rejectionReason,
          verified_by: req.user?.id,
        },
        req.ip
      );

      res.json({
        success: true,
        message: 'تم تسجيل رفض اعتماد الاسم والوثيقة بنجاح',
        name_verification_status: 'rejected',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }

    // 3. Action: CORRECTION_REQUESTED
    if (resolvedAction === 'correction_requested') {
      if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
        res.status(400).json({
          error: 'يرجى تدوين الملاحظات والمطلوب تصحيحه بدقة في خانة الملاحظات (إلزامي).',
        });
        return;
      }

      const correctionNotes = notes.trim();

      await run(`
        UPDATE applicants
        SET name_verification_status = 'correction_requested',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user?.id, correctionNotes, id]);

      // Keep document in pending state with note for correction
      await run(`
        UPDATE applicant_documents
        SET verification_status = 'pending',
            rejection_reason = ?,
            verified_by = ?,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [correctionNotes, req.user?.id, id]);

      // Update student record if enrolled
      await run(`
        UPDATE students
        SET name_verification_status = 'correction_requested',
            name_verified_by = ?,
            name_verified_at = CURRENT_TIMESTAMP,
            name_verification_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `, [req.user?.id, correctionNotes, id]);

      await recordAudit(
        req.user?.id,
        'LEGAL_NAME_CORRECTION_REQUESTED',
        'applicants',
        id,
        {
          previous_status: applicant.name_verification_status,
          new_status: 'correction_requested',
          legal_full_name: applicant.legal_full_name,
          correction_notes: correctionNotes,
          verified_by: req.user?.id,
        },
        req.ip
      );

      res.json({
        success: true,
        message: 'تم تسجيل طلب تصحيح الاسم والوثيقة بنجاح',
        name_verification_status: 'correction_requested',
        verified_by: req.user?.name || req.user?.id,
        verified_at: new Date().toISOString(),
      });
      return;
    }
  } catch (error) {
    console.error('Error verifying legal name:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء اعتماد الاسم القانوني' });
  }
});

export default router;
