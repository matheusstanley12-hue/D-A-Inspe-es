import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Check, Search, FileText, Tag, MapPin, Clock, User, X } from 'react-feather';
import { 
  getServiceOrders, ORDERS_CHANGE_EVENT, type ServiceOrder,
  getSystemUsers, USERS_CHANGE_EVENT, type SystemUser,
  getFormResponses, RESPONSES_CHANGE_EVENT, type FormResponse
} from './stores/formulariosStore';

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

const COLOR_PALETTE = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export interface OperationEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  inspector: string;
  type: string;
  color: string;
  striped?: boolean;
  os: string;
  status: string;
  taskType: string;
  address: string;
  duration: string;
}

// --- CUSTOM COMPONENTS DECLARED OUTSIDE RENDER ---
const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };
  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };
  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    return (
      <span className="text-xl font-medium text-gray-800 capitalize ml-2">
        {toolbar.label}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:bg-gray-100 p-1.5 rounded transition-colors">
          <CalendarIcon size={18} />
        </button>
        
        <button onClick={goToCurrent} className="text-gray-700 font-semibold text-sm hover:bg-gray-100 px-3 py-1.5 rounded transition-colors flex items-center">
          Hoje <ChevronDown size={14} className="ml-1" />
        </button>
        
        <div className="flex items-center gap-2">
          <button onClick={goToBack} className="text-gray-500 hover:bg-gray-100 p-1 rounded transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={goToNext} className="text-gray-500 hover:bg-gray-100 p-1 rounded transition-colors"><ChevronRight size={20} /></button>
          {label()}
          <ChevronDown size={14} className="ml-1" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <select 
          value={toolbar.view}
          onChange={(e) => toolbar.onView(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-1.5 cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 outline-none"
        >
          <option value="month">Mês</option>
          <option value="week">Semana</option>
          <option value="day">Dia</option>
          <option value="agenda">Agenda</option>
        </select>
      </div>
    </div>
  );
};

const CustomEvent = ({ event }: any) => {
  const isStriped = event.striped;
  
  return (
    <div 
      className={`group relative w-full h-full flex items-center px-1 py-0.5 rounded-sm border-l-4 shadow-sm text-xs cursor-pointer
        ${event.color === 'red' ? 'bg-[#fdf4f4] border-[#d13438] text-[#d13438]' : 'bg-blue-50 border-blue-500 text-blue-700'}
      `}
      style={isStriped ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(209,52,56,0.1) 5px, rgba(209,52,56,0.1) 10px)' } : {}}
    >
      <span className="font-semibold mr-1 shrink-0">{format(event.start, 'HH:mm')}</span>
      <span className="truncate font-medium">{event.title} <span className="text-[10px] opacity-70 ml-1">({event.inspector})</span></span>
      
      {/* Tooltip Hover - Only visible on desktop hover */}
      <div className="absolute hidden lg:group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-white border border-gray-200 shadow-2xl rounded-md p-4 text-gray-700 z-[9999] text-[13px] font-normal cursor-default text-left">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-gray-400 mr-3 shrink-0"></div><span className="font-semibold mr-1">Status:</span> {event.status}</div>
          <div className="flex items-center"><FileText size={14} className="text-gray-600 mr-3 shrink-0" /><span className="font-semibold mr-1">Ordem de Serviço:</span> {event.os}</div>
          <div className="flex items-center"><Tag size={14} className="text-gray-600 mr-3 shrink-0" /><span className="font-semibold mr-1">Tipo de tarefa:</span> {event.taskType}</div>
          <div className="flex items-center"><Check size={14} className="text-gray-600 mr-3 shrink-0" /><span className="font-semibold mr-1">Cliente:</span> {event.title}</div>
          <div className="flex items-start"><MapPin size={14} className="text-gray-600 mr-3 mt-0.5 shrink-0" /><span className="font-semibold mr-1 shrink-0">Endereço:</span> <span className="line-clamp-2">{event.address}</span></div>
          <div className="flex items-center"><Clock size={14} className="text-gray-600 mr-3 shrink-0" /><span className="font-semibold mr-1">Duração real:</span> {event.duration}</div>
          <div className="flex items-center"><User size={14} className="text-gray-600 mr-3 shrink-0" /><span className="font-semibold mr-1">Responsável:</span> {event.inspector}</div>
        </div>
      </div>
    </div>
  );
};

export default function OperationCalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedInspector, setSelectedInspector] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [orders, setOrders] = useState<ServiceOrder[]>(() => getServiceOrders());
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers().filter(u => u.role === 'inspetor'));
  const [responses, setResponses] = useState<FormResponse[]>(() => getFormResponses());

  useEffect(() => {
    const updateOrd = () => setOrders(getServiceOrders());
    const updateUsers = () => setUsers(getSystemUsers().filter(u => u.role === 'inspetor'));
    const updateResp = () => setResponses(getFormResponses());

    window.addEventListener(ORDERS_CHANGE_EVENT, updateOrd);
    window.addEventListener(USERS_CHANGE_EVENT, updateUsers);
    window.addEventListener(RESPONSES_CHANGE_EVENT, updateResp);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, updateOrd);
      window.removeEventListener(USERS_CHANGE_EVENT, updateUsers);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, updateResp);
    };
  }, []);

  const inspectorsList = [
    { id: 'all', name: 'Todos os Inspetores', color: '#1e40af' },
    ...users.map((u, i) => ({
      id: u.id,
      name: u.name,
      color: COLOR_PALETTE[i % COLOR_PALETTE.length]
    }))
  ];

  // Construir eventos de calendário a partir de ordens reais e laudos enviados
  const calendarEvents: OperationEvent[] = [];

  orders.forEach((o, idx) => {
    let startDate = new Date();
    if (o.date) {
      const parts = o.date.split('-');
      if (parts.length === 3) {
        const [h, m] = (o.StartTime || '08:00').split(':').map(Number);
        startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), h || 8, m || 0);
      }
    }
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];

    calendarEvents.push({
      id: o.id,
      title: o.client,
      start: startDate,
      end: endDate,
      inspector: o.inspector,
      type: 'inspection',
      color,
      os: o.code,
      status: o.status,
      taskType: o.type,
      address: o.location || 'Em campo',
      duration: '2h00min'
    });
  });

  responses.forEach((r) => {
    const d = new Date(r.submittedAt);
    if (!isNaN(d.getTime())) {
      const osCode = r.answers?.os_numero || `LAUDO-${r.id.slice(0, 6)}`;
      if (!calendarEvents.some(e => e.os === osCode)) {
        calendarEvents.push({
          id: r.id,
          title: r.answers?.os_cliente || r.answers?.empresa || r.formName,
          start: d,
          end: new Date(d.getTime() + 90 * 60 * 1000),
          inspector: r.inspectorName,
          type: 'inspection',
          color: '#059669',
          os: osCode,
          status: 'Finalizada',
          taskType: r.category || 'Inspeção Técnica',
          address: r.answers?.os_endereco || 'Em campo',
          duration: '1h30min'
        });
      }
    }
  });

  const filteredEvents = calendarEvents.filter(e => 
    selectedInspector === 'all' || e.inspector === inspectorsList.find(i => i.id === selectedInspector)?.name
  );

  const today = new Date();

  // Mini Calendar Helper (Simple Month View)
  const renderMiniCalendar = () => {
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const numDays = new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth(), 1).getDay();
    
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const nums = Array.from({ length: numDays }, (_, i) => i + 1);

    return (
      <div className="w-full mt-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="font-semibold text-gray-800 text-sm">{format(miniCalendarMonth, 'MMMM yyyy', { locale: ptBR })}</span>
          <div className="flex gap-1">
            <ChevronLeft size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => {
              const newDate = subMonths(miniCalendarMonth, 1);
              setMiniCalendarMonth(newDate);
              setSelectedDate(newDate);
            }} />
            <ChevronRight size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => {
              const newDate = addMonths(miniCalendarMonth, 1);
              setMiniCalendarMonth(newDate);
              setSelectedDate(newDate);
            }} />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500 font-medium">
          {days.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {blanks.map(b => <div key={`blank-${b}`}></div>)}
          {nums.map(n => {
            const isToday = n === today.getDate() && miniCalendarMonth.getMonth() === today.getMonth() && miniCalendarMonth.getFullYear() === today.getFullYear();
            const isSelected = n === selectedDate.getDate() && miniCalendarMonth.getMonth() === selectedDate.getMonth() && miniCalendarMonth.getFullYear() === selectedDate.getFullYear();
            
            let btnClass = 'text-gray-700 hover:bg-gray-100';
            if (isToday) {
              btnClass = 'bg-[#5b5fc7] text-white font-bold hover:bg-[#4b4e9f]';
            } else if (isSelected) {
              btnClass = 'bg-gray-200 text-gray-900 font-bold';
            }

            return (
              <div 
                key={n} 
                onClick={() => {
                  const newDate = new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth(), n);
                  setSelectedDate(newDate);
                  setView('day'); // Switch big calendar to day view to see programming
                }}
                className={`w-7 h-7 flex items-center justify-center mx-auto rounded-full cursor-pointer transition-colors ${btnClass}`}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex w-full max-w-[1600px] mx-auto bg-white animate-[fadeIn_0.3s_ease-out]">
      
      {/* Left Sidebar (Teams Style) */}
      <div className="w-64 border-r border-gray-200 flex flex-col pt-4">
        <h2 className="text-xl font-bold text-gray-900 px-5 mb-2">Calendário</h2>
        
        {/* Mini Calendar */}
        <div className="px-3 border-b border-gray-100 pb-4">
          {renderMiniCalendar()}
        </div>

        {/* Agenda Inspetores Filter */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          <div className="mt-2">
            <div className="flex items-center text-sm font-semibold text-gray-600 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded">
              <ChevronDown size={14} className="mr-1.5" /> Agenda dos Inspetores
            </div>
            <div className="mt-1 space-y-1 px-1">
              {inspectorsList.map(insp => (
                <div 
                  key={insp.id}
                  onClick={() => setSelectedInspector(insp.id)}
                  className={`flex items-center px-3 py-2 cursor-pointer rounded-md text-sm ${selectedInspector === insp.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  <div 
                    className="w-4 h-4 rounded-full mr-3 border-2 flex items-center justify-center" 
                    style={{ borderColor: insp.color, backgroundColor: selectedInspector === insp.id ? insp.color : 'transparent' }}
                  >
                    {selectedInspector === insp.id && <Check size={10} color="white" />}
                  </div>
                  <span className="truncate">{insp.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        <style>
          {`
            /* Customizing Big Calendar to look like Teams */
            .rbc-month-view { border: none !important; border-top: 1px solid #e5e7eb !important; }
            .rbc-day-bg { border-left: 1px solid #e5e7eb !important; border-bottom: 1px solid #e5e7eb !important; }
            .rbc-header { border-bottom: 1px solid #e5e7eb !important; border-left: 1px solid #e5e7eb !important; text-align: left; padding: 8px; font-weight: 400; font-size: 13px; color: #616161; }
            .rbc-header:first-child, .rbc-day-bg:first-child { border-left: none !important; }
            .rbc-date-cell { text-align: left; padding: 8px; font-size: 14px; color: #242424; }
            .rbc-today { background-color: #f0f4f8 !important; border: 2px solid #5b5fc7 !important; }
            .rbc-event { background: transparent !important; border: none !important; padding: 0 !important; margin-bottom: 2px; overflow: visible !important; }
            .rbc-row-segment { padding: 0 4px !important; overflow: visible !important; }
            .rbc-row-content { z-index: 10 !important; }
            .rbc-today .rbc-date-cell a { background-color: #5b5fc7; color: white; border-radius: 50%; padding: 4px 6px; font-weight: bold; }
          `}
        </style>
        
        <BigCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          culture="pt-BR"
          date={selectedDate}
          onNavigate={(newDate) => {
            setSelectedDate(newDate);
            setMiniCalendarMonth(newDate); // Mantém o mini calendário sincronizado quando o principal navegar
          }}
          view={view as any}
          onView={(newView) => setView(newView)}
          onSelectEvent={(event) => setSelectedEvent(event)}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            {/* Header */}
            <div className="bg-[#0066cc] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalhes da {selectedEvent.os}</h2>
              <div className="flex items-center space-x-3">
                <button className="text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded border border-white/30 transition-colors">Trocar para versão nova</button>
                <button onClick={() => setSelectedEvent(null)} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              {['Tarefa', 'Monitoramento', 'Equipamentos', 'Orçamentos', 'Valores'].map((tab, i) => (
                <div key={tab} className={`px-4 py-3 text-sm font-semibold cursor-pointer ${i === 0 ? 'text-[#0066cc] border-b-2 border-[#0066cc]' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </div>
              ))}
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="flex items-center"><User size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">De:</span> {selectedEvent.inspector}</div>
                <div className="flex items-center"><User size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Para:</span> {selectedEvent.inspector}</div>
                
                <div className="flex items-center"><CalendarIcon size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Data da tarefa:</span> {format(selectedEvent.start, 'dd/MM/yyyy')} às {format(selectedEvent.start, 'HH:mm')}</div>
                <div className="flex items-center"><span className="font-bold text-gray-400 mr-3 text-lg shrink-0">!</span> <span className="font-semibold mr-1">Prioridade:</span> Alta</div>
                
                <div className="flex items-center"><Tag size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Tipo:</span> {selectedEvent.taskType}</div>
                <div className="flex items-center"><FileText size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Questionário padrão:</span> Checklist Padrão</div>
                
                <div className="flex items-center"><Clock size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Duração informada:</span> {selectedEvent.duration}</div>
                <div className="flex items-center"><MapPin size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1 shrink-0">Endereço:</span> <span className="truncate">{selectedEvent.address}</span></div>
                
                <div className="flex items-center"><Tag size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Orientação:</span> Inspeção Geral</div>
                <div className="flex items-center"><Check size={16} className="text-gray-400 mr-3 shrink-0" /> <span className="font-semibold mr-1">Código externo:</span> - </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <button className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm">
                  <Search size={16} className="mr-2" /> Mais informações
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium flex items-center transition-colors">
                <X size={16} className="mr-2" /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
