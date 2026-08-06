-- =============================================================
-- REIS FLOW - Migration 20260806_006
-- Etapa 1: Multi-Tenant — tabela empresas + coluna empresa_id
-- =============================================================

begin;

-- ------------------------------------------------------------
-- 1. Tabela empresas
-- ------------------------------------------------------------
create table if not exists public.empresas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  cnpj          text,
  email         text,
  telefone      text,
  plano         text not null default 'basico' check (plano in ('basico', 'profissional', 'enterprise')),
  status        text not null default 'ativo' check (status in ('ativo', 'inativo', 'suspenso')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists idx_empresas_cnpj_unique
  on public.empresas (cnpj) where cnpj is not null and trim(cnpj) <> '';

alter table public.empresas enable row level security;

-- ------------------------------------------------------------
-- 2. empresa_id em profiles (vínculo usuário → empresa)
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists empresa_id uuid references public.empresas (id) on delete set null;

create index if not exists idx_profiles_empresa_id on public.profiles (empresa_id);

-- ------------------------------------------------------------
-- 3. empresa_id nas tabelas de negócio
-- ------------------------------------------------------------
alter table public.clientes
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.obras
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.orcamentos
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.orcamento_itens
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.financeiro_receber
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.financeiro_pagar
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.equipe
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.usuarios_sistema
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.estoque_itens
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.fornecedores
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.estoque_movimentos
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.obra_etapas
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

alter table public.obra_historico
  add column if not exists empresa_id uuid references public.empresas (id) on delete cascade;

-- ------------------------------------------------------------
-- 4. Índices de performance por empresa_id
-- ------------------------------------------------------------
create index if not exists idx_clientes_empresa_id            on public.clientes (empresa_id);
create index if not exists idx_obras_empresa_id               on public.obras (empresa_id);
create index if not exists idx_orcamentos_empresa_id          on public.orcamentos (empresa_id);
create index if not exists idx_orcamento_itens_empresa_id     on public.orcamento_itens (empresa_id);
create index if not exists idx_financeiro_receber_empresa_id  on public.financeiro_receber (empresa_id);
create index if not exists idx_financeiro_pagar_empresa_id    on public.financeiro_pagar (empresa_id);
create index if not exists idx_equipe_empresa_id              on public.equipe (empresa_id);
create index if not exists idx_usuarios_sistema_empresa_id    on public.usuarios_sistema (empresa_id);
create index if not exists idx_estoque_itens_empresa_id       on public.estoque_itens (empresa_id);
create index if not exists idx_fornecedores_empresa_id        on public.fornecedores (empresa_id);
create index if not exists idx_estoque_movimentos_empresa_id  on public.estoque_movimentos (empresa_id);
create index if not exists idx_obra_etapas_empresa_id         on public.obra_etapas (empresa_id);
create index if not exists idx_obra_historico_empresa_id      on public.obra_historico (empresa_id);

commit;
