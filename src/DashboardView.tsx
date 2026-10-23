import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Line, ComposedChart 
} from 'recharts';
import { FileText, DollarSign, Activity, Users, Download, Calendar } from 'react-feather';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';
import toast from 'react-hot-toast';
import { 
  getServiceOrders, ORDERS_CHANGE_EVENT, type ServiceOrder,
  getFormResponses, RESPONSES_CHANGE_EVENT, type FormResponse,
  getExpenses, EXPENSES_CHANGE_EVENT, type InspectorExpense,
  getClients, CLIENTS_CHANGE_EVENT, type SystemClient,
  getSystemUsers, USERS_CHANGE_EVENT, type SystemUser
} from './stores/formulariosStore';

const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-md border border-gray-200 text-xs">
        <p className="text-gray-800 font-bold mb-1.5 border-b border-gray-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const nameStr = entry.name ? String(entry.name).toLowerCase() : '';
          const isMoney = nameStr.includes('reembolso') || nameStr.includes('valor');
          return (
            <div key={index} className="flex justify-between items-center gap-4 py-0.5">
              <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{isMoney ? `R$ ${Number(entry.value).toFixed(2)}` : entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function DashboardView() {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => getServiceOrders());
  const [responses, setResponses] = useState<FormResponse[]>(() => getFormResponses());
  const [expenses, setExpenses] = useState<InspectorExpense[]>(() => getExpenses());
  const [clients, setClients] = useState<SystemClient[]>(() => getClients());
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const updateAll = () => {
      setOrders(getServiceOrders());
      setResponses(getFormResponses());
      setExpenses(getExpenses());
      setClients(getClients());
      setUsers(getSystemUsers());
    };

    window.addEventListener(ORDERS_CHANGE_EVENT, updateAll);
    window.addEventListener(RESPONSES_CHANGE_EVENT, updateAll);
    window.addEventListener(EXPENSES_CHANGE_EVENT, updateAll);
    window.addEventListener(CLIENTS_CHANGE_EVENT, updateAll);
    window.addEventListener(USERS_CHANGE_EVENT, updateAll);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, updateAll);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, updateAll);
      window.removeEventListener(EXPENSES_CHANGE_EVENT, updateAll);
      window.removeEventListener(CLIENTS_CHANGE_EVENT, updateAll);
      window.removeEventListener(USERS_CHANGE_EVENT, updateAll);
    };
  }, []);

  // Métricas em tempo real
  const totalInspecionado = orders.filter(o => o.status === 'Concluída').length + responses.length;
  const totalReembolsos = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const totalInspetores = users.filter(u => u.role === 'inspetor').length || 1;

  // Cliente Destaque
  const clientVolumeMap: Record<string, number> = {};
  orders.forEach(o => {
    if (o.client) clientVolumeMap[o.client] = (clientVolumeMap[o.client] || 0) + 1;
  });
  responses.forEach(r => {
    const c = r.answers?.os_cliente || r.answers?.empresa;
    if (c) clientVolumeMap[c] = (clientVolumeMap[c] || 0) + 1;
  });

  const sortedClients = Object.entries(clientVolumeMap)
    .map(([name, qtd]) => ({ name, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const clienteDestaque = sortedClients[0]?.name || (clients[0]?.companyName || 'Nenhum');
  const clienteDestaqueQtd = sortedClients[0]?.qtd || 0;

  // Carga por inspetor
  const inspectorVolumeMap: Record<string, number> = {};
  orders.forEach(o => {
    if (o.inspector) inspectorVolumeMap[o.inspector] = (inspectorVolumeMap[o.inspector] || 0) + 1;
  });
  responses.forEach(r => {
    if (r.inspectorName) inspectorVolumeMap[r.inspectorName] = (inspectorVolumeMap[r.inspectorName] || 0) + 1;
  });

  const inspectorData = Object.entries(inspectorVolumeMap)
    .map(([name, qtd]) => ({ name, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 6);

  // Dados mensais do ano atual
  const monthsAbbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const curMonthIdx = new Date().getMonth();
  const yearlyChartData = monthsAbbr.map((m, idx) => {
    const isPastOrCurrent = idx <= curMonthIdx;
    return {
      month: m,
      qtd: isPastOrCurrent ? (idx === curMonthIdx ? totalInspecionado : 0) : null,
      meta: (idx + 1) * 5,
    };
  });

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      toast.success('Gerando Relatório Gerencial em PDF...');
      const doc = new jsPDF();
      const startY = await addSystemPDFHeader(doc, `Relatório Gerencial de Indicadores`);

      autoTable(doc, {
        startY: startY + 5,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
        head: [['Indicador de Performance', 'Valor / Métrica']],
        body: [
          ['Total Inspecionado no Sistema', `${totalInspecionado} Ordens de Serviço`],
          ['Cliente Destaque', `${clienteDestaque} (${clienteDestaqueQtd} O.S.)`],
          ['Total de Reembolsos de Campo', `R$ ${totalReembolsos.toFixed(2)}`],
          ['Efetivo Técnico Cadastrado', `${totalInspetores} Inspetores`],
          ['Ordens em Andamento Hoje', `${orders.filter(o => o.status === 'Em Andamento').length} O.S.`]
        ]
      });

      let currentY = (doc as any).lastAutoTable?.finalY || 120;

      if (sortedClients.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Volume de Ordens por Cliente", 14, currentY + 12);

        autoTable(doc, {
          startY: currentY + 16,
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
          head: [['Cliente', 'Volume (O.S.)', 'Participação']],
          body: sortedClients.map(c => [
            c.name,
            String(c.qtd),
            totalInspecionado > 0 ? `${Math.round((c.qtd / totalInspecionado) * 100)}%` : '0%'
          ])
        });

        currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
      }

      if (inspectorData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Distribuição de Carga dos Inspetores", 14, currentY + 12);

        autoTable(doc, {
          startY: currentY + 16,
          theme: 'striped',
          headStyles: { fillColor: [75, 85, 99], fontStyle: 'bold' },
          head: [['Inspetor', 'Atendimentos Realizados']],
          body: inspectorData.map(i => [i.name, `${i.qtd} O.S.`])
        });
      }

      doc.save(`Relatorio_Gerencial_Indicadores_${Date.now()}.pdf`);
      toast.success('Relatório Gerencial exportado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar relatório em PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-[1400px] mx-auto pt-4 animate-[fadeIn_0.3s_ease-out] bg-[#f4f7f9]">
      
      {/* Header Corporativo */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            Relatório Gerencial
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Métricas de campo, produtividade e fechamento em tempo real.
          </p>
        </div>
        
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
            isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900'
          }`}
        >
          <Download size={14} /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </button>
      </div>

      {/* Resumo Executivo (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <Activity size={12} className="mr-1.5 text-blue-600" /> Total Inspecionado
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-3xl font-black text-gray-900">{totalInspecionado}<span className="text-sm font-medium text-gray-400 ml-1">O.S.</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <FileText size={12} className="mr-1.5 text-indigo-600" /> Cliente Destaque
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-lg font-extrabold text-gray-900 truncate" title={clienteDestaque}>{clienteDestaque}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <DollarSign size={12} className="mr-1.5 text-emerald-600" /> Reembolsos Campo
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-2xl font-extrabold text-[#1e3a8a]">R$ {totalReembolsos.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <Users size={12} className="mr-1.5 text-violet-600" /> Efetivo em Campo
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-3xl font-black text-gray-900">{totalInspetores}<span className="text-sm font-medium text-gray-400 ml-1">Insp.</span></h3>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar pr-1 space-y-6">

        {/* Gráfico Macro: Evolução Anual */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="mb-6 border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Calendar size={16} className="mr-2 text-[#1e3a8a]" /> Evolução Anual
              </h2>
              <p className="text-xs text-gray-500 mt-1">Comparativo de ordens executadas mês a mês no sistema.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right pl-4">
                <h3 className="text-2xl font-extrabold text-gray-900">
                  {totalInspecionado}
                  <span className="text-sm font-normal text-gray-400 ml-1">O.S. (Total)</span>
                </h3>
              </div>
            </div>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="qtd" name="Total Inspecionado" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="meta" name="Meta Operacional" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos em Grid Duplo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Cliente */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Volume por Cliente</h2>
            <p className="text-xs text-gray-500 mb-4">Empresas atendidas pelas inspeções técnicas.</p>
            {sortedClients.length > 0 ? (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedClients.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <RechartsTooltip content={<CorporateTooltip />} />
                    <Bar dataKey="qtd" name="Ordens" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
                Nenhuma ordem vinculada a clientes ainda.
              </div>
            )}
          </div>

          {/* Distribuição por Inspetor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Carga dos Inspetores</h2>
            <p className="text-xs text-gray-500 mb-4">Atendimentos concluídos e em andamento por profissional.</p>
            {inspectorData.length > 0 ? (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inspectorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <RechartsTooltip content={<CorporateTooltip />} />
                    <Bar dataKey="qtd" name="Atendimentos" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
                Nenhum atendimento atribuído a inspetores ainda.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
