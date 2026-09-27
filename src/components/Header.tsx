import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useParentAuth } from '../context/ParentAuthContext';
import { Menu, X, Lock, Phone, Heart, UserPlus, Sparkles, GraduationCap, Users } from 'lucide-react';

interface HeaderProps {
  onOpenAdminModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenStudentModal: () => void;
  onOpenStudentPortal: () => void;
  onOpenParentModal: () => void;
  onOpenParentPortal: () => void;
  currentView: 'site' | 'admin' | 'student' | 'parent';
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdminModal,
  onOpenAdminDashboard,
  onOpenStudentModal,
  onOpenStudentPortal,
  onOpenParentModal,
  onOpenParentPortal,
  currentView,
  onNavigateHome,
}) => {
  const { settings } = useApp();
  const { user } = useAuth();
  const { studentUser } = useStudentAuth();
  const { parentUser } = useParentAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'الرئيسية', href: '#home' },
    { label: 'من نحن', href: '#about' },
    { label: 'برنامجنا', href: '#program' },
    { label: 'المسارات التعليمية', href: '#tracks' },
    { label: 'القيادة وبناء الشخصية', href: '#leadership' },
    { label: 'التسجيل', href: '#register' },
    { label: 'الخريجون', href: '#graduates' },
    { label: 'الأثر المجتمعي', href: '#impact' },
    { label: 'التبرع', href: '#donate' },
    { label: 'الأسئلة الشائعة', href: '#faq' },
    { label: 'تواصل معنا', href: '#contact' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'site') {
      onNavigateHome();
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-dark)',
          color: '#ffffff',
          fontSize: '0.86rem',
          padding: '8px 0',
          borderBottom: '1px solid rgba(198, 146, 20, 0.3)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-gold-light)', fontWeight: 600 }}>
              <Sparkles size={14} />
              قبول العام الدراسي:
            </span>
            <span>{settings?.eligible_grades || 'طلاب الصف الأول الثانوي وما بعده'} (التسجيل متاح)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {settings?.contact_phone && (
              <a
                href={`tel:${settings.contact_phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)' }}
              >
                <Phone size={13} color="var(--color-gold)" />
                <span dir="ltr">{settings.contact_phone}</span>
              </a>
            )}

            {/* Distinct Student Portal Button */}
            <button
              onClick={studentUser ? onOpenStudentPortal : onOpenStudentModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: studentUser ? 'var(--color-gold-light)' : 'rgba(255,255,255,0.95)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: 'rgba(198, 146, 20, 0.2)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(198, 146, 20, 0.4)',
              }}
              title="بوابة الطالب التعليمية"
            >
              <GraduationCap size={14} color="var(--color-gold)" />
              <span>{studentUser ? `بوابة الطالب (${studentUser.name.split(' ')[0]})` : 'دخول الطالب'}</span>
            </button>

            {/* Distinct Parent Portal Button (Requirement 6) */}
            <button
              onClick={parentUser ? onOpenParentPortal : onOpenParentModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: parentUser ? 'var(--color-gold-light)' : 'rgba(255,255,255,0.95)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: 'rgba(10, 58, 42, 0.5)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-gold)',
              }}
              title="بوابة أولياء الأمور"
            >
              <Users size={14} color="var(--color-gold)" />
              <span>{parentUser ? `بوابة ولي الأمر (${parentUser.name.split(' ')[0]})` : 'دخول ولي الأمر'}</span>
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={user ? onOpenAdminDashboard : onOpenAdminModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: user ? 'var(--color-gold-light)' : 'rgba(255,255,255,0.7)',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
              title="بوابة إدارة النظام"
            >
              <Lock size={12} />
              <span>{user ? 'لوحة الإدارة' : 'دخول الإدارة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : '#ffffff',
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          boxShadow: isScrolled ? '0 4px 20px rgba(10, 58, 42, 0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all var(--transition-normal)',
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80 }}>
          {/* Logo & Institution Branding */}
          <div
            onClick={() => {
              if (currentView === 'admin') onNavigateHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          >
            <img
              src="/images/logo_emblem.jpg"
              alt="شعار مؤسسة مِشكاة التربوية"
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--color-gold)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', lineHeight: 1.2 }}>
                {settings?.institution_name || 'مؤسسة مِشكاة التربوية'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-gold-dark)', fontWeight: 600, marginTop: 2 }}>
                دار خيرية لبناء العلم والقيادة والقيم
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
            className="desktop-nav"
          >
            {navLinks.slice(0, 7).map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.href);
                }}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  padding: '6px 2px',
                  position: 'relative',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-main)')}
              >
                {item.label}
              </a>
            ))}

            {/* Dropdown for More Links */}
            <div style={{ position: 'relative' }} className="nav-dropdown-wrapper">
              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  cursor: 'pointer',
                  padding: '6px 2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                المزيد ▾
              </span>
              <div
                className="nav-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  minWidth: 180,
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                  padding: '8px 0',
                  marginTop: 10,
                  zIndex: 999,
                }}
              >
                {navLinks.slice(7).map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.href);
                    }}
                    style={{
                      display: 'block',
                      padding: '8px 18px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: 'var(--color-text-main)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-main)';
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => handleLinkClick('#donate')}
              className="btn btn-outline-gold btn-sm donate-cta-btn"
              style={{ display: 'inline-flex' }}
            >
              <Heart size={15} />
              <span>ادعم رسالتنا</span>
            </button>

            <button
              onClick={() => handleLinkClick('#register')}
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700 }}
            >
              <UserPlus size={16} />
              <span>سجّل الآن</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle-btn"
              aria-label="القائمة الرئيسية"
              style={{
                display: 'none',
                padding: 8,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--color-border-light)',
              padding: '20px 24px',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(item.href);
                  }}
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  onClick={() => handleLinkClick('#register')}
                  className="btn btn-gold"
                  style={{ flex: 1 }}
                >
                  سجّل الآن
                </button>
                <button
                  onClick={() => handleLinkClick('#donate')}
                  className="btn btn-outline-gold"
                  style={{ flex: 1 }}
                >
                  ادعم رسالتنا
                </button>
              </div>

              {/* Mobile Student & Admin Access Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    studentUser ? onOpenStudentPortal() : onOpenStudentModal();
                  }}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary-dark)',
                    fontWeight: 700,
                    gap: 6,
                  }}
                >
                  <GraduationCap size={15} color="var(--color-gold)" />
                  <span>{studentUser ? 'بوابة الطالب' : 'دخول الطالب'}</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    parentUser ? onOpenParentPortal() : onOpenParentModal();
                  }}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(10, 58, 42, 0.1)',
                    color: 'var(--color-primary-dark)',
                    fontWeight: 700,
                    gap: 6,
                    border: '1px solid var(--color-gold)',
                  }}
                >
                  <Users size={15} color="var(--color-gold-dark)" />
                  <span>{parentUser ? 'بوابة ولي الأمر' : 'دخول ولي الأمر'}</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    user ? onOpenAdminDashboard() : onOpenAdminModal();
                  }}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-muted)',
                    gap: 6,
                  }}
                >
                  <Lock size={14} />
                  <span>{user ? 'لوحة الإدارة' : 'دخول الإدارة'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Responsive Header CSS Overrides */}
      <style>{`
        @media (max-width: 1080px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle-btn {
            display: flex !important;
          }
          .donate-cta-btn {
            display: none !important;
          }
        }
        .nav-dropdown-wrapper .nav-dropdown-menu {
          display: none;
        }
        .nav-dropdown-wrapper:hover .nav-dropdown-menu {
          display: block;
        }
      `}</style>
    </>
  );
};
