-- Sinthetic integration checks for migration 20261009000112.
-- Run only on a local/test Supabase database. Everything is rolled back.
begin;

insert into public.empresas (id, nome, status) values
  ('a2000000-0000-4000-8000-000000000001', 'Synthetic Company A', 'ativo'),
  ('b2000000-0000-4000-8000-000000000001', 'Synthetic Company B', 'ativo');

insert into auth.users (id, email, invited_at, raw_user_meta_data) values
  ('a1000000-0000-4000-8000-000000000001', 'tenant-a-admin@example.invalid', now(), '{}'::jsonb),
  ('a1000000-0000-4000-8000-000000000002', 'tenant-a-viewer@example.invalid', now(), '{}'::jsonb),
  ('a1000000-0000-4000-8000-000000000003', 'tenant-a-finance@example.invalid', now(), '{}'::jsonb),
  ('b1000000-0000-4000-8000-000000000001', 'tenant-b-admin@example.invalid', now(), '{}'::jsonb),
  ('c1000000-0000-4000-8000-000000000001', 'tenant-no-company@example.invalid', now(), '{}'::jsonb),
  ('d1000000-0000-4000-8000-000000000001', 'tenant-legacy-profile@example.invalid', now(), '{}'::jsonb);

insert into public.profiles (id, nome, cargo, empresa_id) values
  ('a1000000-0000-4000-8000-000000000001', 'Synthetic A Admin', 'admin', 'a2000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000002', 'Synthetic A Viewer', 'visualizador', 'a2000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000003', 'Synthetic A Finance', 'financeiro', 'a2000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000001', 'Synthetic B Admin', 'admin', 'b2000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000001', 'Synthetic No Company', 'admin', null),
  ('d1000000-0000-4000-8000-000000000001', 'Synthetic Legacy Profile', 'admin', 'b2000000-0000-4000-8000-000000000001');

insert into public.tenant_memberships (user_id, empresa_id, role) values
  ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'admin'),
  ('a1000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'visualizador'),
  ('a1000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000001', 'financeiro'),
  ('b1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'admin');

update auth.users
set invited_at = null
where id = 'd1000000-0000-4000-8000-000000000001';

insert into public.clientes (id, nome, tipo_documento, documento, status, empresa_id) values
  ('a3000000-0000-4000-8000-000000000001', 'Synthetic A Client', 'CPF', 'SYN-A-CLIENT-0001', 'ativo', 'a2000000-0000-4000-8000-000000000001'),
  ('b3000000-0000-4000-8000-000000000001', 'Synthetic B Client', 'CPF', 'SYN-B-CLIENT-0001', 'ativo', 'b2000000-0000-4000-8000-000000000001');

insert into public.obras (id, codigo, nome, cliente_id, valor, status, empresa_id) values
  ('a4000000-0000-4000-8000-000000000001', 'SYN-A-OBRA', 'Synthetic A Work', 'a3000000-0000-4000-8000-000000000001', 100, 'andamento', 'a2000000-0000-4000-8000-000000000001'),
  ('b4000000-0000-4000-8000-000000000001', 'SYN-B-OBRA', 'Synthetic B Work', 'b3000000-0000-4000-8000-000000000001', 900, 'andamento', 'b2000000-0000-4000-8000-000000000001');

insert into public.orcamentos (id, codigo, descricao, valor, status, empresa_id) values
  ('a5000000-0000-4000-8000-000000000001', 'SYN-A-ORC', 'Synthetic A Budget', 100, 'pendente', 'a2000000-0000-4000-8000-000000000001'),
  ('b5000000-0000-4000-8000-000000000001', 'SYN-B-ORC', 'Synthetic B Budget', 900, 'pendente', 'b2000000-0000-4000-8000-000000000001');

insert into public.orcamento_itens (id, orcamento_id, descricao, quantidade, valor_unitario, empresa_id) values
  ('a5100000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 'Synthetic A Budget Item', 1, 100, 'a2000000-0000-4000-8000-000000000001'),
  ('b5100000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001', 'Synthetic B Budget Item', 1, 900, 'b2000000-0000-4000-8000-000000000001');

insert into public.financeiro_receber (id, referencia, descricao, valor, vencimento, status, empresa_id) values
  ('a6000000-0000-4000-8000-000000000001', 'SYN-A-REC', 'Synthetic A Receivable', 100, current_date + 1, 'pendente', 'a2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000001', 'SYN-B-REC', 'Synthetic B Receivable', 900, current_date + 1, 'pendente', 'b2000000-0000-4000-8000-000000000001');

insert into public.financeiro_pagar (id, referencia, fornecedor, valor, vencimento, status, empresa_id) values
  ('a6100000-0000-4000-8000-000000000001', 'SYN-A-PAG', 'Synthetic A Supplier', 10, current_date + 1, 'pendente', 'a2000000-0000-4000-8000-000000000001'),
  ('b6100000-0000-4000-8000-000000000001', 'SYN-B-PAG', 'Synthetic B Supplier', 90, current_date + 1, 'pendente', 'b2000000-0000-4000-8000-000000000001');

update public.financeiro_receber
set cliente_id = 'a3000000-0000-4000-8000-000000000001',
    obra_id = 'a4000000-0000-4000-8000-000000000001'
where id = 'a6000000-0000-4000-8000-000000000001';

insert into public.equipe (id, nome, funcao, empresa_id) values
  ('a7000000-0000-4000-8000-000000000001', 'Synthetic A Team', 'Synthetic Role', 'a2000000-0000-4000-8000-000000000001'),
  ('b7000000-0000-4000-8000-000000000001', 'Synthetic B Team', 'Synthetic Role', 'b2000000-0000-4000-8000-000000000001');

insert into public.usuarios_sistema (id, equipe_id, auth_user_id, nome, email, empresa_id) values
  ('a7100000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Synthetic A System User', 'system-a@example.invalid', 'a2000000-0000-4000-8000-000000000001'),
  ('b7100000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Synthetic B System User', 'system-b@example.invalid', 'b2000000-0000-4000-8000-000000000001');

insert into public.fornecedores (id, nome, empresa_id) values
  ('a8000000-0000-4000-8000-000000000001', 'Synthetic A Supplier', 'a2000000-0000-4000-8000-000000000001'),
  ('b8000000-0000-4000-8000-000000000001', 'Synthetic B Supplier', 'b2000000-0000-4000-8000-000000000001');

insert into public.estoque_itens (id, codigo, nome, categoria, quantidade, minimo, empresa_id) values
  ('a8100000-0000-4000-8000-000000000001', 'SYN-A-STOCK', 'Synthetic A Stock', 'Synthetic', 1, 1, 'a2000000-0000-4000-8000-000000000001'),
  ('b8100000-0000-4000-8000-000000000001', 'SYN-B-STOCK', 'Synthetic B Stock', 'Synthetic', 1, 1, 'b2000000-0000-4000-8000-000000000001');

insert into public.estoque_movimentos (id, estoque_item_id, tipo, quantidade, empresa_id) values
  ('a8200000-0000-4000-8000-000000000001', 'a8100000-0000-4000-8000-000000000001', 'entrada', 1, 'a2000000-0000-4000-8000-000000000001'),
  ('b8200000-0000-4000-8000-000000000001', 'b8100000-0000-4000-8000-000000000001', 'entrada', 1, 'b2000000-0000-4000-8000-000000000001');

insert into public.obra_etapas (id, obra_id, titulo, empresa_id) values
  ('a9000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'Synthetic A Stage', 'a2000000-0000-4000-8000-000000000001'),
  ('b9000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Synthetic B Stage', 'b2000000-0000-4000-8000-000000000001');

insert into public.obra_historico (id, obra_id, tipo, titulo, metadata, empresa_id) values
  ('aa000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'synthetic', 'Synthetic A Attachment Metadata', '{}'::jsonb, 'a2000000-0000-4000-8000-000000000001'),
  ('bb000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'synthetic', 'Synthetic B Attachment Metadata', '{}'::jsonb, 'b2000000-0000-4000-8000-000000000001');

insert into public.audit_log (tabela, operacao, registro_id, empresa_id, after_data) values
  ('synthetic', 'INSERT', 'a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '{"fixture":"synthetic-a"}'),
  ('synthetic', 'INSERT', 'b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', '{"fixture":"synthetic-b"}');

do $$
declare
  table_name text;
  row_count bigint;
  row_changes bigint;
  linked_users jsonb;
  grants_timestamp timestamptz;
  dashboard_preferences jsonb;
  rejected boolean;
  tenant_tables text[] := array[
    'clientes', 'obras', 'orcamentos', 'orcamento_itens',
    'financeiro_receber', 'financeiro_pagar', 'equipe', 'usuarios_sistema',
    'estoque_itens', 'fornecedores', 'estoque_movimentos',
    'obra_etapas', 'obra_historico'
  ];
begin
  foreach table_name in array tenant_tables loop
    if not exists (
      select 1
      from pg_class relation
      join pg_namespace schema on schema.oid = relation.relnamespace
      where schema.nspname = 'public'
        and relation.relname = table_name
        and relation.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on %', table_name;
    end if;
    if (
      select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and qual like '%app_empresa_id%'
    ) < 2 then
      raise exception 'Tenant-scoped read/write policies are missing on %', table_name;
    end if;
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'permission_select_guard'
        and permissive = 'RESTRICTIVE'
    ) then
      raise exception 'Module permission guard is missing on %', table_name;
    end if;
  end loop;

  if public.app_permission_template('visualizador') -> 'dashboard' ->> 'view' <> 'false'
    or public.app_permission_template('visualizador') -> 'financeiro' ->> 'view' <> 'false'
    or public.app_permission_template('financeiro') -> 'dashboard' ->> 'view' <> 'false'
    or public.app_permission_template('gerente') -> 'financeiro' ->> 'view' <> 'false'
    or public.app_permission_template('gerente') -> 'usuarios' ->> 'admin' <> 'false' then
    raise exception 'A least-privilege permission templates include an unexpected grant.';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  table_name text;
  row_count bigint;
  row_changes bigint;
  tenant_tables text[] := array[
    'clientes', 'obras', 'orcamentos', 'orcamento_itens',
    'financeiro_receber', 'financeiro_pagar', 'equipe', 'usuarios_sistema',
    'estoque_itens', 'fornecedores', 'estoque_movimentos',
    'obra_etapas', 'obra_historico'
  ];
begin
  if public.app_empresa_id() <> 'a2000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Account A did not resolve to its synthetic organization.';
  end if;

  foreach table_name in array tenant_tables loop
    execute format('select count(id) from public.%I', table_name) into row_count;
    if row_count <> 1 then
      raise exception 'Account A sees % rows in %, expected 1.', row_count, table_name;
    end if;
  end loop;

  if (select count(id) from public.clientes where nome ilike '%Synthetic B%') <> 0 then
    raise exception 'Account A search returned Account B data.';
  end if;
  if (select count(id) from public.clientes where id = 'b3000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Account A direct detail lookup returned Account B data.';
  end if;
  if (select coalesce(sum(valor), 0) from public.financeiro_pagar) <> 10 then
    raise exception 'Account A financial aggregate contains another organization.';
  end if;
  if (select count(id) from public.obra_etapas where id = 'b9000000-0000-4000-8000-000000000001') <> 0
      or (select count(id) from public.obra_historico where id = 'bb000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Account A opened another organization work detail or attachment metadata.';
  end if;
  if (select count(id) from public.audit_log where registro_id = 'b3000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Account A read another organization audit data.';
  end if;
  linked_users := public.app_company_users();
  if jsonb_array_length(linked_users) <> 3 then
    raise exception 'Company admin did not receive its own organization user list.';
  end if;
  select updated_at into grants_timestamp
  from public.user_module_permissions
  where user_id = 'a1000000-0000-4000-8000-000000000003';
  if grants_timestamp is null then
    raise exception 'Finance user permissions were not initialized.';
  end if;

  dashboard_preferences := public.app_my_dashboard_preferences();
  if dashboard_preferences -> 'preferences' <> 'null'::jsonb then
    raise exception 'A new user unexpectedly has saved Dashboard preferences.';
  end if;
  dashboard_preferences := public.app_save_dashboard_preferences(
    '{"obras-ativas":false,"grafico-faturamento":true}'::jsonb,
    null
  );
  if dashboard_preferences -> 'preferences' ->> 'obras-ativas' <> 'false'
    or dashboard_preferences -> 'preferences' ->> 'grafico-faturamento' <> 'true' then
    raise exception 'Dashboard preferences were not persisted for the current user.';
  end if;
  if public.app_my_dashboard_preferences() -> 'preferences' ->> 'obras-ativas' <> 'false' then
    raise exception 'Dashboard preferences were not loaded after saving.';
  end if;
  rejected := false;
  begin
    perform public.app_save_dashboard_preferences('{"obras-ativas":true}'::jsonb, null);
  exception when sqlstate 'P0001' then
    rejected := sqlerrm like 'As preferencias foram alteradas em outra sessao.%';
  end;
  if not rejected then
    raise exception 'A stale Dashboard preference update was not rejected.';
  end if;
  rejected := false;
  begin
    perform public.app_save_user_permissions(
      'a1000000-0000-4000-8000-000000000001',
      '{}'::jsonb,
      'personalizado',
      grants_timestamp
    );
  exception when sqlstate 'P0001' then
    rejected := sqlerrm = 'Nao e permitido alterar as proprias permissoes.';
  end;
  if not rejected then
    raise exception 'Company admin was allowed to edit its own permissions.';
  end if;

  rejected := false;
  begin
    perform public.app_save_user_permissions(
      'a1000000-0000-4000-8000-000000000003',
      '{"usuarios":{"view":true,"admin":true}}'::jsonb,
      'personalizado',
      grants_timestamp
    );
  exception when sqlstate 'P0001' then
    rejected := sqlerrm = 'A administracao de usuarios nao pode ser delegada.';
  end;
  if not rejected then
    raise exception 'Company admin could delegate user-management privileges.';
  end if;

  rejected := false;
  begin
    perform public.app_save_user_permissions(
      'b1000000-0000-4000-8000-000000000001',
      '{}'::jsonb,
      'personalizado',
      null
    );
  exception when sqlstate 'P0001' then
    rejected := sqlerrm = 'Usuario ativo nao encontrado nesta organizacao.';
  end;
  if not rejected then
    raise exception 'Company admin changed permissions for another organization.';
  end if;

  rejected := false;
  begin
    perform public.app_save_user_permissions(
      'a1000000-0000-4000-8000-000000000003',
      public.app_permission_template('financeiro'),
      'financeiro',
      '2000-01-01T00:00:00Z'::timestamptz
    );
  exception when sqlstate 'P0001' then
    rejected := sqlerrm like 'As permissoes foram alteradas por outro administrador.%';
  end;
  if not rejected then
    raise exception 'A stale permission edit was not rejected.';
  end if;

  update public.clientes set nome = 'Synthetic A Client Updated'
  where id = 'b3000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Account A modified Account B data.';
  end if;
  delete from public.clientes where id = 'b3000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Account A deleted Account B data.';
  end if;

  update public.profiles
  set empresa_id = 'b2000000-0000-4000-8000-000000000001', cargo = 'admin'
  where id = 'a1000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Account A changed its own organization or privileged role.';
  end if;

  begin
    insert into public.clientes (id, nome, documento, empresa_id)
    values ('a3000000-0000-4000-8000-000000000099', 'Synthetic Cross Tenant Insert', 'SYN-A-CROSS-0001', 'b2000000-0000-4000-8000-000000000001');
    raise exception 'Account A inserted a row into Account B.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  row_count bigint;
  row_changes bigint;
  dashboard_preferences jsonb;
begin
  if public.app_empresa_id() <> 'b2000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Account B did not resolve to its synthetic organization.';
  end if;
  select count(id) into row_count from public.clientes;
  if row_count <> 1 or (select count(id) from public.clientes where nome ilike '%Synthetic A%') <> 0 then
    raise exception 'Account B list or search crossed into Account A.';
  end if;
  if (select coalesce(sum(valor), 0) from public.financeiro_pagar) <> 90 then
    raise exception 'Account B financial aggregate contains another organization.';
  end if;
  dashboard_preferences := public.app_my_dashboard_preferences();
  if dashboard_preferences -> 'preferences' <> 'null'::jsonb then
    raise exception 'Account B received Dashboard preferences from Account A.';
  end if;
  update public.clientes set nome = 'Synthetic B Client Updated'
  where id = 'a3000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Account B modified Account A data.';
  end if;
  delete from public.clientes where id = 'a3000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Account B deleted Account A data.';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);

do $$
declare
  finance_data jsonb;
  dashboard_preferences jsonb;
  rejected boolean := false;
begin
  if public.app_user_role() <> 'financeiro'
    or not public.app_has_permission('financeiro', 'view')
    or public.app_has_permission('clientes', 'view')
    or public.app_has_permission('obras', 'view')
    or public.app_has_permission('dashboard', 'view') then
    raise exception 'Finance role received permissions outside its least-privilege template.';
  end if;
  if (select count(id) from public.financeiro_receber) <> 1
    or (select count(id) from public.clientes) <> 0
    or (select count(id) from public.obras) <> 0 then
    raise exception 'Finance role can read data outside its authorized module.';
  end if;

  finance_data := public.app_finance_data();
  if jsonb_array_length(finance_data -> 'receivables') <> 1
    or finance_data -> 'receivables' -> 0 -> 'clientes' ->> 'nome' <> 'Synthetic A Client' then
    raise exception 'Finance-scoped data did not return its authorized client context.';
  end if;
  if jsonb_array_length(public.app_client_options()) <> 1
    or public.app_client_options() -> 0 ->> 'nome' <> 'Synthetic A Client'
    or jsonb_array_length(public.app_finance_work_options()) <> 1 then
    raise exception 'Scoped finance lookup options are missing or cross-tenant.';
  end if;
  dashboard_preferences := public.app_my_dashboard_preferences();
  if dashboard_preferences -> 'preferences' <> 'null'::jsonb then
    raise exception 'A different user inherited Dashboard preferences from the company admin.';
  end if;
  dashboard_preferences := public.app_save_dashboard_preferences('{"grafico-faturamento":true}'::jsonb, null);
  if dashboard_preferences -> 'preferences' ->> 'grafico-faturamento' <> 'true'
    or public.app_has_permission('dashboard', 'view')
    or public.app_has_permission('clientes', 'view') then
    raise exception 'Saving a visual preference changed module authorization.';
  end if;

  delete from public.financeiro_receber where id = 'a6000000-0000-4000-8000-000000000001';
  if found then
    raise exception 'Finance template unexpectedly received delete permission.';
  end if;

  begin
    perform public.app_company_users();
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Finance role accessed organization user management.';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

do $$
declare
  row_count bigint;
  row_changes bigint;
  dashboard_preferences jsonb;
begin
  select count(id) into row_count from public.clientes;
  if row_count <> 1 or public.app_user_role() <> 'visualizador' then
    raise exception 'Same-organization viewer cannot read its permitted organization data.';
  end if;
  if public.app_has_permission('dashboard', 'view')
    or public.app_has_permission('financeiro', 'view') then
    raise exception 'Viewer template unexpectedly received dashboard or financial access.';
  end if;
  dashboard_preferences := public.app_my_dashboard_preferences();
  if dashboard_preferences -> 'preferences' <> 'null'::jsonb then
    raise exception 'Viewer inherited another user Dashboard preferences.';
  end if;
  update public.clientes set nome = 'Synthetic Viewer Unauthorized Write'
  where id = 'a3000000-0000-4000-8000-000000000001';
  get diagnostics row_changes = row_count;
  if row_changes <> 0 then
    raise exception 'Viewer role modified organization data.';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
begin
  if public.app_empresa_id() is not null then
    raise exception 'Account without a membership received an organization.';
  end if;
  if (select count(id) from public.clientes) <> 0 then
    raise exception 'Account without a membership received global data.';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  provisioned_empresa_id uuid;
begin
  provisioned_empresa_id := public.provision_current_user_tenant();
  if provisioned_empresa_id = 'b2000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Legacy profile company ID was trusted during recovery.';
  end if;
  if public.app_empresa_id() <> provisioned_empresa_id or public.app_user_role() <> 'admin' then
    raise exception 'Legacy account did not receive its own isolated organization.';
  end if;
  if (
    select empresa_id
    from public.profiles
    where id = 'd1000000-0000-4000-8000-000000000001'
  ) <> 'b2000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'Legacy profile evidence was unexpectedly overwritten.';
  end if;
  if (select count(id) from public.clientes) <> 0 then
    raise exception 'Legacy account inherited records from its unverified old organization.';
  end if;
end;
$$;

rollback;
