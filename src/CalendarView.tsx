import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, CheckCircle, Activity, 
  Map, FileText, ChevronRight, ArrowUpRight
} from 'react-feather';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { 
  getServiceOrders, ORDERS_CHANGE_EVENT, type ServiceOrder,
  getFormResponses, RESPONSES_CHANGE_EVENT, type FormResponse,
  getClients, CLIENTS_CHANGE_EVENT, type SystemClient,
  getSystemUsers, USERS_CHANGE_EVENT, type SystemUser
} from './stores/formulariosStore';

const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// Custom Tooltip
const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-lg border border-gray-100 text-xs">
        <p className="font-bold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-1">
            <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
            <span className="font-bold text-gray-900">
              {entry.value.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CalendarView({ onNavigate }: { onNavigate?: (menu: string) => void }) {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => getServiceOrders());
  const [responses, setResponses] = useState<FormResponse[]>(() => getFormResponses());
  const [clients, setClients] = useState<SystemClient[]>(() => getClients());
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers());

  useEffect(() => {
    const update = () => {
      setOrders(getServiceOrders());
      setResponses(getFormResponses());
      setClients(getClients());
      setUsers(getSystemUsers());
    };

    window.addEventListener(ORDERS_CHANGE_EVENT, update);
    window.addEventListener(RESPONSES_CHANGE_EVENT, update);
    window.addEventListener(CLIENTS_CHANGE_EVENT, update);
    window.addEventListener(USERS_CHANGE_EVENT, update);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, update);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, update);
      window.removeEventListener(CLIENTS_CHANGE_EVENT, update);
      window.removeEventListener(USERS_CHANGE_EVENT, update);
    };
  }, []);

  const totalConcluidas = orders.filter(o => o.status === 'Concluída').length + responses.length;
  const totalEmAndamento = orders.filter(o => o.status === 'Em Andamento').length;
  const totalAgendadas = orders.filter(o => o.status === 'Agendada').length;
  const totalClientes = clients.length;
  const totalInspetores = users.filter(u => u.role === 'inspetor').length || 1;

  const osStatusData = [
    { name: 'Concluídas', value: totalConcluidas },
    { name: 'Em Andamento', value: totalEmAndamento },
    { name: 'Agendadas', value: totalAgendadas },
  ].filter(s => s.value > 0);

  // Evolução últimos meses
  const monthsAbbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const curMonth = new Date().getMonth();
  const volumeData = monthsAbbr.slice(Math.max(0, curMonth - 5), curMonth + 1).map((m, i) => ({
    month: m,
    concluidas: i === Math.min(5, curMonth) ? totalConcluidas : 0,
    pendentes: i === Math.min(5, curMonth) ? (totalEmAndamento + totalAgendadas) : 0,
  }));

  const inspectorsList = users.filter(u => u.role === 'inspetor');

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto pt-2 pb-8 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            Painel de Controle
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Visão estratégica, financeira e operacional do negócio em tempo real</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              onNavigate?.('RelatoriosGerenciais');
              toast.success('Direcionando para Relatórios Gerenciais.');
            }}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-xs transition-colors flex items-center cursor-pointer"
          >
            <FileText size={16} className="mr-2 text-blue-600" /> Relatório Gerencial
          </button>
        </div>
      </div>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Executado</p>
              <h3 className="text-3xl font-black text-gray-900">{totalConcluidas}</h3>
              <div className="flex items-center mt-2 text-emerald-600 text-xs font-bold">
                <ArrowUpRight size={14} className="mr-1" />
                <span>Laudos e O.S. Concluídas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Em Atendimento</p>
              <h3 className="text-3xl font-black text-gray-900">{totalEmAndamento}</h3>
              <div className="flex items-center mt-2 text-blue-600 text-xs font-bold">
                <Activity size={14} className="mr-1" />
                <span>Equipes em campo agora</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clientes Cadastrados</p>
              <h3 className="text-3xl font-black text-gray-900">{totalClientes}</h3>
              <div className="flex items-center mt-2 text-purple-600 text-xs font-bold">
                <Users size={14} className="mr-1" />
                <span>Empresas parceiras ativas</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Inspetores Ativos</p>
              <h3 className="text-3xl font-black text-gray-900">{totalInspetores}</h3>
              <div className="flex items-center mt-2 text-amber-600 text-xs font-bold">
                <Map size={14} className="mr-1" />
                <span>Profissionais com app</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Volume de Ordens de Serviço</h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">Evolução de laudos e atendimentos técnicos</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CorporateTooltip />} />
                <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConcluidas)" />
                <Area type="monotone" dataKey="pendentes" name="Em Aberto" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPendentes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Status Operacional</h3>
            <p className="text-xs font-medium text-gray-400 mt-0.5">Distribuição das O.S. no sistema</p>
          </div>
          {osStatusData.length > 0 ? (
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {osStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CorporateTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-gray-400">
              Nenhuma ordem cadastrada no momento.
            </div>
          )}
          <div className="text-center pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Total no Sistema: <strong>{totalConcluidas + totalEmAndamento + totalAgendadas} O.S.</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status dos Inspetores Widget */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-gray-900">Inspetores Cadastrados</h3>
            <button onClick={() => onNavigate?.('Inspetores')} className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer">Ver mapa</button>
          </div>
          
          <div className="flex-1 space-y-3">
            {inspectorsList.length > 0 ? (
              inspectorsList.map((insp) => {
                const activeOrder = orders.find(o => o.inspector.toLowerCase().includes(insp.name.toLowerCase()) && o.status === 'Em Andamento');
                const isOnline = !!activeOrder;
                return (
                  <div key={insp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {insp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{insp.name}</p>
                        <p className="text-xs font-medium text-emerald-600 flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          {isOnline ? `Em atendimento: ${activeOrder?.client}` : 'Disponível'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {isOnline ? activeOrder?.type : 'Pronto p/ campo'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Nenhum inspetor cadastrado.</p>
            )}
          </div>
        </div>

        {/* Quick Action / Summary */}
        <div className="bg-gradient-to-br from-[#0066cc] to-[#004b99] rounded-2xl shadow-xs p-6 text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Map size={180} />
          </div>
          
          <h3 className="text-xl font-extrabold mb-2 relative z-10">Operação em Tempo Real</h3>
          <p className="text-blue-100 text-xs mb-8 max-w-sm relative z-10 leading-relaxed">
            Ordens e laudos preenchidos em campo pelo aplicativo móvel dos inspetores são transmitidos e sincronizados instantaneamente com o painel web.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">Equipe Técnica</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">{totalInspetores}</span>
                <span className="text-xs mb-1 opacity-80">Inspetores</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">Em Atendimento</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">{totalEmAndamento}</span>
                <span className="text-xs mb-1 opacity-80">O.S. ativas</span>
              </div>
            </div>
          </div>
          
          <button onClick={() => onNavigate?.('CalendarioOperacao')} className="mt-6 w-full bg-white text-[#0066cc] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg relative z-10 flex justify-center items-center cursor-pointer text-sm">
            Acessar Calendário de Operação <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
