import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, ComposedChart 
} from 'recharts';
import { FileText, DollarSign, Activity, Users, ChevronDown, Download, Calendar } from 'react-feather';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';
import toast from 'react-hot-toast';

// --- MOCK DATA ---
const YEARLY_CHART_DATA = {
  'Geral': [
    { month: 'Jan', qtd: 85, meta: 80 },
    { month: 'Fev', qtd: 92, meta: 90 },
    { month: 'Mar', qtd: 110, meta: 100 },
    { month: 'Abr', qtd: 105, meta: 110 },
    { month: 'Mai', qtd: 125, meta: 115 },
    { month: 'Jun', qtd: 130, meta: 120 },
    { month: 'Jul', qtd: 128, meta: 125 },
    { month: 'Ago', qtd: 135, meta: 130 },
    { month: 'Set', qtd: 141, meta: 135 },
    { month: 'Out', qtd: null, meta: 140 },
    { month: 'Nov', qtd: null, meta: 145 },
    { month: 'Dez', qtd: null, meta: 150 },
  ],
  'CORACORTHE': [
    { month: 'Jan', qtd: 25, meta: 20 },
    { month: 'Fev', qtd: 28, meta: 22 },
    { month: 'Mar', qtd: 35, meta: 25 },
    { month: 'Abr', qtd: 30, meta: 25 },
    { month: 'Mai', qtd: 38, meta: 30 },
    { month: 'Jun', qtd: 40, meta: 35 },
    { month: 'Jul', qtd: 42, meta: 40 },
    { month: 'Ago', qtd: 45, meta: 40 },
    { month: 'Set', qtd: 45, meta: 45 },
    { month: 'Out', qtd: null, meta: 45 },
    { month: 'Nov', qtd: null, meta: 50 },
    { month: 'Dez', qtd: null, meta: 50 },
  ],
  'Fábrica ABC': [
    { month: 'Jan', qtd: 15, meta: 15 },
    { month: 'Fev', qtd: 20, meta: 15 },
    { month: 'Mar', qtd: 22, meta: 20 },
    { month: 'Abr', qtd: 25, meta: 20 },
    { month: 'Mai', qtd: 30, meta: 25 },
    { month: 'Jun', qtd: 28, meta: 25 },
    { month: 'Jul', qtd: 32, meta: 30 },
    { month: 'Ago', qtd: 35, meta: 30 },
    { month: 'Set', qtd: 38, meta: 35 },
    { month: 'Out', qtd: null, meta: 35 },
    { month: 'Nov', qtd: null, meta: 40 },
    { month: 'Dez', qtd: null, meta: 40 },
  ],
  'Mercado Central': [
    { month: 'Jan', qtd: 10, meta: 10 },
    { month: 'Fev', qtd: 12, meta: 12 },
    { month: 'Mar', qtd: 15, meta: 15 },
    { month: 'Abr', qtd: 15, meta: 15 },
    { month: 'Mai', qtd: 18, meta: 18 },
    { month: 'Jun', qtd: 20, meta: 20 },
    { month: 'Jul', qtd: 22, meta: 20 },
    { month: 'Ago', qtd: 24, meta: 22 },
    { month: 'Set', qtd: 25, meta: 25 },
    { month: 'Out', qtd: null, meta: 25 },
    { month: 'Nov', qtd: null, meta: 28 },
    { month: 'Dez', qtd: null, meta: 30 },
  ]
};

const CLIENT_DATA = [
  { name: 'CORACORTHE', qtd: 45 },
  { name: 'Fábrica ABC', qtd: 38 },
  { name: 'Mercado Central', qtd: 25 },
  { name: 'Weir', qtd: 18 },
  { name: 'JRDL', qtd: 15 },
  { name: 'GALEÃO', qtd: 12 },
];

const INSPECTOR_DATA = [
  { name: 'João Silva', qtd: 32 },
  { name: 'Maria Souza', qtd: 28 },
  { name: 'Ana Costa', qtd: 24 },
  { name: 'Matheus Stanley', qtd: 16 },
  { name: 'Carlos', qtd: 10 },
];

// Cores Sóbrias / Corporativas
const CORPORATE_COLORS = ['#1e3a8a', '#3b82f6', '#64748b', '#94a3b8', '#cbd5e1'];

const STATUS_DATA = [
  { name: 'Finalizadas', qtd: 45 },
  { name: 'Em Atendimento', qtd: 15 },
  { name: 'Agendadas', qtd: 32 },
  { name: 'Canceladas', qtd: 5 },
];

// Custom Tooltip Sóbrio
const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-md border border-gray-200 text-sm">
        <p className="text-gray-800 font-bold mb-2 border-b border-gray-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const nameStr = entry.name ? String(entry.name).toLowerCase() : '';
          const isMoney = nameStr.includes('gasolina') || nameStr.includes('almoço');
          return (
            <div key={index} className="flex justify-between items-center gap-4 py-0.5">
              <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{isMoney ? `R$ ${entry.value},00` : entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function DashboardView() {
  const [selectedYearlyClient, setSelectedYearlyClient] = useState('Geral');
  const [selectedMonth, setSelectedMonth] = useState('Setembro');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      toast.success('Gerando Relatório Gerencial em PDF...');
      const doc = new jsPDF();
      const startY = await addSystemPDFHeader(doc, `Relatório Gerencial de Indicadores - ${selectedMonth}`);

      // Resumo Executivo
      autoTable(doc, {
        startY: startY + 5,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
        head: [['Indicador de Performance', 'Valor / Métrica']],
        body: [
          ['Total Inspecionado no Mês', '141 Ordens de Serviço'],
          ['Cliente Destaque', 'CORACORTHE (45 O.S.)'],
          ['Total de Reembolsos do Mês', 'R$ 2.610,00'],
          ['Efetivo Técnico em Campo', '8 Inspetores Ativos'],
          ['Meta de Aderência Operacional', '94.2% Concluído com Sucesso']
        ]
      });

      let currentY = (doc as any).lastAutoTable?.finalY || 120;

      // Volume por Cliente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Volume de Ordens por Cliente", 14, currentY + 12);

      autoTable(doc, {
        startY: currentY + 16,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
        head: [['Cliente', 'Volume (O.S.)', 'Participação']],
        body: CLIENT_DATA.map(c => [
          c.name,
          String(c.qtd),
          `${Math.round((c.qtd / 141) * 100)}%`
        ])
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;

      // Distribuição da Carga por Inspetor
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Distribuição de Carga de Trabalho dos Inspetores", 14, currentY + 12);

      autoTable(doc, {
        startY: currentY + 16,
        theme: 'striped',
        headStyles: { fillColor: [75, 85, 99], fontStyle: 'bold' },
        head: [['Inspetor', 'Ordens Concluídas no Mês']],
        body: INSPECTOR_DATA.map(i => [i.name, `${i.qtd} O.S.`])
      });

      doc.save(`Relatorio_Gerencial_Indicadores_${selectedMonth}_${Date.now()}.pdf`);
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
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            Relatório Gerencial
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Visão analítica de volume operacionais e custos</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 pl-4 pr-8 py-2 rounded text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer outline-none shadow-sm"
            >
              <option value="Janeiro">Mês: Janeiro</option>
              <option value="Fevereiro">Mês: Fevereiro</option>
              <option value="Março">Mês: Março</option>
              <option value="Abril">Mês: Abril</option>
              <option value="Maio">Mês: Maio</option>
              <option value="Junho">Mês: Junho</option>
              <option value="Julho">Mês: Julho</option>
              <option value="Agosto">Mês: Agosto</option>
              <option value="Setembro">Mês: Setembro</option>
              <option value="Outubro">Mês: Outubro</option>
              <option value="Novembro">Mês: Novembro</option>
              <option value="Dezembro">Mês: Dezembro</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded text-sm font-semibold transition-colors shadow-sm ${
              isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900'
            }`}
          >
            <Download size={14} /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Resumo Executivo (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <Activity size={12} className="mr-1.5" /> Total Inspecionado
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-3xl font-light text-gray-900">141<span className="text-sm text-gray-400 ml-1">O.S.</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <FileText size={12} className="mr-1.5" /> Cliente Destaque
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-xl font-semibold text-gray-900 truncate">CORACORTHE</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <DollarSign size={12} className="mr-1.5" /> Reembolsos Mês
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-2xl font-semibold text-[#1e3a8a]">R$ 2.610</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
            <Users size={12} className="mr-1.5" /> Efetivo em Campo
          </span>
          <div className="flex items-end justify-between mt-auto">
            <h3 className="text-3xl font-light text-gray-900">8<span className="text-sm text-gray-400 ml-1">Insp.</span></h3>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar pr-1">

        {/* Gráfico Macro: Evolução Anual */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-6 border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Calendar size={16} className="mr-2 text-[#1e3a8a]" /> Evolução Anual
              </h2>
              <p className="text-xs text-gray-500 mt-1">Comparativo de ordens executadas mês a mês</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedYearlyClient}
                onChange={(e) => setSelectedYearlyClient(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Geral">Todos os Clientes (Geral)</option>
                <option value="CORACORTHE">CORACORTHE</option>
                <option value="Fábrica ABC">Fábrica ABC</option>
                <option value="Mercado Central">Mercado Central</option>
              </select>
              <div className="text-right border-l border-gray-200 pl-4">
                <h3 className="text-2xl font-light text-gray-900">
                  {selectedYearlyClient === 'Geral' ? '1.051' : selectedYearlyClient === 'CORACORTHE' ? '340' : '285'}
                  <span className="text-sm text-gray-400 ml-1">O.S. (YTD)</span>
                </h3>
              </div>
            </div>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={YEARLY_CHART_DATA[selectedYearlyClient as keyof typeof YEARLY_CHART_DATA] || YEARLY_CHART_DATA['Geral']} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="qtd" name="Total Inspecionado" fill="#1e3a8a" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#1e3a8a', fontSize: 11, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="meta" name="Meta (Aderência)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Gráfico 1: Clientes */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-800">Volume de O.S. por Cliente</h2>
              <p className="text-xs text-gray-500 mt-1">Quantitativo de ordens executadas no mês atual</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CLIENT_DATA} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="qtd" name="Volume (O.S.)" fill="#1e3a8a" radius={[2, 2, 0, 0]} maxBarSize={40} label={{ position: 'top', fill: '#1e3a8a', fontSize: 11, fontWeight: 'bold' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Status das Ordens */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-800">Status das Inspeções</h2>
              <p className="text-xs text-gray-500 mt-1">Acompanhamento do andamento das O.S. no mês</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STATUS_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="qtd" name="Volume" fill="#64748b" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Gráfico 3: Produção de Inspetores (Tabela + Donut) */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
          <div className="mb-6 border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Distribuição de Carga de Trabalho</h2>
            <p className="text-xs text-gray-500 mt-1">Volume total executado por cada inspetor da equipe</p>
          </div>
          
          <div className="flex flex-col md:flex-row h-[280px]">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={INSPECTOR_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="qtd"
                  >
                    {INSPECTOR_DATA.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORPORATE_COLORS[index % CORPORATE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CorporateTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-8">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium">
                    <th className="pb-2 font-semibold text-xs uppercase tracking-wider">Inspetor</th>
                    <th className="pb-2 font-semibold text-xs uppercase tracking-wider text-right">Ordens (Mês)</th>
                  </tr>
                </thead>
                <tbody>
                  {INSPECTOR_DATA.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: CORPORATE_COLORS[idx % CORPORATE_COLORS.length] }}></div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{item.qtd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
