# Dicionario de KPIs v1

Objetivo:
- documentar formulas, fontes e limites dos KPIs do REIS FLOW
- separar valores confirmados de dados indisponiveis ou ainda sem fonte

Legenda:
- Status implementacao: dinamico | parcial | indisponivel
- Fonte atual indica a fonte esperada; a interface informa quando a sincronizacao nao foi confirmada

---

## Dashboard - Cards principais

1) Obras Ativas
- Status implementacao: dinamico
- Fonte atual: Supabase (`obras`)
- Formula: contagem de obras com status em (andamento, aprovada)

2) Obras Atrasadas
- Status implementacao: dinamico
- Fonte atual: Supabase (`obras`)
- Formula: contagem de obras com status = atrasada

3) Faturamento Mensal
- Status implementacao: parcial
- Fonte atual: Supabase (`financeiro_receber`)
- Formula: soma de recebimentos quitados com `paid_at` no mes selecionado, usando `America/Sao_Paulo`
- Limitacao: baixas anteriores a `paid_at` permanecem sem mes atribuivel; nao ha backfill presumido

4) Lucro Previsto
- Status implementacao: indisponivel
- Fonte atual: nenhuma
- Formula: nao exibida. O schema atual nao fornece custo previsto por obra; nao estimar lucro sem fonte

5) Orc. Pendentes
- Status implementacao: dinamico
- Fonte atual: Supabase (`orcamentos`)
- Formula: contagem e soma dos orcamentos em status = pendente; orcamentos enviados ao cliente usam status `cliente_pendente`

6) Equipes em Campo
- Status implementacao: parcial
- Fonte atual: Supabase (`equipe`) com cache local identificado
- Formula atual: count(status == campo)

7) Contas Vencendo
- Status implementacao: dinamico
- Fonte atual: Supabase (`financeiro_receber` + `financeiro_pagar`)
- Formula: soma de titulos abertos com vencimento de hoje ate hoje + 7 dias, inclusive; vencidos e quitados sao excluidos

8) A Receber
- Status implementacao: dinamico
- Fonte atual: Supabase (`financeiro_receber`)
- Formula: soma de recebiveis em aberto, incluindo vencidos e futuros

9) Estoque Critico
- Status implementacao: parcial
- Fonte atual: Supabase (`estoque_itens` + `estoque_movimentos`) com cache local identificado
- Formula atual: count(qtd < min)

---

## Dashboard - Demais blocos

10) Grafico de faturamento mensal
- Status implementacao: dinamico
- Fonte atual: agregacao de `financeiro_receber.paid_at`
- Formula: soma de recebimentos quitados por mes nos seis meses terminados no mes selecionado

11) Status das obras (percentuais)
- Status implementacao: dinamico
- Fonte atual: Supabase (`obras`)
- Formula: contagem por status dividida pelo total de obras sincronizadas

12) Clientes recentes / ultimas obras / tarefas pendentes
- Status implementacao: parcial
- Fonte atual: Supabase (`clientes`, `obras`)
- Formula: ultimos registros na ordem recebida da consulta; tarefas nao possuem fonte integrada e nao sao apresentadas como dado confirmado

---

## Financeiro (cards do modulo)

13) Total a Receber
- Status implementacao: dinamico
- Fonte atual: js + dados carregados de Supabase (financeiro_receber)

14) Total a Pagar
- Status implementacao: dinamico
- Fonte atual: js + dados carregados de Supabase (financeiro_pagar)

15) Saldo Previsto
- Status implementacao: dinamico
- Fonte atual: js (receber - pagar)

16) Faturado no Mes
- Status implementacao: dinamico
- Fonte atual: js sobre registros quitados

---

## Limitacoes e rollout

- aplicar a migracao `20261008000111_metric_inputs.sql` em ambiente seguro antes de usar os novos campos `desconto`, `deslocamento` e `paid_at`
- registros antigos sem os novos campos permanecem sem valor confirmado; edicao exige confirmacao explicita de desconto e deslocamento
- custo previsto de obra, lucro previsto e tarefas permanecem indisponiveis ate existir fonte confiavel
- registros especificos do relatorio de QA nao puderam ser correlacionados com fixtures sanitizadas; as regras genericas estao cobertas por testes locais
- nenhuma migracao foi aplicada e nenhuma alteracao foi gravada em producao durante a correcao
