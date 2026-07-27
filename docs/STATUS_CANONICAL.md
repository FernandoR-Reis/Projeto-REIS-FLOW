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
- aprovado
- reprovado
- expirado

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
