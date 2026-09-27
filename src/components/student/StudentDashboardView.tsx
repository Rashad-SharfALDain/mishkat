import React from 'react';
import { StudentDashboardData } from '../../types';
import {
  BookOpen,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Bell,
  Compass,
  FileText,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
} from 'lucide-react';

interface StudentDashboardViewProps {
  data: StudentDashboardData;
  onNavigateTab: (tab: 'program' | 'activities' | 'attendance' | 'evaluations' | 'announcements' | 'profile') => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ data, onNavigateTab }) => {
  const { student, program, stats, announcements, recentActivities } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          color: '#ffffff',
          padding: '32px 28px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(198, 146, 20, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(198, 146, 20, 0.2)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-gold)', color: 'var(--color-gold-light)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>
              <Sparkles size={15} />
              <span>العام الدراسي 2026-2027</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
              مرحبًا بك، {student.student_name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.98rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6 }}>
              نسأل الله لك مسيرة عامرة بالعلم النافع، والأخلاق الفاضلة، والقيادة الواعية التي تصنع أثرًا مباركًا في نفسك ومجتمعك.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>الرقم الأكاديمي الدائم:</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff' }} dir="ltr">
              {student.student_number}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span className="badge badge-accepted" style={{ fontSize: '0.78rem' }}>
                {student.academic_status}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', alignSelf: 'center' }}>
                {student.current_level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Track Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المسار التعليمي</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 2 }}>
              {student.educational_track || 'العلوم الشرعية'}
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-review-bg)', color: 'var(--status-review)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الأنشطة والمهام</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: 2 }}>
              {stats.activities_completed} مُنجزة / {stats.activities_total} مطلوبة
            </div>
          </div>
        </div>

        {/* Announcements Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-gold-subtle)', color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>الإعلانات والتنبيهات</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: 2 }}>
              {announcements.length} إعلانات نشطة
            </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-completed-bg)', color: 'var(--status-completed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', fontWeight: 600 }}>المرحلة الدراسية</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: 2 }}>
              {student.current_grade || 'الصف الأول الثانوي'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Left Column: Educational Track & Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: برنامجي (My Program) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>برنامجي التعليمي</h3>
              </div>
              <button
                onClick={() => onNavigateTab('program')}
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.82rem' }}
              >
                <span>تفاصيل المسار</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {program?.title || student.educational_track}
              </div>
              <p style={{ margin: '8px 0 14px', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {program?.description || 'مسار تعليمي وتربوي متكامل يهدف إلى التزود بالمعارف والمهارات والقيم الأساسية.'}
              </p>

              {program?.topics && program.topics.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 8 }}>
                    أبرز محاور المسار:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {program.topics.slice(0, 4).map((topic: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--color-border-light)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          color: 'var(--color-primary-dark)',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: مهامي (My Activities) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>مهامي وأنشطتي</h3>
              </div>
              <button
                onClick={() => onNavigateTab('activities')}
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.82rem' }}
              >
                <span>جميع الأنشطة</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-light)' }}>
                <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>لا توجد أنشطة مسندة حاليًا.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivities.map((act) => (
                  <div
                    key={act.student_activity_id}
                    style={{
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {act.title}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                        <span>النوع: {act.activity_type}</span>
                        {act.due_date && <span>الموعد: {act.due_date}</span>}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        act.status === 'تم التسليم' || act.status === 'تم التقييم'
                          ? 'badge-accepted'
                          : 'badge-review'
                      }`}
                      style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: تقدمي (Development Dimensions) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>تقدمي والتقييم الهجين</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('evaluations')}
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.82rem' }}
              >
                <span>التقييمات المعتمدة</span>
                <ArrowLeft size={14} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
              تركز مؤسسة مِشكاة على البناء الشامل لشخصيتك عبر محاور قيمية وتأصيلية متكاملة:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: 14, backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.88rem' }}>
                  <BookOpen size={16} color="var(--color-gold)" />
                  البعد المعرفي
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  التزود بالعلوم الشرعية والفكر الرصين
                </div>
              </div>

              <div style={{ padding: 14, backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.88rem' }}>
                  <ShieldCheck size={16} color="var(--color-gold)" />
                  البعد القيمي
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  بناء الشخصية والأخلاق الإسلامية
                </div>
              </div>

              <div style={{ padding: 14, backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.88rem' }}>
                  <Award size={16} color="var(--color-gold)" />
                  البعد القيادي
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  التأثير الإيجابي وصناعة المبادرات
                </div>
              </div>

              <div style={{ padding: 14, backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.88rem' }}>
                  <HeartHandshake size={16} color="var(--color-gold)" />
                  الأثر المجتمعي
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  المسؤولية والمساهمة في خدمة المجتمع
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule, Attendance, Announcements, Certificates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 4: إعلانات (Announcements) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={20} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>إعلانات المؤسسة</h3>
              </div>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.82rem' }}
              >
                <span>جميع الإعلانات</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--color-text-light)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>لا توجد إعلانات جديدة حاليًا.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      borderRight: '3px solid var(--color-gold)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      padding: '12px 14px',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                  >
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      {ann.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '4px 0 6px', lineHeight: 1.5 }}>
                      {ann.content}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {ann.publish_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 5: جدولي (Schedule - Honest Placeholder) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calendar size={20} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>جدولي الدراسي</h3>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px dashed var(--color-border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '28px 20px',
                textAlign: 'center',
              }}
            >
              <Clock size={32} style={{ margin: '0 auto 10px', color: 'var(--color-gold-dark)' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                جدول اللقاءات والورش التفاعلية
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                سيتم تفعيل هذه الخدمة وعرض مواعيد اللقاءات الأسبوعية قريبًا مع انطلاق الفصل الدراسي.
              </p>
            </div>
          </div>

          {/* Card 6: حضوري (Attendance) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>سجل حضوري والالتزام</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="btn btn-outline-gold btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                <span>السجل والأعذار</span>
                <ArrowLeft size={13} />
              </button>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(10, 58, 42, 0.04)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  الرصد الإلكتروني:
                </span>
                <span className="badge badge-accepted" style={{ fontSize: '0.74rem' }}>
                  مفعل ونشط
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                يمكنك الآن استعراض نسب الالتزام، رصد حالات الحضور الخمس، وتقديم الأعذار الرسمية خلال مهلة 48 ساعة.
              </p>
            </div>
          </div>

          {/* Card 7: شهاداتي (Certificates - Honest Placeholder) */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Award size={20} color="var(--color-gold-dark)" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>شهاداتي</h3>
            </div>
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px dashed var(--color-border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                الشهادات المعتمدة ورخص الإتمام
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                سيتم تفعيل إصدار الشهادات الرقمية فور إتمام متطلبات ومخرجات المسار التعليمي.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
