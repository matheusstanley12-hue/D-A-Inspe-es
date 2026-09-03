import React, { useState } from 'react';
import { LogOut, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, FileText, Download, Search } from 'react-feather';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';
import toast from 'react-hot-toast';

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

export default function ClientPortal({ onLogout }: { onLogout: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

    (doc as any).autoTable({
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
      toast.error('Erro ao gerar o PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1000)); // Simulate sending
      toast.success('E-mail enviado com sucesso para testecliente@gmail.com!');
    } catch (err) {
      toast.error('Erro ao enviar e-mail');
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom event component
  const CustomEvent = ({ event }: any) => {
    const isCompleted = event.status === 'Finalizada';
    return (
      <div className={`text-xs p-1 px-2 h-full w-full font-semibold rounded text-white overflow-hidden text-ellipsis whitespace-nowrap ${isCompleted ? 'bg-emerald-500' : 'bg-[#0066cc]'}`}>
        {event.title}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans">
      
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

      {/* Header */}
      <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center">
          <div className="bg-white p-1 rounded-md border border-gray-100 shadow-sm mr-3">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="text-gray-900 font-extrabold text-[15px] leading-tight">D&A</h1>
            <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">PORTAL DO CLIENTE</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs mr-2">
              TC
            </div>
            <span className="font-medium text-gray-700">Teste Cliente</span>
          </div>
          <button onClick={onLogout} className="font-medium hover:text-red-600 transition-colors flex items-center gap-1">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col">
        
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900">Minhas Inspeções</h2>
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
              event: CustomEvent
            }}
            onSelectEvent={(event) => setSelectedEvent(event)}
            className="custom-calendar text-sm"
          />
        </div>

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
  );
}
