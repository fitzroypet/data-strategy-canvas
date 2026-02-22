# Data Strategy Canvas

Calm, guided 6-step workspace to build a clear data strategy, powered by Supabase and optional AI refinement.

## Getting Started

1) Install dependencies:
```bash
npm install
```

2) Create `.env.local` with your Supabase credentials:
```bash
cp .env.example .env.local
```
Then set:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
IMPORT_STRATEGY_ENABLED=true
AI_CHAT_PANEL_ENABLED=true
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
IMPORT_MAX_FILE_MB=10
IMPORT_FILE_TTL_HOURS=24
IMPORT_CRON_SECRET=your_cron_secret
```

3) Run the dev server:
```bash
npm run dev
```

Visit http://localhost:3000.

## Supabase Setup

- Create a Supabase project.
- Run the SQL in `supabase_migrations.sql` to create tables and policies.
- Run `supabase_import_migrations.sql` to add import tables + storage policies.
- Add the project URL and anon key to `.env.local`.
- Ensure a private storage bucket `workspace-imports` exists (migration inserts it).

## Strategy Import (Phase 1)

- Use the top-bar `Import Strategy` button in any workspace.
- Upload a DOCX or PDF file.
- Generate preview to see mapped fields by step.
- Apply import to fill only empty fields in the current workspace.
- A cleanup endpoint exists at `POST /api/imports/expire` with `Authorization: Bearer <IMPORT_CRON_SECRET>`.

## Dashboard (Phase 1)

- Use the top-bar `Dashboard` button from any step page.
- Manage account profile (email + display name) and sign out.
- Manage workspaces: create, rename, open, and delete (with confirmation).
- Open workspace action returns to canvas with `?workspace=<id>`.

## AI Chat Panel (Phase 1)

- Enable with `AI_CHAT_PANEL_ENABLED=true`.
- On step pages, use side toggle to switch between `Steps` and `AI` (single active panel).
- AI chat is session-only (resets on refresh/navigation), with quick prompts and free text.
- AI can insert responses directly into the currently selected form field.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Lint code
