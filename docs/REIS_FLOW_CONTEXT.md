# REIS FLOW - CONTEXTO TECNICO ATUALIZADO

## 1. Visao geral

O REIS FLOW e uma aplicacao de gestao operacional para obras, clientes, orcamentos, financeiro, equipes, estoque e fornecedores.

Objetivo de produto:
- centralizar operacao em um unico painel
- suportar crescimento para modelo SaaS multi-tenant
- manter rastreabilidade de dados e auditoria operacional

---

## 2. Estado atual (julho/2026)

Status:
- MVP operacional com deploy ativo
- integracao parcial com Supabase
- persistencia ainda hibrida entre banco e armazenamento local

Ambientes:
- Producao: https://fernandor-reis.github.io/Projeto-REIS-FLOW/
- Local: http://localhost:8000/index.html

---

## 3. Arquitetura atual

Frontend:
- HTML5, CSS3, JavaScript Vanilla
- sem framework SPA

Backend/BaaS:
- Supabase Auth
- Supabase Postgres
- RLS configurado no schema atual

Persistencia de dados (atual):
- Supabase-first: Obras, Orcamentos, Clientes, Financeiro, Autenticacao
- Local/hibrido: Equipes, Estoque, Fornecedores, parte de historicos e filtros de UI

Risco principal atual:
- ainda nao existe fonte unica de verdade para todos os KPIs do dashboard

---

## 4. Estrutura de arquivos

Arquivos principais:
- index.html: views, modais, dashboard, navegacao
- assets/css/styles.css: layout, responsividade, tema
- assets/js/supabase-config.js: client Supabase
- assets/js/theme.js: controle de tema
- assets/js/app-part1.js: navegacao, permissoes, obras, clientes, orcamentos
- assets/js/app-part2.js: financeiro, equipes, estoque, fornecedores, KPIs operacionais
- assets/js/auth.js: fluxos de login/cadastro/reset/OAuth
- assets/js/crud.js: operacoes CRUD com Supabase e validacoes
- assets/js/protection.js: bloqueios de interface
- supabase/schema.sql: estrutura de banco
- supabase/seed.sql: seed de dados

---

## 5. Modulos e maturidade

Login e autenticacao:
- autenticacao real com Supabase
- recuperacao de senha funcional
- suporte a OAuth

Dashboard:
- parte dos cards ainda estatica
- cards operacionais de Equipes/Estoque com atualizacao dinamica
- grafico principal ainda com dados fixos

Obras:
- listagem, kanban e detalhe
- etapas/historico com fallback local e sincronizacao parcial

Orcamentos:
- CRUD principal funcional
- calculos e preview no front

Clientes:
- CRUD funcional
- ainda existe workaround de e-mail em armazenamento local

Financeiro:
- contas a receber/pagar e fluxo de caixa
- regra de status calculada no front

Equipes:
- gestao funcional no front
- persistencia local

Estoque:
- gestao funcional no front
- persistencia hibrida e sem trilha completa de movimentos

Fornecedores:
- modulo novo com cadastro/listagem/filtros
- persistencia local
- integrado por sugestao aos formularios de estoque

---

## 6. Controle de acesso

Modelo atual:
- RBAC de interface no front (ROLE_ACCESS em app-part1.js)
- exibicao/ocultacao de views e modais por perfil

Limite atual:
- seguranca de dados ainda precisa ser reforcada no nivel SQL/RLS para isolar escopo e reduzir exposicao ampla para usuarios autenticados

---

## 7. Divida tecnica prioritaria

1. Unificar persistencia de Equipes, Estoque e Fornecedores em Supabase.
2. Criar modelo relacional de fornecedores e movimentos de estoque.
3. Centralizar camada de metricas para dashboard (formula unica por KPI).
4. Eliminar leituras estaticas hardcoded de indicadores.
5. Fortalecer RLS para perfis e, na evolucao SaaS, por tenant.

---

## 8. Estrategia de evolucao

Diretriz geral:
- evolucao incremental por dominios, sem big-bang
- primeiro confiabilidade de dados, depois expansao funcional

Sequencia recomendada:
1. Modelo de dados (fornecedores + estoque_movimentos + vinculos)
2. Migracao Supabase-first de Fornecedores/Estoque/Equipes
3. Camada unica de metricas
4. Dashboard 100% dinamico
5. Endurecimento de seguranca e observabilidade

Documento de execucao:
- ver docs/EXECUTION_PLAN.md

---

## 9. Regras de desenvolvimento

Sempre:
- preservar funcionamento dos modulos existentes
- evitar reescrita ampla sem necessidade
- reduzir duplicacao de regra de negocio
- validar em localhost apos mudancas relevantes
- versionar alteracoes de script no index.html quando necessario para evitar cache enganoso

---

## 10. Referencias

- README.md
- SUPABASE_SETUP.md
- docs/DASHBOARD_DATA_ROADMAP.md
- docs/EXECUTION_PLAN.md
- docs/KPI_DICTIONARY_V1.md
- docs/PERSISTENCE_MATRIX.md
- docs/STATUS_CANONICAL.md
- docs/REGRESSION_CHECKLIST.md
