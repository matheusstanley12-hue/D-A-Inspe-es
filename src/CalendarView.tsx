import React, { useState } from 'react';
import { 
  TrendingUp, Users, CheckCircle, Activity, DollarSign, 
  Map, Calendar as CalendarIcon, FileText, ChevronRight, AlertCircle, ArrowUpRight, ArrowDownRight, Clock
} from 'react-feather';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const VOLUME_DATA = [
  { month: 'Jan', concluidas: 45, pendentes: 18 },
  { month: 'Fev', concluidas: 52, pendentes: 20 },
  { month: 'Mar', concluidas: 48, pendentes: 19 },
  { month: 'Abr', concluidas: 61, pendentes: 22 },
  { month: 'Mai', concluidas: 59, pendentes: 24 },
  { month: 'Jun', concluidas: 75, pendentes: 28 },
  { month: 'Jul', concluidas: 82, pendentes: 30 },
  { month: 'Ago', concluidas: 95, pendentes: 35 },
  { month: 'Set', concluidas: 112, pendentes: 38 },
];

const OS_STATUS_DATA = [
  { name: 'Concluídas', value: 345 },
  { name: 'Em Andamento', value: 45 },
  { name: 'Aguardando', value: 20 },
  { name: 'Atrasadas', value: 8 },
];
const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const RECENT_ALERTS = [
  { id: 1, type: 'success', text: 'Meta de faturamento mensal atingida com 5 dias de antecedência.', time: 'Há 2 horas' },
  { id: 2, type: 'warning', text: 'Inspetor João Silva reportou atraso no cliente Fábrica ABC.', time: 'Há 4 horas' },
  { id: 3, type: 'info', text: 'Nova ordem de serviço (Urgente) criada para CORACORTHE.', time: 'Há 5 horas' },
  { id: 4, type: 'error', text: 'Falha na sincronização do boletim OS-2026-004. Verifique a rede.', time: 'Ontem' },
];

// --- CUSTOM TOOLTIP ---
const CorporateTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-lg border border-gray-100 text-sm">
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
  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto pt-2 pb-8 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            Painel de Controle
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Visão estratégica, financeira e operacional do negócio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              import('react-hot-toast').then(({ default: toast }) => {
                toast.success('Relatório gerencial enviado para o seu e-mail.', { duration: 3000 });
              });
            }}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm transition-colors flex items-center"
          >
            <FileText size={16} className="mr-2" /> Gerar Relatório Gerencial
          </button>
        </div>
      </div>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Produtividade Mensal</p>
              <h3 className="text-3xl font-black text-gray-900">112</h3>
              <div className="flex items-center mt-2 text-emerald-600 text-sm font-bold">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+18.3%</span>
                <span className="text-gray-400 font-medium ml-2">vs último mês</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ordens Executadas</p>
              <h3 className="text-3xl font-black text-gray-900">345</h3>
              <div className="flex items-center mt-2 text-emerald-600 text-sm font-bold">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+5.2%</span>
                <span className="text-gray-400 font-medium ml-2">vs último mês</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clientes Ativos</p>
              <h3 className="text-3xl font-black text-gray-900">42</h3>
              <div className="flex items-center mt-2 text-emerald-600 text-sm font-bold">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+2 novos</span>
                <span className="text-gray-400 font-medium ml-2">nesta semana</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avaliação Média</p>
              <h3 className="text-3xl font-black text-gray-900">4.9<span className="text-lg text-gray-400">/5</span></h3>
              <div className="flex items-center mt-2 text-gray-500 text-sm font-medium">
                <span className="text-amber-500 mr-1">★★★★★</span>
                <span>Qualidade Alta</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Volume de Serviços (YTD)</h3>
              <p className="text-sm text-gray-500">Crescimento contínuo de demandas atendidas vs pendentes.</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip content={<CorporateTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke="#0066cc" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                <Area type="monotone" dataKey="pendentes" name="Pendentes" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDespesa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-gray-900">Status Geral das O.S.</h3>
            <p className="text-sm text-gray-500">Distribuição anual de ordens de serviço</p>
          </div>
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={OS_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {OS_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-black text-gray-900">418</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            {OS_STATUS_DATA.map((item, idx) => (
              <div key={item.name} className="flex items-center text-xs">
                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: STATUS_COLORS[idx] }}></div>
                <span className="text-gray-600 truncate flex-1">{item.name}</span>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-gray-900">Alertas e Atividades Recentes</h3>
            <button onClick={() => onNavigate?.('Boletim')} className="text-sm font-bold text-blue-600 hover:text-blue-800">Ver todos</button>
          </div>
          
          <div className="space-y-5">
            {RECENT_ALERTS.map(alert => (
              <div key={alert.id} className="flex gap-4">
                <div className="shrink-0 mt-1">
                  {alert.type === 'success' && <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle size={16} /></div>}
                  {alert.type === 'warning' && <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><AlertCircle size={16} /></div>}
                  {alert.type === 'info' && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Activity size={16} /></div>}
                  {alert.type === 'error' && <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><AlertCircle size={16} /></div>}
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{alert.text}</p>
                  <span className="text-xs text-gray-400 font-medium mt-1 inline-block">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status dos Inspetores Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-gray-900">Status dos Inspetores</h3>
            <button onClick={() => onNavigate?.('Inspetores')} className="text-sm font-bold text-blue-600 hover:text-blue-800">Ver mapa</button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  JS
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">João Silva</p>
                  <p className="text-xs font-medium text-emerald-600 flex items-center">
                    <CheckCircle size={12} className="mr-1" /> Disponível
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400">Sede</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  AC
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Ana Costa</p>
                  <p className="text-xs font-medium text-blue-600 flex items-center">
                    <Activity size={12} className="mr-1" /> Em Atendimento
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400">CORACORTHE</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  MS
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Matheus Stanley</p>
                  <p className="text-xs font-medium text-blue-600 flex items-center">
                    <Activity size={12} className="mr-1" /> Em Atendimento
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400">Fábrica ABC</span>
            </div>
          </div>
        </div>

        {/* Quick Action / Summary */}
        <div className="bg-gradient-to-br from-[#0066cc] to-[#004b99] rounded-2xl shadow-sm p-6 text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Map size={180} />
          </div>
          
          <h3 className="text-xl font-extrabold mb-2 relative z-10">Resumo Operacional de Hoje</h3>
          <p className="text-blue-100 text-sm mb-8 max-w-sm relative z-10">
            A equipe técnica tem 12 visitas programadas para hoje, com foco no Cliente Fábrica ABC na parte da tarde.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Equipe Ativa</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">5</span>
                <span className="text-sm mb-1 opacity-80">Inspetores</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Meta Diária</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">80%</span>
                <span className="text-sm mb-1 opacity-80">Concluído</span>
              </div>
            </div>
          </div>
          
          <button onClick={() => onNavigate?.('CalendarioOperacao')} className="mt-6 w-full bg-white text-[#0066cc] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-lg relative z-10 flex justify-center items-center">
            Acessar Calendário de Operação <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
