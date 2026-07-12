-- =============================================================
-- Seed operacional para validação do dashboard (DB-only)
-- Regras:
-- 1) 10 clientes
-- 2) 2 orçamentos por cliente (20 total)
-- 3) 4 obras para 5 clientes (20 total)
-- + lançamentos a receber para alimentar indicadores
-- =============================================================

begin;

delete from public.financeiro_receber;
delete from public.equipe;
delete from public.obras;
delete from public.orcamento_itens;
delete from public.orcamentos;
delete from public.clientes;

with clientes_seed as (
  select
    gs as idx,
    format('Cliente Seed %s', lpad(gs::text, 2, '0')) as nome,
    'CNPJ'::text as tipo_documento,
    format('99.%06s/0001-%02s', (100000 + gs)::text, ((gs % 90) + 10)::text) as documento,
    format('(11) 9%08s', (80000000 + gs)::text) as telefone,
    'ativo'::text as status
  from generate_series(1, 10) gs
)
insert into public.clientes (nome, tipo_documento, documento, telefone, status)
select nome, tipo_documento, documento, telefone, status
from clientes_seed;

with base as (
  select row_number() over(order by c.nome) as idx, c.id
  from public.clientes c
),
orc_seed as (
  select
    b.id as cliente_id,
    format('ORC-SD-%02s-%s', b.idx, n.n) as codigo,
    format('Orçamento Seed %02s.%s', b.idx, n.n) as descricao,
    (25000 + (b.idx * 3500) + (n.n * 1800))::numeric(14,2) as valor,
    (22 + ((b.idx + n.n) % 14))::numeric(5,2) as margem_percentual,
    date '2026-12-31' as validade,
    case when n.n = 1 then 'pendente' else 'aprovado' end::text as status
  from base b
  cross join (values (1), (2)) as n(n)
)
insert into public.orcamentos (codigo, cliente_id, descricao, valor, margem_percentual, validade, status)
select codigo, cliente_id, descricao, valor, margem_percentual, validade, status
from orc_seed;

with base as (
  select row_number() over(order by c.nome) as idx, c.id
  from public.clientes c
),
obras_seed as (
  select
    b.id as cliente_id,
    format('OB-SD-%02s-%s', b.idx, n.n) as codigo,
    format('Obra Seed %02s.%s', b.idx, n.n) as nome,
    (array['Diego Santos','Ana Moura','Pedro Lima','Luiz Henrique'])[n.n]::text as responsavel_nome,
    make_date(2026, 7 + n.n, 15) as prazo,
    (48000 + (b.idx * 9000) + (n.n * 3200))::numeric(14,2) as valor,
    (array['andamento','atrasada','concluida','pausada'])[n.n]::text as status,
    (array['São Paulo, SP','Guarulhos, SP','Campinas, SP','Osasco, SP'])[n.n]::text as localizacao
  from base b
  join (values (1), (2), (3), (4)) as n(n) on true
  where b.idx <= 5
)
insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
select codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao
from obras_seed;

with obras_base as (
  select row_number() over(order by o.codigo) as idx, o.id, o.codigo, o.cliente_id
  from public.obras o
),
rec_seed as (
  select
    format('REC-SD-%03s', idx) as referencia,
    cliente_id,
    id as obra_id,
    format('Medição da %s', codigo) as descricao,
    (12000 + (idx * 700))::numeric(14,2) as valor,
    date '2026-10-10' as vencimento,
    case when (idx % 3) = 0 then 'vencido' when (idx % 4) = 0 then 'recebido' else 'pendente' end::text as status
  from obras_base
)
insert into public.financeiro_receber (referencia, cliente_id, obra_id, descricao, valor, vencimento, status)
select referencia, cliente_id, obra_id, descricao, valor, vencimento, status
from rec_seed;

commit;