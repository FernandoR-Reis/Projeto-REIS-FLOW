begin;

create table if not exists public.user_module_permissions (
  user_id uuid primary key references public.tenant_memberships (user_id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  template_key text not null default 'personalizado',
  permissions jsonb not null default '{}'::jsonb check (jsonb_typeof(permissions) = 'object'),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_module_permissions_empresa
  on public.user_module_permissions (empresa_id);

alter table public.user_module_permissions enable row level security;

drop policy if exists user_module_permissions_read_self on public.user_module_permissions;
create policy user_module_permissions_read_self on public.user_module_permissions
  for select to authenticated using (user_id = auth.uid() and empresa_id = public.app_empresa_id());

revoke all on public.user_module_permissions from anon, authenticated;
grant select on public.user_module_permissions to authenticated;

create or replace function public.app_permission_actions(enabled_actions text[])
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'view', 'view' = any(enabled_actions),
    'create', 'create' = any(enabled_actions),
    'edit', 'edit' = any(enabled_actions),
    'delete', 'delete' = any(enabled_actions),
    'admin', 'admin' = any(enabled_actions)
  )
$$;

create or replace function public.app_permission_template(template_name text)
returns jsonb
language sql
immutable
set search_path = public, pg_catalog
as $$
  select jsonb_build_object(
    'dashboard', public.app_permission_actions(array[]::text[]),
    'obras', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name = 'operacional' then array['view','create','edit']::text[]
        when template_name = 'tecnico' then array['view','edit']::text[]
        when template_name = 'visualizador' then array['view']::text[]
        else array[]::text[]
      end
    ),
    'orcamentos', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name = 'operacional' then array['view','create','edit']::text[]
        when template_name = 'visualizador' then array['view']::text[]
        else array[]::text[]
      end
    ),
    'clientes', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name = 'operacional' then array['view','create','edit']::text[]
        when template_name = 'visualizador' then array['view']::text[]
        else array[]::text[]
      end
    ),
    'financeiro', public.app_permission_actions(
      case when template_name = 'financeiro' then array['view','create','edit']::text[] else array[]::text[] end
    ),
    'equipes', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name = 'operacional' then array['view','create','edit']::text[]
        when template_name in ('tecnico','visualizador') then array['view']::text[]
        else array[]::text[]
      end
    ),
    'estoque', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name in ('operacional','tecnico') then array['view','create','edit']::text[]
        when template_name = 'visualizador' then array['view']::text[]
        else array[]::text[]
      end
    ),
    'fornecedores', public.app_permission_actions(
      case
        when template_name = 'gerente' then array['view','create','edit','delete']::text[]
        when template_name in ('operacional','tecnico') then array['view','create','edit']::text[]
        when template_name = 'visualizador' then array['view']::text[]
        else array[]::text[]
      end
    ),
    'configuracoes', public.app_permission_actions(
      case when template_name = 'gerente' then array['view']::text[] else array[]::text[] end
    ),
    'cadastros', public.app_permission_actions(
      case when template_name in ('gerente','operacional') then array['view']::text[] else array[]::text[] end
    ),
    'usuarios', public.app_permission_actions(array[]::text[])
  )
$$;

create or replace function public.app_has_permission(module_name text, action_name text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when module_name not in ('dashboard','obras','orcamentos','clientes','financeiro','equipes','estoque','fornecedores','configuracoes','cadastros','usuarios')
      or action_name not in ('view','create','edit','delete','admin')
      then false
    when public.app_user_role() = 'admin' then
      case
        when module_name = 'dashboard' then action_name = 'view'
        when module_name in ('configuracoes','cadastros','usuarios') then action_name in ('view','admin')
        else true
      end
    else exists (
      select 1
      from public.user_module_permissions grants
      where grants.user_id = auth.uid()
        and grants.empresa_id = public.app_empresa_id()
        and grants.permissions -> module_name ->> 'view' = 'true'
        and grants.permissions -> module_name ->> action_name = 'true'
    )
  end
$$;

create or replace function public.app_my_permissions()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  current_role text := public.app_user_role();
  grant_data jsonb;
  grant_template text;
begin
  if auth.uid() is null or current_company is null or current_role is null then
    raise exception 'A membership ativa e necessaria para consultar permissoes.';
  end if;

  if current_role = 'admin' then
    grant_template := 'administrador';
    grant_data := public.app_permission_template('gerente')
      || jsonb_build_object(
        'dashboard', public.app_permission_actions(array['view']::text[]),
        'financeiro', public.app_permission_actions(array['view','create','edit','delete']::text[]),
        'configuracoes', public.app_permission_actions(array['view','admin']::text[]),
        'cadastros', public.app_permission_actions(array['view','admin']::text[]),
        'usuarios', public.app_permission_actions(array['view','admin']::text[])
      );
  else
    select permissions.permissions
      , permissions.template_key
      into grant_data, grant_template
    from public.user_module_permissions permissions
    where permissions.user_id = auth.uid()
      and permissions.empresa_id = current_company;
    if grant_data is null then
      raise exception 'As permissoes deste usuario ainda nao foram provisionadas.';
    end if;
  end if;

  return jsonb_build_object(
    'user_id', auth.uid(),
    'empresa_id', current_company,
    'role', current_role,
    'template_key', grant_template,
    'is_admin', current_role = 'admin',
    'permissions', grant_data
  );
end;
$$;

create or replace function public.app_company_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  result jsonb;
begin
  if public.app_user_role() <> 'admin' then
    raise exception 'Somente o administrador da organizacao pode consultar os usuarios.';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', membership.user_id,
      'equipe_id', sys_user.equipe_id,
      'nome', coalesce(profile.nome, sys_user.nome, auth_user.email),
      'email', auth_user.email,
      'role', membership.role,
      'active', membership.active,
      'perfil', sys_user.perfil,
      'template_key', case
        when membership.role = 'admin' then 'administrador'
        else coalesce(grants.template_key, 'personalizado')
      end,
      'status', case when membership.active then coalesce(sys_user.status, 'ativo') else 'bloqueado' end,
      'permissions_updated_at', grants.updated_at,
      'permissions', case
        when membership.role = 'admin' then null
        else coalesce(grants.permissions, public.app_permission_template(
          case membership.role
            when 'gestor' then 'gerente'
            when 'financeiro' then 'financeiro'
            when 'tecnico' then 'tecnico'
            when 'visualizador' then 'visualizador'
            else 'operacional'
          end
        ))
      end
    ) order by coalesce(profile.nome, sys_user.nome, auth_user.email)
  ), '[]'::jsonb)
    into result
  from public.tenant_memberships membership
  join auth.users auth_user on auth_user.id = membership.user_id
  left join public.profiles profile on profile.id = membership.user_id
  left join public.usuarios_sistema sys_user
    on sys_user.auth_user_id = membership.user_id
   and sys_user.empresa_id = current_company
  left join public.user_module_permissions grants
    on grants.user_id = membership.user_id
   and grants.empresa_id = current_company
  where membership.empresa_id = current_company;

  return result;
end;
$$;

create or replace function public.app_client_options()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  result jsonb;
begin
  if not (
    public.app_has_permission('clientes', 'view')
    or public.app_has_permission('obras', 'view')
    or public.app_has_permission('orcamentos', 'view')
    or public.app_has_permission('financeiro', 'view')
  ) then
    raise exception 'Acesso negado aos dados de clientes.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', cliente.id, 'nome', cliente.nome) order by cliente.nome), '[]'::jsonb)
  into result
  from public.clientes cliente
  where cliente.empresa_id = current_company;
  return result;
end;
$$;

create or replace function public.app_finance_work_options()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  result jsonb;
begin
  if not public.app_has_permission('financeiro', 'view') then
    raise exception 'Acesso negado aos vinculos financeiros.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', obra.id, 'codigo', obra.codigo, 'nome', obra.nome) order by obra.codigo), '[]'::jsonb)
  into result
  from public.obras obra
  where obra.empresa_id = current_company;
  return result;
end;
$$;

create or replace function public.app_finance_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
begin
  if not public.app_has_permission('financeiro', 'view') then
    raise exception 'Acesso negado aos dados financeiros.';
  end if;

  return jsonb_build_object(
    'receivables', coalesce((
      select jsonb_agg(jsonb_build_object(
        'referencia', receivable.referencia,
        'cliente_id', receivable.cliente_id,
        'obra_id', receivable.obra_id,
        'descricao', receivable.descricao,
        'valor', receivable.valor,
        'vencimento', receivable.vencimento,
        'status', receivable.status,
        'paid_at', receivable.paid_at,
        'clientes', case when cliente.id is null then null else jsonb_build_object('nome', cliente.nome) end,
        'obras', case when obra.id is null then null else jsonb_build_object('codigo', obra.codigo) end
      ) order by receivable.vencimento)
      from public.financeiro_receber receivable
      left join public.clientes cliente
        on cliente.id = receivable.cliente_id and cliente.empresa_id = current_company
      left join public.obras obra
        on obra.id = receivable.obra_id and obra.empresa_id = current_company
      where receivable.empresa_id = current_company
    ), '[]'::jsonb),
    'payables', coalesce((
      select jsonb_agg(jsonb_build_object(
        'referencia', payable.referencia,
        'fornecedor', payable.fornecedor,
        'categoria', payable.categoria,
        'valor', payable.valor,
        'vencimento', payable.vencimento,
        'status', payable.status,
        'paid_at', payable.paid_at
      ) order by payable.vencimento)
      from public.financeiro_pagar payable
      where payable.empresa_id = current_company
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.app_save_user_permissions(
  target_user_id uuid,
  requested_permissions jsonb,
  requested_template text,
  expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  target_role text;
  target_grants_updated_at timestamptz;
  target_previous_permissions jsonb;
  target_previous_template text;
  module_entry record;
  action_entry record;
  normalized_permissions jsonb := '{}'::jsonb;
  module_name text;
  action_name text;
  allowed_modules text[] := array['dashboard','obras','orcamentos','clientes','financeiro','equipes','estoque','fornecedores','configuracoes','cadastros','usuarios'];
  allowed_actions text[] := array['view','create','edit','delete','admin'];
begin
  if public.app_user_role() <> 'admin' then
    raise exception 'Somente o administrador da organizacao pode alterar permissoes.';
  end if;
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'Nao e permitido alterar as proprias permissoes.';
  end if;
  if jsonb_typeof(requested_permissions) <> 'object' then
    raise exception 'O formato das permissoes e invalido.';
  end if;
  if requested_template is null or requested_template not in ('gerente','operacional','financeiro','tecnico','visualizador','personalizado') then
    raise exception 'Modelo de permissoes invalido.';
  end if;

  select role into target_role
  from public.tenant_memberships
  where user_id = target_user_id
    and empresa_id = current_company;
  if not found then
    raise exception 'Usuario ativo nao encontrado nesta organizacao.';
  end if;
  if target_role = 'admin' then
    raise exception 'As permissoes administrativas sao vinculadas a membership confiavel e nao podem ser delegadas por esta tela.';
  end if;
  select updated_at, permissions, template_key
    into target_grants_updated_at, target_previous_permissions, target_previous_template
  from public.user_module_permissions
  where user_id = target_user_id
    and empresa_id = current_company
  for update;
  if not found or expected_updated_at is distinct from target_grants_updated_at then
    raise exception 'As permissoes foram alteradas por outro administrador. Recarregue antes de salvar.';
  end if;

  for module_entry in select key, value from jsonb_each(requested_permissions)
  loop
    if not (module_entry.key = any(allowed_modules)) or jsonb_typeof(module_entry.value) <> 'object' then
      raise exception 'Modulo de permissao invalido: %.', module_entry.key;
    end if;
    for action_entry in select key, value from jsonb_each(module_entry.value)
    loop
      if not (action_entry.key = any(allowed_actions)) or jsonb_typeof(action_entry.value) <> 'boolean' then
        raise exception 'Acao de permissao invalida em %.', module_entry.key;
      end if;
      if module_entry.key = 'usuarios' and action_entry.value = 'true'::jsonb then
        raise exception 'A administracao de usuarios nao pode ser delegada.';
      end if;
    end loop;
    if (
      module_entry.value ->> 'create' = 'true'
      or module_entry.value ->> 'edit' = 'true'
      or module_entry.value ->> 'delete' = 'true'
      or module_entry.value ->> 'admin' = 'true'
    ) and module_entry.value ->> 'view' is distinct from 'true' then
      raise exception 'Visualizar o modulo e necessario para receber permissoes de alteracao: %.', module_entry.key;
    end if;
  end loop;

  if not exists (
    select 1
    from jsonb_each(requested_permissions) module
    where module.value ->> 'view' = 'true'
  ) then
    raise exception 'Conceda acesso de visualizacao a pelo menos um modulo.';
  end if;

  foreach module_name in array allowed_modules
  loop
    normalized_permissions := normalized_permissions || jsonb_build_object(module_name, '{}'::jsonb);
    foreach action_name in array allowed_actions
    loop
      normalized_permissions := jsonb_set(
        normalized_permissions,
        array[module_name, action_name],
        coalesce(requested_permissions -> module_name -> action_name, 'false'::jsonb),
        true
      );
    end loop;
  end loop;

  insert into public.user_module_permissions (user_id, empresa_id, template_key, permissions, updated_by, updated_at)
  values (target_user_id, current_company, requested_template, normalized_permissions, auth.uid(), now())
  on conflict (user_id) do update
    set empresa_id = excluded.empresa_id,
        template_key = excluded.template_key,
        permissions = excluded.permissions,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;

  insert into public.audit_log (tabela, operacao, registro_id, actor_id, empresa_id, before_data, after_data)
  values (
    'user_module_permissions',
    'UPDATE',
    target_user_id,
    auth.uid(),
    current_company,
    jsonb_build_object(
      'permissions', target_previous_permissions,
      'template_key', target_previous_template,
      'updated_at', target_grants_updated_at
    ),
    jsonb_build_object('permissions', normalized_permissions)
  );

  return jsonb_build_object(
    'permissions', normalized_permissions,
    'template_key', requested_template,
    'updated_at', now()
  );
end;
$$;

create or replace function public.app_touch_current_user_access()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.app_empresa_id() is null then
    raise exception 'Membership ativa necessaria.';
  end if;

  update public.usuarios_sistema
  set ultimo_acesso = now()
  where auth_user_id = auth.uid()
    and empresa_id = public.app_empresa_id();
  return found;
end;
$$;

create or replace function public.seed_user_module_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  template_name text;
begin
  if new.role = 'admin' then
    delete from public.user_module_permissions where user_id = new.user_id;
    return new;
  end if;

  template_name := case new.role
    when 'gestor' then 'gerente'
    when 'financeiro' then 'financeiro'
    when 'tecnico' then 'tecnico'
    when 'visualizador' then 'visualizador'
    else 'operacional'
  end;

  if tg_op = 'INSERT' then
    insert into public.user_module_permissions (user_id, empresa_id, template_key, permissions)
    values (new.user_id, new.empresa_id, template_name, public.app_permission_template(template_name))
    on conflict (user_id) do nothing;
  elsif old.role is distinct from new.role then
    insert into public.user_module_permissions (user_id, empresa_id, template_key, permissions)
    values (new.user_id, new.empresa_id, template_name, public.app_permission_template(template_name))
    on conflict (user_id) do update
      set empresa_id = excluded.empresa_id,
          template_key = excluded.template_key,
          permissions = excluded.permissions,
          updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_seed_user_module_permissions on public.tenant_memberships;
create trigger trg_seed_user_module_permissions
  after insert or update of role on public.tenant_memberships
  for each row execute function public.seed_user_module_permissions();

insert into public.user_module_permissions (user_id, empresa_id, template_key, permissions)
select membership.user_id,
       membership.empresa_id,
       case membership.role
         when 'gestor' then 'gerente'
         when 'financeiro' then 'financeiro'
         when 'tecnico' then 'tecnico'
         when 'visualizador' then 'visualizador'
         else 'operacional'
       end,
       public.app_permission_template(case membership.role
         when 'gestor' then 'gerente'
         when 'financeiro' then 'financeiro'
         when 'tecnico' then 'tecnico'
         when 'visualizador' then 'visualizador'
         else 'operacional'
       end)
from public.tenant_memberships membership
where membership.role <> 'admin'
on conflict (user_id) do nothing;

revoke all on function public.app_permission_actions(text[]) from public, anon;
revoke all on function public.app_permission_template(text) from public, anon;
revoke all on function public.app_has_permission(text, text) from public, anon;
revoke all on function public.app_my_permissions() from public, anon;
revoke all on function public.app_company_users() from public, anon;
revoke all on function public.app_client_options() from public, anon;
revoke all on function public.app_finance_work_options() from public, anon;
revoke all on function public.app_finance_data() from public, anon;
revoke all on function public.app_save_user_permissions(uuid, jsonb, text, timestamptz) from public, anon;
revoke all on function public.app_touch_current_user_access() from public, anon;
grant execute on function public.app_has_permission(text, text) to authenticated;
grant execute on function public.app_my_permissions() to authenticated;
grant execute on function public.app_company_users() to authenticated;
grant execute on function public.app_client_options() to authenticated;
grant execute on function public.app_finance_work_options() to authenticated;
grant execute on function public.app_finance_data() to authenticated;
grant execute on function public.app_save_user_permissions(uuid, jsonb, text, timestamptz) to authenticated;
grant execute on function public.app_touch_current_user_access() to authenticated;

do $$
declare
  secured_table record;
  policy_name text;
begin
  for secured_table in
    select * from (values
      ('clientes', 'clientes'),
      ('obras', 'obras'),
      ('orcamentos', 'orcamentos'),
      ('orcamento_itens', 'orcamentos'),
      ('financeiro_receber', 'financeiro'),
      ('financeiro_pagar', 'financeiro'),
      ('equipe', 'equipes'),
      ('usuarios_sistema', 'usuarios'),
      ('estoque_itens', 'estoque'),
      ('fornecedores', 'fornecedores'),
      ('estoque_movimentos', 'estoque'),
      ('obra_etapas', 'obras'),
      ('obra_historico', 'obras')
    ) as mapping(table_name, module_name)
  loop
    foreach policy_name in array array[
      'permission_select_guard', 'permission_insert_guard',
      'permission_update_guard', 'permission_delete_guard'
    ] loop
      execute format('drop policy if exists %I on public.%I', policy_name, secured_table.table_name);
    end loop;

    execute format(
      'create policy permission_select_guard on public.%I as restrictive for select to authenticated using (empresa_id = public.app_empresa_id() and public.app_has_permission(%L, %L))',
      secured_table.table_name, secured_table.module_name,
      case when secured_table.module_name = 'usuarios' then 'view' else 'view' end
    );
    execute format(
      'create policy permission_insert_guard on public.%I as restrictive for insert to authenticated with check (empresa_id = public.app_empresa_id() and public.app_has_permission(%L, %L))',
      secured_table.table_name, secured_table.module_name,
      case when secured_table.module_name = 'usuarios' then 'admin' else 'create' end
    );
    execute format(
      'create policy permission_update_guard on public.%I as restrictive for update to authenticated using (empresa_id = public.app_empresa_id() and public.app_has_permission(%L, %L)) with check (empresa_id = public.app_empresa_id() and public.app_has_permission(%L, %L))',
      secured_table.table_name, secured_table.module_name,
      case when secured_table.module_name = 'usuarios' then 'admin' else 'edit' end,
      secured_table.module_name,
      case when secured_table.module_name = 'usuarios' then 'admin' else 'edit' end
    );
    execute format(
      'create policy permission_delete_guard on public.%I as restrictive for delete to authenticated using (empresa_id = public.app_empresa_id() and public.app_has_permission(%L, %L))',
      secured_table.table_name, secured_table.module_name,
      case when secured_table.module_name = 'usuarios' then 'admin' else 'delete' end
    );
  end loop;
end;
$$;

drop policy if exists audit_log_permission_guard on public.audit_log;
create policy audit_log_permission_guard on public.audit_log
  as restrictive for select to authenticated
  using (empresa_id = public.app_empresa_id() and public.app_has_permission('usuarios', 'admin'));

commit;
