import { useState, useEffect } from 'react';
import Login, { type PendingFirstAccessUser } from './Login';
import AdminView from './AdminView';
import InspectorMobileApp from './InspectorMobileApp';
import ClientPortal from './ClientPortal';
import DevUserSelectScreen from './components/DevUserSelectScreen';
import { Terminal } from 'react-feather';
import { supabase } from './supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import {
  findSystemUserByEmail,
  updateUserPassword,
  syncFromServer,
  DEFAULT_INITIAL_PASSWORD,
  MASTER_DEV_EMAIL,
  MASTER_DEV_PASSWORD,
  type SystemUser
} from './stores/formulariosStore';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'gestor' | 'inspetor' | 'cliente' | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingFirstAccess, setPendingFirstAccess] = useState<PendingFirstAccessUser | null>(null);
  
  // Controle Exclusivo do Programador do Sistema (Matheus Stanley)
  const [isMasterDevLoggedIn, setIsMasterDevLoggedIn] = useState(false);
  const [showDevUserSelector, setShowDevUserSelector] = useState(false);

  useEffect(() => {
    // Parâmetro de URL para testes, pré-visualizações ou deep links
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'inspetor' || roleParam === 'gestor' || roleParam === 'cliente') {
      setUserRole(roleParam);
      setUserEmail(roleParam === 'inspetor' ? 'matheus.stanley12@gmail.com' : 'admin@dainspecoes.com.br');
      setIsAuthenticated(true);
      return;
    }

    // Restaura sessão persistida no dispositivo (APK / Navegador)
    try {
      const savedSessionRaw = localStorage.getItem('da_active_session');
      if (savedSessionRaw) {
        const saved = JSON.parse(savedSessionRaw);

        // Se for o Programador Matheus Stanley: abre diretamente a tela de seleção de usuários!
        if (saved?.isMasterDev || saved?.email === MASTER_DEV_EMAIL) {
          setIsMasterDevLoggedIn(true);
          setShowDevUserSelector(true);
          setIsAuthenticated(true);
          return;
        }

        if (saved?.email && saved?.role) {
          const user = findSystemUserByEmail(saved.email);
          if (user && user.status !== 'inativo') {
            setUserRole(saved.role);
            setUserEmail(user.email);
            setIsAuthenticated(true);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // Check if there is an active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || '';
        if (email.trim().toLowerCase() === MASTER_DEV_EMAIL) {
          setIsMasterDevLoggedIn(true);
          setShowDevUserSelector(true);
          setIsAuthenticated(true);
          return;
        }

        const localUser = findSystemUserByEmail(email);
        const metadataRole = session.user.user_metadata?.role || localUser?.role;
        const role: 'gestor' | 'inspetor' | 'cliente' =
          metadataRole === 'inspetor'
            ? 'inspetor'
            : metadataRole === 'cliente'
            ? 'cliente'
            : email.includes('inspetor')
            ? 'inspetor'
            : email.includes('cliente')
            ? 'cliente'
            : 'gestor';
        setUserRole(role);
        setUserEmail(email);
        setIsAuthenticated(true);
      }
    }).catch((err) => {
      console.warn('Supabase getSession network status:', err?.message || err);
    });
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setLoginError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      setLoginError('Por favor, preencha o usuário e a senha.');
      return;
    }

    // Acesso Exclusivo do Programador Master do Sistema (Matheus Stanley)
    // Mostra antes de acessar o APK a tela de seleção de qual usuário deseja visualizar
    if (cleanEmail === MASTER_DEV_EMAIL || cleanEmail === 'matheus.stanley12' || cleanEmail === 'matheus') {
      if (cleanPass === MASTER_DEV_PASSWORD) {
        setIsMasterDevLoggedIn(true);
        setShowDevUserSelector(true);
        setIsAuthenticated(true);
        setLoginError('');
        try {
          localStorage.setItem('da_active_session', JSON.stringify({ email: MASTER_DEV_EMAIL, isMasterDev: true }));
        } catch {}
        toast.success('Olá, Matheus! Selecione o usuário que deseja acessar no app.');
        return;
      } else {
        setLoginError('Senha incorreta. Verifique sua senha de desenvolvedor.');
        return;
      }
    }

    // 1. Sempre sincronizar primeiro com o servidor para garantir que se o usuário já trocou a senha
    // em outro computador/navegador (ou se o Gestor resetou a senha), este dispositivo receba o estado atualizado!
    await syncFromServer();

    let registeredUser = findSystemUserByEmail(cleanEmail);

    if (registeredUser) {
      if (registeredUser.status === 'inativo') {
        setLoginError('Este usuário está inativo. Entre em contato com o Gestor.');
        return;
      }

      const mappedRole: 'gestor' | 'inspetor' | 'cliente' =
        registeredUser.role === 'inspetor'
          ? 'inspetor'
          : registeredUser.role === 'cliente'
          ? 'cliente'
          : 'gestor';

      // Validação da senha cadastrada localmente/sincronizada
      const expectedPassword = registeredUser.mustChangePassword
        ? DEFAULT_INITIAL_PASSWORD
        : registeredUser.password;

      if (cleanPass !== expectedPassword) {
        // Caso o usuário tenha trocado a senha em outro computador em outra rede (via Supabase),
        // verificamos no Supabase se a nova senha pessoal digitada é válida!
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: registeredUser.email,
            password: cleanPass,
          });
          if (!error && data?.user && cleanPass !== DEFAULT_INITIAL_PASSWORD) {
            // Senha pessoal confirmada na nuvem! Atualiza localmente para nunca mais pedir troca de 1º acesso neste computador
            const syncedUser = updateUserPassword(registeredUser.email, cleanPass);
            setUserRole(mappedRole);
            setUserEmail(registeredUser.email);
            setIsAuthenticated(true);
            setLoginError('');
            try {
              localStorage.setItem('da_active_session', JSON.stringify({ email: registeredUser.email, role: mappedRole }));
            } catch {}
            toast.success(`Bem-vindo(a), ${syncedUser?.name || registeredUser.name}! Acesso liberado.`);
            return;
          }
        } catch {
          // ignore se offline
        }

        setLoginError(
          registeredUser.mustChangePassword
            ? `Senha incorreta. Para o primeiro acesso utilize a senha padrão fornecida pelo Gestor (${DEFAULT_INITIAL_PASSWORD}).`
            : 'Senha incorreta. Verifique sua senha e tente novamente.'
        );
        return;
      }

      // Se neste computador o registro ainda for o padrão inicial (updatedAt === 0 e mustChangePassword === true),
      // consultamos o Supabase para checar se o usuário já trocou a senha em outro computador
      if (registeredUser.mustChangePassword && (!registeredUser.updatedAt || registeredUser.updatedAt === 0)) {
        try {
          const { data } = await supabase.auth.signInWithPassword({
            email: registeredUser.email,
            password: cleanPass,
          });
          if (data?.user && data.user.user_metadata?.must_change_password === false) {
            // Usuário já havia concluído o 1º acesso em outro computador
            registeredUser = updateUserPassword(registeredUser.email, cleanPass) || registeredUser;
          }
        } catch {
          // ignore se offline
        }
      }

      // Se o usuário estiver com troca obrigatória no 1º acesso ativa (primeira vez real ou após reset do Gestor)
      if (registeredUser.mustChangePassword) {
        // Inicia sessão no Supabase em background (se existir) para permitir atualizar a senha na nuvem
        supabase.auth.signInWithPassword({
          email: registeredUser.email,
          password: DEFAULT_INITIAL_PASSWORD,
        }).catch(() => {});

        setPendingFirstAccess({
          email: registeredUser.email,
          name: registeredUser.name,
          role: mappedRole,
        });
        toast('Primeiro acesso! Crie sua nova senha pessoal para continuar.', { icon: '🔐' });
        return;
      }

      setUserRole(mappedRole);
      setUserEmail(registeredUser.email);
      setIsAuthenticated(true);
      setLoginError('');
      try {
        localStorage.setItem('da_active_session', JSON.stringify({ email: registeredUser.email, role: mappedRole }));
      } catch {}
      toast.success(`Bem-vindo(a), ${registeredUser.name}! Acesso liberado.`);
      return;
    }

    // 2. Caso o e-mail não esteja na base local, valida estritamente no Supabase (sem permitir qualquer senha!)
    setLoading(true);
    let authenticated = false;
    let determinedRole: 'gestor' | 'inspetor' | 'cliente' = 'gestor';
    let userName = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Usuário';
    let mustChangeFromSupabase = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (!error && data?.user) {
        const metadataRole = data.user.user_metadata?.role;
        userName = data.user.user_metadata?.name || userName;
        mustChangeFromSupabase = Boolean(data.user.user_metadata?.must_change_password);
        determinedRole = metadataRole === 'inspetor'
          ? 'inspetor'
          : metadataRole === 'cliente'
          ? 'cliente'
          : cleanEmail.includes('inspetor')
          ? 'inspetor'
          : cleanEmail.includes('cliente')
          ? 'cliente'
          : 'gestor';
        authenticated = true;
      }
    } catch (err: any) {
      console.warn('Supabase indisponível no momento:', err);
    }

    setLoading(false);

    if (authenticated) {
      if (cleanPass === DEFAULT_INITIAL_PASSWORD || mustChangeFromSupabase) {
        setPendingFirstAccess({
          email: cleanEmail,
          name: userName,
          role: determinedRole,
        });
        toast('Primeiro acesso com senha padrão (123456)! Crie sua nova senha agora.', { icon: '🔐' });
        return;
      }

      // Usuário já possui senha pessoal definida no Supabase: sincroniza para nunca mais pedir troca de 1º acesso em nenhum computador
      updateUserPassword(cleanEmail, cleanPass);

      setUserRole(determinedRole);
      setUserEmail(cleanEmail);
      setIsAuthenticated(true);
      setLoginError('');
      toast.success(`Bem-vindo ao D&A Inspeções! Acesso liberado.`);
    } else {
      setLoginError('Usuário não encontrado ou senha incorreta.');
    }
  };

  const handleDevSelectUser = (user: SystemUser) => {
    const mappedRole: 'gestor' | 'inspetor' | 'cliente' =
      user.role === 'inspetor' ? 'inspetor' : user.role === 'cliente' ? 'cliente' : 'gestor';
    setUserEmail(user.email);
    setUserRole(mappedRole);
    setShowDevUserSelector(false);
    toast.success(`Visualizando aplicativo como: ${user.name} (${mappedRole.toUpperCase()})`);
  };

  const handleConfirmNewPassword = async (newPass: string) => {
    if (!pendingFirstAccess) return;

    const targetEmail = pendingFirstAccess.email;
    const targetRole = pendingFirstAccess.role;
    const targetName = pendingFirstAccess.name;

    // Atualiza na store local e sincroniza com o servidor
    const updatedUser = updateUserPassword(targetEmail, newPass);

    // Tenta atualizar também no Supabase caso exista sessão ativa
    try {
      await supabase.auth.updateUser({
        password: newPass,
        data: { must_change_password: false },
      });
    } catch {
      // ignore se offline
    }

    setPendingFirstAccess(null);
    setUserRole(targetRole);
    setUserEmail(targetEmail);
    setIsAuthenticated(true);
    setLoginError('');
    try {
      localStorage.setItem('da_active_session', JSON.stringify({ email: targetEmail, role: targetRole }));
    } catch {
      // ignore
    }
    toast.success(`Senha alterada com sucesso! Bem-vindo(a), ${updatedUser?.name || targetName}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsMasterDevLoggedIn(false);
    setShowDevUserSelector(false);
    setUserRole(null);
    setUserEmail('');
    setLoginError('');
    setPendingFirstAccess(null);

    try {
      localStorage.removeItem('da_active_session');
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
        showDevUserSelector && isMasterDevLoggedIn ? (
          /* TELA EXCLUSIVA DO PROGRAMADOR: SELEÇÃO DE QUAL USUÁRIO ACESSAR + BOTÃO SAIR */
          <DevUserSelectScreen
            onSelectUser={handleDevSelectUser}
            onLogout={handleLogout}
          />
        ) : (
          <>
            {userRole === 'inspetor' ? (
              <InspectorMobileApp onLogout={handleLogout} userEmail={userEmail} />
            ) : userRole === 'cliente' ? (
              <ClientPortal onLogout={handleLogout} userEmail={userEmail} />
            ) : (
              <AdminView onLogout={handleLogout} />
            )}

            {/* Botão Flutuante Exclusivo do Programador para voltar ao seletor de usuários a qualquer momento */}
            {isMasterDevLoggedIn && (
              <div className="fixed bottom-3 right-3 z-50">
                <button
                  type="button"
                  onClick={() => setShowDevUserSelector(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0c1b30]/95 hover:bg-[#132742] text-amber-300 border border-amber-400/50 rounded-full shadow-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
                  title="Trocar Usuário (Exclusivo Programador)"
                >
                  <Terminal size={14} className="text-amber-400" />
                  <span>Trocar Usuário</span>
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <Login
          onLogin={handleLogin}
          error={loginError}
          onSelectRole={handleSelectRole}
          pendingFirstAccess={pendingFirstAccess}
          onConfirmNewPassword={handleConfirmNewPassword}
          onCancelFirstAccess={() => setPendingFirstAccess(null)}
        />
      )}
    </>
  );
}

export default App;
