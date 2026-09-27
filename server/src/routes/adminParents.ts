import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, run, queryOne } from '../db/database';
import { requireAdmin, requireStrictAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Secure temporary password generator adhering to institutional complexity rules
function generateTempPassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Parent#${randomPart}2026!`;
}

// Audit logging helper
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

// GET /api/admin/parents
// List all parents with search and status filtering
router.get('/parents', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.user_id,
        p.full_name,
        p.relationship,
        p.phone,
        p.email,
        p.address,
        p.national_id,
        p.status,
        p.created_at,
        p.updated_at,
        u.email as user_email,
        u.must_change_password,
        (
          SELECT COUNT(*)
          FROM parent_student ps
          WHERE ps.parent_user_id = p.user_id AND ps.status = 'active'
        ) as children_count
      FROM parents p
      JOIN users u ON u.id = p.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'الكل') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      sql += ' AND (p.full_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ? OR p.national_id LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY p.created_at DESC';

    const parents = await query(sql, params);
    res.json({ success: true, parents });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة أولياء الأمور' });
  }
});

// GET /api/admin/parents/:id
// Get detailed parent info and all linked students
router.get('/parents/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parent = await queryOne(`
      SELECT 
        p.*,
        u.email as user_email,
        u.must_change_password
      FROM parents p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `, [id]);

    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    const linkedStudents = await query(`
      SELECT 
        ps.id as relationship_id,
        ps.relationship,
        ps.is_primary,
        ps.status as link_status,
        ps.created_at as linked_at,
        s.id as student_id,
        s.student_number,
        s.academic_status,
        s.current_grade,
        s.educational_track,
        a.student_name,
        a.school,
        a.city
      FROM parent_student ps
      JOIN students s ON s.id = ps.student_id
      LEFT JOIN applicants a ON a.id = s.applicant_id
      WHERE ps.parent_user_id = ?
      ORDER BY ps.is_primary DESC, ps.created_at ASC
    `, [parent.user_id]);

    res.json({
      success: true,
      parent,
      linked_students: linkedStudents,
    });
  } catch (error) {
    console.error('Error fetching parent details:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تفاصيل ولي الأمر' });
  }
});

// POST /api/admin/parents
// Manually create a verified parent account by Strict Admin
router.post('/parents', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, phone, email, relationship, address, national_id, student_id } = req.body;

    if (!full_name || full_name.trim().length < 3) {
      res.status(400).json({ error: 'يرجى إدخال اسم ولي الأمر الثلاثي على الأقل' });
      return;
    }

    if (!phone || phone.trim().length < 8) {
      res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح لولي الأمر' });
      return;
    }

    // Determine account email
    let parentEmail = (email && email.trim() !== '')
      ? email.trim().toLowerCase()
      : `parent.${phone.replace(/[^0-9]/g, '')}@mishkat.parent`;

    // Check if user account with this email or phone already exists
    const existingUser = await queryOne('SELECT id, role FROM users WHERE LOWER(email) = ? OR phone = ?', [parentEmail, phone.trim()]);
    if (existingUser) {
      res.status(400).json({ error: 'يوجد حساب مسجل مسبقًا بهذا البريد أو رقم الهاتف' });
      return;
    }

    // Generate credentials
    const tempPassword = generateTempPassword();
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    const userId = uuidv4();
    const parentId = uuidv4();

    // 1. Create user account
    await run(`
      INSERT INTO users (id, name, email, phone, password_hash, role, must_change_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'parent', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, full_name.trim(), parentEmail, phone.trim(), passwordHash]);

    // 2. Create parent record
    await run(`
      INSERT INTO parents (id, user_id, full_name, relationship, phone, email, address, national_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'نشط', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      parentId,
      userId,
      full_name.trim(),
      relationship || 'ولي أمر',
      phone.trim(),
      email ? email.trim() : null,
      address ? address.trim() : null,
      national_id ? national_id.trim() : null,
    ]);

    // 3. Link student if provided
    if (student_id) {
      const student = await queryOne('SELECT id FROM students WHERE id = ?', [student_id]);
      if (student) {
        await run(`
          INSERT INTO parent_student (id, parent_user_id, student_id, relationship, is_primary, status, created_at)
          VALUES (?, ?, ?, ?, 1, 'active', CURRENT_TIMESTAMP)
        `, [uuidv4(), userId, student_id, relationship || 'ولي أمر']);
      }
    }

    // Audit log
    await logAudit(req.user?.id, 'CREATE_PARENT_ACCOUNT', 'parents', parentId, {
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: parentEmail,
      linked_student_id: student_id || null,
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء وتفعيل حساب ولي الأمر بنجاح',
      parent: {
        id: parentId,
        user_id: userId,
        full_name: full_name.trim(),
        phone: phone.trim(),
        email: parentEmail,
        relationship: relationship || 'ولي أمر',
      },
      credentials: {
        identifier: phone.trim(),
        email: parentEmail,
        temporary_password: tempPassword,
        must_change_password: true,
      },
    });
  } catch (error) {
    console.error('Error creating parent account:', error);
    res.status(500).json({ error: 'تعذر إنشاء حساب ولي الأمر' });
  }
});

// POST /api/admin/parents/from-applicant/:applicantId
// Create/activate parent account from an accepted applicant's guardian data (Strict Admin only)
router.post('/parents/from-applicant/:applicantId', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicantId } = req.params;

    const applicant = await queryOne('SELECT * FROM applicants WHERE id = ?', [applicantId]);
    if (!applicant) {
      res.status(404).json({ error: 'طلب التسجيل غير موجود' });
      return;
    }

    // Verify applicant has an enrolled student record
    const student = await queryOne('SELECT id, student_number FROM students WHERE applicant_id = ?', [applicantId]);
    if (!student) {
      res.status(400).json({ error: 'يجب اعتماد وتسجيل حساب الطالب أولاً قبل تفعيل حساب ولي أمره' });
      return;
    }

    const guardianName = applicant.guardian_name || 'ولي أمر الطالب';
    const guardianPhone = applicant.guardian_phone;
    const guardianRel = applicant.guardian_relationship || 'ولي أمر';
    const guardianEmail = applicant.guardian_email;

    if (!guardianPhone || guardianPhone.trim() === '') {
      res.status(400).json({ error: 'بيانات ولي الأمر غير مكتملة (رقم هاتف ولي الأمر غير متوفر)' });
      return;
    }

    // Check if parent account already exists by phone or user_id
    let existingParent = await queryOne<{ id: string; user_id: string; full_name: string }>(`
      SELECT p.id, p.user_id, p.full_name
      FROM parents p
      WHERE p.phone = ?
    `, [guardianPhone.trim()]);

    let userId: string;
    let parentId: string;
    let tempPassword: string | null = null;
    let isNewAccount = false;

    if (existingParent) {
      userId = existingParent.user_id;
      parentId = existingParent.id;
    } else {
      isNewAccount = true;
      userId = uuidv4();
      parentId = uuidv4();
      tempPassword = generateTempPassword();
      const passwordHash = bcrypt.hashSync(tempPassword, 10);

      const parentEmail = (guardianEmail && guardianEmail.trim() !== '')
        ? guardianEmail.trim().toLowerCase()
        : `parent.${guardianPhone.replace(/[^0-9]/g, '')}@mishkat.parent`;

      // Check if user already exists
      const userExists = await queryOne('SELECT id FROM users WHERE phone = ? OR LOWER(email) = ?', [guardianPhone.trim(), parentEmail]);
      if (userExists) {
        userId = userExists.id;
        await run('UPDATE users SET role = "parent", password_hash = ?, must_change_password = 1 WHERE id = ?', [passwordHash, userId]);
      } else {
        await run(`
          INSERT INTO users (id, name, email, phone, password_hash, role, must_change_password, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'parent', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [userId, guardianName, parentEmail, guardianPhone.trim(), passwordHash]);
      }

      await run(`
        INSERT INTO parents (id, user_id, full_name, relationship, phone, email, address, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'نشط', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [parentId, userId, guardianName, guardianRel, guardianPhone.trim(), guardianEmail || null, applicant.city || null]);
    }

    // Link parent to student in parent_student (Check if already linked)
    const existingLink = await queryOne('SELECT id, status FROM parent_student WHERE parent_user_id = ? AND student_id = ?', [userId, student.id]);
    if (existingLink) {
      if (existingLink.status !== 'active') {
        await run('UPDATE parent_student SET status = "active" WHERE id = ?', [existingLink.id]);
      }
    } else {
      await run(`
        INSERT INTO parent_student (id, parent_user_id, student_id, relationship, is_primary, status, created_at)
        VALUES (?, ?, ?, ?, 1, 'active', CURRENT_TIMESTAMP)
      `, [uuidv4(), userId, student.id, guardianRel]);
    }

    await logAudit(req.user?.id, 'CREATE_PARENT_FROM_APPLICANT', 'parents', parentId, {
      applicant_id: applicantId,
      student_id: student.id,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      is_new_account: isNewAccount,
    });

    res.status(201).json({
      success: true,
      message: isNewAccount
        ? `تم إنشاء حساب ولي الأمر وربطه بالطالب (${student.student_number}) بنجاح`
        : `تم ربط حساب ولي الأمر القائم بالطالب (${student.student_number}) بنجاح`,
      is_new_account: isNewAccount,
      parent: {
        id: parentId,
        user_id: userId,
        full_name: guardianName,
        phone: guardianPhone,
        relationship: guardianRel,
      },
      credentials: isNewAccount && tempPassword ? {
        identifier: guardianPhone.trim(),
        temporary_password: tempPassword,
        must_change_password: true,
      } : null,
    });
  } catch (error) {
    console.error('Error creating parent from applicant:', error);
    res.status(500).json({ error: 'تعذر إنشاء حساب ولي الأمر من بيانات المتقدم' });
  }
});

// POST /api/admin/parents/:id/link-student
// Link a student to an existing parent (Strict Admin only)
router.post('/parents/:id/link-student', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { student_id, relationship, is_primary } = req.body;

    if (!student_id) {
      res.status(400).json({ error: 'يرجى تحديد الطالب المراد ربطه' });
      return;
    }

    const parent = await queryOne<{ id: string; user_id: string; full_name: string }>('SELECT id, user_id, full_name FROM parents WHERE id = ?', [id]);
    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    const student = await queryOne<{ id: string; student_number: string }>('SELECT id, student_number FROM students WHERE id = ?', [student_id]);
    if (!student) {
      res.status(404).json({ error: 'سجل الطالب غير موجود' });
      return;
    }

    const existingLink = await queryOne('SELECT id, status FROM parent_student WHERE parent_user_id = ? AND student_id = ?', [parent.user_id, student_id]);
    if (existingLink) {
      await run('UPDATE parent_student SET status = "active", relationship = ?, is_primary = ? WHERE id = ?', [
        relationship || 'ولي أمر',
        is_primary ? 1 : 0,
        existingLink.id,
      ]);
    } else {
      await run(`
        INSERT INTO parent_student (id, parent_user_id, student_id, relationship, is_primary, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `, [uuidv4(), parent.user_id, student_id, relationship || 'ولي أمر', is_primary ? 1 : 0]);
    }

    await logAudit(req.user?.id, 'LINK_PARENT_STUDENT', 'parent_student', student_id, {
      parent_id: id,
      student_id,
      relationship: relationship || 'ولي أمر',
    });

    res.json({
      success: true,
      message: `تم ربط الطالب (${student.student_number}) بولي الأمر (${parent.full_name}) بنجاح`,
    });
  } catch (error) {
    console.error('Error linking student to parent:', error);
    res.status(500).json({ error: 'تعذر ربط الطالب بولي الأمر' });
  }
});

// DELETE /api/admin/parents/:id/link-student/:studentId
// Unlink student from parent (Removes active access immediately - Strict Admin only)
router.delete('/parents/:id/link-student/:studentId', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, studentId } = req.params;

    const parent = await queryOne<{ id: string; user_id: string; full_name: string }>('SELECT id, user_id, full_name FROM parents WHERE id = ?', [id]);
    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    await run('DELETE FROM parent_student WHERE parent_user_id = ? AND student_id = ?', [parent.user_id, studentId]);

    await logAudit(req.user?.id, 'UNLINK_PARENT_STUDENT', 'parent_student', studentId, {
      parent_id: id,
      student_id: studentId,
    });

    res.json({ success: true, message: 'تم فك ارتباط الطالب بولي الأمر بنجاح وإلغاء صلاحية الوصول' });
  } catch (error) {
    console.error('Error unlinking student:', error);
    res.status(500).json({ error: 'تعذر فك ارتباط الطالب' });
  }
});

// PATCH /api/admin/parents/:id
// Update parent details or status (Strict Admin only)
router.patch('/parents/:id', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { full_name, phone, relationship, address, national_id, status } = req.body;

    const parent = await queryOne<{ id: string; user_id: string }>('SELECT id, user_id FROM parents WHERE id = ?', [id]);
    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name.trim());
      await run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [full_name.trim(), parent.user_id]);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone.trim());
      await run('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone.trim(), parent.user_id]);
    }

    if (relationship !== undefined) {
      updates.push('relationship = ?');
      params.push(relationship);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address.trim());
    }

    if (national_id !== undefined) {
      updates.push('national_id = ?');
      params.push(national_id.trim());
    }

    if (status !== undefined) {
      const allowed = ['نشط', 'غير نشط'];
      if (!allowed.includes(status)) {
        res.status(400).json({ error: 'حالة الحساب غير صالحة. الخيارات المتاحة: نشط، غير نشط' });
        return;
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(`UPDATE parents SET ${updates.join(', ')} WHERE id = ?`, params);

    await logAudit(req.user?.id, 'UPDATE_PARENT_INFO', 'parents', id, { updates: req.body });

    res.json({ success: true, message: 'تم تحديث بيانات ولي الأمر بنجاح' });
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'تعذر تحديث بيانات ولي الأمر' });
  }
});

// POST /api/admin/parents/:id/reset-access
// Reset parent password securely and require change on next login (Strict Admin only)
router.post('/parents/:id/reset-access', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parent = await queryOne<{ id: string; user_id: string; full_name: string; phone: string }>(`
      SELECT id, user_id, full_name, phone FROM parents WHERE id = ?
    `, [id]);

    if (!parent) {
      res.status(404).json({ error: 'سجل ولي الأمر غير موجود' });
      return;
    }

    const tempPassword = generateTempPassword();
    const newHash = bcrypt.hashSync(tempPassword, 10);

    await run(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newHash, parent.user_id]);

    await logAudit(req.user?.id, 'RESET_PARENT_ACCESS', 'parents', id, {
      parent_name: parent.full_name,
    });

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة مرور ولي الأمر بنجاح',
      identifier: parent.phone,
      temporary_password: tempPassword,
    });
  } catch (error) {
    console.error('Error resetting parent access:', error);
    res.status(500).json({ error: 'تعذر إعادة تعيين كلمة المرور' });
  }
});

export default router;
