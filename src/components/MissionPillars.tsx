import React from 'react';
import { SectionHeading } from './SectionHeading';
import { BookOpen, HeartHandshake, Compass, Flame } from 'lucide-react';

export const MissionPillars: React.FC = () => {
  const pillars = [
    {
      title: 'العلم',
      subtitle: 'بناء المعرفة والفهم والوعي',
      desc: 'تزويد الطالب بركائز العلوم الشرعية المؤصلة والمعارف الإنسانية المعاصرة، وتعزيز منهجية التفكير النقدي والبحث الذاتي المستمر.',
      icon: BookOpen,
      number: '٠١',
    },
    {
      title: 'القيم',
      subtitle: 'ترسيخ الأخلاق والمسؤولية والانضباط',
      desc: 'غرس الأخلاق الإسلامية السامية كمنهج حياة، وبناء الضمير الحي، وترسيخ روح المسؤولية والانضباط الذاتي في السر والعلن.',
      icon: HeartHandshake,
      number: '٠٢',
    },
    {
      title: 'القيادة',
      subtitle: 'تنمية الثقة بالنفس والقدرة على المبادرة والتأثير',
      desc: 'صقل مهارات المبادرة، فنون الخطابة والإقناع، إدارة فرق العمل، والتخطيط للمشاريع بأسلوب تطبيقي واقعي.',
      icon: Compass,
      number: '٠٣',
    },
    {
      title: 'الأثر',
      subtitle: 'إعداد شباب قادرين على خدمة مجتمعهم وصناعة فارق',
      desc: 'تحويل العلم والقيم إلى مبادرات نفع عام تخدم المجتمع وتلامس قضاياه، ليتخرج الشاب حاملاً همّ النهوض بأمته ووطنه.',
      icon: Flame,
      number: '٠٤',
    },
  ];

  return (
    <section id="about-mission" className="section section-subtle">
      <div className="container">
        <SectionHeading
          badge="الركائز الأربع"
          title="رسالتنا التربوية"
          description="تسعى المؤسسة لتوفير بيئة تعليمية وتربوية متكاملة تجمع بين رسوخ المعرفة، ونقاء القيم، وقوة الشخصية، وعمق الأثر المجتمعي."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
          }}
        >
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 32,
                  backgroundColor: '#ffffff',
                  borderTop: '4px solid var(--color-gold)',
                  overflow: 'hidden',
                }}
              >
                {/* Background decorative Arabic number watermark */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 20,
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-serif-arabic)',
                    color: 'rgba(10, 58, 42, 0.05)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {item.number}
                </div>

                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Icon size={28} />
                </div>

                <h3
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: 'var(--color-primary-dark)',
                    marginBottom: 6,
                  }}
                >
                  {item.title}
                </h3>

                <div
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: 'var(--color-gold-dark)',
                    marginBottom: 14,
                  }}
                >
                  {item.subtitle}
                </div>

                <p
                  style={{
                    fontSize: '0.98rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.75,
                    marginTop: 'auto',
                  }}
                >
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
