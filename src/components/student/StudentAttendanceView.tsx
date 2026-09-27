import React, { useState, useEffect } from 'react';
import {
  fetchStudentAttendance,
  submitStudentExcuse,
  fetchStudentExcuses,
} from '../../services/studentApi';
import { AttendanceRecord, AttendanceSummary, AttendanceExcuse, AttendanceStatus } from '../../types';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Plus,
  X,
  MapPin,
  Calendar,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface StudentAttendanceViewProps {
  studentId: string;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ studentId }) => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<AttendanceExcuse[]>([]);
  const [loading, setLoading] = useState(true);

  // Excuse Modal
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
  const [excuseDate, setExcuseDate] = useState(new Date().toISOString().split('T')[0]);
  const [excuseType, setExcuseType] = useState('صحي');
  const [excuseReason, setExcuseReason] = useState('');
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAttendance = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [attData, excData] = await Promise.all([
        fetchStudentAttendance(studentId),
        fetchStudentExcuses(),
      ]);
      setSummary(attData.summary || null);
      setRecords(attData.records || []);
      setExcuses(excData || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'تعذر جلب سجل الحضور', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [studentId]);

  const handleSubmitExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check 48h limit on client side as well
    const targetDate = new Date(excuseDate);
    const now = new Date();
    const diffHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);

    if (diffHours > 48) {
      setErrorMessage('انقضت المهلة النظامية لتقديم العذر (48 ساعة من تاريخ الغياب). يرجى مراجعة إدارة المؤسسة مباشرة.');
      return;
    }

    if (!excuseReason.trim()) {
      setErrorMessage('يرجى كتابة سبب مفصل للعذر.');
      return;
    }

    try {
      setSubmittingExcuse(true);
      const res = await submitStudentExcuse({
        student_id: studentId,
        excuse_date: excuseDate,
        excuse_type: excuseType,
        reason: excuseReason.trim(),
      });
      showToast(res.message || 'تم تقديم طلب العذر بنجاح وهو قيد مراجعة الإدارة', 'success');
      setIsExcuseModalOpen(false);
      setExcuseReason('');
      loadAttendance();
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تقديم طلب العذر');
    } finally {
      setSubmittingExcuse(false);
    }
  };

  const statusColors: Record<AttendanceStatus, { bg: string; text: string }> = {
    حاضر: { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a' },
    غائب: { bg: 'rgba(220, 38, 38, 0.12)', text: '#dc2626' },
    متأخر: { bg: 'rgba(217, 119, 6, 0.12)', text: '#d97706' },
    مستأذن: { bg: 'rgba(2, 132, 199, 0.12)', text: '#0284c7' },
    'غياب بعذر': { bg: 'rgba(147, 51, 234, 0.12)', text: '#9333ea' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#15803d' : '#b91c1c',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
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
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CalendarCheck size={22} color="var(--color-gold-dark)" />
            <span className="badge badge-accepted" style={{ fontSize: '0.78rem' }}>
              الرصد الإلكتروني للحضور
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
            سجل الحضور والانضباط الأكاديمي
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            متابعة دقيقة لنسب الحضور في اللقاءات التأصيلية والورش التفاعلية مع إمكانية تقديم الأعذار الرسمية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMessage('');
            setIsExcuseModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>تقديم طلب عذر غياب</span>
        </button>
      </div>

      {/* Warning Notice if >= 3 unexcused absences */}
      {summary?.warning_triggered && (
        <div
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderRight: '5px solid #dc2626',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <ShieldAlert size={26} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem', marginBottom: 4 }}>
              ⚠️ تنبيه انضباطي: تجاوز حد الغياب المسموح به (3 حالات غياب غير مبررة)
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
              سجلت منظومة الحضور تراكم <strong>{summary.unexcused_absences}</strong> غيابات بدون عذر رسمي معتمد. نأمل تقديم الأعذار الثبوتية خلال المهلة النظامية (48 ساعة) أو مراجعة المشرف لتفادي الحسم من التقييم القيمي.
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 6 }}>
            نسبة الالتزام باللقاءات
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {summary ? `${summary.discipline_rate}%` : '--%'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            معدل تراكمي
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 6 }}>
            أيام الحضور
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>
            {summary?.present || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            جلسة مكتملة
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 6 }}>
            الغياب بعذر معتمد
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9333ea' }}>
            {summary?.excused || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            أعذار مقبولة رسميًا
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 6 }}>
            الغياب بدون عذر
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {summary?.absent || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            غياب غير مبرر
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: 6 }}>
            مرات التأخر
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>
            {summary?.late || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            تأخر عن الموعد
          </div>
        </div>
      </div>

      {/* Main Content Grid: Attendance History & Excuses List */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Attendance Records Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              سجل اللقاءات والجلسات المعتمدة
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              جاري تحميل سجل الحضور...
            </div>
          ) : records.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              لا توجد لقاءات مسجلة لك حتى الآن.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>التاريخ</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>عنوان اللقاء</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>المكان والوقت</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>الحالة</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 800 }}>الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const colors = statusColors[rec.status] || { bg: 'rgba(0,0,0,0.06)', text: '#333' };
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.84rem', fontWeight: 700 }}>
                          {rec.session_date}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          {rec.session_title}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          <div>{rec.location}</div>
                          <div style={{ color: 'var(--color-text-muted)' }}>{rec.start_time || '16:00'}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: colors.bg,
                              color: colors.text,
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'inline-block',
                            }}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {rec.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Excuses Status Sidebar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            height: 'fit-content',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck size={20} color="var(--color-gold-dark)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              أعذاري المقدمة
            </h3>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(198, 146, 20, 0.08)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--color-primary-dark)',
              lineHeight: 1.5,
            }}
          >
            <strong>ضابط التقديم:</strong> تنتهي صلاحية تقديم عذر الغياب إلكترونيًا بعد <strong>48 ساعة</strong> من تاريخ انعقاد الجلسة.
          </div>

          {excuses.length === 0 ? (
            <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              لم تقدم أي طلب عذر حتى الآن.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {excuses.map((exc) => (
                <div
                  key={exc.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>
                      عذر عن {exc.excuse_date}
                    </span>
                    <span
                      className={`badge ${
                        exc.review_status === 'approved'
                          ? 'badge-accepted'
                          : exc.review_status === 'rejected'
                          ? 'badge-rejected'
                          : 'badge-review'
                      }`}
                      style={{ fontSize: '0.74rem' }}
                    >
                      {exc.review_status === 'approved'
                        ? 'مقبول'
                        : exc.review_status === 'rejected'
                        ? 'غير معتمد'
                        : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    <strong>النوع:</strong> {exc.excuse_type}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {exc.reason}
                  </div>

                  {exc.reviewer_notes && (
                    <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--color-gold-dark)', fontWeight: 600 }}>
                      ملاحظة الإدارة: {exc.reviewer_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: SUBMIT EXCUSE */}
      {isExcuseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  تقديم طلب عذر غياب رسمي
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExcuseModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitExcuse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  تاريخ يوم الغياب *
                </label>
                <input
                  type="date"
                  required
                  value={excuseDate}
                  onChange={(e) => setExcuseDate(e.target.value)}
                  className="form-input"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  المهلة النظامية لتقديم العذر: 48 ساعة فقط من موعد الغياب.
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  نوع العذر *
                </label>
                <select
                  value={excuseType}
                  onChange={(e) => setExcuseType(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 700 }}
                >
                  <option value="صحي">صحي (مراجعة أو إجازة مرضية)</option>
                  <option value="طارئ أسري">طارئ أسري</option>
                  <option value="ارتباط أكاديمي">ارتباط أكاديمي أو اختباري</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                  تفاصيل وسبب الغياب *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="يرجى كتابة تفاصيل العذر بوضوح ليتمكن المشرف من اعتماده..."
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsExcuseModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingExcuse}
                  className="btn btn-primary btn-sm"
                >
                  {submittingExcuse ? 'جاري الإرسال...' : 'إرسال طلب العذر للاعتماد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
