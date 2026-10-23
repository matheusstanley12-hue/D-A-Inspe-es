import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search, Filter, Eye, Download, CheckCircle, Clock, AlertCircle, FileText, X, MapPin, User, Calendar as CalendarIcon, Plus } from 'react-feather';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';
import toast from 'react-hot-toast';
import { 
  getServiceOrders, upsertServiceOrder, ORDERS_CHANGE_EVENT, type ServiceOrder,
  getClients, CLIENTS_CHANGE_EVENT, type SystemClient,
  getSystemUsers, USERS_CHANGE_EVENT, type SystemUser
} from './stores/formulariosStore';

export default function ServiceOrdersView() {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => getServiceOrders());
  const [clients, setClients] = useState<SystemClient[]>(() => getClients());
  const [inspectors, setInspectors] = useState<SystemUser[]>(() => getSystemUsers().filter(u => u.role === 'inspetor'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Concluída' | 'Em Andamento' | 'Agendada' | 'Pendente'>('all');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    const updateOrders = () => setOrders(getServiceOrders());
    const updateClients = () => setClients(getClients());
    const updateUsers = () => setInspectors(getSystemUsers().filter(u => u.role === 'inspetor'));

    window.addEventListener(ORDERS_CHANGE_EVENT, updateOrders);
    window.addEventListener(CLIENTS_CHANGE_EVENT, updateClients);
    window.addEventListener(USERS_CHANGE_EVENT, updateUsers);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, updateOrders);
      window.removeEventListener(CLIENTS_CHANGE_EVENT, updateClients);
      window.removeEventListener(USERS_CHANGE_EVENT, updateUsers);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluída':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle size={14} className="mr-1.5" /> Concluída</span>;
      case 'Em Andamento':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock size={14} className="mr-1.5 animate-pulse" /> Em Andamento</span>;
      case 'Agendada':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800"><CalendarIcon size={14} className="mr-1.5" /> Agendada</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800"><AlertCircle size={14} className="mr-1.5" /> {status || 'Pendente'}</span>;
    }
  };

  const handleDownloadOSPDF = async (order: ServiceOrder) => {
    try {
      toast.success(`Gerando PDF da O.S. ${order.code}...`);
      const doc = new jsPDF();
      const startY = await addSystemPDFHeader(doc, `Ordem de Serviço ${order.code} - ${order.type}`);

      autoTable(doc, {
        startY: startY + 5,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
        head: [['Campo', 'Detalhes']],
        body: [
          ['Número da O.S.', order.code],
          ['Tipo de Serviço', order.type],
          ['Inspetor Responsável', order.inspector],
          ['Cliente / Empresa', order.client],
          ['Local da Inspeção', order.location || 'Em campo'],
          ['Data Agendada', order.date],
          ['Horário Início/Fim', `${order.StartTime || '--:--'} às ${order.EndTime || '--:--'}`],
          ['Status Operacional', order.status],
          ['Progresso', `${order.progress || 0}%`],
          ['Observações Técnicas', order.notes || 'Sem observações adicionais.']
        ]
      });

      doc.save(`${order.code}_${order.client.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar o PDF da O.S.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const headers = "ID;Codigo;Data;Inspetor;Cliente;Tipo;Status\n";
    const rows = filteredOrders.map(o => 
      `${o.id};${o.code};${o.date};${o.inspector};${o.client};${o.type};${o.status}`
    ).join("\n");
    const csvContent = "\uFEFF" + headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ordens_de_Servico_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ordens exportadas em CSV com sucesso!');
  };

  const handleCreateOrder = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const client = (fd.get('client') as string)?.trim();
    const inspector = (fd.get('inspector') as string)?.trim();
    const type = (fd.get('type') as string)?.trim() || 'Diligenciamento';
    const date = (fd.get('date') as string) || format(new Date(), 'yyyy-MM-dd');
    const StartTime = (fd.get('StartTime') as string) || '08:00';
    const location = (fd.get('location') as string)?.trim() || '';
    const notes = (fd.get('notes') as string)?.trim() || '';

    if (!client || !inspector) {
      toast.error('Preencha o cliente e o inspetor responsável.');
      return;
    }

    const code = `OS-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newOrder: ServiceOrder = {
      id: 'os_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      code,
      client,
      inspector,
      type,
      location,
      status: 'Agendada',
      date,
      StartTime,
      progress: 0,
      notes,
      createdAt: new Date().toISOString(),
    };

    upsertServiceOrder(newOrder);
    setOrders(getServiceOrders());
    setIsNewModalOpen(false);
    toast.success(`Ordem de Serviço ${code} criada e enviada ao app do inspetor!`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-2 relative">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-3 text-blue-600" size={28} />
            Ordens de Serviço ({orders.length})
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Programadas pelo Gestor ou geradas em tempo real pelo inspetor no aplicativo de campo.
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center cursor-pointer shrink-0"
        >
          <Plus size={18} className="mr-2" /> Nova Ordem de Serviço
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código, inspetor ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button 
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center justify-center border px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              showFilterBar || statusFilter !== 'all' 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} className="mr-2 text-gray-500" /> Filtros
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download size={18} className="mr-2 text-gray-500" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterBar && (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('Concluída')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'Concluída' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Concluídas ({orders.filter(o => o.status === 'Concluída').length})
          </button>
          <button
            onClick={() => setStatusFilter('Em Andamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'Em Andamento' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            Em Andamento ({orders.filter(o => o.status === 'Em Andamento').length})
          </button>
          <button
            onClick={() => setStatusFilter('Agendada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${statusFilter === 'Agendada' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            Agendadas ({orders.filter(o => o.status === 'Agendada').length})
          </button>
        </div>
      )}

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
                  Data e Horário
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
                        <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{order.code}</span>
                        <span className="text-xs font-semibold text-gray-500 mt-1">{order.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{order.date}</span>
                        <span className="text-xs text-gray-500 mt-1">{order.StartTime || '--:--'}</span>
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
                      {order.location && (
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center">
                          <MapPin size={11} className="mr-1 shrink-0" />
                          <span className="truncate max-w-[200px]">{order.location}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedOS(order)}
                        className="text-blue-600 font-bold hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors inline-flex items-center cursor-pointer"
                      >
                        Abrir <Eye size={16} className="ml-2" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-900">Nenhuma Ordem de Serviço cadastrada.</p>
                    <p className="text-xs text-gray-400 mt-1">Clique em "+ Nova Ordem de Serviço" acima para programar uma demanda ou aguarde o início em campo pelo inspetor.</p>
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
          <div 
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOS(null)}
          ></div>
          
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Detalhes da O.S.</h2>
                <p className="text-sm font-bold text-blue-600 mt-1">{selectedOS.code}</p>
              </div>
              <button 
                onClick={() => setSelectedOS(null)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-sm font-bold text-gray-700">Status Operacional</span>
                {getStatusBadge(selectedOS.status)}
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Informações Gerais</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FileText className="text-blue-500 mr-3 mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Tipo de Inspeção</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.type}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="text-blue-500 mr-3 mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Inspetor</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.inspector}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="text-blue-500 mr-3 mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Cliente / Local</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedOS.client}</p>
                      {selectedOS.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{selectedOS.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="text-blue-500 mr-3 mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">Data & Horário</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedOS.date} {selectedOS.StartTime ? `às ${selectedOS.StartTime}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOS.notes && (
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">Observações Técnicas</h3>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedOS.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white">
              <button 
                onClick={() => handleDownloadOSPDF(selectedOS)}
                className="w-full bg-blue-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center cursor-pointer"
              >
                <Download size={18} className="mr-2" /> Baixar PDF da O.S.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova O.S. */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[slideIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-extrabold text-gray-900">Nova Ordem de Serviço</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Cliente / Empresa *</label>
                  {clients.length > 0 ? (
                    <select name="client" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none">
                      {clients.map(c => (
                        <option key={c.id} value={c.companyName}>{c.companyName}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" name="client" required placeholder="Ex: Mineração do Sul S/A" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Inspetor Responsável *</label>
                  {inspectors.length > 0 ? (
                    <select name="inspector" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none">
                      {inspectors.map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" name="inspector" required defaultValue="Inspetor D&A" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tipo de Inspeção</label>
                  <select name="type" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none">
                    <option value="Diligenciamento">Diligenciamento</option>
                    <option value="Solda">Solda</option>
                    <option value="Fabricação">Fabricação</option>
                    <option value="Estrutura Metálica">Estrutura Metálica</option>
                    <option value="Pintura e Tratamento">Pintura e Tratamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Data Agendada</label>
                  <input type="date" name="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Local / Endereço da Inspeção</label>
                  <input type="text" name="location" placeholder="Ex: Av. Industrial, 500 - Betim, MG" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Instruções / Observações</label>
                  <textarea name="notes" rows={3} placeholder="Descreva o escopo e os itens a verificar..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none resize-none" />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                  Criar e Transmitir O.S.
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
