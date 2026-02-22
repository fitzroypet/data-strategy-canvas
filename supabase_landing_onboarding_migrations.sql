-- Landing-first onboarding schema updates
-- Run after supabase_migrations.sql and supabase_import_migrations.sql

alter table public.workspaces
  add column if not exists onboarding_status text not null default 'pending',
  add column if not exists onboarding_version text null,
  add column if not exists onboarding_completed_at timestamptz null,
  add column if not exists onboarding_skipped_at timestamptz null,
  add column if not exists intake_prompt text null,
  add column if not exists intake_context jsonb null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workspaces_onboarding_status_check'
  ) then
    alter table public.workspaces
      add constraint workspaces_onboarding_status_check
      check (onboarding_status in ('pending', 'completed', 'skipped'));
  end if;
end $$;

create index if not exists workspaces_onboarding_status_idx
  on public.workspaces (user_id, onboarding_status);

alter table public.workspace_documents
  add column if not exists source text not null default 'import';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workspace_documents_source_check'
  ) then
    alter table public.workspace_documents
      add constraint workspace_documents_source_check
      check (source in ('import', 'landing_intake'));
  end if;
end $$;

create index if not exists workspace_documents_source_idx
  on public.workspace_documents (workspace_id, source);
