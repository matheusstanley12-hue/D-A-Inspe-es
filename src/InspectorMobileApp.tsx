import { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Camera, DollarSign, CheckCircle, Clock, 
  ChevronRight, LogOut, Coffee, FileText, FilePlus, Folder, ArrowLeft, 
  Paperclip, Video, X, Check, Upload, Download, Eye, Home, Truck, RefreshCw, HelpCircle
} from 'react-feather';
import { format } from 'date-fns';
import { generateCorporateFormResponsePDF } from './utils/pdfHeader';
import toast from 'react-hot-toast';
import logoUrl from './assets/logo.jpg';
import type { InspectionForm, FormResponse, InspectorExpense, ExpenseCategory } from './stores/formulariosStore';
import { 
  getForms, saveFormResponse, FORMS_CHANGE_EVENT,
  getFormResponses, RESPONSES_CHANGE_EVENT,
  getExpenses, saveExpense, EXPENSES_CHANGE_EVENT,
  syncFromServer
} from './stores/formulariosStore';

let inspectorIdCounter = 0;
function createInspectorId(prefix: string): string {
  inspectorIdCounter += 1;
  return `${prefix}_${inspectorIdCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatUserName(email?: string): string {
  if (!email) return 'Inspetor D&A';
  const lower = email.toLowerCase().trim();
  if (lower.includes('matheus')) return 'Matheus Stanley';
  if (lower === 'testeinspetor@gmail.com') return 'João Silva';
  const local = email.split('@')[0].replace(/[._-]+/g, ' ');
  return local.replace(/\b\w/g, c => c.toUpperCase()) || 'Inspetor D&A';
}

export default function InspectorMobileApp({ onLogout, userEmail }: { onLogout: () => void; userEmail?: string }) {
  const displayUserName = formatUserName(userEmail);
  const [activeTab, setActiveTab] = useState<'rota' | 'gastos' | 'formularios' | 'preenchidos'>('rota');
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startedDestinations, setStartedDestinations] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Onboarding / Instruções de Primeiro Acesso do Inspetor
  const ONBOARDING_STORAGE_KEY = 'da_inspector_onboarding_v1';
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'completed';
    } catch {
      return true;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState(0);

  const handleFinishOnboarding = (targetTab?: 'rota' | 'gastos' | 'formularios' | 'preenchidos') => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'completed');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
    setOnboardingStep(0);
    if (targetTab) {
      setActiveTab(targetTab);
      setActiveFillingForm(null);
      setActiveFormId(null);
    }
    toast.success('Bom trabalho em campo! Qualquer dúvida, toque no ícone "?" no topo.');
  };

  // Formulários dinâmicos criados pelo gestor
  const [publishedForms, setPublishedForms] = useState<InspectionForm[]>(() => 
    getForms().filter(f => f.status === 'published')
  );
  const [selectedFolder, setSelectedFolder] = useState<string>('Todas');
  const [activeFillingForm, setActiveFillingForm] = useState<InspectionForm | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [formAttachments, setFormAttachments] = useState<Record<string, { type: 'photo' | 'video' | 'file'; name: string; url: string }[]>>({});
  const [submittedFormIds, setSubmittedFormIds] = useState<string[]>([]);

  // Formulários preenchidos (para visualizar e baixar em PDF)
  const [filledResponses, setFilledResponses] = useState<FormResponse[]>(() => getFormResponses());
  const [viewingResponse, setViewingResponse] = useState<FormResponse | null>(null);
  
  // States for Gastos (Combustível, Alimentação, Hotel)
  const [gastoCategory, setGastoCategory] = useState<ExpenseCategory>('combustivel');
  const [gastoValue, setGastoValue] = useState('');
  const [gastoDescription, setGastoDescription] = useState('');
  const [gastoReceiptUrl, setGastoReceiptUrl] = useState('');
  const [gastoReceiptName, setGastoReceiptName] = useState('');
  const [gastos, setGastos] = useState<InspectorExpense[]>(() => getExpenses());

  const totalCombustivel = gastos.filter(g => g.category === 'combustivel').reduce((acc, c) => acc + c.valor, 0);
  const totalAlimentacao = gastos.filter(g => g.category === 'alimentacao').reduce((acc, c) => acc + c.valor, 0);
  const totalHotel = gastos.filter(g => g.category === 'hotel').reduce((acc, c) => acc + c.valor, 0);
  const totalGasto = gastos.reduce((acc, curr) => acc + curr.valor, 0);

  const mockRoute = [
    { id: 1, time: '08:00', location: 'Sede D&A', status: 'done' },
    { id: 2, time: '09:30', location: 'Mercado Central, BH', type: 'INSP-EST' },
    { id: 3, time: '14:00', location: 'Fábrica ABC, Contagem', type: 'INSP-SOLD' }
  ];

  // Sincronizar com os formulários, respostas e gastos do sistema em tempo real
  useEffect(() => {
    const updateForms = () => {
      const all = getForms();
      setPublishedForms(all.filter(f => f.status === 'published'));
    };
    const updateResponses = () => {
      setFilledResponses(getFormResponses());
    };
    const updateExpenses = () => {
      setGastos(getExpenses());
    };
    window.addEventListener(FORMS_CHANGE_EVENT, updateForms);
    window.addEventListener(RESPONSES_CHANGE_EVENT, updateResponses);
    window.addEventListener(EXPENSES_CHANGE_EVENT, updateExpenses);
    return () => {
      window.removeEventListener(FORMS_CHANGE_EVENT, updateForms);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, updateResponses);
      window.removeEventListener(EXPENSES_CHANGE_EVENT, updateExpenses);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await syncFromServer();
    setIsSyncing(false);
    if (ok) {
      toast.success('Sincronizado com o sistema central!');
    } else {
      toast('Dados salvos localmente (sincronização automática ativa).', { icon: '🔄' });
    }
  };

  const handleStartInspection = (id: number) => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      setStartedDestinations([...startedDestinations, id]);
      toast.success('Ordem de Serviço gerada automaticamente e enviada para o Gestor!');
    }, 1500);
  };

  const handleReceiptPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGastoReceiptUrl(String(reader.result || ''));
      setGastoReceiptName(file.name);
      toast.success('Foto do comprovante carregada!');
    };
    reader.readAsDataURL(file);
  };

  const handleAddGasto = () => {
    const val = parseFloat(gastoValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido para o gasto.');
      return;
    }
    const categoryLabel = gastoCategory === 'combustivel' ? 'Combustível' : gastoCategory === 'alimentacao' ? 'Alimentação' : 'Hotel';
    const newExp: InspectorExpense = {
      id: createInspectorId('exp'),
      category: gastoCategory,
      valor: val,
      description: gastoDescription.trim() || `Despesa de ${categoryLabel}`,
      inspectorName: displayUserName,
      createdAt: new Date().toISOString(),
      receipt: true,
      receiptUrl: gastoReceiptUrl || undefined,
      receiptName: gastoReceiptName || 'Comprovante anexado',
    };
    saveExpense(newExp);
    setGastoValue('');
    setGastoDescription('');
    setGastoReceiptUrl('');
    setGastoReceiptName('');
    toast.success(`Gasto de ${categoryLabel} (R$ ${val.toFixed(2)}) enviado ao sistema!`);
  };

  const handleDownloadFormPDF = async (resp: FormResponse) => {
    try {
      toast.loading('Gerando Relatório Corporativo em PDF...', { id: 'pdf-gen' });
      await generateCorporateFormResponsePDF(resp);
      toast.success('Relatório Corporativo PDF baixado com sucesso!', { id: 'pdf-gen' });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Não foi possível gerar o PDF.', { id: 'pdf-gen' });
    }
  };

  // Abrir formulário para preenchimento (estilo Google Forms)
  const handleOpenForm = (form: InspectionForm) => {
    setActiveFillingForm(form);
    setFormAnswers({});
    setFormAttachments({});
  };

  // Upload real de arquivos / fotos / vídeos (convertendo fotos para Base64 para persistir e sair no PDF)
  const handleFileSelect = (fieldId: string, type: 'photo' | 'video' | 'file', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (type === 'photo' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxW = 1000;
            const scale = img.width > maxW ? maxW / img.width : 1;
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              setFormAttachments(prev => ({
                ...prev,
                [fieldId]: [...(prev[fieldId] || []), { type: 'photo', name: file.name, url: compressedDataUrl }]
              }));
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const url = URL.createObjectURL(file);
        setFormAttachments(prev => ({
          ...prev,
          [fieldId]: [...(prev[fieldId] || []), { type, name: file.name, url }]
        }));
      }
    });
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
      category: activeFillingForm.category || 'Geral',
      inspectorName: displayUserName,
      submittedAt: new Date().toISOString(),
      answers: formAnswers,
      fieldsSnapshot: activeFillingForm.fields,
      attachments: allAttachments,
    });

    setSubmittedFormIds([...submittedFormIds, activeFillingForm.id]);
    toast.success(`Formulário "${activeFillingForm.name}" enviado e disponível na aba Preenchidos!`);
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
        <header className="bg-blue-700 text-white px-4 sm:px-8 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 shadow-md z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0">
                <img src={logoUrl} alt="D&A Inspeções" className="h-9 w-9 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-blue-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider">D&A Inspeções • Campo</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    ● Online
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-extrabold truncate">{displayUserName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOnboardingStep(0);
                  setShowOnboarding(true);
                }}
                className="p-2 bg-blue-800/80 hover:bg-blue-900 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Instruções de Uso do Aplicativo"
              >
                <HelpCircle size={15} />
                <span className="hidden sm:inline">Guia</span>
              </button>
              <button 
                onClick={handleManualSync} 
                className="p-2 bg-blue-800/80 hover:bg-blue-900 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer" 
                title="Sincronizar com Sistema"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              <button onClick={onLogout} className="p-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer" title="Sair do Sistema">
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
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
          ) : activeTab === 'preenchidos' ? (
            /* 5. ABA FORMULÁRIOS PREENCHIDOS (HISTÓRICO E DOWNLOAD PDF) */
            <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Formulários Preenchidos</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Visualize e baixe em PDF todos os formulários que você já preencheu.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full">
                  {filledResponses.length} {filledResponses.length === 1 ? 'envio' : 'envios'}
                </span>
              </div>

              {filledResponses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
                  <FileText size={32} className="mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">Nenhum formulário preenchido ainda</p>
                  <p className="text-xs text-gray-400">
                    Vá até a aba "Formulários", preencha uma inspeção e ela aparecerá aqui pronta para baixar em PDF.
                  </p>
                  <button
                    onClick={() => setActiveTab('formularios')}
                    className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Folder size={14} className="mr-1.5" /> Ir para Formulários
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filledResponses.map(resp => {
                    const answersCount = Object.keys(resp.answers || {}).length;
                    const attachCount = (resp.attachments || []).length;
                    return (
                      <div key={resp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 mb-1">
                              {resp.category || 'Inspeção'}
                            </span>
                            <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{resp.formName}</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Preenchido em {format(new Date(resp.submittedAt), 'dd/MM/yyyy às HH:mm')} • {resp.inspectorName}
                            </p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center">
                            <CheckCircle size={11} className="mr-1" /> Sincronizado
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                          <span><strong>{answersCount}</strong> campo(s) respondido(s)</span>
                          <span>•</span>
                          <span><strong>{attachCount}</strong> mídia(s) / anexo(s)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setViewingResponse(resp)}
                            className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center"
                          >
                            <Eye size={14} className="mr-1.5" /> Ver Respostas
                          </button>
                          <button
                            onClick={() => handleDownloadFormPDF(resp)}
                            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center shadow-sm"
                          >
                            <Download size={14} className="mr-1.5" /> Baixar PDF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal de Visualização das Respostas do Formulário Preenchido */}
              {viewingResponse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-700 text-white">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Resumo do Preenchimento</p>
                        <h3 className="text-sm font-extrabold truncate">{viewingResponse.formName}</h3>
                      </div>
                      <button onClick={() => setViewingResponse(null)} className="p-1.5 bg-blue-800 hover:bg-blue-900 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-3 flex-1">
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between">
                        <span><strong>Inspetor:</strong> {viewingResponse.inspectorName}</span>
                        <span><strong>Data:</strong> {format(new Date(viewingResponse.submittedAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>

                      {(() => {
                        const formDef = getForms().find(f => f.id === viewingResponse.formId);
                        const fields = viewingResponse.fieldsSnapshot || formDef?.fields || [];
                        const labelMap = new Map<string, string>();
                        fields.forEach(f => labelMap.set(f.id, f.label));

                        return Object.entries(viewingResponse.answers || {}).map(([fId, val]) => (
                          <div key={fId} className="bg-white border border-gray-100 rounded-xl p-3 shadow-2xs">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">{labelMap.get(fId) || fId}</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                              {Array.isArray(val) ? val.join(', ') : String(val || '—')}
                            </p>
                          </div>
                        ));
                      })()}

                      {viewingResponse.attachments && viewingResponse.attachments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-extrabold text-gray-700 uppercase">Anexos e Fotos ({viewingResponse.attachments.length})</p>
                          <div className="grid grid-cols-2 gap-2">
                            {viewingResponse.attachments.map((att, idx) => (
                              <div key={idx} className="border border-gray-200 rounded-xl p-2 bg-gray-50">
                                {att.type === 'photo' && att.url ? (
                                  <img src={att.url} alt={att.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                                ) : null}
                                <p className="text-[11px] font-semibold text-gray-700 truncate">{att.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                      <button
                        onClick={() => handleDownloadFormPDF(viewingResponse)}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center"
                      >
                        <Download size={14} className="mr-1.5" /> Baixar PDF Agora
                      </button>
                      <button
                        onClick={() => setViewingResponse(null)}
                        className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 6. ABA GASTOS (COMBUSTÍVEL, ALIMENTAÇÃO, HOTEL) */
            <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">Despesas de Campo</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registre gastos com Combustível, Alimentação ou Hotel e envie o comprovante para a central.
                </p>
              </div>

              {/* Resumo por Categoria */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase">Combustível</span>
                    <Truck size={14} className="text-amber-500" />
                  </div>
                  <p className="text-base font-black text-gray-900">R$ {totalCombustivel.toFixed(2)}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase">Alimentação</span>
                    <Coffee size={14} className="text-blue-500" />
                  </div>
                  <p className="text-base font-black text-gray-900">R$ {totalAlimentacao.toFixed(2)}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase">Hotel</span>
                    <Home size={14} className="text-purple-500" />
                  </div>
                  <p className="text-base font-black text-gray-900">R$ {totalHotel.toFixed(2)}</p>
                </div>

                <div className="bg-blue-700 text-white p-3.5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-blue-200 uppercase">Total Geral</span>
                    <DollarSign size={14} className="text-blue-200" />
                  </div>
                  <p className="text-base font-black">R$ {totalGasto.toFixed(2)}</p>
                </div>
              </div>

              {/* Formulário de Novo Gasto */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 block">
                    1. Tipo de Despesa
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGastoCategory('combustivel')}
                      className={`py-3 px-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                        gastoCategory === 'combustivel'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Truck size={18} className={gastoCategory === 'combustivel' ? 'text-amber-600' : 'text-gray-400'} />
                      <span>Combustível</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGastoCategory('alimentacao')}
                      className={`py-3 px-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                        gastoCategory === 'alimentacao'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Coffee size={18} className={gastoCategory === 'alimentacao' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Alimentação</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGastoCategory('hotel')}
                      className={`py-3 px-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                        gastoCategory === 'hotel'
                          ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Home size={18} className={gastoCategory === 'hotel' ? 'text-purple-600' : 'text-gray-400'} />
                      <span>Hotel</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">2. Valor (R$)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-bold text-sm">R$</span>
                      </div>
                      <input 
                        type="number" 
                        step="0.01"
                        value={gastoValue}
                        onChange={(e) => setGastoValue(e.target.value)}
                        placeholder="0,00" 
                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">3. Descrição / Local</label>
                    <input 
                      type="text" 
                      value={gastoDescription}
                      onChange={(e) => setGastoDescription(e.target.value)}
                      placeholder={
                        gastoCategory === 'combustivel'
                          ? 'Ex: Posto Shell - 40L'
                          : gastoCategory === 'alimentacao'
                            ? 'Ex: Almoço em campo'
                            : 'Ex: Diária Hotel Ibis'
                      }
                      className="block w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Upload de Comprovante */}
                <div>
                  <label className="flex items-center justify-center w-full py-2.5 px-4 border-2 border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 bg-gray-50 cursor-pointer transition-colors">
                    <Camera size={15} className="mr-2" />
                    {gastoReceiptName ? `Comprovante: ${gastoReceiptName}` : 'Anexar / Fotografar Nota Fiscal ou Recibo'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleReceiptPhotoSelect}
                    />
                  </label>
                </div>

                <button 
                  onClick={handleAddGasto}
                  disabled={!gastoValue}
                  className="w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Check size={16} className="mr-2" /> Registrar Despesa de {gastoCategory === 'combustivel' ? 'Combustível' : gastoCategory === 'alimentacao' ? 'Alimentação' : 'Hotel'}
                </button>
              </div>

              {/* Lista de Comprovantes Salvos */}
              {gastos.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mt-2">
                    Histórico de Despesas Lançadas ({gastos.length})
                  </h3>
                  {gastos.map((g) => {
                    const isComb = g.category === 'combustivel';
                    const isHotel = g.category === 'hotel';
                    const badgeClass = isComb
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isHotel
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200';
                    const catTitle = isComb ? 'Combustível' : isHotel ? 'Hotel' : 'Alimentação';
                    return (
                      <div key={g.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                        <div className="flex items-center min-w-0 pr-2">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mr-3 shrink-0 ${badgeClass}`}>
                            {isComb ? <Truck size={17} /> : isHotel ? <Home size={17} /> : <Coffee size={17} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                                {catTitle}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {format(new Date(g.createdAt), 'dd/MM HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{g.description}</p>
                            <p className="text-[10px] font-medium text-emerald-600 flex items-center mt-0.5">
                              <CheckCircle size={10} className="mr-1" /> {g.receiptName || 'Comprovante sincronizado'}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-sm text-gray-900 shrink-0">R$ {g.valor.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation (5 abas: Inspeções, Formulários, Lente D&A, Preenchidos, Gastos) */}
        <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 px-2 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
          <button 
            onClick={() => { setActiveTab('rota'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'rota' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapPin size={20} className={activeTab === 'rota' ? 'fill-blue-50' : ''} />
            <span className="text-[9px] font-bold mt-1">Inspeções</span>
          </button>

          <button 
            onClick={() => { setActiveTab('formularios'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'formularios' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
              <Folder size={20} className={activeTab === 'formularios' ? 'fill-blue-50' : ''} />
              {activeTab !== 'formularios' && publishedForms.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
              )}
            </div>
            <span className="text-[9px] font-bold mt-1">Formulários</span>
          </button>
          
          <label className="flex flex-col items-center p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  toast.success(`Foto capturada com carimbo GPS (${format(new Date(), 'HH:mm')})!`);
                }
              }}
            />
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg -mt-6 mb-0.5 border-4 border-gray-50">
              <Camera size={18} />
            </div>
            <span className="text-[9px] font-bold">Lente D&A</span>
          </label>

          <button 
            onClick={() => { setActiveTab('preenchidos'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'preenchidos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
              <Download size={20} />
              {filledResponses.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full">
                  {filledResponses.length}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold mt-1">Preenchidos</span>
          </button>

          <button 
            onClick={() => { setActiveTab('gastos'); setActiveFillingForm(null); setActiveFormId(null); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'gastos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <DollarSign size={20} className={activeTab === 'gastos' ? 'fill-blue-50' : ''} />
            <span className="text-[9px] font-bold mt-1">Gastos</span>
          </button>
        </div>

        {/* MODAL INTERATIVO DE PRIMEIRO ACESSO / GUIA COMPLETO DO INSPETOR */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
              
              {/* Cabeçalho do Guia com Progresso */}
              <div className="bg-gradient-to-r from-[#071d3d] via-[#0b2b59] to-[#0055b3] text-white p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white p-1 rounded-xl shadow-sm">
                      <img src={logoUrl} alt="D&A" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 block">
                        Guia de Primeiro Acesso
                      </span>
                      <h3 className="text-sm font-black leading-tight">
                        Manual do Inspetor D&A
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFinishOnboarding()}
                    className="text-[11px] font-bold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full text-white/90 transition-colors cursor-pointer"
                  >
                    Pular
                  </button>
                </div>

                {/* Barra de Progresso em 6 etapas */}
                <div className="grid grid-cols-6 gap-1.5 mt-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOnboardingStep(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === onboardingStep
                          ? 'bg-emerald-400 scale-y-125'
                          : idx < onboardingStep
                          ? 'bg-blue-300'
                          : 'bg-white/25'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[10px] text-blue-200 font-bold">
                  <span>Passo {onboardingStep + 1} de 6</span>
                  <span>
                    {onboardingStep === 0 && 'Visão Geral'}
                    {onboardingStep === 1 && '1. Aba Inspeções'}
                    {onboardingStep === 2 && '2. Aba Formulários'}
                    {onboardingStep === 3 && '3. Lente D&A (Câmera)'}
                    {onboardingStep === 4 && '4. Aba Preenchidos (PDF)'}
                    {onboardingStep === 5 && '5. Aba Gastos'}
                  </span>
                </div>
              </div>

              {/* Corpo do Slide Atual */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* SLIDE 0: BOAS-VINDAS E VISÃO GERAL */}
                {onboardingStep === 0 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                      <span className="inline-block bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full mb-2">
                        Bem-vindo à Equipe de Campo
                      </span>
                      <h2 className="text-lg font-black text-slate-900">
                        Olá, {displayUserName}! 👋
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Este aplicativo foi desenvolvido exclusivamente para suas <strong>inspeções de campo</strong>. Tudo o que você preenche aqui conversa <strong>em tempo real</strong> com o sistema da gestão.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Conheça as 5 funções da barra inferior:
                      </p>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">1. Inspeções</p>
                          <p className="text-slate-500 text-[11px]">Sua agenda do dia, check-in GPS e Ordem de Serviço.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Folder size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">2. Formulários</p>
                          <p className="text-slate-500 text-[11px]">Checklists técnicos publicados pelo gestor para preencher.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Camera size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">3. Lente D&A</p>
                          <p className="text-slate-500 text-[11px]">Câmera rápida com carimbo automático de GPS e horário.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Download size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">4. Preenchidos</p>
                          <p className="text-slate-500 text-[11px]">Reveja seus formulários enviados e baixe o PDF corporativo.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <DollarSign size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">5. Gastos</p>
                          <p className="text-slate-500 text-[11px]">Lance despesas de Combustível, Alimentação e Hotel com foto.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 1: ABA INSPEÇÕES */}
                {onboardingStep === 1 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase">1ª Aba do Menu</span>
                        <h3 className="text-base font-black text-slate-900">Como usar a aba Inspeções</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Na aba <strong>Inspeções</strong> você acompanha sua rota diária e os clientes programados pelo gestor:
                    </p>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">Iniciar Inspeção (GPS)</p>
                          <p className="text-slate-500 mt-0.5">
                            Ao chegar no cliente, toque no botão azul <strong>"Iniciar Inspeção (GPS)"</strong>. Isso gera automaticamente a Ordem de Serviço e avisa o gestor que você iniciou o atendimento.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">Preencher Relatório da Rota</p>
                          <p className="text-slate-500 mt-0.5">
                            Em seguida, o botão muda para verde <strong>"Preencher Formulário"</strong>. Toque nele para registrar dados do cliente, peças inspecionadas e observações da visita.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 2: ABA FORMULÁRIOS */}
                {onboardingStep === 2 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Folder size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase">2ª Aba do Menu</span>
                        <h3 className="text-base font-black text-slate-900">Preenchendo Formulários</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Todos os checklists criados pelo Gestor aparecem instantaneamente na aba <strong>Formulários</strong>:
                    </p>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <p className="font-extrabold text-slate-800">📂 1. Escolha a Pasta / Categoria</p>
                        <p className="text-slate-500 mt-0.5">
                          Use os botões no topo (<em>Qualidade & Fabricação</em>, <em>Segurança & Estruturas</em>, etc.) para filtrar e toque no formulário desejado.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <p className="font-extrabold text-slate-800">✍️ 2. Responda todos os itens obrigatórios (*)</p>
                        <p className="text-slate-500 mt-0.5">
                          Preencha textos, números, datas e marque opções de conformidade (<em>Conforme</em>, <em>Não Conforme</em>, <em>Aprovado</em>).
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <p className="font-extrabold text-slate-800">📸 3. Anexe Fotos, Vídeos e Documentos</p>
                        <p className="text-slate-500 mt-0.5">
                          Nos campos de evidência, toque em <strong>Tirar Foto / Galeria</strong>. Ao terminar tudo, toque em <strong>"Finalizar e Enviar Formulário"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 3: LENTE D&A */}
                {onboardingStep === 3 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 bg-sky-50 p-3.5 rounded-2xl border border-sky-100">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Camera size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase">Botão Central</span>
                        <h3 className="text-base font-black text-slate-900">Câmera Rápida: Lente D&A</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Precisa registrar rapidamente uma evidência em campo? Toque no botão redondo central <strong>Lente D&A</strong>:
                    </p>

                    <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase">
                        <span>● Carimbo Automático D&A</span>
                        <span>GPS Ativo</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        A <strong>Lente D&A</strong> aciona diretamente a câmera traseira do seu celular e registra a foto com confirmação de horário e localização da inspeção.
                      </p>
                    </div>
                  </div>
                )}

                {/* SLIDE 4: ABA PREENCHIDOS E DOWNLOAD DE PDF */}
                {onboardingStep === 4 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Download size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase">4ª Aba do Menu</span>
                        <h3 className="text-base font-black text-slate-900">Aba Preenchidos e PDF Corporativo</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Todos os formulários que você enviou ficam salvos na aba <strong>Preenchidos</strong>:
                    </p>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                        <Eye size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-slate-800">Botão "Ver Respostas"</p>
                          <p className="text-slate-500 mt-0.5">
                            Abre uma janela para você conferir todas as respostas enviadas e visualizar as fotos anexadas.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                        <Download size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-slate-800">Botão "Baixar PDF"</p>
                          <p className="text-slate-600 mt-0.5">
                            Gera na hora o <strong>Relatório Técnico Corporativo em PDF da D&A Inspeções</strong> completo, com cabeçalho oficial, tabela de respostas, fotos em molduras técnicas e assinatura, pronto para enviar ou compartilhar!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 5: ABA GASTOS */}
                {onboardingStep === 5 && (
                  <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex items-center gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase">5ª Aba do Menu</span>
                        <h3 className="text-base font-black text-slate-900">Lançamento de Gastos e Reembolso</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Na aba <strong>Gastos</strong> você registra todas as suas despesas de viagem para reembolso imediato:
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                        <Truck size={18} className="mx-auto text-amber-600 mb-1" />
                        <p className="text-[11px] font-extrabold text-amber-900">Combustível</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <Coffee size={18} className="mx-auto text-emerald-600 mb-1" />
                        <p className="text-[11px] font-extrabold text-emerald-900">Alimentação</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                        <Home size={18} className="mx-auto text-indigo-600 mb-1" />
                        <p className="text-[11px] font-extrabold text-indigo-900">Hotel</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5">
                      <p className="font-extrabold text-slate-800">Como lançar um gasto:</p>
                      <p className="text-slate-600">1. Toque no tipo de despesa (<strong>Combustível</strong>, <strong>Alimentação</strong> ou <strong>Hotel</strong>).</p>
                      <p className="text-slate-600">2. Digite a descrição, o valor em <strong>R$</strong> e tire uma foto da nota fiscal/comprovante.</p>
                      <p className="text-slate-600">3. Toque em <strong>"Enviar Gasto para o Sistema"</strong>. O gestor recebe na hora!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé de Navegação do Guia */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                {onboardingStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                ) : (
                  <div />
                )}

                {onboardingStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Próximo</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFinishOnboarding('rota')}
                    className="flex-1 py-3 px-5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={16} />
                    <span>Entendi! Começar a Usar o App</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
