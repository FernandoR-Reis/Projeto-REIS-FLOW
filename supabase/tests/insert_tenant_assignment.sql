-- Run only in an isolated test database with all migrations applied.
-- Fixtures and writes are rolled back; never use production customer records.
begin;

insert into public.empresas (id, nome, status) values
  ('a2100000-0000-4000-8000-000000000001', 'Synthetic Insert Company A', 'ativo'),
  ('b2100000-0000-4000-8000-000000000001', 'Synthetic Insert Company B', 'ativo');

insert into auth.users (id, email, invited_at, raw_user_meta_data) values
  ('a1100000-0000-4000-8000-000000000001', 'insert-admin@example.invalid', now(), '{}'::jsonb),
  ('a1100000-0000-4000-8000-000000000002', 'insert-viewer@example.invalid', now(), '{}'::jsonb),
  ('a1100000-0000-4000-8000-000000000003', 'insert-unlinked@example.invalid', now(), '{}'::jsonb);

-- Simulate a legacy profile pointing to a different company than membership.
insert into public.profiles (id, nome, cargo, empresa_id) values
  ('a1100000-0000-4000-8000-000000000001', 'Synthetic Insert Admin', 'admin', 'b2100000-0000-4000-8000-000000000001'),
  ('a1100000-0000-4000-8000-000000000002', 'Synthetic Insert Viewer', 'visualizador', 'a2100000-0000-4000-8000-000000000001'),
  ('a1100000-0000-4000-8000-000000000003', 'Synthetic Insert Unlinked', 'admin', 'a2100000-0000-4000-8000-000000000001');

insert into public.tenant_memberships (user_id, empresa_id, role) values
  ('a1100000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001', 'admin'),
  ('a1100000-0000-4000-8000-000000000002', 'a2100000-0000-4000-8000-000000000001', 'visualizador');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000001', true);

do $$
declare
  client_id uuid;
  assigned_company uuid;
begin
  insert into public.clientes (nome, documento, status)
  values ('Synthetic Client Without Tenant', 'SYN-INSERT-001', 'ativo')
  returning id, empresa_id into client_id, assigned_company;

  if assigned_company is distinct from public.app_empresa_id() then
    raise exception 'Insert used the stale profile instead of the active membership.';
  end if;

  update public.clientes set telefone = '(11) 99999-0000' where id = client_id;
  if not exists (select 1 from public.clientes where id = client_id and telefone = '(11) 99999-0000') then
    raise exception 'The inserted client could not be updated in its own company.';
  end if;

  insert into public.clientes (nome, status)
  values ('Synthetic Pending Budget Client', 'ativo');

  insert into public.clientes (nome, empresa_id)
  values ('Synthetic Explicit Own Company', 'a2100000-0000-4000-8000-000000000001');

  insert into public.fornecedores (nome)
  values ('Synthetic Shared Trigger Supplier')
  returning empresa_id into assigned_company;
  if assigned_company is distinct from public.app_empresa_id() then
    raise exception 'The shared insert trigger did not assign the supplier tenant.';
  end if;

  begin
    insert into public.clientes (nome, empresa_id)
    values ('Synthetic Rejected Foreign Client', 'b2100000-0000-4000-8000-000000000001');
    raise exception 'An explicit foreign company was accepted.';
  exception when insufficient_privilege then null;
  end;

  if exists (select 1 from public.clientes where empresa_id <> public.app_empresa_id()) then
    raise exception 'The client list crossed company boundaries.';
  end if;
end;
$$;

reset role;
update public.profiles set empresa_id = null
where id = 'a1100000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
begin
  insert into public.clientes (nome, documento)
  values ('Synthetic Null Profile Company', 'SYN-INSERT-002');
end;
$$;

reset role;
update public.tenant_memberships set active = false
where user_id = 'a1100000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
begin
  begin
    insert into public.clientes (nome, empresa_id)
    values ('Synthetic Suspended Membership', 'a2100000-0000-4000-8000-000000000001');
    raise exception 'A suspended membership inserted a client.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.tenant_memberships set active = true
where user_id = 'a1100000-0000-4000-8000-000000000001';
update public.empresas set status = 'inativo'
where id = 'a2100000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
begin
  begin
    insert into public.clientes (nome) values ('Synthetic Inactive Company');
    raise exception 'An inactive company accepted an insert.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.empresas set status = 'ativo'
where id = 'a2100000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    insert into public.clientes (nome) values ('Synthetic Read Only User');
    raise exception 'A read-only user inserted a client.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', 'a1100000-0000-4000-8000-000000000003', true);

do $$
begin
  begin
    insert into public.clientes (nome) values ('Synthetic Profile Without Membership');
    raise exception 'A legacy profile without membership authorized an insert.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role service_role;
insert into public.clientes (nome, empresa_id)
values ('Synthetic Administrative Import', 'a2100000-0000-4000-8000-000000000001');

do $$
begin
  begin
    insert into public.clientes (nome) values ('Synthetic Import Without Tenant');
    raise exception 'An administrative import omitted its company.';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
rollback;
