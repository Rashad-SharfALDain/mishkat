import React, { useState, useEffect } from 'react';
import { fetchStudentPublishedEvaluations } from '../../services/studentApi';
import { StudentEvaluation, EvaluationSummary, QualitativeRating } from '../../types';
import {
  Award,
  BookOpen,
  Compass,
  ShieldCheck,
  Flag,
  Sparkles,
  TrendingUp,
  Info,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface StudentEvaluationsViewProps {
  studentId: string;
}

export const StudentEvaluationsView: React.FC<StudentEvaluationsViewProps> = ({ studentId }) => {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEvaluations = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await fetchStudentPublishedEvaluations(studentId);
      setEvaluations(res.evaluations || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, [studentId]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            <Award size={22} color="var(--color-gold-dark)" />
            <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
              التقييم التعليمي والقيمي المعتمد
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
            نتائج التقييم الهجين ومحاور البناء
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            مزيج تكاملي يجمع بين الدرجات التراكمية من 100 والتقديرات النوعية والتوجيهات التربوية المباشرة من المشرفين.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          جاري جلب نتائج التقييمات...
        </div>
      ) : evaluations.length === 0 ? (
        /* Transparent Empty State: No Drafts Exposed! */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '60px 24px',
            textAlign: 'center',
            border: '1px dashed var(--color-border-medium)',
          }}
        >
          <Sparkles size={48} color="var(--color-gold)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 8px' }}>
            التقييمات قيد الإعداد والمراجعة التربوية
          </h3>
          <p style={{ margin: '0 auto', maxWidth: 540, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            يعمل المشرفون حاليًا على تقييم المخرجات التأصيلية والمشاريع الميدانية للفترة الأكاديمية. ستظهر درجاتك وتوجيهاتك التربوية فور اعتمادها رسميًا من الإدارة.
          </p>
        </div>
      ) : (
        <>
          {/* Overall Performance Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              color: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 24px',
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
                  الأداء التراكمي العام المعتمد
                </span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                {evaluations[0]?.period_name || 'الفترة التقييمية الحالية'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                محسوب وفق الأوزان النسبية للمحاور الخمسة بمعدل 20% لكل محور.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>الدرجة الكلية</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-gold-light)', lineHeight: 1.1 }}>
                  {summary?.overall_score !== null && summary?.overall_score !== undefined
                    ? `${summary.overall_score}%`
                    : '--'}
                </div>
              </div>

              {summary?.overall_rating && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>التقدير العام</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    {summary.overall_rating}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* The 5 Axes Breakdown Grid */}
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
                    {/* Axis Header */}
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

                    {/* Numerical Score Gauge */}
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

                    {/* Educational Notes */}
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

                  {/* Evaluator Footer */}
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
