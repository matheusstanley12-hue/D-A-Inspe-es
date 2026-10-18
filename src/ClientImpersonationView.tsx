import { useState } from 'react';
import ClientPortal from './ClientPortal';
import { Users, ChevronRight, Briefcase } from 'react-feather';

const MOCK_CLIENTS = [
  { id: 1, name: 'CORACORTHE' },
  { id: 2, name: 'Fábrica ABC' },
  { id: 3, name: 'Mercado Central' },
  { id: 4, name: 'Weir' },
];

export default function ClientImpersonationView({ onBack }: { onBack: () => void }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);

  if (selectedClient) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        {/* Banner de Aviso de Simulação */}
        <div className="bg-orange-500 text-white text-xs font-bold py-1.5 px-4 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center">
            <Users size={14} className="mr-2" />
            <span>VOCÊ ESTÁ VISUALIZANDO O PORTAL COMO: <strong>{selectedClient.name}</strong></span>
          </div>
          <button 
            onClick={() => setSelectedClient(null)}
            className="bg-orange-700 hover:bg-orange-800 px-3 py-0.5 rounded transition-colors"
          >
            Sair da Simulação
          </button>
        </div>
        
        {/* Renderiza o Portal do Cliente */}
        <div className="flex-1 w-full relative overflow-hidden">
          <div className="absolute inset-0">
            <ClientPortal onLogout={() => { setSelectedClient(null); onBack(); }} isImpersonating={true} />
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
            <p className="text-sm text-gray-400 mt-1">Selecione uma empresa para acessar o portal exatamente como o cliente vê.</p>
          </div>
          <button 
            onClick={onBack}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Voltar ao Painel Interno
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CLIENTS.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left bg-white"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{client.name}</h3>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

