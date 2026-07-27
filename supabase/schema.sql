create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  telefone text,
  cargo text default 'operador',
  created_at timestamptz not null default now()
);

create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid references public.equipe (id) on delete set null,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  email text not null unique,
  perfil text not null default 'Visualizador',
  status text not null default 'convite_pendente' check (status in ('ativo', 'bloqueado', 'convite_pendente')),
  senha_temporaria text,
  ultimo_acesso timestamptz,
  empresa text not null default 'REIS FLOW',
  convites_enviados integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_documento text check (tipo_documento in ('CPF', 'CNPJ')),
  documento text unique,
  telefone text,
  email text,
  endereco text,
  observacoes text,
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
  cliente_id uuid references public.clientes (id) on delete restrict,
  cliente_nome_avulso text,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  margem_percentual numeric(5,2) not null default 0,
  validade date,
  status text not null default 'pendente' check (status in ('pendente', 'cliente_pendente', 'dados_incompletos', 'aprovado', 'reprovado', 'expirado')),
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
  area text not null default 'obras',
  funcao text not null,
  telefone text,
  email text,
  diaria numeric(14,2) not null default 0,
  comissao_percentual numeric(5,2) not null default 0,
  obra_id uuid references public.obras (id) on delete set null,
  status text not null default 'disponivel' check (status in ('campo', 'disponivel', 'afastado', 'inativo')),
  created_at timestamptz not null default now()
);

create index if not exists idx_usuarios_sistema_equipe_id on public.usuarios_sistema (equipe_id);
create index if not exists idx_usuarios_sistema_email_ci on public.usuarios_sistema (lower(trim(email)));
create index if not exists idx_usuarios_sistema_perfil on public.usuarios_sistema (perfil);
create index if not exists idx_usuarios_sistema_status on public.usuarios_sistema (status);

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

alter table public.estoque_itens
  add column if not exists fornecedor_id uuid references public.fornecedores (id) on delete set null;

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

create table if not exists public.audit_log (
  id bigserial primary key,
  tabela text not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  registro_id uuid,
  actor_id uuid references auth.users (id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_obras_cliente_id on public.obras (cliente_id);
create index if not exists idx_orcamentos_cliente_id on public.orcamentos (cliente_id);
create index if not exists idx_orcamento_itens_orcamento_id on public.orcamento_itens (orcamento_id);
create index if not exists idx_financeiro_receber_cliente_id on public.financeiro_receber (cliente_id);
create index if not exists idx_financeiro_receber_obra_id on public.financeiro_receber (obra_id);
create index if not exists idx_equipe_obra_id on public.equipe (obra_id);
create index if not exists idx_estoque_itens_fornecedor_id on public.estoque_itens (fornecedor_id);
create index if not exists idx_fornecedores_nome_ci on public.fornecedores (lower(trim(nome)));
create unique index if not exists idx_fornecedores_cnpj_unique on public.fornecedores (cnpj) where cnpj is not null and trim(cnpj) <> '';
create index if not exists idx_estoque_movimentos_item_id on public.estoque_movimentos (estoque_item_id);
create index if not exists idx_estoque_movimentos_tipo on public.estoque_movimentos (tipo);
create index if not exists idx_estoque_movimentos_created_at on public.estoque_movimentos (created_at desc);
create index if not exists idx_estoque_movimentos_fornecedor_id on public.estoque_movimentos (fornecedor_id);
create index if not exists idx_obra_etapas_obra_id on public.obra_etapas (obra_id);
create index if not exists idx_obra_etapas_obra_ordem on public.obra_etapas (obra_id, ordem);
create index if not exists idx_obra_historico_obra_id on public.obra_historico (obra_id);
create index if not exists idx_obra_historico_created_at on public.obra_historico (created_at desc);
create index if not exists idx_audit_log_tabela_created_at on public.audit_log (tabela, created_at desc);
create index if not exists idx_audit_log_registro_id on public.audit_log (registro_id);
create index if not exists idx_audit_log_actor_id on public.audit_log (actor_id);

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.obras enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.financeiro_receber enable row level security;
alter table public.financeiro_pagar enable row level security;
alter table public.equipe enable row level security;
alter table public.usuarios_sistema enable row level security;
alter table public.estoque_itens enable row level security;
alter table public.fornecedores enable row level security;
alter table public.estoque_movimentos enable row level security;
alter table public.obra_etapas enable row level security;
alter table public.obra_historico enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.app_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    (
      select lower(trim(p.cargo))
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    'operador'
  )
$$;

create or replace function public.app_has_role(allowed text[])
returns boolean
language sql
stable
as $$
  select public.app_user_role() = any(allowed)
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  if tg_op = 'INSERT' then
    row_id := new.id;
    insert into public.audit_log (tabela, operacao, registro_id, actor_id, before_data, after_data)
    values (tg_table_name, tg_op, row_id, auth.uid(), null, to_jsonb(new));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if to_jsonb(new) is distinct from to_jsonb(old) then
      row_id := coalesce(new.id, old.id);
      insert into public.audit_log (tabela, operacao, registro_id, actor_id, before_data, after_data)
      values (tg_table_name, tg_op, row_id, auth.uid(), to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    row_id := old.id;
    insert into public.audit_log (tabela, operacao, registro_id, actor_id, before_data, after_data)
    values (tg_table_name, tg_op, row_id, auth.uid(), to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

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
drop policy if exists fornecedores_all_authenticated on public.fornecedores;
drop policy if exists estoque_movimentos_all_authenticated on public.estoque_movimentos;
drop policy if exists obra_etapas_all_authenticated on public.obra_etapas;
drop policy if exists obra_historico_all_authenticated on public.obra_historico;
drop policy if exists audit_log_all_authenticated on public.audit_log;

drop policy if exists clientes_select_authenticated on public.clientes;
drop policy if exists obras_select_authenticated on public.obras;
drop policy if exists orcamentos_select_authenticated on public.orcamentos;
drop policy if exists orcamento_itens_select_authenticated on public.orcamento_itens;
drop policy if exists financeiro_receber_select_authenticated on public.financeiro_receber;
drop policy if exists financeiro_pagar_select_authenticated on public.financeiro_pagar;
drop policy if exists equipe_select_authenticated on public.equipe;
drop policy if exists usuarios_sistema_select_authenticated on public.usuarios_sistema;
drop policy if exists estoque_itens_select_authenticated on public.estoque_itens;
drop policy if exists fornecedores_select_authenticated on public.fornecedores;
drop policy if exists estoque_movimentos_select_authenticated on public.estoque_movimentos;
drop policy if exists obra_etapas_select_authenticated on public.obra_etapas;
drop policy if exists obra_historico_select_authenticated on public.obra_historico;
drop policy if exists audit_log_select_privileged on public.audit_log;

drop policy if exists clientes_write_by_role on public.clientes;
drop policy if exists obras_write_by_role on public.obras;
drop policy if exists orcamentos_write_by_role on public.orcamentos;
drop policy if exists orcamento_itens_write_by_role on public.orcamento_itens;
drop policy if exists financeiro_receber_write_by_role on public.financeiro_receber;
drop policy if exists financeiro_pagar_write_by_role on public.financeiro_pagar;
drop policy if exists equipe_write_by_role on public.equipe;
drop policy if exists usuarios_sistema_write_by_role on public.usuarios_sistema;
drop policy if exists estoque_itens_write_by_role on public.estoque_itens;
drop policy if exists fornecedores_write_by_role on public.fornecedores;
drop policy if exists estoque_movimentos_write_by_role on public.estoque_movimentos;
drop policy if exists obra_etapas_write_by_role on public.obra_etapas;
drop policy if exists obra_historico_write_by_role on public.obra_historico;
drop policy if exists audit_log_write_by_role on public.audit_log;

create policy clientes_select_authenticated on public.clientes for select to authenticated using (true);
create policy obras_select_authenticated on public.obras for select to authenticated using (true);
create policy orcamentos_select_authenticated on public.orcamentos for select to authenticated using (true);
create policy orcamento_itens_select_authenticated on public.orcamento_itens for select to authenticated using (true);
create policy financeiro_receber_select_authenticated on public.financeiro_receber for select to authenticated using (true);
create policy financeiro_pagar_select_authenticated on public.financeiro_pagar for select to authenticated using (true);
create policy equipe_select_authenticated on public.equipe for select to authenticated using (true);
create policy usuarios_sistema_select_authenticated on public.usuarios_sistema for select to authenticated using (true);
create policy estoque_itens_select_authenticated on public.estoque_itens for select to authenticated using (true);
create policy fornecedores_select_authenticated on public.fornecedores for select to authenticated using (true);
create policy estoque_movimentos_select_authenticated on public.estoque_movimentos for select to authenticated using (true);
create policy obra_etapas_select_authenticated on public.obra_etapas for select to authenticated using (true);
create policy obra_historico_select_authenticated on public.obra_historico for select to authenticated using (true);
create policy audit_log_select_privileged on public.audit_log
for select to authenticated
using (public.app_has_role(array['admin','gestor','financeiro']::text[]));

create policy clientes_write_by_role on public.clientes
for all to authenticated
using (public.app_has_role(array['admin','gestor','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','operador']::text[]));

create policy obras_write_by_role on public.obras
for all to authenticated
using (public.app_has_role(array['admin','gestor','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','operador']::text[]));

create policy orcamentos_write_by_role on public.orcamentos
for all to authenticated
using (public.app_has_role(array['admin','gestor','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','operador']::text[]));

create policy orcamento_itens_write_by_role on public.orcamento_itens
for all to authenticated
using (public.app_has_role(array['admin','gestor','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','operador']::text[]));

create policy financeiro_receber_write_by_role on public.financeiro_receber
for all to authenticated
using (public.app_has_role(array['admin','gestor','financeiro','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','financeiro','operador']::text[]));

create policy financeiro_pagar_write_by_role on public.financeiro_pagar
for all to authenticated
using (public.app_has_role(array['admin','gestor','financeiro','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','financeiro','operador']::text[]));

create policy equipe_write_by_role on public.equipe
for all to authenticated
using (public.app_has_role(array['admin','gestor','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','operador']::text[]));

create policy usuarios_sistema_write_by_role on public.usuarios_sistema
for all to authenticated
using (public.app_has_role(array['admin','gestor']::text[]))
with check (public.app_has_role(array['admin','gestor']::text[]));

create policy estoque_itens_write_by_role on public.estoque_itens
for all to authenticated
using (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

create policy fornecedores_write_by_role on public.fornecedores
for all to authenticated
using (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

create policy estoque_movimentos_write_by_role on public.estoque_movimentos
for all to authenticated
using (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

create policy obra_etapas_write_by_role on public.obra_etapas
for all to authenticated
using (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

create policy obra_historico_write_by_role on public.obra_historico
for all to authenticated
using (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
with check (public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

drop trigger if exists trg_audit_obras on public.obras;
create trigger trg_audit_obras
after insert or update or delete on public.obras
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_orcamentos on public.orcamentos;
create trigger trg_audit_orcamentos
after insert or update or delete on public.orcamentos
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_financeiro_receber on public.financeiro_receber;
create trigger trg_audit_financeiro_receber
after insert or update or delete on public.financeiro_receber
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_financeiro_pagar on public.financeiro_pagar;
create trigger trg_audit_financeiro_pagar
after insert or update or delete on public.financeiro_pagar
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_fornecedores on public.fornecedores;
create trigger trg_audit_fornecedores
after insert or update or delete on public.fornecedores
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_estoque_itens on public.estoque_itens;
create trigger trg_audit_estoque_itens
after insert or update or delete on public.estoque_itens
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_estoque_movimentos on public.estoque_movimentos;
create trigger trg_audit_estoque_movimentos
after insert or update or delete on public.estoque_movimentos
for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_equipe on public.equipe;
create trigger trg_audit_equipe
after insert or update or delete on public.equipe
for each row execute function public.audit_row_change();