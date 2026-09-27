import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useApp();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: 'var(--color-bg-dark)',
        color: '#ffffff',
        borderTop: '3px solid var(--color-gold)',
        paddingTop: 60,
        paddingBottom: 30,
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 36,
            paddingBottom: 45,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Column 1: Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <img
                src="/images/logo_emblem.jpg"
                alt="شعار المؤسسة"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  border: '2px solid var(--color-gold)',
                }}
              />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {settings?.institution_name || 'مؤسسة مِشكاة التربوية'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                  دار خيرية لبناء العلم والقيادة
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: 16 }}>
              {settings?.sub_tagline ||
                'برنامج تربوي وتعليمي يهدف إلى بناء جيل يجمع بين العلم والقيم والوعي والقيادة، ليكون أكثر قدرة على خدمة مجتمعه وصناعة أثر إيجابي فيه.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: 'var(--color-gold-light)' }}>
              <Sparkles size={14} />
              <span>نبني العلم... ونصنع الشخصية... ونصنع أثرًا</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-light)', marginBottom: 16 }}>
              روابط سريعة
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.94rem' }}>
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }} style={{ color: '#cbd5e1' }}>
                  من نحن ورؤيتنا
                </a>
              </li>
              <li>
                <a href="#tracks" onClick={(e) => { e.preventDefault(); scrollTo('#tracks'); }} style={{ color: '#cbd5e1' }}>
                  المسارات والموضوعات التعليمية
                </a>
              </li>
              <li>
                <a href="#leadership" onClick={(e) => { e.preventDefault(); scrollTo('#leadership'); }} style={{ color: '#cbd5e1' }}>
                  رحلة الطالب وممارسة القيادة
                </a>
              </li>
              <li>
                <a href="#register" onClick={(e) => { e.preventDefault(); scrollTo('#register'); }} style={{ color: '#cbd5e1' }}>
                  نموذج التسجيل الإلكتروني
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo('#faq'); }} style={{ color: '#cbd5e1' }}>
                  الأسئلة الشائعة
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Educational Tracks */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-light)', marginBottom: 16 }}>
              المسارات الأربعة
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.94rem' }}>
              <li style={{ color: '#cbd5e1' }}>مسار العلوم الشرعية التأصيلية</li>
              <li style={{ color: '#cbd5e1' }}>مسار العلوم والمعارف المعاصرة</li>
              <li style={{ color: '#cbd5e1' }}>مسار بناء الشخصية والقيم</li>
              <li style={{ color: '#cbd5e1' }}>مسار الممارسة القيادية والمبادرات</li>
              <li>
                <a href="#donate" onClick={(e) => { e.preventDefault(); scrollTo('#donate'); }} style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>
                  دعم ورعاية مقعد طالب
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Privacy & Protection */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-light)', marginBottom: 16 }}>
              الخصوصية والشفافية
            </h4>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 14 }}>
              <ShieldCheck size={22} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                تلتزم المؤسسة بأعلى معايير حماية بيانات القُصّر والطلاب وأولياء الأمور، ولا يتم نشر أي بيانات أو هواتف بصورة عامة.
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
              * البرامج المطروحة هي برامج تربوية وإثرائية نوعية لتنمية المهارات والقيم، ولا تُعد شهادة أكاديمية نظامية بديلة عن التعليم العام.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            paddingTop: 24,
            fontSize: '0.88rem',
            color: '#94a3b8',
          }}
        >
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} {settings?.institution_name || 'مؤسسة مِشكاة التربوية والتعليمية'}.
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <span>وقف تعليمي وتربوي غير ربحي</span>
            <span>المملكة العربية السعودية</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
