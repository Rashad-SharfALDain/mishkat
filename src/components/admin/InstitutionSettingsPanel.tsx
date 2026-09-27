import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updateSettings } from '../../services/api';
import { Save, CheckCircle2, Shield, Settings, Sliders } from 'lucide-react';

export const InstitutionSettingsPanel: React.FC = () => {
  const { settings, refreshSettings, showToast } = useApp();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      await refreshSettings();
      showToast('تم حفظ وتحديث إعدادات المؤسسة بنجاح', 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: '#ffffff',
        padding: '32px 36px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            إعدادات المؤسسة والتسجيل العامة
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
            تتيح هذه اللوحة تعديل معايير القبول، الرسوم، وحالة التسجيل دون الحاجة لتعديل الكود المصدري.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Section 1: Institution Identity */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginBottom: 16 }}>
          ١. هوية المؤسسة والشعارات
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="form-group">
            <label className="form-label">اسم المؤسسة الرسمي</label>
            <input
              type="text"
              className="form-control"
              value={form.institution_name || ''}
              onChange={(e) => handleChange('institution_name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">الشعار اللفظي الرئيسي</label>
            <input
              type="text"
              className="form-control"
              value={form.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">الوصف التعريفي للرسالة</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.sub_tagline || ''}
              onChange={(e) => handleChange('sub_tagline', e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Registration & Fees Configuration */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginBottom: 16 }}>
          ٢. إعدادات القبول والرسوم المالية
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="form-group">
            <label className="form-label">حالة فتح التسجيل للجمهور</label>
            <select
              className="form-control"
              value={form.registration_status || 'open'}
              onChange={(e) => handleChange('registration_status', e.target.value)}
              style={{ fontWeight: 700 }}
            >
              <option value="open">مفتوح لاستقبال الطلبات (Open)</option>
              <option value="closed">مغلق مؤقتًا (Closed)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">المساهمة المالية الرمزية الحالية</label>
            <input
              type="number"
              className="form-control"
              value={form.registration_fee || '500'}
              onChange={(e) => handleChange('registration_fee', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">الحد الأقصى للمساهمة المعتمدة</label>
            <input
              type="number"
              className="form-control"
              value={form.registration_fee_max || '1000'}
              onChange={(e) => handleChange('registration_fee_max', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">العملة</label>
            <input
              type="text"
              className="form-control"
              value={form.currency || 'SAR'}
              onChange={(e) => handleChange('currency', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">المراحل والصفوف المؤهلة</label>
            <input
              type="text"
              className="form-control"
              value={form.eligible_grades || ''}
              onChange={(e) => handleChange('eligible_grades', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">الموعد النهائي للتقديم</label>
            <input
              type="date"
              className="form-control"
              value={form.application_deadline || ''}
              onChange={(e) => handleChange('application_deadline', e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Official Contact Channels */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginBottom: 16 }}>
          ٣. قنوات التواصل والمقر
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="form-group">
            <label className="form-label">الهاتف الرسمي</label>
            <input
              type="text"
              className="form-control"
              value={form.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">واتساب الاستفسارات</label>
            <input
              type="text"
              className="form-control"
              value={form.contact_whatsapp || ''}
              onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">البريد الإلكتروني الرسمي</label>
            <input
              type="email"
              className="form-control"
              value={form.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">العنوان والمقر</label>
            <input
              type="text"
              className="form-control"
              value={form.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">ساعات العمل الرسمية</label>
            <input
              type="text"
              className="form-control"
              value={form.working_hours || ''}
              onChange={(e) => handleChange('working_hours', e.target.value)}
            />
          </div>
        </div>

        {/* Section 4: Bank Account for Support */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-dark)', marginBottom: 16 }}>
          ٤. الحساب البنكي للوقف والتبرعات
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 30 }}>
          <div className="form-group">
            <label className="form-label">اسم الحساب البنكي المعتمد</label>
            <input
              type="text"
              className="form-control"
              value={form.donation_account_name || ''}
              onChange={(e) => handleChange('donation_account_name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الآيبان (IBAN)</label>
            <input
              type="text"
              className="form-control"
              value={form.donation_iban || ''}
              onChange={(e) => handleChange('donation_iban', e.target.value)}
              dir="ltr"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-gold btn-lg"
          style={{ fontWeight: 800 }}
        >
          <Save size={18} />
          <span>{saving ? 'جاري حفظ الإعدادات...' : 'حفظ وتطبيق التغييرات'}</span>
        </button>
      </form>
    </div>
  );
};
