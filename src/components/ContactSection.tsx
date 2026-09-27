import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { useApp } from '../context/AppContext';
import { submitContact } from '../services/api';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { settings, showToast } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    _honeypot: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name.trim() || !formData.phone.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitContact(formData);
      setSuccess(true);
      showToast('تم استلام رسالتك بنجاح وسنتواصل معك قريباً', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        _honeypot: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.');
      showToast('فشل إرسال الرسالة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <SectionHeading
          badge="قنوات الاتصال"
          title="تواصل معنا"
          description="فريقنا يرحب باستفساراتكم، وملاحظاتكم، واقتراحاتكم. يسعدنا دائماً مد جسور التواصل معكم."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            gap: 40,
            alignItems: 'flex-start',
          }}
          className="contact-grid"
        >
          {/* Contact Details & Info Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              padding: 32,
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 20 }}>
              معلومات المقر والتواصل
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الهاتف الرسمي:</div>
                  <a href={`tel:${settings?.contact_phone || '+966 11 000 0000'}`} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary-dark)' }} dir="ltr">
                    {settings?.contact_phone || '+966 11 000 0000'}
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-gold-subtle)',
                    color: 'var(--color-gold-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 600 }}>واتساب الاستفسارات:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary-dark)' }} dir="ltr">
                    {settings?.contact_whatsapp || '+966 50 000 0000'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 600 }}>البريد الإلكتروني:</div>
                  <a href={`mailto:${settings?.contact_email || 'info@mishkat.edu.sa'}`} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {settings?.contact_email || 'info@mishkat.edu.sa'}
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المقر الرئيسي:</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    {settings?.address || 'المملكة العربية السعودية - الرياض'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontWeight: 600 }}>ساعات العمل الرسمية:</div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                    {settings?.working_hours || 'الأحد إلى الخميس: ٨:٠٠ ص - ٥:٠٠ م'}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                color: 'var(--color-text-light)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              * جميع أرقام التواصل والعناوين أعلاه مخصصة للمعاينة التجريبية وسيتم ربطها بقنوات المؤسسة الرسمية بعد التدشين.
            </div>
          </div>

          {/* Direct Inquiry Form */}
          <div
            className="card"
            style={{
              padding: '36px 40px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 8 }}>
              أرسل لنا رسالة مباشرة
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: 24 }}>
              سيقوم المشرف المختص بمراجعة رسالتك والرد خلال يوم عمل واحد:
            </p>

            {success ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: 'var(--color-primary-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-primary-light)',
                }}
              >
                <CheckCircle2 size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto' }} />
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 8 }}>
                  تم استلام رسالتك بنجاح!
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: 20 }}>
                  شكرًا لتواصلك واهتمامك. سنقوم بالتواصل معك عبر الهاتف أو البريد الإلكتروني قريباً.
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-primary btn-sm">
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Honeypot hidden input for spam bots */}
                <input
                  type="text"
                  name="_honeypot"
                  value={formData._honeypot}
                  onChange={(e) => setFormData({ ...formData, _honeypot: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMsg && (
                  <div
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      marginBottom: 18,
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">
                      الاسم الكريم <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="اسمك الكامل"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      رقم الجوال للتواصل <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="05XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="your-email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      dir="ltr"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      موضوع الرسالة <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="مثال: استفسار عن مواعيد المقابلات"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    نص الرسالة <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="اكتب تفاصيل استفسارك هنا..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-gold btn-lg"
                  style={{ width: '100%', fontWeight: 800, marginTop: 10 }}
                >
                  {submitting ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>إرسال الرسالة</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
