# REIS FLOW

Sistema de gestão operacional para obras, clientes, orçamentos, financeiro, equipes, estoque e fornecedores.

## Valores do Produto (Equipe Interna)

Antes de iniciar qualquer funcionalidade, leia o manifesto da equipe:
- [docs/manifesto.md](docs/manifesto.md)

Este conteúdo orienta decisões de produto e implementação da equipe.
Não deve ser exibido para o usuário final por enquanto.

## Acesso online

- Produção (GitHub Pages): https://fernandor-reis.github.io/Projeto-REIS-FLOW/

## Estado atual

Aplicação web em HTML, CSS e JavaScript Vanilla com integração parcial ao Supabase.

Resumo do estágio atual:
- autenticação com Supabase (login, cadastro e recuperação de senha)
- acesso local de teste para Admin em localhost
- módulos de Obras, Orçamentos, Clientes e Financeiro com uso de Supabase
- módulos de Equipes, Estoque e Fornecedores em padrão Supabase-first com fallback controlado
- dashboard alimentado por camada centralizada de métricas (sem hardcode de KPI)
- políticas RLS por perfil e trilha mínima de auditoria para domínios críticos

## Módulos da aplicação

- Login e recuperação de senha
- Dashboard
- Obras (lista, kanban, detalhe, etapas e histórico)
- Orçamentos
- Clientes
- Financeiro
- Equipes
- Estoque
- Fornecedores
- Configurações

## Estrutura do projeto

- [index.html](index.html) - estrutura principal e views
- [assets/css/styles.css](assets/css/styles.css) - estilos globais e componentes visuais
- [assets/js/supabase-config.js](assets/js/supabase-config.js) - configuração do cliente Supabase
- [assets/js/theme.js](assets/js/theme.js) - tema e preferências visuais
- [assets/js/app-part1.js](assets/js/app-part1.js) - navegação, permissões, obras, clientes e orçamentos
- [assets/js/app-part2.js](assets/js/app-part2.js) - financeiro, equipes, estoque, fornecedores e dashboard operacional
- [assets/js/auth.js](assets/js/auth.js) - fluxos de autenticação
- [assets/js/crud.js](assets/js/crud.js) - operações CRUD com Supabase
- [assets/js/protection.js](assets/js/protection.js) - proteções de interface
- [supabase/schema.sql](supabase/schema.sql) - estrutura de banco
- [supabase/seed.sql](supabase/seed.sql) - dados iniciais

## Documentação

- [docs/manifesto.md](docs/manifesto.md) - valores do produto e princípios de construção da experiência

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - configuração do Supabase
- [docs/REIS_FLOW_CONTEXT.md](docs/REIS_FLOW_CONTEXT.md) - contexto técnico atualizado
- [docs/DASHBOARD_DATA_ROADMAP.md](docs/DASHBOARD_DATA_ROADMAP.md) - roadmap de precisão de dados do dashboard
- [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) - plano incremental para estabilização e integração definitiva
- [docs/KPI_DICTIONARY_V1.md](docs/KPI_DICTIONARY_V1.md) - baseline de fórmulas e estado dos KPIs
- [docs/PERSISTENCE_MATRIX.md](docs/PERSISTENCE_MATRIX.md) - matriz de persistência por módulo
- [docs/STATUS_CANONICAL.md](docs/STATUS_CANONICAL.md) - padrão inicial de status canônicos
- [docs/REGRESSION_CHECKLIST.md](docs/REGRESSION_CHECKLIST.md) - checklist de regressão por sprint
- [docs/KPI_TEST_SUITE.md](docs/KPI_TEST_SUITE.md) - suite mínima de validação de KPI
- [docs/RELEASE_SMOKE_TEST.md](docs/RELEASE_SMOKE_TEST.md) - roteiro de smoke test orientado a dados
- [docs/DATA_INCIDENT_PLAYBOOK.md](docs/DATA_INCIDENT_PLAYBOOK.md) - playbook de resposta a incidentes de dados

## Como executar localmente

Com Python instalado, execute na raiz do projeto:

```bash
python -m http.server 8000
```

Abra no navegador:

```text
http://localhost:8000/index.html
```

## Acesso local de teste

Para testar o fluxo de login localmente, você pode utilizar as credenciais de administrador:

- E-mail: admin@reisflow.com.br
- Senha: Admin

Essas credenciais são destinadas apenas para ambiente local de teste.

## Tecnologias

- HTML5
- CSS3
- JavaScript Vanilla
- Supabase (Auth + Postgres)
- Google Fonts
- Tabler Icons

## Próximos passos técnicos

- ampliar cobertura automatizada de testes de KPI
- evoluir smoke test para execução assistida em pipeline
- expandir observabilidade e auditoria de trilhas de dados
- avançar isolamento por tenant conforme modelo de expansão

## Status do projeto

MVP operacional com deploy ativo e integração de dados em evolução para fonte única de verdade.

## Licença

Uso privado, salvo definição posterior.
