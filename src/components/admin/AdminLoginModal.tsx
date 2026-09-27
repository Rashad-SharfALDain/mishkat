import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { loginAdmin, changePassword } from '../../services/api';
import { Lock, Mail, Key, X, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ResetPasswordModal } from '../common/ResetPasswordModal';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setUser } = useAuth();
  const { showToast } = useApp();
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Mandatory First-Login Password Change state
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginAdmin(email, password);
      
      // Check if user is required to change password on first login
      if (res.user.must_change_password) {
        setRequiresPasswordChange(true);
        setTempPassword(password);
        setPendingUser(res.user);
      } else {
        setUser(res.user);
        showToast(`مرحبًا بك، ${res.user.name}`, 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول، يرجى التأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('يجب ألا تقل كلمة المرور الجديدة عن ٨ خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (newPassword === tempPassword) {
      setErrorMsg('يجب تعيين كلمة مرور جديدة مختلفة عن كلمة المرور المؤقتة');
      return;
    }

    // Complexity checks
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setErrorMsg('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام لضمان أمان الحساب');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await changePassword(tempPassword, newPassword);
      showToast('تم تأمين وتحديث كلمة المرور بنجاح!', 'success');
      
      if (pendingUser) {
        setUser({ ...pendingUser, must_change_password: false });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تغيير كلمة المرور، يرجى المحاولة مجددًا.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: requiresPasswordChange ? 'var(--color-gold-subtle)' : 'var(--color-primary-subtle)',
                color: requiresPasswordChange ? 'var(--color-gold-dark)' : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {requiresPasswordChange ? <ShieldAlert size={18} /> : <Lock size={18} />}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {requiresPasswordChange ? 'تغيير كلمة المرور إلزامي' : 'دخول بوابة الإدارة'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-light)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#b91c1c',
              fontSize: '0.88rem',
              margin: '16px 24px 0 24px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Phase 1: Standard Login */}
        {!requiresPasswordChange ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني للمسؤول</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@domain.edu.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    style={{ paddingLeft: 40 }}
                  />
                  <Mail
                    size={18}
                    color="var(--color-text-light)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>كلمة المرور</label>
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
                    className="form-control"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    style={{ paddingLeft: 40 }}
                  />
                  <Key
                    size={18}
                    color="var(--color-text-light)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                🔒 الدخول مقتصر على المشرفين المصرح لهم بمتابعة وفرز طلبات التسجيل وإدارة المؤسسة.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                إلغاء
              </button>
              <button type="submit" disabled={loading} className="btn btn-gold btn-sm" style={{ fontWeight: 700 }}>
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        ) : (
          /* Phase 2: Mandatory First-Login Password Change */
          <form onSubmit={handlePasswordChangeSubmit}>
            <div className="modal-body">
              <div
                style={{
                  backgroundColor: 'var(--color-gold-subtle)',
                  border: '1px solid var(--color-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  fontSize: '0.88rem',
                  color: 'var(--color-gold-dark)',
                  lineHeight: 1.6,
                  marginBottom: 18,
                }}
              >
                <strong>تنبيه أمني:</strong> هذا هو أول تسجيل دخول للحساب الإداري. لحماية النظام وسجلات الطلاب، يلزم تعيين كلمة مرور قوية وخاصة بك قبل الدخول.
              </div>

              <div className="form-group">
                <label className="form-label">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="٨ خانات على الأقل (أحرف كبيرة وصغيرة وأرقام)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div className="form-group">
                <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color={newPassword.length >= 8 ? 'var(--status-accepted)' : '#94a3b8'} />
                  <span>٨ خانات على الأقل</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'var(--status-accepted)' : '#94a3b8'} />
                  <span>تشتمل على أحرف كبيرة وصغيرة</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color={/[0-9]/.test(newPassword) ? 'var(--status-accepted)' : '#94a3b8'} />
                  <span>تشتمل على رقم واحد على الأقل</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-gold btn-sm"
                style={{ fontWeight: 800, width: '100%' }}
              >
                {loading ? 'جاري تحديث كلمة المرور...' : 'حفظ كلمة المرور والدخول للوحة التحكم'}
              </button>
            </div>
          </form>
        )}
      </div>

      <ResetPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialRole="admin"
      />
    </div>
  );
};
