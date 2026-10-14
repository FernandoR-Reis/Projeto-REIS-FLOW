begin;

create table if not exists public.user_dashboard_preferences (
  user_id uuid not null references public.tenant_memberships (user_id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  preferences jsonb not null check (jsonb_typeof(preferences) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, empresa_id)
);

create index if not exists idx_user_dashboard_preferences_empresa
  on public.user_dashboard_preferences (empresa_id);

alter table public.user_dashboard_preferences enable row level security;
revoke all on public.user_dashboard_preferences from public, anon, authenticated;

create or replace function public.app_my_dashboard_preferences()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_company uuid := public.app_empresa_id();
  result jsonb;
begin
  if auth.uid() is null or current_company is null then
    raise exception 'E necessaria uma membership ativa para consultar preferencias.';
  end if;

  select jsonb_build_object(
    'preferences', stored.preferences,
    'updated_at', stored.updated_at
  )
  into result
  from public.user_dashboard_preferences stored
  where stored.user_id = auth.uid()
    and stored.empresa_id = current_company;

  return coalesce(result, jsonb_build_object('preferences', null, 'updated_at', null));
end;
$$;

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
  result jsonb;
begin
  if auth.uid() is null or current_company is null then
    raise exception 'E necessaria uma membership ativa para salvar preferencias.';
  end if;
  if requested_preferences is null or jsonb_typeof(requested_preferences) is distinct from 'object' then
    raise exception 'O formato das preferencias do Dashboard e invalido.';
  end if;
  if jsonb_object_length(requested_preferences) > 32 then
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

revoke all on function public.app_my_dashboard_preferences() from public, anon;
revoke all on function public.app_save_dashboard_preferences(jsonb, timestamptz) from public, anon;
grant execute on function public.app_my_dashboard_preferences() to authenticated;
grant execute on function public.app_save_dashboard_preferences(jsonb, timestamptz) to authenticated;

commit;
