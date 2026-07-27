-- =============================================================
-- REIS FLOW - Migration 20260722_002
-- Objetivo:
-- 1) Introduzir helper de perfil para RLS
-- 2) Separar leitura (authenticated) de escrita por cargo
-- =============================================================

begin;

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

drop policy if exists clientes_select_authenticated on public.clientes;
drop policy if exists obras_select_authenticated on public.obras;
drop policy if exists orcamentos_select_authenticated on public.orcamentos;
drop policy if exists orcamento_itens_select_authenticated on public.orcamento_itens;
drop policy if exists financeiro_receber_select_authenticated on public.financeiro_receber;
drop policy if exists financeiro_pagar_select_authenticated on public.financeiro_pagar;
drop policy if exists equipe_select_authenticated on public.equipe;
drop policy if exists estoque_itens_select_authenticated on public.estoque_itens;
drop policy if exists fornecedores_select_authenticated on public.fornecedores;
drop policy if exists estoque_movimentos_select_authenticated on public.estoque_movimentos;
drop policy if exists obra_etapas_select_authenticated on public.obra_etapas;
drop policy if exists obra_historico_select_authenticated on public.obra_historico;

drop policy if exists clientes_write_by_role on public.clientes;
drop policy if exists obras_write_by_role on public.obras;
drop policy if exists orcamentos_write_by_role on public.orcamentos;
drop policy if exists orcamento_itens_write_by_role on public.orcamento_itens;
drop policy if exists financeiro_receber_write_by_role on public.financeiro_receber;
drop policy if exists financeiro_pagar_write_by_role on public.financeiro_pagar;
drop policy if exists equipe_write_by_role on public.equipe;
drop policy if exists estoque_itens_write_by_role on public.estoque_itens;
drop policy if exists fornecedores_write_by_role on public.fornecedores;
drop policy if exists estoque_movimentos_write_by_role on public.estoque_movimentos;
drop policy if exists obra_etapas_write_by_role on public.obra_etapas;
drop policy if exists obra_historico_write_by_role on public.obra_historico;

create policy clientes_select_authenticated on public.clientes for select to authenticated using (true);
create policy obras_select_authenticated on public.obras for select to authenticated using (true);
create policy orcamentos_select_authenticated on public.orcamentos for select to authenticated using (true);
create policy orcamento_itens_select_authenticated on public.orcamento_itens for select to authenticated using (true);
create policy financeiro_receber_select_authenticated on public.financeiro_receber for select to authenticated using (true);
create policy financeiro_pagar_select_authenticated on public.financeiro_pagar for select to authenticated using (true);
create policy equipe_select_authenticated on public.equipe for select to authenticated using (true);
create policy estoque_itens_select_authenticated on public.estoque_itens for select to authenticated using (true);
create policy fornecedores_select_authenticated on public.fornecedores for select to authenticated using (true);
create policy estoque_movimentos_select_authenticated on public.estoque_movimentos for select to authenticated using (true);
create policy obra_etapas_select_authenticated on public.obra_etapas for select to authenticated using (true);
create policy obra_historico_select_authenticated on public.obra_historico for select to authenticated using (true);

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

commit;