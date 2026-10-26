import { useState } from 'react';
import { Moon, Sun, Mail, Lock, LogIn, Eye, EyeOff, Shield, Key, CheckCircle } from 'react-feather';
import logoUrl from './assets/logo.jpg';

export interface PendingFirstAccessUser {
  email: string;
  name: string;
  role: 'gestor' | 'inspetor' | 'cliente';
}

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  error: string;
  onSelectRole?: (role: 'gestor' | 'inspetor' | 'cliente') => void;
  isMobileApp?: boolean;
  pendingFirstAccess?: PendingFirstAccessUser | null;
  onConfirmNewPassword?: (newPassword: string) => void;
  onCancelFirstAccess?: () => void;
}

const Login = ({
  onLogin,
  error,
  pendingFirstAccess = null,
  onConfirmNewPassword,
  onCancelFirstAccess,
}: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });

  // Estados para Troca de Senha no 1º Acesso (após entrar com a senha padrão 123456 cadastrada pelo Gestor)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmNewPassword.trim();

    if (cleanNew.length < 4) {
      setPasswordChangeError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (cleanNew === '123456') {
      setPasswordChangeError('Escolha uma senha diferente da senha padrão inicial (123456).');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPasswordChangeError('A confirmação não confere com a nova senha.');
      return;
    }

    onConfirmNewPassword?.(cleanNew);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-gradient-to-br from-[#06101e] via-[#0a192f] to-[#040b15] p-4 select-none overflow-y-auto">
      {/* Iluminação suave de fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cartão de Login D&A Inspeções (Simples, Nítido e Limpo - Sem Anúncios) */}
      <div className="w-full max-w-[420px] bg-[#0c1b30] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#172d4d] p-7 sm:p-8 relative z-10 backdrop-blur-md transition-all my-auto">
        
        {/* Alternador de Modo Escuro / Claro */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10 cursor-pointer"
          title="Alternar Tema"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logomarca D&A Inspeções com Cartão Branco Nítido */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 bg-white rounded-2xl p-2.5 shadow-lg border border-slate-200 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="D&A Inspeções"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold text-white mt-4 text-center tracking-tight">
            Portal de Acesso
          </h2>
          <p className="text-xs text-slate-400 text-center mt-1">
            Insira suas credenciais para acessar o aplicativo
          </p>
        </div>

        {/* 1. MODO: TROCA DE SENHA OBRIGATÓRIA NO PRIMEIRO ACESSO */}
        {pendingFirstAccess ? (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full mb-2">
                <Key size={12} /> 1º Acesso • Nova Senha Pessoal
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                Olá, {pendingFirstAccess.name}!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Por segurança, defina sua nova senha pessoal para substituir a senha padrão (123456).
              </p>
            </div>

            {passwordChangeError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl text-center font-medium">
                {passwordChangeError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nova Senha Pessoal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={15} className="text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-3 bg-[#13233c] border border-[#1e3558] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Mínimo de 4 dígitos"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <CheckCircle size={15} className="text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#13233c] border border-[#1e3558] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Repita sua nova senha"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={16} />
                  <span>Salvar Nova Senha e Entrar</span>
                </button>
                <button
                  type="button"
                  onClick={onCancelFirstAccess}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 2. MODO: LOGIN NORMAL (E-mail e Senha) */
          <>
            {/* Mensagem de Erro */}
            {error && (
              <div className="mb-4 p-3 bg-[#2d1217] border border-[#6b1e28] text-[#ff808b] text-xs rounded-xl text-center font-medium leading-relaxed">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onLogin(email, password);
              }}
              className="space-y-4"
            >
              {/* Campo Usuário / E-mail */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  USUÁRIO OU E-MAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-3 bg-[#13233c] border border-[#1e3558] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="seu.email@exemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SENHA
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Para redefinir sua senha, entre em contato com o Gestor do sistema.');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-3 bg-[#13233c] border border-[#1e3558] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={17} />
                  <span>Entrar no Aplicativo</span>
                </button>
              </div>
            </form>
          </>
        )}

        {/* Rodapé de Segurança e Autenticidade D&A */}
        <div className="mt-7 pt-4 border-t border-[#172d4d] flex items-center justify-center text-[11px] text-slate-400 gap-1.5">
          <Shield size={14} className="text-emerald-400" />
          <span>Ambiente Seguro • D&A Inspeções</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
