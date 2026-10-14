begin;

create or replace function public.app_my_permissions()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  membership_role text := public.app_user_role();
  grant_data jsonb;
  grant_template text;
begin
  if auth.uid() is null or current_company is null or membership_role is null then
    raise exception 'A membership ativa e necessaria para consultar permissoes.';
  end if;

  if membership_role = 'admin' then
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
    select grants.permissions, grants.template_key
      into grant_data, grant_template
    from public.user_module_permissions grants
    where grants.user_id = auth.uid()
      and grants.empresa_id = current_company;
    if grant_data is null then
      raise exception 'As permissoes deste usuario ainda nao foram provisionadas.';
    end if;
  end if;

  return jsonb_build_object(
    'user_id', auth.uid(),
    'empresa_id', current_company,
    'role', membership_role,
    'template_key', grant_template,
    'is_admin', membership_role = 'admin',
    'permissions', grant_data
  );
end;
$$;

revoke all on function public.app_my_permissions() from public, anon;
grant execute on function public.app_my_permissions() to authenticated;

commit;
