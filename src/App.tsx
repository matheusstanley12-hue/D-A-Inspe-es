import React, { useState } from 'react';
import Login from './Login';
import AdminView from './AdminView';
import InspectorMobileApp from './InspectorMobileApp';
import ClientPortal from './ClientPortal';
import { Toaster } from 'react-hot-toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth') === 'true';
  });
  const [userRole, setUserRole] = useState<'gestor' | 'inspetor' | 'cliente' | null>(() => {
    return localStorage.getItem('role') as any || null;
  });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (email: string, pass: string) => {
    // 1. Gestor
    if (email === 'matheus.stanley12@gmail.com' && pass === '35215415Ab@') {
      setIsAuthenticated(true);
      setUserRole('gestor');
      localStorage.setItem('auth', 'true');
      localStorage.setItem('role', 'gestor');
      setLoginError('');
    } 
    // 2. Inspetor
    else if (email === 'testeinspetor@gmail.com' && pass === '123456') {
      setIsAuthenticated(true);
      setUserRole('inspetor');
      localStorage.setItem('auth', 'true');
      localStorage.setItem('role', 'inspetor');
      setLoginError('');
    }
    // 3. Cliente
    else if (email === 'testecliente@gmail.com' && pass === '35215415') {
      setIsAuthenticated(true);
      setUserRole('cliente');
      localStorage.setItem('auth', 'true');
      localStorage.setItem('role', 'cliente');
      setLoginError('');
    }
    else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontWeight: 'bold' } }} />
      {isAuthenticated && userRole === 'gestor' ? (
        <AdminView onLogout={handleLogout} />
      ) : isAuthenticated && userRole === 'inspetor' ? (
        <InspectorMobileApp onLogout={handleLogout} />
      ) : isAuthenticated && userRole === 'cliente' ? (
        <ClientPortal onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} error={loginError} />
      )}
    </>
  );
}

export default App;
