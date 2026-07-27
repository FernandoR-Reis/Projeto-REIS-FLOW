# Matriz de Persistencia por Modulo

Objetivo:
- explicitar a fonte atual de dados por modulo
- deixar claro o que ja esta em Supabase e o que ainda esta hibrido

---

## Visao geral

- Supabase-first: Obras, Orcamentos, Clientes, Financeiro, Auth
- Hibrido/local: Equipes, Estoque, Fornecedores, partes de historico de obra
- Session/local UI state: filtros e contexto de usuario

---

## Modulo a modulo

### Auth
- Fonte principal: Supabase Auth
- Apoio local/session:
  - sessionStorage: perfil/nome de usuario e flag admin local

### Obras
- Fonte principal: Supabase (tabela obras)
- Apoio hibrido:
  - etapas/historico com sync parcial para obra_etapas/obra_historico
  - fallback localStorage quando sync falha

### Orcamentos
- Fonte principal: Supabase (orcamentos + orcamento_itens)
- Estado em memoria para renderizacao

### Clientes
- Fonte principal: Supabase (clientes)
- Apoio localStorage:
  - mapa auxiliar de e-mail por documento (workaround legado)

### Financeiro
- Fonte principal: Supabase (financeiro_receber, financeiro_pagar)
- Estado em memoria para tabelas/filtros

### Equipes
- Fonte principal atual: localStorage + memoria (equipeData)
- Supabase: ainda nao e fonte principal

### Estoque
- Fonte principal atual: localStorage + memoria (estoqueData)
- Supabase: insert em estoque_itens existe em alguns fluxos, mas modulo segue hibrido

### Fornecedores
- Fonte principal atual: localStorage + memoria (fornecedoresData)
- Supabase: ainda sem tabela/CRUD principal

### Dashboard
- Fonte atual: mista
  - cards estaticos hardcoded em html
  - cards operacionais de equipes/estoque dinamicos via arrays locais
  - parte financeira dinamica no modulo Financeiro

---

## Session e UI state

- sessionStorage:
  - filtros de Financeiro, Equipes, Estoque, Fornecedores
  - role e user_name em sessao
- localStorage:
  - tema da UI
  - caches operacionais de Equipes/Estoque/Fornecedores
  - fallback de historico/etapas

---

## Prioridade de migracao

1. Fornecedores -> Supabase-first
2. Estoque -> movimentos em banco + saldo derivado
3. Equipes -> Supabase-first
4. Dashboard -> camada unica de metricas baseada no banco
