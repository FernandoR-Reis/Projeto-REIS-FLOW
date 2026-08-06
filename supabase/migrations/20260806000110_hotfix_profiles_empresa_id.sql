-- =============================================================
-- REIS FLOW - Migration 20260806_010
-- Hotfix: repovoar empresa_id em profiles zerados pelo upsert
-- =============================================================

begin;

update public.profiles
set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

commit;
