begin;

create table if not exists public.tenant_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  role text not null check (role in ('admin', 'gestor', 'financeiro', 'tecnico', 'operador', 'visualizador')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tenant_memberships
  add column if not exists active boolean not null default true;

create index if not exists idx_tenant_memberships_empresa_id
  on public.tenant_memberships (empresa_id);

alter table public.tenant_memberships enable row level security;

drop policy if exists tenant_memberships_select_own on public.tenant_memberships;
drop policy if exists tenant_memberships_write_own on public.tenant_memberships;

create or replace function public.app_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select membership.empresa_id
  from public.tenant_memberships membership
  join public.empresas empresa on empresa.id = membership.empresa_id
  where membership.user_id = auth.uid()
    and membership.empresa_id <> '00000000-0000-0000-0000-000000000001'::uuid
    and membership.active
    and empresa.status = 'ativo'
  limit 1
$$;

create or replace function public.app_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select membership.role
  from public.tenant_memberships membership
  where membership.user_id = auth.uid()
    and membership.empresa_id = public.app_empresa_id()
    and membership.active
  limit 1
$$;

create or replace function public.app_has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_user_role() = any(allowed), false)
$$;

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists profiles_all_own on public.profiles;
drop policy if exists profiles_all_authenticated on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_write_by_role on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists empresas_insert_service on public.empresas;

create or replace function public.provision_current_user_tenant()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_membership_active boolean;
  v_invited_at timestamptz;
  v_company_name text;
  v_user_name text;
  v_company_status text;
begin
  if v_user_id is null then
    raise exception 'Autenticacao obrigatoria para criar uma organizacao.';
  end if;

  select membership.empresa_id, membership.active, empresa.status
    into v_company_id, v_membership_active, v_company_status
  from public.tenant_memberships membership
  join public.empresas empresa on empresa.id = membership.empresa_id
  where membership.user_id = v_user_id;

  if v_company_id is not null then
    if not v_membership_active then
      raise exception 'O acesso a esta organizacao esta suspenso.';
    end if;
    if v_company_status <> 'ativo' then
      raise exception 'A organizacao nao esta ativa.';
    end if;
    if v_company_id = '00000000-0000-0000-0000-000000000001'::uuid then
      raise exception 'A organizacao legada esta bloqueada para revisao de acesso.';
    end if;
    return v_company_id;
  end if;

  select invited_at, raw_user_meta_data ->> 'empresa', raw_user_meta_data ->> 'nome'
    into v_invited_at, v_company_name, v_user_name
  from auth.users
  where id = v_user_id
  for update;

  if v_invited_at is not null then
    raise exception 'Convites precisam ser associados pela equipe administradora.';
  end if;

  v_company_name := coalesce(nullif(btrim(v_company_name), ''), 'Minha Empresa');
  v_user_name := coalesce(nullif(btrim(v_user_name), ''), 'Usuario');

  insert into public.empresas (nome)
  values (left(v_company_name, 160))
  returning id into v_company_id;

  insert into public.tenant_memberships (user_id, empresa_id, role)
  values (v_user_id, v_company_id, 'admin');

  insert into public.profiles (id, nome, cargo, empresa_id)
  values (v_user_id, left(v_user_name, 160), 'admin', v_company_id)
  on conflict (id) do update
    set cargo = excluded.cargo;

  return v_company_id;
end;
$$;

revoke all on function public.provision_current_user_tenant() from public, anon;
grant execute on function public.provision_current_user_tenant() to authenticated;

create or replace function public.provision_new_auth_user_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_user_name text;
begin
  if new.invited_at is not null then
    return new;
  end if;

  v_company_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'empresa'), ''),
    'Minha Empresa'
  );
  v_user_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
    split_part(coalesce(new.email, 'Usuario'), '@', 1)
  );

  insert into public.empresas (nome)
  values (left(v_company_name, 160))
  returning id into v_company_id;

  insert into public.tenant_memberships (user_id, empresa_id, role)
  values (new.id, v_company_id, 'admin');

  insert into public.profiles (id, nome, cargo, empresa_id)
  values (new.id, left(v_user_name, 160), 'admin', v_company_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_provision_new_auth_user_tenant on auth.users;
create trigger trg_provision_new_auth_user_tenant
  after insert on auth.users
  for each row execute function public.provision_new_auth_user_tenant();

alter table public.audit_log
  add column if not exists empresa_id uuid references public.empresas (id) on delete set null;

revoke select on public.usuarios_sistema from anon, authenticated;
revoke select (senha_temporaria) on public.usuarios_sistema from anon, authenticated;
grant select (
  id, equipe_id, auth_user_id, empresa_id, nome, email, perfil,
  status, ultimo_acesso, empresa, convites_enviados, created_at, updated_at
) on public.usuarios_sistema to authenticated;

create index if not exists idx_audit_log_empresa_created_at
  on public.audit_log (empresa_id, created_at desc);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
  tenant_id uuid;
begin
  if tg_op = 'INSERT' then
    row_id := new.id;
    tenant_id := (to_jsonb(new) ->> 'empresa_id')::uuid;
    insert into public.audit_log (tabela, operacao, registro_id, actor_id, empresa_id, before_data, after_data)
    values (tg_table_name, tg_op, row_id, auth.uid(), tenant_id, null, to_jsonb(new));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if to_jsonb(new) is distinct from to_jsonb(old) then
      row_id := coalesce(new.id, old.id);
      tenant_id := coalesce((to_jsonb(new) ->> 'empresa_id')::uuid, (to_jsonb(old) ->> 'empresa_id')::uuid);
      insert into public.audit_log (tabela, operacao, registro_id, actor_id, empresa_id, before_data, after_data)
      values (tg_table_name, tg_op, row_id, auth.uid(), tenant_id, to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    row_id := old.id;
    tenant_id := (to_jsonb(old) ->> 'empresa_id')::uuid;
    insert into public.audit_log (tabela, operacao, registro_id, actor_id, empresa_id, before_data, after_data)
    values (tg_table_name, tg_op, row_id, auth.uid(), tenant_id, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

drop policy if exists audit_log_select_privileged on public.audit_log;
drop policy if exists audit_log_select_by_empresa on public.audit_log;
drop policy if exists audit_log_all_authenticated on public.audit_log;
drop policy if exists audit_log_select_authenticated on public.audit_log;
drop policy if exists audit_log_write_by_role on public.audit_log;
create policy audit_log_select_by_empresa on public.audit_log
  for select to authenticated
  using (
    empresa_id = public.app_empresa_id()
    and public.app_has_role(array['admin', 'gestor', 'financeiro']::text[])
  );

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clientes', 'obras', 'orcamentos', 'orcamento_itens',
    'financeiro_receber', 'financeiro_pagar', 'equipe', 'usuarios_sistema',
    'estoque_itens', 'fornecedores', 'estoque_movimentos',
    'obra_etapas', 'obra_historico', 'audit_log'
  ] loop
    execute format('drop policy if exists bootstrap_deny_authenticated on public.%I', table_name);
  end loop;
end;
$$;

commit;
