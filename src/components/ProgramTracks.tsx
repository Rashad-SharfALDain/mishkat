import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { BookOpen, Compass, ShieldCheck, Target, Check, Sparkles } from 'lucide-react';

export const ProgramTracks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tracks = [
    {
      id: 'sharia',
      title: 'العلوم الشرعية',
      subtitle: 'تأصيل شرعي واعي يجمع بين الفهم والتطبيق ومقاصد الشريعة',
      icon: BookOpen,
      color: 'var(--color-primary)',
      topics: [
        { name: 'القرآن الكريم', note: 'تلاوة مجودة، وحفظ مدروس، وتأمل في آيات الأحكام والأخلاق' },
        { name: 'التفسير', note: 'إدراك المعاني العميقة وتدبر مقاصد السور وتنزيلها على واقع العصر' },
        { name: 'الحديث الشريف', note: 'مدارسة جوامع الكلم النبوية والسنن العملية وآداب المعاملات' },
        { name: 'الفقه الميسر', note: 'فقه العبادات والمعاملات اليومية بأسلوب مبسط ومعتدل' },
        { name: 'السيرة النبوية', note: 'استلهام النموذج القيادي الإنساني للرسول ﷺ في مختلف مراحل حياته' },
        { name: 'العقيدة', note: 'ترسيخ الإيمان الصافي، واليقين القلبي، والرد على الشبهات الفكرية' },
        { name: 'الأخلاق والآداب', note: 'بناء سمت المسلم الراقي وحسن الخلق في التعامل مع الأهل والمجتمع' },
        { name: 'مقاصد الشريعة', note: 'فهم حكمة التشريع الإسلامي في حفظ الضرورات ورعاية المصالح' },
      ],
    },
    {
      id: 'knowledge',
      title: 'العلوم والمعارف',
      subtitle: 'توسيع المدارك، تنمية التفكير النقدي، والتمكين المعرفي المعاصر',
      icon: Compass,
      color: 'var(--color-gold-dark)',
      topics: [
        { name: 'الثقافة العامة', note: 'إلمام بتيارات الفكر، وتاريخ الحضارات، وسنن نهضة الأمم' },
        { name: 'التفكير النقدي', note: 'تحليل الحجج، وتفكيك المغالطات المنطقية، وبناء الأحكام المستقلة' },
        { name: 'القراءة المنهجية', note: 'مهارات القراءة التحليلية واستخلاص الأفكار المركزية من أمهات الكتب' },
        { name: 'البحث والتعلم الذاتي', note: 'استخدام المصادر الموثوقة والقدرة على التعلم المستمر مدى الحياة' },
        { name: 'المعرفة العلمية', note: 'فهم المنهج التجريبي والعلوم الكونية وربطها بعظمة الخالق' },
        { name: 'التقنية والوعي الرقمي', note: 'الاستخدام الرشيد للذكاء الاصطناعي والأمن السيبراني والمحتوى الهادف' },
        { name: 'مهارات حل المشكلات', note: 'تفكيك التحديات المعقدة وابتكار الحلول الإبداعية القابلة للتطبيق' },
        { name: 'التواصل والبيان', note: 'فصاحة اللسان العربي، وفنون الكتابة المقالية المؤثرة والمحكمة' },
      ],
    },
    {
      id: 'character',
      title: 'بناء الشخصية',
      subtitle: 'ترسيخ الثقة بالنفس، الانضباط، وتحمل المسؤولية الأخلاقية',
      icon: ShieldCheck,
      color: '#15803d',
      topics: [
        { name: 'الثقة بالنفس', note: 'تقدير الذات السوي، والتخلص من التردد، والاعتزاز بالهوية الإسلامية' },
        { name: 'الانضباط الذاتي', note: 'بناء العادات الإيجابية، والمواظبة، والسيطرة على الأهواء والنزوات' },
        { name: 'إدارة الوقت', note: 'تحديد الأولويات، والتوازن بين الدراسة والعبادة والأنشطة والترويح' },
        { name: 'تحمل المسؤولية', note: 'الوفاء بالعهود، والالتزام بالواجبات الفردية والأسرية والاجتماعية' },
        { name: 'الذكاء الاجتماعي', note: 'حسن التعامل مع الآخرين، وقراءة المشاعر، وكسب القلوب بالود' },
        { name: 'الحوار والإقناع', note: 'أدب الاختلاف، والاستماع الفعّال، وبناء الحجة الهادئة الرصينة' },
        { name: 'اتخاذ القرار', note: 'الموازنة بين الخيارات، والاستشارة، والاستخارة، والمضي بعزم' },
        { name: 'العمل الجماعي', note: 'التناغم مع الزملاء، وتوزيع الأدوار، وإعلاء روح الفريق على الأنا' },
      ],
    },
    {
      id: 'leadership',
      title: 'القيادة',
      subtitle: 'الممارسة الميدانية، المبادرة، وإدارة المشاريع وصناعة الأثر',
      icon: Target,
      color: '#0284c7',
      topics: [
        { name: 'القيادة الشخصية', note: 'أن تبدأ بقيادة نفسك أولاً قبل أن تطمح لقيادة الآخرين والقدوة الحسنة' },
        { name: 'المبادرة الإيجابية', note: 'الانتقال من رد الفعل إلى استباق الفرص وتقديم الأفكار الرائدة' },
        { name: 'إدارة الفرق', note: 'تحفيز الطاقات، وتفويض المهام، وخلق بيئة عمل تسودها المودة والإنجاز' },
        { name: 'التخطيط التنفيذي', note: 'وضع الأهداف الذكية، والجداول الزمنية، ومؤشرات قياس النجاح' },
        { name: 'إدارة المشاريع', note: 'تحويل الأفكار المجردة إلى مبادرات واقعية ناجحة ومستدامة' },
        { name: 'التحدث أمام الجمهور', note: 'فن الإلقاء، وكسر حاجز الخوف، واستخدام لغة الجسد والنبرة المناسبة' },
        { name: 'حل النزاعات', note: 'الوساطة الحكيمة، وتطويق الخلافات، والوصول إلى تسويات مرضية وعادلة' },
        { name: 'خدمة المجتمع', note: 'تصميم وتنفيذ حملات تطوعية ميدانية تسهم في تلبية حاجات المحتاجين' },
      ],
    },
  ];

  return (
    <section id="tracks" className="section section-subtle">
      <div className="container">
        <SectionHeading
          badge="المسارات التربوية"
          title="برنامجنا التعليمي والتربوي"
          description="بُني البرنامج وفق منظومة تكاملية متوازنة تغطي أبعاد الشخصية القيادية المسلمة: الفكر، والروح، والسلوك، والممارسة العملية."
        />

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 40,
          }}
        >
          {tracks.map((track, idx) => {
            const Icon = track.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={track.id}
                onClick={() => setActiveTab(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  backgroundColor: isActive ? 'var(--color-primary)' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--color-text-main)',
                  border: `1.5px solid ${isActive ? 'var(--color-gold)' : 'var(--color-border-medium)'}`,
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={20} color={isActive ? 'var(--color-gold-light)' : 'var(--color-primary)'} />
                <span>{track.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Track Content Card */}
        <div
          className="card"
          style={{
            backgroundColor: '#ffffff',
            padding: '36px 40px',
            borderRadius: 'var(--radius-xl)',
            borderTop: '5px solid var(--color-gold)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: '1px solid var(--color-border-light)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="badge badge-accepted" style={{ fontSize: '0.85rem' }}>
                  المسار {activeTab + 1} من ٤
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  {tracks[activeTab].title}
                </h3>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
                {tracks[activeTab].subtitle}
              </p>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                backgroundColor: 'var(--color-gold-subtle)',
                color: 'var(--color-gold-dark)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
                fontWeight: 600,
              }}
            >
              <Sparkles size={15} />
              <span>من الموضوعات التي يتناولها البرنامج</span>
            </div>
          </div>

          {/* Topics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {tracks[activeTab].topics.map((topic, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Check size={14} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                    {topic.name}
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {topic.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Transparent Educational Statement */}
          <div
            style={{
              marginTop: 32,
              padding: '14px 20px',
              backgroundColor: '#f8fafc',
              borderRight: '4px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              color: 'var(--color-text-light)',
            }}
          >
            * ملاحظة: يتم تقديم هذه الموضوعات في شكل وحدات تدريبية، وحلقات نقاش تفاعلية، وورش عمل ومشاريع ميدانية تناسب الفئة العمرية للشباب، ولا تُقدم كمنهج دراسي أكاديمي نظامي بديل عن التعليم الرسمي.
          </div>
        </div>
      </div>
    </section>
  );
};
