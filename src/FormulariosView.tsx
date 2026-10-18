import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Eye, Edit2, Folder, X,
  Camera, Video, Paperclip, Type, AlignLeft,
  List, CheckSquare, ChevronDown, ChevronUp,
  ArrowLeft, Globe, Lock, Calendar, Hash, Copy, CheckCircle, MessageSquare
} from 'react-feather';
import type { Icon } from 'react-feather';
import type {
  InspectionForm, FormField, FieldType, FieldOption, FormResponse
} from './stores/formulariosStore';
import {
  getForms, saveForms, FORMS_CHANGE_EVENT, newFormField,
  getFormResponses, RESPONSES_CHANGE_EVENT
} from './stores/formulariosStore';
import toast from 'react-hot-toast';

let formIdCounter = 0;
function createId(prefix: string): string {
  formIdCounter += 1;
  return `${prefix}_${formIdCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────
// Configurações de tipos de campo
// ─────────────────────────────────────────
interface FieldTypeConfig {
  type: FieldType;
  label: string;
  Icon: Icon;
  colorClass: string;
  hasOptions: boolean;
  description: string;
}

const FIELD_TYPE_CONFIGS: FieldTypeConfig[] = [
  { type: 'text',     label: 'Texto Curto',      Icon: Type,        colorClass: 'text-blue-600 bg-blue-50',    hasOptions: false, description: 'Resposta curta de texto' },
  { type: 'textarea', label: 'Parágrafo',         Icon: AlignLeft,   colorClass: 'text-indigo-600 bg-indigo-50', hasOptions: false, description: 'Resposta longa de texto' },
  { type: 'radio',    label: 'Múltipla Escolha',  Icon: List,        colorClass: 'text-purple-600 bg-purple-50', hasOptions: true,  description: 'Uma opção de uma lista' },
  { type: 'checkbox', label: 'Caixas de Seleção', Icon: CheckSquare, colorClass: 'text-violet-600 bg-violet-50', hasOptions: true,  description: 'Múltiplas opções' },
  { type: 'select',   label: 'Lista Suspensa',    Icon: ChevronDown, colorClass: 'text-pink-600 bg-pink-50',    hasOptions: true,  description: 'Menu dropdown' },
  { type: 'date',     label: 'Data',              Icon: Calendar,    colorClass: 'text-amber-600 bg-amber-50',  hasOptions: false, description: 'Seleção de data' },
  { type: 'number',   label: 'Número',            Icon: Hash,        colorClass: 'text-teal-600 bg-teal-50',    hasOptions: false, description: 'Valor numérico' },
  { type: 'photo',    label: 'Foto',              Icon: Camera,      colorClass: 'text-orange-600 bg-orange-50', hasOptions: false, description: 'Captura ou upload de foto' },
  { type: 'video',    label: 'Vídeo',             Icon: Video,       colorClass: 'text-red-600 bg-red-50',      hasOptions: false, description: 'Captura ou upload de vídeo' },
  { type: 'file',     label: 'Anexo',             Icon: Paperclip,   colorClass: 'text-gray-600 bg-gray-100',   hasOptions: false, description: 'Qualquer tipo de arquivo' },
];

// ─────────────────────────────────────────
// Paleta de cores
// ─────────────────────────────────────────
interface ColorPreset { name: string; bg: string; lightBg: string; lightBorder: string; text: string; }

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'blue',    bg: 'bg-blue-600',    lightBg: 'bg-blue-50',    lightBorder: 'border-blue-200',    text: 'text-blue-700'    },
  { name: 'emerald', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', lightBorder: 'border-emerald-200', text: 'text-emerald-700' },
  { name: 'violet',  bg: 'bg-violet-600',  lightBg: 'bg-violet-50',  lightBorder: 'border-violet-200',  text: 'text-violet-700'  },
  { name: 'amber',   bg: 'bg-amber-500',   lightBg: 'bg-amber-50',   lightBorder: 'border-amber-200',   text: 'text-amber-700'   },
  { name: 'rose',    bg: 'bg-rose-600',    lightBg: 'bg-rose-50',    lightBorder: 'border-rose-200',    text: 'text-rose-700'    },
  { name: 'teal',    bg: 'bg-teal-600',    lightBg: 'bg-teal-50',    lightBorder: 'border-teal-200',    text: 'text-teal-700'    },
];

function getColor(name: string): ColorPreset {
  return COLOR_PRESETS.find(c => c.name === name) ?? COLOR_PRESETS[0];
}

function getTypeConfig(type: FieldType): FieldTypeConfig {
  return FIELD_TYPE_CONFIGS.find(c => c.type === type) ?? FIELD_TYPE_CONFIGS[0];
}

// ─────────────────────────────────────────
// Tipos de view
// ─────────────────────────────────────────
type ViewMode = 'list' | 'builder' | 'preview';

// ═══════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════
export default function FormulariosView({ readOnly = false }: { readOnly?: boolean }) {
  const [forms, setForms]               = useState<InspectionForm[]>(() => getForms());
  const [responses, setResponses]       = useState<FormResponse[]>(() => getFormResponses());
  const [selectedFolder, setSelectedFolder] = useState<string>('Todas');
  const [viewingResponsesFor, setViewingResponsesFor] = useState<InspectionForm | null>(null);
  const [mode, setMode]                 = useState<ViewMode>('list');
  const [editingForm, setEditingForm]   = useState<InspectionForm | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const syncForms = () => setForms(getForms());
    const syncResponses = () => setResponses(getFormResponses());

    window.addEventListener(FORMS_CHANGE_EVENT, syncForms);
    window.addEventListener(RESPONSES_CHANGE_EVENT, syncResponses);
    return () => {
      window.removeEventListener(FORMS_CHANGE_EVENT, syncForms);
      window.removeEventListener(RESPONSES_CHANGE_EVENT, syncResponses);
    };
  }, []);

  // Close type dropdown on outside click
  useEffect(() => {
    const close = () => setShowTypeMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── List handlers ──
  const handleCreate = () => {
    setEditingForm({
      id: createId('form'),
      name: 'Novo Formulário',
      description: '',
      category: 'Geral',
      createdAt: '2026-10-18T00:00:00.000Z',
      fields: [],
      status: 'draft',
      color: 'blue',
    });
    setSelectedFieldId(null);
    setMode('builder');
  };

  const handleEdit = (form: InspectionForm) => {
    setEditingForm({ ...form, fields: form.fields.map(f => ({ ...f, options: f.options.map(o => ({ ...o })) })) });
    setSelectedFieldId(null);
    setMode('builder');
  };

  const handlePreview = (form: InspectionForm) => { setEditingForm(form); setMode('preview'); };

  const handleDelete = (id: string) => {
    saveForms(forms.filter(f => f.id !== id));
    toast.success('Formulário removido.');
    setDeleteConfirmId(null);
  };

  const handleDuplicate = (form: InspectionForm) => {
    const copy: InspectionForm = { ...form, id: createId('form'), name: form.name + ' (Cópia)', status: 'draft' };
    saveForms([...forms, copy]);
    toast.success('Formulário duplicado!');
  };

  // ── Builder handlers ──
  const upd = (updates: Partial<InspectionForm>) => {
    if (editingForm) setEditingForm({ ...editingForm, ...updates });
  };

  const addField = (type: FieldType) => {
    if (!editingForm) return;
    const f = newFormField(type);
    setEditingForm({ ...editingForm, fields: [...editingForm.fields, f] });
    setSelectedFieldId(f.id);
    setShowTypeMenu(null);
  };

  const updateField = (id: string, changes: Partial<FormField>) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, fields: editingForm.fields.map(f => f.id === id ? { ...f, ...changes } : f) });
  };

  const deleteField = (id: string) => {
    if (!editingForm) return;
    setEditingForm({ ...editingForm, fields: editingForm.fields.filter(f => f.id !== id) });
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const duplicateField = (field: FormField) => {
    if (!editingForm) return;
    const copy: FormField = { ...field, id: createId('field'), options: field.options.map(o => ({ ...o, id: createId('opt') })) };
    const idx = editingForm.fields.findIndex(f => f.id === field.id);
    const fields = [...editingForm.fields];
    fields.splice(idx + 1, 0, copy);
    setEditingForm({ ...editingForm, fields });
    setSelectedFieldId(copy.id);
  };

  const moveField = (id: string, dir: 'up' | 'down') => {
    if (!editingForm) return;
    const idx = editingForm.fields.findIndex(f => f.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === editingForm.fields.length - 1) return;
    const fields = [...editingForm.fields];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [fields[idx], fields[swapIdx]] = [fields[swapIdx], fields[idx]];
    setEditingForm({ ...editingForm, fields });
  };

  const addOption = (fieldId: string) => {
    const field = editingForm?.fields.find(f => f.id === fieldId);
    if (!field) return;
    const opt: FieldOption = { id: createId('opt'), label: `Opção ${field.options.length + 1}` };
    updateField(fieldId, { options: [...field.options, opt] });
  };

  const updateOption = (fieldId: string, optId: string, label: string) => {
    const field = editingForm?.fields.find(f => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: field.options.map(o => o.id === optId ? { ...o, label } : o) });
  };

  const deleteOption = (fieldId: string, optId: string) => {
    const field = editingForm?.fields.find(f => f.id === fieldId);
    if (!field || field.options.length <= 1) return;
    updateField(fieldId, { options: field.options.filter(o => o.id !== optId) });
  };

  const changeFieldType = (fieldId: string, type: FieldType) => {
    const field = editingForm?.fields.find(f => f.id === fieldId);
    if (!field) return;
    const hasOpts = ['radio', 'checkbox', 'select'].includes(type);
    updateField(fieldId, {
      type,
      options: hasOpts && field.options.length === 0
        ? [{ id: createId('opt_a'), label: 'Opção 1' }, { id: createId('opt_b'), label: 'Opção 2' }]
        : hasOpts ? field.options : [],
    });
    setShowTypeMenu(null);
  };

  const saveForm = (publish: boolean) => {
    if (!editingForm) return;
    if (!editingForm.name.trim()) { toast.error('Informe o nome do formulário.'); return; }
    const finalForm: InspectionForm = { ...editingForm, status: publish ? 'published' : editingForm.status, name: editingForm.name.trim() };
    const existing = forms.find(f => f.id === finalForm.id);
    const updated = existing ? forms.map(f => f.id === finalForm.id ? finalForm : f) : [...forms, finalForm];
    saveForms(updated);
    toast.success(publish ? '✅ Formulário publicado! Inspetores já podem acessá-lo.' : 'Rascunho salvo com sucesso!');
    setMode('list');
    setEditingForm(null);
  };

  // ══════════════════════════════════════════
  // VIEW: LISTA
  // ══════════════════════════════════════════
  if (mode === 'list') {
    const categories = ['Todas', ...Array.from(new Set(forms.map(f => f.category || 'Geral')))];
    const displayedForms = selectedFolder === 'Todas' ? forms : forms.filter(f => (f.category || 'Geral') === selectedFolder);
    const published = displayedForms.filter(f => f.status === 'published');
    const drafts    = displayedForms.filter(f => f.status === 'draft');

    return (
      <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
              <Folder className="mr-3 text-blue-600" size={28} />
              Formulários de Inspeção
            </h1>
            <p className="text-base text-gray-500 mt-1">
              Crie e organize formulários em pastas — inspetores preenchem em campo pelo app mobile com suporte a fotos, vídeos e anexos.
            </p>
          </div>
          {!readOnly && (
            <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center shrink-0">
              <Plus size={18} className="mr-2" /> Criar Formulário
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Modelos', value: forms.length, Icon: Folder, bg: 'bg-blue-50', ic: 'text-blue-600' },
            { label: 'Pastas / Categorias', value: categories.length - 1, Icon: Folder, bg: 'bg-purple-50', ic: 'text-purple-600' },
            { label: 'Publicados', value: published.length, Icon: Globe, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
            { label: 'Respostas Recebidas', value: responses.length, Icon: CheckCircle, bg: 'bg-teal-50', ic: 'text-teal-600' },
          ].map(s => {
            const SI = s.Icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center space-x-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}><SI size={20} className={s.ic} /></div>
                <div><p className="text-2xl font-black text-gray-900">{s.value}</p><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p></div>
              </div>
            );
          })}
        </div>

        {/* Pastas (Folders) Bar */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Folder size={18} className="text-blue-600" />
              <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pastas de Formulários</h2>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{categories.length - 1} pasta(s)</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map(cat => {
              const count = cat === 'Todas' ? forms.length : forms.filter(f => (f.category || 'Geral') === cat).length;
              const isSelected = selectedFolder === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedFolder(cat)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <Folder size={14} className={isSelected ? 'text-white' : 'text-blue-500'} />
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Published */}
        {published.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Globe size={13} className="text-emerald-600 mr-2" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Publicados — {selectedFolder === 'Todas' ? 'Todas as Pastas' : `Pasta: ${selectedFolder}`}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {published.map(f => (
                <FormCard key={f.id} form={f} readOnly={readOnly}
                  responsesCount={responses.filter(r => r.formId === f.id).length}
                  onViewResponses={() => setViewingResponsesFor(f)}
                  onEdit={() => handleEdit(f)} onPreview={() => handlePreview(f)}
                  onDuplicate={() => handleDuplicate(f)} onDelete={() => setDeleteConfirmId(f.id)}
                  confirmingDelete={deleteConfirmId === f.id}
                  onCancelDelete={() => setDeleteConfirmId(null)} onConfirmDelete={() => handleDelete(f.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Drafts */}
        {!readOnly && drafts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Lock size={13} className="text-amber-600 mr-2" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rascunhos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {drafts.map(f => (
                <FormCard key={f.id} form={f} readOnly={readOnly}
                  responsesCount={responses.filter(r => r.formId === f.id).length}
                  onViewResponses={() => setViewingResponsesFor(f)}
                  onEdit={() => handleEdit(f)} onPreview={() => handlePreview(f)}
                  onDuplicate={() => handleDuplicate(f)} onDelete={() => setDeleteConfirmId(f.id)}
                  confirmingDelete={deleteConfirmId === f.id}
                  onCancelDelete={() => setDeleteConfirmId(null)} onConfirmDelete={() => handleDelete(f.id)}
                />
              ))}
            </div>
          </div>
        )}

        {displayedForms.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Folder size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Nenhum formulário nesta pasta</h3>
            <p className="text-sm text-gray-400 mb-6">Crie um formulário ou selecione outra pasta.</p>
            {!readOnly && (
              <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center">
                <Plus size={16} className="mr-2" /> Criar Formulário
              </button>
            )}
          </div>
        )}

        {/* Modal de Respostas Recebidas */}
        {viewingResponsesFor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-tight">Respostas de Campo</h3>
                    <p className="text-xs text-gray-500">{viewingResponsesFor.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingResponsesFor(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {responses.filter(r => r.formId === viewingResponsesFor.id).length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-700">Nenhuma resposta recebida ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Quando os inspetores enviarem inspeções pelo celular, as respostas e fotos aparecerão aqui.</p>
                  </div>
                ) : (
                  responses.filter(r => r.formId === viewingResponsesFor.id).map(resp => (
                    <div key={resp.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-gray-900">{resp.inspectorName}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Enviado</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(resp.submittedAt).toLocaleString('pt-BR')}</span>
                      </div>

                      {/* Respostas por campo */}
                      <div className="space-y-2 text-xs">
                        {viewingResponsesFor.fields.map(field => {
                          const answer = resp.answers[field.id];
                          if (answer === undefined && (!resp.attachments || !resp.attachments.some(a => a.fieldId === field.id))) return null;
                          return (
                            <div key={field.id} className="bg-white p-3 rounded-xl border border-gray-100">
                              <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">{field.label}</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {Array.isArray(answer) ? answer.join(', ') : String(answer || '—')}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Anexos (Fotos / Vídeos / Arquivos) */}
                      {resp.attachments && resp.attachments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Evidências / Anexos ({resp.attachments.length})</p>
                          <div className="grid grid-cols-2 gap-2">
                            {resp.attachments.map((att, ai) => (
                              <div key={ai} className="flex items-center p-2 rounded-xl border border-gray-200 bg-white space-x-2">
                                {att.type === 'photo' && <Camera size={14} className="text-orange-500 shrink-0" />}
                                {att.type === 'video' && <Video size={14} className="text-red-500 shrink-0" />}
                                {att.type === 'file' && <Paperclip size={14} className="text-blue-500 shrink-0" />}
                                <span className="text-xs font-bold text-gray-700 truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // VIEW: PRÉ-VISUALIZAÇÃO
  // ══════════════════════════════════════════
  if (mode === 'preview' && editingForm) {
    return (
      <FormPreviewView
        form={editingForm}
        onBack={() => { setMode('list'); setEditingForm(null); }}
        onEdit={readOnly ? undefined : () => { setMode('builder'); setSelectedFieldId(null); }}
      />
    );
  }

  // ══════════════════════════════════════════
  // VIEW: BUILDER
  // ══════════════════════════════════════════
  if (mode === 'builder' && editingForm) {
    const color = getColor(editingForm.color);
    return (
      <div className="h-full flex flex-col -mt-2" onClick={() => setShowTypeMenu(null)}>

        {/* Builder Top Bar */}
        <div className={`${color.bg} text-white px-6 py-3 flex items-center justify-between shrink-0 -mx-6 mb-6`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => { setMode('list'); setEditingForm(null); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Editor de Formulário</p>
              <p className="text-sm font-extrabold truncate max-w-48 sm:max-w-80">{editingForm.name || 'Sem título'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setMode('preview')} className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
              <Eye size={14} /><span>Visualizar</span>
            </button>
            <button onClick={() => saveForm(false)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
              Salvar
            </button>
            <button onClick={() => saveForm(true)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors shadow-sm">
              <Globe size={13} /><span>Publicar</span>
            </button>
          </div>
        </div>

        {/* Scrollable builder body */}
        <div className="flex-1 overflow-y-auto pb-16 space-y-4">

          {/* Form settings card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-1.5 ${color.bg}`} />
            <div className="p-6">
              <input
                type="text" value={editingForm.name}
                onChange={e => upd({ name: e.target.value })}
                placeholder="Título do Formulário"
                className="w-full text-2xl font-extrabold text-gray-900 border-0 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 mb-3 transition-colors placeholder:text-gray-300 bg-transparent"
              />
              <textarea
                value={editingForm.description}
                onChange={e => upd({ description: e.target.value })}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full text-sm text-gray-600 border-0 border-b border-transparent focus:border-blue-300 focus:outline-none resize-none transition-colors placeholder:text-gray-300 mb-4 bg-transparent"
              />
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Categoria</label>
                  <input type="text" value={editingForm.category} onChange={e => upd({ category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Cor</label>
                  <div className="flex items-center space-x-1.5">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.name} onClick={() => upd({ color: c.name })}
                        className={`w-6 h-6 rounded-full ${c.bg} transition-transform ${editingForm.color === c.name ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${editingForm.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {editingForm.status === 'published' ? '● Publicado' : '○ Rascunho'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Field cards */}
          {editingForm.fields.map((field, idx) => {
            const cfg = getTypeConfig(field.type);
            const FieldIcon = cfg.Icon;
            const isSelected = selectedFieldId === field.id;
            const hasOpts = ['radio', 'checkbox', 'select'].includes(field.type);
            const isMediaType = ['photo', 'video', 'file'].includes(field.type);

            return (
              <div
                key={field.id}
                onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                className={`bg-white rounded-2xl border shadow-sm overflow-visible cursor-pointer transition-all ${isSelected ? 'border-blue-400 shadow-md shadow-blue-100' : 'border-gray-100 hover:border-gray-300'}`}
              >
                {isSelected && <div className={`h-1 ${color.bg} rounded-t-2xl`} />}
                <div className="p-5">

                  {/* Row 1: Type selector + index + actions */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Type selector */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onMouseDown={e => { e.stopPropagation(); setShowTypeMenu(showTypeMenu === field.id ? null : field.id); }}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${cfg.colorClass} hover:opacity-80`}
                      >
                        <FieldIcon size={13} />
                        <span className="hidden sm:inline">{cfg.label}</span>
                        <ChevronDown size={11} />
                      </button>
                      {showTypeMenu === field.id && (
                        <>
                          <div className="fixed inset-0 z-40" onMouseDown={() => setShowTypeMenu(null)} />
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 w-60 overflow-hidden py-1" onMouseDown={e => e.stopPropagation()}>
                            {FIELD_TYPE_CONFIGS.map(ft => {
                              const FtI = ft.Icon;
                              return (
                                <button key={ft.type} onMouseDown={() => changeFieldType(field.id, ft.type)}
                                  className={`w-full flex items-center px-3 py-2.5 hover:bg-gray-50 text-left transition-colors ${field.type === ft.type ? 'bg-blue-50' : ''}`}
                                >
                                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 shrink-0 ${ft.colorClass}`}><FtI size={13} /></span>
                                  <div>
                                    <p className="text-xs font-bold text-gray-800 leading-tight">{ft.label}</p>
                                    <p className="text-[10px] text-gray-400">{ft.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    <span className="text-xs font-bold text-gray-300">#{idx + 1}</span>
                    <div className="flex-1" />

                    {/* Move / copy / delete (only when selected) */}
                    {isSelected && (
                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => moveField(field.id, 'up')} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
                        <button onClick={() => moveField(field.id, 'down')} disabled={idx === editingForm.fields.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"><ChevronDown size={14} /></button>
                        <button onClick={() => duplicateField(field)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Copy size={14} /></button>
                        <button onClick={() => deleteField(field.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>

                  {/* Field label */}
                  <input
                    type="text" value={field.label}
                    onChange={e => updateField(field.id, { label: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    placeholder="Pergunta sem título"
                    className="w-full font-semibold text-gray-800 bg-transparent border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none pb-1.5 mb-3 text-sm transition-colors placeholder:text-gray-300 placeholder:font-normal"
                  />

                  {/* Placeholder for text / number */}
                  {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
                    <input type="text" value={field.placeholder ?? ''} onChange={e => updateField(field.id, { placeholder: e.target.value })} onClick={e => e.stopPropagation()}
                      placeholder="Texto de dica/exemplo (opcional)"
                      className="w-full text-xs text-gray-400 bg-transparent border border-dashed border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 mb-3 transition-colors"
                    />
                  )}

                  {/* Options for radio/checkbox/select */}
                  {hasOpts && (
                    <div className="space-y-2 mb-3" onClick={e => e.stopPropagation()}>
                      {field.options.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center space-x-2.5">
                          <div className={`w-4 h-4 shrink-0 border-2 border-gray-300 ${field.type === 'checkbox' ? 'rounded-md' : 'rounded-full'}`} />
                          <input type="text" value={opt.label} onChange={e => updateOption(field.id, opt.id, e.target.value)}
                            placeholder={`Opção ${oi + 1}`}
                            className="flex-1 text-sm text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none py-0.5 transition-colors"
                          />
                          {isSelected && field.options.length > 1 && (
                            <button onClick={() => deleteOption(field.id, opt.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={12} /></button>
                          )}
                        </div>
                      ))}
                      {isSelected && (
                        <button onClick={() => addOption(field.id)} className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1.5 transition-colors">
                          <Plus size={13} className="mr-1" /> Adicionar opção
                        </button>
                      )}
                    </div>
                  )}

                  {/* Media placeholder */}
                  {isMediaType && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center text-gray-400 mb-3">
                      {field.type === 'photo' && <Camera size={20} className="mb-1.5 text-orange-400" />}
                      {field.type === 'video' && <Video size={20} className="mb-1.5 text-red-400" />}
                      {field.type === 'file'  && <Paperclip size={20} className="mb-1.5 text-gray-500" />}
                      <p className="text-xs font-semibold text-center">
                        {field.type === 'photo' ? 'Campo de captura/upload de foto'
                          : field.type === 'video' ? 'Campo de captura/upload de vídeo'
                          : 'Campo de upload de arquivo'}
                      </p>
                    </div>
                  )}

                  {/* Required toggle (only when selected) */}
                  {isSelected && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                      <span className="text-xs font-semibold text-gray-500">Resposta obrigatória</span>
                      <button
                        onClick={() => updateField(field.id, { required: !field.required })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${field.required ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Field Button */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onMouseDown={e => { e.stopPropagation(); setShowTypeMenu(showTypeMenu === 'add-new' ? null : 'add-new'); }}
              className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-bold text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" /> Adicionar Campo
            </button>
            {showTypeMenu === 'add-new' && (
              <>
                <div className="fixed inset-0 z-40" onMouseDown={() => setShowTypeMenu(null)} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-2 grid grid-cols-2 gap-1 w-72" onMouseDown={e => e.stopPropagation()}>
                  {FIELD_TYPE_CONFIGS.map(ft => {
                    const FtI = ft.Icon;
                    return (
                      <button key={ft.type} onMouseDown={() => addField(ft.type)}
                        className="flex items-center px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2 shrink-0 ${ft.colorClass}`}><FtI size={13} /></span>
                        <span className="text-xs font-bold text-gray-700">{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
function FormCard({ 
  form, readOnly, responsesCount = 0, onViewResponses, onEdit, onPreview, onDuplicate, onDelete, confirmingDelete, onCancelDelete, onConfirmDelete 
}: {
  form: InspectionForm; readOnly: boolean;
  responsesCount?: number; onViewResponses?: () => void;
  onEdit: () => void; onPreview: () => void;
  onDuplicate: () => void; onDelete: () => void;
  confirmingDelete: boolean; onCancelDelete: () => void; onConfirmDelete: () => void;
}) {
  const c = getColor(form.color);
  const hasPhoto = form.fields.some(f => f.type === 'photo');
  const hasVideo = form.fields.some(f => f.type === 'video');
  const hasFile = form.fields.some(f => f.type === 'file');
  const hasSelection = form.fields.some(f => ['radio', 'checkbox', 'select'].includes(f.type));

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${confirmingDelete ? 'border-red-300 shadow-red-100' : 'border-gray-100'}`}>
      <div className={`h-2 ${c.bg}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.lightBg} flex items-center justify-center`}>
            <Folder size={20} className={c.text} />
          </div>
          <div className="flex items-center space-x-1.5">
            {responsesCount > 0 && (
              <button
                type="button"
                onClick={onViewResponses}
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors flex items-center"
                title="Ver respostas deste formulário"
              >
                <MessageSquare size={10} className="mr-1" /> {responsesCount} resp.
              </button>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {form.status === 'published' ? '● Publicado' : '○ Rascunho'}
            </span>
          </div>
        </div>
        <h3 className="font-extrabold text-gray-900 text-sm leading-tight mb-0.5">{form.name}</h3>
        <p className="text-xs text-blue-600 font-semibold mb-1">📁 {form.category || 'Geral'}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{form.description || 'Sem descrição informada.'}</p>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {hasPhoto && <span className="bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded text-[9px] font-bold">📷 Foto</span>}
          {hasVideo && <span className="bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded text-[9px] font-bold">🎥 Vídeo</span>}
          {hasFile && <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold">📎 Anexo</span>}
          {hasSelection && <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded text-[9px] font-bold">☑ Seleção</span>}
        </div>

        <div className="flex items-center text-xs text-gray-400 mb-4 space-x-2">
          <span className="font-semibold text-gray-600">{form.fields.length} campos</span>
          <span>·</span>
          <span>{new Date(form.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>

        {confirmingDelete ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-600 text-center">Remover este formulário?</p>
            <div className="flex space-x-2">
              <button onClick={onCancelDelete} className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded-xl transition-colors">Cancelar</button>
              <button onClick={onConfirmDelete} className="flex-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 py-2 rounded-xl transition-colors">Remover</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={onPreview} className="flex-1 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded-xl transition-colors">
              <Eye size={13} className="mr-1" /> Ver
            </button>
            {!readOnly && (
              <>
                <button onClick={onEdit} className={`flex-1 flex items-center justify-center text-xs font-bold text-white ${c.bg} hover:opacity-90 py-2 rounded-xl transition-colors`}>
                  <Edit2 size={13} className="mr-1" /> Editar
                </button>
                <button onClick={onDuplicate} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" title="Duplicar"><Copy size={14} /></button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Remover"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-componente: FormPreviewView
// ═══════════════════════════════════════════════════════════
function FormPreviewView({ form, onBack, onEdit }: { form: InspectionForm; onBack: () => void; onEdit?: () => void }) {
  const c = getColor(form.color);
  return (
    <div className="h-full flex flex-col -mt-2 animate-[fadeIn_0.2s_ease-out]">
      <div className={`${c.bg} text-white px-6 py-3 flex items-center justify-between shrink-0 -mx-6 mb-6`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><ArrowLeft size={16} /></button>
          <div>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Pré-visualização</p>
            <p className="text-sm font-extrabold truncate max-w-48">{form.name}</p>
          </div>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors">
            <Edit2 size={13} /><span>Editar</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className={`bg-white rounded-2xl border ${c.lightBorder} shadow-sm overflow-hidden`}>
            <div className={`h-2 ${c.bg}`} />
            <div className="p-6">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{form.name}</h1>
              {form.description && <p className="text-sm text-gray-500 mb-2">{form.description}</p>}
              <p className="text-xs text-gray-400 font-semibold">{form.category} · {form.fields.length} campos</p>
            </div>
          </div>

          {form.fields.map((field, idx) => (
            <div key={field.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block font-semibold text-gray-800 text-sm mb-3">
                {idx + 1}. {field.label || 'Pergunta sem título'}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <PreviewField field={field} />
            </div>
          ))}

          {form.fields.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-400 text-sm">Formulário sem campos ainda.</p>
            </div>
          )}

          {form.fields.length > 0 && (
            <button className={`w-full ${c.bg} text-white font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity`}>
              Enviar Formulário
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-componente: PreviewField — renderiza campo no modo leitura
// ═══════════════════════════════════════════════════════════
function PreviewField({ field }: { field: FormField }) {
  if (field.type === 'text')
    return <input type="text" placeholder={field.placeholder || 'Sua resposta'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50" />;

  if (field.type === 'textarea')
    return <textarea rows={3} placeholder={field.placeholder || 'Sua resposta'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 resize-none" />;

  if (field.type === 'number')
    return <input type="number" placeholder={field.placeholder || '0'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50" />;

  if (field.type === 'date')
    return <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50" />;

  if (field.type === 'radio')
    return (
      <div className="space-y-2">
        {field.options.map(o => (
          <label key={o.id} className="flex items-center space-x-3 cursor-pointer">
            <input type="radio" name={field.id} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">{o.label}</span>
          </label>
        ))}
      </div>
    );

  if (field.type === 'checkbox')
    return (
      <div className="space-y-2">
        {field.options.map(o => (
          <label key={o.id} className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm text-gray-700">{o.label}</span>
          </label>
        ))}
      </div>
    );

  if (field.type === 'select')
    return (
      <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50">
        <option value="">Selecione...</option>
        {field.options.map(o => <option key={o.id}>{o.label}</option>)}
      </select>
    );

  if (field.type === 'photo')
    return (
      <button className="w-full border-2 border-dashed border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-xl py-6 flex flex-col items-center text-orange-600 transition-colors">
        <Camera size={22} className="mb-1.5" />
        <span className="text-sm font-bold">Tirar foto / Galeria</span>
        <span className="text-xs text-orange-400 mt-0.5">JPG, PNG — máx. 10MB</span>
      </button>
    );

  if (field.type === 'video')
    return (
      <button className="w-full border-2 border-dashed border-red-200 bg-red-50 hover:bg-red-100 rounded-xl py-6 flex flex-col items-center text-red-600 transition-colors">
        <Video size={22} className="mb-1.5" />
        <span className="text-sm font-bold">Gravar / Selecionar vídeo</span>
        <span className="text-xs text-red-400 mt-0.5">MP4 — máx. 50MB</span>
      </button>
    );

  if (field.type === 'file')
    return (
      <button className="w-full border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl py-6 flex flex-col items-center text-gray-500 transition-colors">
        <Paperclip size={22} className="mb-1.5" />
        <span className="text-sm font-bold">Selecionar arquivo</span>
        <span className="text-xs text-gray-400 mt-0.5">PDF, DOC, XLS — máx. 20MB</span>
      </button>
    );

  return null;
}
