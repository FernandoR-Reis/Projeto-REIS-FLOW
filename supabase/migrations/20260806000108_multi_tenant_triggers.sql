-- =============================================================
-- REIS FLOW - Migration 20260806_008
-- Etapa 3: Multi-Tenant — triggers de preenchimento automático
-- O front-end nunca enviará empresa_id; o banco o preenche.
-- =============================================================

begin;

-- ------------------------------------------------------------
-- Função genérica reutilizada por todos os triggers
-- ------------------------------------------------------------
create or replace function public.set_empresa_id_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  -- Usa empresa_id que o front-end enviou (se vier preenchido); 
  -- caso contrário, busca do perfil do usuário autenticado.
  if new.empresa_id is not null then
    return new;
  end if;

  select empresa_id into v_empresa_id
  from public.profiles
  where id = auth.uid()
  limit 1;

  if v_empresa_id is null then
    raise exception 'Usuário sem empresa vinculada. Contate o suporte.';
  end if;

  new.empresa_id := v_empresa_id;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Triggers BEFORE INSERT em cada tabela de negócio
-- ------------------------------------------------------------
drop trigger if exists trg_set_empresa_id_clientes           on public.clientes;
drop trigger if exists trg_set_empresa_id_obras              on public.obras;
drop trigger if exists trg_set_empresa_id_orcamentos         on public.orcamentos;
drop trigger if exists trg_set_empresa_id_orcamento_itens    on public.orcamento_itens;
drop trigger if exists trg_set_empresa_id_financeiro_receber on public.financeiro_receber;
drop trigger if exists trg_set_empresa_id_financeiro_pagar   on public.financeiro_pagar;
drop trigger if exists trg_set_empresa_id_equipe             on public.equipe;
drop trigger if exists trg_set_empresa_id_usuarios_sistema   on public.usuarios_sistema;
drop trigger if exists trg_set_empresa_id_estoque_itens      on public.estoque_itens;
drop trigger if exists trg_set_empresa_id_fornecedores       on public.fornecedores;
drop trigger if exists trg_set_empresa_id_estoque_movimentos on public.estoque_movimentos;
drop trigger if exists trg_set_empresa_id_obra_etapas        on public.obra_etapas;
drop trigger if exists trg_set_empresa_id_obra_historico     on public.obra_historico;

create trigger trg_set_empresa_id_clientes
  before insert on public.clientes
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_obras
  before insert on public.obras
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_orcamentos
  before insert on public.orcamentos
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_orcamento_itens
  before insert on public.orcamento_itens
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_financeiro_receber
  before insert on public.financeiro_receber
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_financeiro_pagar
  before insert on public.financeiro_pagar
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_equipe
  before insert on public.equipe
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_usuarios_sistema
  before insert on public.usuarios_sistema
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_estoque_itens
  before insert on public.estoque_itens
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_fornecedores
  before insert on public.fornecedores
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_estoque_movimentos
  before insert on public.estoque_movimentos
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_obra_etapas
  before insert on public.obra_etapas
  for each row execute function public.set_empresa_id_from_profile();

create trigger trg_set_empresa_id_obra_historico
  before insert on public.obra_historico
  for each row execute function public.set_empresa_id_from_profile();

commit;
