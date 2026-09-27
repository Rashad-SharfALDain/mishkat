import React from 'react';
import { SectionHeading } from './SectionHeading';
import { useApp } from '../context/AppContext';
import { BadgeHelp, ShieldCheck, HeartHandshake, CheckCircle } from 'lucide-react';

export const FinancialContribution: React.FC = () => {
  const { settings } = useApp();

  const feeAmount = settings?.registration_fee || '500';
  const currency = settings?.currency || 'ريال سعودي';
  const maxFee = settings?.registration_fee_max || '1000';

  return (
    <section className="section section-subtle">
      <div className="container" style={{ maxWidth: 1000 }}>
        <SectionHeading
          badge="الشفافية والاستدامة"
          title="الرسوم والمساهمة المالية"
          description="تعتمد المؤسسة سياسة واضحة وشفافة بشأن التكاليف التشغيلية لدعم جودة واستمرارية البيئة التعليمية والتربوية."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 28,
            alignItems: 'stretch',
          }}
        >
          {/* Card 1: Fee Structure */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              padding: 32,
              borderTop: '4px solid var(--color-gold)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="badge badge-accepted">مساهمة تقديرية غير إلزامية</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                حد أقصى معتمد: {maxFee} {currency}
              </span>
            </div>

            <div style={{ margin: '14px 0 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-primary-dark)', lineHeight: 1 }}>
                  {feeAmount}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {currency}
                </span>
                <span style={{ fontSize: '0.84rem', color: 'var(--color-gold-dark)', fontWeight: 600, marginRight: 10 }}>
                  (قيمة قابلة للتعديل من الإدارة)
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-gold-dark)', fontWeight: 600, marginTop: 6 }}>
                مساهمة رمزية لدعم المواد والأنشطة — قابلة للتعديل أو الإعفاء بنسبة ١٠٠٪ للمستحقين
              </div>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              تُوجّه هذه المساهمة لتغطية المستلزمات الإثرائية، الحقائب التدريبية، منصات القراءة الذاتية، والأنشطة الميدانية والضيافة طوال فترة البرنامج.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.92rem' }}>
                <CheckCircle size={16} color="var(--color-primary)" />
                <span>شاملة جميع المواد والمناهج التدريبية</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.92rem' }}>
                <CheckCircle size={16} color="var(--color-primary)" />
                <span>شاملة الأنشطة الميدانية وحلقات النقاش</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.92rem' }}>
                <CheckCircle size={16} color="var(--color-primary)" />
                <span>لا تُطلب إلا بعد إشعار القبول الرسمي النهائي</span>
              </div>
            </div>
          </div>

          {/* Card 2: Principles & Full Waivers */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              padding: 32,
              borderTop: '4px solid var(--color-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HeartHandshake size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  صندوق المنح والإعفاء الكامل
                </h3>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-gold-subtle)',
                  border: '1px solid var(--color-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--color-gold-dark)', fontSize: '0.96rem', marginBottom: 4 }}>
                  مبدأ راسخ في دار مِشكاة:
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                  <strong>"القدرة المالية ليست شرطاً ولا عائقاً أمام أي طالب موهوب."</strong>
                </p>
              </div>

              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: 1.75, marginBottom: 14 }}>
                يدعم الواقفون والمحسنون صندوقاً خاصاً لكفالة الطلاب المتميزين، حيث يحصل أي طالب يستحق الدعم على إعفاء مالي بنسبة ١٠٠٪ وبسرية تامة لحفظ كرامة الطالب وأسرته.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: 'var(--color-text-muted)',
              }}
            >
              <ShieldCheck size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>المساهمة المالية لا تضمن القبول التلقائي، فالمعيار الأوحد هو الكفاءة والمقابلة.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
