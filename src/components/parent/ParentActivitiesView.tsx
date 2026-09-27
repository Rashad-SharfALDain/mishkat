import React, { useState, useEffect } from 'react';
import { ChildSummary, StudentActivity } from '../../types';
import { fetchChildActivities } from '../../services/parentApi';
import { BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, Eye, X, Users, Sparkles, ShieldCheck } from 'lucide-react';

interface ParentActivitiesViewProps {
  children: ChildSummary[];
  selectedChild: ChildSummary | null;
  onSelectChild: (childId: string) => void;
}

export const ParentActivitiesView: React.FC<ParentActivitiesViewProps> = ({
  children,
  selectedChild,
  onSelectChild,
}) => {
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [viewingActivity, setViewingActivity] = useState<StudentActivity | null>(null);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    fetchChildActivities(selectedChild.id)
      .then((res) => setActivities(res.activities || []))
      .catch((err) => console.error('Error fetching activities:', err))
      .finally(() => setLoading(false));
  }, [selectedChild]);

  if (!selectedChild) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>يرجى اختيار طالب لعرض أنشطته ومهامه.</p>
      </div>
    );
  }

  const filtered = activities.filter((act) => {
    if (filter === 'pending') return act.status === 'لم يبدأ' || act.status === 'قيد التنفيذ';
    if (filter === 'submitted') return act.status === 'تم التسليم' || act.status === 'تم التقييم';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sibling Switcher */}
      {children.length > 1 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            <Users size={16} color="var(--color-gold-dark)" />
            <span>عرض أنشطة الطالب:</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: child.id === selectedChild.id ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                  backgroundColor: child.id === selectedChild.id ? 'var(--color-primary-dark)' : 'var(--color-surface)',
                  color: child.id === selectedChild.id ? 'var(--color-gold-light)' : 'var(--color-text-secondary)',
                  fontWeight: child.id === selectedChild.id ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {child.student_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header and Read-Only Policy */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 4px 0' }}>
            أنشطة ومشاريع الطالب ({selectedChild.student_name})
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
            اطلاع مباشر على المهام الموكلة، مواعيد التسليم، وحالة إنجاز الابن (صلاحية استعراض للقراءة فقط).
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد الإنجاز' },
            { id: 'submitted', label: 'تم التسليم والتقييم' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filter === btn.id ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: filter === btn.id ? 'rgba(10, 58, 42, 0.08)' : '#ffffff',
                color: filter === btn.id ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: filter === btn.id ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          جارٍ تحميل الأنشطة...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>لا توجد أنشطة مسجلة في هذا القسم حاليًا.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((act) => {
            const isDone = act.status === 'تم التسليم' || act.status === 'تم التقييم';
            return (
              <div
                key={act.student_activity_id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderRight: isDone ? '4px solid var(--color-success)' : '4px solid var(--color-gold)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-cream)',
                        color: 'var(--color-gold-dark)',
                        fontWeight: 700,
                      }}
                    >
                      {act.activity_type}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                      {act.title}
                    </h3>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {act.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {act.due_date && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} />
                        تاريخ الاستحقاق: {act.due_date}
                      </span>
                    )}
                    {act.submitted_at && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-success)' }}>
                        <CheckCircle2 size={13} />
                        تم التسليم: {act.submitted_at.split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      backgroundColor: isDone ? 'rgba(22, 101, 52, 0.1)' : 'rgba(198, 146, 20, 0.1)',
                      color: isDone ? 'var(--color-success)' : 'var(--color-gold-dark)',
                    }}
                  >
                    {act.status}
                  </span>

                  {(act.submission_content || act.evaluation) && (
                    <button
                      onClick={() => setViewingActivity(act)}
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={14} />
                      <span>عرض التسليم</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Read-Only Viewing Modal */}
      {viewingActivity && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setViewingActivity(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              border: '1.5px solid var(--color-gold)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                  إنجاز الطالب: {viewingActivity.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingActivity(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  محتوى إجابة ومشاركة الطالب:
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: 'var(--color-primary-dark)',
                    border: '1px solid var(--color-border-light)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {viewingActivity.submission_content || 'لا يوجد نص تسليم مسجل.'}
                </div>
              </div>

              {viewingActivity.evaluation && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold-dark)', marginBottom: 4 }}>
                    تقييم وملاحظات المشرف التربوي:
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(198, 146, 20, 0.08)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      color: 'var(--color-primary-dark)',
                      border: '1px solid rgba(198, 146, 20, 0.3)',
                    }}
                  >
                    {viewingActivity.evaluation}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
                ملاحظة: يحق لولي الأمر الاطلاع على مشاركات الابن وملاحظات المشرف فقط دون تعديل.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
