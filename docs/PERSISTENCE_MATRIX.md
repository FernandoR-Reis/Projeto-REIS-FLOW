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
- A organizacao e o papel administrativo confiavel vem de `tenant_memberships`; cargo, nome e e-mail do perfil nao concedem privilegios

### Usuarios e permissoes
- Fonte oficial: `tenant_memberships` + `user_module_permissions` no Supabase
- Migration: `20261010000113_user_module_permissions.sql`
- Administradores da organizacao sao identificados somente pela membership ativa com `role = 'admin'`; essa autoridade nao pode ser concedida pela matriz de permissoes nem alterada pelo fluxo comum de convites
- Permissoes por modulo e acao sao retornadas e alteradas por RPCs que verificam a empresa e o papel do solicitante; o editor fica em Equipes > Permissoes
- Policies RLS restritivas aplicam leitura, criacao, edicao e exclusao nas tabelas operacionais, mesmo quando policies permissivas legadas tambem existem
- Um usuario precisa de `view` no modulo para receber permissoes de escrita nesse modulo; gerenciamento de usuarios permanece exclusivo do administrador
- Templates de transicao: `gestor` recebe o modelo Gerente; `financeiro`, Financeiro; `tecnico`, Tecnico; `visualizador`, Visualizador; demais papeis nao administrativos, Operacional
- Dashboard e Financeiro nao sao incluidos automaticamente nos templates. Financeiro os recebe apenas pelo template Financeiro; o administrador mantem acesso implicito
- Mudancas de permissao sao auditadas e conferidas por versao antes de salvar; a sessao atualiza grants a cada 30 segundos e a RLS bloqueia operacoes imediatamente
- Financeiro usa RPCs com escopo para carregar lancamentos e nomes/identificadores minimos de clientes e obras vinculados; isso evita conceder leitura geral dessas tabelas ao modulo Financeiro
- A migration preserva grants ja existentes (se houver) e provisiona templates somente para memberships sem registro de permissao. Administradores existentes nao sao inferidos por nome ou e-mail

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

### Cadastros auxiliares
- Fonte oficial atual: `reisflow_system_config` no armazenamento isolado por usuario/empresa (`ReisFlowTenantStorage`)
- Conteudo: categorias de fornecedores, estoque e lancamentos; areas (chaves usadas por equipe) e funcoes por area
- Categorias de fornecedores sao persistidas nos registros pelo identificador derivado do nome; categorias de estoque e lancamentos usam o nome apresentado
- As listas sao atualizadas nos formularios a partir desta configuracao; nao existe tabela Supabase independente para elas
- A inclusao/edicao/exclusao salva imediatamente na mesma fonte; falhas de persistencia nao atualizam a opcao exibida
- Itens referenciados por registros existentes nao podem ser renomeados ou excluidos; funcoes e areas preservam a chave de vinculacao da equipe
- Alteracao de estrutura: nenhuma migracao ou mudanca de schema. Configuracoes antigas sem nomes de areas continuam carregadas por compatibilidade

### Dashboard
- Fonte atual: mista
  - cards estaticos hardcoded em html
  - cards operacionais de equipes/estoque dinamicos via arrays locais
  - parte financeira dinamica no modulo Financeiro
- Consultas financeiras e indicadores correspondentes sao carregados/exibidos apenas com permissao de visualizacao Financeiro
- Preferencias de exibicao individuais ficam em `user_dashboard_preferences`, com escopo simultaneo de usuario e empresa; a migration `20261014000114_dashboard_preferences.sql` fornece leitura e gravacao por RPC e controle otimista de concorrencia
- As preferencias controlam apenas a visibilidade dos nove cards e cinco secoes existentes (graficos, listas e tabela); a aplicacao filtra cada opcao pelas permissoes atuais e nao concede acesso a modulos
- A ausencia de preferencias aplica o layout padrao atual sem gravar automaticamente. Se a leitura falhar, mantem-se a visualizacao padrao e o salvamento fica bloqueado ate uma nova tentativa; o modo de demonstracao usa o cache local ja isolado por sessao
- Em 2026-10-14, as migrations 113 a 116 foram aplicadas ao Supabase de producao; os hotfixes 115 e 116 corrigem validacoes do lint PostgreSQL. A Edge Function `invite-user` foi publicada.

## Limites de enforcement atual

- Equipes, Estoque, Fornecedores e Cadastros Auxiliares continuam com partes em memoria/armazenamento local, conforme a matriz acima. A navegacao e as acoes da interface respeitam permissoes, mas a persistencia local desses dados ainda nao possui uma policy RLS de servidor; migrar esses registros para tabelas tenant-scoped sera necessario para enforcement remoto integral desses modulos.
- As migrations `20261010000113_user_module_permissions.sql` a `20261014000116_fix_permission_role_lookup.sql` foram aplicadas ao Supabase de producao em 2026-10-14, antes do deploy do frontend. Os hotfixes 115 e 116 corrigem os problemas identificados pelo lint remoto. A Edge Function `invite-user` tambem foi publicada.

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
