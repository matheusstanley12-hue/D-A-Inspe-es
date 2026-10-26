// ============================================================
// Formulários & Operação Store — fonte única de verdade em Produção
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
const STORAGE_KEY = 'da_inspecoes_forms_prod_v1';

// Limpeza automática de dados antigos de teste/homologação ao iniciar produção
const PROD_CLEANUP_KEY = 'da_inspecoes_prod_cleanup_done_v1';
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(PROD_CLEANUP_KEY)) {
      const legacyKeys = [
        'da_inspecoes_form_responses_v1',
        'da_inspecoes_expenses_v1',
        'da_inspecoes_users_v1',
        'da_inspecoes_users_v2',
        'da_user_pwd_changed_v1',
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(PROD_CLEANUP_KEY, 'true');
    }
  } catch { /* ignore */ }
}

// -------- Modelos de Formulários Padrão da Operação --------
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
      status: 'published',
      color: 'amber',
      fields: [
        { id: 'f3_1', type: 'text', label: 'Local da Inspeção', required: true, options: [], placeholder: 'Ex: Unidade Industrial - Setor 1' },
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

// -------- API pública de Formulários --------
export function getForms(): InspectionForm[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as InspectionForm[];
  } catch { /* ignore */ }
  const defaults = getDefaultForms();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch { /* ignore */ }
  return defaults;
}

export function saveForms(forms: InspectionForm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(FORMS_CHANGE_EVENT));
  pushSyncToServer({ forms, replaceForms: true });
}

// ============================================================
// Respostas / Laudos Enviados de Campo
// ============================================================
export interface FormResponse {
  id: string;
  formId: string;
  formName: string;
  category?: string;
  inspectorName: string;
  inspectorSignature?: string;
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
const RESPONSES_STORAGE_KEY = 'da_inspecoes_form_responses_prod_v1';

let memoryResponses: FormResponse[] | null = null;
let memoryExpenses: InspectorExpense[] | null = null;
let memoryClients: SystemClient[] | null = null;
let memoryOrders: ServiceOrder[] | null = null;

function getDefaultFormResponses(): FormResponse[] {
  return [];
}

export function getFormResponses(formId?: string): FormResponse[] {
  if (memoryResponses) {
    if (formId) return memoryResponses.filter(r => r.formId === formId);
    return memoryResponses;
  }
  try {
    const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (stored) {
      const all = (JSON.parse(stored) as FormResponse[]).filter(r => r && r.id !== 'resp_default_001');
      memoryResponses = all;
      if (formId) return all.filter(r => r.formId === formId);
      return all;
    }
  } catch { /* ignore */ }
  const defaults = getDefaultFormResponses();
  memoryResponses = defaults;
  return defaults;
}

export function saveFormResponse(response: FormResponse): void {
  const existing = getFormResponses();
  const updated = [response, ...existing.filter(r => r.id !== response.id)];
  memoryResponses = updated;

  try {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    try {
      localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updated.slice(0, 15)));
    } catch { /* ignore */ }
  }

  window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
  pushSyncToServer({ responses: updated });
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
const EXPENSES_STORAGE_KEY = 'da_inspecoes_expenses_prod_v1';

export function getExpenses(): InspectorExpense[] {
  if (memoryExpenses) return memoryExpenses;
  try {
    const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as InspectorExpense[];
      memoryExpenses = parsed;
      return parsed;
    }
  } catch { /* ignore */ }
  memoryExpenses = [];
  return [];
}

export function saveExpense(expense: InspectorExpense): void {
  const existing = getExpenses();
  const updated = [expense, ...existing.filter(e => e.id !== expense.id)];
  memoryExpenses = updated;
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
    } catch { /* ignore */ }
  }
  window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
  pushSyncToServer({ expenses: updated });
}

// ============================================================
// Clientes Cadastrados no Sistema
// ============================================================
export interface SystemClient {
  id: string;
  companyName: string;
  cnpj: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  activeOvs: number;
  status: 'ativo' | 'inativo';
  createdAt?: string;
}

export const CLIENTS_CHANGE_EVENT = 'da_clients_changed';
const CLIENTS_STORAGE_KEY = 'da_inspecoes_clients_prod_v1';

export function getClients(): SystemClient[] {
  if (memoryClients) return memoryClients;
  try {
    const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SystemClient[];
      memoryClients = parsed;
      return parsed;
    }
  } catch { /* ignore */ }
  memoryClients = [];
  return [];
}

export function saveClients(clients: SystemClient[], deletedClientIds?: string[]): void {
  memoryClients = clients;
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(CLIENTS_CHANGE_EVENT));
  pushSyncToServer({ clients, replaceClients: true, deletedClientIds });
}

// ============================================================
// Ordens de Serviço / Demandas de Campo
// ============================================================
export interface ServiceOrder {
  id: string;
  code: string;
  client: string;
  location: string;
  inspector: string;
  inspectorEmail?: string;
  type: string;
  formId?: string;
  status: 'Concluída' | 'Em Andamento' | 'Agendada' | 'Pendente' | 'Cancelada';
  date: string; // YYYY-MM-DD ou DD/MM/YYYY
  StartTime?: string;
  EndTime?: string;
  progress: number;
  notes?: string;
  responseId?: string;
  createdAt?: string;
  recordedGpsTrail?: [number, number][]; // Pontos GPS reais percorridos pelo inspetor
  traveledKm?: number; // Total de KM percorrido via GPS
  startedAt?: string;
  finishedAt?: string;
}

export const ORDERS_CHANGE_EVENT = 'da_orders_changed';
const ORDERS_STORAGE_KEY = 'da_inspecoes_orders_prod_v1';

export function getServiceOrders(): ServiceOrder[] {
  if (memoryOrders) return memoryOrders;
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ServiceOrder[];
      memoryOrders = parsed;
      return parsed;
    }
  } catch { /* ignore */ }
  memoryOrders = [];
  return [];
}

export function saveServiceOrders(orders: ServiceOrder[], deletedOrderIds?: string[]): void {
  memoryOrders = orders;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
  pushSyncToServer({ orders, replaceOrders: true, deletedOrderIds });
}

export function upsertServiceOrder(order: ServiceOrder): void {
  const existing = getServiceOrders();
  const updated = [order, ...existing.filter(o => o.id !== order.id && o.code !== order.code)];
  saveServiceOrders(updated);
}

// ============================================================
// Usuários Cadastrados no Sistema (com Senha Padrão 123456 e Troca no 1º Acesso)
// ============================================================
export const DEFAULT_INITIAL_PASSWORD = '123456';
export const USERS_CHANGE_EVENT = 'da_users_changed';
const USERS_STORAGE_KEY = 'da_inspecoes_users_prod_v1';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'gestor' | 'financeiro' | 'inspetor' | 'cliente';
  status: 'ativo' | 'inativo';
  company?: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  updatedAt?: number;
}

export const MASTER_DEV_EMAIL = 'matheus.stanley12@gmail.com';
export const MASTER_DEV_PASSWORD = '35215415';

export const DEFAULT_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr_1',
    name: 'Matheus Stanley',
    email: MASTER_DEV_EMAIL,
    password: MASTER_DEV_PASSWORD,
    role: 'gestor',
    status: 'ativo',
    mustChangePassword: false,
    updatedAt: 1,
  },
  {
    id: 'usr_1792782362978',
    name: 'Bruno Ribeiro',
    email: 'bruno.ribeiro@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'inspetor',
    status: 'ativo',
    mustChangePassword: true,
    updatedAt: 1792782362978,
  },
  {
    id: 'usr_1792780650649',
    name: 'Yuri Duarte',
    email: 'yuri.duarte@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'gestor',
    status: 'ativo',
    mustChangePassword: true,
    updatedAt: 1793041336685,
  },
  {
    id: 'usr_1792782317781',
    name: 'Augusto',
    email: 'contato@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'gestor',
    status: 'ativo',
    mustChangePassword: true,
    updatedAt: 1792782317781,
  },
  {
    id: 'usr_1792782337473',
    name: 'Fabio',
    email: 'fabio.reis@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'gestor',
    status: 'ativo',
    mustChangePassword: true,
    updatedAt: 1792782337473,
  },
  {
    id: 'usr_inspetor_default',
    name: 'Inspetor D&A',
    email: 'inspetor@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'inspetor',
    status: 'ativo',
    mustChangePassword: true,
    updatedAt: 0,
  },
  {
    id: 'usr_admin',
    name: 'Administrador D&A',
    email: 'admin@deainspecoes.com.br',
    password: DEFAULT_INITIAL_PASSWORD,
    role: 'gestor',
    status: 'ativo',
    mustChangePassword: false,
    updatedAt: 0,
  },
];

const LEGACY_TEST_EMAILS = new Set([
  'testecliente@gmail.com',
  'testeinspetor@gmail.com',
]);

let memoryUsers: SystemUser[] | null = null;

function getUserRank(u: SystemUser): number {
  if (typeof u.updatedAt === 'number' && u.updatedAt > 0) return u.updatedAt;
  if (u.passwordChangedAt) {
    const parsed = Date.parse(u.passwordChangedAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (u.mustChangePassword === false) return 1;
  return 0;
}

export function mergeSystemUsersList(existing: SystemUser[] = [], incoming: SystemUser[] = []): SystemUser[] {
  const map = new Map<string, SystemUser>();
  const getKey = (u: SystemUser) => (u?.email ? u.email.trim().toLowerCase() : String(u?.id || ''));

  for (const u of existing) {
    if (!u) continue;
    const key = getKey(u);
    if (LEGACY_TEST_EMAILS.has(key) && (!u.updatedAt || u.updatedAt === 0)) continue;
    if (key) map.set(key, u);
  }

  for (const u of incoming) {
    if (!u) continue;
    const key = getKey(u);
    if (!key) continue;
    if (LEGACY_TEST_EMAILS.has(key) && (!u.updatedAt || u.updatedAt === 0)) continue;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, u);
    } else if (getUserRank(u) >= getUserRank(prev)) {
      map.set(key, u);
    }
  }

  if (map.has(MASTER_DEV_EMAIL)) {
    const prev = map.get(MASTER_DEV_EMAIL)!;
    map.set(MASTER_DEV_EMAIL, {
      ...prev,
      name: 'Matheus Stanley',
      email: MASTER_DEV_EMAIL,
      password: MASTER_DEV_PASSWORD,
      role: 'gestor',
      status: 'ativo',
      mustChangePassword: false,
      updatedAt: Math.max(Number(prev?.updatedAt) || 0, 1),
    });
  }

  return Array.from(map.values());
}

export function getSystemUsers(): SystemUser[] {
  if (memoryUsers && memoryUsers.length > 0) {
    return memoryUsers;
  }
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = mergeSystemUsersList(DEFAULT_SYSTEM_USERS, parsed);
        memoryUsers = merged;
        return merged;
      }
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_USERS));
  } catch {
    // ignore
  }
  memoryUsers = DEFAULT_SYSTEM_USERS;
  return DEFAULT_SYSTEM_USERS;
}

export function saveSystemUsers(users: SystemUser[], replaceOnServer = true, deletedUserIds?: string[]): void {
  memoryUsers = users;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(USERS_CHANGE_EVENT));
  pushSyncToServer({ users, replaceUsers: replaceOnServer, deletedUserIds });
}

export function findSystemUserByEmail(emailOrUsername: string): SystemUser | undefined {
  const clean = emailOrUsername.trim().toLowerCase();
  if (!clean) return undefined;
  if (clean === MASTER_DEV_EMAIL || clean === 'matheus.stanley12' || clean === 'matheus') {
    return {
      id: 'usr_1',
      name: 'Matheus Stanley',
      email: MASTER_DEV_EMAIL,
      password: MASTER_DEV_PASSWORD,
      role: 'gestor',
      status: 'ativo',
      mustChangePassword: false,
      updatedAt: 1,
    };
  }
  const allUsers = getSystemUsers();
  // 1. Busca por correspondência exata de e-mail ou prefixo de login (antes do @)
  const exact = allUsers.find(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uLogin = uEmail.split('@')[0];
    return uEmail === clean || uLogin === clean;
  });
  if (exact) return exact;

  // 2. Busca por nome completo ou parcial (ex: "Bruno", "Bruno Ribeiro")
  return allUsers.find(u => {
    const uName = (u.name || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    return (
      uName === clean ||
      (clean.length >= 3 && (uName.startsWith(clean) || uEmail.startsWith(clean)))
    );
  });
}

export function updateUserPassword(email: string, newPassword: string): SystemUser | null {
  const clean = email.trim().toLowerCase();
  const current = getSystemUsers();
  const nowIso = new Date().toISOString();
  const nowTs = Date.now();
  let updatedUser: SystemUser | null = null;

  const exists = current.some(u => {
    const uEmail = u.email.trim().toLowerCase();
    return uEmail === clean || uEmail.split('@')[0] === clean;
  });
  let nextUsers: SystemUser[];

  if (exists) {
    nextUsers = current.map(u => {
      const uEmail = u.email.trim().toLowerCase();
      if (uEmail === clean || uEmail.split('@')[0] === clean) {
        updatedUser = {
          ...u,
          password: newPassword,
          mustChangePassword: false,
          passwordChangedAt: nowIso,
          updatedAt: nowTs,
        };
        return updatedUser;
      }
      return u;
    });
  } else {
    const inferredRole: SystemUser['role'] = clean.includes('inspetor')
      ? 'inspetor'
      : clean.includes('cliente')
      ? 'cliente'
      : 'gestor';
    const localName = clean.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Usuário D&A';
    updatedUser = {
      id: 'usr_' + nowTs,
      name: localName,
      email: email.trim(),
      password: newPassword,
      role: inferredRole,
      status: 'ativo',
      mustChangePassword: false,
      passwordChangedAt: nowIso,
      updatedAt: nowTs,
    };
    nextUsers = [...current, updatedUser];
  }

  saveSystemUsers(nextUsers, true);
  return updatedUser;
}

export function resetUserPasswordToDefault(userId: string): SystemUser | null {
  const current = getSystemUsers();
  const nowTs = Date.now();
  let resetTarget: SystemUser | null = null;
  const nextUsers = current.map(u => {
    if (String(u.id) === String(userId)) {
      resetTarget = {
        ...u,
        password: DEFAULT_INITIAL_PASSWORD,
        mustChangePassword: true,
        passwordChangedAt: undefined,
        updatedAt: nowTs,
      };
      return resetTarget;
    }
    return u;
  });
  saveSystemUsers(nextUsers, true);
  return resetTarget;
}

// ============================================================
// Sincronização em Tempo Real (App Mobile <-> Sistema Web)
// ============================================================
const DEFAULT_SERVER_URLS = [
  typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')
    ? `${window.location.origin}/api/sync`
    : null,
  'http://10.10.131.201:5173/api/sync',
  'http://10.10.131.136:5173/api/sync',
  'http://10.10.131.94:5173/api/sync',
  'http://10.0.2.2:5173/api/sync',
  'http://localhost:5173/api/sync',
].filter(Boolean) as string[];

export function getSyncServerUrl(): string {
  return localStorage.getItem('da_sync_server_url') || 'http://10.10.131.201:5173';
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
  clients?: SystemClient[];
  replaceClients?: boolean;
  deletedClientIds?: string[];
  orders?: ServiceOrder[];
  replaceOrders?: boolean;
  deletedOrderIds?: string[];
  users?: SystemUser[];
  replaceUsers?: boolean;
  deletedUserIds?: string[];
}): Promise<boolean> {
  const endpoints = getCandidateSyncEndpoints();
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
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
      const timer = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        applyServerSyncData(data);
        const localUsers = getSystemUsers();
        const serverUsers: SystemUser[] = Array.isArray(data.users) ? data.users : [];
        const hasNewerLocalUser = localUsers.some(lu => {
          const luRank = getUserRank(lu);
          if (luRank <= 0) return false;
          const su = serverUsers.find(s => s.email?.trim().toLowerCase() === lu.email?.trim().toLowerCase());
          return !su || luRank > getUserRank(su);
        });

        if (((!data.forms || data.forms.length === 0) && getForms().length > 0) || hasNewerLocalUser || serverUsers.length === 0) {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              forms: getForms(),
              responses: getFormResponses(),
              expenses: getExpenses(),
              clients: getClients(),
              orders: getServiceOrders(),
              users: localUsers,
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

  if (Array.isArray(data.users) && data.users.length > 0) {
    const currentLocal = memoryUsers || DEFAULT_SYSTEM_USERS;
    const mergedUsers = mergeSystemUsersList(currentLocal, data.users);
    memoryUsers = mergedUsers;
    try {
      const currentStr = localStorage.getItem(USERS_STORAGE_KEY);
      const nextStr = JSON.stringify(mergedUsers);
      if (currentStr !== nextStr) {
        localStorage.setItem(USERS_STORAGE_KEY, nextStr);
        window.dispatchEvent(new Event(USERS_CHANGE_EVENT));
      }
    } catch {
      window.dispatchEvent(new Event(USERS_CHANGE_EVENT));
    }
  }

  if (Array.isArray(data.responses)) {
    const localResponses = getFormResponses();
    const map = new Map<string, FormResponse>();
    for (const r of localResponses) {
      if (r && r.id !== 'resp_default_001') map.set(r.id, r);
    }
    for (const r of data.responses) {
      if (r && r.id !== 'resp_default_001') map.set(r.id, r);
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const prevCount = memoryResponses ? memoryResponses.length : 0;
    memoryResponses = merged;
    try {
      const currentStr = localStorage.getItem(RESPONSES_STORAGE_KEY);
      const nextStr = JSON.stringify(merged);
      if (currentStr !== nextStr) {
        localStorage.setItem(RESPONSES_STORAGE_KEY, nextStr);
        window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
      } else if (merged.length !== prevCount) {
        window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
      }
    } catch {
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
    const prevCount = memoryExpenses ? memoryExpenses.length : 0;
    memoryExpenses = merged;
    try {
      const currentStr = localStorage.getItem(EXPENSES_STORAGE_KEY);
      const nextStr = JSON.stringify(merged);
      if (currentStr !== nextStr) {
        localStorage.setItem(EXPENSES_STORAGE_KEY, nextStr);
        window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
      } else if (merged.length !== prevCount) {
        window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
      }
    } catch {
      window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
    }
  }

  if (Array.isArray(data.clients)) {
    const localClients = getClients();
    const map = new Map<string, SystemClient>();
    for (const c of localClients) map.set(c.id, c);
    for (const c of data.clients) map.set(c.id, c);
    const merged = Array.from(map.values());
    const prevCount = memoryClients ? memoryClients.length : 0;
    memoryClients = merged;
    try {
      const currentStr = localStorage.getItem(CLIENTS_STORAGE_KEY);
      const nextStr = JSON.stringify(merged);
      if (currentStr !== nextStr) {
        localStorage.setItem(CLIENTS_STORAGE_KEY, nextStr);
        window.dispatchEvent(new Event(CLIENTS_CHANGE_EVENT));
      } else if (merged.length !== prevCount) {
        window.dispatchEvent(new Event(CLIENTS_CHANGE_EVENT));
      }
    } catch {
      window.dispatchEvent(new Event(CLIENTS_CHANGE_EVENT));
    }
  }

  if (Array.isArray(data.orders)) {
    const localOrders = getServiceOrders();
    const map = new Map<string, ServiceOrder>();
    for (const o of localOrders) map.set(o.id, o);
    for (const o of data.orders) map.set(o.id, o);
    const merged = Array.from(map.values());
    const prevCount = memoryOrders ? memoryOrders.length : 0;
    memoryOrders = merged;
    try {
      const currentStr = localStorage.getItem(ORDERS_STORAGE_KEY);
      const nextStr = JSON.stringify(merged);
      if (currentStr !== nextStr) {
        localStorage.setItem(ORDERS_STORAGE_KEY, nextStr);
        window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
      } else if (merged.length !== prevCount) {
        window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
      }
    } catch {
      window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
    }
  }
}

// Iniciar polling automático e escuta entre abas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) window.dispatchEvent(new Event(FORMS_CHANGE_EVENT));
    if (e.key === RESPONSES_STORAGE_KEY) window.dispatchEvent(new Event(RESPONSES_CHANGE_EVENT));
    if (e.key === EXPENSES_STORAGE_KEY) window.dispatchEvent(new Event(EXPENSES_CHANGE_EVENT));
    if (e.key === CLIENTS_STORAGE_KEY) window.dispatchEvent(new Event(CLIENTS_CHANGE_EVENT));
    if (e.key === ORDERS_STORAGE_KEY) window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
    if (e.key === USERS_STORAGE_KEY) window.dispatchEvent(new Event(USERS_CHANGE_EVENT));
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
