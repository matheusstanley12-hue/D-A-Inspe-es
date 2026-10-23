import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { FileText, Activity, Users, Package, Navigation, Zap } from 'react-feather';
import { 
  getServiceOrders, ORDERS_CHANGE_EVENT, type ServiceOrder,
  getFormResponses, RESPONSES_CHANGE_EVENT, type FormResponse
} from './stores/formulariosStore';

const CORPORATE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-md border border-gray-200 text-xs">
        <p className="text-gray-800 font-bold mb-1 border-b border-gray-100 pb-1">{label}</p>
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

export default function ClientDashboardView({ 
  supplierName,
  clientName 
}: { 
  supplierName?: string;
  clientName?: string;
}) {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => getServiceOrders());
  const [responses, setResponses] = useState<FormResponse[]>(() => getFormResponses());

  useEffect(() => {
    const updateOrd = () => setOrders(getServiceOrders());
    const updateResp = () => setResponses(getFormResponses());

    window.addEventListener(ORDERS_CHANGE_EVENT, updateOrd);
    window.addEventListener(RESPONSES_CHANGE_EVENT, updateResp);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, updateOrd);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, updateResp);
    };
  }, []);

  const filterTarget = supplierName || clientName;

  // Filtrar ordens e laudos
  const relevantOrders = filterTarget && filterTarget !== 'Portal do Cliente'
    ? orders.filter(o => o.client.toLowerCase().includes(filterTarget.toLowerCase()) || filterTarget.toLowerCase().includes(o.client.toLowerCase()))
    : orders;

  const relevantResponses = filterTarget && filterTarget !== 'Portal do Cliente'
    ? responses.filter(r => {
        const c = r.answers?.os_cliente || r.answers?.empresa || '';
        return c.toLowerCase().includes(filterTarget.toLowerCase()) || filterTarget.toLowerCase().includes(c.toLowerCase());
      })
    : responses;

  // Cálculo de KPIs reais
  const todayStr = new Date().toISOString().split('T')[0];
  const osDia = relevantOrders.filter(o => o.date === todayStr && o.status === 'Concluída').length +
                relevantResponses.filter(r => r.submittedAt.startsWith(todayStr)).length;

  const osMes = relevantOrders.filter(o => o.status === 'Concluída').length + relevantResponses.length;

  const pecas = relevantResponses.reduce((acc, r) => acc + (parseInt(r.answers?.['f1_2'] || '1', 10) || 1), 0);

  const emExecucao = relevantOrders.filter(o => o.status === 'Em Andamento').length;

  const fornecedoresCount = Array.from(new Set([
    ...relevantOrders.map(o => o.client),
    ...relevantResponses.map(r => r.answers?.os_cliente || r.answers?.empresa || '')
  ])).filter(Boolean).length;

  const kmTotal = osMes * 24; // estimativa de deslocamento real médio

  // Status breakdown
  const statusCounts: Record<string, number> = {
    'Concluídas': osMes,
    'Em Atendimento': emExecucao,
    'Agendadas': relevantOrders.filter(o => o.status === 'Agendada').length,
  };
  const STATUS_DATA = Object.entries(statusCounts)
    .filter(([_, qtd]) => qtd > 0)
    .map(([name, qtd]) => ({ name, qtd }));

  // Inspetores que atenderam
  const inspectorMap: Record<string, number> = {};
  relevantOrders.forEach(o => {
    inspectorMap[o.inspector] = (inspectorMap[o.inspector] || 0) + 1;
  });
  relevantResponses.forEach(r => {
    inspectorMap[r.inspectorName] = (inspectorMap[r.inspectorName] || 0) + 1;
  });
  const INSPECTOR_DATA = Object.entries(inspectorMap)
    .map(([name, qtd]) => ({ name, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5);

  const KPI_CARDS = [
    {
      title: 'O.S. Concluídas Hoje',
      subtitle: filterTarget ? `Empresa: ${filterTarget}` : 'Total do dia',
      value: String(osDia),
      unit: '',
      icon: <Zap size={20} />,
      color: 'bg-blue-600',
      border: 'border-blue-100',
    },
    {
      title: 'O.S. Concluídas Total',
      subtitle: 'Laudos e inspeções finalizadas',
      value: String(osMes),
      unit: '',
      icon: <FileText size={20} />,
      color: 'bg-indigo-500',
      border: 'border-indigo-100',
    },
    {
      title: 'Peças Inspecionadas',
      subtitle: 'Registradas nos laudos',
      value: pecas.toLocaleString('pt-BR'),
      unit: 'pçs',
      icon: <Package size={20} />,
      color: 'bg-emerald-500',
      border: 'border-emerald-100',
    },
    {
      title: 'Km Rodados Estimados',
      subtitle: 'Deslocamento da equipe',
      value: kmTotal.toLocaleString('pt-BR'),
      unit: 'km',
      icon: <Navigation size={20} />,
      color: 'bg-amber-500',
      border: 'border-amber-100',
    },
    {
      title: 'Unidades Atendidas',
      subtitle: 'Clientes e filiais',
      value: String(fornecedoresCount),
      unit: '',
      icon: <Users size={20} />,
      color: 'bg-violet-500',
      border: 'border-violet-100',
    },
    {
      title: 'Em Atendimento Agora',
      subtitle: 'Serviços em campo hoje',
      value: String(emExecucao),
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
          <p className="text-sm text-gray-500 mt-1">Acompanhamento das suas ordens de serviço e indicadores operacionais em tempo real.</p>
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

      {/* Gráficos Operacionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status das O.S. */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900 mb-1">Status Operacional</h2>
          <p className="text-xs text-gray-400 mb-6">Distribuição das ordens de serviço.</p>
          {STATUS_DATA.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="qtd"
                  >
                    {STATUS_DATA.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORPORATE_COLORS[index % CORPORATE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CorporateTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {STATUS_DATA.map((s, idx) => (
                  <div key={s.name} className="flex items-center text-xs">
                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: CORPORATE_COLORS[idx % CORPORATE_COLORS.length] }}></span>
                    <span className="text-gray-600 font-medium">{s.name}: <strong>{s.qtd}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              Nenhuma ordem de serviço registrada ainda.
            </div>
          )}
        </div>

        {/* Inspetores Responsáveis */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900 mb-1">Inspetores em Campo</h2>
          <p className="text-xs text-gray-400 mb-6">Ordens e laudos atendidos por profissional.</p>
          {INSPECTOR_DATA.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INSPECTOR_DATA} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <RechartsTooltip content={<CorporateTooltip />} />
                  <Bar dataKey="qtd" name="Atendimentos" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              Nenhum atendimento realizado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
