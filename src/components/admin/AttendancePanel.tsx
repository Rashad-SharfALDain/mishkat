import React, { useState, useEffect } from 'react';
import {
  fetchSessions,
  createSession,
  fetchSessionDetails,
  recordAttendance,
  fetchAdminExcuses,
  reviewExcuse,
} from '../../services/api';
import { EducationalSession, AttendanceRecord, AttendanceExcuse, AttendanceStatus } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const AttendancePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'excuses'>('sessions');
  const [sessions, setSessions] = useState<EducationalSession[]>([]);
  const [excuses, setExcuses] = useState<AttendanceExcuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Create Session Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('16:00');
  const [newEndTime, setNewEndTime] = useState('18:00');
  const [newLocation, setNewLocation] = useState('القاعة التعليمية الكبرى');
  const [creating, setCreating] = useState(false);

  // Record Attendance View
  const [recordingSession, setRecordingSession] = useState<EducationalSession | null>(null);
  const [sessionStudents, setSessionStudents] = useState<AttendanceRecord[]>([]);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Review Excuse Modal
  const [reviewingExcuse, setReviewingExcuse] = useState<AttendanceExcuse | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchSessions({
        status: filterStatus === 'all' ? undefined : filterStatus,
        date: filterDate || undefined,
      });
      setSessions(data);
    } catch (err: any) {
      showToast(err.message || 'تعذر جلب الجلسات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadExcuses = async () => {
    try {
      const data = await fetchAdminExcuses();
      setExcuses(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadExcuses();
  }, [filterStatus, filterDate]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    try {
      setCreating(true);
      await createSession({
        title: newTitle.trim(),
        session_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        location: newLocation,
      });
      showToast('تمت جدولة اللقاء التعليمي بنجاح', 'success');
      setIsCreateModalOpen(false);
      setNewTitle('');
      loadSessions();
    } catch (err: any) {
      showToast(err.message || 'فشل إنشاء الجلسة', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRecording = async (session: EducationalSession) => {
    try {
      setRecordingLoading(true);
      setRecordingSession(session);
      const data = await fetchSessionDetails(session.id);
      // Map students to local attendance records
      const records: AttendanceRecord[] = (data.students || []).map((s: any) => ({
        student_id: s.student_id,
        student_number: s.student_number,
        student_name: s.student_name,
        educational_track: s.educational_track,
        status: (s.attendance_status as AttendanceStatus) || 'حاضر',
        notes: s.notes || '',
      }));
      setSessionStudents(records);
    } catch (err: any) {
      showToast(err.message || 'تعذر جلب بيانات الطلاب للجلسة', 'error');
      setRecordingSession(null);
    } finally {
      setRecordingLoading(false);
    }
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setSessionStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  const handleSetStudentNotes = (studentId: string, notes: string) => {
    setSessionStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, notes } : s))
    );
  };

  const handleSetAllStatus = (status: AttendanceStatus) => {
    setSessionStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (!recordingSession) return;
    try {
      setSavingAttendance(true);
      const payload = sessionStudents.map((s) => ({
        student_id: s.student_id,
        status: s.status,
        notes: s.notes || undefined,
      }));
      await recordAttendance(recordingSession.id, payload);
      showToast('تم رصد واعتماد الحضور بنجاح، وإرسال التنبيهات اللازمة', 'success');
      setRecordingSession(null);
      loadSessions();
      loadExcuses();
    } catch (err: any) {
      showToast(err.message || 'تعذر حفظ سجل الحضور', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleOpenReview = (excuse: AttendanceExcuse) => {
    setReviewingExcuse(excuse);
    setReviewStatus('approved');
    setReviewerNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewingExcuse) return;
    try {
      setSubmittingReview(true);
      await reviewExcuse(reviewingExcuse.id, reviewStatus, reviewerNotes);
      showToast(
        reviewStatus === 'approved' ? 'تم قبول العذر وتحديث سجل الحضور' : 'تم رفض العذر وإشعار مقدم الطلب',
        'success'
      );
      setReviewingExcuse(null);
      loadExcuses();
      loadSessions();
    } catch (err: any) {
      showToast(err.message || 'تعذر معالجة مراجعة العذر', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const statusColors: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
    حاضر: { bg: 'rgba(22, 163, 74, 0.1)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.3)' },
    غائب: { bg: 'rgba(220, 38, 38, 0.1)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)' },
    متأخر: { bg: 'rgba(217, 119, 6, 0.1)', text: '#d97706', border: 'rgba(217, 119, 6, 0.3)' },
    مستأذن: { bg: 'rgba(2, 132, 199, 0.1)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.3)' },
    'غياب بعذر': { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea', border: 'rgba(147, 51, 234, 0.3)' },
  };

  const pendingExcusesCount = excuses.filter((e) => e.review_status === 'pending').length;

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

      {/* Sub Header Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('sessions');
              setRecordingSession(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: activeTab === 'sessions' ? 'var(--color-primary-dark)' : 'var(--color-surface)',
              color: activeTab === 'sessions' ? '#ffffff' : 'var(--color-text-main)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Calendar size={16} />
            <span>جدول الجلسات واللقاءات</span>
            <span
              style={{
                backgroundColor: activeTab === 'sessions' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.76rem',
              }}
            >
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('excuses');
              setRecordingSession(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: activeTab === 'excuses' ? 'var(--color-primary-dark)' : 'var(--color-surface)',
              color: activeTab === 'excuses' ? '#ffffff' : 'var(--color-text-main)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileCheck size={16} />
            <span>طلبات الأعذار</span>
            {pendingExcusesCount > 0 && (
              <span
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                }}
              >
                {pendingExcusesCount} معلق
              </span>
            )}
          </button>
        </div>

        {activeTab === 'sessions' && !recordingSession && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>جدولة لقاء جديد</span>
          </button>
        )}
      </div>

      {/* VIEW 1: RECORDING ATTENDANCE SCREEN */}
      {recordingSession ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => setRecordingSession(null)}
                  style={{
                    border: 'none',
                    background: 'var(--color-surface)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <ArrowRight size={14} />
                  <span>رجوع للجلسات</span>
                </button>
                <span className="badge badge-accepted" style={{ fontSize: '0.8rem' }}>
                  شاشة رصد الحضور
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 6px 0' }}>
                {recordingSession.title}
              </h2>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} color="var(--color-gold-dark)" />
                  {recordingSession.session_date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} color="var(--color-gold-dark)" />
                  {recordingSession.start_time || '16:00'} - {recordingSession.end_time || '18:00'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="var(--color-gold-dark)" />
                  {recordingSession.location}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                تحديد جماعي:
              </span>
              <button
                type="button"
                onClick={() => handleSetAllStatus('حاضر')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                الكل حاضر
              </button>
              <button
                type="button"
                onClick={() => handleSetAllStatus('غائب')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                الكل غائب
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {recordingLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                جاري جلب قائمة الطلاب...
              </div>
            ) : sessionStudents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                لا يوجد طلاب مقيدون بنشاط لهذه الجلسة.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>الرقم الأكاديمي</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>اسم الطالب</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>المسار التعليمي</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>حالة الحضور (الحالات الخمس)</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>ملاحظات تربوية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionStudents.map((st) => (
                      <tr
                        key={st.student_id}
                        style={{
                          borderBottom: '1px solid var(--color-border-light)',
                          transition: 'background-color var(--transition-fast)',
                        }}
                      >
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem' }} dir="ltr">
                          {st.student_number}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          {st.student_name}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                          {st.educational_track || 'العلوم الشرعية'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {(['حاضر', 'غائب', 'متأخر', 'مستأذن', 'غياب بعذر'] as AttendanceStatus[]).map((status) => {
                              const isSelected = st.status === status;
                              const colors = statusColors[status];
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleSetStudentStatus(st.student_id, status)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.78rem',
                                    fontWeight: isSelected ? 800 : 600,
                                    cursor: 'pointer',
                                    border: isSelected ? `2px solid ${colors.text}` : '1px solid var(--color-border-light)',
                                    backgroundColor: isSelected ? colors.bg : 'var(--color-surface)',
                                    color: isSelected ? colors.text : 'var(--color-text-secondary)',
                                    transition: 'all var(--transition-fast)',
                                  }}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <input
                            type="text"
                            placeholder="ملاحظات المشرف..."
                            value={st.notes || ''}
                            onChange={(e) => handleSetStudentNotes(st.student_id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.82rem',
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer with save button */}
            <div
              style={{
                padding: '16px 24px',
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                إجمالي الطلاب: <strong>{sessionStudents.length}</strong> | الحضور:{' '}
                <strong style={{ color: '#16a34a' }}>
                  {sessionStudents.filter((s) => s.status === 'حاضر').length}
                </strong>{' '}
                | الغياب:{' '}
                <strong style={{ color: '#dc2626' }}>
                  {sessionStudents.filter((s) => s.status === 'غائب').length}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setRecordingSession(null)}
                  className="btn btn-outline btn-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className="btn btn-primary btn-sm"
                  style={{ minWidth: 160 }}
                >
                  {savingAttendance ? 'جاري الحفظ...' : 'حفظ واعتماد الحضور'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'sessions' ? (
        /* VIEW 2: SESSIONS LIST */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                تصفية الحالات:
              </span>
              {['all', 'scheduled', 'completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: filterStatus === st ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    backgroundColor: filterStatus === st ? 'var(--color-primary-dark)' : 'var(--color-surface)',
                    color: filterStatus === st ? 'var(--color-gold-light)' : 'var(--color-text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: filterStatus === st ? 800 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {st === 'all' ? 'كافة الجلسات' : st === 'scheduled' ? 'المجدولة' : 'المكتملة'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>التاريخ:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.82rem',
                }}
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          {/* Sessions Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              جاري تحميل جدول الجلسات...
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                padding: '50px 20px',
                textAlign: 'center',
                border: '1px dashed var(--color-border-medium)',
              }}
            >
              <Calendar size={44} color="var(--color-gold)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 6px' }}>
                لا توجد لقاءات مسجلة
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                ابدأ بجدولة لقاء تربوي جديد لتفعيل الرصد التلقائي للحضور والغياب.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                + جدولة أول لقاء الآن
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span
                        className={`badge ${sess.status === 'completed' ? 'badge-accepted' : 'badge-new'}`}
                        style={{ fontSize: '0.76rem' }}
                      >
                        {sess.status === 'completed' ? 'مكتملة ومحصية' : 'مجدولة'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        <Users size={14} color="var(--color-gold-dark)" />
                        <span>{sess.attendance_records_count || 0} سجل حضور</span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 8px' }}>
                      {sess.title}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="var(--color-gold-dark)" />
                        <span>{sess.session_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--color-gold-dark)" />
                        <span>{sess.start_time || '16:00'} - {sess.end_time || '18:00'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} color="var(--color-gold-dark)" />
                        <span>{sess.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-border-light)' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenRecording(sess)}
                      className="btn btn-outline-gold btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{sess.status === 'completed' ? 'تعديل أو مراجعة الحضور' : 'رصد حضور الطلاب'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: EXCUSES REVIEW TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                سجل طلبات الأعذار المقدمة من الطلاب وأولياء الأمور
              </h3>
            </div>

            {excuses.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                لا توجد طلبات أعذار مسجلة حاليًا.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>الطالب</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>تاريخ الغياب</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>نوع العذر</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>مقدم الطلب</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>سبب العذر والتقرير</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>حالة الاعتماد</th>
                      <th style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 800 }}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excuses.map((exc) => (
                      <tr key={exc.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{exc.student_name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }} dir="ltr">
                            {exc.student_number}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {exc.excuse_date}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(198, 146, 20, 0.1)',
                              color: 'var(--color-gold-dark)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {exc.excuse_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          {exc.submitted_by_role === 'parent' ? 'ولي الأمر' : 'الطالب نفسه'}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--color-text-main)', maxWidth: 260 }}>
                          {exc.reason}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            className={`badge ${
                              exc.review_status === 'approved'
                                ? 'badge-accepted'
                                : exc.review_status === 'rejected'
                                ? 'badge-rejected'
                                : 'badge-review'
                            }`}
                            style={{ fontSize: '0.76rem' }}
                          >
                            {exc.review_status === 'approved'
                              ? 'معتمد ومقبول'
                              : exc.review_status === 'rejected'
                              ? 'مرفوض'
                              : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {exc.review_status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(exc)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              مراجعة واتخاذ قرار
                            </button>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              تمت المراجعة
                              {exc.reviewer_notes && <div>ملاحظة: {exc.reviewer_notes}</div>}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE SESSION */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 520, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={22} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  جدولة لقاء تعليمي جديد
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  عنوان اللقاء / الجلسة التربوية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اللقاء التأصيلي الأسبوعي - فقه العبادات"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    تاريخ الانعقاد *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    المكان / القاعة
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    وقت البدء
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    وقت الانتهاء
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary btn-sm"
                >
                  {creating ? 'جاري الحفظ...' : 'تأكيد الجدولة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW EXCUSE */}
      {reviewingExcuse && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={22} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  مراجعة طلب العذر واعتماده
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingExcuse(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 14, fontSize: '0.85rem' }}>
              <div><strong>الطالب:</strong> {reviewingExcuse.student_name} ({reviewingExcuse.student_number})</div>
              <div><strong>تاريخ الغياب:</strong> {reviewingExcuse.excuse_date}</div>
              <div><strong>نوع العذر:</strong> {reviewingExcuse.excuse_type}</div>
              <div style={{ marginTop: 6, color: 'var(--color-text-secondary)' }}><strong>السبب:</strong> {reviewingExcuse.reason}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  قرار الإدارة *
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: reviewStatus === 'approved' ? '2px solid #16a34a' : '1px solid var(--color-border)',
                      backgroundColor: reviewStatus === 'approved' ? 'rgba(22, 163, 74, 0.1)' : 'var(--color-surface)',
                      color: reviewStatus === 'approved' ? '#16a34a' : 'var(--color-text-secondary)',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    قبول العذر (غياب بعذر)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: reviewStatus === 'rejected' ? '2px solid #dc2626' : '1px solid var(--color-border)',
                      backgroundColor: reviewStatus === 'rejected' ? 'rgba(220, 38, 38, 0.1)' : 'var(--color-surface)',
                      color: reviewStatus === 'rejected' ? '#dc2626' : 'var(--color-text-secondary)',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    رفض العذر
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  ملاحظات وتوجيهات الإدارة لمقدم الطلب (اختياري)
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: تم الاطلاع على التقرير الطبي المرفق واعتماده رسميًا..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setReviewingExcuse(null)}
                  className="btn btn-outline btn-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="btn btn-primary btn-sm"
                >
                  {submittingReview ? 'جاري الحفظ...' : 'اعتماد القرار وإرسال الإشعار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
