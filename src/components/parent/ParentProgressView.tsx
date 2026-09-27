import React, { useState, useEffect } from 'react';
import { ChildSummary, StudentEvaluation, EvaluationSummary } from '../../types';
import { fetchChildEvaluations } from '../../services/parentApi';
import {
  Award,
  BookOpen,
  Compass,
  ShieldCheck,
  Flag,
  Sparkles,
  Users,
  Info,
  TrendingUp,
} from 'lucide-react';

interface ParentProgressViewProps {
  children: ChildSummary[];
  selectedChild: ChildSummary | null;
  onSelectChild: (childId: string) => void;
}

export const ParentProgressView: React.FC<ParentProgressViewProps> = ({
  children,
  selectedChild,
  onSelectChild,
}) => {
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    fetchChildEvaluations(selectedChild.id)
      .then((res) => {
        setEvaluations(res.evaluations || []);
        setSummary(res.summary || null);
      })
      .catch((err) => console.error('Error fetching child evaluations:', err))
      .finally(() => setLoading(false));
  }, [selectedChild]);

  if (!selectedChild) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>يرجى اختيار طالب لعرض مؤشرات التقدم والتقييمات.</p>
      </div>
    );
  }

  const ratingColors: Record<string, { bg: string; text: string; border: string }> = {
    'ممتاز': { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.3)' },
    'جيد جدًا': { bg: 'rgba(13, 148, 136, 0.12)', text: '#0d9488', border: 'rgba(13, 148, 136, 0.3)' },
    'جيد': { bg: 'rgba(217, 119, 6, 0.12)', text: '#d97706', border: 'rgba(217, 119, 6, 0.3)' },
    'يحتاج متابعة': { bg: 'rgba(220, 38, 38, 0.12)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)' },
  };

  const getDimensionIcon = (name: string) => {
    if (name.includes('الشرعية')) return <BookOpen size={22} color="var(--color-gold-dark)" />;
    if (name.includes('المعارف')) return <Compass size={22} color="var(--color-gold-dark)" />;
    if (name.includes('الشخصية')) return <ShieldCheck size={22} color="var(--color-gold-dark)" />;
    if (name.includes('القيادة')) return <Flag size={22} color="var(--color-gold-dark)" />;
    return <Award size={22} color="var(--color-gold-dark)" />;
  };

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
            <span>عرض التقدم والتقييمات للطالب:</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
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

      {/* Header Info Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Award size={22} color="var(--color-gold-dark)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              مؤشرات التقدم والتقييم الهجين المعتمد
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', maxWidth: '640px' }}>
            متابعة محاور البناء الخمسة في مؤسسة مِشكاة للابن ({selectedChild.student_name}). تُقاس هذه المحاور بمزيج من التقييم النوعي والدرجات التراكمية المعتمدة وملاحظات المشرفين.
          </p>
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>المسار المقيد به:</div>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {selectedChild.educational_track || 'العلوم الشرعية'}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          جاري جلب مؤشرات التقدم للابن...
        </div>
      ) : evaluations.length === 0 ? (
        /* Empty State: Confidential, drafts never shown */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '50px 20px',
            textAlign: 'center',
            border: '1px dashed var(--color-border-medium)',
          }}
        >
          <Sparkles size={44} color="var(--color-gold)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 6px' }}>
            التقييمات التربوية قيد الإعداد للاعتماد من المشرفين
          </h3>
          <p style={{ margin: '0 auto', maxWidth: 500, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            التقييمات التراكمية في مؤسسة مِشكاة تُبنى على مخرجات نوعية ومشاريع حقيقية يراجعها المشرف التربوي المباشر، وتُنشر نتائج كل مرحلة فور اعتمادها رسميًا من الإدارة.
          </p>
        </div>
      ) : (
        <>
          {/* Overall Child Performance Ribbon */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              color: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '26px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: 'var(--shadow-md)',
              border: '1.5px solid var(--color-gold)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={20} color="var(--color-gold-light)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', fontWeight: 700 }}>
                  الأداء التراكمي المعتمد للابن
                </span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                {evaluations[0]?.period_name || 'الفترة التقييمية الحالية'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                محسوب وفق الأوزان المعتمدة للمحاور الخمسة بمعدل 20% لكل محور.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>الدرجة الكلية الموزونة</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-gold-light)', lineHeight: 1.1 }}>
                  {summary?.overall_score !== null && summary?.overall_score !== undefined
                    ? `${summary.overall_score}%`
                    : '--'}
                </div>
              </div>

              {summary?.overall_rating && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>التقدير العام</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                    {summary.overall_rating}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5 Dimensions Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {evaluations.map((ev) => {
              const ratingStyle = ratingColors[ev.qualitative_rating || 'جيد'] || {
                bg: 'rgba(0,0,0,0.06)',
                text: '#333',
                border: '#ccc',
              };

              return (
                <div
                  key={ev.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    {/* Dimension Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'rgba(198, 146, 20, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getDimensionIcon(ev.dimension_name || '')}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                            {ev.dimension_name}
                          </h4>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                            الوزن النسبي: {ev.weight || 20}%
                          </span>
                        </div>
                      </div>

                      {/* Qualitative Rating Badge */}
                      {ev.qualitative_rating && (
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: ratingStyle.bg,
                            color: ratingStyle.text,
                            border: `1px solid ${ratingStyle.border}`,
                            fontWeight: 800,
                            fontSize: '0.82rem',
                          }}
                        >
                          {ev.qualitative_rating}
                        </span>
                      )}
                    </div>

                    {/* Numerical Score */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                        border: '1px solid var(--color-border-light)',
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        الدرجة المستحقة من 100:
                      </span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-primary-dark)' }}>
                        {ev.numerical_score !== null ? `${ev.numerical_score} / 100` : '--'}
                      </span>
                    </div>

                    {/* Supervisor Notes */}
                    {ev.supervisor_notes && (
                      <div
                        style={{
                          backgroundColor: 'rgba(10, 58, 42, 0.03)',
                          borderRight: '3px solid var(--color-gold)',
                          padding: '10px 14px',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                          توجيه وملاحظات المشرف التربوي:
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                          {ev.supervisor_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      paddingTop: 10,
                      borderTop: '1px solid var(--color-border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>المقيم: {ev.evaluator_name || 'إدارة البرنامج'}</span>
                    <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>
                      معتمد رسميًا
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
