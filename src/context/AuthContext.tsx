import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { verifyAdminSession, logoutAdmin } from '../services/api';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAdminSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const logout = () => {
    logoutAdmin();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
