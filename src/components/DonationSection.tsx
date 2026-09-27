import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { useApp } from '../context/AppContext';
import { Heart, Building2, Copy, CheckCircle, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

export const DonationSection: React.FC = () => {
  const { settings, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('دعم طالب');

  const purposes = [
    { title: 'دعم طالب', desc: 'كفالة مقعد تعليمي وتربوي متكامل لشاب متميز طوال العام الدراسي' },
    { title: 'دعم التعليم', desc: 'توفير المراجع العلمية والمنصات الرقمية ووسائل الإيضاح المعرفية' },
    { title: 'دعم الأنشطة', desc: 'تمويل الرحلات التربوية الهادفة والملتقيات التفاعلية والورش التدريبية' },
    { title: 'دعم برامج القيادة', desc: 'رعاية مشاريع القيادة والمبادرات الاجتماعية التي يقودها الطلاب' },
    { title: 'دعم المنح', desc: 'تمويل صندوق الإعفاءات للطلاب المستحقين من ذوي الدخل المحدود' },
    { title: 'تبرع عام', desc: 'المساهمة في المصارف التشغيلية والتطويرية للدار وفق أولويات الحاجة' },
  ];

  const handleCopyIban = () => {
    if (settings?.donation_iban) {
      navigator.clipboard.writeText(settings.donation_iban);
      setCopied(true);
      showToast('تم نسخ رقم الآيبان البنكي بنجاح', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <section id="donate" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container" style={{ maxWidth: 1040 }}>
        <SectionHeading
          badge="الوقف والدعم"
          title="ساهم في بناء جيل يصنع أثرًا"
          description="استثمارك في شاب اليوم هو استثمار في قيادة الغد وصلاح المجتمع. مساهمتك ترعى العلم وتغرس القيم المستدامة."
        />

        {/* Donation Purposes Grid */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 16 }}>
            اختر مجالات المساهمة والرعاية:
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {purposes.map((p, idx) => {
              const isSelected = selectedPurpose === p.title;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPurpose(p.title)}
                  style={{
                    padding: '20px 22px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--color-gold)' : 'var(--color-border-light)'}`,
                    backgroundColor: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-bg-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                      {p.title}
                    </div>
                    {isSelected && <Sparkles size={16} color="var(--color-gold-dark)" />}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transparent Payment Placeholder & Bank Transfer Card */}
        <div
          className="card"
          style={{
            backgroundColor: 'var(--color-primary-dark)',
            color: '#ffffff',
            padding: '36px 40px',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--color-gold)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              paddingBottom: 24,
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-gold-light)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>
                <Building2 size={16} />
                <span>التحويل البنكي المباشر المعتمد</span>
              </div>
              <h4 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                الحساب البنكي الرسمي للمؤسسة
              </h4>
            </div>

            {/* Electronic payment status disclaimer */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                backgroundColor: 'rgba(198, 146, 20, 0.2)',
                border: '1px solid var(--color-gold)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.86rem',
                color: 'var(--color-gold-light)',
              }}
            >
              <CreditCard size={15} />
              <span>سيتم تفعيل بوابات الدفع الإلكتروني (مدى / بطاقات) قريبًا</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                اسم الحساب البنكي (نموذج توضيحي):
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                {settings?.donation_account_name || 'مؤسسة مِشكاة التعليمية (حساب تجريبي قيد الاعتماد)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                البنك المعتمد:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                مصرف الراجحي (حساب قيد التأسيس والاعتماد الرسمي)
              </div>
            </div>
          </div>

          {/* IBAN Display Box */}
          <div
            style={{
              marginTop: 24,
              padding: '18px 24px',
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(198, 146, 20, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                رقم الآيبان الدولي (IBAN) — (نموذج تجريبي):
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  marginTop: 2,
                }}
                dir="ltr"
              >
                {settings?.donation_iban || 'SA0380000000000000000000'}
              </div>
            </div>

            <button
              onClick={handleCopyIban}
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700 }}
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              <span>{copied ? 'تم النسخ' : 'نسخ الآيبان'}</span>
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: '0.84rem',
              color: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>
              يرجى إرسال إشعار التحويل البنكي مع تحديد الغرض ({selectedPurpose}) عبر رقم الواتساب الرسمي لإصدار سند القبض الوقفي المعتمد.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
