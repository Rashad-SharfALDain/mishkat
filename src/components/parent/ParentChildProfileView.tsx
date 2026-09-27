import React from 'react';
import { ChildSummary } from '../../types';
import { User, GraduationCap, Calendar, MapPin, School, BookOpen, ShieldCheck, HeartHandshake, Users } from 'lucide-react';

interface ParentChildProfileViewProps {
  children: ChildSummary[];
  selectedChild: ChildSummary | null;
  onSelectChild: (childId: string) => void;
}

export const ParentChildProfileView: React.FC<ParentChildProfileViewProps> = ({
  children,
  selectedChild,
  onSelectChild,
}) => {
  if (!selectedChild) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          يرجى اختيار طالب لعرض تفاصيل ملفه الأكاديمي.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sibling Selector Header if multiple children */}
      {children.length > 1 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            <Users size={18} color="var(--color-gold-dark)" />
            <span>عرض ملف الطالب:</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {children.map((child) => {
              const isSelected = child.id === selectedChild.id;
              return (
                <button
                  key={child.id}
                  onClick={() => onSelectChild(child.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-dark)' : 'var(--color-surface)',
                    color: isSelected ? 'var(--color-gold-light)' : 'var(--color-text-secondary)',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {child.student_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Student Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border-light)',
            paddingBottom: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                color: 'var(--color-gold-light)',
                border: '2px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
              }}
            >
              {selectedChild.student_name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                {selectedChild.student_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  الرقم الأكاديمي:
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    backgroundColor: 'rgba(10, 58, 42, 0.08)',
                    color: 'var(--color-primary-dark)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {selectedChild.student_number}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.82rem',
                backgroundColor: selectedChild.academic_status === 'نشط' ? 'rgba(22, 101, 52, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                color: selectedChild.academic_status === 'نشط' ? 'var(--color-success)' : 'var(--color-error)',
                border: selectedChild.academic_status === 'نشط' ? '1px solid rgba(22, 101, 52, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
              }}
            >
              الحالة الأكاديمية: {selectedChild.academic_status}
            </span>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <BookOpen size={15} color="var(--color-gold-dark)" />
              <span>المسار التعليمي الأساسي</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.educational_track || 'العلوم الشرعية'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <GraduationCap size={15} color="var(--color-gold-dark)" />
              <span>الصف والمستوى المقيد به</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.current_grade} ({selectedChild.current_level})
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <Calendar size={15} color="var(--color-gold-dark)" />
              <span>تاريخ الاعتماد والقبول</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.admission_date || 'مقبول بالدفعة الحالية'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <School size={15} color="var(--color-gold-dark)" />
              <span>المدرسة المقيد بها صباحًا</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.school || 'مسجل بالنظام'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <MapPin size={15} color="var(--color-gold-dark)" />
              <span>مدينة الإقامة</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.city || 'الرياض'}
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
              <HeartHandshake size={15} color="var(--color-gold-dark)" />
              <span>صلة القرابة المعتمدة</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', fontSize: '0.96rem' }}>
              {selectedChild.guardian_relation || 'ولي أمر'} {selectedChild.is_primary ? '(الولي الأساسي)' : ''}
            </div>
          </div>
        </div>

        {/* Institution Guarantee Note */}
        <div
          style={{
            marginTop: '20px',
            backgroundColor: 'var(--color-cream)',
            borderRight: '3px solid var(--color-gold)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={18} color="var(--color-gold-dark)" style={{ flexShrink: 0 }} />
          <span>
            هذه البيانات معتمدة رسميًا من إدارة التسجيل والقبول بمؤسسة مِشكاة. في حال رغبتكم في تحديث أي بيانات أكاديمية أو مدرسية يرجى التنسيق مع إدارة شؤون الطلاب.
          </span>
        </div>
      </div>
    </div>
  );
};
