-- =============================================================
-- REIS FLOW - Migration 20260806_007
-- Etapa 2: Multi-Tenant — funções RLS e policies por empresa
-- =============================================================

begin;

-- ------------------------------------------------------------
-- 1. Função: retorna empresa_id do usuário autenticado
-- ------------------------------------------------------------
create or replace function public.app_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

-- ------------------------------------------------------------
-- 2. Atualiza app_user_role para ser empresa-aware
--    (mantém compatibilidade: ainda retorna cargo)
-- ------------------------------------------------------------
create or replace function public.app_user_role()
returns text
language sql
stable
security definer
set search_path = public
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

-- ------------------------------------------------------------
-- 3. Policy para empresas: cada usuário vê apenas a própria
-- ------------------------------------------------------------
drop policy if exists empresas_select_own on public.empresas;
drop policy if exists empresas_update_own on public.empresas;

create policy empresas_select_own on public.empresas
  for select to authenticated
  using (id = public.app_empresa_id());

create policy empresas_update_own on public.empresas
  for update to authenticated
  using (id = public.app_empresa_id() and public.app_has_role(array['admin']::text[]))
  with check (id = public.app_empresa_id() and public.app_has_role(array['admin']::text[]));

-- INSERT liberado para service_role (usado no cadastro via Edge Function ou trigger)
create policy empresas_insert_service on public.empresas
  for insert to authenticated
  with check (true);

-- ------------------------------------------------------------
-- 4. Recriar todas as policies de negócio com filtro empresa_id
-- ------------------------------------------------------------

-- clientes
drop policy if exists clientes_select_authenticated on public.clientes;
drop policy if exists clientes_write_by_role        on public.clientes;

create policy clientes_select_by_empresa on public.clientes
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy clientes_write_by_role on public.clientes
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]));

-- obras
drop policy if exists obras_select_authenticated on public.obras;
drop policy if exists obras_write_by_role        on public.obras;

create policy obras_select_by_empresa on public.obras
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy obras_write_by_role on public.obras
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]));

-- orcamentos
drop policy if exists orcamentos_select_authenticated on public.orcamentos;
drop policy if exists orcamentos_write_by_role        on public.orcamentos;

create policy orcamentos_select_by_empresa on public.orcamentos
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy orcamentos_write_by_role on public.orcamentos
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]));

-- orcamento_itens
drop policy if exists orcamento_itens_select_authenticated on public.orcamento_itens;
drop policy if exists orcamento_itens_write_by_role        on public.orcamento_itens;

create policy orcamento_itens_select_by_empresa on public.orcamento_itens
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy orcamento_itens_write_by_role on public.orcamento_itens
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]));

-- financeiro_receber
drop policy if exists financeiro_receber_select_authenticated on public.financeiro_receber;
drop policy if exists financeiro_receber_write_by_role        on public.financeiro_receber;

create policy financeiro_receber_select_by_empresa on public.financeiro_receber
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy financeiro_receber_write_by_role on public.financeiro_receber
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','financeiro','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','financeiro','operador']::text[]));

-- financeiro_pagar
drop policy if exists financeiro_pagar_select_authenticated on public.financeiro_pagar;
drop policy if exists financeiro_pagar_write_by_role        on public.financeiro_pagar;

create policy financeiro_pagar_select_by_empresa on public.financeiro_pagar
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy financeiro_pagar_write_by_role on public.financeiro_pagar
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','financeiro','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','financeiro','operador']::text[]));

-- equipe
drop policy if exists equipe_select_authenticated on public.equipe;
drop policy if exists equipe_write_by_role        on public.equipe;

create policy equipe_select_by_empresa on public.equipe
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy equipe_write_by_role on public.equipe
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','operador']::text[]));

-- usuarios_sistema
drop policy if exists usuarios_sistema_select_authenticated on public.usuarios_sistema;
drop policy if exists usuarios_sistema_write_by_role        on public.usuarios_sistema;

create policy usuarios_sistema_select_by_empresa on public.usuarios_sistema
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy usuarios_sistema_write_by_role on public.usuarios_sistema
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor']::text[]));

-- estoque_itens
drop policy if exists estoque_itens_select_authenticated on public.estoque_itens;
drop policy if exists estoque_itens_write_by_role        on public.estoque_itens;

create policy estoque_itens_select_by_empresa on public.estoque_itens
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy estoque_itens_write_by_role on public.estoque_itens
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

-- fornecedores
drop policy if exists fornecedores_select_authenticated on public.fornecedores;
drop policy if exists fornecedores_write_by_role        on public.fornecedores;

create policy fornecedores_select_by_empresa on public.fornecedores
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy fornecedores_write_by_role on public.fornecedores
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

-- estoque_movimentos
drop policy if exists estoque_movimentos_select_authenticated on public.estoque_movimentos;
drop policy if exists estoque_movimentos_write_by_role        on public.estoque_movimentos;

create policy estoque_movimentos_select_by_empresa on public.estoque_movimentos
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy estoque_movimentos_write_by_role on public.estoque_movimentos
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

-- obra_etapas
drop policy if exists obra_etapas_select_authenticated on public.obra_etapas;
drop policy if exists obra_etapas_write_by_role        on public.obra_etapas;

create policy obra_etapas_select_by_empresa on public.obra_etapas
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy obra_etapas_write_by_role on public.obra_etapas
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

-- obra_historico
drop policy if exists obra_historico_select_authenticated on public.obra_historico;
drop policy if exists obra_historico_write_by_role        on public.obra_historico;

create policy obra_historico_select_by_empresa on public.obra_historico
  for select to authenticated
  using (empresa_id = public.app_empresa_id());

create policy obra_historico_write_by_role on public.obra_historico
  for all to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]))
  with check (empresa_id = public.app_empresa_id() and public.app_has_role(array['admin','gestor','tecnico','operador']::text[]));

-- audit_log (sem empresa_id — log global, acesso restrito por role)
drop policy if exists audit_log_select_privileged on public.audit_log;

create policy audit_log_select_privileged on public.audit_log
  for select to authenticated
  using (public.app_has_role(array['admin','gestor','financeiro']::text[]));

commit;
