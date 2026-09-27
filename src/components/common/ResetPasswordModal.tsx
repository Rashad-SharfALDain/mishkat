import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { requestForgotPassword, verifyResetToken, submitResetPassword } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'admin' | 'student' | 'parent';
  initialToken?: string;
  onResetSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'admin',
  initialToken = '',
  onResetSuccess,
}) => {
  const { addToast, showToast } = useApp();
  const triggerToast = addToast || showToast || (() => {});

  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'success'>('request');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset phase with token
  const [token, setToken] = useState(initialToken);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyingToken, setVerifyingToken] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setStep('reset');
      verifyToken(initialToken);
    } else {
      setStep('request');
      setIdentifier('');
      setError(null);
    }
  }, [initialToken, isOpen]);

  const verifyToken = async (tok: string) => {
    setVerifyingToken(true);
    setError(null);
    try {
      const data = await verifyResetToken(tok);
      setMaskedEmail(data.email || '');
    } catch (err: any) {
      setError(err.message || 'الرابط غير صالح أو انتهت صلاحيته');
    } finally {
      setVerifyingToken(false);
    }
  };

  if (!isOpen) return null;

  const roleLabels: Record<string, { title: string; hint: string }> = {
    admin: {
      title: 'استعادة كلمة مرور الإدارة',
      hint: 'أدخل البريد الإلكتروني الإداري المعتمد المسجل في النظام',
    },
    student: {
      title: 'استعادة كلمة مرور الطالب',
      hint: 'أدخل الرقم الأكاديمي (STU-...) أو البريد الإلكتروني المسجل عند القبول',
    },
    parent: {
      title: 'استعادة كلمة مرور ولي الأمر',
      hint: 'أدخل البريد الإلكتروني أو رقم الهاتف المسجل لولي الأمر',
    },
  };

  const currentRoleInfo = roleLabels[initialRole] || roleLabels.admin;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('يرجى إدخال البريد الإلكتروني أو الرقم التعريفي');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestForgotPassword(identifier.trim(), initialRole);
      setStep('sent');
      triggerToast('تم استلام الطلب بنجاح', 'info');
    } catch (err: any) {
      setError(err.message || 'تعذر معالجة الطلب، يرجى المحاولة لاحقًا');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('يجب ألا تقل كلمة المرور عن ٨ خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setError('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام لضمان أمان الحساب');
      return;
    }

    setLoading(true);
    try {
      await submitResetPassword(token, newPassword);
      setStep('success');
      triggerToast('تم تحديث كلمة المرور وتأمين حسابك بنجاح!', 'success');
      if (onResetSuccess) {
        onResetSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'فشل إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 38, 27, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2xl)',
          overflow: 'hidden',
          border: '1px solid rgba(217, 119, 6, 0.2)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--color-primary-dark)',
            padding: '24px',
            position: 'relative',
            borderBottom: '3px solid var(--color-gold)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              color: 'rgba(255,255,255,0.7)',
              padding: 6,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="إغلاق"
          >
            <X size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(217, 119, 6, 0.2)',
                color: 'var(--color-gold-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {step === 'reset' || step === 'success' ? 'تعيين كلمة مرور جديدة' : currentRoleInfo.title}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-gold-subtle)' }}>
                {step === 'reset'
                  ? 'أدخل كلمة المرور الجديدة لتأمين حسابك'
                  : 'منظومة المصادقة الآمنة — مؤسسة مِشكاة'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'var(--status-rejected-bg)',
                color: 'var(--status-rejected)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 18,
                border: '1px solid #fca5a5',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Request Password Reset */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={15} color="var(--color-primary)" />
                  البريد الإلكتروني أو المعرّف
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="name@domain.com أو الرقم الأكاديمي"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 4, display: 'block' }}>
                  {currentRoleInfo.hint}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                🔒 <strong>حماية الخصوصية:</strong> لضمان أمان المنظومة، لن يتم إظهار ما إذا كان الحساب مسجلاً أم لا. إذا كانت البيانات مطابقة، فستصلك رسالة فورية تتضمن رابطًا صالحًا لمرة واحدة فقط.
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <span>إرسال رابط الاستعادة</span>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ padding: '12px 18px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Request Sent Confirmation */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 8px 0' }}>
                تم استلام الطلب بنجاح
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                إذا كانت بيانات الحساب مطابقة، ستصل تعليمات الاستعادة إلى البريد المسجل.
              </p>
              <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#92400e', marginBottom: 20 }}>
                💡 <strong>ملاحظة:</strong> يرجى تفقد مجلد البريد غير الهام (Junk/Spam) إذا لم تظهر الرسالة في صندوق الوارد.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '12px 20px' }}
              >
                العودة لشاشة الدخول
              </button>
            </div>
          )}

          {/* STEP 3: Reset Password with Token */}
          {step === 'reset' && (
            verifyingToken ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Loader2 size={32} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>جاري التحقق من صلاحية الرابط...</p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {maskedEmail && (
                  <div style={{ backgroundColor: 'var(--color-primary-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="var(--color-primary)" />
                    <span>إعادة التعيين للحساب: <strong>{maskedEmail}</strong></span>
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={15} color="var(--color-primary)" />
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    dir="ltr"
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 4, display: 'block' }}>
                    يجب أن تتكون من ٨ خانات على الأقل، وتحتوي على أحرف كبيرة وصغيرة وأرقام
                  </span>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={15} color="var(--color-primary)" />
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 20px', marginTop: 8 }}
                  disabled={loading}
                >
                  {loading ? 'جاري حفظ كلمة المرور...' : 'تأكيد وحفظ كلمة المرور'}
                </button>
              </form>
            )
          )}

          {/* STEP 4: Reset Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 8px 0' }}>
                تم تعيين كلمة المرور بنجاح!
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                تم تأمين حسابك بنجاح بكلمة المرور الجديدة، وتم إبطال رابط الاستعادة لضمان الحماية. يمكنك الآن تسجيل الدخول مباشرة.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '12px 20px' }}
              >
                المتابعة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
