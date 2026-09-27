import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminDashboard,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/api';
import { DashboardStats } from '../../types';
import { ApplicantsTable } from './ApplicantsTable';
import { InstitutionSettingsPanel } from './InstitutionSettingsPanel';
import { MessagesPanel } from './MessagesPanel';
import { StudentsPanel } from './StudentsPanel';
import { ParentsPanel } from './ParentsPanel';
import { AttendancePanel } from './AttendancePanel';
import { EvaluationsPanel } from './EvaluationsPanel';
import { UsersPanel } from './UsersPanel';
import { NotificationsPopover } from '../common/NotificationsPopover';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  CalendarCheck,
  Award,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite }) => {
  const { user, logout } = useAuth();
  const { settings, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'applicants' | 'students' | 'parents' | 'attendance' | 'evaluations' | 'users' | 'messages' | 'settings'
  >('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplicants, setRecentApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const data = await fetchAdminDashboard();
      setStats(data.stats);
      setRecentApplicants(data.recentApplicants);
    } catch (err: any) {
      addToast(err.message || 'فشل تحميل إحصائيات لوحة التحكم', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    addToast('تم تسجيل الخروج بنجاح', 'info');
    onBackToSite();
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-subtle)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Top Admin Navbar */}
      <header
        style={{
          backgroundColor: 'var(--color-primary-dark)',
          color: '#ffffff',
          padding: '16px 0',
          borderBottom: '2px solid var(--color-gold)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/images/logo_emblem.jpg"
              alt="شعار المؤسسة"
              style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid var(--color-gold)' }}
            />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                لوحة تحكم الإدارة — {settings?.institution_name || 'دار مِشكاة'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)' }}>
                المسؤول: {user?.name || 'مدير النظام'} ({user?.email})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationsPopover
              fetchNotifs={fetchNotifications}
              markRead={markNotificationAsRead}
              markAllRead={markAllNotificationsAsRead}
            />

            <button
              onClick={onBackToSite}
              className="btn btn-outline-gold btn-sm"
              style={{ color: '#ffffff', borderColor: 'var(--color-gold)' }}
            >
              <ExternalLink size={15} />
              <span>معاينة الموقع العام</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)' }}
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Navigation Tabs */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '6px 0' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'overview' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'overview' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <LayoutDashboard size={18} />
              <span>نظرة عامة</span>
            </button>

            <button
              onClick={() => setActiveTab('applicants')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'applicants' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'applicants' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Users size={18} />
              <span>طلبات التسجيل</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'students' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'students' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <GraduationCap size={18} />
              <span>الطلاب المقيدون</span>
            </button>

            <button
              onClick={() => setActiveTab('parents')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'parents' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'parents' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <HeartHandshake size={18} />
              <span>أولياء الأمور</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'attendance' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'attendance' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <CalendarCheck size={18} />
              <span>الحضور والجلسات</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'evaluations' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'evaluations' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Award size={18} />
              <span>التقييم التربوي الهجين</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'users' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'users' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Users size={18} />
              <span>إدارة المستخدمين والصلاحيات</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'messages' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'messages' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <MessageSquare size={18} />
              <span>رسائل التواصل</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.96rem',
                borderBottom: `3px solid ${activeTab === 'settings' ? 'var(--color-gold)' : 'transparent'}`,
                color: activeTab === 'settings' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Settings size={18} />
              <span>إعدادات المؤسسة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Content */}
      <main className="container" style={{ marginTop: 32 }}>
        {activeTab === 'overview' && (
          <div>
            {/* Overview Stats Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 20,
                marginBottom: 32,
              }}
            >
              <div className="card" style={{ backgroundColor: '#ffffff', padding: 24, borderTop: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>إجمالي المتقدمين</div>
                  <FileText size={20} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-primary-dark)', lineHeight: 1 }}>
                  {stats?.total ?? 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8 }}>
                  كافة الطلبات المستلمة
                </div>
              </div>

              <div className="card" style={{ backgroundColor: '#ffffff', padding: 24, borderTop: '4px solid var(--status-new)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>طلبات جديدة</div>
                  <Sparkles size={20} color="var(--status-new)" />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--status-new)', lineHeight: 1 }}>
                  {stats?.new ?? 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8 }}>
                  بانتظار الفرز المبدئي
                </div>
              </div>

              <div className="card" style={{ backgroundColor: '#ffffff', padding: 24, borderTop: '4px solid var(--status-review)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>قيد المراجعة والمقابلة</div>
                  <Clock size={20} color="var(--status-review)" />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--status-review)', lineHeight: 1 }}>
                  {stats?.inReview ?? 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8 }}>
                  جارٍ التنسيق للمقابلات
                </div>
              </div>

              <div className="card" style={{ backgroundColor: '#ffffff', padding: 24, borderTop: '4px solid var(--status-accepted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>المقبولون نهائيًا</div>
                  <CheckCircle2 size={20} color="var(--status-accepted)" />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--status-accepted)', lineHeight: 1 }}>
                  {stats?.accepted ?? 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8 }}>
                  تم اعتماد انضمامهم للبرنامج
                </div>
              </div>

              <div className="card" style={{ backgroundColor: '#ffffff', padding: 24, borderTop: '4px solid var(--status-rejected)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>الطلبات المرفوضة</div>
                  <XCircle size={20} color="var(--status-rejected)" />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--status-rejected)', lineHeight: 1 }}>
                  {stats?.rejected ?? 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 8 }}>
                  لم تستوفِ معايير الدفعة
                </div>
              </div>
            </div>

            {/* Recent Registrations Card */}
            <div
              className="card"
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 32px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  آخر طلبات التسجيل الواردة
                </h3>
                <button onClick={() => setActiveTab('applicants')} className="btn btn-outline btn-sm">
                  عرض كافة المتقدمين ↵
                </button>
              </div>

              {recentApplicants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-muted)' }}>
                  لا توجد طلبات مسجلة بعد.
                </div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>رقم الطلب</th>
                        <th>اسم الطالب</th>
                        <th>الصف الدراسي</th>
                        <th>المدينة</th>
                        <th>الهاتف</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplicants.map((a) => (
                        <tr key={a.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }} dir="ltr">
                            {a.application_number}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            {a.student_name}
                          </td>
                          <td>{a.grade}</td>
                          <td>{a.city}</td>
                          <td dir="ltr" style={{ fontFamily: 'monospace' }}>{a.phone}</td>
                          <td>
                            <span className="badge badge-new">{a.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applicants' && <ApplicantsTable />}

        {activeTab === 'students' && <StudentsPanel />}

        {activeTab === 'parents' && <ParentsPanel />}

        {activeTab === 'attendance' && <AttendancePanel />}

        {activeTab === 'evaluations' && <EvaluationsPanel />}

        {activeTab === 'users' && <UsersPanel />}

        {activeTab === 'messages' && <MessagesPanel />}

        {activeTab === 'settings' && <InstitutionSettingsPanel />}
      </main>
    </div>
  );
};
