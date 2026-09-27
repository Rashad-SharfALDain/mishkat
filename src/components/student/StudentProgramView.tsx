import React, { useEffect, useState } from 'react';
import { fetchStudentProgram } from '../../services/studentApi';
import { BookOpen, Compass, CheckCircle2, Award, Sparkles, Layers, ArrowLeft } from 'lucide-react';

interface StudentProgramViewProps {
  onBackToDashboard: () => void;
  onGoToActivities: () => void;
}

export const StudentProgramView: React.FC<StudentProgramViewProps> = ({ onBackToDashboard, onGoToActivities }) => {
  const [programData, setProgramData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentProgram()
      .then((data) => {
        setProgramData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'تعذر تحميل بيانات المسار');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <div>جاري تحميل بيانات مسارك التعليمي...</div>
      </div>
    );
  }

  if (error || !programData) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--status-rejected)' }}>{error || 'تعذر جلب تفاصيل المسار'}</p>
        <button onClick={onBackToDashboard} className="btn btn-outline-gold" style={{ marginTop: 12 }}>
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const { track_name, program, level } = programData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBackToDashboard}
            className="btn btn-sm"
            style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-primary-dark)' }}
          >
            ← الرئيسية
          </button>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            برنامجي التعليمي
          </h2>
        </div>

        <button onClick={onGoToActivities} className="btn btn-gold btn-sm" style={{ fontWeight: 700 }}>
          <span>الأنشطة المرتبطة بالمسار</span>
          <ArrowLeft size={15} />
        </button>
      </div>

      {/* Program Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #0e4c36 100%)',
          color: '#ffffff',
          padding: '32px 28px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid rgba(198, 146, 20, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-gold-light)', fontSize: '0.86rem', fontWeight: 700, marginBottom: 8 }}>
          <Compass size={16} />
          <span>المسار التعليمي المعتمد ({level})</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 12px', color: '#ffffff' }}>
          {program?.title || track_name}
        </h1>
        <p style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', maxWidth: 760 }}>
          {program?.description || 'مسار تعليمي وتربوي متخصص يهدف إلى غرس المعارف الراسخة، وتأهيل الطالب بالمهارات الفكرية والعملية.'}
        </p>
      </div>

      {/* Topics & Curriculum Breakdown */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Layers size={22} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>موضوعات ومحاور المسار</h3>
        </div>

        {program?.topics && program.topics.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {program.topics.map((topic: string, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {topic}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    وحدة تدريبية وتطبيقية معتمدة بإشراف المعلمين والموجهين التربويين
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)' }}>تفاصيل الموضوعات سيتم إعلانها قريبًا مع انطلاق الحلقات.</p>
        )}
      </div>

      {/* Educational Development Goals */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Sparkles size={22} color="var(--color-gold-dark)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>المخرجات والأهداف التربوية المستهدفة</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 18, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
              <CheckCircle2 size={18} color="var(--color-gold)" />
              الفهم والوعي الشرعي والفكري
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
              امتلاك قاعدة معرفية رصينة تمكن الطالب من التفكير السليم والرد على الشبهات والتحلي بالحكمة.
            </p>
          </div>

          <div style={{ padding: 18, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
              <CheckCircle2 size={18} color="var(--color-gold)" />
              الممارسة الأخلاقية والقيمية
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
              ترجمة المعارف إلى سلوك يومي يتمثل في الصدق والأمانة وبر الوالدين والإحسان للآخرين.
            </p>
          </div>

          <div style={{ padding: 18, border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
              <CheckCircle2 size={18} color="var(--color-gold)" />
              المهارات الحياتية والقيادية
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
              القدرة على التعبير والإلقاء والعمل الجماعي وتنظيم المبادرات المؤثرة في البيئة المحيطة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
