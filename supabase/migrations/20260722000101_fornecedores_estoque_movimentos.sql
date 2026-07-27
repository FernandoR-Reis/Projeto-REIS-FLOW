-- =============================================================
-- REIS FLOW - Migration 20260722_001
-- Objetivo:
-- 1) Criar tabela de fornecedores
-- 2) Criar tabela de movimentos de estoque
-- 3) Relacionar estoque_itens -> fornecedores
-- =============================================================

begin;

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null default 'geral',
  vendedor text,
  telefone text,
  email text,
  cnpj text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_fornecedores_nome_ci
  on public.fornecedores (lower(trim(nome)));

create unique index if not exists idx_fornecedores_cnpj_unique
  on public.fornecedores (cnpj)
  where cnpj is not null and trim(cnpj) <> '';

alter table public.estoque_itens
  add column if not exists fornecedor_id uuid references public.fornecedores (id) on delete set null;

create index if not exists idx_estoque_itens_fornecedor_id
  on public.estoque_itens (fornecedor_id);

create table if not exists public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  estoque_item_id uuid not null references public.estoque_itens (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade integer not null check (quantidade > 0),
  custo_unitario numeric(14,2),
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  obra_id uuid references public.obras (id) on delete set null,
  observacao text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_estoque_movimentos_item_id
  on public.estoque_movimentos (estoque_item_id);

create index if not exists idx_estoque_movimentos_tipo
  on public.estoque_movimentos (tipo);

create index if not exists idx_estoque_movimentos_created_at
  on public.estoque_movimentos (created_at desc);

create index if not exists idx_estoque_movimentos_fornecedor_id
  on public.estoque_movimentos (fornecedor_id);

-- Backfill inicial de fornecedores a partir dos campos texto legados
insert into public.fornecedores (nome, categoria, status)
select src.nome, 'geral', 'ativo'
from (
  select trim(fornecedor) as nome
  from public.estoque_itens
  where fornecedor is not null and trim(fornecedor) <> ''

  union

  select trim(fornecedor) as nome
  from public.financeiro_pagar
  where fornecedor is not null and trim(fornecedor) <> ''
) src
where not exists (
  select 1
  from public.fornecedores f
  where lower(trim(f.nome)) = lower(trim(src.nome))
);

-- Relaciona estoque_itens com fornecedores via nome legado
update public.estoque_itens e
set fornecedor_id = f.id
from public.fornecedores f
where e.fornecedor is not null
  and trim(e.fornecedor) <> ''
  and lower(trim(e.fornecedor)) = lower(trim(f.nome))
  and e.fornecedor_id is null;

alter table public.fornecedores enable row level security;
alter table public.estoque_movimentos enable row level security;

drop policy if exists fornecedores_all_authenticated on public.fornecedores;
drop policy if exists estoque_movimentos_all_authenticated on public.estoque_movimentos;

create policy fornecedores_all_authenticated
on public.fornecedores
for all
to authenticated
using (true)
with check (true);

create policy estoque_movimentos_all_authenticated
on public.estoque_movimentos
for all
to authenticated
using (true)
with check (true);

commit;
