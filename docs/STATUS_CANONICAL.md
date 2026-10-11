# Status Canonicos (baseline)

Objetivo:
- padronizar nomenclatura de status para reduzir regras duplicadas
- servir de referencia para SQL, UI e camada de metricas

---

## Obras

Valores canonicos:
- orcamento
- aprovada
- andamento
- pausada
- atrasada
- concluida

Observacao:
- manter sem acento para armazenamento e comparacao

---

## Orcamentos

Valores canonicos:
- pendente
- cliente_pendente
- aprovado
- reprovado
- dados_incompletos

Estado derivado (nao persistido):
- expirado: status `cliente_pendente` cuja validade terminou antes de hoje

`pendente` representa um orcamento ainda nao enviado. Apenas `cliente_pendente` expira; aprovados, reprovados e `dados_incompletos` preservam o status.

---

## Clientes

Valores canonicos:
- ativo
- inativo

---

## Financeiro

A receber:
- pendente
- vencido
- futuro
- recebido

A pagar:
- pendente
- vencido
- futuro
- pago

Regra de interpretacao KPI:
- status quitado = recebido/pago
- status aberto = pendente/vencido/futuro
- situacao temporal e estado de pagamento sao conceitos separados na interface
- vencimento: vencido antes de hoje, vence hoje na data corrente, a vencer depois de hoje
- vencimento em ate 7 dias: hoje ate hoje + 7 dias, inclusive; exclui vencidos e quitados
- faturamento mensal usa `paid_at` no fuso `America/Sao_Paulo`, nao a data de criacao nem o vencimento
- registros antigos sem `paid_at` nao sao atribuidos a um mes sem evidencia

---

## Equipes

Valores canonicos:
- campo
- disponivel
- afastado
- inativo

---

## Fornecedores

Valores canonicos:
- ativo
- inativo

---

## Estoque

Status derivado (nao armazenado como coluna principal):
- critico: quantidade < minimo
- atencao: quantidade >= minimo e quantidade < minimo * 1.4
- normal: quantidade >= minimo * 1.4

Tipos canonicos de movimento (evento):
- entrada
- saida
- ajuste
- perda
