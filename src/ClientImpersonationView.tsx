import { useState, useEffect } from 'react';
import ClientPortal from './ClientPortal';
import { Users, ChevronRight, Briefcase } from 'react-feather';
import { getClients, CLIENTS_CHANGE_EVENT, type SystemClient } from './stores/formulariosStore';

export default function ClientImpersonationView({ onBack }: { onBack: () => void }) {
  const [clients, setClients] = useState<SystemClient[]>(() => getClients());
  const [selectedClient, setSelectedClient] = useState<SystemClient | null>(null);

  useEffect(() => {
    const update = () => setClients(getClients());
    window.addEventListener(CLIENTS_CHANGE_EVENT, update);
    return () => window.removeEventListener(CLIENTS_CHANGE_EVENT, update);
  }, []);

  if (selectedClient) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        {/* Banner de Aviso de Simulação */}
        <div className="bg-orange-500 text-white text-xs font-bold py-1.5 px-4 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center">
            <Users size={14} className="mr-2" />
            <span>VOCÊ ESTÁ VISUALIZANDO O PORTAL COMO: <strong>{selectedClient.companyName}</strong></span>
          </div>
          <button 
            onClick={() => setSelectedClient(null)}
            className="bg-orange-700 hover:bg-orange-800 px-3 py-0.5 rounded transition-colors cursor-pointer"
          >
            Sair da Simulação
          </button>
        </div>
        
        {/* Renderiza o Portal do Cliente */}
        <div className="flex-1 w-full relative overflow-hidden">
          <div className="absolute inset-0">
            <ClientPortal 
              onLogout={() => { setSelectedClient(null); onBack(); }} 
              isImpersonating={true} 
              userEmail={selectedClient.email}
              clientName={selectedClient.companyName}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f4f7f9] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '80vh' }}>
        {/* Header */}
        <div className="bg-[#0f172a] text-white p-6 shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Simulação de Portal do Cliente</h1>
            <p className="text-sm text-gray-400 mt-1">Selecione uma empresa cadastrada para acessar o portal exatamente como o cliente vê.</p>
          </div>
          <button 
            onClick={onBack}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
          >
            Voltar ao Painel Interno
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto bg-gray-50">
          {clients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase size={28} />
              </div>
              <h3 className="text-base font-extrabold text-gray-800">Nenhum cliente cadastrado no sistema</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Cadastre seus clientes no menu <strong>"Clientes"</strong> para habilitar a simulação do portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left bg-white cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base">{client.companyName}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">CNPJ: {client.cnpj || 'Não informado'}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
