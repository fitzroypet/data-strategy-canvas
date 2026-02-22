-- Workspace documents v2
-- Extends source values to include chat-generated drafts.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_documents_source_check'
  ) then
    alter table public.workspace_documents
      drop constraint workspace_documents_source_check;
  end if;
end $$;

alter table public.workspace_documents
  add constraint workspace_documents_source_check
  check (source in ('import', 'landing_intake', 'chat_draft'));

create index if not exists workspace_documents_ai_context_idx
  on public.workspace_documents (workspace_id, status, expires_at, created_at desc);
