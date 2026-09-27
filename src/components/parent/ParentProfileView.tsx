import React, { useState, useEffect } from 'react';
import { fetchParentProfile, updateParentProfile, changeParentPassword } from '../../services/parentApi';
import { useApp } from '../../context/AppContext';
import { User, Phone, MapPin, Mail, Lock, ShieldCheck, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ParentProfileView: React.FC = () => {
  const { addToast } = useApp();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable Contact Fields (phone, address, email)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchParentProfile()
      .then((data) => {
        setProfile(data);
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setEmail(data.email || data.user_email || '');
      })
      .catch((err) => console.error('Error fetching parent profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      addToast('يرجى إدخال رقم هاتف صحيح', 'error');
      return;
    }

    setSavingContact(true);
    try {
      await updateParentProfile({ phone: phone.trim(), address: address.trim(), email: email.trim() });
      addToast('تم تحديث بيانات الاتصال بنجاح', 'success');
    } catch (err: any) {
      addToast(err.message || 'تعذر تحديث بيانات الاتصال', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('يجب ألا تقل كلمة المرور الجديدة عن ٨ خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setPasswordError('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام لضمان الأمان');
      return;
    }

    setSavingPassword(true);
    try {
      await changeParentPassword(currentPassword, newPassword);
      addToast('تم تغيير كلمة المرور وتأمين الحساب بنجاح', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        جارٍ تحميل الملف الشخصي...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1.5px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-dark)',
              color: 'var(--color-gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              border: '2px solid var(--color-gold)',
            }}
          >
            {profile.full_name?.charAt(0) || 'و'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              {profile.full_name}
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              الصفة المعتمدة: <strong>{profile.relationship || 'ولي أمر'}</strong> • الحالة: <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{profile.status}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-cream)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            color: 'var(--color-primary-dark)',
            fontWeight: 700,
            border: '1px solid var(--color-gold)',
          }}
        >
          حساب ولي أمر معتمد
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Form 1: Contact Information (Permitted Edits Only) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 12 }}>
            <Phone size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              تحديث بيانات الاتصال
            </h3>
          </div>

          <form onSubmit={handleUpdateContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                رقم الجوال للتواصل والإشعارات:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                البريد الإلكتروني:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                عنوان الإقامة / المدينة:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: الرياض - حي النخيل"
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

            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              ملاحظة: البيانات الأكاديمية وصلة القرابة المسجلة بالأبناء يتم تعديلها عبر إدارة شؤون الطلاب فقط.
            </div>

            <button
              type="submit"
              disabled={savingContact}
              className="btn btn-primary"
              style={{
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 4,
              }}
            >
              <Save size={16} />
              <span>{savingContact ? 'جارٍ الحفظ...' : 'حفظ تعديلات الاتصال'}</span>
            </button>
          </form>
        </div>

        {/* Form 2: Password Change */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 12 }}>
            <Lock size={18} color="var(--color-gold-dark)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              تغيير كلمة المرور
            </h3>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {passwordError && (
              <div
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: 'var(--color-error)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertCircle size={15} />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                كلمة المرور الحالية:
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                كلمة المرور الجديدة:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="٨ خانات على الأقل (أحرف كبيرة وصغيرة وأرقام)"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 5 }}>
                تأكيد كلمة المرور الجديدة:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
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
              disabled={savingPassword}
              className="btn btn-outline"
              style={{
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 4,
              }}
            >
              <ShieldCheck size={16} />
              <span>{savingPassword ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
