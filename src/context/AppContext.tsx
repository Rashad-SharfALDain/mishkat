import React, { createContext, useContext, useState, useEffect } from 'react';
import { InstitutionSettings } from '../types';
import { fetchSettings } from '../services/api';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  settings: InstitutionSettings | null;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType>({
  settings: null,
  loadingSettings: true,
  refreshSettings: async () => {},
  showToast: () => {},
  addToast: () => {},
  toasts: [],
  removeToast: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const load = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        loadingSettings,
        refreshSettings: load,
        showToast,
        addToast: showToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
