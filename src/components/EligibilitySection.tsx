import React from 'react';
import { SectionHeading } from './SectionHeading';
import { useApp } from '../context/AppContext';
import { Users, FileCheck, Calendar, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export const EligibilitySection: React.FC = () => {
  const { settings } = useApp();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const criteria = [
    {
      title: 'الفئة المستهدفة',
      detail: settings?.eligible_grades || 'طلاب الصف الأول الثانوي وما بعده',
      sub: 'برنامج مخصص للشباب الراغبين في بناء شخصيتهم القيادية والعلمية',
      icon: Users,
    },
    {
      title: 'شروط القبول',
      detail: 'الرغبة الجادة والالتزام بالبرنامج واجتياز المقابلة الشخصية',
      sub: 'يُشترط التفرغ في أوقات الأنشطة المحددة وحضور اللقاءات الدورية',
      icon: UserCheck,
    },
    {
      title: 'المستندات المطلوبة',
      detail: 'موافقة ولي الأمر الرسمية، وآخر إشعار أكاديمي متوفر',
      sub: 'يتم استكمال باقي الوثائق بعد اجتياز مرحلة الفرز الأولي',
      icon: FileCheck,
    },
    {
      title: 'المقاعد المتاحة',
      detail: 'مقاعد محددة لكل دفعة لضمان جودة الرعاية والتوجيه',
      sub: 'يتم القبول بالأولوية للأكفأ اجتيازاً لمعايير التقييم والمقابلة',
      icon: ShieldCheck,
    },
    {
      title: 'مواعيد التسجيل',
      detail: settings?.application_deadline ? `مستمر حتى: ${settings.application_deadline}` : 'متاح حالياً',
      sub: 'ننصح بسرعة إرسال الطلب قبل اكتمال العدد المخصص للدفعة',
      icon: Calendar,
    },
  ];

  return (
    <section className="section section-subtle">
      <div className="container">
        <SectionHeading
          badge="القبول والتسجيل"
          title="من يستطيع التقديم؟"
          description="حرصاً على تقديم تجربة تربوية استثنائية وعميقة، وضعنا معايير واضحة وشاملة لاستقبال الطلاب الراغبين في الانضمام."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 36,
          }}
        >
          {criteria.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="card"
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 24,
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-gold-dark)', marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                    {item.detail}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 32px',
            border: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
              جاهز لبدء رحلة التميز والقيادة؟
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.96rem' }}>
              لا تتردد في تقديم طلبك اليوم، وكن جزءاً من الجيل الذي يصنع الأثر.
            </p>
          </div>
          <button onClick={() => scrollTo('#register')} className="btn btn-gold btn-lg">
            <span>الانتقال لنموذج التسجيل</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
