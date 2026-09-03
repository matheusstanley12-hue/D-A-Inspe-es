import React, { useState } from 'react';
import { Search, Plus, Filter, Eye, Download, CheckCircle, Clock, AlertCircle, FileText, X, MapPin, User, Calendar as CalendarIcon, File } from 'react-feather';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock Data
const MOCK_ORDERS = [
  {
    id: '1',
    date: new Date(2026, 8, 2, 8, 30),
    inspector: 'João Silva',
    client: 'Mercado Central, BH',
    formType: 'Inspeção de Estrutura',
    status: 'completed',
    description: 'Verificação da estrutura metálica do galpão principal.',
    items: [
      { name: 'Checklist Estrutural', status: 'OK' },
      { name: 'Ensaio Visual', status: 'OK' }
    ]
  },
  {
    id: '2',
    date: new Date(2026, 8, 2, 14, 15),
    inspector: 'João Silva',
    client: 'Fábrica ABC, Contagem',
    formType: 'Diligenciamento Q',
    status: 'in_progress',
    description: 'Acompanhamento da fabricação de peças.',
    items: [
      { name: 'Inspeção Dimensional', status: 'Pendente' }
    ]
  },
  {
    id: '3',
    date: new Date(2026, 8, 3, 9, 0),
    inspector: 'Maria Souza',
    client: 'Usinagem Dois Irmãos',
    formType: 'Relatório Fotográfico',
    status: 'pending',
    description: 'Registro do estado atual dos equipamentos.',
    items: [
      { name: 'Fotos 360', status: 'Pendente' }
    ]
  },
  {
    id: '4',
    date: new Date(2026, 8, 4, 10, 0),
    inspector: 'Matheus Stanley',
    client: 'Galpão Logístico Sul',
    formType: 'Inspeção Pré-Embarque',
    status: 'pending',
    description: 'Liberação de carga para transporte internacional.',
    items: [
      { name: 'Verificação de Lacre', status: 'Pendente' }
    ]
  }
];

export default function ServiceOrdersView() {
  const [orders] = useState(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOS, setSelectedOS] = useState<typeof MOCK_ORDERS[0] | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle size={14} className="mr-1.5" /> Concluída</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><Clock size={14} className="mr-1.5 animate-pulse" /> Em Andamento</span>;
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><AlertCircle size={14} className="mr-1.5" /> Pendente</span>;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto pt-2 relative">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-3 text-blue-600" size={28} />
            Ordens de Serviço
          </h1>
          <p className="text-base text-gray-500 mt-1">Geradas automaticamente quando o inspetor inicia o serviço em campo.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por OS, Inspetor ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <Filter size={18} className="mr-2 text-gray-500" /> Filtros
          </button>
          <button className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download size={18} className="mr-2 text-gray-500" /> Exportar
          </button>
        </div>
      </div>

      {/* Modern List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Ordem de Serviço
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Data e Hora
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Inspetor Responsável
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Cliente / Local
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{order.id}</span>
                        <span className="text-xs font-semibold text-gray-500 mt-1">{order.formType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{format(order.date, 'dd/MM/yyyy')}</span>
                        <span className="text-xs text-gray-500 mt-1">{format(order.date, 'HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{order.inspector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">{order.client}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedOS(order)}
                        className="text-blue-600 font-bold hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors inline-flex items-center"
                      >
                        Abrir <Eye size={16} className="ml-2" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-900">Nenhuma Ordem de Serviço encontrada.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Details Panel */}
      {selectedOS && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOS(null)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
            
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Detalhes da O.S.</h2>
                <p className="text-sm font-bold text-blue-600 mt-1">{selectedOS.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOS(null)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Status Header */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-sm font-bold text-gray-700">Status Atual</span>
                {getStatusBadge(selectedOS.status)}
              </div>

              {/* Informações Principais */}
              <div>
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Informações Gerais</h3>
                <div className="space-y-4">
                  
                  <div className="flex items-start">
                    <File className="text-blue-500 mr-3 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Tipo de Formulário</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.formType}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="text-blue-500 mr-3 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Inspetor</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.inspector}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="text-blue-500 mr-3 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Cliente / Local</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.client}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="text-blue-500 mr-3 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Data de Início</p>
                      <p className="text-sm font-semibold text-gray-900">{format(selectedOS.date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Descrição do Serviço</h3>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedOS.description}</p>
                </div>
              </div>

              {/* Itens do Formulário */}
              <div>
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Itens / Checklist</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  {selectedOS.items.map((item, idx) => (
                    <div key={idx} className={`p-4 flex justify-between items-center ${idx !== selectedOS.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Panel Footer */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <button className="w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center">
                <Download size={18} className="mr-2" /> Baixar PDF da O.S.
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Simple animation injected */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
