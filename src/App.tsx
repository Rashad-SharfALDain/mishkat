import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useStudentAuth } from './context/StudentAuthContext';
import { useParentAuth } from './context/ParentAuthContext';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MissionPillars } from './components/MissionPillars';
import { WhyProgram } from './components/WhyProgram';
import { ProgramTracks } from './components/ProgramTracks';
import { JourneyTimeline } from './components/JourneyTimeline';
import { EligibilitySection } from './components/EligibilitySection';
import { RegistrationStepper } from './components/RegistrationStepper';
import { FinancialContribution } from './components/FinancialContribution';
import { DonationSection } from './components/DonationSection';
import { GraduatesSection } from './components/GraduatesSection';
import { ImpactMetrics } from './components/ImpactMetrics';
import { AboutSection } from './components/AboutSection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentPortal } from './components/student/StudentPortal';
import { StudentLoginModal } from './components/student/StudentLoginModal';
import { ParentPortal } from './components/parent/ParentPortal';
import { ParentLoginModal } from './components/parent/ParentLoginModal';
import { ResetPasswordModal } from './components/common/ResetPasswordModal';
import { Shield, Sparkles, GraduationCap, Users } from 'lucide-react';

export const App: React.FC = () => {
  const { user } = useAuth();
  const { studentUser } = useStudentAuth();
  const { parentUser } = useParentAuth();
  const { settings } = useApp();
  const [currentView, setCurrentView] = useState<'site' | 'admin' | 'student' | 'parent'>('site');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState('');

  // Check URL on load for #admin, #student, #parent, or #reset-password route
  useEffect(() => {
    const handleHash = () => {
      const hashStr = window.location.hash;
      if (hashStr.startsWith('#reset-password')) {
        const queryIdx = hashStr.indexOf('?');
        let tok = '';
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hashStr.substring(queryIdx + 1));
          tok = params.get('token') || '';
        }
        setResetPasswordToken(tok);
        setResetPasswordModalOpen(true);
      } else if (hashStr === '#admin') {
        if (user) {
          setCurrentView('admin');
        } else {
          setAdminModalOpen(true);
        }
      } else if (hashStr === '#student') {
        if (studentUser) {
          setCurrentView('student');
        } else {
          setStudentModalOpen(true);
        }
      } else if (hashStr === '#parent') {
        if (parentUser) {
          setCurrentView('parent');
        } else {
          setParentModalOpen(true);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user, studentUser, parentUser]);

  return (
    <div className="app-root">
      <ToastContainer />

      {currentView === 'admin' && user ? (
        <AdminDashboard onBackToSite={() => setCurrentView('site')} />
      ) : currentView === 'student' && studentUser ? (
        <StudentPortal onBackToSite={() => setCurrentView('site')} />
      ) : currentView === 'parent' && parentUser ? (
        <ParentPortal onBackToSite={() => setCurrentView('site')} />
      ) : (
        <>
          <Header
            currentView={currentView}
            onOpenAdminModal={() => setAdminModalOpen(true)}
            onOpenAdminDashboard={() => setCurrentView('admin')}
            onOpenStudentModal={() => setStudentModalOpen(true)}
            onOpenStudentPortal={() => setCurrentView('student')}
            onOpenParentModal={() => setParentModalOpen(true)}
            onOpenParentPortal={() => setCurrentView('parent')}
            onNavigateHome={() => setCurrentView('site')}
          />

          <main>
            <Hero />
            <MissionPillars />
            <WhyProgram />
            <ProgramTracks />
            <JourneyTimeline />
            <EligibilitySection />
            <RegistrationStepper />
            <FinancialContribution />
            <DonationSection />
            <GraduatesSection />
            <ImpactMetrics />
            <AboutSection />
            <FAQSection />
            <ContactSection />
          </main>

          <Footer />

          {/* Quick Floating Indicators if logged in */}
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {parentUser && currentView !== 'parent' && (
              <button
                onClick={() => setCurrentView('parent')}
                style={{
                  backgroundColor: 'var(--color-primary-dark)',
                  color: 'var(--color-gold-light)',
                  border: '2px solid var(--color-gold)',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-xl)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
                title="العودة لبوابة ولي الأمر"
              >
                <Users size={18} color="var(--color-gold)" />
                <span>بوابة ولي الأمر ({parentUser.name.split(' ')[0]})</span>
              </button>
            )}

            {studentUser && currentView !== 'student' && (
              <button
                onClick={() => setCurrentView('student')}
                style={{
                  backgroundColor: 'var(--color-primary-dark)',
                  color: 'var(--color-gold-light)',
                  border: '2px solid var(--color-gold)',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-xl)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
                title="العودة لبوابة الطالب"
              >
                <GraduationCap size={18} color="var(--color-gold)" />
                <span>بوابة الطالب ({studentUser.name.split(' ')[0]})</span>
              </button>
            )}

            {user && currentView !== 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                style={{
                  backgroundColor: 'var(--color-primary-dark)',
                  color: 'var(--color-gold-light)',
                  border: '2px solid var(--color-gold)',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-xl)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
                title="العودة للوحة التحكم"
              >
                <Shield size={16} />
                <span>لوحة التحكم ({user.name.split(' ')[0]})</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={() => {
          setAdminModalOpen(false);
          setCurrentView('admin');
        }}
      />

      {/* Student Login Modal */}
      <StudentLoginModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSuccess={() => {
          setStudentModalOpen(false);
          setCurrentView('student');
        }}
      />

      {/* Parent Login Modal (Requirement 6) */}
      <ParentLoginModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={() => {
          setParentModalOpen(false);
          setCurrentView('parent');
        }}
      />

      {/* Global Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setResetPasswordToken('');
          if (window.location.hash.startsWith('#reset-password')) {
            window.location.hash = '';
          }
        }}
        initialToken={resetPasswordToken}
        onResetSuccess={() => {
          setResetPasswordModalOpen(false);
          setResetPasswordToken('');
          if (window.location.hash.startsWith('#reset-password')) {
            window.location.hash = '';
          }
        }}
      />
    </div>
  );
};
export default App;

