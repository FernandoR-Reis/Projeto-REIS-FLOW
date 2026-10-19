begin;

-- Keep the existing trigger name; all business inserts share this function.
create or replace function public.set_empresa_id_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_company uuid;
begin
  -- Administrative imports without a user must still supply their tenant.
  if auth.uid() is null and new.empresa_id is not null then
    return new;
  end if;

  current_company := public.app_empresa_id();
  if current_company is null then
    raise exception using
      errcode = '42501',
      message = 'A conta não possui vínculo ativo com uma empresa.';
  end if;

  if new.empresa_id is not null and new.empresa_id <> current_company then
    raise exception using
      errcode = '42501',
      message = 'Não é permitido cadastrar registros em outra empresa.';
  end if;

  new.empresa_id := current_company;
  return new;
end;
$$;

commit;
