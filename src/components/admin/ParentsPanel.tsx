import React, { useState, useEffect } from 'react';
import {
  fetchAdminParents,
  fetchAdminParentDetail,
  createAdminParent,
  linkStudentToParent,
  unlinkStudentFromParent,
  updateAdminParent,
  resetAdminParentAccess,
  fetchAdminStudents,
} from '../../services/api';
import { Parent, LinkedStudentDetail, Student } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Filter,
  Eye,
  KeyRound,
  Edit,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  Shield,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

export const ParentsPanel: React.FC = () => {
  const { addToast } = useApp();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  // Enrolled students for linking dropdown
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // View Parent Detail Modal
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [parentDetail, setParentDetail] = useState<{ parent: Parent; linked_students: LinkedStudentDetail[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create Parent Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('أب');
  const [address, setAddress] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [selectedStudentForNewParent, setSelectedStudentForNewParent] = useState('');
  const [creating, setCreating] = useState(false);
  const [newParentCredentials, setNewParentCredentials] = useState<any | null>(null);

  // Link Student Modal
  const [linkModalParent, setLinkModalParent] = useState<Parent | null>(null);
  const [studentToLink, setStudentToLink] = useState('');
  const [linkRel, setLinkRel] = useState('أب');
  const [linkPrimary, setLinkPrimary] = useState(true);
  const [linking, setLinking] = useState(false);

  // Edit Parent Modal
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRel, setEditRel] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState('نشط');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal
  const [resetModalParent, setResetModalParent] = useState<Parent | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ identifier: string; temporary_password: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadParents = () => {
    setLoading(true);
    fetchAdminParents(search, statusFilter)
      .then((data) => {
        setParents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadParents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Load students for dropdowns
  useEffect(() => {
    fetchAdminStudents()
      .then((data) => setAllStudents(data))
      .catch((err) => console.error(err));
  }, []);

  const handleOpenDetail = async (id: string) => {
    setSelectedParentId(id);
    setDetailLoading(true);
    try {
      const data = await fetchAdminParentDetail(id);
      setParentDetail(data);
    } catch (err: any) {
      addToast(err.message || 'فشل جلب تفاصيل ولي الأمر', 'error');
      setSelectedParentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      addToast('يرجى إدخال اسم ولي الأمر ورقم الهاتف', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await createAdminParent({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship,
        address: address.trim() || undefined,
        national_id: nationalId.trim() || undefined,
        student_id: selectedStudentForNewParent || undefined,
      });

      addToast('تم إنشاء وتفعيل حساب ولي الأمر بنجاح', 'success');
      setNewParentCredentials(res.credentials);
      loadParents();
    } catch (err: any) {
      addToast(err.message || 'تعذر إنشاء حساب ولي الأمر', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalParent || !studentToLink) {
      addToast('يرجى اختيار الطالب المراد ربطه', 'error');
      return;
    }

    setLinking(true);
    try {
      await linkStudentToParent(linkModalParent.id, studentToLink, linkRel, linkPrimary);
      addToast('تم ربط الطالب بولي الأمر بنجاح', 'success');
      setLinkModalParent(null);
      setStudentToLink('');
      loadParents();
      if (selectedParentId === linkModalParent.id) {
        handleOpenDetail(linkModalParent.id);
      }
    } catch (err: any) {
      addToast(err.message || 'تعذر ربط الطالب', 'error');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (parentId: string, studentId: string) => {
    if (!window.confirm('هل أنت متأكد من فك ارتباط هذا الطالب بولي الأمر؟ سيتم إلغاء صلاحية ولي الأمر في الوصول لبيانات الطالب فورًا.')) {
      return;
    }

    try {
      await unlinkStudentFromParent(parentId, studentId);
      addToast('تم فك ارتباط الطالب بنجاح وإلغاء صلاحية الوصول', 'success');
      loadParents();
      if (selectedParentId === parentId) {
        handleOpenDetail(parentId);
      }
    } catch (err: any) {
      addToast(err.message || 'تعذر فك ارتباط الطالب', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setSavingEdit(true);
    try {
      await updateAdminParent(editingParent.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        relationship: editRel,
        address: editAddress.trim(),
        status: editStatus,
      });
      addToast('تم تحديث بيانات ولي الأمر بنجاح', 'success');
      setEditingParent(null);
      loadParents();
    } catch (err: any) {
      addToast(err.message || 'فشل تحديث البيانات', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetAccess = async () => {
    if (!resetModalParent) return;
    setResetting(true);
    try {
      const res = await resetAdminParentAccess(resetModalParent.id);
      setResetCredentials(res);
      addToast('تم إعادة تعيين كلمة المرور بنجاح', 'success');
      loadParents();
    } catch (err: any) {
      addToast(err.message || 'فشل إعادة التعيين', 'error');
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner and Quick Add */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(10, 58, 42, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="var(--color-primary-dark)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              إدارة أولياء الأمور
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
            إدارة حسابات أولياء الأمور المعتمدة، ربط الأبناء، والتحكم في صلاحيات الوصول الآمن.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setPhone('');
            setEmail('');
            setRelationship('أب');
            setAddress('');
            setNationalId('');
            setSelectedStudentForNewParent('');
            setNewParentCredentials(null);
            setCreateModalOpen(true);
          }}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          <UserPlus size={16} />
          <span>إضافة ولي أمر جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، البريد أو السجل المدني..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              fontSize: '0.88rem',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 12, top: 13 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              fontSize: '0.84rem',
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="الكل">جميع الحالات</option>
            <option value="نشط">نشط</option>
            <option value="غير نشط">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Parents Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            جارٍ تحميل قائمة أولياء الأمور...
          </div>
        ) : parents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            لا يوجد أولياء أمور مسجلون يطابقون خيارات البحث.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>ولي الأمر</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>الصفة</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>رقم الجوال</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>الأبناء المرتبطون</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>الحالة</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{p.email || p.user_email || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                      {p.relationship || 'ولي أمر'}
                    </td>
                    <td style={{ padding: '12px 16px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                      {p.phone}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: Number(p.children_count || 0) > 0 ? 'rgba(10, 58, 42, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                          color: Number(p.children_count || 0) > 0 ? 'var(--color-primary-dark)' : 'var(--color-error)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        {p.children_count || 0} طالب
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                          backgroundColor: p.status === 'نشط' ? 'rgba(22, 101, 52, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                          color: p.status === 'نشط' ? 'var(--color-success)' : 'var(--color-error)',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetail(p.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                          }}
                          title="عرض التفاصيل والأبناء"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Link Student */}
                        <button
                          onClick={() => {
                            setLinkModalParent(p);
                            setStudentToLink('');
                            setLinkRel(p.relationship || 'أب');
                            setLinkPrimary(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--color-gold-dark)',
                          }}
                          title="ربط طالب بولي الأمر"
                        >
                          <UserPlus size={15} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingParent(p);
                            setEditFullName(p.full_name);
                            setEditPhone(p.phone);
                            setEditRel(p.relationship || 'ولي أمر');
                            setEditAddress(p.address || '');
                            setEditStatus(p.status);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--color-primary-dark)',
                          }}
                          title="تعديل البيانات"
                        >
                          <Edit size={15} />
                        </button>

                        {/* Reset Access */}
                        <button
                          onClick={() => {
                            setResetModalParent(p);
                            setResetCredentials(null);
                            setCopied(false);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(198, 146, 20, 0.5)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: 'var(--color-gold-dark)',
                          }}
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. View Parent Detail Modal */}
      {selectedParentId && parentDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedParentId(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  ملف ولي الأمر: {parentDetail.parent.full_name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  رقم الهاتف: {parentDetail.parent.phone} • الصفة: {parentDetail.parent.relationship}
                </span>
              </div>
              <button onClick={() => setSelectedParentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Linked Students Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  الأبناء المرتبطون بهذا الحساب ({parentDetail.linked_students.length}):
                </h4>
                <button
                  onClick={() => {
                    setLinkModalParent(parentDetail.parent);
                    setStudentToLink('');
                  }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  + ربط طالب إضافي
                </button>
              </div>

              {parentDetail.linked_students.length === 0 ? (
                <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  لا يوجد طلاب مرتبطون بهذا الحساب حاليًا.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {parentDetail.linked_students.map((ls) => (
                    <div
                      key={ls.relationship_id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          {ls.student_name} ({ls.student_number})
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                          المسار: {ls.educational_track} • الصف: {ls.current_grade} • صلة القرابة: {ls.relationship} {ls.is_primary ? '(أساسي)' : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnlink(parentDetail.parent.id, ls.student_id)}
                        style={{
                          backgroundColor: 'rgba(220, 38, 38, 0.08)',
                          color: 'var(--color-error)',
                          border: '1px solid rgba(220, 38, 38, 0.2)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="فك ارتباط الطالب"
                      >
                        <Trash2 size={13} />
                        <span>فك الارتباط</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Create Parent Modal */}
      {createModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                  إضافة وتفعيل حساب ولي أمر جديد
                </h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {newParentCredentials ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ backgroundColor: 'rgba(22, 101, 52, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} />
                  <span>تم إنشاء الحساب بنجاح! انسخ بيانات الدخول لتسليمها لولي الأمر:</span>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong>المعرف / رقم الهاتف:</strong> <code style={{ direction: 'ltr', display: 'inline-block' }}>{newParentCredentials.identifier}</code>
                  </div>
                  <div style={{ fontSize: '0.84rem' }}>
                    <strong>كلمة المرور المؤقتة:</strong> <code style={{ direction: 'ltr', display: 'inline-block', color: 'var(--color-primary-dark)', fontWeight: 800 }}>{newParentCredentials.temporary_password}</code>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(`بيانات دخول ولي الأمر - مؤسسة مِشكاة\nالمعرف: ${newParentCredentials.identifier}\nكلمة المرور المؤقتة: ${newParentCredentials.temporary_password}\nرابط البوابة: http://localhost:5000`)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ بيانات الدخول'}</span>
                </button>

                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-primary"
                  style={{ marginTop: 4 }}
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateParent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    الاسم الكامل لولي الأمر: *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: خالد بن إبراهيم المنصور"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                      رقم الجوال: *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0501234567"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                      صلة القرابة:
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                    >
                      <option value="أب">أب</option>
                      <option value="أم">أم</option>
                      <option value="ولي أمر">ولي أمر شرعي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    البريد الإلكتروني (اختياري):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    ربط بطالب مسجل حاليًا (اختياري):
                  </label>
                  <select
                    value={selectedStudentForNewParent}
                    onChange={(e) => setSelectedStudentForNewParent(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                  >
                    <option value="">-- بدون ربط الآن --</option>
                    {allStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.student_name} ({st.student_number}) - {st.educational_track}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ marginTop: 8, padding: '10px', fontWeight: 700 }}
                >
                  {creating ? 'جارٍ الإنشاء والتفعيل...' : 'إنشاء حساب ولي الأمر'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. Link Student Modal */}
      {linkModalParent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setLinkModalParent(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                ربط طالب بولي الأمر: {linkModalParent.full_name}
              </h3>
              <button onClick={() => setLinkModalParent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkStudent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  اختر الطالب المراد ربطه: *
                </label>
                <select
                  value={studentToLink}
                  onChange={(e) => setStudentToLink(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                >
                  <option value="">-- اختر الطالب --</option>
                  {allStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.student_name} ({st.student_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  صلة القرابة بهذا الطالب:
                </label>
                <select
                  value={linkRel}
                  onChange={(e) => setLinkRel(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                >
                  <option value="أب">أب</option>
                  <option value="أم">أم</option>
                  <option value="ولي أمر">ولي أمر شرعي</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={linkPrimary}
                  onChange={(e) => setLinkPrimary(e.target.checked)}
                />
                <label htmlFor="primaryCheck" style={{ fontSize: '0.84rem', cursor: 'pointer' }}>
                  تعيين كولي أمر أساسي للطالب
                </label>
              </div>

              <button
                type="submit"
                disabled={linking}
                className="btn btn-primary"
                style={{ marginTop: 10, padding: '10px', fontWeight: 700 }}
              >
                {linking ? 'جارٍ الربط...' : 'تأكيد ربط الطالب'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Parent Modal */}
      {editingParent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setEditingParent(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                تعديل بيانات ولي الأمر
              </h3>
              <button onClick={() => setEditingParent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>الاسم:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>رقم الهاتف:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>حالة الحساب:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.88rem' }}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="btn btn-primary"
                style={{ marginTop: 8, padding: '10px', fontWeight: 700 }}
              >
                {savingEdit ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Reset Password Modal */}
      {resetModalParent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setResetModalParent(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} color="var(--color-gold-dark)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                  إعادة تعيين كلمة مرور ولي الأمر
                </h3>
              </div>
              <button onClick={() => setResetModalParent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {resetCredentials ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ backgroundColor: 'rgba(22, 101, 52, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.84rem' }}>
                  تم إنشاء كلمة مرور مؤقتة وتفعيل إجبار التغيير عند أول تسجيل دخول:
                </div>

                <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}>
                  <div>المعرف: <code>{resetCredentials.identifier}</code></div>
                  <div style={{ marginTop: 4 }}>كلمة المرور المؤقتة: <code style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{resetCredentials.temporary_password}</code></div>
                </div>

                <button
                  onClick={() => copyToClipboard(`كلمة المرور المؤقتة لولي الأمر:\nالمعرف: ${resetCredentials.identifier}\nكلمة المرور: ${resetCredentials.temporary_password}`)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ البيانات'}</span>
                </button>

                <button onClick={() => setResetModalParent(null)} className="btn btn-primary">
                  إغلاق
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
                  سيتم توليد كلمة مرور جديدة مشفرة لولي الأمر <strong>{resetModalParent.full_name}</strong> وإلزامه بتغييرها فور الدخول لضمان أمان حسابه.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setResetModalParent(null)} className="btn btn-outline">
                    إلغاء
                  </button>
                  <button onClick={handleResetAccess} disabled={resetting} className="btn btn-primary">
                    {resetting ? 'جارٍ التعيين...' : 'تأكيد إعادة التعيين'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
