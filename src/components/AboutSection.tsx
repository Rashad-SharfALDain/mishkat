import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Shield, Sparkles, Heart, Compass, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const values = [
    { name: 'الإخلاص', desc: 'ابتغاء مرضاة الله تعالى في كل عمل وسعي وتعلم' },
    { name: 'العلم', desc: 'طلب المعرفة الرصينة والبحث المستمر عن الحقيقة والبرهان' },
    { name: 'الأمانة', desc: 'حفظ العهود والصدق في القول والعمل والنزاهة التامة' },
    { name: 'المسؤولية', desc: 'استشعار الواجب الفردي والمجتمعي والمحاسبة الذاتية' },
    { name: 'الاحترام', desc: 'تقدير الإنسان، وحسن الخلق، وحفظ كرامة الجميع' },
    { name: 'الانضباط', desc: 'الالتزام بالوقت، وإتقان العمل، والمثابرة على الأهداف' },
    { name: 'التعاون', desc: 'إعلاء روح الجماعة وتكامل الطاقات لصالح الصالح العام' },
    { name: 'خدمة المجتمع', desc: 'البذل والعطاء ونفع الناس وترك أثر طيب مستدام' },
  ];

  return (
    <section id="about" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <SectionHeading
          badge="هويتنا ومسيرتنا"
          title="من نحن"
          description="مؤسسة تعليمية وتربوية ذات رسالة خيرية غير ربحية، تأسست لتكون حاضنة لبناء جيل من الشباب المسلم الواعي والقادر على قيادة المستقبل."
        />

        {/* Institution Overview & Campus Hall Image */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: 40,
            alignItems: 'center',
            marginBottom: 60,
          }}
          className="about-grid"
        >
          <div>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 18 }}>
              الاستثمار في الإنسان... أعظم استثمار
            </h3>
            <p style={{ fontSize: '1.08rem', color: 'var(--color-text-muted)', lineHeight: 1.85, marginBottom: 20 }}>
              انطلقت دار مِشكاة لتسد فجوة تربوية نوعية؛ حيث لا تقتصر رسالتنا على تلقين المعلومات المجردة، بل نعنى بصياغة العقلية النقدية، وغرس القيم الأخلاقية السامية، وبناء الشخصية المتوازنة التي تجمع بين الوعي الديني والتفوق العلمي والمهارات القيادية المعاصرة.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: 1.85, marginBottom: 28 }}>
              نستقبل الطلاب من أولى مراحل النضج والوعي (الصف الأول الثانوي فما بعده)، ونرافقهم في مسار تربوي متدرج يتيح لهم اكتشاف مواهبهم وتوظيفها لخدمة مجتمعهم وأمتهم.
            </p>

            {/* Quick Vision / Mission callouts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRight: '3px solid var(--color-gold)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--color-gold-dark)', fontSize: '0.98rem', marginBottom: 4 }}>
                  رؤيتنا:
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                  أن نكون المنصة التربوية الرائدة في إعداد وتخريج القيادات الشبابية ذات الأثر الأخلاقي والمجتمعي.
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRight: '3px solid var(--color-primary)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.98rem', marginBottom: 4 }}>
                  رسالتنا:
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                  توفير بيئة محفزة تمزج بين العلم الشرعي والمهارات الحياتية لبناء شخصية متكاملة مسؤولة.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '4px solid #ffffff',
              }}
            >
              <img
                src="/images/institution_hall.jpg"
                alt="قاعة المحاضرات والملتقيات في دار مِشكاة التربوية"
                style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.84rem', color: 'var(--color-text-light)' }}>
              قاعة الحوار والملتقيات الفكرية التابعة للمؤسسة
            </div>
          </div>
        </div>

        {/* 8 Core Values */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 8 }}>
              منظومة قيمنا الأخلاقية
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
              ثماني قيم جوهرية تشكل المرجعية السلوكية والمعرفية لكل برنامج ومبادرة في دار مِشكاة:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}
          >
            {values.map((v, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px 22px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                  transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'var(--color-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--color-border-light)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    {v.name}
                  </h4>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
