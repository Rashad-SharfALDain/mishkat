import React, { useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { changeStudentPassword } from '../../services/studentApi';
import { useApp } from '../../context/AppContext';
import { X, Lock, User, KeyRound, CheckCircle2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

import { ResetPasswordModal } from '../common/ResetPasswordModal';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, refreshStudentSession } = useStudentAuth();
  const { addToast } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Mandatory First-Login Password Change State
  const [step, setStep] = useState<'login' | 'change_password'>('login');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('يرجى إدخال الرقم الأكاديمي أو البريد وكلمة المرور');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(identifier.trim(), password);
      if (res.user.must_change_password) {
        setCurrentPassword(password);
        setStep('change_password');
        addToast('يرجى تعيين كلمة مرور جديدة لحسابك لتأمين الدخول الأول', 'info');
      } else {
        addToast('مرحبًا بك في بوابة الطالب التعليمية!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 8) {
      setChangeError('يجب ألا تقل كلمة المرور عن ٨ خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('كلمتا المرور غير متطابقتين');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setChangeError('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام لضمان الأمان');
      return;
    }

    setChangeLoading(true);
    try {
      await changeStudentPassword(currentPassword, newPassword);
      await refreshStudentSession();
      addToast('تم تعيين كلمة المرور الجديدة وتأمين حسابك بنجاح!', 'success');
      onSuccess();
    } catch (err: any) {
      setChangeError(err.message || 'فشل تحديث كلمة المرور');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 38, 27, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'login') onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border-light)',
          padding: 0,
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-dark)',
            color: '#ffffff',
            padding: '24px 24px 20px',
            position: 'relative',
            borderBottom: '2px solid var(--color-gold)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'rgba(198, 146, 20, 0.15)',
                border: '1px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold-light)',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                بوابة الطالب التعليمية
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-gold-subtle)' }}>
                {step === 'login' ? 'سجّل دخولك لمتابعة مسارك وأنشطتك التعليمية' : 'تأمين الحساب — تعيين كلمة مرور جديدة'}
              </p>
            </div>
          </div>

          {step === 'login' && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                color: 'rgba(255,255,255,0.7)',
                padding: 6,
                borderRadius: '50%',
              }}
              title="إغلاق"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {step === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--status-rejected-bg)',
                    color: 'var(--status-rejected)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid #fca5a5',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} color="var(--color-primary)" />
                  الرقم الأكاديمي أو البريد الإلكتروني
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: STU-2026-00001 أو البريد المسجل"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 4, display: 'block' }}>
                  أدخل الرقم الأكاديمي الصادر لك عند قبولك (مثل STU-2026-00001)
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                    <Lock size={15} color="var(--color-primary)" />
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-gold-subtle)',
                  border: '1px solid var(--color-gold-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  color: 'var(--color-gold-dark)',
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>ملاحظة:</strong> إذا كان هذا أول دخول لك، يرجى استخدام كلمة المرور المؤقتة المُسلمة لك من إدارة المؤسسة، وسيُطلب منك تعيين كلمة مرور جديدة فورًا.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: 6, fontWeight: 700, padding: '12px' }}
              >
                {loading ? 'جاري التحقق...' : 'دخول بوابة الطالب'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.86rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>إجراء أمني إلزامي:</strong>
                  <div style={{ marginTop: 2 }}>
                    لحماية بياناتك الأكاديمية والشخصية، يجب تعيين كلمة مرور سرية خاصة بك الآن.
                  </div>
                </div>
              </div>

              {changeError && (
                <div
                  style={{
                    backgroundColor: 'var(--status-rejected-bg)',
                    color: 'var(--status-rejected)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{changeError}</span>
                </div>
              )}

              <div>
                <label className="form-label">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="٨ خانات على الأقل (أحرف كبيرة وصغيرة وأرقام)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-gold"
                disabled={changeLoading}
                style={{ width: '100%', fontWeight: 700, padding: '12px', marginTop: 4 }}
              >
                {changeLoading ? 'جاري الحفظ والتأمين...' : 'حفظ كلمة المرور والدخول للبوابة'}
              </button>
            </form>
          )}
        </div>
      </div>

      <ResetPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialRole="student"
      />
    </div>
  );
};
