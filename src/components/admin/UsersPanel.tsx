import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Edit,
  UserCheck,
  UserX,
  KeyRound,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Lock,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserStatus,
  resetAdminUserPassword,
  fetchPermissionsMatrix,
  fetchAuditLogs,
} from '../../services/api';
import { SystemUser, AuditLogItem, RolePermissionsMatrix } from '../../types';
import { useApp } from '../../context/AppContext';

export const UsersPanel: React.FC = () => {
  const { addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'audit'>('users');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [detailUser, setDetailUser] = useState<{ user: SystemUser; linkedData: any } | null>(null);
  const [resetModalUser, setResetModalUser] = useState<SystemUser | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [forceChangePassword, setForceChangePassword] = useState(true);
  const [resetResult, setResetResult] = useState<{ tempPassword?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'supervisor' | 'student' | 'parent'>('supervisor');
  const [newPassword, setNewPassword] = useState('');
  const [newMustChange, setNewMustChange] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'supervisor' | 'student' | 'parent'>('supervisor');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Permissions & Audit
  const [permissionsMatrix, setPermissionsMatrix] = useState<RolePermissionsMatrix | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    fetchAdminUsers(search, roleFilter, statusFilter)
      .then((data) => {
        setUsers(data.users);
        setMetrics(data.metrics);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        addToast(err.message || 'تعذر تحميل قائمة المستخدمين', 'error');
      });
  };

  const loadPermissions = () => {
    fetchPermissionsMatrix()
      .then((data) => setPermissionsMatrix(data.permissions_matrix))
      .catch(console.error);
  };

  const loadAudit = () => {
    setAuditLoading(true);
    fetchAuditLogs(100)
      .then((data) => {
        setAuditLogs(data.logs);
        setAuditLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAuditLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'permissions' && !permissionsMatrix) {
      loadPermissions();
    } else if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('يجب ألا تقل كلمة المرور عن ٦ خانات');
      return;
    }

    setSubmitting(true);
    try {
      await createAdminUser({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        role: newRole,
        password: newPassword,
        must_change_password: newMustChange,
      });

      addToast('تم إنشاء المستخدم الجديد بنجاح!', 'success');
      setCreateUserOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'فشل إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditStatus(user.status);
    setFormError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setFormError(null);

    try {
      await updateAdminUser(editUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole,
        status: editStatus,
      });

      addToast('تم تحديث بيانات المستخدم بنجاح', 'success');
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'فشل تحديث المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: SystemUser) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'active' ? 'تفعيل' : 'تعطيل';
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${actionLabel} حساب "${user.name}"؟`)) {
      return;
    }

    try {
      await toggleAdminUserStatus(user.id, nextStatus);
      addToast(nextStatus === 'active' ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح', 'success');
      loadUsers();
    } catch (err: any) {
      addToast(err.message || 'تعذر تغيير حالة الحساب', 'error');
    }
  };

  const handleOpenReset = (user: SystemUser) => {
    setResetModalUser(user);
    setCustomPassword('');
    setForceChangePassword(true);
    setResetResult(null);
    setFormError(null);
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await resetAdminUserPassword(
        resetModalUser.id,
        customPassword.trim() || undefined,
        forceChangePassword
      );
      setResetResult({ tempPassword: res.temporary_password });
      addToast('تمت إعادة تعيين كلمة المرور بنجاح!', 'success');
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'تعذر إعادة تعيين كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const data = await fetchAdminUserDetail(id);
      setDetailUser(data);
    } catch (err: any) {
      addToast(err.message || 'تعذر جلب تفاصيل المستخدم', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>👑 مدير نظام</span>;
      case 'supervisor':
        return <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>🎓 مشرف تربوي</span>;
      case 'student':
        return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>🎒 طالب</span>;
      case 'parent':
        return <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>👨‍👩‍👧 ولي أمر</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700 }}
          >
            <Users size={18} />
            <span>إدارة المستخدمين</span>
            {metrics?.total !== undefined && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>
                {metrics.total}
              </span>
            )}
          </button>

          <button
            className={`btn ${activeTab === 'permissions' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('permissions')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700 }}
          >
            <ShieldCheck size={18} />
            <span>مصفوفة الصلاحيات (RBAC)</span>
          </button>

          <button
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('audit')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700 }}
          >
            <Clock size={18} />
            <span>سجل الرقابة والعمليات الحساسة</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <button
            className="btn btn-gold"
            onClick={() => {
              setCreateUserOpen(true);
              setFormError(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 800 }}
          >
            <Plus size={18} />
            <span>إضافة مستخدم جديد</span>
          </button>
        )}
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Metrics Overview Cards */}
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>إجمالي المستخدمين</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
                  {metrics.total}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--status-accepted)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الحسابات الفعالة</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-accepted)', marginTop: 4 }}>
                  {metrics.active}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--status-rejected)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الحسابات المعطلة</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-rejected)', marginTop: 4 }}>
                  {metrics.inactive}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-gold)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>مدراء النظام</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginTop: 4 }}>
                  {metrics.roles?.admin || 0}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المشرفون التربويون</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1', marginTop: 4 }}>
                  {metrics.roles?.supervisor || 0}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الطلاب</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857', marginTop: 4 }}>
                  {metrics.roles?.student || 0}
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>أولياء الأمور</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', marginTop: 4 }}>
                  {metrics.roles?.parent || 0}
                </div>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="بحث بالاسم، البريد، الهاتف، أو الرقم الأكاديمي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: 38 }}
              />
              <Search size={18} color="var(--color-text-light)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>الدور:</span>
              <select
                className="form-control"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: 140 }}
              >
                <option value="all">كافة الأدوار</option>
                <option value="admin">مدير نظام</option>
                <option value="supervisor">مشرف تربوي</option>
                <option value="student">طالب</option>
                <option value="parent">ولي أمر</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>الحالة:</span>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 130 }}
              >
                <option value="all">كافة الحالات</option>
                <option value="active">فعال</option>
                <option value="inactive">غير فعال</option>
              </select>
            </div>

            {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                إعادة ضبط
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>نوع الحساب (Role)</th>
                    <th>بيانات الاتصال</th>
                    <th>الحالة</th>
                    <th>تاريخ التسجيل</th>
                    <th>آخر تسجيل دخول</th>
                    <th style={{ textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                        جاري تحميل قائمة المستخدمين...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                        لا يوجد مستخدمون يطابقون معايير البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isPrimaryAdmin = u.role === 'admin';
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                                {u.name}
                                {isPrimaryAdmin && (
                                  <span style={{ marginRight: 6, fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4 }}>
                                    الحساب الإداري الرئيسي
                                  </span>
                                )}
                              </span>
                              {u.student_info && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  رقم أكاديمي: {u.student_info.student_number} ({u.student_info.educational_track})
                                </span>
                              )}
                              {u.parent_info && (
                                <span style={{ fontSize: '0.78rem', color: '#6b21a8' }}>
                                  صلة القرابة: {u.parent_info.relationship || 'ولي أمر'} (مرتبط بـ {u.parent_info.linked_children_count} أبناء)
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{roleBadge(u.role)}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.84rem' }}>
                              <span style={{ color: 'var(--color-text-main)', direction: 'ltr', textAlign: 'right' }}>
                                {u.email}
                              </span>
                              {u.phone && (
                                <span style={{ color: 'var(--color-text-light)', direction: 'ltr', textAlign: 'right' }}>
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {u.status === 'active' ? (
                              <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                                ● فعال
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                                ● غير فعال
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : '—'}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'لم يسجل دخول بعد'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleViewDetail(u.id)}
                                title="عرض التفاصيل"
                                style={{ padding: '6px 8px' }}
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenEdit(u)}
                                title="تعديل المستخدم"
                                style={{ padding: '6px 8px' }}
                              >
                                <Edit size={15} />
                              </button>

                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenReset(u)}
                                title="إعادة تعيين كلمة المرور"
                                style={{ padding: '6px 8px', color: 'var(--color-gold-dark)' }}
                              >
                                <KeyRound size={15} />
                              </button>

                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleToggleStatus(u)}
                                disabled={isPrimaryAdmin}
                                title={isPrimaryAdmin ? 'لا يمكن تعطيل الحساب الرئيسي' : (u.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب')}
                                style={{
                                  padding: '6px 8px',
                                  color: isPrimaryAdmin ? '#94a3b8' : (u.status === 'active' ? 'var(--status-rejected)' : 'var(--status-accepted)'),
                                  cursor: isPrimaryAdmin ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {u.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 20, backgroundColor: 'var(--color-primary-subtle)', border: '1px solid rgba(6, 78, 59, 0.2)' }}>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
              🛡️ دليل ومنظومة صلاحيات الأدوار المؤسسية (Role-Based Access Control)
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
              تطبق منصة مؤسسة مِشكاة التربوية نموذج RBAC صارم على مستوى الخادم (Backend Enforcement)، يمنع أي وصول غير مخول ويعزل بيانات الطلاب وأولياء الأمور بالكامل لمنع أي اختراق عبر المعرفات (Anti-IDOR).
            </p>
          </div>

          {permissionsMatrix ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              {Object.entries(permissionsMatrix).map(([roleKey, roleDef]) => (
                <div key={roleKey} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        {roleDef.roleNameAr}
                      </h4>
                      {roleBadge(roleKey)}
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {roleDef.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {roleDef.modules.map((mod, modIdx) => (
                      <div key={modIdx}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
                          {mod.category}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {mod.permissions.map((p) => (
                            <div
                              key={p.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                backgroundColor: p.granted ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${p.granted ? '#bbf7d0' : '#e2e8f0'}`,
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.84rem',
                              }}
                            >
                              <span style={{ color: p.granted ? '#166534' : '#64748b' }}>{p.label}</span>
                              {p.granted ? (
                                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} /> مسموح
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <X size={14} /> مقيّد
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
              جاري تحميل مصفوفة الصلاحيات...
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                سجل العمليات والرقابة الحساسة (Audit Trail)
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                توثيق فوري وتتبعي للعمليات الحساسة: إنشاء الحسابات، تغيير الصلاحيات والأدوار، التفعيل والتعطيل، وإعادة تعيين كلمات المرور.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={loadAudit}
              disabled={auditLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={auditLoading ? 'spin' : ''} />
              <span>تحديث السجل</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>الوقت والتاريخ</th>
                    <th>نوع الإجراء</th>
                    <th>منفذ العملية (Actor)</th>
                    <th>الكيان المستهدف</th>
                    <th>تفاصيل العملية</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                        جاري تحميل سجل العمليات...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                        لا توجد عمليات رقابية مسجلة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                          {new Date(log.created_at).toLocaleString('ar-SA')}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: log.action.includes('RESET') ? '#fef3c7' : log.action.includes('CREATE') ? '#dcfce7' : '#e0f2fe',
                              color: log.action.includes('RESET') ? '#92400e' : log.action.includes('CREATE') ? '#15803d' : '#0369a1',
                              fontWeight: 700,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>
                          {log.actor ? (
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 700 }}>{log.actor.name}</span>
                              <span style={{ color: 'var(--color-text-light)' }}>{log.actor.email}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.82rem' }}>نظامي / زائر</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.84rem' }}>
                          <span style={{ fontWeight: 600 }}>{log.entity_type}</span>
                          {log.entity_id && (
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.78rem', display: 'block' }}>
                              ID: {log.entity_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: 300 }}>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(log.metadata, null, 1)}
                          </pre>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                          {log.ip_address || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE USER */}
      {createUserOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setCreateUserOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 520, backgroundColor: '#ffffff', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Plus size={20} color="var(--color-gold)" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                  إضافة مستخدم جديد
                </h3>
              </div>
              <button onClick={() => setCreateUserOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 6, fontSize: '0.88rem' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="form-label">الاسم الكامل *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: د. عبدالرحمن بن محمد"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">البريد الإلكتروني *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@mishkat.edu.sa"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="form-label">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="05XXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="form-label">نوع الحساب (Role) *</label>
                <select
                  className="form-control"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="supervisor">مشرف تربوي (Supervisor)</option>
                  <option value="admin">مدير نظام (Admin)</option>
                  <option value="student">طالب (Student)</option>
                  <option value="parent">ولي أمر (Parent)</option>
                </select>
              </div>

              <div>
                <label className="form-label">كلمة المرور الابتدائية *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="ltr"
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 4, display: 'block' }}>
                  يتم تشفير كلمة المرور فورًا باستخدام bcrypt
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="mustChange"
                  checked={newMustChange}
                  onChange={(e) => setNewMustChange(e.target.checked)}
                />
                <label htmlFor="mustChange" style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                  إلزام المستخدم بتغيير كلمة المرور عند أول تسجيل دخول
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={submitting}>
                  {submitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم وتثبيت الصلاحيات'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setCreateUserOpen(false)} style={{ padding: 12 }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setEditUser(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 520, backgroundColor: '#ffffff', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit size={20} color="var(--color-gold)" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                  تعديل بيانات المستخدم: {editUser.name}
                </h3>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 6, fontSize: '0.88rem' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="form-label">الاسم الكامل</label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-control"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="form-label">رقم الهاتف</label>
                <input
                  type="text"
                  className="form-control"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="form-label">نوع الحساب (Role)</label>
                <select
                  className="form-control"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  disabled={editUser.role === 'admin'}
                >
                  <option value="admin">مدير نظام (Admin)</option>
                  <option value="supervisor">مشرف تربوي (Supervisor)</option>
                  <option value="student">طالب (Student)</option>
                  <option value="parent">ولي أمر (Parent)</option>
                </select>
                {editUser.role === 'admin' && (
                  <span style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 4, display: 'block' }}>
                    🔒 محمي: لا يمكن تغيير دور الحساب الإداري الرئيسي للمؤسسة
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">حالة الحساب</label>
                <select
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  disabled={editUser.role === 'admin'}
                >
                  <option value="active">فعال (Active)</option>
                  <option value="inactive">معطل (Inactive)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)} style={{ padding: 12 }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD BY ADMIN */}
      {resetModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setResetModalUser(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 500, backgroundColor: '#ffffff', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} color="var(--color-gold)" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                  إعادة تعيين كلمة المرور: {resetModalUser.name}
                </h3>
              </div>
              <button onClick={() => setResetModalUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {resetResult ? (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <CheckCircle2 size={30} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                    تمت إعادة تعيين كلمة المرور بنجاح!
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    تم تحديث كلمة المرور للمستخدم: <strong>{resetModalUser.email}</strong>
                  </p>

                  {resetResult.tempPassword && (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>كلمة المرور الجديدة / المؤقتة:</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: 1 }}>
                        {resetResult.tempPassword}
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => copyToClipboard(resetResult.tempPassword!)}
                        style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                        <span>{copied ? 'تم النسخ' : 'نسخ كلمة المرور'}</span>
                      </button>
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() => setResetModalUser(null)}
                    style={{ padding: '10px 20px', marginTop: 8 }}
                  >
                    إغلاق
                  </button>
                </div>
              ) : (
                <form onSubmit={handleExecuteReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {formError && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 6, fontSize: '0.88rem' }}>
                      {formError}
                    </div>
                  )}

                  <div style={{ backgroundColor: 'var(--color-primary-subtle)', padding: '12px 14px', borderRadius: 6, fontSize: '0.86rem', color: 'var(--color-primary-dark)' }}>
                    المستخدم: <strong>{resetModalUser.name}</strong> ({resetModalUser.email}) — {roleBadge(resetModalUser.role)}
                  </div>

                  <div>
                    <label className="form-label">كلمة المرور الجديدة المخصصة (اختياري)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="اترك هذا الحقل فارغًا لتوليد كلمة مرور مؤقتة قوية تلقائيًا"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      dir="ltr"
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 4, display: 'block' }}>
                      إذا تُركت فارغة، سيقوم النظام بإنشاء كلمة مرور مؤقتة معقدة تلقائيًا.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="forceResetChange"
                      checked={forceChangePassword}
                      onChange={(e) => setForceChangePassword(e.target.checked)}
                    />
                    <label htmlFor="forceResetChange" style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                      إلزام المستخدم بتغيير كلمة المرور فور تسجيل دخوله القادم
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }} disabled={submitting}>
                      {submitting ? 'جاري إعادة التعيين...' : 'تأكيد إعادة تعيين كلمة المرور'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setResetModalUser(null)} style={{ padding: 12 }}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: USER DETAILS VIEW */}
      {detailUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setDetailUser(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 560, backgroundColor: '#ffffff', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Eye size={20} color="var(--color-gold)" />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                  تفاصيل المستخدم: {detailUser.user.name}
                </h3>
              </div>
              <button onClick={() => setDetailUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>الاسم الكامل</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{detailUser.user.name}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>نوع الحساب</div>
                  <div style={{ marginTop: 2 }}>{roleBadge(detailUser.user.role)}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>البريد الإلكتروني</div>
                  <div style={{ fontWeight: 600, marginTop: 2, direction: 'ltr', textAlign: 'right' }}>{detailUser.user.email}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>رقم الهاتف</div>
                  <div style={{ fontWeight: 600, marginTop: 2, direction: 'ltr', textAlign: 'right' }}>{detailUser.user.phone || '—'}</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>حالة الحساب</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {detailUser.user.status === 'active' ? '🟢 فعال' : '🔴 غير فعال'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>فرض تغيير كلمة المرور</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {detailUser.user.must_change_password ? 'نعم (إلزامي)' : 'لا'}
                  </div>
                </div>
              </div>

              {/* Linked Student details */}
              {detailUser.linkedData?.student && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                  <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                    بيانات السجل الأكاديمي المرتبط
                  </h5>
                  <div style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 6, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>الرقم الأكاديمي: <strong>{detailUser.linkedData.student.student_number}</strong></div>
                    <div>المسار التعليمي: <strong>{detailUser.linkedData.student.educational_track}</strong></div>
                    <div>الحالة الأكاديمية: <strong>{detailUser.linkedData.student.academic_status}</strong></div>
                    <div>تاريخ القبول: <strong>{detailUser.linkedData.student.admission_date}</strong></div>
                  </div>
                </div>
              )}

              {/* Linked Parent details */}
              {detailUser.linkedData?.parent && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                  <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                    الأبناء المرتبطون بولي الأمر ({detailUser.linkedData.parent.children?.length || 0})
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detailUser.linkedData.parent.children?.map((c: any) => (
                      <div key={c.id} style={{ backgroundColor: '#f5f3ff', padding: '8px 12px', borderRadius: 6, fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.student_name || 'طالب مقيد'} ({c.student_number})</span>
                        <span style={{ color: '#6b21a8', fontWeight: 600 }}>{c.relationship_type || 'ابن'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => setDetailUser(null)}
                style={{ width: '100%', padding: 12, marginTop: 8 }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
