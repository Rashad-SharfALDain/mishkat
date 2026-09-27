import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { StudentAuthProvider } from './context/StudentAuthContext';
import { ParentAuthProvider } from './context/ParentAuthContext';
import { AppProvider } from './context/AppContext';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <StudentAuthProvider>
        <ParentAuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </ParentAuthProvider>
      </StudentAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);
