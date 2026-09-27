import React from 'react';
import { ArrowLeft, CheckCircle2, Sparkles, BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Hero: React.FC = () => {
  const { settings } = useApp();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        backgroundColor: 'var(--color-bg-main)',
        paddingTop: 60,
        paddingBottom: 80,
        overflow: 'hidden',
        borderBottom: '1px solid var(--color-border-light)',
      }}
    >
      {/* Subtle background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198, 146, 20, 0.08) 0%, rgba(10, 58, 42, 0.04) 70%, transparent 100%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 48,
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Right Column (Arabic RTL: Leading Content) */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginBottom: 24,
                border: '1px solid rgba(10, 58, 42, 0.15)',
              }}
            >
              <Sparkles size={16} color="var(--color-gold)" />
              <span>مؤسسة تعليمية وتربوية ذات رسالة خيرية وقفية</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
                fontWeight: 900,
                color: 'var(--color-primary-dark)',
                lineHeight: 1.25,
                marginBottom: 20,
                letterSpacing: '-0.02em',
              }}
            >
              نبني العلم... <br />
              <span style={{ color: 'var(--color-gold-dark)', display: 'inline-block' }}>
                ونصنع الشخصية...
              </span>{' '}
              <br />
              ونصنع أثرًا
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.85,
                marginBottom: 32,
                maxWidth: 620,
              }}
            >
              {settings?.sub_tagline ||
                'برنامج تربوي وتعليمي يهدف إلى بناء جيل يجمع بين العلم والقيم والوعي والقيادة، ليكون أكثر قدرة على خدمة مجتمعه وصناعة أثر إيجابي فيه.'}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
              <button
                onClick={() => scrollTo('#register')}
                className="btn btn-gold btn-lg"
                style={{ fontWeight: 800, minWidth: 200 }}
              >
                <span>التسجيل في البرنامج</span>
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={() => scrollTo('#about')}
                className="btn btn-outline btn-lg"
                style={{ fontWeight: 700 }}
              >
                <span>اكتشف رسالتنا</span>
              </button>
            </div>

            {/* Quality Pillars Micro-List */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 16,
                paddingTop: 24,
                borderTop: '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  تأصيل شرعي واعي
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  بناء قيادي عملي
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  إشراف تربوي نخَبَوي
                </span>
              </div>
            </div>
          </div>

          {/* Left Column: Visual Showcase */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '4px solid #ffffff',
              }}
            >
              <img
                src="/images/hero_youth.jpg"
                alt="طلاب مؤسسة مِشكاة التربوية يتدارسون في قاعة المعرفة"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'scale(1.01)',
                  transition: 'transform var(--transition-slow)',
                }}
              />

              {/* Gradient overlay at bottom of image */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 65%, rgba(6, 38, 27, 0.7) 100%)',
                }}
              />
            </div>

            {/* Floating Glassmorphism Badge 1 */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: -16,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 20px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-gold-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                zIndex: 10,
              }}
              className="hero-floating-card"
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الفئة المستهدفة</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  {settings?.eligible_grades || 'الأول الثانوي فما بعده'}
                </div>
              </div>
            </div>

            {/* Floating Glassmorphism Badge 2 */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: -16,
                backgroundColor: 'rgba(10, 58, 42, 0.95)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(198, 146, 20, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                zIndex: 10,
              }}
              className="hero-floating-card-top"
            >
              <ShieldCheck size={20} color="var(--color-gold-light)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                رعاية متكاملة وبناء شخصية
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .hero-floating-card, .hero-floating-card-top {
            position: static !important;
            margin-top: 14px;
          }
        }
      `}</style>
    </section>
  );
};
