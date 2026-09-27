import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, AlertTriangle, CheckCircle, FileText, Sparkles, X } from 'lucide-react';
import { InAppNotification } from '../../types';

interface NotificationsPopoverProps {
  fetchNotifs: () => Promise<{ unread_count: number; notifications: any[] }>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  buttonStyle?: React.CSSProperties;
  badgeColor?: string;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  fetchNotifs,
  markRead,
  markAllRead,
  buttonStyle,
  badgeColor = '#ef4444',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchNotifs();
      setUnreadCount(res.unread_count || 0);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll notifications every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadData();
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = async (notif: InAppNotification) => {
    if (notif.is_read === 0) {
      try {
        await markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'absence':
        return <Clock size={18} color="#ea580c" />;
      case 'late':
        return <Clock size={18} color="#d97706" />;
      case 'excuse_status':
        return <CheckCircle size={18} color="#16a34a" />;
      case 'evaluation':
        return <Sparkles size={18} color="#ca8a04" />;
      default:
        return <FileText size={18} color="#0d9488" />;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="صندوق الإشعارات"
        style={{
          position: 'relative',
          padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-fast)',
          ...buttonStyle,
        }}
        title="الإشعارات الداخلية"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: badgeColor,
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid #ffffff',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--color-border)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '500px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          dir="rtl"
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} color="var(--color-primary-dark)" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                الإشعارات الداخلية
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {unreadCount} جديد
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--color-gold-dark)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 6px',
                  }}
                  title="تحديد كافة الإشعارات كمقروءة"
                >
                  <CheckCheck size={14} />
                  <span>تحديد الكل</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body list */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '400px',
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                جاري تحميل الإشعارات...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <CheckCircle size={36} color="var(--color-gold)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-main)' }}>
                  لا توجد إشعارات حاليًا
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  أنت على اطلاع دائم بجميع المستجدات والأنشطة!
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border-light)',
                      backgroundColor: notif.is_read === 0 ? 'rgba(198, 146, 20, 0.06)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        notif.is_read === 0 ? 'rgba(198, 146, 20, 0.06)' : '#ffffff';
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: notif.is_read === 0 ? '#ffffff' : 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid var(--color-border-light)',
                        marginTop: 2,
                      }}
                    >
                      {getNotifIcon(notif.notification_type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: notif.is_read === 0 ? 800 : 700,
                            fontSize: '0.88rem',
                            color: notif.is_read === 0 ? 'var(--color-primary-dark)' : 'var(--color-text-main)',
                            lineHeight: 1.3,
                          }}
                        >
                          {notif.title}
                        </span>
                        {notif.is_read === 0 && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-gold)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      <p
                        style={{
                          margin: '0 0 6px',
                          fontSize: '0.82rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.45,
                        }}
                      >
                        {notif.message}
                      </p>

                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        {formatTime(notif.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
