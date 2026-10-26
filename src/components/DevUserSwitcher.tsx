import { useState, useEffect } from 'react';
import { Terminal, Users, Smartphone, Monitor, CheckCircle, X, ChevronRight, Shield } from 'react-feather';
import { getSystemUsers, type SystemUser, MASTER_DEV_EMAIL, USERS_CHANGE_EVENT } from '../stores/formulariosStore';

interface DevUserSwitcherProps {
  currentUserEmail?: string;
  currentRole?: string | null;
  onSwitchUser: (user: SystemUser) => void;
  onSwitchRole: (role: 'gestor' | 'inspetor' | 'cliente') => void;
  onResetToMaster: () => void;
}

export default function DevUserSwitcher({
  currentUserEmail,
  currentRole,
  onSwitchUser,
  onSwitchRole,
  onResetToMaster,
}: DevUserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers());

  useEffect(() => {
    const handleUpdate = () => setUsers(getSystemUsers());
    window.addEventListener(USERS_CHANGE_EVENT, handleUpdate);
    return () => window.removeEventListener(USERS_CHANGE_EVENT, handleUpdate);
  }, []);

  const isSimulating = currentUserEmail !== MASTER_DEV_EMAIL;
  const currentSimulatedUser = users.find(
    u => u.email.trim().toLowerCase() === (currentUserEmail || '').trim().toLowerCase()
  );

  return (
    <>
      {/* Botão Flutuante Discreto do Desenvolvedor (Visível no APK e Web) */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-2xl text-xs font-bold transition-all cursor-pointer border ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
              : 'bg-[#03132b]/90 hover:bg-[#062047] text-white border-blue-400/40 backdrop-blur-md'
          }`}
          title="Ferramenta do Programador: Selecionar Usuário / Visão"
        >
          <Terminal size={14} className={isSimulating ? 'text-slate-950' : 'text-blue-400'} />
          <span className="hidden sm:inline">
            {isSimulating ? `Vendo como: ${currentSimulatedUser?.name || currentUserEmail}` : 'Dev Master'}
          </span>
          <span className="sm:hidden">
            {isSimulating ? (currentSimulatedUser?.name?.split(' ')[0] || 'Simulando') : 'Dev'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        </button>
      </div>

      {/* Modal / Painel do Programador */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0c1b30] text-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#1e3558] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabeçalho */}
            <div className="bg-[#071324] px-5 py-4 border-b border-[#172d4d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black leading-tight flex items-center gap-1.5">
                    <span>Acesso do Programador</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase font-mono">
                      Master
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selecione qualquer usuário para simular a visão real no sistema ou no APK
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Alternância Rápida de Telas (APK x Gestor Web x Cliente) */}
            <div className="p-4 bg-[#09182d] border-b border-[#172d4d]">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                Alternar Visão do Sistema
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('inspetor');
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'inspetor'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-[#11233e] text-slate-300 border-[#1f375c] hover:bg-[#172e50]'
                  }`}
                >
                  <Smartphone size={16} />
                  <span>Tela APK (Inspetor)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('gestor');
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'gestor'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-[#11233e] text-slate-300 border-[#1f375c] hover:bg-[#172e50]'
                  }`}
                >
                  <Monitor size={16} />
                  <span>Tela Web (Gestor)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('cliente');
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    currentRole === 'cliente'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-[#11233e] text-slate-300 border-[#1f375c] hover:bg-[#172e50]'
                  }`}
                >
                  <Users size={16} />
                  <span>Portal do Cliente</span>
                </button>
              </div>
            </div>

            {/* Lista de Usuários Disponíveis para Simulação */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                Selecionar Usuário Específico
              </span>

              {users.map((u) => {
                const isSelected =
                  (currentUserEmail || '').trim().toLowerCase() === u.email.trim().toLowerCase();
                const isMaster = u.email.trim().toLowerCase() === MASTER_DEV_EMAIL;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/80 ring-1 ring-blue-500'
                        : 'bg-[#11223b] border-[#1d3557] hover:bg-[#162c4d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isMaster
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : u.role === 'inspetor'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : u.role === 'cliente'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{u.name}</span>
                          {isMaster && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                              Programador
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          u.role === 'inspetor'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                            : u.role === 'cliente'
                            ? 'bg-purple-950/70 text-purple-400 border border-purple-800'
                            : 'bg-blue-950/70 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                      {isSelected ? (
                        <CheckCircle size={16} className="text-blue-400" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé com Botão de Reset */}
            <div className="p-4 bg-[#071324] border-t border-[#172d4d] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onResetToMaster();
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Shield size={14} className="text-amber-400" />
                <span>Voltar ao Matheus Stanley (Master)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
