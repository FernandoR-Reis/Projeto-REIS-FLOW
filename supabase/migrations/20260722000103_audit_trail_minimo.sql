-- =============================================================
-- REIS FLOW - Migration 20260722_003
-- Objetivo:
-- 1) Criar trilha minima de auditoria para alteracoes sensiveis
-- 2) Registrar before/after por tabela e ator
-- =============================================================

begin;

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

create index if not exists idx_audit_log_tabela_created_at on public.audit_log (tabela, created_at desc);
create index if not exists idx_audit_log_registro_id on public.audit_log (registro_id);
create index if not exists idx_audit_log_actor_id on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

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

drop policy if exists audit_log_all_authenticated on public.audit_log;
drop policy if exists audit_log_select_privileged on public.audit_log;
create policy audit_log_select_privileged on public.audit_log
for select to authenticated
using (public.app_has_role(array['admin','gestor','financeiro']::text[]));

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

commit;