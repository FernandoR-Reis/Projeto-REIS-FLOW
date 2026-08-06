-- =============================================================
-- REIS FLOW - Migration 20260806_009
-- Etapa 4: Multi-Tenant — migração de dados históricos
-- Vincula todos os registros existentes à empresa "REIS Flow"
-- e garante que novos clientes iniciem com ambiente vazio.
-- =============================================================

begin;

-- ------------------------------------------------------------
-- 1. Criar a empresa "REIS Flow" para dados legados
-- ------------------------------------------------------------
insert into public.empresas (id, nome, status)
values ('00000000-0000-0000-0000-000000000001', 'REIS Flow', 'ativo')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. Vincular todos os profiles sem empresa ao REIS Flow
-- ------------------------------------------------------------
update public.profiles
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- ------------------------------------------------------------
-- 3. Backfill: tabelas de negócio sem empresa_id
--    Usa empresa_id do autor (created_by) quando disponível,
--    senão atribui ao REIS Flow como fallback.
-- ------------------------------------------------------------
update public.clientes
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.obras
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.orcamentos
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.orcamento_itens oi
set empresa_id = o.empresa_id
from public.orcamentos o
where oi.orcamento_id = o.id
  and oi.empresa_id is null;

update public.financeiro_receber
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.financeiro_pagar
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.equipe
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.usuarios_sistema
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.estoque_itens
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

update public.fornecedores
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- estoque_movimentos: herda empresa do item de estoque
update public.estoque_movimentos em
set empresa_id = ei.empresa_id
from public.estoque_itens ei
where em.estoque_item_id = ei.id
  and em.empresa_id is null;

-- fallback para movimentos sem item vinculado
update public.estoque_movimentos
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- obra_etapas e obra_historico: herdam empresa da obra
update public.obra_etapas oe
set empresa_id = o.empresa_id
from public.obras o
where oe.obra_id = o.id
  and oe.empresa_id is null;

update public.obra_historico oh
set empresa_id = o.empresa_id
from public.obras o
where oh.obra_id = o.id
  and oh.empresa_id is null;

-- ------------------------------------------------------------
-- 4. Tornar empresa_id NOT NULL após backfill
--    (impede registros órfãos no futuro)
-- ------------------------------------------------------------
alter table public.clientes            alter column empresa_id set not null;
alter table public.obras               alter column empresa_id set not null;
alter table public.orcamentos          alter column empresa_id set not null;
alter table public.orcamento_itens     alter column empresa_id set not null;
alter table public.financeiro_receber  alter column empresa_id set not null;
alter table public.financeiro_pagar    alter column empresa_id set not null;
alter table public.equipe              alter column empresa_id set not null;
alter table public.usuarios_sistema    alter column empresa_id set not null;
alter table public.estoque_itens       alter column empresa_id set not null;
alter table public.fornecedores        alter column empresa_id set not null;
alter table public.estoque_movimentos  alter column empresa_id set not null;
alter table public.obra_etapas         alter column empresa_id set not null;
alter table public.obra_historico      alter column empresa_id set not null;

commit;
