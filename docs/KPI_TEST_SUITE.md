# Suite minima de testes de KPI (Fase 5)

Objetivo:
- validar formulas criticas de KPI com execucao recorrente
- detectar regressao de dados antes de release

Escopo desta suite:
- unitario/integracao SQL para formulas
- validacao CRUD -> reflexo em KPIs criticos
- execucao manual no SQL Editor (sem dependencias extras)

## Arquivos

- supabase/tests/kpi_suite.sql
- supabase/tests/kpi_crud_reflex.sql

## Como executar

1. Abrir SQL Editor do Supabase no banco de producao/homologacao.
2. Executar primeiro supabase/tests/kpi_suite.sql.
3. Verificar coluna passed = true para todos os testes.
4. Executar depois supabase/tests/kpi_crud_reflex.sql.
5. Verificar coluna passed = true para todos os passos.

Observacao importante:
- ambos scripts usam BEGIN/ROLLBACK
- nenhum dado de teste e persistido apos execucao

## KPIs cobertos

- obras_ativas
- obras_atrasadas
- orc_pendentes_count
- orc_pendentes_valor
- equipes_campo
- estoque_critico
- a_receber_aberto
- contas_vencendo_7d

## Criterio de aprovacao

- 100% das linhas com passed = true nos dois scripts
- nenhuma linha de erro SQL durante execucao

## Frequencia recomendada

- obrigatorio antes de cada release
- obrigatorio apos alteracao em:
  - regras de status
  - formulas do dashboard
  - migrations de financeiro, obras, estoque, equipes, orcamentos
