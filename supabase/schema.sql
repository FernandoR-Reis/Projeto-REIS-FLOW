create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  telefone text,
  cargo text default 'operador',
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_documento text not null check (tipo_documento in ('CPF', 'CNPJ')),
  documento text not null unique,
  telefone text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  responsavel_nome text,
  prazo date,
  valor numeric(14,2) not null default 0,
  status text not null default 'orcamento' check (status in ('orcamento', 'aprovada', 'andamento', 'pausada', 'atrasada', 'concluida')),
  localizacao text,
  created_at timestamptz not null default now()
);

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  margem_percentual numeric(5,2) not null default 0,
  validade date,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado', 'expirado')),
  created_at timestamptz not null default now()
);

create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  descricao text not null,
  quantidade numeric(12,2) not null default 1,
  valor_unitario numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.financeiro_receber (
  id uuid primary key default gen_random_uuid(),
  referencia text not null unique,
  cliente_id uuid references public.clientes (id) on delete set null,
  obra_id uuid references public.obras (id) on delete set null,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('vencido', 'pendente', 'futuro', 'recebido')),
  created_at timestamptz not null default now()
);

create table if not exists public.financeiro_pagar (
  id uuid primary key default gen_random_uuid(),
  referencia text not null unique,
  fornecedor text not null,
  categoria text,
  valor numeric(14,2) not null default 0,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('vencido', 'pendente', 'futuro', 'pago')),
  created_at timestamptz not null default now()
);

create table if not exists public.equipe (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text not null,
  diaria numeric(14,2) not null default 0,
  comissao_percentual numeric(5,2) not null default 0,
  obra_id uuid references public.obras (id) on delete set null,
  status text not null default 'disponivel' check (status in ('campo', 'disponivel', 'afastado')),
  created_at timestamptz not null default now()
);

create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  categoria text not null,
  quantidade integer not null default 0,
  minimo integer not null default 0,
  custo_unitario numeric(14,2) not null default 0,
  fornecedor text,
  created_at timestamptz not null default now()
);

create table if not exists public.obra_etapas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  titulo text not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluida')),
  ordem integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.obra_historico (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text,
  metadata jsonb not null default '{}'::jsonb,
  autor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_obras_cliente_id on public.obras (cliente_id);
create index if not exists idx_orcamentos_cliente_id on public.orcamentos (cliente_id);
create index if not exists idx_orcamento_itens_orcamento_id on public.orcamento_itens (orcamento_id);
create index if not exists idx_financeiro_receber_cliente_id on public.financeiro_receber (cliente_id);
create index if not exists idx_financeiro_receber_obra_id on public.financeiro_receber (obra_id);
create index if not exists idx_equipe_obra_id on public.equipe (obra_id);
create index if not exists idx_obra_etapas_obra_id on public.obra_etapas (obra_id);
create index if not exists idx_obra_etapas_obra_ordem on public.obra_etapas (obra_id, ordem);
create index if not exists idx_obra_historico_obra_id on public.obra_historico (obra_id);
create index if not exists idx_obra_historico_created_at on public.obra_historico (created_at desc);

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.obras enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.financeiro_receber enable row level security;
alter table public.financeiro_pagar enable row level security;
alter table public.equipe enable row level security;
alter table public.estoque_itens enable row level security;
alter table public.obra_etapas enable row level security;
alter table public.obra_historico enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists clientes_all_authenticated on public.clientes;
drop policy if exists obras_all_authenticated on public.obras;
drop policy if exists orcamentos_all_authenticated on public.orcamentos;
drop policy if exists orcamento_itens_all_authenticated on public.orcamento_itens;
drop policy if exists financeiro_receber_all_authenticated on public.financeiro_receber;
drop policy if exists financeiro_pagar_all_authenticated on public.financeiro_pagar;
drop policy if exists equipe_all_authenticated on public.equipe;
drop policy if exists estoque_itens_all_authenticated on public.estoque_itens;
drop policy if exists obra_etapas_all_authenticated on public.obra_etapas;
drop policy if exists obra_historico_all_authenticated on public.obra_historico;

create policy clientes_all_authenticated on public.clientes for all to authenticated using (true) with check (true);
create policy obras_all_authenticated on public.obras for all to authenticated using (true) with check (true);
create policy orcamentos_all_authenticated on public.orcamentos for all to authenticated using (true) with check (true);
create policy orcamento_itens_all_authenticated on public.orcamento_itens for all to authenticated using (true) with check (true);
create policy financeiro_receber_all_authenticated on public.financeiro_receber for all to authenticated using (true) with check (true);
create policy financeiro_pagar_all_authenticated on public.financeiro_pagar for all to authenticated using (true) with check (true);
create policy equipe_all_authenticated on public.equipe for all to authenticated using (true) with check (true);
create policy estoque_itens_all_authenticated on public.estoque_itens for all to authenticated using (true) with check (true);
create policy obra_etapas_all_authenticated on public.obra_etapas for all to authenticated using (true) with check (true);
create policy obra_historico_all_authenticated on public.obra_historico for all to authenticated using (true) with check (true);