import { useState } from 'react';
import { Moon, Sun, Mail, Lock, LogIn, Eye, EyeOff, Shield, User, ArrowRight, Key, CheckCircle } from 'react-feather';
import logoUrl from './assets/logo.jpg';
import logoTightUrl from './assets/logo-tight.png';
import profluxBgUrl from './assets/proflux-bg.png';

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
  isMobileApp = false,
  pendingFirstAccess = null,
  onConfirmNewPassword,
  onCancelFirstAccess,
}: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Estados para Troca de Senha no 1º Acesso (quando entra com a senha padrão 123456)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmNewPassword.trim();

    if (cleanNew.length < 4) {
      setPasswordChangeError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (cleanNew === '123456') {
      setPasswordChangeError('Escolha uma senha diferente da senha padrão inicial (123456).');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPasswordChangeError('A confirmação de senha não confere.');
      return;
    }

    onConfirmNewPassword?.(cleanNew);
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  // Tela de Login exclusiva para o App Mobile (APK / celular)
  if (isMobileApp) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-300">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-9 relative z-10 backdrop-blur-sm transition-all">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/60 dark:border-slate-700/60"
            title="Alternar Modo Escuro"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="flex flex-col items-center mb-6">
            <img src={logoUrl} alt="D&A Inspeções" className="h-20 sm:h-24 object-contain rounded-lg" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-3 text-center">
              {pendingFirstAccess ? 'Primeiro Acesso • Nova Senha' : 'Portal de Acesso'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">
              {pendingFirstAccess
                ? `Olá, ${pendingFirstAccess.name}! Altere sua senha padrão (123456) para continuar.`
                : 'Insira suas credenciais para acessar o aplicativo'}
            </p>
          </div>

          {pendingFirstAccess ? (
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-xl">
                <p className="font-bold flex items-center gap-1.5">
                  <Key size={14} className="text-blue-600 shrink-0" />
                  Troca de Senha no 1º Acesso
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  Você entrou com a senha padrão <strong>123456</strong>. Defina agora sua senha pessoal de acesso.
                </p>
              </div>

              {passwordChangeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                  {passwordChangeError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nova Senha Pessoal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="Digite sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <CheckCircle size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="Repita sua nova senha"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer mt-2"
              >
                <CheckCircle size={16} className="mr-2" />
                Salvar Nova Senha e Entrar
              </button>

              <button
                type="button"
                onClick={onCancelFirstAccess}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 text-center cursor-pointer"
              >
                Voltar para o Login
              </button>
            </form>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Senha
                    </label>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert('No primeiro acesso utilize a senha padrão 123456. Caso precise redefinir, peça ao Gestor na tela Gestão de Usuários.'); }}
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-11 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      placeholder="Digite sua senha (1º acesso: 123456)"
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

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer mt-2"
                >
                  <LogIn size={16} className="mr-2" />
                  Entrar no Aplicativo
                </button>
              </form>
            </>
          )}

          <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-500 gap-1.5">
            <Shield size={14} className="text-emerald-500" />
            <span>Ambiente Seguro • D&A Inspeções</span>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Login do Sistema Web — Enquadrada 100% na tela e com Vetores/Textos Nítidos
  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center relative bg-gradient-to-br from-[#e6eef8] via-[#f6f9fc] to-[#dde7f4] px-6 py-6 select-none">
      {/* Iluminação suave de fundo */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[550px] h-[220px] bg-amber-100/45 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-[420px] h-[420px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-[420px] h-[420px] bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Cartão Principal Enquadrado na Tela (estilo GeoMan / PROFLUX) */}
      <div className="w-full max-w-[920px] h-[535px] max-h-[86vh] bg-[#03132b] rounded-[22px] p-2.5 shadow-[0_24px_60px_-12px_rgba(3,19,43,0.45)] border border-[#0e2a52] flex flex-row items-stretch relative z-10 overflow-hidden">
        
        {/* Painel Esquerdo: PROFLUX Tecnologia (100% Vetorial + Nítido sobre Fundo Industrial) */}
        <div className="w-[46%] h-full relative bg-[#03132b] rounded-l-[14px] overflow-hidden flex flex-col justify-between px-7 py-6 text-white">
          {/* Imagem de Fundo Industrial Noturna Limpa */}
          <img
            src={profluxBgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
          />

          {/* Conteúdo Vetorial Nítido sobre o Fundo */}
          <div className="relative z-10">
            {/* Logo PROFLUX TECNOLOGIA em Vetor (SVG Alta Definição) */}
            <div className="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 115 95" className="h-14 w-auto shrink-0 drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]">
                <defs>
                  <linearGradient id="pfSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#d8e1eb" />
                    <stop offset="75%" stopColor="#93a3b5" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <linearGradient id="pfWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0066db" />
                    <stop offset="100%" stopColor="#38a8ff" />
                  </linearGradient>
                  <linearGradient id="pfWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0088ff" />
                    <stop offset="100%" stopColor="#5cc0ff" />
                  </linearGradient>
                </defs>
                {/* Parte superior do P */}
                <path
                  d="M36 8 H78 C98 8 109 19 109 36 C109 53 96 64 76 64 H54 L42 88 H21 L36 56 H52 L57 48 H74 C84 48 90 43 90 36 C90 29 84 24 74 24 H49 L44 35 H25 L36 8 Z"
                  fill="url(#pfSilver)"
                />
                {/* Duas ondas azuis cortando o P */}
                <path
                  d="M4 44 C22 50 38 30 62 32 C74 33 82 38 86 42 C76 39 65 38 52 42 C34 48 20 56 4 44 Z"
                  fill="url(#pfWave1)"
                />
                <path
                  d="M8 55 C26 60 42 40 66 41 C76 42 82 45 85 48 C75 46 64 46 50 52 C32 60 20 65 8 55 Z"
                  fill="url(#pfWave2)"
                />
              </svg>

              <div className="flex flex-col">
                <div className="text-[28px] font-black tracking-wider leading-none flex items-center">
                  <span className="text-white">PRO</span>
                  <span className="text-[#1d8cf8]">FLUX</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="h-[1.5px] flex-1 bg-white/75" />
                  <span className="text-[9.5px] font-bold tracking-[0.28em] text-white/90">
                    TECNOLOGIA
                  </span>
                  <span className="h-[1.5px] flex-1 bg-white/75" />
                </div>
              </div>
            </div>

            {/* Subtítulo Principal */}
            <p className="text-[15px] leading-snug text-white/95 font-normal mb-5">
              Sistema inteligente para
              <br />
              <span className="font-extrabold text-[#2997ff]">gestão</span> e{' '}
              <span className="font-extrabold text-[#2997ff]">inspeções.</span>
            </p>

            {/* 4 Itens de Funcionalidades com Ícones Vetoriais Nítidos */}
            <div className="space-y-3.5">
              {/* Item 1 */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#072146]/90 border border-[#1d4c8c]/70 flex items-center justify-center shrink-0 shadow-inner">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="13" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12.5px] font-bold text-white leading-tight">
                    Gestão de inspeções
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-tight mt-0.5">
                    Planejamento e execução
                    <br />
                    com mais eficiência.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#072146]/90 border border-[#1d4c8c]/70 flex items-center justify-center shrink-0 shadow-inner">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12.5px] font-bold text-white leading-tight">
                    Controle de ativos
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-tight mt-0.5">
                    Histórico, manutenções
                    <br />
                    e conformidade.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#072146]/90 border border-[#1d4c8c]/70 flex items-center justify-center shrink-0 shadow-inner">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="20" x2="20" y2="20" />
                    <rect x="6" y="13" width="2.5" height="7" rx="0.5" />
                    <rect x="10.75" y="9" width="2.5" height="11" rx="0.5" />
                    <rect x="15.5" y="5" width="2.5" height="15" rx="0.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12.5px] font-bold text-white leading-tight">
                    Indicadores em tempo real
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-tight mt-0.5">
                    Dados para decisões
                    <br />
                    mais assertivas.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#072146]/90 border border-[#1d4c8c]/70 flex items-center justify-center shrink-0 shadow-inner">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="3" width="6" height="5" rx="1" />
                    <rect x="4" y="15" width="6" height="5" rx="1" />
                    <rect x="14" y="15" width="6" height="5" rx="1" />
                    <path d="M12 8v4m-5 3v-3h10v3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12.5px] font-bold text-white leading-tight">
                    Acompanhamento
                    <br />
                    de processos
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-tight mt-0.5">
                    Mais controle e rastreabilidade
                    <br />
                    em todas as etapas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Esquerdo: Frase de Impacto */}
          <div className="relative z-10 pt-2">
            <div className="w-8 h-[2px] bg-[#2997ff] mb-2" />
            <p className="text-[13.5px] text-white font-normal tracking-tight">
              Tecnologia que <span className="font-extrabold text-[#2997ff]">impulsiona resultados.</span>
            </p>
          </div>
        </div>

        {/* Painel Direito: Formulário de Acesso D&A Inspeções */}
        <div className="w-[54%] h-full bg-white rounded-[16px] px-10 py-6 flex flex-col justify-between shadow-xl overflow-y-auto">
          <div>
            {/* Logo D&A Inspeções Centralizada e Maior */}
            <div className="flex justify-center mb-3">
              <img
                src={logoTightUrl}
                alt="D&A Inspeções"
                className="h-18 sm:h-22 object-contain"
              />
            </div>

            {pendingFirstAccess ? (
              <div className="animate-[fadeIn_0.2s_ease-out]">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full mb-1">
                    <Key size={11} /> 1º Acesso • Troca de Senha Obrigatória
                  </span>
                  <h1 className="text-[22px] font-extrabold text-[#0b192c] tracking-tight leading-tight">
                    Olá, {pendingFirstAccess.name}!
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Você entrou com a senha padrão <strong>123456</strong>. Defina agora sua senha pessoal.
                  </p>
                </div>

                {passwordChangeError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                    {passwordChangeError}
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
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
                        className="block w-full pl-10 pr-11 py-2.5 bg-[#eef3f9] border border-[#d5e0ee] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c3266]/20 focus:border-[#0c3266] focus:bg-white transition-all"
                        placeholder="Digite sua nova senha"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
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
                        className="block w-full pl-10 pr-4 py-2.5 bg-[#eef3f9] border border-[#d5e0ee] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c3266]/20 focus:border-[#0c3266] focus:bg-white transition-all"
                        placeholder="Confirme sua nova senha"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col gap-1.5">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle size={16} />
                      <span>Salvar Nova Senha e Acessar</span>
                    </button>
                    <button
                      type="button"
                      onClick={onCancelFirstAccess}
                      className="w-full py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Saudação */}
                <div className="mb-4">
                  <h1 className="text-[28px] font-extrabold text-[#0b192c] tracking-tight leading-tight">
                    Bem-vindo de volta!
                  </h1>
                </div>

                {/* Mensagem de Erro */}
                {error && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                {/* Formulário */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onLogin(email, password);
                  }}
                  className="space-y-3.5"
                >
                  {/* Campo Usuário */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Usuário
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User size={15} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-[#eef3f9] border border-[#d5e0ee] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c3266]/20 focus:border-[#0c3266] focus:bg-white transition-all"
                        placeholder="matheusmoura"
                        required
                      />
                    </div>
                  </div>

                  {/* Campo Senha */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={15} className="text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-11 py-2.5 bg-[#eef3f9] border border-[#d5e0ee] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c3266]/20 focus:border-[#0c3266] focus:bg-white transition-all"
                        placeholder="•••••••••• (1º acesso: 123456)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Lembrar-me & Esqueci minha senha */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#1a66cc] accent-[#1a66cc] focus:ring-[#1a66cc]"
                      />
                      <span className="text-xs text-slate-600">Lembrar-me</span>
                    </label>

                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('No 1º acesso utilize a senha padrão 123456. Caso precise redefinir, solicite ao Gestor em Gestão de Usuários.');
                      }}
                      className="text-xs font-semibold text-[#185adb] hover:text-[#0d3b94] hover:underline"
                    >
                      Esqueci minha senha
                    </a>
                  </div>

                  {/* Botão Entrar */}
                  <div className="pt-1.5">
                    <button
                      type="submit"
                      className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0e3975] via-[#092752] to-[#051633] hover:from-[#13468f] hover:via-[#0c3268] hover:to-[#071f45] active:scale-[0.99] shadow-lg shadow-[#092752]/30 transition-all flex items-center justify-center relative cursor-pointer"
                    >
                      <span>Entrar</span>
                      <ArrowRight size={17} className="absolute right-5 text-white/90" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Rodapé com Direitos Autorais e Link Clicável */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              © 2026 PROFLUX Tecnologia. Todos os direitos reservados.
            </p>
            <a
              href="https://www.profluxtecnologia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#144b96] hover:text-[#0a2958] hover:underline mt-0.5 inline-block transition-colors cursor-pointer"
            >
              www.profluxtecnologia.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
