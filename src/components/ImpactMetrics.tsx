import React from 'react';
import { SectionHeading } from './SectionHeading';
import { Users, Award, Clock, Lightbulb, Heart, ShieldCheck } from 'lucide-react';

export const ImpactMetrics: React.FC = () => {
  const metrics = [
    {
      num: '+١٢٠',
      label: 'طالب في الدفعة التأسيسية',
      sub: 'مستهدف سنوي لضمان التركيز التربوي',
      icon: Users,
    },
    {
      num: '+٤,٥٠٠',
      label: 'ساعة تطوع ومبادرات',
      sub: 'خدمة ميدانية مباشرة للمجتمع والحي',
      icon: Clock,
    },
    {
      num: '+٢٤',
      label: 'مبادرة شبابية مستدامة',
      sub: 'صممها وقادها الطلاب بأنفسهم',
      icon: Lightbulb,
    },
    {
      num: '+١٦',
      label: 'شريك تربوي ومجتمعي',
      sub: 'مؤسسات تعليمية وأوقاف داعمة',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="impact" className="section section-dark">
      <div className="container">
        <SectionHeading
          badge="أثر يتجدد"
          title="الأثر المجتمعي والمستهدفات"
          description="نؤمن بأن قيمة العلم تتجلى في ثمرته، وأن المقياس الحقيقي لنجاحنا يكمن في صلاح الشباب وبصمتهم الإيجابية الملموسة في مجتمعاتهم."
          dark
        />

        {/* Clear transparent disclaimer */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 18px',
              backgroundColor: 'rgba(198, 146, 20, 0.2)',
              border: '1px solid var(--color-gold)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              color: 'var(--color-gold-light)',
              fontWeight: 600,
            }}
          >
            * تنويه شفاف: هذه الأرقام تمثل مؤشرات مستهدفة للمرحلة التأسيسية للمؤسسة وليست إحصاءات نهائية مغلقة
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(198, 146, 20, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  transition: 'all var(--transition-normal)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'var(--color-gold)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(198, 146, 20, 0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(198, 146, 20, 0.15)',
                    color: 'var(--color-gold-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <Icon size={26} />
                </div>

                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'var(--color-gold-light)',
                    fontFamily: 'var(--font-arabic)',
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {item.num}
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                  {item.label}
                </div>

                <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  {item.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
