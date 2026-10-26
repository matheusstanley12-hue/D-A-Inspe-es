-- ==============================================================================
-- D&A INSPEÇÕES - SCRIPT COMPLETO DE CONFIGURAÇÃO DO SUPABASE (SCHEMA SQL)
-- Copie e cole todo este script no SQL Editor do seu painel do Supabase e clique em RUN.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE PERFIS DE USUÁRIOS (Sincronizado com Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('gestor', 'financeiro', 'inspetor', 'cliente')) DEFAULT 'inspetor',
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  company TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 3. TABELA DE MODELOS DE FORMULÁRIOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Geral',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
  color TEXT DEFAULT 'blue',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABELA DE ORDENS DE SERVIÇO / DEMANDAS DE CAMPO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.service_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  client TEXT NOT NULL,
  location TEXT,
  inspector TEXT NOT NULL,
  inspector_email TEXT,
  type TEXT DEFAULT 'Inspeção',
  form_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  response_id TEXT,
  recorded_gps_trail JSONB DEFAULT '[]'::jsonb,
  traveled_km NUMERIC(10, 2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON public.service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_inspector_email ON public.service_orders(inspector_email);
CREATE INDEX IF NOT EXISTS idx_service_orders_code ON public.service_orders(code);

-- ==============================================================================
-- 5. TABELA DE LAUDOS / RESPOSTAS DE FORMULÁRIOS ENVIADOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.form_responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  form_name TEXT NOT NULL,
  category TEXT,
  inspector_name TEXT NOT NULL,
  inspector_email TEXT,
  inspector_signature TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  fields_snapshot JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_inspector_email ON public.form_responses(inspector_email);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON public.form_responses(submitted_at DESC);

-- ==============================================================================
-- 6. TABELA DE CLIENTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  active_ovs INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABELA DE GASTOS DE CAMPO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('combustivel', 'alimentacao', 'hotel', 'outro')),
  valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  inspector_name TEXT NOT NULL,
  inspector_email TEXT,
  receipt BOOLEAN DEFAULT false,
  receipt_url TEXT,
  receipt_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expenses_inspector_email ON public.expenses(inspector_email);

-- ==============================================================================
-- 8. TRIGGER AUTOMÁTICO PARA CRIAÇÃO DE PERFIL VIA AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    status,
    company,
    must_change_password
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'inspetor'),
    COALESCE(new.raw_user_meta_data->>'status', 'ativo'),
    new.raw_user_meta_data->>'company',
    COALESCE((new.raw_user_meta_data->>'must_change_password')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registra a trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) E POLÍTICAS PERMISSIVAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles (permite leitura/escrita para usuários autenticados e chave anon)
CREATE POLICY "Permitir acesso total a profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Políticas para forms
CREATE POLICY "Permitir acesso total a forms" ON public.forms FOR ALL USING (true) WITH CHECK (true);

-- Políticas para service_orders
CREATE POLICY "Permitir acesso total a service_orders" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);

-- Políticas para form_responses
CREATE POLICY "Permitir acesso total a form_responses" ON public.form_responses FOR ALL USING (true) WITH CHECK (true);

-- Políticas para clients
CREATE POLICY "Permitir acesso total a clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Políticas para expenses
CREATE POLICY "Permitir acesso total a expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. BUCKET DE ARMAZENAMENTO PARA FOTOS, ASSINATURAS E DOCUMENTOS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('da-inspecoes', 'da-inspecoes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas do Bucket de Armazenamento
DROP POLICY IF EXISTS "Acesso público ao bucket da-inspecoes" ON storage.objects;
CREATE POLICY "Acesso público ao bucket da-inspecoes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'da-inspecoes');

DROP POLICY IF EXISTS "Upload livre no bucket da-inspecoes" ON storage.objects;
CREATE POLICY "Upload livre no bucket da-inspecoes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'da-inspecoes');

DROP POLICY IF EXISTS "Update livre no bucket da-inspecoes" ON storage.objects;
CREATE POLICY "Update livre no bucket da-inspecoes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'da-inspecoes');

DROP POLICY IF EXISTS "Delete livre no bucket da-inspecoes" ON storage.objects;
CREATE POLICY "Delete livre no bucket da-inspecoes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'da-inspecoes');

-- ==============================================================================
-- 11. INSERÇÃO DOS FORMULÁRIOS INICIAIS DA OPERAÇÃO
-- ==============================================================================
INSERT INTO public.forms (id, name, description, category, status, color, fields)
VALUES
(
  'f1',
  'Diligenciamento Q (Fabricação e Solda)',
  'Acompanhamento de processos fabris, controle de ordens de venda e rastreabilidade de materiais.',
  'Qualidade & Fabricação',
  'published',
  'blue',
  '[
    {"id":"f1_1","type":"text","label":"Nº do Pedido / OV","required":true,"options":[],"placeholder":"Ex: OV-2026-001"},
    {"id":"f1_2","type":"number","label":"Quantidade Inspecionada","required":true,"options":[],"placeholder":"Ex: 100"},
    {"id":"f1_3","type":"text","label":"Nº do Desenho / Revisão","required":false,"options":[],"placeholder":"Ex: A754615 rev.0"},
    {"id":"f1_4","type":"text","label":"Código da Peça","required":false,"options":[],"placeholder":"Ex: 705275"},
    {"id":"f1_5","type":"radio","label":"Inspeção Visual de Solda","required":true,"options":[{"id":"o1","label":"Conforme"},{"id":"o2","label":"Não Conforme"},{"id":"o3","label":"N/A"}],"placeholder":""},
    {"id":"f1_6","type":"radio","label":"Relato Final de Conformidade","required":true,"options":[{"id":"o1","label":"Aprovado"},{"id":"o2","label":"Reprovado"},{"id":"o3","label":"Aprovado com Ressalvas"}],"placeholder":""},
    {"id":"f1_7","type":"photo","label":"Fotos de Evidência","required":false,"options":[],"placeholder":""},
    {"id":"f1_8","type":"textarea","label":"Observações Gerais","required":false,"options":[],"placeholder":"Descreva qualquer observação relevante..."}
  ]'::jsonb
),
(
  'f2',
  'Inspeção de Estrutura Metálica (NR-12)',
  'Avaliação de integridade estrutural conforme norma NR-12.',
  'Segurança & Estruturas',
  'published',
  'emerald',
  '[
    {"id":"f2_1","type":"text","label":"Identificação do Equipamento","required":true,"options":[],"placeholder":"Ex: Prensa Hidráulica PH-001"},
    {"id":"f2_2","type":"date","label":"Data da Inspeção","required":true,"options":[],"placeholder":""},
    {"id":"f2_3","type":"radio","label":"Proteções Mecânicas Móveis","required":true,"options":[{"id":"o1","label":"Conforme"},{"id":"o2","label":"Não Conforme"},{"id":"o3","label":"N/A"}],"placeholder":""},
    {"id":"f2_4","type":"radio","label":"Intertravamento de Segurança","required":true,"options":[{"id":"o1","label":"Conforme"},{"id":"o2","label":"Não Conforme"},{"id":"o3","label":"N/A"}],"placeholder":""},
    {"id":"f2_5","type":"checkbox","label":"Itens Verificados","required":false,"options":[{"id":"o1","label":"Parafusos e fixações"},{"id":"o2","label":"Corrosão / Pintura"},{"id":"o3","label":"Sinalização de Risco"},{"id":"o4","label":"Alinhamento de Pilares"}],"placeholder":""},
    {"id":"f2_6","type":"photo","label":"Fotos do Equipamento","required":true,"options":[],"placeholder":""},
    {"id":"f2_7","type":"file","label":"Anexar Certificado / Laudo","required":false,"options":[],"placeholder":""}
  ]'::jsonb
),
(
  'f3',
  'Relatório Fotográfico de Campo',
  'Coleta de evidências fotográficas com timestamp.',
  'Evidências & Registro',
  'published',
  'amber',
  '[
    {"id":"f3_1","type":"text","label":"Local da Inspeção","required":true,"options":[],"placeholder":"Ex: Unidade Industrial - Setor 1"},
    {"id":"f3_2","type":"photo","label":"Foto Geral do Equipamento","required":true,"options":[],"placeholder":""},
    {"id":"f3_3","type":"photo","label":"Foto de Plaqueta de Identificação","required":true,"options":[],"placeholder":""},
    {"id":"f3_4","type":"video","label":"Vídeo de Funcionamento (opcional)","required":false,"options":[],"placeholder":""},
    {"id":"f3_5","type":"textarea","label":"Descrição das Evidências","required":true,"options":[],"placeholder":"Descreva detalhadamente..."},
    {"id":"f3_6","type":"radio","label":"Recomendação","required":true,"options":[{"id":"o1","label":"Ação Imediata Necessária"},{"id":"o2","label":"Manutenção Preventiva"},{"id":"o3","label":"Sem Pendências"}],"placeholder":""}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
