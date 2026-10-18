import { useState } from 'react';
import { Folder, FileText, Download, Calendar as CalendarIcon, ChevronRight, ArrowLeft } from 'react-feather';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addSystemPDFHeader } from './utils/pdfHeader';

// --- MOCK DATA ---
const COMPANIES = ['CORACORTHE', 'Fábrica ABC', 'Mercado Central', 'Weir', 'JRDL', 'GALEÃO'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro'];

const MOCK_BOLETINS = [
  { id: '1', os: 'OS-2024-001', inspector: 'João Silva', equipamento: 'Moinho Primário', data: '12/09/2024', horario: '08:30', empresa: 'CORACORTHE' },
  { id: '2', os: 'OS-2024-002', inspector: 'Matheus Stanley', equipamento: 'Correia Transportadora A', data: '14/09/2024', horario: '10:15', empresa: 'CORACORTHE' },
  { id: '3', os: 'OS-2024-003', inspector: 'Ana Costa', equipamento: 'Filtro de Mangas', data: '15/09/2024', horario: '14:00', empresa: 'CORACORTHE' },
];

export default function BoletimView() {
  // Navigation State
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredBoletins = MOCK_BOLETINS.filter(b => {
    const matchesCompany = !selectedCompany || b.empresa.toLowerCase().includes(selectedCompany.toLowerCase());
    if (startDate || endDate) {
      const parts = b.data.split('/');
      if (parts.length === 3) {
        const itemDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
      }
    }
    return matchesCompany;
  });

  const handleDownload = async (format: 'pdf' | 'excel') => {
    try {
      if (filteredBoletins.length === 0) {
        toast.error('Nenhum boletim encontrado no período selecionado.');
        return;
      }
      
      if (format === 'excel') {
        // Gera conteúdo do CSV baseado na tabela
        const headers = "O.S.;Inspetor;Equipamento;Data Realização;Horário;Empresa\n";
        const rows = filteredBoletins.map(b => 
          `${b.os};${b.inspector};${b.equipamento};${b.data};${b.horario};${b.empresa}`
        ).join("\n");
        // Adiciona o BOM para o Excel reconhecer UTF-8
        const csvContent = "\uFEFF" + headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Boletim_${selectedCompany}_${selectedMonth}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Boletim gerado em EXCEL com sucesso!');
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        
        const startY = await addSystemPDFHeader(doc, `Boletim Diário - ${selectedCompany} (${selectedMonth})`);
        
        const tableColumn = ["O.S.", "Inspetor", "Equipamento", "Data", "Horário", "Empresa"];
        const tableRows: string[][] = [];

        filteredBoletins.forEach(b => {
          tableRows.push([
            b.os,
            b.inspector,
            b.equipamento,
            b.data,
            b.horario,
            b.empresa
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: startY,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [0, 102, 204] } // Azul do sistema #0066cc
        });

        doc.save(`Boletim_${selectedCompany}_${selectedMonth}_${new Date().getTime()}.pdf`);
        toast.success('Boletim gerado em PDF com sucesso!');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar boletim: ' + (e?.message || 'Falha desconhecida'));
    }
  };

  // --- RENDERS ---

  // LEVEL 1: Empresas
  if (!selectedCompany) {
    return (
      <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 animate-[fadeIn_0.3s_ease-out]">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Folder className="mr-3 text-blue-600" size={28} />
            Boletim Diário
          </h1>
          <p className="text-base text-gray-500 mt-1">Navegue pelas pastas de clientes para acessar os boletins de inspeção.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {COMPANIES.map(company => (
            <div 
              key={company}
              onClick={() => setSelectedCompany(company)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex items-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors mr-4 shrink-0">
                <Folder size={20} />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-gray-900 truncate">{company}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pasta do Cliente</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 2: Meses
  if (selectedCompany && !selectedMonth) {
    return (
      <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 animate-[fadeIn_0.3s_ease-out]">
        <div className="mb-6 flex items-center text-sm font-semibold text-gray-500">
          <span onClick={() => setSelectedCompany(null)} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center">
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-900 flex items-center"><Folder size={14} className="mr-1.5 text-blue-600" /> {selectedCompany}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pastas Mensais</h1>
          <p className="text-sm text-gray-500 mt-1">Selecione o mês para visualizar os boletins da {selectedCompany}.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {MONTHS.map(month => (
            <div 
              key={month}
              onClick={() => setSelectedMonth(month)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 mb-3 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{month}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 3: Boletins do Mês (Tabela e Exportação)
  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 animate-[fadeIn_0.3s_ease-out]">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm font-semibold text-gray-500">
        <span onClick={() => setSelectedCompany(null)} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center">
          <ArrowLeft size={16} className="mr-1" /> Início
        </span>
        <ChevronRight size={14} className="mx-2" />
        <span onClick={() => setSelectedMonth(null)} className="hover:text-blue-600 cursor-pointer transition-colors flex items-center">
          <Folder size={14} className="mr-1.5" /> {selectedCompany}
        </span>
        <ChevronRight size={14} className="mx-2" />
        <span className="text-gray-900 flex items-center"><CalendarIcon size={14} className="mr-1.5 text-blue-600" /> {selectedMonth}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        
        {/* Toolbar & Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Boletins: {selectedMonth}</h2>
            <p className="text-xs text-gray-500 mt-1">Selecione o período exato para baixar o relatório.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data Inicial</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data Final</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleDownload('excel')}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-[#107c41] hover:bg-[#0c5c30] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                <Download size={14} className="mr-2" /> Excel
              </button>
              <button 
                onClick={() => handleDownload('pdf')}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-[#da3b26] hover:bg-[#b02e1d] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                <FileText size={14} className="mr-2" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">O.S.</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Inspetor</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Data Realização</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Horário</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Empresa</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredBoletins.length > 0 ? (
                filteredBoletins.map((boletim) => (
                  <tr key={boletim.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-blue-600">{boletim.os}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{boletim.inspector}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{boletim.equipamento}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">{boletim.data}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{boletim.horario}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{boletim.empresa}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    Nenhum boletim encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
