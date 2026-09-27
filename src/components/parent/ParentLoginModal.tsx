import React, { useState } from 'react';
import { useParentAuth } from '../../context/ParentAuthContext';
import { changeParentPassword } from '../../services/parentApi';
import { useApp } from '../../context/AppContext';
import { X, Lock, Phone, KeyRound, CheckCircle2, AlertCircle, ShieldAlert, Users, Sparkles } from 'lucide-react';

import { ResetPasswordModal } from '../common/ResetPasswordModal';

interface ParentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParentLoginModal: React.FC<ParentLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, refreshParentSession } = useParentAuth();
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
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور');
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
        addToast('مرحبًا بك في بوابة أولياء الأمور!', 'success');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول، يرجى التأكد من صحة البيانات');
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
      await changeParentPassword(currentPassword, newPassword);
      await refreshParentSession();
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
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(10, 58, 42, 0.25)',
          border: '1px solid rgba(198, 146, 20, 0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
            padding: '24px 24px 20px',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(198, 146, 20, 0.2)',
                border: '1px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="var(--color-gold-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                بوابة أولياء الأمور
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Sparkles size={12} />
                <span>متابعة مسيرة الأبناء التربوية والتعليمية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {step === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    color: 'var(--color-error)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                  رقم الهاتف أو البريد الإلكتروني المسجل:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: 0501234567 أو البريد الإلكتروني"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <Phone size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: 12, top: 13 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                    كلمة المرور:
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <Lock size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: 12, top: 13 }} />
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-cream)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  borderRight: '3px solid var(--color-gold)',
                  lineHeight: 1.5,
                }}
              >
                يتم إصدار وتفعيل حسابات أولياء الأمور رسميًا عبر إدارة المؤسسة بعد اعتماد قبول الطالب لضمان أعلى معايير الخصوصية والأمان.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول إلى بوابة ولي الأمر'}
              </button>
            </form>
          ) : (
            /* Mandatory First-Login Password Change */
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  backgroundColor: 'rgba(198, 146, 20, 0.1)',
                  border: '1px solid var(--color-gold)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <ShieldAlert size={20} color="var(--color-gold-dark)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--color-primary-dark)' }}>
                  <strong>تأمين الدخول الأول:</strong> لأمان بيانات أبنائك، يرجى تعيين كلمة مرور شخصية خاصة بك تحتوي على أحرف كبيرة وصغيرة وأرقام (٨ خانات على الأقل).
                </div>
              </div>

              {changeError && (
                <div
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    color: 'var(--color-error)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{changeError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                  كلمة المرور الجديدة:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة مرور قوية (٨ خانات على الأقل)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 5 }}>
                  تأكيد كلمة المرور الجديدة:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور للتأكيد"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {changeLoading ? 'جارٍ الحفظ والتأمين...' : 'حفظ كلمة المرور والدخول'}
              </button>
            </form>
          )}
        </div>
      </div>

      <ResetPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialRole="parent"
      />
    </div>
  );
};
