# Plano de Execucao Incremental

Objetivo:
- transformar o REIS FLOW em uma base confiavel de dados para dashboard definitivo
- reduzir divida tecnica sem parar a evolucao funcional
- executar em ciclos curtos, com entregas validaveis

Principio:
- sem big-bang
- cada fase entrega valor real e reduz risco estrutural

---

## Fase 0 - Preparacao e baseline (Sprint 1)

Meta:
- congelar estado atual e criar rastreabilidade de mudancas

Tarefas:
- [x] consolidar dicionario inicial de KPIs atuais (origem + formula atual + lacunas)
- [x] mapear exatamente quais telas usam Supabase, localStorage e sessionStorage
- [x] definir padrao unico para status canonicos (financeiro, obras, estoque)
- [x] criar checklist de validacao manual por modulo

Entregaveis:
- documento de formulas base (v1)
- matriz de persistencia por modulo
- checklist de regressao
- padrao inicial de status canonicos

Criterio de pronto:
- nenhum KPI critico fica sem definicao formal de calculo

Status da fase:
- concluida em 2026-07-22

---

## Fase 1 - Modelo de dados minimo confiavel (Sprint 2)

Meta:
- fechar lacunas estruturais no banco

Tarefas:
- [x] criar tabela fornecedores no schema
- [x] adicionar relacao de estoque_itens para fornecedor_id (sem quebrar campo legado)
- [x] criar tabela estoque_movimentos (entrada, saida, ajuste, perda)
- [x] definir indices e constraints minimas para consultas de dashboard
- [x] publicar migration SQL versionada

Entregaveis:
- migracao SQL aplicada em homologacao
- schema atualizado no repositorio

Criterio de pronto:
- fornecedores e movimentos de estoque deixam de depender de campo texto solto

Status da fase:
- concluida em 2026-07-22

---

## Fase 2 - Migracao Supabase-first de modulos hibridos (Sprints 3 e 4)

Meta:
- eliminar persistencia principal em localStorage para operacao critica

Tarefas:
- [x] Fornecedores: CRUD completo em Supabase com fallback controlado
- [x] Estoque: operacoes passam a gerar movimento em estoque_movimentos
- [x] Estoque: saldo exibido calculado por eventos, nao por mutacao solta
- [x] Equipes: persistencia em Supabase (cadastro, edicao, status, alocacao)
- [x] remover dependencias locais que mascaram divergencia de dados

Entregaveis:
- modulos Fornecedores, Estoque e Equipes lendo/escrevendo no banco por padrao
- fallback local apenas para indisponibilidade temporaria

Criterio de pronto:
- apos reload completo, dados persistem via Supabase sem perda

Status da fase:
- concluida em 2026-07-22

---

## Fase 3 - Camada de metricas e dashboard confiavel (Sprints 5 e 6)

Meta:
- dashboard sem numeros hardcoded

Tarefas:
- [x] criar funcoes centralizadas de agregacao (getDashboardMetrics e derivadas)
- [x] remover calculo espalhado de KPI em multiplos pontos
- [x] substituir cards estaticos por payload dinamico consolidado
- [x] padronizar formatacao monetaria e regras de data
- [x] incluir metadados de auditoria basicos (contagem, periodo, atualizado em)

Entregaveis:
- dashboard 100% alimentado por camada unica de metricas
- documento de formulas oficial atualizado

Criterio de pronto:
- KPI exibido = KPI recalculado pelos dados de origem com tolerancia zero para contagem e 0,01 para moeda

---

## Fase 4 - Seguranca e governanca de dados (Sprint 7)

Meta:
- reduzir risco de acesso indevido e inconsistencias silenciosas

Tarefas:
- [x] revisar politicas RLS por tabela critica
- [x] alinhar permissoes de perfil com regras no banco
- [x] adicionar trilhas minimas de auditoria para alteracoes sensiveis
- [x] validar comportamento em cenarios de usuario sem permissao

Entregaveis:
- pacote de politicas revisado
- matriz de permissao UI x banco

Criterio de pronto:
- acao bloqueada no banco mesmo quando tentada fora da UI

Status da fase:
- concluida em 2026-07-22

---

## Fase 5 - Qualidade continua (Sprint 8)

Meta:
- evitar regressao nas proximas evolucoes

Tarefas:
- [x] criar suite minima de testes de KPI (unitario/integracao)
- [x] validar reflexo de criar/editar/excluir nos KPIs criticos
- [x] registrar roteiro de smoke test de release
- [x] publicar playbook de incidentes de dados

Entregaveis:
- pacote de testes recorrentes
- checklist de release orientado a dados
- playbook de resposta a incidentes de dados

Criterio de pronto:
- release nao sobe sem validacao automatizada de KPIs criticos

Status da fase:
- concluida em 2026-07-22

---

## Backlog tecnico priorizado (ordem de ataque)

1. Criar tabela fornecedores + estoque_movimentos.
2. Migrar Fornecedores para Supabase.
3. Migrar Estoque para modelo por movimentos.
4. Migrar Equipes para Supabase.
5. Centralizar camada de metricas.
6. Tornar dashboard totalmente dinamico.
7. Endurecer RLS por dominio.

---

## Execucao pratica no dia a dia

Ritmo sugerido:
- ciclo semanal com objetivo unico por sprint
- PRs pequenos e verificaveis
- sempre validar: fluxo feliz + fluxo de erro + reload da pagina

Regra de ouro:
- nao avancar para fase seguinte sem criterio de pronto da fase atual

---

## Indicadores de progresso do plano

- percentual de modulos em Supabase-first
- percentual de KPIs sem hardcode
- numero de regras de negocio duplicadas removidas
- numero de politicas RLS revisadas
- taxa de aprovacao do checklist de regressao

---

## Proximo passo recomendado (imediato)

Iniciar ciclo de manutencao continua com foco em:
1. executar suite KPI e smoke test antes de cada release
2. ampliar cobertura de testes para cenarios de permissao por perfil
3. evoluir automacao de validacao no pipeline

Isso sustenta a confiabilidade das proximas evolucoes sem regressao silenciosa.
