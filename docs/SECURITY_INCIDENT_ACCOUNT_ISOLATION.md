# Incidente: isolamento de contas

## Estado e limites da investigacao

O relato de que uma conta nova visualiza dados de outras contas foi tratado como
uma falha critica. A causa no codigo e nas migrations versionadas foi confirmada.
Uma verificacao autorizada e somente de leitura no dashboard de producao observou
contagens agregadas de registros existentes; nenhum nome, e-mail, documento,
valor financeiro ou conteudo de registro foi consultado ou copiado. Esses
registros nao foram usados como fixtures nem para reproduzir o incidente.

Nao houve acesso a logs de producao, auditoria operacional, configuracao de
service workers, buckets hospedados ou historico de requisicoes. Portanto, nao e
possivel confirmar o periodo, as contas, as tabelas ou os registros efetivamente
expostos, nem afirmar se houve leitura, alteracao ou exportacao real.

## Causas e superficies confirmadas no repositorio

1. `profiles` permitia que cada usuario atualizasse todas as colunas do proprio
   perfil. Como `app_empresa_id()` usava `profiles.empresa_id` e
   `app_user_role()` usava `profiles.cargo`, isso permitia alterar o escopo e o
   papel usados nas policies de negocio.
2. As migrations `20260806000109` e `20260806000110` associavam perfis sem
   empresa ao identificador fixo `00000000-0000-0000-0000-000000000001`.
   A migration historica tambem atribuia registros sem empresa a esse tenant
   compartilhado. A propriedade correta dos registros existentes nao e
   inferivel com seguranca apenas pelo repositorio.
3. `schema.sql` e o guia de setup permitiam acesso global por policies com
   `USING (true)`, e o guia indicava um caminho de instalacao que nao aplicava
   todas as migrations multi-tenant antes de conectar o front-end.
4. `audit_log` guardava snapshots completos das linhas e a policy de leitura
   dependia apenas do papel, sem tenant.
5. Os caches locais de dados usavam chaves sem escopo de usuario/empresa.
   Dados em memoria tambem podiam permanecer apos erro de carga. O historico de
   obra inseria eventos demonstrativos como fallback.
6. A Edge Function de convite usava `service_role`, mas nao verificava o tenant
   de quem chamava nem o tenant da equipe. O estado de bloqueio podia alterar
   somente o registro da interface, sem revogar o acesso da sessao.

## Escopo revisado

As tabelas de negocio contempladas pelas policies multi-tenant sao:
`clientes`, `obras`, `orcamentos`, `orcamento_itens`,
`financeiro_receber`, `financeiro_pagar`, `equipe`, `usuarios_sistema`,
`estoque_itens`, `fornecedores`, `estoque_movimentos`, `obra_etapas` e
`obra_historico`. A nova suite local tambem verifica a policy de
`audit_log`, consultas por identificador, busca, agregados, alteracao e exclusao.

As telas usam consultas diretas ao Supabase; nao foi encontrado um endpoint
separado de exportacao nem uso do Supabase Storage no codigo versionado.
Metadados/anexos de obra referenciados por `obra_historico` passam a depender da
mesma policy da tabela. Isso nao substitui a verificacao dos buckets e policies
que possam existir no projeto hospedado.

## Mitigacao e correcao no codigo

- A migration `20261009000112_account_isolation_hardening.sql` introduz
  `tenant_memberships` como autoridade do tenant e do papel, bloqueia o
  identificador historico compartilhado, remove escrita de `empresa_id`/`cargo`
  pelo cliente, cria o provisionamento de organizacao no banco e escopa a
  auditoria.
- Contas novas sem convite recebem uma organizacao propria por trigger no
  cadastro. Contas convidadas so recebem vinculo pela Edge Function depois de
  validar papel do solicitante, empresa da equipe e associacao preexistente.
  Reutilizacao de identificador de outra empresa e negada. Papel de admin ou
  gestor so pode ser concedido por admin.
- Contas antigas sem membership verificada recebem uma organizacao nova e
  isolada no primeiro acesso, exceto contas com convite pendente, que aguardam
  o fluxo privilegiado de convite. O `profiles.empresa_id` historico nao e usado
  para autorizar nem para recuperar ownership automaticamente; o valor antigo e
  preservado como evidencia, e os registros legados permanecem inacessiveis
  ate uma revisao administrativa confiavel.
- O bloqueio de membro desativa a membership no banco; nao depende de ocultar
  botoes ou atualizar apenas uma linha visual.
- A instalacao-base e as policies intermediarias falham fechadas ate a ultima
  migration. Caches legados sem escopo sao removidos; caches novos ficam
  particionados por usuario e empresa e sao apagados no logout/troca de conta.
  Dados principais em memoria sao esvaziados em troca de sessao ou falha de
  carga.
- O fallback de historico demonstrativo foi removido. Campos de empresa na
  configuracao nao exibem mais valores ficticios como se fossem dados da conta.
- Valores preexistentes de `senha_temporaria` nao sao selecionados pelo
  front-end e deixam de ser selecionaveis pelo papel `authenticated`; a coluna e
  mantida para evitar descarte destrutivo de dados sem plano de recuperacao.
- Nenhuma linha de negocio existente e apagada ou reatribuida pela nova
  migration. Na verificacao agregada de producao havia 11 clientes, 22
  orcamentos, 25 contas a receber, 4 contas a pagar, 9 itens de orcamento e 82
  eventos de auditoria, alem de uma empresa cadastrada e tres perfis, dois sem
  empresa vinculada. A afirmacao do responsavel de que nao ha clientes ativos nao
  foi usada para concluir que esses registros sao descartaveis: eles permanecem
  intocados. Auditorias antigas sem `empresa_id` tambem permanecem preservadas,
  mas invisiveis a contas ate revisao administrativa.

## Impacto potencial e recuperacao

Se as migrations 109/110 foram aplicadas, perfis sem empresa e linhas historicas
podem ter compartilhado o tenant fixo. Se o setup usou somente `schema.sql` ou
parou antes da migration de isolamento, as policies globais tambem podem ter
permitido leituras entre contas. Essas sao possibilidades tecnicas, nao uma
confirmacao de leitura por qualquer pessoa.

Depois da migration final, registros historicos sem ownership verificavel ficam
inacessiveis por design. Contas antigas sem convite podem criar sua propria
organizacao vazia no primeiro acesso; isso nao lhes concede acesso aos registros
do tenant anterior. Antes de recuperar esses registros, a equipe responsavel
deve verificar a propriedade por fontes confiaveis (convites, contratos e
auditoria externa) e criar memberships por um fluxo privilegiado controlado.
Nao usar `profiles.empresa_id` nem metadados enviados pelo browser como prova
de propriedade.

O periodo e a extensao de eventual exposicao so podem ser estimados pela equipe
com acesso aos logs de API, Auth, banco e auditoria do projeto hospedado. Esses
logs devem ser preservados e analisados sem exportar valores pessoais para este
repositorio. A migration nao habilita acesso a dados de empresas diferentes e
nao tenta corrigir ownership legado automaticamente.

## Validacao e rollout

- Testes automatizados de cache: `node --test tests/tenant-storage.test.js`.
- Teste SQL de duas empresas, fixtures inteiramente sinteticas e rollback:
  `supabase/tests/account_isolation.sql`. Deve ser executado em Supabase local
  ou banco de teste depois das migrations; nao executar contra producao.
- Em 2026-10-11, as migrations `20261008000111` e
  `20261009000112` foram aplicadas ao projeto Supabase de producao e a CLI
  confirmou ambas no historico remoto. A Edge Function `invite-user` foi
  publicada com validacao de membership e status ativo da empresa.
- Um probe somente de leitura, usando um UUID sintetico sem conta Auth
  correspondente, retornou tenant/papel nulos e zero clientes, obras e
  orcamentos visiveis. Nenhum registro real foi usado para teste.
- O ambiente de trabalho nao tinha Docker nem `psql`; a suite SQL de duas
  empresas continua pendente de execucao em banco local/de teste. Validar tambem
  as policies de Storage e exports configurados fora do repositorio.
- A verificacao agregada de producao encontrou registros preexistentes. Eles
  nao foram apagados, reatribuidos nem inspecionados individualmente; dados sem
  ownership verificado ficam inacessiveis ate recuperacao administrativa.
