import { useState } from 'react';
import { Folder, FileText, ChevronLeft, Search, Calendar, Download } from 'react-feather';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Mock Data
const MOCK_CLIENTS = [
  { id: '1', name: 'CORACORTHE', document: '12.345.678/0001-90', reportCount: 15 },
  { id: '2', name: 'Fábrica ABC', document: '98.765.432/0001-10', reportCount: 8 },
  { id: '3', name: 'Mercado Central', document: '55.666.777/0001-22', reportCount: 3 }
];

const MOCK_REPORTS = [
  { id: '101', osNumber: '1', clientId: '1', date: new Date(2026, 8, 1, 14, 30), inspector: 'João Silva', type: 'Diligenciamento Q' },
  { id: '102', osNumber: '2', clientId: '1', date: new Date(2026, 8, 2, 9, 15), inspector: 'Maria Souza', type: 'Inspeção Dimensional' },
  { id: '103', osNumber: '3', clientId: '2', date: new Date(2026, 8, 3, 10, 0), inspector: 'Matheus Stanley', type: 'Relatório Fotográfico' },
];

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';

export default function ReportsView() {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  // Filtros de Relatórios
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const handleDownloadPDF = async (reportId: string, osNumber: string) => {
    toast.success(`Gerando relatório da O.S. ${osNumber}...`, { duration: 2000 });
    
    try {
      const doc = new jsPDF();
      await addSystemPDFHeader(doc, `Relatório de Inspeção - O.S. ${osNumber}`);
      
      const report = MOCK_REPORTS.find(r => r.id === reportId);
      
      if (report) {
        autoTable(doc, {
          startY: 65,
          theme: 'grid',
          headStyles: { fillColor: [0, 102, 204], fontStyle: 'bold' },
          head: [['Data', 'Inspetor', 'Tipo de Inspeção']],
          body: [
            [
              format(report.date, 'dd/MM/yyyy HH:mm'),
              report.inspector,
              report.type
            ]
          ]
        });

        // Add some dummy content to simulate the report
        const finalY = (doc as any).lastAutoTable?.finalY || 65;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Conclusão do Relatório", 14, finalY + 15);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lorem = "A inspeção foi realizada conforme os procedimentos estabelecidos. Não foram encontradas anomalias significativas. Os equipamentos estão operando dentro dos parâmetros de normalidade esperados para esta fase. Recomenda-se a continuidade do plano de manutenção.";
        const splitLorem = doc.splitTextToSize(lorem, 180);
        doc.text(splitLorem, 14, finalY + 22);
      }

      doc.save(`Relatorio_OS_${osNumber}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  // Se nenhum cliente estiver selecionado, mostra a tela de Pastas
  if (!selectedClient) {
    return (
      <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative animate-[fadeIn_0.2s_ease-out]">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Folder className="mr-3 text-blue-600" size={28} />
            Relatórios por Cliente
          </h1>
          <p className="text-base text-gray-500 mt-1">Acesse o histórico completo de inspeções organizados por cliente.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {MOCK_CLIENTS.map(client => (
            <div 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                <Folder size={40} className="text-blue-500 fill-blue-100" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{client.name}</h3>
              <p className="text-xs font-bold text-gray-400 mb-3">{client.document}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 w-full flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 flex items-center">
                  <FileText size={14} className="mr-1.5" /> {client.reportCount} relatórios
                </span>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
                  <ChevronLeft size={14} className="rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tela de Arquivos dentro do Cliente selecionado
  const clientReports = MOCK_REPORTS.filter(r => r.clientId === selectedClient.id)
    .filter(r => 
      (searchTerm === '' || r.osNumber.includes(searchTerm) || r.inspector.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (dateFilter === '' || format(r.date, 'yyyy-MM-dd') === dateFilter)
    );

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative animate-[slideIn_0.2s_ease-out]">
      
      {/* Header Cliente */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <button 
            onClick={() => setSelectedClient(null)}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 mb-3 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" /> Voltar para Pastas
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Folder className="mr-3 text-blue-600 fill-blue-100" size={28} />
            {selectedClient.name}
          </h1>
          <p className="text-base text-gray-500 mt-1">CNPJ: {selectedClient.document}</p>
        </div>
      </div>

      {/* Toolbar de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Buscar Relatório</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Nº da O.S. ou Inspetor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors outline-none"
            />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Filtrar por Data</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>

        {(searchTerm || dateFilter) && (
          <button 
            onClick={() => { setSearchTerm(''); setDateFilter(''); }}
            className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Lista de Relatórios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-wider">O.S.</th>
                <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Inspetor</th>
                <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tipo de Relatório</th>
                <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Nenhum relatório encontrado para estes filtros.
                  </td>
                </tr>
              ) : (
                clientReports.map((report) => (
                  <tr key={report.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-gray-900">{report.osNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-gray-700">{format(report.date, 'dd/MM/yyyy')}</div>
                      <div className="text-xs font-semibold text-gray-400 mt-0.5">{format(report.date, 'HH:mm')}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-gray-700">{report.inspector}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                        {report.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleDownloadPDF(report.id, report.osNumber)}
                        title="Baixar PDF"
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center"
                      >
                        <Download size={14} className="mr-2" /> Baixar PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
