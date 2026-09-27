import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { verifyParentSession, logoutParent, loginParent } from '../services/parentApi';

interface ParentAuthContextType {
  parentUser: AdminUser | null;
  parentData: any | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<any>;
  logout: () => void;
  refreshParentSession: () => Promise<void>;
}

const ParentAuthContext = createContext<ParentAuthContextType>({
  parentUser: null,
  parentData: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshParentSession: async () => {},
});

export const ParentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parentUser, setParentUser] = useState<AdminUser | null>(null);
  const [parentData, setParentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshParentSession = async () => {
    try {
      const session = await verifyParentSession();
      if (session) {
        setParentUser(session.user);
        setParentData(session.parent);
      } else {
        setParentUser(null);
        setParentData(null);
      }
    } catch {
      setParentUser(null);
      setParentData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshParentSession();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await loginParent(identifier, pass);
    setParentUser(res.user);
    setParentData(res.parent);
    return res;
  };

  const logout = () => {
    logoutParent();
    setParentUser(null);
    setParentData(null);
  };

  return (
    <ParentAuthContext.Provider
      value={{
        parentUser,
        parentData,
        loading,
        login,
        logout,
        refreshParentSession,
      }}
    >
      {children}
    </ParentAuthContext.Provider>
  );
};

export const useParentAuth = () => useContext(ParentAuthContext);
