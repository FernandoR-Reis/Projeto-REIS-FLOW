# Roadmap de Precisao de Dados para o Dashboard

Objetivo: garantir que os indicadores do Dashboard representem exatamente o estado real dos modulos (Estoque, Financeiro, Clientes, Orcamentos, Obras, Equipes e Fornecedores), com regras unicas de calculo, rastreabilidade e validacao continua.

## Etapa 1 - Contrato de dados unico (fonte da verdade)
- Definir para cada KPI:
  - tabela(s) origem;
  - filtro de status;
  - recorte de tempo;
  - regra de agregacao;
  - regra de arredondamento.
- Publicar um dicionario de metricas com nome tecnico e nome de exibicao.
- Remover calculos duplicados em varios arquivos JS e concentrar em funcoes unicas.

Saida esperada:
- lista fechada de KPIs do dashboard com formula oficial.

## Etapa 2 - Normalizacao de eventos por modulo
- Estoque:
  - entrada, saida, ajuste, perda;
  - saldo por item = entradas - saidas + ajustes - perdas.
- Financeiro:
  - status canonicamente definidos (pendente, vencido, futuro, recebido/pago);
  - data de evento (baixa) separada de data de vencimento.
- Orcamentos:
  - pipeline por status (pendente, aprovado, reprovado, expirado);
  - valor contratado so apos aprovacao.
- Clientes/Obras:
  - vinculos obrigatorios por UUID;
  - status coerente com eventos de obra.

Saida esperada:
- estrutura de eventos consistente para todos os modulos.

## Etapa 3 - Camada de metricas (servico interno)
- Criar funcoes centralizadas de leitura e agregacao:
  - `getDashboardMetrics()`
  - `getFinanceMetrics()`
  - `getStockMetrics()`
  - `getClientMetrics()`
  - `getBudgetMetrics()`
- Cada funcao retorna payload padronizado com:
  - `value` (numero bruto),
  - `formatted` (texto para UI),
  - `sourceCount` (quantidade de registros usados),
  - `updatedAt` (timestamp da consolidacao).

Saida esperada:
- dashboard consome apenas payload consolidado, sem recalculo espalhado.

## Etapa 4 - Regras de precisao e conciliacao
- Regras de dinheiro:
  - armazenar em decimal no banco;
  - converter para numero apenas na camada de metricas;
  - formatar moeda so na camada de exibicao.
- Regras de data:
  - padrao ISO para persistencia;
  - timezone unico para comparacoes (America/Sao_Paulo).
- Reconciliacao automatica:
  - check diario: soma de detalhes = KPI exibido;
  - alerta quando divergencia ultrapassar tolerancia (ex.: 0,01 em moeda).

Saida esperada:
- divergencias detectadas cedo, antes de impactar decisao no painel.

## Etapa 5 - Testes de confianca de KPI
- Testes unitarios de formula por KPI.
- Testes de integracao por modulo:
  - criar/editar/excluir registro e validar reflexo no KPI.
- Testes de regressao de cenarios criticos:
  - baixa de financeiro alterando saldo previsto;
  - entrada/saida estoque alterando itens abaixo do minimo;
  - aprovacao de orcamento alterando carteira contratada.

Saida esperada:
- cada release valida exatidao dos numeros-chave.

## Etapa 6 - Observabilidade e auditoria
- Registrar "como o KPI foi calculado":
  - periodo,
  - filtros,
  - total de registros,
  - hash simples da consolidacao.
- Tela de auditoria (futura):
  - usuario clica no KPI e ve composicao.

Saida esperada:
- transparencia total dos numeros para operacao e gestao.

## Etapa 7 - Rollout gradual por dominio
1. Financeiro (maior impacto decisorio).
2. Estoque (operacao diaria e risco de ruptura).
3. Orcamentos (pipeline comercial).
4. Clientes e Obras (contexto e consolidacao final).

Saida esperada:
- evolucao segura, sem quebrar o que ja esta estavel.

## Sequencia pratica recomendada (proximas sprints)
1. Congelar formulas atuais do Dashboard em documento tecnico.
2. Refatorar Financeiro para camada unica de metricas.
3. Refatorar Estoque com eventos de entrada/saida e KPI de minimo.
4. Integrar Orcamentos ao dashboard consolidado.
5. Integrar Clientes/Obras e ligar tudo na mesma camada.
6. Ativar suite de testes de KPI no fluxo de release.

## Criterios de pronto (Definition of Done)
- KPI com formula oficial documentada.
- KPI coberto por teste automatizado.
- KPI rastreavel (origem e contagem de registros).
- KPI sem divergencia em reconciliacao de homologacao.
