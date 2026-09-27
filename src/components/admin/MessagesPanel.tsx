import React, { useState, useEffect } from 'react';
import { ContactMessage } from '../../types';
import { fetchAdminMessages, updateMessageStatus } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Mail, Check, MessageSquare, Phone, Calendar, RefreshCw } from 'lucide-react';

export const MessagesPanel: React.FC = () => {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminMessages();
      setMessages(data);
    } catch (err: any) {
      showToast(err.message || 'فشل جلب الرسائل', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateMessageStatus(id, newStatus);
      showToast('تم تحديث حالة الرسالة', 'success');
      loadMessages();
    } catch (err: any) {
      showToast('تعذر تحديث الحالة', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            رسائل التواصل والاستفسارات الواردة
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            الرسائل الواردة من نموذج "تواصل معنا" على الموقع.
          </p>
        </div>
        <button onClick={loadMessages} className="btn btn-outline btn-sm">
          <RefreshCw size={15} />
          <span>تحديث</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          جاري تحميل الرسائل...
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <Mail size={36} color="var(--color-text-light)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
            لا توجد رسائل واردة حالياً
          </h4>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="card"
              style={{
                backgroundColor: '#ffffff',
                padding: 22,
                borderRadius: 'var(--radius-md)',
                borderRight: `4px solid ${msg.status === 'new' ? 'var(--status-new)' : 'var(--color-border-medium)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className={`badge ${msg.status === 'new' ? 'badge-new' : 'badge-completed'}`}
                  >
                    {msg.status === 'new' ? 'جديدة' : 'تم الاطلاع'}
                  </span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    {msg.subject}
                  </h4>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
                  {new Date(msg.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                <div><strong>المرسل:</strong> {msg.name}</div>
                <div><strong>الهاتف:</strong> <span dir="ltr">{msg.phone}</span></div>
                {msg.email && <div><strong>البريد:</strong> {msg.email}</div>}
              </div>

              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-main)', lineHeight: 1.7, backgroundColor: 'var(--color-bg-subtle)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                {msg.message}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                {msg.status === 'new' ? (
                  <button
                    onClick={() => handleStatusChange(msg.id, 'read')}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <Check size={14} />
                    <span>تحديد كمقروءة</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(msg.id, 'new')}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.82rem' }}
                  >
                    تحديد كجديدة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
