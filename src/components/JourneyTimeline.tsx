import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Search, BookMarked, Wrench, Users2, Sparkles } from 'lucide-react';

export const JourneyTimeline: React.FC = () => {
  const steps = [
    {
      phase: 'المرحلة الأولى',
      title: 'اكتشاف الذات',
      desc: 'التعرف على نقاط القوة الكامنة، فهم نمط الشخصية، وتحديد الأهداف والتطلعات الفردية بإشراف موجّه تربوي متخصص.',
      icon: Search,
    },
    {
      phase: 'المرحلة الثانية',
      title: 'بناء المعرفة',
      desc: 'التأصيل المعرفي الرصين في العلوم الشرعية وفهم مقاصدها، واكتساب مفاتيح الثقافة العامة والتفكير النقدي التحليلي.',
      icon: BookMarked,
    },
    {
      phase: 'المرحلة الثالثة',
      title: 'تطوير المهارات',
      desc: 'إتقان مهارات الاتصال، وإدارة الوقت، والذكاء الاجتماعي، وفنون الإلقاء والتفاوض وحل المشكلات.',
      icon: Wrench,
    },
    {
      phase: 'المرحلة الرابعة',
      title: 'ممارسة القيادة',
      desc: 'قيادة فرق العمل المصغرة داخل البرنامج، إدارة المبادرات، وتصميم المشاريع الطلابية والتنفيذ الميداني لها.',
      icon: Users2,
    },
    {
      phase: 'المرحلة الخامسة',
      title: 'صناعة الأثر',
      desc: 'إطلاق مبادرات نوعية مستدامة في المجتمع، والانضمام إلى رابطة الخريجين كمرشدين للأجيال القادمة.',
      icon: Sparkles,
    },
  ];

  return (
    <section id="leadership" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <SectionHeading
          badge="مسار التطور التربوي"
          title="رحلة الطالب في مِشكاة"
          description="رحلة نمو متدرجة تأخذ بيد الشاب خطوة بخطوة من اكتشاف مكنونات ذاته إلى أن يصبح صانع أثر نافع في بيئته ومجتمعه."
        />

        {/* Timeline Desktop & Mobile */}
        <div style={{ position: 'relative', marginTop: 40 }}>
          {/* Connecting line */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '5%',
              right: '5%',
              height: '3px',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-gold), var(--color-primary))',
              zIndex: 1,
            }}
            className="timeline-horizontal-line"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 20,
              position: 'relative',
              zIndex: 2,
            }}
            className="timeline-grid"
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                  className="timeline-step-item"
                >
                  {/* Step Circle with Icon */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '3px solid var(--color-gold)',
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      marginBottom: 18,
                      position: 'relative',
                      transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <Icon size={32} />
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--color-gold-dark)',
                      marginBottom: 6,
                    }}
                  >
                    {step.phase}
                  </span>

                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--color-primary-dark)',
                      marginBottom: 10,
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.65,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--color-text-light)',
          }}
        >
          * تُعد هذه المراحل إطاراً تربوياً مرناً مصمماً ليتكيف مع الاحتياجات الفردية لكل دفعة ووفق الإمكانات المتاحة.
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .timeline-horizontal-line {
            display: none !important;
          }
          .timeline-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .timeline-step-item {
            text-align: right !important;
            align-items: flex-start !important;
            padding-right: 20px;
            border-right: 2px dashed var(--color-gold);
          }
        }
      `}</style>
    </section>
  );
};
