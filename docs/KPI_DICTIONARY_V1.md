# Dicionario de KPIs v1 (baseline)

Objetivo:
- congelar as formulas atuais do dashboard para evitar ambiguidade durante a migracao
- separar KPI estatico, KPI dinamico e KPI em transicao

Legenda:
- Status implementacao: estatico | dinamico | transicao
- Fonte atual: html fixo | js (array em memoria) | supabase

---

## Dashboard - Cards principais

1) Obras Ativas
- Status implementacao: estatico
- Valor atual exibido: 18
- Fonte atual: html fixo
- Formula alvo: contagem de obras com status em (andamento, aprovada)

2) Obras Atrasadas
- Status implementacao: estatico
- Valor atual exibido: 4
- Fonte atual: html fixo
- Formula alvo: contagem de obras com status = atrasada

3) Faturamento Mensal
- Status implementacao: estatico
- Valor atual exibido: R$287k
- Fonte atual: html fixo
- Formula alvo: soma de recebimentos quitados no mes

4) Lucro Previsto
- Status implementacao: estatico
- Valor atual exibido: R$94k
- Fonte atual: html fixo
- Formula alvo: receitas previstas - custos previstos

5) Orc. Pendentes
- Status implementacao: estatico
- Valor atual exibido: 9
- Fonte atual: html fixo
- Formula alvo: contagem de orcamentos com status = pendente

6) Equipes em Campo
- Status implementacao: dinamico
- Fonte atual: js (equipeData em memoria/localStorage)
- Formula atual: count(status == campo)
- Observacao: ainda nao Supabase-first

7) Contas Vencendo
- Status implementacao: estatico
- Valor atual exibido: R$43k
- Fonte atual: html fixo
- Formula alvo: soma de titulos com vencimento em ate 7 dias e nao quitados

8) A Receber
- Status implementacao: estatico
- Valor atual exibido: R$168k
- Fonte atual: html fixo
- Formula alvo: soma de financeiro_receber com status aberto

9) Estoque Critico
- Status implementacao: dinamico
- Fonte atual: js (estoqueData em memoria/localStorage)
- Formula atual: count(qtd < min)
- Observacao: ainda sem trilha de movimentos no banco

---

## Dashboard - Demais blocos

10) Grafico de faturamento mensal
- Status implementacao: estatico
- Fonte atual: buildDashChart com serie fixa
- Formula alvo: agregacao mensal real do financeiro

11) Status das obras (percentuais)
- Status implementacao: estatico
- Fonte atual: html fixo
- Formula alvo: distribuicao real por status em obras

12) Clientes recentes / ultimas obras / tarefas pendentes
- Status implementacao: estatico
- Fonte atual: html fixo
- Formula alvo: listas reais por created_at / updated_at

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

## Lacunas criticas para v2

- padronizar formula oficial de cada KPI em funcao unica de metricas
- remover hardcode de cards e graficos no dashboard
- migrar KPIs de Equipes/Estoque para fonte Supabase-first
- incluir metadados de auditoria por KPI: periodo, contagem, atualizado_em
