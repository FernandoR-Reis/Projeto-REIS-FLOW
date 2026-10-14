# Configuracao do banco no Supabase (passo a passo)

## 1) Criar o projeto no Supabase

1. Entre em `https://supabase.com`.
2. Clique em `Start your project` e faça login.
3. Clique em `New project`.
4. Escolha sua organizacao.
5. Em `Name`, use: `reis-flow-db`.
6. Em `Database Password`, crie uma senha forte e guarde.
7. Em `Region`, escolha a mais proxima do Brasil.
8. Clique em `Create new project`.

## 2) Criar as tabelas (estrutura)

1. No menu da esquerda, clique em `SQL Editor`.
2. Clique em `New query`.
3. Abra o arquivo `supabase/schema.sql` deste projeto.
4. Copie todo o conteudo e cole no editor do Supabase.
5. Clique em `Run`.

Resultado esperado: tabelas criadas com sucesso.

## 3) Aplicar todas as migrations (antes de publicar ou conectar o front-end)

1. Aplique, em ordem cronologica, todos os arquivos de `supabase/migrations/`.
2. Confirme que a ultima migration aplicada e a mais recente deste diretorio. A publicacao de permissoes e personalizacao do Dashboard tambem exige `20261010000113_user_module_permissions.sql`, `20261014000114_dashboard_preferences.sql`, `20261014000115_fix_dashboard_preferences_save.sql` e `20261014000116_fix_permission_role_lookup.sql`, nesta ordem.
3. Mantenha o aplicativo indisponivel ate a migration multi-tenant final concluir.

Para publicar no projeto Supabase ja vinculado ao CLI, confira primeiro
`supabase migration list --linked` e `supabase db push --linked --dry-run`.
Revise as migrations pendentes e entao aplique-as com
`supabase db push --linked`.

O `schema.sql` e somente a estrutura-base e bloqueia o acesso autenticado ate as
migrations de isolamento serem instaladas. Nao publique chaves nem libere login
entre a aplicacao do schema e a ultima migration.

**Nao execute `supabase/seed.sql` em producao.** Ele contem dados de exemplo e
operacoes destrutivas. Use-o somente em um banco local descartavel, com fixtures
sinteticas, depois de confirmar o conteudo do script.

## 4) Pegar as chaves para conectar no front-end

1. No menu da esquerda, clique em `Project Settings`.
2. Clique em `API`.
3. Copie estes dois valores:
   - `Project URL`
   - `anon public key`

Guarde esses dados, porque no proximo passo vamos conectar seu site com o banco.

## 5) Conferir se deu certo

1. No menu da esquerda, clique em `Table Editor`.
2. Abra as tabelas `clientes`, `obras` e `orcamentos`.
3. Contas novas devem iniciar sem registros de negocio. Registros preexistentes
   nao devem ser apagados nem reatribuidos automaticamente: contas antigas sem
   membership verificada recebem uma organizacao vazia, e os dados legados
   permanecem bloqueados ate recuperacao administrativa por fonte confiavel.
4. Valide a separacao com o roteiro inteiramente sintetico
   `supabase/tests/account_isolation.sql`, somente em banco local ou de teste.

Nao use registros de producao para reproduzir ou testar o isolamento.

## 5.1) Publicar a Edge Function de convite

1. Instale e autentique o Supabase CLI na sua maquina.
2. Defina as secrets da funcao com `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Publique a funcao com:

```bash
supabase functions deploy invite-user --use-api
```

Resultado esperado: o fluxo de convite passa a chamar a funcao e enviar o e-mail pelo Supabase.

Publique a funcao depois das migrations e antes de liberar o frontend que utiliza
o fluxo de convites/permissoes. Convites e bloqueios devem passar por
`invite-user`, que valida a associacao da equipe e exige administrador ativo no
mesmo tenant. Nao grave `empresa_id`, papel de autorizacao ou senha temporaria
diretamente pelo navegador.

## 6) Validar no dominio provisório

Depois da configuracao, valide tambem no ambiente publicado:

- https://fernandor-reis.github.io/Projeto-REIS-FLOW/

## 7) Template de recuperacao de senha (TASK-001)

O template HTML pronto para uso esta em:

- `supabase/templates/reset-password-email.html`

Como aplicar no painel do Supabase:

1. Acesse `Authentication`.
2. Abra `Email Templates`.
3. Entre em `Reset Password`.
4. Cole o conteudo do arquivo `supabase/templates/reset-password-email.html`.
5. Defina o assunto sugerido: `Redefina sua senha - Reis Flow`.
6. Salve as alteracoes.

Observacao importante:

- O botao do template de recovery usa `{{ .ConfirmationURL }}` (padrao oficial do Supabase).
- No front-end, o `redirectTo` do reset esta configurado para `index.html?recovery=1` como fallback.
