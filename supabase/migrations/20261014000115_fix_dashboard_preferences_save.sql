begin;

create or replace function public.app_save_dashboard_preferences(
  requested_preferences jsonb,
  expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  existing_updated_at timestamptz;
  preference_entry record;
  preference_count integer;
  result jsonb;
begin
  if auth.uid() is null or current_company is null then
    raise exception 'E necessaria uma membership ativa para salvar preferencias.';
  end if;
  if requested_preferences is null or jsonb_typeof(requested_preferences) is distinct from 'object' then
    raise exception 'O formato das preferencias do Dashboard e invalido.';
  end if;

  select count(*) into preference_count
  from jsonb_object_keys(requested_preferences);
  if preference_count > 32 then
    raise exception 'O conjunto de preferencias do Dashboard e maior que o permitido.';
  end if;

  for preference_entry in select key, value from jsonb_each(requested_preferences)
  loop
    if jsonb_typeof(preference_entry.value) <> 'boolean' then
      raise exception 'O valor da preferencia % deve ser booleano.', preference_entry.key;
    end if;
  end loop;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select stored.updated_at
  into existing_updated_at
  from public.user_dashboard_preferences stored
  where stored.user_id = auth.uid()
    and stored.empresa_id = current_company
  for update;

  if found and expected_updated_at is distinct from existing_updated_at then
    raise exception 'As preferencias foram alteradas em outra sessao. Recarregue antes de salvar.';
  end if;
  if not found and expected_updated_at is not null then
    raise exception 'As preferencias salvas nao foram encontradas. Recarregue antes de salvar.';
  end if;

  insert into public.user_dashboard_preferences (user_id, empresa_id, preferences, updated_at)
  values (auth.uid(), current_company, requested_preferences, now())
  on conflict (user_id, empresa_id) do update
    set preferences = excluded.preferences,
        updated_at = excluded.updated_at;

  select jsonb_build_object(
    'preferences', stored.preferences,
    'updated_at', stored.updated_at
  )
  into result
  from public.user_dashboard_preferences stored
  where stored.user_id = auth.uid()
    and stored.empresa_id = current_company;

  return result;
end;
$$;

revoke all on function public.app_save_dashboard_preferences(jsonb, timestamptz) from public, anon;
grant execute on function public.app_save_dashboard_preferences(jsonb, timestamptz) to authenticated;

commit;
