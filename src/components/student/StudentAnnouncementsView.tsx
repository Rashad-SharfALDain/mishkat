import React, { useEffect, useState } from 'react';
import { fetchStudentAnnouncements } from '../../services/studentApi';
import { Announcement } from '../../types';
import { Bell, Calendar, Sparkles } from 'lucide-react';

interface StudentAnnouncementsViewProps {
  onBackToDashboard: () => void;
}

export const StudentAnnouncementsView: React.FC<StudentAnnouncementsViewProps> = ({ onBackToDashboard }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              إعلانات وتنبيهات المؤسسة
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
              كل ما يستجد من مواعيد ولقاءات وفعاليات موجهة للطلاب
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div>جاري تحميل الإعلانات...</div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Bell size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>لا توجد إعلانات جديدة حاليًا</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.86rem' }}>تابع هذه الصفحة بانتظام للاطلاع على أي تحديثات فور نشرها.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="card"
              style={{
                padding: '24px 28px',
                border: '1px solid var(--color-border-light)',
                borderRight: '4px solid var(--color-gold)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'var(--color-gold-subtle)',
                    color: 'var(--color-gold-dark)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <Sparkles size={12} />
                  <span>إعلان عام للطلاب</span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  <Calendar size={14} />
                  <span>تاريخ النشر: {ann.publish_date}</span>
                </div>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {ann.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
