import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types';
import { fetchParentAnnouncements } from '../../services/parentApi';
import { Bell, Calendar, Sparkles } from 'lucide-react';

export const ParentAnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchParentAnnouncements()
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error('Error fetching announcements:', err))
      .finally(() => setLoading(false));
  }, []);

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
            backgroundColor: 'rgba(198, 146, 20, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={24} color="var(--color-gold-dark)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
            إعلانات وتعاميم أولياء الأمور
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            الرسائل والتعاميم المعتمدة الصادرة من إدارة المؤسسة واللجان التربوية.
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          جارٍ تحميل الإعلانات...
        </div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>لا توجد إعلانات منشورة لأولياء الأمور حاليًا.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid var(--color-border)',
                borderRight: '4px solid var(--color-gold)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  {ann.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Calendar size={13} />
                  {ann.publish_date}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
