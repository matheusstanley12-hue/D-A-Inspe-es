import { useState } from 'react';
import { LogOut, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, FileText, Download, Search } from 'react-feather';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';
import toast from 'react-hot-toast';
import ClientDashboardView from './ClientDashboardView';
import FormulariosView from './FormulariosView';
import { Activity, Menu, Briefcase, ChevronDown, ChevronRight, FilePlus } from 'react-feather';
import logoUrl from './assets/logo.jpg';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const today = new Date();

const MY_EVENTS = [
  {
    id: 1,
    title: 'Inspeção Técnica',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
    os: 'OS-2026-104',
    status: 'Finalizada',
    inspector: 'João Silva',
    priority: 'Alta',
    address: 'Av. Industrial, 500 - Distrito Industrial',
    duration: '2h00min'
  },
  {
    id: 2,
    title: 'Visita técnica',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0),
    os: 'OS-2026-108',
    status: 'Agendada',
    inspector: 'Matheus Stanley',
    priority: 'Média',
    address: 'Rodovia BR-101, Km 42',
    duration: '2h00min'
  },
  {
    id: 3,
    title: 'Inspeção NR-12',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 8, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 12, 0),
    os: 'OS-2026-112',
    status: 'Agendada',
    inspector: 'Ana Costa',
    priority: 'Alta',
    address: 'Av. das Nações, 1500',
    duration: '4h00min'
  }
];

const FORNECEDORES_LIST = [
  "CRIVALARO",
  "Modelação São Francisco",
  "Grupo Metal",
  "Thermotech",
  "Itupeva",
  "Galpao Weir",
  "Modelação Gomes (ANTIGA EIXXO)",
  "Mefsa",
  "Fundição São Francisco",
  "Escala",
  "Fusin",
  "Tecboor",
  "Usinagem MZT",
  "Mepe Soldas",
  "PAES USINAGEM",
  "CQ SOROCABA",
  "CORACORTHE HARDOX",
  "RV SOLUÇÕES",
  "CONFORMI",
  "MJM",
  "CALIFORNIA",
  "GRANAÇO",
  "Modelação Eixo"
];

// Custom event component declared outside render to maintain stable identity
const CalendarCustomEvent = ({ event }: any) => {
  const isCompleted = event.status === 'Finalizada';
  return (
    <div className={`text-xs p-1 px-2 h-full w-full font-semibold rounded text-white overflow-hidden text-ellipsis whitespace-nowrap ${isCompleted ? 'bg-emerald-500' : 'bg-[#0066cc]'}`}>
      {event.title}
    </div>
  );
};

export default function ClientPortal({ onLogout, isImpersonating }: { onLogout: () => void, isImpersonating?: boolean }) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFornecedoresExpanded, setIsFornecedoresExpanded] = useState(false);

  const generatePDF = async () => {
    const doc = new jsPDF();
    const startY = await addSystemPDFHeader(doc, `Laudo Técnico - ${selectedEvent.os}`);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const bodyData = [
      ['OS', selectedEvent.os],
      ['Tipo de Inspeção', selectedEvent.title],
      ['Data', format(selectedEvent.start, "dd/MM/yyyy")],
      ['Inspetor Responsável', selectedEvent.inspector],
      ['Endereço', selectedEvent.address],
      ['Duração', selectedEvent.duration],
      ['Status', selectedEvent.status]
    ];

    autoTable(doc, {
      startY: startY + 10,
      head: [['Campo', 'Informação']],
      body: bodyData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    return doc;
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const doc = await generatePDF();
      doc.save(`Laudo_${selectedEvent.os}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar o PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadRowReport = async (rel: any) => {
    try {
      toast.success(`Gerando relatório da ${rel.os}...`);
      const doc = new jsPDF();
      const startY = await addSystemPDFHeader(doc, `Relatório de Inspeção - ${rel.os}`);
      autoTable(doc, {
        startY: startY + 5,
        head: [['Campo', 'Informação']],
        body: [
          ['Número da O.S.', rel.os],
          ['Tipo de Inspeção', rel.tipo],
          ['Inspetor Responsável', rel.inspetor],
          ['Fornecedor / Local', rel.fornecedor],
          ['Data da Inspeção', rel.data],
          ['Peças Inspecionadas', String(rel.pecas)],
          ['Status / Parecer', rel.status]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204] },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      doc.save(`Relatorio_${rel.os}.pdf`);
      toast.success('Relatório baixado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar relatório.');
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1000)); // Simulate sending
      toast.success('E-mail enviado com sucesso para testecliente@gmail.com!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar e-mail');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#f4f7f9] flex flex-col font-sans w-full" style={{ height: isImpersonating ? '100%' : '100vh' }}>
      
      {/* CSS overrides for the calendar to ensure tooltips show over cells */}
      <style>{`
        .rbc-event {
          background: transparent !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .rbc-row-segment {
          overflow: visible !important;
        }
        .rbc-month-row {
          overflow: visible !important;
        }
      `}</style>

      {/* Sidebar + Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className={`bg-[#0f172a] text-white flex flex-col shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-gray-800 flex items-center justify-between min-w-[256px]">
            <div className="flex items-center">
              <div className="bg-white p-1 rounded-md">
                <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
              </div>
              <div className="ml-3">
                <h1 className="font-extrabold text-sm text-white">D&A</h1>
                <p className="text-[10px] text-gray-400 font-bold">PORTAL DO CLIENTE</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 min-w-[256px] overflow-y-auto show-scrollbar">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Menu Principal</div>
            
            <button 
              onClick={() => setActiveTab('Dashboard')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-left ${activeTab === 'Dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Activity size={18} className="mr-3 shrink-0" /> Visão Geral
            </button>

            <button 
              onClick={() => setActiveTab('Calendario')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-left ${activeTab === 'Calendario' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <CalendarIcon size={18} className="mr-3 shrink-0" /> Agenda
            </button>
            
            <div className="flex flex-col">
              <button 
                onClick={() => {
                  setIsFornecedoresExpanded(!isFornecedoresExpanded);
                  setActiveTab('Fornecedores');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-left ${activeTab.startsWith('Fornecedores') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                <div className="flex items-center">
                  <Briefcase size={18} className="mr-3 shrink-0" /> Fornecedores
                </div>
                {isFornecedoresExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isFornecedoresExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-700 flex flex-col space-y-1">
                  {FORNECEDORES_LIST.map((forn, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(`Fornecedores-${forn}`)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors ${activeTab === `Fornecedores-${forn}` ? 'bg-gray-800 text-white font-semibold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}
                    >
                      {forn}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setActiveTab('Relatorios')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-left ${activeTab === 'Relatorios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <FileText size={18} className="mr-3 shrink-0" /> Relatórios
            </button>

            <button 
              onClick={() => setActiveTab('Formularios')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors text-left ${activeTab === 'Formularios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <div className="flex items-center">
                <FilePlus size={18} className="mr-3 shrink-0" /> Formulários
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                Modelos
              </span>
            </button>
            
            {isImpersonating && (
              <div className="pt-6">
                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-3">Simulação</div>
                <button 
                  onClick={onLogout} 
                  className="w-full flex items-center px-3 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-colors text-left shadow-md"
                >
                  <LogOut size={18} className="mr-3 rotate-180 shrink-0" /> Menu Interno
                </button>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-800 min-w-[256px]">
            <button onClick={isImpersonating ? undefined : onLogout} className="w-full flex items-center px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors text-sm font-medium">
              <LogOut size={16} className="mr-2 shrink-0" /> {isImpersonating ? 'Sair (Desativado)' : 'Sair da Conta'}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
            {/* Toggle Button & Tabs */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors mr-3"
              >
                <Menu size={20} />
              </button>

              {/* Header Navigation Tabs */}
              <nav className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('Dashboard')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === 'Dashboard' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('Calendario')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === 'Calendario' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Agenda
                </button>
                <button
                  onClick={() => setActiveTab('Formularios')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center ${
                    activeTab === 'Formularios' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FilePlus size={14} className="mr-1.5" /> Formulários
                </button>
                <button
                  onClick={() => setActiveTab('Relatorios')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === 'Relatorios' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Relatórios
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 ml-auto">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs mr-2">
                  TC
                </div>
                <span className="font-medium text-gray-700">Teste Cliente</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 md:p-8 relative invert-target">
        
        {activeTab === 'Dashboard' && (
          <ClientDashboardView />
        )}

        {activeTab === 'Calendario' && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900">Agenda</h2>
              <p className="text-gray-500 mt-2">Acompanhe no calendário as visitas técnicas programadas para a sua empresa.</p>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-4 relative min-h-[600px]">
              <BigCalendar
                localizer={localizer}
                events={MY_EVENTS}
                startAccessor="start"
                endAccessor="end"
                culture="pt-BR"
                views={['month', 'week', 'day']}
                defaultView="month"
                messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia"
                }}
                components={{
                  event: CalendarCustomEvent
                }}
                onSelectEvent={(event) => setSelectedEvent(event)}
                className="custom-calendar text-sm"
              />
            </div>
          </>
        )}

        {activeTab === 'Fornecedores' && (
          <div className="w-full max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fornecedores</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie os fornecedores vinculados à sua empresa e acompanhe as visitas.</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar fornecedor..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                + Novo Fornecedor
              </button>
            </div>

            {/* Lista de Fornecedores */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Fornecedor</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">CNPJ</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Última Visita</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nome: 'CRIVALARO', cnpj: '12.345.678/0001-90', cidade: 'São Paulo/SP', status: 'Ativo', ultimaVisita: '10/09/2026' },
                    { nome: 'Modelação São Francisco', cnpj: '98.765.432/0001-10', cidade: 'Campinas/SP', status: 'Ativo', ultimaVisita: '08/09/2026' },
                    { nome: 'Grupo Metal', cnpj: '45.678.901/0002-33', cidade: 'Guarulhos/SP', status: 'Inativo', ultimaVisita: '05/09/2026' },
                    { nome: 'Thermotech', cnpj: '11.222.333/0001-44', cidade: 'São Bernardo/SP', status: 'Ativo', ultimaVisita: '29/08/2026' },
                    { nome: 'Itupeva', cnpj: '55.666.777/0001-88', cidade: 'Osasco/SP', status: 'Ativo', ultimaVisita: '20/08/2026' },
                  ].map((forn, idx) => {
                    const statusColor = forn.status === 'Ativo'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700';
                    return (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setActiveTab(`Fornecedores-${forn.nome}`)}>
                        <td className="px-6 py-4 font-bold text-gray-900">{forn.nome}</td>
                        <td className="px-6 py-4 text-gray-600">{forn.cnpj}</td>
                        <td className="px-6 py-4 text-gray-600">{forn.cidade}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {forn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{forn.ultimaVisita}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveTab(`Fornecedores-${forn.nome}`); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab.startsWith('Fornecedores-') && (
          <div className="w-full max-w-7xl mx-auto pb-12">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {activeTab.replace('Fornecedores-', '')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Visão geral do fornecedor selecionado.</p>
            </div>
            
            <ClientDashboardView supplierName={activeTab.replace('Fornecedores-', '')} />
          </div>
        )}

        {activeTab === 'Relatorios' && (
          <div className="w-full max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Relatórios</h1>
              <p className="text-sm text-gray-500 mt-1">Laudos técnicos e relatórios de inspeção emitidos para a sua empresa.</p>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['Todos', 'Setembro/2026', 'Agosto/2026', 'Julho/2026'].map((f, i) => (
                <button key={i} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${i === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Lista de relatórios */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nº O.S.</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Inspetor</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Fornecedor</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Peças</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { os: 'OS-2026-104', tipo: 'Inspeção Técnica', inspetor: 'João Silva', fornecedor: 'Indústria Alpha', data: '10/09/2026', pecas: 142, status: 'Aprovado' },
                    { os: 'OS-2026-099', tipo: 'Inspeção NR-12', inspetor: 'Ana Costa', fornecedor: 'Beta Máquinas', data: '08/09/2026', pecas: 87, status: 'Aprovado' },
                    { os: 'OS-2026-091', tipo: 'Visita Técnica', inspetor: 'Carlos R.', fornecedor: 'Gamma Ferramentas', data: '05/09/2026', pecas: 210, status: 'Aprovado c/ ressalva' },
                    { os: 'OS-2026-085', tipo: 'Inspeção Técnica', inspetor: 'João Silva', fornecedor: 'Indústria Alpha', data: '02/09/2026', pecas: 198, status: 'Aprovado' },
                    { os: 'OS-2026-078', tipo: 'Inspeção NR-12', inspetor: 'Maria S.', fornecedor: 'Delta Usinagem', data: '29/08/2026', pecas: 55, status: 'Reprovado' },
                    { os: 'OS-2026-072', tipo: 'Visita Técnica', inspetor: 'Ana Costa', fornecedor: 'Beta Máquinas', data: '25/08/2026', pecas: 320, status: 'Aprovado' },
                    { os: 'OS-2026-065', tipo: 'Inspeção Técnica', inspetor: 'Carlos R.', fornecedor: 'Zeta Equipamentos', data: '20/08/2026', pecas: 175, status: 'Aprovado' },
                    { os: 'OS-2026-058', tipo: 'Inspeção NR-12', inspetor: 'João Silva', fornecedor: 'Indústria Alpha', data: '15/08/2026', pecas: 93, status: 'Aprovado c/ ressalva' },
                  ].map((rel, idx) => {
                    const statusColor = rel.status === 'Aprovado'
                      ? 'bg-emerald-100 text-emerald-700'
                      : rel.status === 'Aprovado c/ ressalva'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700';
                    return (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-blue-600">{rel.os}</td>
                        <td className="px-6 py-4 text-gray-700">{rel.tipo}</td>
                        <td className="px-6 py-4 text-gray-600">{rel.inspetor}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{rel.fornecedor}</td>
                        <td className="px-6 py-4 text-gray-500">{rel.data}</td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{rel.pecas.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {rel.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleDownloadRowReport(rel)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FileText size={13} /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumo rodapé */}
            <div className="mt-4 flex justify-between text-xs text-gray-400 px-1">
              <span>8 relatórios encontrados</span>
              <span>Total de peças inspecionadas: <strong className="text-gray-600">1.280</strong></span>
            </div>
          </div>
        )}

        {activeTab === 'Formularios' && (
          <FormulariosView />
        )}

          </main>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#0066cc] p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Detalhes da O.S. {selectedEvent.os}</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <LogOut size={20} className="rotate-180" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Tab Navigation Mock */}
              <div className="flex border-b border-gray-200 mb-6">
                <button className="px-6 py-2 text-[#0066cc] border-b-2 border-[#0066cc] font-bold text-sm">
                  Tarefa
                </button>
                <button className="px-6 py-2 text-gray-400 hover:text-gray-600 font-medium text-sm">
                  Monitoramento
                </button>
                <button className="px-6 py-2 text-gray-400 hover:text-gray-600 font-medium text-sm">
                  Equipamentos
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><FileText size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">De:</span>
                    D&A Inspeções
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><MapPin size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Para (Inspetor):</span>
                    {selectedEvent.inspector}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><CalendarIcon size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Data da tarefa:</span>
                    {format(selectedEvent.start, "dd/MM/yyyy 'às' HH:mm")}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><Clock size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Prioridade:</span>
                    {selectedEvent.priority}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><CheckCircle size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Tipo:</span>
                    {selectedEvent.title}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><FileText size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Status:</span>
                    <span className={`font-bold ${selectedEvent.status === 'Finalizada' ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-start col-span-2">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><MapPin size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Endereço:</span>
                    {selectedEvent.address}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-5 text-[#0066cc] mr-3 mt-0.5"><Clock size={16} /></div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Duração informada:</span>
                    {selectedEvent.duration}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button className="text-gray-500 text-sm font-medium hover:text-gray-700 flex items-center">
                  <Search size={14} className="mr-2" /> Mais informações
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2 rounded border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors"
                disabled={isGenerating}
              >
                ✖ Fechar
              </button>
              
              <div className="flex space-x-3">
                {selectedEvent.status === 'Finalizada' ? (
                  <>
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={isGenerating}
                      className={`px-6 py-2 rounded bg-blue-100 text-blue-700 font-bold text-sm transition-colors flex items-center ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                    >
                      <Download size={16} className="mr-2" /> 
                      {isGenerating ? 'Gerando...' : 'Baixar em PDF'}
                    </button>
                    <button 
                      onClick={handleSendEmail}
                      disabled={isGenerating}
                      className={`px-6 py-2 rounded bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600'}`}
                    >
                      <FileText size={16} className="mr-2" /> 
                      {isGenerating ? 'Enviando...' : 'Mandar PDF por E-mail'}
                    </button>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-400 italic py-2">
                    Laudos disponíveis apenas após finalização da tarefa.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
