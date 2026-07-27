-- REIS FLOW - Fase 5
-- Validacao CRUD -> reflexo em KPIs criticos
-- Executar no SQL Editor do Supabase.
-- O script roda em transacao e termina com ROLLBACK.

begin;

create temp table _crud_assertions (
  domain_name text not null,
  step_name text not null,
  passed boolean not null,
  observed text,
  expected text
) on commit drop;

do $$
declare
  v_cliente_id uuid;
  v_obra_id uuid;
  v_item_id uuid;

  b_obras_ativas int;
  b_obras_atrasadas int;
  b_a_receber numeric;
  b_critico int;

  a_obras_ativas int;
  a_obras_atrasadas int;
  a_a_receber numeric;
  a_critico int;

  v_ref text;
  v_code text;
begin
  select count(*) into b_obras_ativas from public.obras where status in ('andamento', 'aprovada');
  select count(*) into b_obras_atrasadas from public.obras where status = 'atrasada';
  select coalesce(sum(valor), 0) into b_a_receber from public.financeiro_receber where status in ('pendente', 'vencido', 'futuro');
  select count(*) into b_critico from public.estoque_itens where quantidade < minimo;

  insert into public.clientes (nome, tipo_documento, documento, telefone, email, status)
  values ('CRUD KPI CLIENTE', 'CPF', 'CRD' || substr(md5(random()::text), 1, 8), '11999999999', 'crud.kpi@local', 'ativo')
  returning id into v_cliente_id;

  -- CREATE / UPDATE / DELETE em obras
  insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
  values ('CRD-OB-' || substr(md5(random()::text), 1, 6), 'Obra CRUD KPI', v_cliente_id, 'Teste', current_date + 10, 900, 'andamento', 'SP')
  returning id into v_obra_id;

  select count(*) into a_obras_ativas from public.obras where status in ('andamento', 'aprovada');
  insert into _crud_assertions values
    ('obras', 'create_andamento', a_obras_ativas = b_obras_ativas + 1, a_obras_ativas::text, (b_obras_ativas + 1)::text);

  update public.obras set status = 'atrasada' where id = v_obra_id;
  select count(*) into a_obras_ativas from public.obras where status in ('andamento', 'aprovada');
  select count(*) into a_obras_atrasadas from public.obras where status = 'atrasada';
  insert into _crud_assertions values
    ('obras', 'update_para_atrasada_ativas', a_obras_ativas = b_obras_ativas, a_obras_ativas::text, b_obras_ativas::text),
    ('obras', 'update_para_atrasada_atrasadas', a_obras_atrasadas = b_obras_atrasadas + 1, a_obras_atrasadas::text, (b_obras_atrasadas + 1)::text);

  delete from public.obras where id = v_obra_id;
  select count(*) into a_obras_ativas from public.obras where status in ('andamento', 'aprovada');
  select count(*) into a_obras_atrasadas from public.obras where status = 'atrasada';
  insert into _crud_assertions values
    ('obras', 'delete_restores_baseline_ativas', a_obras_ativas = b_obras_ativas, a_obras_ativas::text, b_obras_ativas::text),
    ('obras', 'delete_restores_baseline_atrasadas', a_obras_atrasadas = b_obras_atrasadas, a_obras_atrasadas::text, b_obras_atrasadas::text);

  -- CREATE / UPDATE / DELETE em financeiro_receber
  v_ref := 'CRD-REC-' || substr(md5(random()::text), 1, 8);

  insert into public.financeiro_receber (referencia, cliente_id, obra_id, descricao, valor, vencimento, status)
  values (v_ref, v_cliente_id, null, 'CRUD KPI receber', 100, current_date + 2, 'pendente');

  select coalesce(sum(valor), 0) into a_a_receber from public.financeiro_receber where status in ('pendente', 'vencido', 'futuro');
  insert into _crud_assertions values
    ('financeiro', 'create_receber', a_a_receber = b_a_receber + 100, a_a_receber::text, (b_a_receber + 100)::text);

  update public.financeiro_receber set status = 'recebido' where referencia = v_ref;
  select coalesce(sum(valor), 0) into a_a_receber from public.financeiro_receber where status in ('pendente', 'vencido', 'futuro');
  insert into _crud_assertions values
    ('financeiro', 'update_receber_para_quitado', a_a_receber = b_a_receber, a_a_receber::text, b_a_receber::text);

  delete from public.financeiro_receber where referencia = v_ref;
  select coalesce(sum(valor), 0) into a_a_receber from public.financeiro_receber where status in ('pendente', 'vencido', 'futuro');
  insert into _crud_assertions values
    ('financeiro', 'delete_receber_restores_baseline', a_a_receber = b_a_receber, a_a_receber::text, b_a_receber::text);

  -- CREATE / UPDATE / DELETE em estoque_itens (critico)
  v_code := 'CRD-EST-' || substr(md5(random()::text), 1, 6);

  insert into public.estoque_itens (codigo, nome, categoria, quantidade, minimo, custo_unitario, fornecedor)
  values (v_code, 'CRUD KPI item', 'Outros', 1, 3, 10, 'Fornecedor KPI')
  returning id into v_item_id;

  select count(*) into a_critico from public.estoque_itens where quantidade < minimo;
  insert into _crud_assertions values
    ('estoque', 'create_item_critico', a_critico = b_critico + 1, a_critico::text, (b_critico + 1)::text);

  update public.estoque_itens set quantidade = 5 where id = v_item_id;
  select count(*) into a_critico from public.estoque_itens where quantidade < minimo;
  insert into _crud_assertions values
    ('estoque', 'update_item_nao_critico', a_critico = b_critico, a_critico::text, b_critico::text);

  delete from public.estoque_itens where id = v_item_id;
  select count(*) into a_critico from public.estoque_itens where quantidade < minimo;
  insert into _crud_assertions values
    ('estoque', 'delete_item_restores_baseline', a_critico = b_critico, a_critico::text, b_critico::text);
end $$;

select domain_name, step_name, passed, observed, expected
from _crud_assertions
order by domain_name, step_name;

rollback;
