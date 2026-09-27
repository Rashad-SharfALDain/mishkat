import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { verifyStudentSession, logoutStudent, loginStudent } from '../services/studentApi';

interface StudentAuthContextType {
  studentUser: AdminUser | null;
  studentData: any | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<any>;
  logout: () => void;
  refreshStudentSession: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType>({
  studentUser: null,
  studentData: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshStudentSession: async () => {},
});

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentUser, setStudentUser] = useState<AdminUser | null>(null);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStudentSession = async () => {
    try {
      const session = await verifyStudentSession();
      if (session) {
        setStudentUser(session.user);
        setStudentData(session.student);
      } else {
        setStudentUser(null);
        setStudentData(null);
      }
    } catch {
      setStudentUser(null);
      setStudentData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStudentSession();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await loginStudent(identifier, pass);
    setStudentUser(res.user);
    setStudentData(res.student);
    return res;
  };

  const logout = () => {
    logoutStudent();
    setStudentUser(null);
    setStudentData(null);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        studentUser,
        studentData,
        loading,
        login,
        logout,
        refreshStudentSession,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => useContext(StudentAuthContext);
