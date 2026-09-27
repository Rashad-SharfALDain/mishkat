import React from 'react';
import { ParentDashboardData, ChildSummary } from '../../types';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  Award, 
  BookOpen, 
  Bell, 
  ArrowLeft, 
  AlertCircle, 
  ChevronLeft,
  Sparkles,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface ParentDashboardViewProps {
  data: ParentDashboardData;
  selectedChild: ChildSummary | null;
  onSelectChild: (childId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  data,
  selectedChild,
  onSelectChild,
  onNavigateTab,
}) => {
  const { parent, children, announcements, stats } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 24px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(198, 146, 20, 0.25)', color: 'var(--color-gold-light)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={14} />
            بوابة أولياء الأمور المعتمدة
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
            أهلاً بك، {parent.full_name}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.92rem', maxWidth: '650px', lineHeight: 1.6 }}>
            نسعد بشراكتكم في غرس القيم وبناء معارف ومهارات أبنائنا الواعدين. تابعوا هنا تفاصيل المسار التعليمي وحالة الإنجاز والأنشطة القيمية.
          </p>
        </div>
      </div>

      {/* Multiple Children Selector Card (Requirement 8) */}
      {children.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {children.length > 1 ? 'اختر الطالب للمتابعة (أبنائي المسجلون):' : 'الطالب المسجل بحسابك:'}
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              إجمالي الأبناء المرتبطين: {children.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {children.map((child) => {
              const isSelected = selectedChild?.id === child.id;
              return (
                <div
                  key={child.id}
                  onClick={() => onSelectChild(child.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border-light)',
                    backgroundColor: isSelected ? 'rgba(198, 146, 20, 0.08)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--color-primary-dark)' : 'rgba(10, 58, 42, 0.1)',
                          color: isSelected ? 'var(--color-gold-light)' : 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                        }}
                      >
                        {child.student_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-primary-dark)' }}>
                          {child.student_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {child.student_number}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        backgroundColor: child.academic_status === 'نشط' ? 'rgba(22, 101, 52, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: child.academic_status === 'نشط' ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      {child.academic_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-secondary)', borderTop: '1px dashed var(--color-border-light)', paddingTop: 6 }}>
                    <span>{child.educational_track || 'العلوم الشرعية'}</span>
                    <span>{child.current_grade || 'المرحلة الثانوية'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Child Spotlight */}
      {selectedChild ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Card 1: Academic Track Info */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  المسار والصف الأكاديمي
                </span>
                <BookOpen size={18} color="var(--color-gold-dark)" />
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                {selectedChild.educational_track}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {selectedChild.current_grade} • {selectedChild.current_level}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('child-profile')}
              style={{
                marginTop: 16,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>عرض تفاصيل ملف الابن</span>
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Card 2: Attendance Foundation Notice */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  متابعة الحضور والانضباط
                </span>
                <CalendarCheck size={18} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                حالة الانضباط الأكاديمي
              </div>
              <div
                style={{
                  backgroundColor: 'var(--color-cream)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Clock size={14} color="var(--color-gold-dark)" />
                <span>{stats.attendance_status}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('attendance')}
              style={{
                marginTop: 16,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>سجل الحضور والغياب</span>
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Card 3: Educational Progress */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  التقدم القيمي والمهاري
                </span>
                <Award size={18} color="var(--color-gold-dark)" />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 6 }}>
                التقييم التربوي الشامل
              </div>
              <div
                style={{
                  backgroundColor: 'var(--color-cream)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldCheck size={14} color="var(--color-primary)" />
                <span>{stats.evaluations_status}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('progress')}
              style={{
                marginTop: 16,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>مؤشرات التقدم والمسارات</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}
        >
          <AlertCircle size={36} color="var(--color-gold)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0 0 6px 0' }}>
            لا يوجد طالب مرتبط حاليًا
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            يتم ربط الأبناء بحساب ولي الأمر عبر إدارة المؤسسة. إذا تم قبول ابنك مؤخرًا، يرجى مراجعة إدارة التسجيل والقبول لتفعيل الارتباط.
          </p>
        </div>
      )}

      {/* Recent Announcements */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} color="var(--color-gold-dark)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              إعلانات وتعاميم أولياء الأمور
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('announcements')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            عرض جميع الإعلانات
          </button>
        </div>

        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            لا توجد إعلانات منشورة حاليًا.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border-light)',
                  borderRight: '3px solid var(--color-gold)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
                    {ann.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {ann.publish_date}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
