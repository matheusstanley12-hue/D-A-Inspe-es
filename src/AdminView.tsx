import React, { useState } from 'react';
import { 
  Search, Home, BarChart2, Calendar, Tool, Clock, Tv, Folder, LogOut,
  CheckSquare, FileText, Settings, PlusSquare, CheckCircle, AlertTriangle, ChevronLeft, Menu, Users, Moon, Sun, FilePlus
} from 'react-feather';
import InspectorManager from './InspectorManager';
import UserManager from './UserManager';
import CalendarView from './CalendarView';
import ServiceOrdersView from './ServiceOrdersView';
import ClientManager from './ClientManager';
import FormulariosView from './FormulariosView';
import ReportsView from './ReportsView';
import DashboardView from './DashboardView';
import BoletimView from './BoletimView';
import OperationCalendarView from './OperationCalendarView';

const AdminView = ({ onLogout }: { onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('Painel Operacional');
  const [isGestaoExpanded, setIsGestaoExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div 
        className={`sidebar-container bg-[#0f172a] text-gray-300 flex flex-col transition-all duration-300 z-20 ${
          isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Header da Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded">
              <img src="/logo.jpg" alt="D&A" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">D&A INSPEÇÕES</h2>
              <p className="text-[10px] text-gray-400">MENU PRINCIPAL</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Busca */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-500" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar menu..." 
              className="w-full bg-[#1e293b] text-sm text-gray-200 placeholder-gray-500 rounded-md py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-6 custom-scrollbar mt-2">
          
          {/* MENU PRINCIPAL */}
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Menu Principal</p>
            <button 
              onClick={() => setActiveMenu('Painel Operacional')}
              className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                activeMenu === 'Painel Operacional' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Home size={16} className="mr-3 shrink-0" /> <span className="truncate">Painel de Controle</span>
            </button>

            <button 
              onClick={() => setActiveMenu('CalendarioOperacao')}
              className={`w-full flex items-center px-3 py-2 rounded-md transition-colors mt-1 text-left ${
                activeMenu === 'CalendarioOperacao' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Calendar size={16} className="mr-3 shrink-0" /> <span className="truncate">Calendário de Operação</span>
            </button>
          </div>

          {/* OPERAÇÃO */}
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Operação</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveMenu('Ordens')}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                  activeMenu === 'Ordens' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <FileText size={16} className="mr-3 shrink-0" /> <span className="truncate">Ordens de Serviço</span>
              </button>

              <button 
                onClick={() => setActiveMenu('Relatorios')}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                  activeMenu === 'Relatorios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <FileText size={16} className="mr-3 shrink-0" /> <span className="truncate">Relatórios de Campo</span>
              </button>

              <button 
                onClick={() => setActiveMenu('Boletim')}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                  activeMenu === 'Boletim' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <Folder size={16} className="mr-3 shrink-0" /> <span className="truncate">Boletim</span>
              </button>

              <button 
                onClick={() => setActiveMenu('Indicadores')}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                  activeMenu === 'Indicadores' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <BarChart2 size={16} className="mr-3 shrink-0" /> <span className="truncate">Indicadores</span>
              </button>

              <button 
                onClick={() => setActiveMenu('Formularios')}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                  activeMenu === 'Formularios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <FilePlus size={16} className="mr-3 shrink-0" /> <span className="truncate">Formulários</span>
              </button>
            </nav>
          </div>

          {/* GESTÃO (Collapsible) */}
          <div className="mt-2">
            <button 
              onClick={() => setIsGestaoExpanded(!isGestaoExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left text-gray-400 hover:bg-[#1e293b] hover:text-white"
            >
              <div className="flex items-center">
                <Settings size={16} className="mr-3 shrink-0" />
                <span className="truncate">Gestão</span>
              </div>
              <ChevronLeft size={16} className={`transition-transform ${isGestaoExpanded ? '-rotate-90' : ''}`} />
            </button>
            
            {isGestaoExpanded && (
              <nav className="space-y-1 mt-1">
                <button 
                  onClick={() => setActiveMenu('Clientes')}
                  className={`w-full flex items-center pl-8 pr-3 py-2 rounded-md transition-colors text-left ${
                    activeMenu === 'Clientes' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                  }`}
                >
                  <Search size={16} className="mr-3 shrink-0" /> <span className="truncate">Gestão de Clientes</span>
                </button>
                
                <button 
                  onClick={() => setActiveMenu('Inspetores')}
                  className={`w-full flex items-center pl-8 pr-3 py-2 rounded-md transition-colors text-left ${
                    activeMenu === 'Inspetores' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                  }`}
                >
                  <Users size={16} className="mr-3 shrink-0" /> <span className="truncate">Gestão de Inspetores</span>
                </button>

                <button 
                  onClick={() => setActiveMenu('Usuarios')}
                  className={`w-full flex items-center pl-8 pr-3 py-2 rounded-md transition-colors text-left ${
                    activeMenu === 'Usuarios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
                  }`}
                >
                  <Users size={16} className="mr-3 shrink-0" /> <span className="truncate">Gestão de Usuários</span>
                </button>
              </nav>
            )}
          </div>

          {/* Outros menus virão aqui */}
        </div>
        
        {/* Logout Bottom */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 rounded-md transition-colors text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold"
          >
            <LogOut size={18} className="mr-3" /> Sair
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#1a1b23]' : 'bg-[#f4f7f9]'}`}>
        
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 transition-colors duration-300 ${isDarkMode ? 'bg-[#1a1b23] border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
          
          {/* Left Side */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-2 rounded-md transition-colors mr-3 ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
            >
              <Menu size={20} />
            </button>
            
            <div className={`p-1 rounded-md border shadow-sm mr-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            
            <div className="mr-6">
              <h1 className={`font-extrabold text-[15px] leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>D&A</h1>
              <p className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>SISTEMA INTELIGENTE DE INSPEÇÕES</p>
            </div>

            <div className={`h-8 w-px mr-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

            <button 
              onClick={() => setActiveMenu('Painel Operacional')}
              className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center shadow-md transition-colors"
            >
              <Home size={16} className="mr-2" /> Início
            </button>
          </div>

          {/* Right Side */}
          <div className={`flex items-center space-x-6 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs mr-2">
                MS
              </div>
              <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Desenvolvedor</span>
            </div>

            <button 
              onClick={() => {
                const html = document.documentElement;
                if (html.classList.contains('dark')) {
                  html.classList.remove('dark');
                  setIsDarkMode(false);
                } else {
                  html.classList.add('dark');
                  setIsDarkMode(true);
                }
              }}
              className={`p-2 border rounded-md transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500'}`}
              title="Alternar Modo Noturno"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={onLogout} className={`font-medium transition-colors ${isDarkMode ? 'hover:text-red-400' : 'hover:text-red-600'}`}>
              Sair
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-auto p-6 relative invert-target">

          {/* Content based on active menu */}
          {activeMenu === 'Painel Operacional' && (
            <CalendarView onNavigate={setActiveMenu} />
          )}

          {activeMenu === 'CalendarioOperacao' && (
            <OperationCalendarView />
          )}

          {activeMenu === 'Ordens' && (
            <ServiceOrdersView />
          )}

          {activeMenu === 'Clientes' && (
            <ClientManager />
          )}
          
          {activeMenu === 'Relatorios' && (
            <ReportsView />
          )}

          {activeMenu === 'Boletim' && (
            <BoletimView />
          )}

          {activeMenu === 'Indicadores' && (
            <DashboardView />
          )}

          {activeMenu === 'Formularios' && (
            <FormulariosView />
          )}

          {activeMenu === 'Usuarios' && (
            <UserManager />
          )}

          {activeMenu === 'Inspetores' && (
            <InspectorManager />
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminView;
