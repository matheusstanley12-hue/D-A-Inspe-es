import { useState } from 'react';
import { Moon, Sun, Mail, Lock, LogIn, Eye, EyeOff, Shield } from 'react-feather';
import logoUrl from './assets/logo.jpg';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  error: string;
  onSelectRole?: (role: 'gestor' | 'inspetor' | 'cliente') => void;
}

const Login = ({ onLogin, error }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-300">
      {/* Elementos suaves de iluminação de fundo (sem quadriculado) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cartão de Login Unificado */}
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-9 relative z-10 backdrop-blur-sm transition-all">
        
        {/* Alternador de Modo Escuro */}
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/60 dark:border-slate-700/60"
          title="Alternar Modo Escuro"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Logomarca */}
        <div className="flex flex-col items-center mb-6">
          <img src={logoUrl} alt="D&A Inspeções" className="h-20 sm:h-24 object-contain rounded-lg" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-3 text-center">
            Portal de Acesso
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">
            Insira suas credenciais para acessar o sistema
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulário Único */}
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Senha
              </label>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Por favor, entre em contato com o administrador do sistema para redefinir sua senha.'); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-11 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botão de Entrar */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer mt-2"
          >
            <LogIn size={16} className="mr-2" />
            Entrar no Sistema
          </button>
        </form>

        {/* Rodapé de Segurança e Autenticidade */}
        <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500 gap-1.5">
          <Shield size={14} className="text-emerald-500" />
          <span>Ambiente Seguro • D&A Inspeções</span>
        </div>
      </div>
    </div>
  );
};

export default Login;

