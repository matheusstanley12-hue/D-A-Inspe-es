// ============================================================
// Formulários Store — fonte única de verdade para formulários
// ============================================================
export type FieldType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'photo'
  | 'video'
  | 'file'
  | 'date'
  | 'number';

export interface FieldOption {
  id: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options: FieldOption[];
  placeholder?: string;
}

export interface InspectionForm {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  fields: FormField[];
  status: 'draft' | 'published';
  color: string;
}

export const FORMS_CHANGE_EVENT = 'da_forms_changed';
const STORAGE_KEY = 'da_inspecoes_forms_v2';

// -------- Formulários padrão --------
function getDefaultForms(): InspectionForm[] {
  return [
    {
      id: 'f1',
      name: 'Diligenciamento Q (Fabricação e Solda)',
      description: 'Acompanhamento de processos fabris, controle de ordens de venda e rastreabilidade de materiais.',
      category: 'Qualidade & Fabricação',
      createdAt: new Date().toISOString(),
      status: 'published',
      color: 'blue',
      fields: [
        { id: 'f1_1', type: 'text', label: 'Nº do Pedido / OV', required: true, options: [], placeholder: 'Ex: OV-2026-001' },
        { id: 'f1_2', type: 'number', label: 'Quantidade Inspecionada', required: true, options: [], placeholder: 'Ex: 100' },
        { id: 'f1_3', type: 'text', label: 'Nº do Desenho / Revisão', required: false, options: [], placeholder: 'Ex: A754615 rev.0' },
        { id: 'f1_4', type: 'text', label: 'Código da Peça', required: false, options: [], placeholder: 'Ex: 705275' },
        {
          id: 'f1_5', type: 'radio', label: 'Inspeção Visual de Solda', required: true,
          options: [
            { id: 'o1', label: 'Conforme' },
            { id: 'o2', label: 'Não Conforme' },
            { id: 'o3', label: 'N/A' },
          ], placeholder: '',
        },
        {
          id: 'f1_6', type: 'radio', label: 'Relato Final de Conformidade', required: true,
          options: [
            { id: 'o1', label: 'Aprovado' },
            { id: 'o2', label: 'Reprovado' },
            { id: 'o3', label: 'Aprovado com Ressalvas' },
          ], placeholder: '',
        },
        { id: 'f1_7', type: 'photo', label: 'Fotos de Evidência', required: false, options: [], placeholder: '' },
        { id: 'f1_8', type: 'textarea', label: 'Observações Gerais', required: false, options: [], placeholder: 'Descreva qualquer observação relevante...' },
      ],
    },
    {
      id: 'f2',
      name: 'Inspeção de Estrutura Metálica (NR-12)',
      description: 'Avaliação de integridade estrutural conforme norma NR-12.',
      category: 'Segurança & Estruturas',
      createdAt: new Date().toISOString(),
      status: 'published',
      color: 'emerald',
      fields: [
        { id: 'f2_1', type: 'text', label: 'Identificação do Equipamento', required: true, options: [], placeholder: 'Ex: Prensa Hidráulica PH-001' },
        { id: 'f2_2', type: 'date', label: 'Data da Inspeção', required: true, options: [], placeholder: '' },
        {
          id: 'f2_3', type: 'radio', label: 'Proteções Mecânicas Móveis', required: true,
          options: [
            { id: 'o1', label: 'Conforme' },
            { id: 'o2', label: 'Não Conforme' },
            { id: 'o3', label: 'N/A' },
          ], placeholder: '',
        },
        {
          id: 'f2_4', type: 'radio', label: 'Intertravamento de Segurança', required: true,
          options: [
            { id: 'o1', label: 'Conforme' },
            { id: 'o2', label: 'Não Conforme' },
            { id: 'o3', label: 'N/A' },
          ], placeholder: '',
        },
        {
          id: 'f2_5', type: 'checkbox', label: 'Itens Verificados', required: false,
          options: [
            { id: 'o1', label: 'Parafusos e fixações' },
            { id: 'o2', label: 'Corrosão / Pintura' },
            { id: 'o3', label: 'Sinalização de Risco' },
            { id: 'o4', label: 'Alinhamento de Pilares' },
          ], placeholder: '',
        },
        { id: 'f2_6', type: 'photo', label: 'Fotos do Equipamento', required: true, options: [], placeholder: '' },
        { id: 'f2_7', type: 'file', label: 'Anexar Certificado / Laudo', required: false, options: [], placeholder: '' },
      ],
    },
    {
      id: 'f3',
      name: 'Relatório Fotográfico de Campo',
      description: 'Coleta de evidências fotográficas com timestamp.',
      category: 'Evidências & Registro',
      createdAt: new Date().toISOString(),
      status: 'draft',
      color: 'amber',
      fields: [
        { id: 'f3_1', type: 'text', label: 'Local da Inspeção', required: true, options: [], placeholder: 'Ex: Fábrica ABC - Setor 3' },
        { id: 'f3_2', type: 'photo', label: 'Foto Geral do Equipamento', required: true, options: [], placeholder: '' },
        { id: 'f3_3', type: 'photo', label: 'Foto de Plaqueta de Identificação', required: true, options: [], placeholder: '' },
        { id: 'f3_4', type: 'video', label: 'Vídeo de Funcionamento (opcional)', required: false, options: [], placeholder: '' },
        { id: 'f3_5', type: 'textarea', label: 'Descrição das Evidências', required: true, options: [], placeholder: 'Descreva detalhadamente...' },
        {
          id: 'f3_6', type: 'radio', label: 'Recomendação', required: true,
          options: [
            { id: 'o1', label: 'Ação Imediata Necessária' },
            { id: 'o2', label: 'Manutenção Preventiva' },
            { id: 'o3', label: 'Sem Pendências' },
          ], placeholder: '',
        },
      ],
    },
  ];
}

// -------- API pública --------
export function getForms(): InspectionForm[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as InspectionForm[];
  } catch { /* ignore */ }
  const defaults = getDefaultForms();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveForms(forms: InspectionForm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  window.dispatchEvent(new Event(FORMS_CHANGE_EVENT));
}

export interface FormResponse {
  id: string;
  formId: string;
  formName: string;
  inspectorName: string;
  submittedAt: string;
  answers: Record<string, any>;
  attachments?: {
    fieldId: string;
    type: 'photo' | 'video' | 'file';
    name: string;
    url: string;
  }[];
}

export const RESPONSES_CHANGE_EVENT = 'da_form_responses_changed';
const RESPONSES_STORAGE_KEY = 'da_inspecoes_form_responses_v1';

export function getFormResponses(formId?: string): FormResponse[] {
  try {
    const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (stored) {
      const all: FormResponse[] = JSON.parse(stored);
      if (formId) return all.filter(r => r.formId === formId);
      return all;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveFormResponse(response: FormResponse): void {
  try {
    const existing = getFormResponses();
    const updated = [response, ...existing];
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
  } catch { /* ignore */ }
}

export function newFormField(type: FieldType = 'text'): FormField {
  const hasOptions = ['radio', 'checkbox', 'select'].includes(type);
  return {
    id: 'field_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    label: '',
    required: false,
    placeholder: '',
    options: hasOptions
      ? [
          { id: 'opt_a_' + Date.now(), label: 'Opção 1' },
          { id: 'opt_b_' + Date.now(), label: 'Opção 2' },
        ]
      : [],
  };
}

