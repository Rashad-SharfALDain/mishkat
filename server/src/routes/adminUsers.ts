import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../db/database';
import { requireStrictAdmin, AuthRequest } from '../middleware/auth';
import { enrichWithLegalNameMetadata } from '../utils/legalName';

const router = Router();

// Granular Role-Based Permissions Definition (Extensible Permissions Matrix)
export const ROLE_PERMISSIONS_REGISTRY = {
  admin: {
    roleNameAr: 'مدير النظام (Admin)',
    description: 'صلاحيات إدارية كاملة لإدارة المؤسسة، الطلاب، المستخدمين، الجلسات، ونشر التقييمات.',
    modules: [
      {
        category: 'إدارة المستخدمين والحسابات',
        permissions: [
          { key: 'users:view', label: 'عرض قائمة المستخدمين وتفاصيلهم', granted: true },
          { key: 'users:create', label: 'إنشاء مستخدمين جدد بمختلف الأدوار', granted: true },
          { key: 'users:edit', label: 'تعديل بيانات المستخدمين وأدوارهم', granted: true },
          { key: 'users:toggle_status', label: 'تفعيل وتعطيل حسابات المستخدمين', granted: true },
          { key: 'users:reset_password', label: 'إعادة تعيين كلمات مرور المستخدمين', granted: true },
          { key: 'audit_logs:view', label: 'الاطلاع على سجل العمليات والرقابة الحساسة', granted: true },
        ],
      },
      {
        category: 'الطلاب والقبول',
        permissions: [
          { key: 'applicants:manage', label: 'مراجعة طلبات الالتحاق وتغيير حالات القبول', granted: true },
          { key: 'students:create_from_app', label: 'إنشاء حسابات الطلاب المقبولين وتوليد الأرقام الأكاديمية', granted: true },
          { key: 'students:edit_status', label: 'تعديل الحالات الأكاديمية ومسارات الطلاب', granted: true },
          { key: 'students:reset_access', label: 'إعادة تعيين بيانات دخول الطلاب', granted: true },
        ],
      },
      {
        category: 'أولياء الأمور والربط العائلي',
        permissions: [
          { key: 'parents:view', label: 'عرض أولياء الأمور وتفاصيل الأبناء المرتبطين', granted: true },
          { key: 'parents:link_student', label: 'ربط وفك ربط الطلاب بأولياء الأمور', granted: true },
          { key: 'parents:reset_access', label: 'إعادة تعيين بيانات دخول أولياء الأمور', granted: true },
        ],
      },
      {
        category: 'الجلسات والحضور والأعذار',
        permissions: [
          { key: 'sessions:create_manage', label: 'إنشاء وجدولة الجلسات التعليمية وتعيين المشرفين', granted: true },
          { key: 'attendance:mark_all', label: 'رصد وتعديل حضور وغياب الطلاب لجميع الجلسات', granted: true },
          { key: 'excuses:review', label: 'اعتماد ورفض طلبات الأعذار الطبية والطارئة', granted: true },
        ],
      },
      {
        category: 'التقييم التربوي الهجين',
        permissions: [
          { key: 'evaluations:create_periods', label: 'إنشاء الفترات ومحاور التقييم التربوية', granted: true },
          { key: 'evaluations:grade', label: 'رصد درجات وتقييمات الطلاب النوعية والرقمية', granted: true },
          { key: 'evaluations:publish', label: 'اعتماد ونشر التقييمات النهائية للطلاب وأولياء الأمور', granted: true },
        ],
      },
      {
        category: 'إعدادات المؤسسة والموقع',
        permissions: [
          { key: 'settings:manage', label: 'تحديث بيانات وهوية المؤسسة والمساهمات المالية', granted: true },
          { key: 'faq_programs:manage', label: 'إدارة المسارات التعليمية والأسئلة الشائعة', granted: true },
        ],
      },
    ],
  },
  supervisor: {
    roleNameAr: 'مشرف تربوي (Supervisor)',
    description: 'متابعة الجلسات المسندة، رصد الحضور، تسجيل مسودات التقييم التربوي دون صلاحية النشر النهائي.',
    modules: [
      {
        category: 'إدارة المستخدمين والحسابات',
        permissions: [
          { key: 'users:view', label: 'عرض قائمة المستخدمين وتفاصيلهم', granted: false },
          { key: 'users:create', label: 'إنشاء مستخدمين جدد', granted: false },
          { key: 'users:edit', label: 'تعديل المستخدمين', granted: false },
          { key: 'users:toggle_status', label: 'تفعيل/تعطيل الحسابات', granted: false },
          { key: 'users:reset_password', label: 'إعادة تعيين كلمات المرور', granted: false },
          { key: 'audit_logs:view', label: 'الاطلاع على سجل العمليات', granted: false },
        ],
      },
      {
        category: 'الطلاب والجلسات والحضور',
        permissions: [
          { key: 'sessions:assigned_only', label: 'الاطلاع على الجلسات التعليمية المسندة إليه فقط', granted: true },
          { key: 'attendance:mark_assigned', label: 'رصد الحضور والغياب للطلاب في جلساته المسندة', granted: true },
          { key: 'excuses:view', label: 'الاطلاع على أعذار الطلاب المرفوعة لجلساته', granted: true },
          { key: 'excuses:review', label: 'البت في قبول الأعذار المباشرة', granted: true },
        ],
      },
      {
        category: 'التقييم التربوي',
        permissions: [
          { key: 'evaluations:draft', label: 'رصد وتدوين مسودات التقييمات التربوية والملاحظات', granted: true },
          { key: 'evaluations:submit', label: 'رفع مسودات التقييمات لاعتماد الإدارة', granted: true },
          { key: 'evaluations:publish', label: 'نشر التقييم النهائي لأولياء الأمور (ممنوع للمشرف)', granted: false },
        ],
      },
      {
        category: 'إعدادات المؤسسة',
        permissions: [
          { key: 'settings:manage', label: 'تعديل إعدادات المؤسسة والرسوم (ممنوع)', granted: false },
        ],
      },
    ],
  },
  student: {
    roleNameAr: 'طالب (Student)',
    description: 'الاطلاع على الجدول الأكاديمي، سجل الحضور، التقييمات المنشورة، والأنشطة المسندة.',
    modules: [
      {
        category: 'بوابة الطالب',
        permissions: [
          { key: 'student:view_profile', label: 'عرض وتحديث الملف الشخصي المسموح به', granted: true },
          { key: 'student:view_attendance', label: 'الاطلاع على سجلات حضوره وغيابه ونسب الالتزام', granted: true },
          { key: 'student:submit_excuse', label: 'تقديم طلبات الأعذار والاستئذان مع المستندات', granted: true },
          { key: 'student:view_evaluations', label: 'الاطلاع على نتائج التقييمات التربوية المنشورة فقط', granted: true },
          { key: 'student:notifications', label: 'استقبال الإشعارات الأكاديمية والتنبيهات', granted: true },
        ],
      },
    ],
  },
  parent: {
    roleNameAr: 'ولي أمر (Parent)',
    description: 'متابعة الأبناء المرتبطين فقط، سجلات الحضور، التقييمات المعتمدة، وتقديم الأعذار.',
    modules: [
      {
        category: 'بوابة ولي الأمر',
        permissions: [
          { key: 'parent:view_children', label: 'الاطلاع على الملفات الأكاديمية للأبناء المرتبطين به حصريًا', granted: true },
          { key: 'parent:view_attendance', label: 'متابعة سجلات الحضور والغياب اليومية للأبناء', granted: true },
          { key: 'parent:submit_excuse', label: 'تقديم ومتابعة طلبات الأعذار الرسمية نيابة عن الأبناء', granted: true },
          { key: 'parent:view_evaluations', label: 'الاطلاع على التقرير التربوي الشامل المنشور للأبناء', granted: true },
          { key: 'parent:notifications', label: 'استلام إشعارات الغياب الفوري والملاحظات التربوية', granted: true },
        ],
      },
    ],
  },
};

// Helper for logging audit entries
async function logAudit(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: any,
  ip: string
) {
  try {
    await run(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), userId || null, action, entityType, entityId, JSON.stringify(metadata), ip || 'local']);
  } catch (err) {
    console.error('Audit log failed in adminUsers:', err);
  }
}

// GET /api/admin/users
// Returns users list with search, role, status filtering, and linked stats
router.get('/users', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = (req.query.search || '').toString().trim().toLowerCase();
    const roleFilter = (req.query.role || 'all').toString().trim().toLowerCase();
    const statusFilter = (req.query.status || 'all').toString().trim().toLowerCase();

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        COALESCE(u.status, 'active') as status,
        u.must_change_password,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        s.id as student_record_id,
        s.student_number,
        s.academic_status,
        s.educational_track,
        p.id as parent_record_id,
        p.relationship as parent_relationship
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN parents p ON p.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (
        LOWER(u.name) LIKE ? OR
        LOWER(u.email) LIKE ? OR
        u.phone LIKE ? OR
        LOWER(s.student_number) LIKE ?
      )`;
      const sParam = `%${search}%`;
      params.push(sParam, sParam, sParam, sParam);
    }

    if (roleFilter !== 'all' && roleFilter !== '') {
      sql += ` AND LOWER(u.role) = ?`;
      params.push(roleFilter);
    }

    if (statusFilter !== 'all' && statusFilter !== '') {
      sql += ` AND LOWER(COALESCE(u.status, 'active')) = ?`;
      params.push(statusFilter);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const users = await query(sql, params);

    // Get linked children count for parents
    const parentUserIds = users.filter((u: any) => u.role === 'parent').map((u: any) => u.id);
    let parentChildrenMap: Record<string, number> = {};
    if (parentUserIds.length > 0) {
      const placeholders = parentUserIds.map(() => '?').join(',');
      try {
        const links = await query<{ parent_user_id: string; cnt: number }>(`
          SELECT parent_user_id, COUNT(*) as cnt FROM parent_student
          WHERE parent_user_id IN (${placeholders}) AND status = 'active'
          GROUP BY parent_user_id
        `, parentUserIds);
        links.forEach((l) => {
          parentChildrenMap[l.parent_user_id] = l.cnt;
        });
      } catch {
        // Table fallback
      }
    }

    const formattedUsers = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status || 'active',
      must_change_password: Boolean(u.must_change_password),
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
      student_info: u.student_record_id ? {
        id: u.student_record_id,
        student_number: u.student_number,
        academic_status: u.academic_status,
        educational_track: u.educational_track,
      } : null,
      parent_info: u.parent_record_id ? {
        id: u.parent_record_id,
        relationship: u.parent_relationship,
        linked_children_count: parentChildrenMap[u.id] || 0,
      } : null,
    }));

    // Summary counts
    const totalUsers = formattedUsers.length;
    const activeUsers = formattedUsers.filter((u: any) => u.status === 'active').length;
    const inactiveUsers = formattedUsers.filter((u: any) => u.status === 'inactive').length;
    const adminCount = formattedUsers.filter((u: any) => u.role === 'admin').length;
    const supervisorCount = formattedUsers.filter((u: any) => u.role === 'supervisor').length;
    const studentCount = formattedUsers.filter((u: any) => u.role === 'student').length;
    const parentCount = formattedUsers.filter((u: any) => u.role === 'parent').length;

    res.json({
      success: true,
      users: formattedUsers,
      metrics: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        roles: {
          admin: adminCount,
          supervisor: supervisorCount,
          student: studentCount,
          parent: parentCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب قائمة المستخدمين' });
  }
});

// GET /api/admin/users/:id
// Get user details
router.get('/users/:id', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await queryOne(`
      SELECT id, name, email, phone, role, COALESCE(status, 'active') as status,
             must_change_password, last_login_at, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    if (!user) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    let linkedData: any = {};
    if (user.role === 'student') {
      const student = await queryOne(`
        SELECT s.*, a.student_name 
        FROM students s 
        LEFT JOIN applicants a ON a.id = s.applicant_id 
        WHERE s.user_id = ?
      `, [id]);
      linkedData.student = student ? enrichWithLegalNameMetadata(student) : null;
    } else if (user.role === 'parent') {
      const parent = await queryOne('SELECT * FROM parents WHERE user_id = ?', [id]);
      if (parent) {
        try {
          const rawChildren = await query(`
            SELECT s.*, a.student_name, ps.relationship_type, ps.is_primary_contact
            FROM parent_student ps
            JOIN students s ON s.id = ps.student_id
            LEFT JOIN applicants a ON a.id = s.applicant_id
            WHERE ps.parent_user_id = ? AND ps.status = 'active'
          `, [user.id]);
          const children = rawChildren.map(c => enrichWithLegalNameMetadata(c));
          linkedData.parent = { ...parent, children };
        } catch {
          linkedData.parent = parent;
        }
      }
    }

    res.json({
      success: true,
      user: {
        ...user,
        must_change_password: Boolean(user.must_change_password),
      },
      linkedData,
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ error: 'تعذر جلب تفاصيل المستخدم' });
  }
});

// POST /api/admin/users
// Create new user with validation, bcrypt, uniqueness check, and audit logging
router.post('/users', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, role, password, must_change_password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    // 1. Required fields
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'يرجى إدخال اسم المستخدم' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'يجب ألا تقل كلمة المرور عن ٦ خانات' });
      return;
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'صيغة البريد الإلكتروني غير صحيحة' });
      return;
    }

    // 3. Validate role
    const validRoles = ['admin', 'supervisor', 'student', 'parent'];
    const cleanRole = (role || 'supervisor').toString().trim().toLowerCase();
    if (!validRoles.includes(cleanRole)) {
      res.status(400).json({ error: `نوع الحساب غير صالح. الخيارات المتاحة: ${validRoles.join(', ')}` });
      return;
    }

    // 4. Check uniqueness
    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقًا لمستخدم آخر' });
      return;
    }

    // 5. Hash password with bcrypt
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    const mustChange = must_change_password !== undefined ? (must_change_password ? 1 : 0) : 1;

    await run(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, must_change_password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, name.trim(), cleanEmail, phone ? phone.trim() : null, passwordHash, cleanRole, mustChange]);

    // 6. Record audit log
    await logAudit(req.user?.id, 'CREATE_USER', 'users', userId, {
      name: name.trim(),
      email: cleanEmail,
      role: cleanRole,
    }, clientIp);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم الجديد بنجاح',
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role: cleanRole,
        status: 'active',
        must_change_password: Boolean(mustChange),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المستخدم الجديد' });
  }
});

// PUT /api/admin/users/:id
// Update user details, role, and status with protection for primary admin
router.put('/users/:id', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    const existingUser = await queryOne<{ id: string; email: string; role: string; status: string }>(`
      SELECT id, email, role, COALESCE(status, 'active') as status FROM users WHERE id = ?
    `, [id]);

    if (!existingUser) {
      res.status(404).json({ error: 'المستخدم المطلوب غير موجود' });
      return;
    }

    // Protection rule for primary ADMIN: Cannot demote or deactivate primary admin
    const isPrimaryAdmin = existingUser.role === 'admin';
    if (isPrimaryAdmin) {
      if (role && role !== 'admin') {
        res.status(403).json({ error: 'حماية أمنية: لا يمكن تغيير دور حساب الإدارة الرئيسي' });
        return;
      }
      if (status && status === 'inactive') {
        res.status(403).json({ error: 'حماية أمنية: لا يمكن تعطيل حساب الإدارة الرئيسي للمؤسسة' });
        return;
      }
    }

    // Validate email if changed
    let cleanEmail = existingUser.email;
    if (email && email.trim().toLowerCase() !== existingUser.email) {
      cleanEmail = email.trim().toLowerCase();
      const duplicate = await queryOne('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, id]);
      if (duplicate) {
        res.status(400).json({ error: 'البريد الإلكتروني الجديد مسجل مسبقًا لمستخدم آخر' });
        return;
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (cleanEmail !== existingUser.email) {
      updates.push('email = ?');
      params.push(cleanEmail);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }

    if (role) {
      const validRoles = ['admin', 'supervisor', 'student', 'parent'];
      const cleanRole = role.toString().trim().toLowerCase();
      if (!validRoles.includes(cleanRole)) {
        res.status(400).json({ error: 'نوع الحساب غير صالح' });
        return;
      }
      updates.push('role = ?');
      params.push(cleanRole);
    }

    if (status) {
      if (status !== 'active' && status !== 'inactive') {
        res.status(400).json({ error: 'حالة الحساب يجب أن تكون إما active أو inactive' });
        return;
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'لا توجد بيانات لتحديثها' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Audit log
    await logAudit(req.user?.id, 'UPDATE_USER', 'users', id, {
      changes: req.body,
      previousRole: existingUser.role,
      previousStatus: existingUser.status,
    }, clientIp);

    res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل بيانات المستخدم' });
  }
});

// PATCH /api/admin/users/:id/status
// Toggle user active / inactive status
router.patch('/users/:id/status', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    if (status !== 'active' && status !== 'inactive') {
      res.status(400).json({ error: 'الحالة غير صالحة' });
      return;
    }

    const user = await queryOne<{ id: string; email: string; name: string }>(`
      SELECT id, email, name, role FROM users WHERE id = ?
    `, [id]);

    if (!user) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    // Protection rule for primary ADMIN
    if (user.role === 'admin' && status === 'inactive') {
      res.status(403).json({ error: 'حماية أمنية: لا يمكن تعطيل حساب الإدارة الرئيسي' });
      return;
    }

    await run(`
      UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [status, id]);

    // Audit log
    await logAudit(req.user?.id, 'TOGGLE_USER_STATUS', 'users', id, {
      userName: user.name,
      newStatus: status,
    }, clientIp);

    res.json({
      success: true,
      message: status === 'active' ? 'تم تفعيل حساب المستخدم بنجاح' : 'تم تعطيل حساب المستخدم بنجاح',
      status,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تغيير حالة المستخدم' });
  }
});

// POST /api/admin/users/:id/reset-password
// Administrative password reset for any user (custom password or generated secure temp password)
router.post('/users/:id/reset-password', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_password, must_change_password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    const user = await queryOne<{ id: string; name: string; email: string; role: string }>(`
      SELECT id, name, email, role FROM users WHERE id = ?
    `, [id]);

    if (!user) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    let plainPassword = (new_password || '').toString().trim();
    let generated = false;

    if (!plainPassword) {
      // Generate a strong temporary password: e.g. Mishkat#9X7k2026!
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
      let rand = '';
      for (let i = 0; i < 4; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      plainPassword = `Mishkat#${rand}2026!`;
      generated = true;
    } else if (plainPassword.length < 6) {
      res.status(400).json({ error: 'يجب ألا تقل كلمة المرور عن ٦ خانات' });
      return;
    }

    const passwordHash = bcrypt.hashSync(plainPassword, 10);
    const forceChange = must_change_password !== undefined ? (must_change_password ? 1 : 0) : 1;

    await run(`
      UPDATE users 
      SET password_hash = ?, must_change_password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [passwordHash, forceChange, id]);

    // Invalidate any open reset tokens for this user
    await run('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0', [id]);

    // Record audit log WITHOUT recording the password
    await logAudit(req.user?.id, 'ADMIN_RESET_PASSWORD', 'users', id, {
      targetUser: user.name,
      targetEmail: user.email,
      targetRole: user.role,
      generatedPassword: generated,
    }, clientIp);

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
      temporary_password: plainPassword,
      must_change_password: Boolean(forceChange),
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ error: 'تعذر إعادة تعيين كلمة المرور' });
  }
});

// GET /api/admin/permissions
// Returns granular Role-Based Permissions Matrix
router.get('/permissions', requireStrictAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      permissions_matrix: ROLE_PERMISSIONS_REGISTRY,
    });
  } catch (error) {
    res.status(500).json({ error: 'تعذر جلب مصفوفة الصلاحيات' });
  }
});

// GET /api/admin/audit-logs
// Returns sensitive operation audit logs
router.get('/audit-logs', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt((req.query.limit || '100').toString(), 10), 200);
    const actionFilter = (req.query.action || '').toString().trim();

    let sql = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.ip_address,
        al.created_at,
        u.name as actor_name,
        u.email as actor_email,
        u.role as actor_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (actionFilter) {
      sql += ` AND al.action = ?`;
      params.push(actionFilter);
    }

    sql += ` ORDER BY al.created_at DESC LIMIT ?`;
    params.push(limit);

    const logs = await query(sql, params);

    const parsedLogs = logs.map((l: any) => {
      let meta = {};
      try {
        meta = JSON.parse(l.metadata || '{}');
      } catch {
        meta = { raw: l.metadata };
      }
      return {
        id: l.id,
        action: l.action,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        metadata: meta,
        ip_address: l.ip_address,
        created_at: l.created_at,
        actor: l.actor_name ? {
          name: l.actor_name,
          email: l.actor_email,
          role: l.actor_role,
        } : null,
      };
    });

    res.json({
      success: true,
      logs: parsedLogs,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'تعذر جلب سجل العمليات والرقابة' });
  }
});

// POST /api/admin/test-session/cleanup
// Dedicated, strictly guarded endpoint for cleaning up ephemeral test session accounts
// NEVER accessible in production; strictly enforces session ownership and prevents touching real accounts
router.post('/test-session/cleanup', requireStrictAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Absolute production guard: endpoint does not exist in production
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const { sessionId, userIds } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    if (!sessionId || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'معرّف الجلسة ومصفوفة المعرّفات مطلوبة' });
      return;
    }

    const expectedPrefix = `test.sec.${sessionId}`;
    let cleanedCount = 0;

    for (const id of userIds) {
      const targetUser = await queryOne<{ id: string; email: string; role: string }>(
        'SELECT id, email, role FROM users WHERE id = ?',
        [id]
      );

      if (!targetUser) continue;

      // 2. Sovereign protection: never touch primary admin
      if (targetUser.email === 'admin@mishkat.edu.sa') {
        res.status(403).json({ error: 'حماية أمنية: لا يمكن حذف حساب الإدارة الرئيسي إطلاقًا' });
        return;
      }

      // 3. Strict session ownership verification: email MUST match current test session prefix
      if (!targetUser.email.startsWith(expectedPrefix)) {
        res.status(403).json({ error: 'حماية أمنية: لا يمكن تنظيف مستخدم لا ينتمي لجلسة الاختبار المصرح بها' });
        return;
      }

      // 4. Institutional safety: abort immediately if linked to institutional student/parent records
      const hasStudent = await queryOne('SELECT id FROM students WHERE user_id = ?', [id]);
      const hasParent = await queryOne('SELECT id FROM parents WHERE user_id = ?', [id]);
      if (hasStudent || hasParent) {
        res.status(400).json({ error: 'حماية أمنية: لا يمكن حذف مستخدم مرتبط بسجلات مؤسسية' });
        return;
      }

      // 5. Clean up associated ephemeral test password resets for this test user
      await run('DELETE FROM password_resets WHERE user_id = ?', [id]);

      // 6. Delete test user row
      await run('DELETE FROM users WHERE id = ?', [id]);

      // 7. Audit log remains append-only: log the cleanup action
      await logAudit(req.user?.id, 'DELETE_TEST_USER', 'users', id, { email: targetUser.email, sessionId }, clientIp);
      cleanedCount++;
    }

    res.json({
      success: true,
      message: 'تم تنظيف حسابات جلسة الاختبار بنجاح',
      cleaned_count: cleanedCount,
    });
  } catch (error) {
    console.error('Test session cleanup error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تنظيف حسابات جلسة الاختبار' });
  }
});

export default router;
