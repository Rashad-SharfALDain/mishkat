import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Brain, Heart, Award, Users } from 'lucide-react';

export const WhyProgram: React.FC = () => {
  const reasons = [
    {
      title: 'المعرفة وحدها لا تكفي',
      desc: 'المعلومات باتت متاحة بضغطة زر في الفضاء الرقمي، لكن الأهم هو بناء البصيرة والقدرة على التمييز والتوظيف الرشيد لتلك المعرفة في خدمة الحق ونفع الناس.',
      icon: Brain,
    },
    {
      title: 'الأخلاق تحتاج إلى ممارسة',
      desc: 'القيم ليست مجرد مواعظ تُتلى في كتب، بل هي مواقف عملية تُصقل في المعايشة، ومسؤوليات حقيقية يختبرها الشاب في يومياته وسلوكه وعلاقاته.',
      icon: Heart,
    },
    {
      title: 'القيادة تحتاج إلى تدريب',
      desc: 'صناعة القادة ليست وليدة صدفة، بل مسار تدرجي يبدأ بقيادة الذات، ثم قيادة المجموعات، والتخطيط للمشاريع، وإدارة التحديات الميدانية بثبات وثقة.',
      icon: Award,
    },
    {
      title: 'المجتمع يحتاج إلى شباب فاعل',
      desc: 'أمتنا ومجتمعنا لا ينتظران شباباً متفرجين، بل سواعد طموحة تمتلك الوعي والشغف والعطاء لتكون قوى بناء حقيقية تشارك بفاعلية في النهضة والتنمية.',
      icon: Users,
    },
  ];

  return (
    <section className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <SectionHeading
          badge="فلسفتنا وغايتنا"
          title="لماذا هذا البرنامج؟"
          description="انطلق البرنامج استجابةً لحاجة شبابنا الملحة إلى بيئة تربوية ناصحة تستوعب طاقاتهم، وتجمع بين الرسوخ العلمي والنضج السلوكي والجاهزية القيادية."
        />

        {/* 4 Modern Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            marginBottom: 50,
          }}
        >
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 28,
                  backgroundColor: 'var(--color-bg-main)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(198, 146, 20, 0.12)',
                    color: 'var(--color-gold-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 18,
                  }}
                >
                  <Icon size={24} />
                </div>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-primary-dark)',
                    marginBottom: 12,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.96rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.75,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Emotional Anchor Statement Callout */}
        <div className="quote-banner">
          <p className="quote-text">
            "نحن لا نريد فقط أن يتخرج الطالب وهو{' '}
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-gold)' }}>
              يعرف أكثر
            </span>
            ، بل أن يخرج وهو{' '}
            <span className="quote-highlight">أفضل خلقًا، وأثبت مبدأً، وأعظم أثرًا</span>."
          </p>
          <div
            style={{
              fontSize: '0.94rem',
              color: 'var(--color-gold-border)',
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            — الرؤية التربوية لدار مِشكاة
          </div>
        </div>
      </div>
    </section>
  );
};
