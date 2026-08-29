import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Menu, ChevronDown, Plus, Bell, Calendar as CalendarIcon, Map, DollarSign, List, Briefcase } from 'react-feather';
import Login from './Login';

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

// Mock events based on the image
const mockEvents: Event[] = [
  {
    title: 'Weir - Mirella',
    start: new Date(new Date().setHours(7, 13, 0, 0)),
    end: new Date(new Date().setHours(8, 13, 0, 0)),
    resource: { color: 'bg-gray-400' },
  },
  {
    title: 'JRDL usinagem',
    start: new Date(new Date().setHours(7, 25, 0, 0)),
    end: new Date(new Date().setHours(8, 25, 0, 0)),
    resource: { color: 'bg-blue-400' },
  },
  {
    title: 'CQ INSPSOLDA - Fab...',
    start: new Date(new Date().setHours(8, 3, 0, 0)),
    end: new Date(new Date().setHours(9, 3, 0, 0)),
    resource: { color: 'bg-red-400' },
  },
  {
    title: 'MACFAB - Luigi As...',
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(7, 26, 0, 0)),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(8, 26, 0, 0)),
    resource: { color: 'bg-orange-400' },
  },
  {
    title: 'MocoEng - Renan...',
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(7, 3, 0, 0)),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(8, 3, 0, 0)),
    resource: { color: 'bg-yellow-400' },
  },
  {
    title: 'JRDL usinagem...',
    start: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(7, 24, 0, 0)),
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(8, 24, 0, 0)),
    resource: { color: 'bg-gray-400' },
  },
];

// Custom Event Component for React Big Calendar
const CustomEvent = (props: any) => {
  const { event } = props;
  const time = format(event.start, 'H:mm');
  const colorClass = event.resource?.color || 'bg-blue-500';

  return (
    <div className="flex items-center text-xs truncate py-0.5 px-1 w-full text-gray-700 hover:bg-gray-100 rounded">
      <div className={`w-2 h-2 rounded-full mr-1.5 shrink-0 ${colorClass}`}></div>
      <span className="font-bold mr-1">{time}</span>
      <span className="truncate">{event.title}</span>
    </div>
  );
};

function AgendaView() {
  const [activeMenu, setActiveMenu] = useState('Agenda');
  const [isOperacaoOpen, setIsOperacaoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top Navbar - Blue instead of purple */}
      <header className="bg-blue-700 text-white flex items-center justify-between px-4 h-14 shadow-md z-10">
        <div className="flex items-center space-x-6 h-full">
          {/* Logo Placeholder */}
          <div className="flex items-center justify-center h-8 bg-white px-2 rounded font-bold text-sm">
            <img src="/logo.jpg" alt="Logo" className="h-6 object-contain" />
          </div>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center h-full">
            <div className="relative h-full">
              <button 
                className="flex items-center h-full px-4 bg-blue-800 hover:bg-blue-900 transition-colors"
                onClick={() => setIsOperacaoOpen(!isOperacaoOpen)}
              >
                <span>Operação</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
              
              {/* Dropdown Operação */}
              {isOperacaoOpen && (
                <div className="absolute top-14 left-0 w-48 bg-white text-gray-800 shadow-lg rounded-b-md border border-gray-200 overflow-hidden">
                  <div className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer text-blue-700 font-medium">
                    <CalendarIcon size={16} className="mr-3" />
                    Agenda
                  </div>
                  <div className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-600">
                    <Briefcase size={16} className="mr-3" />
                    Projetos <span className="ml-auto bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">Novo</span>
                  </div>
                  <div className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-600">
                    <Map size={16} className="mr-3" />
                    Mapa
                  </div>
                  <div className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-600">
                    <DollarSign size={16} className="mr-3" />
                    Orçamentos
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center h-full px-4 hover:bg-blue-600 transition-colors">
              Cadastros <ChevronDown size={16} className="ml-1" />
            </button>
            <button className="flex items-center h-full px-4 hover:bg-blue-600 transition-colors">
              Financeiro <ChevronDown size={16} className="ml-1" />
            </button>
            <button className="flex items-center h-full px-4 hover:bg-blue-600 transition-colors">
              Relatórios <ChevronDown size={16} className="ml-1" />
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button className="hidden md:flex items-center text-sm hover:text-blue-200">
            <Plus size={16} className="mr-1" /> Nova Tarefa
          </button>
          <button className="hover:text-blue-200 relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="flex items-center text-sm font-medium hover:text-blue-200">
            D&A INSPEÇÕES <ChevronDown size={16} className="ml-1" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button className="px-4 py-1.5 text-sm rounded bg-white shadow-sm font-medium text-gray-700">Lista</button>
              <button className="px-4 py-1.5 text-sm rounded text-gray-600 hover:text-gray-900 font-medium">Calendário</button>
              <button className="px-4 py-1.5 text-sm rounded text-gray-600 hover:text-gray-900 font-medium">Linha do tempo</button>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex items-center bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">
                <Plus size={16} className="mr-2" /> Adicionar tarefa
              </button>
              <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                <List size={16} className="mr-2" /> Filtros
              </button>
              <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors">
                <Menu size={16} className="mr-2" /> Mais ações
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <Calendar
              localizer={localizer}
              events={mockEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              culture="pt-BR"
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia"
              }}
              components={{
                event: CustomEvent,
              }}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Button (like the one in the corner) */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-800 transition-colors z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = (email: string, pass: string) => {
    // Hardcoded credentials for the hidden developer account
    if (email === 'matheus.stanley12@gmail.com' && pass === '35215415Ab@') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('E-mail ou senha incorretos.');
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <AgendaView />
      ) : (
        <Login onLogin={handleLogin} error={loginError} />
      )}
    </>
  );
}

export default App;
