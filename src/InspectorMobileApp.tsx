import { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Camera, DollarSign, CheckCircle, Clock, AlertCircle, 
  ChevronRight, LogOut, Coffee, FileText, FilePlus, Folder, ArrowLeft, 
  Paperclip, Video, X, Check, Upload
} from 'react-feather';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { InspectionForm } from './stores/formulariosStore';
import { 
  getForms, saveFormResponse, FORMS_CHANGE_EVENT 
} from './stores/formulariosStore';

let inspectorIdCounter = 0;
function createInspectorId(prefix: string): string {
  inspectorIdCounter += 1;
  return `${prefix}_${inspectorIdCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function InspectorMobileApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'rota' | 'gastos' | 'formularios'>('rota');
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startedDestinations, setStartedDestinations] = useState<number[]>([]);

  // Formulários dinâmicos criados pelo gestor
  const [publishedForms, setPublishedForms] = useState<InspectionForm[]>(() => 
    getForms().filter(f => f.status === 'published')
  );
  const [selectedFolder, setSelectedFolder] = useState<string>('Todas');
  const [activeFillingForm, setActiveFillingForm] = useState<InspectionForm | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [formAttachments, setFormAttachments] = useState<Record<string, { type: 'photo' | 'video' | 'file'; name: string; url: string }[]>>({});
  const [submittedFormIds, setSubmittedFormIds] = useState<string[]>([]);
  
  // States for Gastos (Meal Allowance)
  const limit = 50.00;
  const [gastoValue, setGastoValue] = useState('');
  const [gastos, setGastos] = useState<{valor: number, receipt: boolean}[]>([]);
  const totalGasto = gastos.reduce((acc, curr) => acc + curr.valor, 0);

  const mockRoute = [
    { id: 1, time: '08:00', location: 'Sede D&A', status: 'done' },
    { id: 2, time: '09:30', location: 'Mercado Central, BH', type: 'INSP-EST' },
    { id: 3, time: '14:00', location: 'Fábrica ABC, Contagem', type: 'INSP-SOLD' }
  ];

  // Sincronizar com os formulários do gestor em tempo real
  useEffect(() => {
    const updateForms = () => {
      const all = getForms();
      setPublishedForms(all.filter(f => f.status === 'published'));
    };
    window.addEventListener(FORMS_CHANGE_EVENT, updateForms);
    return () => window.removeEventListener(FORMS_CHANGE_EVENT, updateForms);
  }, []);

  const handleStartInspection = (id: number) => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      setStartedDestinations([...startedDestinations, id]);
      toast.success('Ordem de Serviço gerada automaticamente e enviada para o Gestor!');
    }, 1500);
  };

  const handleAddGasto = () => {
    const val = parseFloat(gastoValue.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setTimeout(() => {
        setGastos([...gastos, { valor: val, receipt: true }]);
        setGastoValue('');
        toast.success('Comprovante salvo com sucesso!');
      }, 500);
    }
  };

  // Abrir formulário para preenchimento (estilo Google Forms)
  const handleOpenForm = (form: InspectionForm) => {
    setActiveFillingForm(form);
    setFormAnswers({});
    setFormAttachments({});
  };

  // Upload real de arquivos / fotos / vídeos
  const handleFileSelect = (fieldId: string, type: 'photo' | 'video' | 'file', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: { type: 'photo' | 'video' | 'file'; name: string; url: string }[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newItems.push({ type, name: file.name, url });
    });

    setFormAttachments(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newItems]
    }));
    toast.success(`${type === 'photo' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Arquivo'} anexado!`);
  };

  // Simulação rápida para teste sem câmera
  const handleSimulateMedia = (fieldId: string, type: 'photo' | 'video' | 'file') => {
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const mockItem = {
      type,
      name: type === 'photo' 
        ? `Foto_Evidencia_${randomSuffix}.jpg` 
        : type === 'video' 
        ? `Video_Operacao_${randomSuffix}.mp4` 
        : `Laudo_Tecnico_${randomSuffix}.pdf`,
      url: type === 'photo' 
        ? 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop' 
        : '#'
    };
    setFormAttachments(prev => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), mockItem]
    }));
    toast.success(`${type === 'photo' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Documento'} adicionado!`);
  };

  const handleRemoveAttachment = (fieldId: string, index: number) => {
    setFormAttachments(prev => {
      const current = prev[fieldId] || [];
      const updated = current.filter((_, i) => i !== index);
      return { ...prev, [fieldId]: updated };
    });
  };

  // Enviar formulário preenchido
  const handleSubmitForm = () => {
    if (!activeFillingForm) return;

    // Validação de campos obrigatórios
    for (const field of activeFillingForm.fields) {
      if (field.required) {
        if (field.type === 'photo' || field.type === 'video' || field.type === 'file') {
          const files = formAttachments[field.id] || [];
          if (files.length === 0) {
            toast.error(`O campo "${field.label || 'Anexo'}" é obrigatório.`);
            return;
          }
        } else if (field.type === 'checkbox') {
          const arr = formAnswers[field.id] || [];
          if (!Array.isArray(arr) || arr.length === 0) {
            toast.error(`Selecione ao menos uma opção em "${field.label}".`);
            return;
          }
        } else {
          const val = formAnswers[field.id];
          if (!val || (typeof val === 'string' && !val.trim())) {
            toast.error(`Preencha o campo obrigatório "${field.label}".`);
            return;
          }
        }
      }
    }

    // Montar todos os anexos
    const allAttachments: { fieldId: string; type: 'photo' | 'video' | 'file'; name: string; url: string }[] = [];
    Object.entries(formAttachments).forEach(([fId, atts]) => {
      atts.forEach(a => allAttachments.push({ fieldId: fId, ...a }));
    });

    saveFormResponse({
      id: createInspectorId('resp'),
      formId: activeFillingForm.id,
      formName: activeFillingForm.name,
      inspectorName: 'João Silva',
      submittedAt: '2026-10-18T00:00:00.000Z',
      answers: formAnswers,
      attachments: allAttachments,
    });

    setSubmittedFormIds([...submittedFormIds, activeFillingForm.id]);
    toast.success(`Formulário "${activeFillingForm.name}" enviado à central com sucesso!`);
    setActiveFillingForm(null);
  };

  // Pastas (categorias) dos formulários
  const categories = ['Todas', ...Array.from(new Set(publishedForms.map(f => f.category || 'Geral')))];
  const displayedForms = selectedFolder === 'Todas' 
    ? publishedForms 
    : publishedForms.filter(f => (f.category || 'Geral') === selectedFolder);

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      {/* Container Unificado e Responsivo do Inspetor */}
      <div className="w-full max-w-3xl bg-slate-50 flex flex-col h-screen shadow-lg md:border-x border-slate-200 overflow-hidden relative">

        {/* App Header */}
        <header className="bg-blue-700 text-white px-5 sm:px-8 pt-5 pb-6 shadow-md z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Inspetor em Campo</p>
              <h1 className="text-xl sm:text-2xl font-extrabold">João Silva</h1>
            </div>
            <button onClick={onLogout} className="p-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold" title="Sair do Sistema">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
          
          {/* 1. TELA DE PREENCHIMENTO DO FORMULÁRIO DINÂMICO (ESTILO GOOGLE FORMS) */}
          {activeFillingForm !== null ? (
            <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
              {/* Top Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <button 
                  onClick={() => setActiveFillingForm(null)} 
                  className="flex items-center text-xs font-bold text-gray-600 hover:text-gray-900 bg-white p-2 rounded-xl shadow-sm border border-gray-200"
                >
                  <ArrowLeft size={16} className="mr-1.5" /> Voltar
                </button>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {activeFillingForm.category || 'Formulário'}
                </span>
              </div>

              {/* Form Title Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-2 bg-blue-600" />
                <div className="p-4 space-y-1.5">
                  <h2 className="text-lg font-black text-gray-900 leading-tight">{activeFillingForm.name}</h2>
                  {activeFillingForm.description && (
                    <p className="text-xs text-gray-500">{activeFillingForm.description}</p>
                  )}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 mt-2">
                    <span>{activeFillingForm.fields.length} perguntas</span>
                    <span className="text-red-500 font-bold">* Perguntas obrigatórias</span>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeFillingForm.fields.map((field, idx) => (
                  <div key={field.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <label className="text-xs font-bold text-gray-900 leading-snug">
                        <span className="text-blue-600 mr-1.5 font-black">#{idx + 1}</span>
                        {field.label || 'Pergunta sem título'}
                        {field.required && <span className="text-red-500 ml-1 font-black">*</span>}
                      </label>
                      {field.required && (
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">Obrigatório</span>
                      )}
                    </div>

                    {/* TEXT */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || "Sua resposta..."}
                        value={formAnswers[field.id] || ''}
                        onChange={e => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* TEXTAREA */}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder || "Descreva detalhadamente..."}
                        value={formAnswers[field.id] || ''}
                        onChange={e => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                    )}

                    {/* NUMBER */}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder || "0"}
                        value={formAnswers[field.id] || ''}
                        onChange={e => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* DATE */}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={formAnswers[field.id] || ''}
                        onChange={e => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* RADIO (MÚLTIPLA ESCOLHA) */}
                    {field.type === 'radio' && (
                      <div className="space-y-1.5">
                        {field.options.map(opt => {
                          const isSelected = formAnswers[field.id] === opt.label;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setFormAnswers({ ...formAnswers, [field.id]: opt.label })}
                              className={`w-full flex items-center p-2.5 rounded-xl border text-left transition-all ${
                                isSelected 
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' 
                                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 mr-2.5 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* CHECKBOX (SELEÇÃO MÚLTIPLA) */}
                    {field.type === 'checkbox' && (
                      <div className="space-y-1.5">
                        {field.options.map(opt => {
                          const currentVals = (formAnswers[field.id] as string[]) || [];
                          const isChecked = currentVals.includes(opt.label);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                const next = isChecked ? currentVals.filter(v => v !== opt.label) : [...currentVals, opt.label];
                                setFormAnswers({ ...formAnswers, [field.id]: next });
                              }}
                              className={`w-full flex items-center p-2.5 rounded-xl border text-left transition-all ${
                                isChecked 
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' 
                                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border-2 mr-2.5 flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'
                              }`}>
                                {isChecked && <Check size={11} strokeWidth={3} />}
                              </div>
                              <span className="text-xs">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* SELECT (LISTA SUSPENSA) */}
                    {field.type === 'select' && (
                      <select
                        value={formAnswers[field.id] || ''}
                        onChange={e => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Selecione uma opção...</option>
                        {field.options.map(opt => (
                          <option key={opt.id} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    )}

                    {/* PHOTO (ANEXAR / TIRAR FOTO) */}
                    {field.type === 'photo' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`photo-input-${field.id}`}
                          accept="image/*"
                          capture="environment"
                          multiple
                          className="hidden"
                          onChange={e => handleFileSelect(field.id, 'photo', e)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            htmlFor={`photo-input-${field.id}`}
                            className="cursor-pointer bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Camera size={14} className="mr-1.5" /> Tirar Foto
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSimulateMedia(field.id, 'photo')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Upload size={13} className="mr-1.5" /> Demo Rápida
                          </button>
                        </div>

                        {/* Thumbnails */}
                        {(formAttachments[field.id] || []).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {(formAttachments[field.id] || []).map((file, i) => (
                              <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(field.id, i)}
                                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                >
                                  <X size={10} />
                                </button>
                                <p className="text-[9px] text-gray-600 truncate px-1.5 py-0.5 bg-white font-medium">{file.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* VIDEO (GRAVAR / ANEXAR VÍDEO) */}
                    {field.type === 'video' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`video-input-${field.id}`}
                          accept="video/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => handleFileSelect(field.id, 'video', e)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            htmlFor={`video-input-${field.id}`}
                            className="cursor-pointer bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Video size={14} className="mr-1.5" /> Gravar Vídeo
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSimulateMedia(field.id, 'video')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Upload size={13} className="mr-1.5" /> Demo Vídeo
                          </button>
                        </div>

                        {(formAttachments[field.id] || []).map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800">
                            <div className="flex items-center truncate mr-2">
                              <Video size={14} className="mr-1.5 text-red-600 shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(field.id, i)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FILE (ANEXO DE ARQUIVO / LAUDO) */}
                    {field.type === 'file' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`doc-input-${field.id}`}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                          multiple
                          className="hidden"
                          onChange={e => handleFileSelect(field.id, 'file', e)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            htmlFor={`doc-input-${field.id}`}
                            className="cursor-pointer bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Paperclip size={14} className="mr-1.5" /> Anexar Arquivo
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSimulateMedia(field.id, 'file')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center transition-colors"
                          >
                            <Upload size={13} className="mr-1.5" /> Demo Arquivo
                          </button>
                        </div>

                        {(formAttachments[field.id] || []).map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
                            <div className="flex items-center truncate mr-2">
                              <Paperclip size={14} className="mr-1.5 text-blue-600 shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(field.id, i)}
                              className="text-blue-500 hover:text-red-600 p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Botão de Envio */}
              <button 
                type="button"
                onClick={handleSubmitForm}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center mt-6"
              >
                <CheckCircle size={18} className="mr-2" />
                Finalizar e Enviar Formulário
              </button>
            </div>
          ) : activeFormId !== null ? (
            /* 2. FORMULÁRIO DILIGENCIAMENTO PADRÃO DA ROTA */
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                <button onClick={() => setActiveFormId(null)} className="mr-3 p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <h2 className="text-lg font-extrabold text-gray-800 leading-tight">Formulário de Inspeção<br/><span className="text-sm font-bold text-blue-600">Diligenciamento</span></h2>
              </div>
              
              <div className="space-y-5">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">1. Informações do Cliente</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nome do Cliente</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800"
                        onChange={(e) => {
                          const val = e.target.value;
                          const cpfInput = document.getElementById('cpf_cnpj') as HTMLInputElement;
                          const enderecoInput = document.getElementById('endereco') as HTMLInputElement;
                          
                          if (val === 'coracorthe') {
                            if (cpfInput) cpfInput.value = '12.345.678/0001-90';
                            if (enderecoInput) enderecoInput.value = 'Coracorthe Hardox Wearparts, BH';
                          } else if (val === 'abc') {
                            if (cpfInput) cpfInput.value = '98.765.432/0001-10';
                            if (enderecoInput) enderecoInput.value = 'Av. Industrial, 500 - Contagem, MG';
                          } else if (val === 'mercado') {
                            if (cpfInput) cpfInput.value = '55.666.777/0001-22';
                            if (enderecoInput) enderecoInput.value = 'Av. Augusto de Lima, 744 - Centro, BH';
                          } else {
                            if (cpfInput) cpfInput.value = '';
                            if (enderecoInput) enderecoInput.value = '';
                          }
                        }}
                      >
                        <option value="">Selecione o Cliente...</option>
                        <option value="coracorthe">Coracorthe Hardox Wearparts</option>
                        <option value="abc">Fábrica ABC</option>
                        <option value="mercado">Mercado Central</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">CPF / CNPJ</label>
                      <input id="cpf_cnpj" type="text" readOnly placeholder="Preenchimento automático" className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Endereço</label>
                      <input id="endereco" type="text" readOnly placeholder="Preenchimento automático" className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">2. Detalhes da Inspeção</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tipo de Inspeção</label>
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800">
                        <option>Diligenciamento</option>
                        <option>Fabricação</option>
                        <option>Montagem</option>
                        <option>Solda</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Inspetor</label>
                      <input type="text" readOnly value="João Silva" className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Data</label>
                      <input type="text" readOnly value={format(new Date(), 'dd/MM/yyyy')} className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                      <span className="inline-block w-full bg-blue-50 text-blue-700 border border-blue-200 rounded-lg p-2.5 text-sm font-extrabold text-center">
                        Em Andamento
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    toast.success('Inspeção assinada e finalizada com sucesso!');
                    setActiveFormId(null);
                  }}
                  className="w-full bg-emerald-600 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center mt-6"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Assinar e Finalizar O.S.
                </button>

              </div>
            </div>
          ) : activeTab === 'rota' ? (
            /* 3. ABA MINHA ROTA */
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-lg font-extrabold text-gray-800">Sua Rota Hoje</h2>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>

              <div className="relative pl-4 space-y-6">
                <div className="absolute left-[23px] top-4 bottom-8 w-0.5 bg-gray-200"></div>

                {mockRoute.map((stop) => {
                  const isStarted = startedDestinations.includes(stop.id);
                  const isDone = stop.status === 'done';

                  return (
                    <div key={stop.id} className="relative z-10">
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-sm flex-shrink-0 z-10 ${isDone || isStarted ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm font-bold text-gray-500">{stop.time}</span>
                      </div>
                      
                      <div className={`ml-8 p-4 rounded-2xl border ${isStarted ? 'bg-blue-50 border-blue-200' : isDone ? 'bg-gray-100 border-transparent opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className="font-bold text-gray-900 leading-tight">{stop.location}</h3>
                        {stop.type && <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{stop.type}</p>}
                        
                        {!isDone && !isStarted && (
                          <button 
                            onClick={() => handleStartInspection(stop.id)}
                            disabled={isStarting}
                            className="mt-4 w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex justify-center items-center"
                          >
                            {isStarting ? (
                              <Clock size={18} className="animate-spin" />
                            ) : (
                              <>
                                <Navigation size={16} className="mr-2" /> Iniciar Inspeção
                              </>
                            )}
                          </button>
                        )}

                        {isStarted && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg text-[11px] font-bold">
                              <CheckCircle size={14} className="mr-2" />
                              O.S. Gerada. Serviço em Andamento.
                            </div>
                            <button 
                              onClick={() => setActiveFormId(stop.id)}
                              className="w-full bg-white border-2 border-blue-600 text-blue-700 font-bold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex justify-center items-center"
                            >
                              <FileText size={16} className="mr-2" />
                              Preencher Formulário
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'formularios' ? (
            /* 4. ABA FORMULÁRIOS COM PASTAS E MODELOS CRIADOS PELO GESTOR */
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 flex items-center">
                  <Folder size={20} className="mr-2 text-blue-600" />
                  Pastas de Formulários
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Modelos criados pelo gestor prontos para preenchimento em campo.</p>
              </div>

              {/* Pastas (Folders) Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => {
                  const count = cat === 'Todas' ? publishedForms.length : publishedForms.filter(f => (f.category || 'Geral') === cat).length;
                  const isSelected = selectedFolder === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedFolder(cat)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Folder size={12} className={isSelected ? 'text-white' : 'text-blue-500'} />
                      <span>{cat}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Lista de formulários da pasta */}
              <div className="space-y-3">
                {displayedForms.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                    <Folder size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600">Nenhum formulário publicado nesta pasta</p>
                    <p className="text-[10px] text-gray-400 mt-1">O gestor pode publicar formulários pelo painel web.</p>
                  </div>
                ) : (
                  displayedForms.map((form) => {
                    const isSubmitted = submittedFormIds.includes(form.id);
                    const hasPhoto = form.fields.some(f => f.type === 'photo');
                    const hasVideo = form.fields.some(f => f.type === 'video');
                    const hasFile = form.fields.some(f => f.type === 'file');

                    return (
                      <div key={form.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            📁 {form.category || 'Geral'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {form.fields.length} campos
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{form.name}</h3>
                          {form.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{form.description}</p>
                          )}
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1">
                          {hasPhoto && <span className="bg-orange-50 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded">📷 Fotos</span>}
                          {hasVideo && <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded">🎥 Vídeos</span>}
                          {hasFile && <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded">📎 Anexos</span>}
                          {isSubmitted && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded">✓ Respondido Hoje</span>}
                        </div>

                        <button
                          onClick={() => handleOpenForm(form)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex justify-center items-center shadow-sm"
                        >
                          <FilePlus size={14} className="mr-1.5" /> 
                          {isSubmitted ? 'Preencher Novamente' : 'Preencher Formulário'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* 5. ABA GASTOS */
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">Alimentação / Gastos</h2>
                <p className="text-sm text-gray-500 mt-1">Registre seus gastos e anexe os comprovantes.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Limite Diário</p>
                  <p className="text-xl font-black text-gray-800 mt-0.5">R$ {limit.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Utilizado</p>
                  <p className={`text-xl font-black mt-0.5 ${totalGasto > limit ? 'text-red-600' : 'text-emerald-600'}`}>
                    R$ {totalGasto.toFixed(2)}
                  </p>
                </div>
              </div>

              {totalGasto > limit && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex items-start text-sm font-medium">
                  <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                  Você ultrapassou o limite estabelecido pelo gestor. O valor excedente (R$ {(totalGasto - limit).toFixed(2)}) não será reembolsado automaticamente.
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <label className="text-xs font-bold text-gray-600 mb-2 block">Novo Gasto (R$)</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">R$</span>
                  </div>
                  <input 
                    type="number" 
                    value={gastoValue}
                    onChange={(e) => setGastoValue(e.target.value)}
                    placeholder="0.00" 
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button 
                  onClick={handleAddGasto}
                  disabled={!gastoValue}
                  className="w-full bg-gray-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-black transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  <Camera size={16} className="mr-2" /> Tirar Foto do Comprovante
                </button>
              </div>

              {gastos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 mt-2">Comprovantes Salvos</h3>
                  {gastos.map((g, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                          <Coffee size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Alimentação</p>
                          <p className="text-xs font-medium text-emerald-600 flex items-center mt-0.5"><CheckCircle size={10} className="mr-1"/> Foto Anexada</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900">R$ {g.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-6 pt-3 px-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
          <button 
            onClick={() => { setActiveTab('rota'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'rota' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapPin size={22} className={activeTab === 'rota' ? 'fill-blue-50' : ''} />
            <span className="text-[9px] font-bold mt-1">Minha Rota</span>
          </button>
          
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg -mt-7 mb-1 border-4 border-gray-50">
              <Camera size={18} />
            </div>
            <span className="text-[9px] font-bold">Lente D&A</span>
          </button>

          <button 
            onClick={() => { setActiveTab('formularios'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'formularios' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
              <Folder size={22} className={activeTab === 'formularios' ? 'fill-blue-50' : ''} />
              {activeTab !== 'formularios' && publishedForms.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
              )}
            </div>
            <span className="text-[9px] font-bold mt-1">Formulários</span>
          </button>

          <button 
            onClick={() => { setActiveTab('gastos'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'gastos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <DollarSign size={22} className={activeTab === 'gastos' ? 'fill-blue-50' : ''} />
            <span className="text-[9px] font-bold mt-1">Gastos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
