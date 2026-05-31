insert into public.clientes (nome, tipo_documento, documento, telefone, status)
values
  ('Construtora Horizonte', 'CNPJ', '12.345.678/0001-00', '(11) 3847-2000', 'ativo'),
  ('Grupo Inova Obras', 'CNPJ', '98.765.432/0001-11', '(11) 9847-3020', 'ativo'),
  ('TechFix Soluções', 'CNPJ', '11.222.333/0001-44', '(11) 9234-5678', 'ativo'),
  ('João Carlos Silva', 'CPF', '123.456.789-00', '(11) 99870-1234', 'ativo')
on conflict (documento) do nothing;

insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
select
  'OB-0031',
  'Reforma Comercial Horizonte',
  c.id,
  'Diego Santos',
  date '2025-06-28',
  148000,
  'andamento',
  'São Paulo, SP'
from public.clientes c
where c.documento = '12.345.678/0001-00'
on conflict (codigo) do nothing;

insert into public.obras (codigo, nome, cliente_id, responsavel_nome, prazo, valor, status, localizacao)
select
  'OB-0030',
  'Instalação Elétrica Inova',
  c.id,
  'Ana Moura',
  date '2025-06-15',
  87400,
  'atrasada',
  'Guarulhos, SP'
from public.clientes c
where c.documento = '98.765.432/0001-11'
on conflict (codigo) do nothing;

insert into public.orcamentos (codigo, cliente_id, descricao, valor, margem_percentual, validade, status)
select
  'ORC-2847',
  c.id,
  'Reforma Elétrica Completa',
  87200,
  32,
  date '2025-07-15',
  'pendente'
from public.clientes c
where c.documento = '12.345.678/0001-00'
on conflict (codigo) do nothing;

insert into public.orcamentos (codigo, cliente_id, descricao, valor, margem_percentual, validade, status)
select
  'ORC-2846',
  c.id,
  'Instalação Hidráulica Industrial',
  134500,
  28,
  date '2025-06-30',
  'aprovado'
from public.clientes c
where c.documento = '98.765.432/0001-11'
on conflict (codigo) do nothing;

insert into public.orcamento_itens (orcamento_id, descricao, quantidade, valor_unitario)
select o.id, 'Cabeamento elétrico 2,5mm — 200m', 200, 2.40
from public.orcamentos o
where o.codigo = 'ORC-2847'
and not exists (
  select 1 from public.orcamento_itens i
  where i.orcamento_id = o.id and i.descricao = 'Cabeamento elétrico 2,5mm — 200m'
);

insert into public.financeiro_receber (referencia, cliente_id, obra_id, descricao, valor, vencimento, status)
select
  'REC-1201',
  c.id,
  o.id,
  'Parcela 2 — Medição 1',
  59200,
  date '2025-06-10',
  'vencido'
from public.clientes c
join public.obras o on o.codigo = 'OB-0031'
where c.documento = '12.345.678/0001-00'
on conflict (referencia) do nothing;

insert into public.financeiro_pagar (referencia, fornecedor, categoria, valor, vencimento, status)
values
  ('PAG-0847', 'Hidrobom Materiais', 'Material', 18400, date '2025-06-13', 'vencido'),
  ('PAG-0846', 'Elétrica Premium Ltda', 'Material', 24800, date '2025-06-20', 'pendente')
on conflict (referencia) do nothing;

insert into public.equipe (nome, funcao, diaria, comissao_percentual, obra_id, status)
select
  'Diego Santos',
  'Mestre de Obras',
  320,
  3,
  o.id,
  'campo'
from public.obras o
where o.codigo = 'OB-0031'
and not exists (
  select 1 from public.equipe e where e.nome = 'Diego Santos'
);

insert into public.estoque_itens (codigo, nome, categoria, quantidade, minimo, custo_unitario, fornecedor)
values
  ('EST-001', 'Cabo PIAL 2,5mm', 'Elétrica', 480, 200, 2.40, 'Elétrica Premium'),
  ('EST-002', 'Disjuntor 20A', 'Elétrica', 18, 30, 28.00, 'Elétrica Premium')
on conflict (codigo) do nothing;