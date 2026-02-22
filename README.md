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
ONBOARDING_V1_ENABLED=true
LANDING_V1_ENABLED=true
WORKSPACE_DOC_LIBRARY_ENABLED=true
AI_STEP_DRAFT_ENABLED=true
AI_STEP_DRAFT_PIPELINE=planner_writer_v1
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
AI_MODEL_PLANNER_FALLBACK=gpt-4.1
AI_MODEL_WRITER_FALLBACK=gpt-4.1-mini
AI_MODEL_STEP_1=
AI_MODEL_STEP_2=
AI_MODEL_STEP_3=
AI_MODEL_STEP_4=
AI_MODEL_STEP_5=
AI_MODEL_STEP_6=
AI_EBOOK_SNIPPET_MAX_CHARS=6000
AI_PLANNER_MAX_OUTPUT_CHARS=8000
IMPORT_MAX_FILE_MB=10
IMPORT_FILE_TTL_HOURS=24
IMPORT_CRON_SECRET=your_cron_secret
AI_DOC_CONTEXT_MAX_CHARS=20000
AI_DOC_CONTEXT_MAX_CHARS_PER_DOC=4000
WORKSPACE_DOC_MAX_FILE_MB=10
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
- Run `supabase_onboarding_migrations.sql` to add onboarding profile fields.
- Run `supabase_landing_onboarding_migrations.sql` to add workspace onboarding + landing intake fields.
- Run `supabase_workspace_documents_v2.sql` to enable `chat_draft` document source + AI context index.
- Add the project URL and anon key to `.env.local`.
- Ensure a private storage bucket `workspace-imports` exists (migration inserts it).

## Landing-First Flow (Phase 1)

- Enable with `LANDING_V1_ENABLED=true`.
- `/` is the landing/start page with prompt input + optional DOCX/PDF upload.
- `/canvas` is Step 1 (business model mapping).
- Clicking `Start` creates a workspace in pending onboarding state and redirects to onboarding.
- Onboarding is now workspace-scoped:
  - pending workspace -> onboarding required
  - completed/skipped workspace -> opens canvas directly

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
- Open workspace action returns to `/canvas?workspace=<id>`.

## AI Chat Panel (Phase 1)

- Enable with `AI_CHAT_PANEL_ENABLED=true`.
- On step pages, use side toggle to switch between `Steps` and `AI` (single active panel).
- AI chat is session-only (resets on refresh/navigation), with quick prompts and free text.
- AI can insert responses directly into the currently selected form field.
- AI now includes non-expired workspace documents in context (with truncation limits).
- Assistant messages can be saved as workspace markdown drafts.

## AI Step Drafting (Phase 1)

- Enable with `AI_STEP_DRAFT_ENABLED=true`.
- Two-stage pipeline is controlled by `AI_STEP_DRAFT_PIPELINE`:
  - `planner_writer_v1` = planner + writer (recommended)
  - any other value = single-stage writer fallback
- Step-based model routing:
  - use `AI_MODEL_STEP_1...AI_MODEL_STEP_6` to pin a model per step
  - or rely on `AI_MODEL_PLANNER_FALLBACK` and `AI_MODEL_WRITER_FALLBACK`
- On each step, use `Generate This Step` to create structured cell-level drafts.
- Optional section focus lets you deepen one section while keeping starter output for the rest.
- AI uses full workspace context but outputs only the active step fields.
- Preview is grouped by sections with per-cell selection.
- Apply mode supports:
  - `Fill empty only` (default)
  - `Allow overwrite`

## Workspace Document Library (Phase 1)

- Enable with `WORKSPACE_DOC_LIBRARY_ENABLED=true`.
- Manage workspace documents from the side panel on canvas/step pages:
  - upload DOCX/PDF/MD/TXT
  - view source and metadata
  - hard-delete documents
- All non-expired documents are automatically used as AI context.

## Onboarding (Phase 1)

- Enable with `ONBOARDING_V1_ENABLED=true`.
- Pending workspaces are redirected to `/onboarding` before entering `/canvas` or `/step/*`.
- Wizard flow:
  - welcome
  - workspace setup
  - light context prompts
  - review and apply starter prefill
- Prefill writes starter content into Step 1 and Step 2 using fill-empty-only behavior.
- Users can skip onboarding and continue directly to canvas.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Lint code
