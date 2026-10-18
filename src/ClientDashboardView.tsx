import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, ComposedChart 
} from 'recharts';
import { FileText, Activity, Users, Package, Navigation, Zap } from 'react-feather';

const CORPORATE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-md border border-gray-200 text-sm">
        <p className="text-gray-800 font-bold mb-2 border-b border-gray-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mt-1">
            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
            <span className="text-gray-600 mr-2">{entry.name}:</span>
            <span className="font-semibold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ClientDashboardView({ supplierName }: { supplierName?: string }) {
  // Gera um multiplicador estável (0.3 a 1.5) baseado no nome do fornecedor para simular dados diferentes
  const hash = supplierName ? supplierName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const multiplier = supplierName ? 0.3 + ((hash % 120) / 100) : 1;

  const KPI_SIM = {
    osDia: Math.max(1, Math.round(8 * multiplier)),
    osMes: Math.max(1, Math.round(45 * multiplier)),
    pecas: Math.max(1, Math.round(1240 * multiplier)),
    km: Math.max(1, Math.round(3872 * multiplier)),
    fornecedores: Math.max(1, Math.round(12 * multiplier)),
    emExecucao: Math.max(0, Math.round(5 * multiplier)),
  };

  const YEARLY_CHART_DATA = [
    { month: 'Jan', qtd: Math.round(28 * multiplier), meta: Math.round(30 * multiplier) },
    { month: 'Fev', qtd: Math.round(35 * multiplier), meta: Math.round(30 * multiplier) },
    { month: 'Mar', qtd: Math.round(42 * multiplier), meta: Math.round(35 * multiplier) },
    { month: 'Abr', qtd: Math.round(38 * multiplier), meta: Math.round(35 * multiplier) },
    { month: 'Mai', qtd: Math.round(50 * multiplier), meta: Math.round(40 * multiplier) },
    { month: 'Jun', qtd: Math.round(47 * multiplier), meta: Math.round(40 * multiplier) },
    { month: 'Jul', qtd: Math.round(55 * multiplier), meta: Math.round(45 * multiplier) },
    { month: 'Ago', qtd: Math.round(60 * multiplier), meta: Math.round(50 * multiplier) },
    { month: 'Set', qtd: Math.round(45 * multiplier), meta: Math.round(50 * multiplier) },
    { month: 'Out', qtd: null, meta: Math.round(55 * multiplier) },
    { month: 'Nov', qtd: null, meta: Math.round(55 * multiplier) },
    { month: 'Dez', qtd: null, meta: Math.round(60 * multiplier) },
  ];

  const INSPECTOR_DATA = [
    { name: 'João Silva', qtd: Math.round(32 * multiplier) },
    { name: 'Ana Costa', qtd: Math.round(28 * multiplier) },
    { name: 'Carlos R.', qtd: Math.round(19 * multiplier) },
    { name: 'Maria S.', qtd: Math.round(14 * multiplier) },
  ];

  const STATUS_DATA = [
    { name: 'Finalizadas', qtd: Math.round(38 * multiplier) },
    { name: 'Em Atendimento', qtd: Math.round(5 * multiplier) },
    { name: 'Agendadas', qtd: Math.round(12 * multiplier) },
    { name: 'Canceladas', qtd: Math.round(2 * multiplier) },
  ];

  const KPI_CARDS = [
    {
      title: 'O.S. Executadas Hoje',
      subtitle: supplierName ? `Apenas de ${supplierName}` : 'Apenas da sua empresa',
      value: String(KPI_SIM.osDia),
      unit: '',
      icon: <Zap size={20} />,
      color: 'bg-blue-600',
      border: 'border-blue-100',
    },
    {
      title: 'O.S. no Mês',
      subtitle: 'Total de ordens executadas',
      value: String(KPI_SIM.osMes),
      unit: '',
      icon: <FileText size={20} />,
      color: 'bg-indigo-500',
      border: 'border-indigo-100',
    },
    {
      title: 'Peças Inspecionadas',
      subtitle: 'Acumulado do mês',
      value: KPI_SIM.pecas.toLocaleString('pt-BR'),
      unit: 'pçs',
      icon: <Package size={20} />,
      color: 'bg-emerald-500',
      border: 'border-emerald-100',
    },
    {
      title: 'Km Rodados no Mês',
      subtitle: 'Total percorrido pelos inspetores',
      value: KPI_SIM.km.toLocaleString('pt-BR'),
      unit: 'km',
      icon: <Navigation size={20} />,
      color: 'bg-amber-500',
      border: 'border-amber-100',
    },
    {
      title: 'Fornecedores Visitados',
      subtitle: 'Atendidos no mês',
      value: String(KPI_SIM.fornecedores),
      unit: '',
      icon: <Users size={20} />,
      color: 'bg-violet-500',
      border: 'border-violet-100',
    },
    {
      title: 'Em Execução Agora',
      subtitle: 'Serviços em andamento hoje',
      value: String(KPI_SIM.emExecucao),
      unit: '',
      icon: <Activity size={20} />,
      color: 'bg-rose-500',
      border: 'border-rose-100',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col font-sans pb-12">
      {!supplierName && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento das suas ordens de serviço e indicadores operacionais.</p>
        </div>
      )}

      {/* KPIs Principais — 6 cards em 3 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {KPI_CARDS.map((kpi, index) => (
          <div key={index} className={`bg-white rounded-xl border ${kpi.border} border-2 p-5 shadow-sm flex items-center gap-4`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">{kpi.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{kpi.subtitle}</p>
              <p className="text-3xl font-extrabold text-gray-900 leading-none mt-1">
                {kpi.value}
                {kpi.unit && <span className="text-base font-semibold text-gray-400 ml-1">{kpi.unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico Principal */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-800">Evolução Mensal de O.S.</h2>
            <p className="text-xs text-gray-500 mt-1">Comparativo de execuções mensais</p>
          </div>
          <div className="text-right border-l border-gray-200 pl-4">
            <h3 className="text-2xl font-light text-gray-900">
              {KPI_SIM.osMes} <span className="text-sm text-gray-400 ml-1">O.S. (YTD)</span>
            </h3>
          </div>
        </div>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={YEARLY_CHART_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={32}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#eff6ff'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="qtd" name="Total Inspecionado" fill="url(#barGradient)" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#3b82f6', fontSize: 11, fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="meta" name="Meta (Aderência)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} strokeDasharray="5 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico 2: Status das Ordens */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="mb-6 border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Status das Inspeções</h2>
            <p className="text-xs text-gray-500 mt-1">Acompanhamento do andamento das O.S. no mês</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STATUS_DATA} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <RechartsTooltip content={<CorporateTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="qtd" name="Volume" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fontWeight: 'bold' }}>
                  {STATUS_DATA.map((_, index) => {
                    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Produção de Inspetores */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
          <div className="mb-6 border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Distribuição por Inspetor</h2>
            <p className="text-xs text-gray-500 mt-1">Volume executado na sua empresa por inspetor</p>
          </div>
          
          <div className="flex flex-col md:flex-row h-[300px]">
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
                    <th className="pb-2 font-semibold text-xs uppercase tracking-wider text-right">O.S.</th>
                  </tr>
                </thead>
                <tbody>
                  {INSPECTOR_DATA.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: CORPORATE_COLORS[idx % CORPORATE_COLORS.length] }}></div>
                        <span className="font-medium text-gray-400">{item.name}</span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-400">{item.qtd}</td>
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
