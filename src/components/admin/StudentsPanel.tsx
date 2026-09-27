import React, { useState, useEffect } from 'react';
import { fetchAdminStudents, fetchAdminStudentDetail, updateAdminStudent, resetAdminStudentAccess } from '../../services/api';
import { Student, AcademicStatus } from '../../types';
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
  ShieldAlert,
  Compass,
  Calendar,
  Phone,
  School,
  FileText,
} from 'lucide-react';

export const StudentsPanel: React.FC = () => {
  const { addToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [trackFilter, setTrackFilter] = useState('الكل');

  // View Student Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Edit Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStatus, setNewStatus] = useState<AcademicStatus>('نشط');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Reset Password Modal
  const [resetModalStudent, setResetModalStudent] = useState<Student | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ student_number: string; temporary_password: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStudents = () => {
    setLoading(true);
    fetchAdminStudents(search, statusFilter, trackFilter)
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, trackFilter]);

  const handleOpenDetail = async (id: string) => {
    setSelectedStudentId(id);
    setDetailLoading(true);
    try {
      const data = await fetchAdminStudentDetail(id);
      setStudentDetail(data);
    } catch (err: any) {
      addToast(err.message || 'فشل جلب تفاصيل الطالب', 'error');
      setSelectedStudentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setUpdatingStatus(true);
    try {
      await updateAdminStudent(editingStudent.id, { academic_status: newStatus });
      addToast('تم تحديث الحالة الأكاديمية بنجاح', 'success');
      setEditingStudent(null);
      loadStudents();
    } catch (err: any) {
      addToast(err.message || 'فشل تحديث الحالة', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResetAccess = async () => {
    if (!resetModalStudent) return;
    setResetting(true);
    try {
      const res = await resetAdminStudentAccess(resetModalStudent.id);
      setResetCredentials(res);
      addToast('تمت إعادة تعيين كلمة مرور الطالب بنجاح', 'success');
    } catch (err: any) {
      addToast(err.message || 'تعذر إعادة تعيين كلمة المرور', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!resetCredentials) return;
    const text = `بيانات الدخول لبوابة الطالب:\nالرقم الأكاديمي: ${resetCredentials.student_number}\nكلمة المرور المؤقتة: ${resetCredentials.temporary_password}\nرابط الدخول: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Metrics
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.academic_status === 'نشط').length;
  const pausedCount = students.filter((s) => s.academic_status === 'متوقف مؤقتًا').length;
  const graduatedCount = students.filter((s) => s.academic_status === 'متخرج').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metric Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>إجمالي الطلاب المقيدين</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
            {totalCount}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الطلاب النشطون</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-accepted)', marginTop: 4 }}>
            {activeCount}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>متوقف مؤقتًا</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-review)', marginTop: 4 }}>
            {pausedCount}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الخريجون</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-completed)', marginTop: 4 }}>
            {graduatedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={18} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--color-text-light)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="البحث بالرقم الأكاديمي، اسم الطالب، الهاتف، المدرسة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: 40 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--color-text-light)" />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="الكل">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="متوقف مؤقتًا">متوقف مؤقتًا</option>
              <option value="متخرج">متخرج</option>
              <option value="منسحب">منسحب</option>
              <option value="غير نشط">غير نشط</option>
            </select>
          </div>

          <div>
            <select
              className="form-control"
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="الكل">جميع المسارات التعليمية</option>
              <option value="العلوم الشرعية">العلوم الشرعية</option>
              <option value="العلوم والمعارف">العلوم والمعارف المعاصرة</option>
              <option value="بناء الشخصية والقيم">بناء الشخصية والقيم</option>
              <option value="القيادة وصناعة الأثر">القيادة وصناعة الأثر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div>جاري تحميل قائمة الطلاب...</div>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>لا يوجد طلاب مطابقون</h4>
            <p style={{ margin: '6px 0 0', fontSize: '0.86rem' }}>
              يمكنك اعتماد المقبولين من قسم "المتقدمين" والضغط على "إنشاء حساب طالب" لإضافتهم هنا.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>الرقم الأكاديمي</th>
                  <th>اسم الطالب</th>
                  <th>المسار التعليمي</th>
                  <th>الصف والمدرسة</th>
                  <th>هاتف التواصل</th>
                  <th>الحالة</th>
                  <th>تاريخ القيد</th>
                  <th style={{ textAlign: 'left' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu) => (
                  <tr key={stu.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-bg-subtle)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.86rem',
                          color: 'var(--color-primary-dark)',
                        }}
                      >
                        {stu.student_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{stu.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{stu.user_email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stu.educational_track}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{stu.current_grade}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{stu.school} ({stu.city})</div>
                    </td>
                    <td dir="ltr" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      {stu.phone}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          stu.academic_status === 'نشط'
                            ? 'badge-accepted'
                            : stu.academic_status === 'متخرج'
                            ? 'badge-completed'
                            : 'badge-review'
                        }`}
                      >
                        {stu.academic_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {stu.admission_date}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenDetail(stu.id)}
                          className="btn btn-sm btn-outline-gold"
                          title="عرض تفاصيل الطالب"
                          style={{ padding: '6px 10px' }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setNewStatus(stu.academic_status);
                          }}
                          className="btn btn-sm btn-outline-gold"
                          title="تعديل الحالة الأكاديمية"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setResetModalStudent(stu);
                            setResetCredentials(null);
                          }}
                          className="btn btn-sm"
                          style={{ padding: '6px 10px', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-primary-dark)' }}
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound size={14} />
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

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudentId(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              padding: 0,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-primary-dark)',
                color: '#ffffff',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={20} color="var(--color-gold-light)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  ملف الطالب الأكاديمي
                </h3>
              </div>
              <button onClick={() => setSelectedStudentId(null)} style={{ color: 'rgba(255,255,255,0.7)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div>جاري تحميل ملف الطالب...</div>
              </div>
            ) : studentDetail?.student ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header Banner */}
                <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 18, borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {studentDetail.student.student_name}
                    </h2>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <span>المدرسة: {studentDetail.student.school}</span>
                      <span>•</span>
                      <span>المدينة: {studentDetail.student.city}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>الرقم الأكاديمي</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dark)' }} dir="ltr">
                      {studentDetail.student.student_number}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>المسار التعليمي المعتمد</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginTop: 2 }}>
                      {studentDetail.student.educational_track}
                    </div>
                  </div>

                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>الحالة الأكاديمية</div>
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-accepted">{studentDetail.student.academic_status}</span>
                    </div>
                  </div>

                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>تاريخ القبول والاعتماد</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: 2 }}>
                      {studentDetail.student.admission_date}
                    </div>
                  </div>

                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>رقم طلب التقديم الأصلي</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginTop: 2 }}>
                      {studentDetail.student.application_number}
                    </div>
                  </div>

                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>هاتف الطالب</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }} dir="ltr">
                      {studentDetail.student.applicant_phone}
                    </div>
                  </div>

                  <div style={{ padding: 12, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>ولي الأمر وهاتفه</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>
                      {studentDetail.student.guardian_name} ({studentDetail.student.guardian_relationship}): {studentDetail.student.guardian_phone}
                    </div>
                  </div>
                </div>

                {/* Activities Progress */}
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 8, fontSize: '0.95rem' }}>
                    إحصائيات الأنشطة والواجبات:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    إجمالي الأنشطة المسندة: <strong>{studentDetail.activity_stats?.total || 0}</strong> • تم تسليم: <strong>{studentDetail.activity_stats?.completed || 0}</strong>
                  </div>
                </div>

                {/* Internal Admin Note Warning */}
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: '0.82rem', color: '#92400e' }}>
                  🔒 <strong>خصوصية الطالب:</strong> يتم عزل الملاحظات الداخلية للجنة تمامًا ولا تظهر في بوابة الطالب نهائيًا.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStudent(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', color: '#ffffff', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                تعديل الحالة الأكاديمية
              </h3>
              <button onClick={() => setEditingStudent(null)} style={{ color: 'rgba(255,255,255,0.7)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">اسم الطالب: {editingStudent.student_name}</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  الرقم الأكاديمي: {editingStudent.student_number}
                </div>
              </div>

              <div>
                <label className="form-label">الحالة الأكاديمية الجديدة</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AcademicStatus)}
                >
                  <option value="نشط">نشط (مستمر في الدراسة)</option>
                  <option value="متوقف مؤقتًا">متوقف مؤقتًا (تأجيل فصل)</option>
                  <option value="متخرج">متخرج (أتم متطلبات البرنامج)</option>
                  <option value="منسحب">منسحب</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setEditingStudent(null)} className="btn btn-outline-gold">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingStatus}>
                  {updatingStatus ? 'جاري الحفظ...' : 'حفظ الحالة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Student Access Modal */}
      {resetModalStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetModalStudent(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div style={{ backgroundColor: 'var(--color-primary-dark)', color: '#ffffff', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                إعادة تعيين كلمة مرور الطالب
              </h3>
              <button onClick={() => setResetModalStudent(null)} style={{ color: 'rgba(255,255,255,0.7)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!resetCredentials ? (
                <>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                    هل أنت متأكد من رغبتك في إعادة تعيين كلمة مرور الطالب{' '}
                    <strong>{resetModalStudent.student_name}</strong> (الرقم: {resetModalStudent.student_number})؟
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                    سيتم توليد كلمة مرور مؤقتة جديدة، وإلزام الطالب بتغييرها فور تسجيل دخوله القادم.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button onClick={() => setResetModalStudent(null)} className="btn btn-outline-gold">
                      إلغاء
                    </button>
                    <button onClick={handleResetAccess} className="btn btn-primary" disabled={resetting}>
                      {resetting ? 'جاري التعيين...' : 'تأكيد إعادة التعيين'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      backgroundColor: 'var(--status-accepted-bg)',
                      border: '1px solid #86efac',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      color: 'var(--status-accepted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <CheckCircle2 size={20} />
                    <span style={{ fontWeight: 700 }}>تمت إعادة التعيين بنجاح!</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 16, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>الرقم الأكاديمي: </span>
                      <strong dir="ltr">{resetCredentials.student_number}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>كلمة المرور المؤقتة: </span>
                      <code style={{ fontSize: '1rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                        {resetCredentials.temporary_password}
                      </code>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    انسخ هذه البيانات وسلمها للطالب بأمان. لن تظهر كلمة المرور مرة أخرى.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
                    <button onClick={handleCopyCredentials} className="btn btn-gold" style={{ gap: 6 }}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'تم النسخ!' : 'نسخ البيانات'}</span>
                    </button>

                    <button onClick={() => setResetModalStudent(null)} className="btn btn-primary">
                      تم وإغلاق
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
