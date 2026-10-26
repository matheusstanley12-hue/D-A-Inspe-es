import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Users, LogOut, ChevronRight, Terminal, Shield } from 'react-feather';
import logoUrl from '../assets/logo.jpg';
import { getSystemUsers, type SystemUser, MASTER_DEV_EMAIL, USERS_CHANGE_EVENT } from '../stores/formulariosStore';

interface DevUserSelectScreenProps {
  onSelectUser: (user: SystemUser) => void;
  onLogout: () => void;
}

export default function DevUserSelectScreen({ onSelectUser, onLogout }: DevUserSelectScreenProps) {
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers());

  useEffect(() => {
    const handleUpdate = () => setUsers(getSystemUsers());
    window.addEventListener(USERS_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(USERS_CHANGE_EVENT, handleUpdate);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-gradient-to-br from-[#06101e] via-[#0a192f] to-[#040b15] p-3 sm:p-5 select-none overflow-y-auto">
      {/* Iluminação suave de fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cartão Central do Programador */}
      <div className="w-full max-w-[520px] bg-[#0c1b30] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#172d4d] p-6 sm:p-7 relative z-10 backdrop-blur-md transition-all my-auto flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho de Identificação do Programador */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#172d4d]">
          <div className="w-16 h-16 bg-white rounded-2xl p-1.5 shadow-md border border-slate-200 shrink-0 flex items-center justify-center">
            <img src={logoUrl} alt="D&A Inspeções" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                <Terminal size={11} /> Programador Master
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight truncate">
              Matheus Stanley
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {MASTER_DEV_EMAIL}
            </p>
          </div>
        </div>

        {/* Instrução */}
        <div className="py-3">
          <p className="text-xs font-bold text-slate-300">
            Selecione qual usuário deseja visualizar no aplicativo:
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ao clicar, o aplicativo carregará instantaneamente a tela e os dados do usuário selecionado.
          </p>
        </div>

        {/* Lista de Usuários Disponíveis */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar my-1">
          {users.map((u) => {
            const isMaster = u.email.trim().toLowerCase() === MASTER_DEV_EMAIL;
            const isInspetor = u.role === 'inspetor';
            const isCliente = u.role === 'cliente';

            return (
              <div
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isMaster
                    ? 'bg-amber-500/15 border-amber-400/40 hover:bg-amber-500/25'
                    : isInspetor
                    ? 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-900/40'
                    : isCliente
                    ? 'bg-purple-950/30 border-purple-800/50 hover:bg-purple-900/40'
                    : 'bg-[#12233e] border-[#1d3557] hover:bg-[#182e50]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isMaster
                        ? 'bg-amber-400 text-slate-950'
                        : isInspetor
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                        : isCliente
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-400/30'
                        : 'bg-blue-500/25 text-blue-300 border border-blue-400/30'
                    }`}
                  >
                    {isInspetor ? <Smartphone size={20} /> : isCliente ? <Users size={20} /> : <Monitor size={20} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {u.name}
                      </span>
                      {isMaster && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded">
                          Meu Usuário
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {u.email}
                    </p>
                    <span className="text-[10px] text-blue-300/80 font-medium">
                      {isInspetor ? '📱 Entrar no APK do Inspetor' : isCliente ? '🌐 Entrar no Portal do Cliente' : '💻 Entrar no Painel do Gestor'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isInspetor
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : isCliente
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    }`}
                  >
                    {u.role}
                  </span>
                  <ChevronRight size={17} className="text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com Botão de Sair (Logout) */}
        <div className="pt-4 mt-2 border-t border-[#172d4d] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sair da Conta (Logout)</span>
          </button>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Shield size={12} className="text-emerald-500" />
          <span>Ambiente Seguro • Acesso Exclusivo Matheus Stanley</span>
        </div>

      </div>
    </div>
  );
}
