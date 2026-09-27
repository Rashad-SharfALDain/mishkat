import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Award, Compass, HeartHandshake, Sparkles, BookOpen, Quote } from 'lucide-react';

export const GraduatesSection: React.FC = () => {
  const alumniFeatures = [
    {
      title: 'الإرشاد والتوجيه للأجيال اللاحقة',
      desc: 'يعود الخريج إلى مقاعد الدار كمرشد وموجه للطلاب الجدد، ناقلاً تجربته ومقدماً الدعم الأخوي والأكاديمي.',
      icon: HeartHandshake,
    },
    {
      title: 'إطلاق وقيادة المبادرات المجتمعية',
      desc: 'حاضنة لمشاريع التخرج التي تتحول إلى جمعيات ومبادرات نفع عام قائمة بذاتها تخدم الأحياء والمجتمع.',
      icon: Compass,
    },
    {
      title: 'التعلم المستمر والحلقات الفكرية',
      desc: 'ملتقيات دورية ومؤتمرات فكرية وندوات شرعية متقدمة تضمن دوام الصلة المعرفية والتزكية الروحية.',
      icon: BookOpen,
    },
    {
      title: 'شبكة علاقات قيادية مهنية',
      desc: 'رابطة تجمع خريجي الدار في مختلف التخصصات الجامعية والمهنية لتبادل الخبرات والتعاون الإيجابي.',
      icon: Award,
    },
  ];

  return (
    <section id="graduates" className="section section-subtle">
      <div className="container">
        <SectionHeading
          badge="رؤيتنا طويلة المدى"
          title="خريجونا — مجتمع قيادي مستمر"
          description="التخرج في دار مِشكاة ليس نهاية المسار، بل هو بداية الانضمام إلى شبكة أثر مستدامة تمتد آثارها الطيبة في المجتمع."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr',
            gap: 40,
            alignItems: 'center',
            marginBottom: 45,
          }}
          className="graduates-grid"
        >
          {/* Visual Showcase of Graduate Mentor */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '4px solid #ffffff',
                position: 'relative',
              }}
            >
              <img
                src="/images/alumni_mentor.jpg"
                alt="نموذج لمرشد من خريجي المؤسسة"
                style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 60%, rgba(6, 38, 27, 0.85) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  left: 20,
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 700 }}>
                  نموذج تجريبي لبرنامج الإرشاد الطلابي
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  م. عبدالله السليمان (نموذج توضيحي)
                </div>
                <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.8)' }}>
                  مهندس وموجّه تربوي متطوع في برنامج صناعة القادة
                </div>
              </div>
            </div>

            {/* Quote badge */}
            <div
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                backgroundColor: 'var(--color-gold)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <Sparkles size={14} />
              <span>رابطة الخريجين الفاعلين</span>
            </div>
          </div>

          {/* Core Vision & Pillars */}
          <div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid var(--color-gold-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                color: 'var(--color-gold-dark)',
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              * محتوى تجريبي توضيحي يعكس مستهدفات الرابطة
            </div>

            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 14 }}>
              من مقاعد التعلم إلى صناعة الأثر في الميدان
            </h3>

            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: 28 }}>
              نهدف إلى أن يكون كل خريج سفيراً لقيم المؤسسة؛ يواصل مسيرة العلم، ويتصدر لخدمة مجتمعه، ويبادر لحل المشكلات بروح إيجابية، ويعود ليساند الأجيال الناشئة كمرشد وأخ أكبر.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              {alumniFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    style={{
                      padding: 18,
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        {f.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .graduates-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
