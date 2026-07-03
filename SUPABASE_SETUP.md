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

## 3) Inserir dados iniciais (seed)

1. Ainda no `SQL Editor`, clique em `New query`.
2. Abra o arquivo `supabase/seed.sql`.
3. Copie todo o conteudo e cole no editor.
4. Clique em `Run`.

Resultado esperado: clientes, obras e outros registros de exemplo inseridos.

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
3. Verifique se existem registros.

Se aparecer dados nessas tabelas, o banco foi criado com sucesso.

## 6) Validar no dominio provisório

Depois da configuracao, valide tambem no ambiente publicado:

- https://reisflow-provisorio.github.io/Projeto-REIS-FLOW/

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


