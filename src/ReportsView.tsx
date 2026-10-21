import { useState, useEffect } from 'react';
import { Folder, FileText, ChevronLeft, Search, Calendar, Download, Eye, Camera, CheckCircle, User, X } from 'react-feather';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getFormResponses,
  getForms,
  RESPONSES_CHANGE_EVENT,
  FORMS_CHANGE_EVENT,
  type FormResponse,
  type InspectionForm,
} from './stores/formulariosStore';
import { generateCorporateFormResponsePDF } from './utils/pdfHeader';

export default function ReportsView() {
  const [responses, setResponses] = useState<FormResponse[]>(() => getFormResponses());
  const [forms, setForms] = useState<InspectionForm[]>(() => getForms());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewingResponse, setViewingResponse] = useState<FormResponse | null>(null);

  // Filtros de Relatórios
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const syncR = () => setResponses(getFormResponses());
    const syncF = () => setForms(getForms());
    window.addEventListener(RESPONSES_CHANGE_EVENT, syncR);
    window.addEventListener(FORMS_CHANGE_EVENT, syncF);
    return () => {
      window.removeEventListener(RESPONSES_CHANGE_EVENT, syncR);
      window.removeEventListener(FORMS_CHANGE_EVENT, syncF);
    };
  }, []);

  const handleDownloadCorporatePDF = async (resp: FormResponse) => {
    try {
      toast.loading('Montando Relatório Técnico Corporativo em PDF...', { id: 'corp-pdf' });
      const formDef = forms.find(f => f.id === resp.formId);
      await generateCorporateFormResponsePDF(resp, formDef);
      toast.success('Relatório Corporativo PDF baixado com sucesso!', { id: 'corp-pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar o PDF corporativo.', { id: 'corp-pdf' });
    }
  };

  // Agrupar relatórios por Formulário / Pasta
  const folderGroups = Array.from(
    new Set([
      ...responses.map(r => r.formName || 'Formulário Geral'),
      ...forms.filter(f => f.status === 'published').map(f => f.name),
    ])
  ).map(formName => {
    const formObj = forms.find(f => f.name === formName);
    const items = responses.filter(r => r.formName === formName);
    return {
      name: formName,
      category: formObj?.category || items[0]?.category || 'Inspeções Técnicas',
      count: items.length,
    };
  });

  const filteredResponses = responses
    .filter(r => !selectedFolder || selectedFolder === '__ALL__' || r.formName === selectedFolder)
    .filter(r => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.formName.toLowerCase().includes(q) ||
        r.inspectorName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        Object.values(r.answers || {}).some(v => String(v).toLowerCase().includes(q));
      const matchesDate =
        !dateFilter || format(new Date(r.submittedAt), 'yyyy-MM-dd') === dateFilter;
      return matchesSearch && matchesDate;
    });

  // Se nenhuma pasta estiver selecionada, mostra a visão de Pastas + Acesso Direto a Todos os Relatórios
  if (!selectedFolder) {
    return (
      <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative animate-[fadeIn_0.2s_ease-out]">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <Folder className="mr-3 text-blue-600" size={28} />
              Relatórios Técnicos de Inspeção
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Relatórios corporativos gerados automaticamente a partir dos formulários preenchidos pelos inspetores em campo.
            </p>
          </div>
          <button
            onClick={() => setSelectedFolder('__ALL__')}
            className="bg-[#071d3d] hover:bg-[#0d2e5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <FileText size={16} />
            <span>Ver Todos os Relatórios ({responses.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {folderGroups.map(group => (
            <div
              key={group.name}
              onClick={() => setSelectedFolder(group.name)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Folder size={30} className="text-blue-600 fill-blue-100" />
                </div>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {group.category}
                </span>
              </div>

              <h3 className="font-extrabold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                {group.name}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Respostas sincronizadas do aplicativo de campo com fotos e parecer técnico.
              </p>

              <div className="mt-auto pt-4 border-t border-gray-100 w-full flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 flex items-center">
                  <FileText size={14} className="mr-1.5 text-blue-600" /> {group.count} relatório(s) preenchido(s)
                </span>
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
                  <ChevronLeft size={14} className="rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 mb-3 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} className="mr-1" /> Voltar para Pastas de Relatórios
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Folder className="mr-3 text-blue-600 fill-blue-100 shrink-0" size={28} />
            {selectedFolder === '__ALL__' ? 'Todos os Relatórios de Inspeção' : selectedFolder}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Clique em <strong>Baixar PDF Corporativo</strong> para gerar o laudo oficial da D&A Inspeções com todas as respostas e fotos.
          </p>
        </div>
      </div>

      {/* Toolbar de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Buscar por Inspetor, Pedido ou Resposta
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Ex: Matheus Stanley, OV-2026, Aprovado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors outline-none"
            />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            Filtrar por Data
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>

        {(searchTerm || dateFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
            }}
            className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Relatórios baseados nos Formulários Preenchidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Inspetor</th>
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Formulário / Procedimento</th>
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Evidências</th>
                <th className="py-4 px-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-500">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-bold text-gray-700">Nenhum relatório encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Assim que um inspetor preencher e enviar um formulário no aplicativo, o relatório aparecerá aqui.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResponses.map((resp) => {
                  const docCode = `REL-${resp.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
                  const photoCount = (resp.attachments || []).filter(a => a.type === 'photo').length;
                  const answerCount = Object.keys(resp.answers || {}).length;

                  return (
                    <tr key={resp.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-5 font-extrabold text-blue-700 text-xs whitespace-nowrap">
                        {docCode}
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                        {format(new Date(resp.submittedAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            <User size={13} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{resp.inspectorName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm font-bold text-gray-800">{resp.formName}</p>
                        <p className="text-xs text-gray-400">{answerCount} campo(s) respondido(s)</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          <Camera size={12} /> {photoCount} foto(s)
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewingResponse(resp)}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="mr-1.5" />
                            Ver Respostas
                          </button>
                          <button
                            onClick={() => handleDownloadCorporatePDF(resp)}
                            className="inline-flex items-center px-4 py-2 bg-[#071d3d] hover:bg-[#0d2e5c] text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                          >
                            <Download size={14} className="mr-1.5" />
                            Baixar PDF Corporativo
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização de Respostas e Fotos */}
      {viewingResponse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#071d3d] text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  Laudo Técnico de Inspeção
                </span>
                <h3 className="text-lg font-extrabold leading-tight mt-0.5">{viewingResponse.formName}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Inspetor: <strong>{viewingResponse.inspectorName}</strong> • {format(new Date(viewingResponse.submittedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <button
                onClick={() => setViewingResponse(null)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(() => {
                const formDef = forms.find(f => f.id === viewingResponse.formId);
                const fields = viewingResponse.fieldsSnapshot || formDef?.fields || [];
                const labelMap = new Map<string, string>();
                fields.forEach(f => labelMap.set(f.id, f.label));

                return (
                  <>
                    <div className="space-y-2.5">
                      {Object.entries(viewingResponse.answers || {}).map(([fId, val]) => (
                        <div key={fId} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {labelMap.get(fId) || fId}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {Array.isArray(val) ? val.join(', ') : String(val || '—')}
                          </p>
                        </div>
                      ))}
                    </div>

                    {viewingResponse.attachments && viewingResponse.attachments.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">
                          Evidências Fotográficas e Anexos ({viewingResponse.attachments.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {viewingResponse.attachments.map((att, idx) => (
                            <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                              {att.type === 'photo' && att.url && att.url !== '#' && (
                                <img src={att.url} alt={att.name} className="w-full h-44 object-cover border-b border-gray-200" />
                              )}
                              <div className="p-2.5 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 truncate">{att.name}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">
                                  {labelMap.get(att.fieldId) || 'Foto'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle size={14} /> Pronto para emissão corporativa
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingResponse(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleDownloadCorporatePDF(viewingResponse)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#071d3d] hover:bg-[#0d2e5c] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Baixar PDF Corporativo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
