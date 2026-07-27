# invite-user

Edge Function para convidar um usuario do sistema a partir de um colaborador ja cadastrado.

## Secrets necessarias

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Publicacao

Com o Supabase CLI instalado e autenticado:

```bash
supabase functions deploy invite-user
```

## Observacao

A funcao usa `auth.admin.inviteUserByEmail` e grava/atualiza a linha correspondente em `usuarios_sistema`.
