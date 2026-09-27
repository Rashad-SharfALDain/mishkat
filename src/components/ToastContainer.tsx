import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 400,
        width: 'calc(100% - 48px)',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isSuccess ? '#064e3b' : isError ? '#7f1d1d' : '#0f172a',
              color: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
              border: `1px solid ${isSuccess ? '#059669' : isError ? '#dc2626' : '#334155'}`,
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isSuccess && <CheckCircle2 size={20} color="#34d399" />}
              {isError && <AlertCircle size={20} color="#f87171" />}
              {!isSuccess && !isError && <Info size={20} color="#60a5fa" />}
              <span style={{ fontSize: '0.94rem', fontWeight: 500, lineHeight: 1.5 }}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                color: 'rgba(255,255,255,0.7)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="إغلاق التنبيه"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
