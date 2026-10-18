import { useState } from 'react';
import { Moon, Sun, Mail, Lock, LogIn, Eye, EyeOff, UserCheck } from 'react-feather';
import logoUrl from './assets/logo.jpg';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  error: string;
  onSelectRole?: (role: 'gestor' | 'inspetor' | 'cliente') => void;
}

const Login = ({ onLogin, error, onSelectRole }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative bg-[#f4f7f9] p-4"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Subtle radial gradient to match the background glow in the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-blue-100/60 pointer-events-none"></div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 w-full max-w-[420px] relative z-10 border border-gray-100">
        
        {/* Dark Mode Toggle */}
        <button 
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-100"
          title="Alternar Modo Escuro"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6 mt-2">
          <img src={logoUrl} alt="D&A Inspeções Logo" className="h-24 object-contain" />
        </div>



        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-md text-sm bg-[#f8fafc] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Digite seu e-mail"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-md text-sm bg-[#f8fafc] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-2"
          >
            <LogIn size={16} className="mr-2" />
            Entrar
          </button>
        </form>

        {/* Esqueci a senha */}
        <div className="mt-4 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Por favor, entre em contato com o suporte D&A Inspeções.'); }} className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
            Esqueci minha senha
          </a>
        </div>

        {/* Demonstração / Acesso Rápido */}
        {onSelectRole && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center">
              <UserCheck size={13} className="mr-1 text-blue-600" /> Acesso Rápido de Teste
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('matheus.stanley12@gmail.com');
                  setPassword('35215415');
                  onSelectRole('gestor');
                }}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors text-center shadow-xs"
              >
                Gestor
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('testeinspetor@gmail.com');
                  setPassword('123456');
                  onSelectRole('inspetor');
                }}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-center shadow-xs"
              >
                Inspetor
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('testecliente@gmail.com');
                  setPassword('123456');
                  onSelectRole('cliente');
                }}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors text-center shadow-xs"
              >
                Cliente
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              Insira seu e-mail e senha acima ou clique em um dos perfis para testar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

