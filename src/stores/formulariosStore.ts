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
  pushSyncToServer({ forms, replaceForms: true });
}

export interface FormResponse {
  id: string;
  formId: string;
  formName: string;
  category?: string;
  inspectorName: string;
  submittedAt: string;
  answers: Record<string, any>;
  fieldsSnapshot?: FormField[];
  attachments?: {
    fieldId: string;
    type: 'photo' | 'video' | 'file';
    name: string;
    url: string;
  }[];
}

export const RESPONSES_CHANGE_EVENT = 'da_form_responses_changed';
const RESPONSES_STORAGE_KEY = 'da_inspecoes_form_responses_v1';

function getDefaultFormResponses(): FormResponse[] {
  const defaultForms = getDefaultForms();
  const f1 = defaultForms[0];
  return [
    {
      id: 'resp_default_001',
      formId: 'f1',
      formName: 'Diligenciamento Q (Fabricação e Solda)',
      category: 'Qualidade & Fabricação',
      inspectorName: 'Matheus Stanley',
      submittedAt: new Date().toISOString(),
      fieldsSnapshot: f1?.fields || [],
      answers: {
        f1_1: 'OV-2026-0842 / CORACORTHE',
        f1_2: '48',
        f1_3: 'DES-A754615 Rev.02',
        f1_4: '705275-ESTRUTURAL',
        f1_5: 'Conforme',
        f1_6: 'Aprovado',
        f1_8: 'Inspeção dimensional e visual de solda concluída em 100% do lote. Cordões de solda contínuos, isentos de trincas, mordeduras ou porosidades superficiais. Rastreabilidade de matéria-prima validada conforme certificado de usina.',
      },
      attachments: [
        {
          fieldId: 'f1_7',
          type: 'photo',
          name: 'Inspecao_Visual_Solda_01.jpg',
          url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80',
        },
        {
          fieldId: 'f1_7',
          type: 'photo',
          name: 'Controle_Dimensional_Peca_02.jpg',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        },
      ],
    },
  ];
}

export function getFormResponses(formId?: string): FormResponse[] {
  try {
    const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (stored) {
      const all: FormResponse[] = JSON.parse(stored);
      if (all.length > 0) {
        if (formId) return all.filter(r => r.formId === formId);
        return all;
      }
    }
  } catch { /* ignore */ }
  const defaults = getDefaultFormResponses();
  try {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(defaults));
  } catch { /* ignore */ }
  if (formId) return defaults.filter(r => r.formId === formId);
  return defaults;
}

export function saveFormResponse(response: FormResponse): void {
  try {
    const existing = getFormResponses();
    const updated = [response, ...existing.filter(r => r.id !== response.id)];
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
    pushSyncToServer({ responses: updated });
  } catch { /* ignore */ }
}

// ============================================================
// Gastos de Campo (Combustível, Alimentação, Hotel)
// ============================================================
export type ExpenseCategory = 'combustivel' | 'alimentacao' | 'hotel';

export interface InspectorExpense {
  id: string;
  category: ExpenseCategory;
  valor: number;
  description: string;
  inspectorName: string;
  createdAt: string;
  receipt: boolean;
  receiptUrl?: string;
  receiptName?: string;
}

export const EXPENSES_CHANGE_EVENT = 'da_expenses_changed';
const EXPENSES_STORAGE_KEY = 'da_inspecoes_expenses_v1';

export function getExpenses(): InspectorExpense[] {
  try {
    const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as InspectorExpense[];
  } catch { /* ignore */ }
  return [];
}

export function saveExpense(expense: InspectorExpense): void {
  try {
    const existing = getExpenses();
    const updated = [expense, ...existing.filter(e => e.id !== expense.id)];
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
    pushSyncToServer({ expenses: updated });
  } catch { /* ignore */ }
}

// ============================================================
// Sincronização em Tempo Real (App Mobile <-> Sistema Web)
// ============================================================
const DEFAULT_SERVER_URLS = [
  typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')
    ? `${window.location.origin}/api/sync`
    : null,
  'http://10.10.131.94:5173/api/sync',
  'http://localhost:5173/api/sync',
].filter(Boolean) as string[];

export function getSyncServerUrl(): string {
  return localStorage.getItem('da_sync_server_url') || 'http://10.10.131.94:5173';
}

export function setSyncServerUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '').replace(/\/api\/sync$/, '');
  localStorage.setItem('da_sync_server_url', clean);
  syncFromServer();
}

function getCandidateSyncEndpoints(): string[] {
  const custom = localStorage.getItem('da_sync_server_url');
  const list: string[] = [];
  if (custom) {
    const clean = custom.trim().replace(/\/+$/, '').replace(/\/api\/sync$/, '');
    list.push(`${clean}/api/sync`);
  }
  for (const u of DEFAULT_SERVER_URLS) {
    if (!list.includes(u)) list.push(u);
  }
  return list;
}

export async function pushSyncToServer(payload: {
  forms?: InspectionForm[];
  replaceForms?: boolean;
  responses?: FormResponse[];
  expenses?: InspectorExpense[];
}): Promise<boolean> {
  const endpoints = getCandidateSyncEndpoints();
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        applyServerSyncData(data);
        return true;
      }
    } catch {
      // Tenta o próximo endpoint
    }
  }
  return false;
}

export async function syncFromServer(): Promise<boolean> {
  const endpoints = getCandidateSyncEndpoints();
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        applyServerSyncData(data);
        // Se o servidor ainda estiver vazio mas este dispositivo tiver dados locais, envia ao servidor
        if ((!data.forms || data.forms.length === 0) && getForms().length > 0) {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              forms: getForms(),
              responses: getFormResponses(),
              expenses: getExpenses(),
            }),
          });
        }
        return true;
      }
    } catch {
      // Tenta o próximo endpoint
    }
  }
  return false;
}

function applyServerSyncData(data: any): void {
  if (!data) return;

  if (Array.isArray(data.forms) && data.forms.length > 0) {
    const currentStr = localStorage.getItem(STORAGE_KEY);
    const nextStr = JSON.stringify(data.forms);
    if (currentStr !== nextStr) {
      localStorage.setItem(STORAGE_KEY, nextStr);
      window.dispatchEvent(new Event(FORMS_CHANGE_EVENT));
    }
  }

  if (Array.isArray(data.responses)) {
    const localResponses = getFormResponses();
    const map = new Map<string, FormResponse>();
    for (const r of localResponses) map.set(r.id, r);
    for (const r of data.responses) map.set(r.id, r);
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const currentStr = localStorage.getItem(RESPONSES_STORAGE_KEY);
    const nextStr = JSON.stringify(merged);
    if (currentStr !== nextStr) {
      localStorage.setItem(RESPONSES_STORAGE_KEY, nextStr);
      window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
    }
  }

  if (Array.isArray(data.expenses)) {
    const localExpenses = getExpenses();
    const map = new Map<string, InspectorExpense>();
    for (const e of localExpenses) map.set(e.id, e);
    for (const e of data.expenses) map.set(e.id, e);
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const currentStr = localStorage.getItem(EXPENSES_STORAGE_KEY);
    const nextStr = JSON.stringify(merged);
    if (currentStr !== nextStr) {
      localStorage.setItem(EXPENSES_STORAGE_KEY, nextStr);
      window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
    }
  }
}

// Iniciar polling automático e escuta entre abas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) window.dispatchEvent(new Event(FORMS_CHANGE_EVENT));
    if (e.key === RESPONSES_STORAGE_KEY) window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
    if (e.key === EXPENSES_STORAGE_KEY) window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
  });

  // Sincronizar a cada 3 segundos
  setTimeout(() => { syncFromServer(); }, 500);
  setInterval(() => { syncFromServer(); }, 3000);
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

