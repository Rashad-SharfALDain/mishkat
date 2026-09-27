import React, { useState, useEffect } from 'react';
import { fetchStudentActivities, submitStudentActivity } from '../../services/studentApi';
import { StudentActivity } from '../../types';
import { useApp } from '../../context/AppContext';
import { FileText, CheckCircle2, Clock, Send, X, AlertCircle, Filter, BookOpen } from 'lucide-react';

interface StudentActivitiesViewProps {
  onBackToDashboard: () => void;
}

export const StudentActivitiesView: React.FC<StudentActivitiesViewProps> = ({ onBackToDashboard }) => {
  const { addToast } = useApp();
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');

  // Modal submission state
  const [selectedActivity, setSelectedActivity] = useState<StudentActivity | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadActivities = () => {
    setLoading(true);
    fetchStudentActivities()
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = activities.filter((act) => {
    if (filter === 'pending') return act.status === 'لم يبدأ' || act.status === 'قيد التنفيذ';
    if (filter === 'submitted') return act.status === 'تم التسليم';
    if (filter === 'evaluated') return act.status === 'تم التقييم';
    return true;
  });

  const handleOpenSubmitModal = (act: StudentActivity) => {
    setSelectedActivity(act);
    setSubmissionContent(act.submission_content || '');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (submissionContent.trim().length < 5) {
      setSubmitError('يرجى كتابة ملخص أو محتوى التسليم (٥ أحرف على الأقل)');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitStudentActivity(selectedActivity.student_activity_id, submissionContent.trim());
      addToast('تم تسليم النشاط بنجاح!', 'success');
      setSelectedActivity(null);
      loadActivities();
    } catch (err: any) {
      setSubmitError(err.message || 'فشل تسليم النشاط');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBackToDashboard}
            className="btn btn-sm"
            style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-primary-dark)' }}
          >
            ← الرئيسية
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              مهامي وأنشطتي التعليمية
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
              قائمة الواجبات والقراءات والمشاريع الموكلة إليك
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, backgroundColor: 'var(--color-bg-subtle)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            الكل ({activities.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            قيد الإنجاز
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`btn btn-sm ${filter === 'submitted' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            تم التسليم
          </button>
          <button
            onClick={() => setFilter('evaluated')}
            className={`btn btn-sm ${filter === 'evaluated' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            تم التقييم
          </button>
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div>جاري تحميل الأنشطة...</div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <FileText size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>لا توجد أنشطة في هذا التصنيف</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.86rem' }}>
            سيقوم المشرفون التربويون بإسناد الأنشطة والواجبات فور بدء اللقاءات.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {filteredActivities.map((act) => (
            <div
              key={act.student_activity_id}
              className="card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {act.activity_type}
                  </span>
                  <span
                    className={`badge ${
                      act.status === 'تم التسليم' || act.status === 'تم التقييم'
                        ? 'badge-accepted'
                        : 'badge-review'
                    }`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {act.status}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '1.08rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {act.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {act.description}
                </p>

                {act.due_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 12 }}>
                    <Clock size={14} />
                    <span>تاريخ الاستحقاق: {act.due_date}</span>
                  </div>
                )}

                {/* If submitted, show feedback/notes */}
                {act.submission_content && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted)',
                      borderRight: '3px solid var(--color-gold)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 2 }}>إجابتك المسلمة:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{act.submission_content}</div>
                  </div>
                )}

                {act.evaluator_notes && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '10px 12px',
                      backgroundColor: 'var(--status-accepted-bg)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: 'var(--status-accepted)',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>ملاحظات المشرف التربوي:</div>
                    <div>{act.evaluator_notes}</div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 18, borderTop: '1px solid var(--color-border-light)', paddingTop: 14 }}>
                <button
                  onClick={() => handleOpenSubmitModal(act)}
                  className={`btn btn-sm ${act.status === 'تم التسليم' || act.status === 'تم التقييم' ? 'btn-outline-gold' : 'btn-gold'}`}
                  style={{ width: '100%', fontWeight: 700, gap: 6 }}
                >
                  <Send size={14} />
                  <span>
                    {act.status === 'تم التسليم' || act.status === 'تم التقييم' ? 'تعديل أو مراجعة التسليم' : 'تسليم النشاط الآن'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {selectedActivity && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedActivity(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              padding: 0,
              overflow: 'hidden',
              animation: 'slideUp 0.2s ease-out',
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
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  تسليم النشاط التعليمي
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', marginTop: 2 }}>
                  {selectedActivity.title}
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                style={{ color: 'rgba(255,255,255,0.7)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submitError && (
                <div
                  style={{
                    backgroundColor: 'var(--status-rejected-bg)',
                    color: 'var(--status-rejected)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                <strong>المطلوب:</strong> {selectedActivity.description}
              </div>

              <div>
                <label className="form-label">
                  ملخص الإنجاز أو إجابة النشاط <span style={{ color: 'var(--status-rejected)' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="اكتب خلاصة قراءتك، أو مخرجات مبادرتك، أو إجابتك هنا ليطلع عليها المشرف التربوي..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="btn btn-outline-gold"
                  disabled={submitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ fontWeight: 700, padding: '10px 24px' }}
                >
                  {submitting ? 'جاري التسليم...' : 'اعتماد وتسليم النشاط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
