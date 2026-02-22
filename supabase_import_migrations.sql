-- Phase 1 import schema for strategy document migration
-- Run after base supabase_migrations.sql

create table if not exists public.workspace_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes int not null,
  status text not null check (status in ('uploaded', 'processed', 'expired', 'failed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists workspace_documents_workspace_idx
  on public.workspace_documents(workspace_id);
create index if not exists workspace_documents_expiry_idx
  on public.workspace_documents(expires_at);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid not null references public.workspace_documents(id) on delete cascade,
  model text not null,
  status text not null check (status in ('parsed', 'previewed', 'applied', 'failed')),
  mapping_json jsonb not null,
  applied_fields_count int not null default 0,
  skipped_fields_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists import_runs_workspace_idx
  on public.import_runs(workspace_id);
create index if not exists import_runs_created_idx
  on public.import_runs(created_at desc);

alter table public.workspace_documents enable row level security;
alter table public.import_runs enable row level security;

create policy "workspace_documents_select_own"
  on public.workspace_documents
  for select
  using (auth.uid() = user_id);

create policy "workspace_documents_insert_own"
  on public.workspace_documents
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_documents.workspace_id
        and w.user_id = auth.uid()
    )
  );

create policy "workspace_documents_update_own"
  on public.workspace_documents
  for update
  using (auth.uid() = user_id);

create policy "workspace_documents_delete_own"
  on public.workspace_documents
  for delete
  using (auth.uid() = user_id);

create policy "import_runs_select_own"
  on public.import_runs
  for select
  using (auth.uid() = user_id);

create policy "import_runs_insert_own"
  on public.import_runs
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workspaces w
      where w.id = import_runs.workspace_id
        and w.user_id = auth.uid()
    )
  );

create policy "import_runs_update_own"
  on public.import_runs
  for update
  using (auth.uid() = user_id);

create policy "import_runs_delete_own"
  on public.import_runs
  for delete
  using (auth.uid() = user_id);

-- Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('workspace-imports', 'workspace-imports', false)
on conflict (id) do nothing;

create policy "workspace_imports_select_own"
  on storage.objects
  for select
  using (
    bucket_id = 'workspace-imports'
    and owner = auth.uid()
  );

create policy "workspace_imports_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'workspace-imports'
    and owner = auth.uid()
  );

create policy "workspace_imports_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'workspace-imports'
    and owner = auth.uid()
  );

create policy "workspace_imports_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'workspace-imports'
    and owner = auth.uid()
  );

