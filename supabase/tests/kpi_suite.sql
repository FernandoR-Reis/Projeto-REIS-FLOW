-- REIS FLOW - Fase 5
-- Suite minima de KPI (unitario/integracao SQL)
-- Executar no SQL Editor do Supabase.
-- O script roda em transacao e termina com ROLLBACK.

begin;

create temp table _kpi_assertions (
  test_name text not null,
  passed boolean not null,
  observed text,
  expected text
) on commit drop;

do $$
declare
  v_cliente_id uuid;
  v_obra_andamento uuid;
  v_obra_atrasada uuid;
  v_orc_pendente uuid;
  v_orc_aprovado uuid;

  m_obras_ativas int;
  m_obras_atrasadas int;
  m_orc_pendentes int;
  m_orc_pendentes_valor numeric;
  m_equipes_campo int;
  m_estoque_critico int;
  m_a_receber numeric;
  m_contas_vencendo numeric;
begin
  insert into public.clientes (nome, tipo_documento, documento, telefone, email, status)
  values (
    'KPI TEST CLIENTE',
    'CPF',
    'KPI' || substr(md5(random()::text), 1, 8),
    '11999999999',
    'kpi.test@local',
    'ativo'
  )
  returning id into v_cliente_id;

  insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
  values (
    'KPI-OB-' || substr(md5(random()::text), 1, 6),
    'Obra andamento KPI',
    v_cliente_id,
    'Teste',
    current_date + 10,
    1000,
    'andamento',
    'SP'
  )
  returning id into v_obra_andamento;

  insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
  values (
    'KPI-OB-' || substr(md5(random()::text), 1, 6),
    'Obra atrasada KPI',
    v_cliente_id,
    'Teste',
    current_date - 2,
    2000,
    'atrasada',
    'SP'
  )
  returning id into v_obra_atrasada;

  insert into public.orcamentos (codigo, cliente_id, descricao, valor, margem_percentual, validade, status)
  values (
    'KPI-ORC-' || substr(md5(random()::text), 1, 6),
    v_cliente_id,
    'Orcamento pendente KPI',
    1500,
    20,
    current_date + 30,
    'pendente'
  )
  returning id into v_orc_pendente;

  insert into public.orcamentos (codigo, cliente_id, descricao, valor, margem_percentual, validade, status)
  values (
    'KPI-ORC-' || substr(md5(random()::text), 1, 6),
    v_cliente_id,
    'Orcamento aprovado KPI',
    800,
    20,
    current_date + 30,
    'aprovado'
  )
  returning id into v_orc_aprovado;

  insert into public.financeiro_receber (referencia, cliente_id, obra_id, descricao, valor, vencimento, status)
  values
    ('KPI-REC-' || substr(md5(random()::text), 1, 8), v_cliente_id, v_obra_andamento, 'Receber aberto', 500, current_date + 3, 'pendente'),
    ('KPI-REC-' || substr(md5(random()::text), 1, 8), v_cliente_id, v_obra_andamento, 'Receber quitado', 200, current_date + 1, 'recebido');

  insert into public.financeiro_pagar (referencia, fornecedor, categoria, valor, vencimento, status)
  values
    ('KPI-PAG-' || substr(md5(random()::text), 1, 8), 'Fornecedor KPI', 'teste', 120, current_date + 4, 'pendente'),
    ('KPI-PAG-' || substr(md5(random()::text), 1, 8), 'Fornecedor KPI', 'teste', 50, current_date - 3, 'pago');

  insert into public.equipe (nome, area, funcao, telefone, email, diaria, comissao_percentual, obra_id, status)
  values
    ('Equipe Campo KPI', 'obras', 'Tecnico', '11999999999', 'campo@kpi.local', 300, 5, v_obra_andamento, 'campo'),
    ('Equipe Disponivel KPI', 'obras', 'Tecnico', '11888888888', 'disp@kpi.local', 300, 5, null, 'disponivel');

  insert into public.estoque_itens (codigo, nome, categoria, quantidade, minimo, custo_unitario, fornecedor)
  values
    ('KPI-EST-' || substr(md5(random()::text), 1, 6), 'Item critico KPI', 'Outros', 2, 5, 10, 'Fornecedor KPI'),
    ('KPI-EST-' || substr(md5(random()::text), 1, 6), 'Item normal KPI', 'Outros', 10, 2, 10, 'Fornecedor KPI');

  select count(*)
    into m_obras_ativas
  from public.obras
  where id in (v_obra_andamento, v_obra_atrasada)
    and status in ('andamento', 'aprovada');

  select count(*)
    into m_obras_atrasadas
  from public.obras
  where id in (v_obra_andamento, v_obra_atrasada)
    and status = 'atrasada';

  select count(*), coalesce(sum(valor), 0)
    into m_orc_pendentes, m_orc_pendentes_valor
  from public.orcamentos
  where id in (v_orc_pendente, v_orc_aprovado)
    and status = 'pendente';

  select count(*)
    into m_equipes_campo
  from public.equipe
  where nome in ('Equipe Campo KPI', 'Equipe Disponivel KPI')
    and status = 'campo';

  select count(*)
    into m_estoque_critico
  from public.estoque_itens
  where nome in ('Item critico KPI', 'Item normal KPI')
    and quantidade < minimo;

  select coalesce(sum(valor), 0)
    into m_a_receber
  from public.financeiro_receber
  where descricao in ('Receber aberto', 'Receber quitado')
    and status in ('pendente', 'vencido', 'futuro');

  select coalesce(sum(valor), 0)
    into m_contas_vencendo
  from (
    select valor, vencimento, status from public.financeiro_receber where descricao in ('Receber aberto', 'Receber quitado')
    union all
    select valor, vencimento, status from public.financeiro_pagar where fornecedor = 'Fornecedor KPI'
  ) t
  where status in ('pendente', 'vencido', 'futuro')
    and vencimento between current_date and (current_date + 7);

  insert into _kpi_assertions values
    ('obras_ativas', m_obras_ativas = 1, m_obras_ativas::text, '1'),
    ('obras_atrasadas', m_obras_atrasadas = 1, m_obras_atrasadas::text, '1'),
    ('orc_pendentes_count', m_orc_pendentes = 1, m_orc_pendentes::text, '1'),
    ('orc_pendentes_valor', m_orc_pendentes_valor = 1500, m_orc_pendentes_valor::text, '1500'),
    ('equipes_campo', m_equipes_campo = 1, m_equipes_campo::text, '1'),
    ('estoque_critico', m_estoque_critico = 1, m_estoque_critico::text, '1'),
    ('a_receber_aberto', m_a_receber = 500, m_a_receber::text, '500'),
    ('contas_vencendo_7d', m_contas_vencendo = 620, m_contas_vencendo::text, '620');
end $$;

select test_name, passed, observed, expected
from _kpi_assertions
order by test_name;

rollback;
