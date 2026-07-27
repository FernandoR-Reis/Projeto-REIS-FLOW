-- =============================================================
-- REIS FLOW - Migration 20260726_005
-- Objetivo:
-- 1) Criar a base de usuarios do sistema separada de equipe
-- 2) Permitir leitura por usuarios autenticados
-- 3) Restringir escrita a admin/gestor
-- =============================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid references public.equipe (id) on delete set null,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  email text not null unique,
  perfil text not null default 'Visualizador',
  status text not null default 'convite_pendente' check (status in ('ativo', 'bloqueado', 'convite_pendente')),
  senha_temporaria text,
  ultimo_acesso timestamptz,
  empresa text not null default 'REIS FLOW',
  convites_enviados integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_usuarios_sistema_equipe_id on public.usuarios_sistema (equipe_id);
create index if not exists idx_usuarios_sistema_email_ci on public.usuarios_sistema (lower(trim(email)));
create index if not exists idx_usuarios_sistema_perfil on public.usuarios_sistema (perfil);
create index if not exists idx_usuarios_sistema_status on public.usuarios_sistema (status);

alter table public.usuarios_sistema enable row level security;

drop policy if exists usuarios_sistema_select_authenticated on public.usuarios_sistema;
drop policy if exists usuarios_sistema_write_by_role on public.usuarios_sistema;

create policy usuarios_sistema_select_authenticated
on public.usuarios_sistema
for select to authenticated
using (true);

create policy usuarios_sistema_write_by_role
on public.usuarios_sistema
for all to authenticated
using (public.app_has_role(array['admin','gestor']::text[]))
with check (public.app_has_role(array['admin','gestor']::text[]));

commit;
