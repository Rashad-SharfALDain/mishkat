import React, { useState, useEffect } from 'react';
import { useParentAuth } from '../../context/ParentAuthContext';
import {
  fetchParentDashboard,
  fetchParentNotifications,
  markParentNotificationAsRead,
  markAllParentNotificationsAsRead,
} from '../../services/parentApi';
import { ParentDashboardData, ChildSummary } from '../../types';
import { ParentDashboardView } from './ParentDashboardView';
import { ParentChildProfileView } from './ParentChildProfileView';
import { ParentAttendanceView } from './ParentAttendanceView';
import { ParentProgressView } from './ParentProgressView';
import { ParentActivitiesView } from './ParentActivitiesView';
import { ParentAnnouncementsView } from './ParentAnnouncementsView';
import { ParentReportsView } from './ParentReportsView';
import { ParentProfileView } from './ParentProfileView';
import { NotificationsPopover } from '../common/NotificationsPopover';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  CheckSquare,
  Bell,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface ParentPortalProps {
  onBackToSite: () => void;
}

export type ParentPortalTab =
  | 'dashboard'
  | 'children'
  | 'child-profile'
  | 'attendance'
  | 'progress'
  | 'activities'
  | 'announcements'
  | 'reports'
  | 'profile';

export const ParentPortal: React.FC<ParentPortalProps> = ({ onBackToSite }) => {
  const { parentUser, logout } = useParentAuth();
  const [activeTab, setActiveTab] = useState<ParentPortalTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    fetchParentDashboard()
      .then((data) => {
        setDashboardData(data);
        if (data.children && data.children.length > 0) {
          // Select primary child or first child if not already selected
          const primary = data.children.find((c) => Boolean(c.is_primary));
          setSelectedChildId((prev) => prev || (primary ? primary.id : data.children[0].id));
        }
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
    { id: 'children', label: 'أبنائي', icon: Users },
    { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
    { id: 'progress', label: 'التقدم', icon: Award },
    { id: 'activities', label: 'الأنشطة', icon: CheckSquare },
    { id: 'announcements', label: 'الإعلانات', icon: Bell },
    { id: 'reports', label: 'التقارير', icon: FileText },
    { id: 'profile', label: 'الملف الشخصي', icon: User },
  ] as const;

  const handleTabChange = (tab: ParentPortalTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedChild: ChildSummary | null =
    dashboardData?.children.find((c) => c.id === selectedChildId) ||
    dashboardData?.children[0] ||
    null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Parent Header */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  بوابة أولياء الأمور
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(198, 146, 20, 0.25)',
                    color: 'var(--color-gold-light)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(198, 146, 20, 0.4)',
                  }}
                >
                  مِشكاة
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                {dashboardData?.parent.full_name || parentUser?.name || 'ولي الأمر المعتمد'}
              </div>
            </div>
          </div>

          {/* Child Selector & Quick Actions in Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Quick Sibling Selector Dropdown if multiple children */}
            {dashboardData && dashboardData.children.length > 1 && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    border: '1px solid var(--color-gold)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 28px 6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                  }}
                  title="اختر الطالب المتابع"
                >
                  {dashboardData.children.map((child) => (
                    <option key={child.id} value={child.id} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                      الطالب: {child.student_name} ({child.student_number})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} color="var(--color-gold)" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
              </div>
            )}

            {/* Internal Notifications */}
            <NotificationsPopover
              fetchNotifs={fetchParentNotifications}
              markRead={markParentNotificationAsRead}
              markAllRead={markAllParentNotificationsAsRead}
            />

            {/* Back to Public Site */}
            <button
              onClick={onBackToSite}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
              title="العودة لموقع المؤسسة التعريفي"
            >
              <ExternalLink size={14} />
              <span className="desktop-only">الموقع التعريفي</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
              title="تسجيل الخروج الآمن"
            >
              <LogOut size={14} />
              <span className="desktop-only">تسجيل الخروج</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: 4,
              }}
              className="mobile-only-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="container" style={{ flex: 1, padding: '24px 16px', display: 'flex', gap: 24, position: 'relative' }}>
        {/* Desktop Sidebar Navigation */}
        <aside
          style={{
            width: '240px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
          className="desktop-sidebar"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeTab === item.id || (item.id === 'children' && activeTab === 'child-profile');
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as ParentPortalTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: isItemActive ? '1.5px solid var(--color-gold)' : '1px solid transparent',
                  backgroundColor: isItemActive ? 'var(--color-primary-dark)' : '#ffffff',
                  color: isItemActive ? 'var(--color-gold-light)' : 'var(--color-text-secondary)',
                  fontWeight: isItemActive ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isItemActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={18} color={isItemActive ? 'var(--color-gold-light)' : 'var(--color-primary)'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div
            style={{
              marginTop: 'auto',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-light)',
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
              دعم أولياء الأمور:
            </div>
            لأي استفسار بخصوص السجلات الأكاديمية أو الأعذار الرسمية، يرجى التواصل مع مشرف شؤون الطلاب.
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              جارٍ تحميل بيانات بوابة ولي الأمر...
            </div>
          ) : !dashboardData ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-error)' }}>
              تعذر جلب بيانات ولي الأمر. يرجى إعادة تسجيل الدخول.
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ParentDashboardView
                  data={dashboardData}
                  selectedChild={selectedChild}
                  onSelectChild={(id) => setSelectedChildId(id)}
                  onNavigateTab={(tab) => handleTabChange(tab as ParentPortalTab)}
                />
              )}

              {(activeTab === 'children' || activeTab === 'child-profile') && (
                <ParentChildProfileView
                  children={dashboardData.children}
                  selectedChild={selectedChild}
                  onSelectChild={(id) => setSelectedChildId(id)}
                />
              )}

              {activeTab === 'attendance' && (
                <ParentAttendanceView
                  children={dashboardData.children}
                  selectedChild={selectedChild}
                  onSelectChild={(id) => setSelectedChildId(id)}
                />
              )}

              {activeTab === 'progress' && (
                <ParentProgressView
                  children={dashboardData.children}
                  selectedChild={selectedChild}
                  onSelectChild={(id) => setSelectedChildId(id)}
                />
              )}

              {activeTab === 'activities' && (
                <ParentActivitiesView
                  children={dashboardData.children}
                  selectedChild={selectedChild}
                  onSelectChild={(id) => setSelectedChildId(id)}
                />
              )}

              {activeTab === 'announcements' && <ParentAnnouncementsView />}

              {activeTab === 'reports' && <ParentReportsView />}

              {activeTab === 'profile' && <ParentProfileView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 38, 27, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '20px',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>قائمة بوابة ولي الأمر</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as ParentPortalTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isItemActive ? 'var(--color-primary-dark)' : 'transparent',
                    color: isItemActive ? 'var(--color-gold-light)' : 'var(--color-primary-dark)',
                    fontWeight: isItemActive ? 800 : 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'right',
                  }}
                >
                  <Icon size={18} color={isItemActive ? 'var(--color-gold-light)' : 'var(--color-primary)'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
