import React from 'react';
import { FileText, Clock, Sparkles, ShieldCheck } from 'lucide-react';

export const ParentReportsView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(10, 58, 42, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={24} color="var(--color-primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
            التقارير الدورية والشهادات
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            تقارير الأداء الفصلي الشامل، شهادات الحضور والإنجاز، وسجل الساعات التطوعية.
          </p>
        </div>
      </div>

      {/* Future Phase Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 24px',
          border: '1.5px dashed var(--color-gold)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--color-gold)',
          }}
        >
          <Clock size={32} color="var(--color-gold-dark)" />
        </div>

        <div style={{ maxWidth: '480px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(198, 146, 20, 0.15)', color: 'var(--color-gold-dark)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <Sparkles size={12} />
            قيد الإعداد للمرحلة 2.3
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 8px' }}>
            التقارير الأكاديمية والتربوية الشاملة
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            سيتم تفعيل إصدار التقارير الدورية وبطاقات الأداء الرقمية المعتمدة تلقائيًا بنهاية الفصل التعليمي الأول بعد اكتمال رصد التقييمات في المرحلة القادمة.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-light)',
            fontSize: '0.82rem',
            color: 'var(--color-primary-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ShieldCheck size={16} color="var(--color-success)" />
          <span>الشهادات الصادرة من مؤسسة مِشكاة ستكون مزودة برمز تحقق رقمي مشفر (QR).</span>
        </div>
      </div>
    </div>
  );
};
