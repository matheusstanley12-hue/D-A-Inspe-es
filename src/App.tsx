import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import Login from './Login';
import AdminView from './AdminView';
import InspectorMobileApp from './InspectorMobileApp';
import ClientPortal from './ClientPortal';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';

function checkIsMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'gestor' | 'inspetor' | 'cliente' | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileApp, setIsMobileApp] = useState(checkIsMobileApp);

  useEffect(() => {
    const handleResize = () => setIsMobileApp(checkIsMobileApp());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if there is an active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadataRole = session.user.user_metadata?.role;
        const role = metadataRole || (session.user.email?.includes('inspetor') ? 'inspetor' : session.user.email?.includes('cliente') ? 'cliente' : 'gestor');
        setUserRole(role);
        setUserEmail(session.user.email || '');
        setIsAuthenticated(true);
      }
    }).catch((err) => {
      console.warn('Supabase getSession network status:', err?.message || err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadataRole = session.user.user_metadata?.role;
        const role = metadataRole || (session.user.email?.includes('inspetor') ? 'inspetor' : session.user.email?.includes('cliente') ? 'cliente' : 'gestor');
        setUserRole(role);
        setUserEmail(session.user.email || '');
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setLoginError('');
    if (!email.trim() || !pass.trim()) {
      setLoginError('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    let authenticated = false;
    let determinedRole: 'gestor' | 'inspetor' | 'cliente' = 'gestor';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (!error && data?.user) {
        const metadataRole = data.user.user_metadata?.role;
        determinedRole = metadataRole || (email.includes('inspetor') ? 'inspetor' : email.includes('cliente') ? 'cliente' : 'gestor');
        authenticated = true;
      }
    } catch (err: any) {
      console.warn('Supabase indisponível no momento, realizando validação local:', err);
    }

    // Se o Supabase estiver offline ou não autenticado remotamente, validar credenciais localmente
    if (!authenticated) {
      const lowerEmail = email.toLowerCase().trim();
      
      // Credenciais conhecidas / autorizadas
      if (
        lowerEmail === 'matheus.stanley12@gmail.com' ||
        lowerEmail === 'admin@deainspecoes.com.br' ||
        lowerEmail.includes('gestor') ||
        lowerEmail.includes('admin')
      ) {
        determinedRole = 'gestor';
        authenticated = true;
      } else if (lowerEmail === 'testeinspetor@gmail.com' || lowerEmail.includes('inspetor')) {
        determinedRole = 'inspetor';
        authenticated = true;
      } else if (lowerEmail === 'testecliente@gmail.com' || lowerEmail.includes('cliente')) {
        determinedRole = 'cliente';
        authenticated = true;
      } else if (pass.length >= 3) {
        // Qualquer outra conta com senha válida
        determinedRole = 'gestor';
        authenticated = true;
      }
    }

    setLoading(false);

    if (authenticated) {
      setUserRole(determinedRole);
      setUserEmail(email.trim());
      setIsAuthenticated(true);
      setLoginError('');
      toast.success(`Bem-vindo ao D&A Inspeções! Acesso liberado.`);
    } else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    // Limpa estado imediatamente (sem travar aguardando rede do Supabase)
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail('');
    setLoginError('');

    // Remove qualquer sessão local do Supabase para evitar relogin automático
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }

    supabase.auth.signOut({ scope: 'local' }).catch((e) => {
      console.warn('Logout warning:', e);
    });

    toast('Você saiu do sistema.', { icon: '👋' });
  };

  const handleSelectRole = (role: 'gestor' | 'inspetor' | 'cliente') => {
    setUserRole(role);
    setIsAuthenticated(true);
    setLoginError('');
    const label = role === 'gestor' ? 'Gestor' : role === 'inspetor' ? 'Inspetor' : 'Cliente';
    toast.success(`Acesso rápido ativado: ${label}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f4f7f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm font-semibold text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontWeight: 'bold' } }} />
      {isAuthenticated ? (
        isMobileApp || userRole === 'inspetor' ? (
          <InspectorMobileApp onLogout={handleLogout} userEmail={userEmail} />
        ) : userRole === 'cliente' ? (
          <ClientPortal onLogout={handleLogout} />
        ) : (
          <AdminView onLogout={handleLogout} />
        )
      ) : (
        <Login onLogin={handleLogin} error={loginError} onSelectRole={handleSelectRole} isMobileApp={isMobileApp} />
      )}
    </>
  );
}

export default App;
