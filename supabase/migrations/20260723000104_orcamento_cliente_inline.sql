alter table public.clientes
  alter column tipo_documento drop not null,
  alter column documento drop not null;

alter table public.clientes
  add column if not exists endereco text,
  add column if not exists observacoes text;

alter table public.orcamentos
  alter column cliente_id drop not null,
  add column if not exists cliente_nome_avulso text;

alter table public.orcamentos
  drop constraint if exists orcamentos_status_check;

alter table public.orcamentos
  add constraint orcamentos_status_check
  check (status in ('pendente', 'cliente_pendente', 'dados_incompletos', 'aprovado', 'reprovado', 'expirado'));
