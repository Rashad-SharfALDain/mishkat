import React, { useState, useEffect } from 'react';
import { fetchStudentProfile, updateStudentProfile, changeStudentPassword } from '../../services/studentApi';
import { StudentProfile } from '../../types';
import { useApp } from '../../context/AppContext';
import { User, Phone, School, Compass, Calendar, Lock, CheckCircle2, AlertCircle, Shield, Award } from 'lucide-react';

interface StudentProfileViewProps {
  onBackToDashboard: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ onBackToDashboard }) => {
  const { addToast } = useApp();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable Contact State
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const loadProfile = () => {
    setLoading(true);
    fetchStudentProfile()
      .then((data) => {
        setProfile(data);
        setPhone(data.phone || '');
        setEmergencyContact(data.emergency_contact || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      await updateStudentProfile({ phone, emergency_contact: emergencyContact });
      addToast('تم تحديث بيانات الاتصال بنجاح', 'success');
      loadProfile();
    } catch (err: any) {
      addToast(err.message || 'فشل تحديث بيانات الاتصال', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 8) {
      setPassError('يجب ألا تقل كلمة المرور عن ٨ خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('كلمتا المرور غير متطابقتين');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber) {
      setPassError('يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام');
      return;
    }

    setChangingPass(true);
    try {
      await changeStudentPassword(currentPassword, newPassword);
      addToast('تم تغيير كلمة المرور بنجاح', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <div>جاري تحميل ملفك الشخصي...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--status-rejected)' }}>تعذر تحميل بيانات الملف الشخصي</p>
        <button onClick={onBackToDashboard} className="btn btn-outline-gold" style={{ marginTop: 12 }}>
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onBackToDashboard}
          className="btn btn-sm"
          style={{ backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-primary-dark)' }}
        >
          ← الرئيسية
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            ملفي الشخصي والأكاديمي
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
            بيانات القيد الأكاديمي، معلومات الاتصال، وإعدادات الأمان
          </p>
        </div>
      </div>

      {/* Official Academic Info (Read-Only) */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Shield size={22} color="var(--color-primary)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>البيانات الأكاديمية الرسمية</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
              (بيانات رسمية معتمدة من قِبل إدارة القبول والتسجيل — غير قابلة للتعديل الذاتي)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>اسم الطالب الثلاثي</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
              {profile.student_name}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الرقم الأكاديمي الدائم</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginTop: 4 }} dir="ltr">
              {profile.student_number}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المسار التعليمي</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: 4 }}>
              {profile.educational_track}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المستوى والحالة</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className="badge badge-accepted">{profile.academic_status}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{profile.current_level}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المرحلة والمدرسة</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {profile.current_grade} — {profile.school}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', fontWeight: 600 }}>تاريخ الاعتماد والقبول</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {profile.admission_date}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Editable Contact Info & Password Change */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Editable Contact Info */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Phone size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>بيانات الاتصال المعتمدة</h3>
          </div>

          <form onSubmit={handleUpdateContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">رقم هاتف الطالب للتواصل</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'right' }}
                required
              />
            </div>

            <div>
              <label className="form-label">هاتف الطوارئ / ولي الأمر</label>
              <input
                type="tel"
                className="form-control"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'right' }}
                placeholder="رقم ولي الأمر المعتمد"
              />
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              <div><strong>ولي الأمر المسجل:</strong> {profile.guardian_name} ({profile.guardian_relationship})</div>
              <div style={{ marginTop: 2 }}><strong>البريد الأكاديمي:</strong> {profile.email}</div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingContact}
              style={{ fontWeight: 700, padding: '10px 18px', alignSelf: 'flex-start' }}
            >
              {savingContact ? 'جاري الحفظ...' : 'حفظ بيانات الاتصال'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Lock size={20} color="var(--color-gold-dark)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>تحديث كلمة المرور</h3>
          </div>

          {passError && (
            <div
              style={{
                backgroundColor: 'var(--status-rejected-bg)',
                color: 'var(--status-rejected)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <AlertCircle size={16} />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">كلمة المرور الحالية</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="form-control"
                placeholder="٨ خانات على الأقل (أحرف وأرقام)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={changingPass}
              style={{ fontWeight: 700, padding: '10px 18px', alignSelf: 'flex-start', marginTop: 4 }}
            >
              {changingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
