import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import {
  fetchStudentDashboard,
  fetchStudentNotifications,
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,
} from '../../services/studentApi';
import { StudentDashboardData } from '../../types';
import { StudentDashboardView } from './StudentDashboardView';
import { StudentProgramView } from './StudentProgramView';
import { StudentActivitiesView } from './StudentActivitiesView';
import { StudentAnnouncementsView } from './StudentAnnouncementsView';
import { StudentProfileView } from './StudentProfileView';
import { StudentAttendanceView } from './StudentAttendanceView';
import { StudentEvaluationsView } from './StudentEvaluationsView';
import { NotificationsPopover } from '../common/NotificationsPopover';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Award,
} from 'lucide-react';

interface StudentPortalProps {
  onBackToSite: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onBackToSite }) => {
  const { studentUser, logout } = useStudentAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'attendance' | 'evaluations' | 'program' | 'activities' | 'announcements' | 'profile'
  >('dashboard');
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    fetchStudentDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'attendance', label: 'سجل الحضور', icon: CalendarCheck },
    { id: 'evaluations', label: 'التقييم التربوي', icon: Award },
    { id: 'program', label: 'برنامجي التعليمي', icon: BookOpen },
    { id: 'activities', label: 'مهامي وأنشطتي', icon: CheckSquare },
    { id: 'announcements', label: 'الإعلانات', icon: Bell },
    { id: 'profile', label: 'ملفي الشخصي', icon: User },
  ] as const;

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Student Header */}
      <header
        style={{
          backgroundColor: 'var(--color-primary-dark)',
          color: '#ffffff',
          borderBottom: '2px solid var(--color-gold)',
          position: 'sticky',
          top: 0,
          zIndex: 900,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 70,
          }}
        >
          {/* Logo & Portal Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/images/logo_emblem.jpg"
              alt="شعار مؤسسة مِشكاة"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '2px solid var(--color-gold)',
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                مؤسسة مِشكاة التربوية
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                بوابة الطالب التعليمية
              </div>
            </div>
          </div>

          {/* Student Info Pill & Logout (Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }} className="desktop-student-header">
            {dashboardData?.student && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                  {dashboardData.student.student_name.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-light)', direction: 'ltr' }}>
                  {dashboardData.student.student_number}
                </span>
              </div>
            )}

            <NotificationsPopover
              fetchNotifs={fetchStudentNotifications}
              markRead={markStudentNotificationAsRead}
              markAllRead={markAllStudentNotificationsAsRead}
            />

            <button
              onClick={onBackToSite}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="العودة لموقع المؤسسة"
            >
              <ExternalLink size={13} />
              <span>الموقع العام</span>
            </button>

            <button
              onClick={() => {
                logout();
                onBackToSite();
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="تسجيل الخروج"
            >
              <LogOut size={13} />
              <span>خروج</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-student-menu-btn"
            style={{
              display: 'none',
              padding: 8,
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Sub-Header Navigation Tabs (Desktop) */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          className="desktop-student-nav"
        >
          <div className="container" style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? 'var(--color-gold-light)' : 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: isActive ? 'rgba(198, 146, 20, 0.15)' : 'transparent',
                    borderBottom: isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-primary-dark)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? 'var(--color-gold-light)' : '#ffffff',
                      backgroundColor: isActive ? 'rgba(198, 146, 20, 0.15)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      textAlign: 'right',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 10, paddingTop: 10, display: 'flex', gap: 10 }}>
                <button
                  onClick={onBackToSite}
                  className="btn btn-sm"
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
                >
                  الموقع العام
                </button>
                <button
                  onClick={() => {
                    logout();
                    onBackToSite();
                  }}
                  className="btn btn-sm"
                  style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="container" style={{ padding: '32px 16px 64px', flex: 1 }}>
        {loading && activeTab === 'dashboard' ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div>جاري تجهيز لوحة تحكم الطالب...</div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && dashboardData && (
              <StudentDashboardView data={dashboardData} onNavigateTab={handleTabChange} />
            )}
            {activeTab === 'attendance' && dashboardData?.student && (
              <StudentAttendanceView studentId={dashboardData.student.id} />
            )}
            {activeTab === 'evaluations' && dashboardData?.student && (
              <StudentEvaluationsView studentId={dashboardData.student.id} />
            )}
            {activeTab === 'program' && (
              <StudentProgramView
                onBackToDashboard={() => handleTabChange('dashboard')}
                onGoToActivities={() => handleTabChange('activities')}
              />
            )}
            {activeTab === 'activities' && (
              <StudentActivitiesView onBackToDashboard={() => handleTabChange('dashboard')} />
            )}
            {activeTab === 'announcements' && (
              <StudentAnnouncementsView onBackToDashboard={() => handleTabChange('dashboard')} />
            )}
            {activeTab === 'profile' && (
              <StudentProfileView onBackToDashboard={() => handleTabChange('dashboard')} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--color-border-light)',
          padding: '20px 0',
          textAlign: 'center',
          fontSize: '0.84rem',
          color: 'var(--color-text-light)',
        }}
      >
        <div className="container">
          مؤسسة مِشكاة التربوية والتعليمية — جميع الحقوق محفوظة © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-student-header {
            display: none !important;
          }
          .desktop-student-nav {
            display: none !important;
          }
          .mobile-student-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
