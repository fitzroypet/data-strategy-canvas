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
```

3) Run the dev server:
```bash
npm run dev
```

Visit http://localhost:3000.

## Supabase Setup

- Create a Supabase project.
- Run the SQL in `supabase_migrations.sql` to create tables and policies.
- Add the project URL and anon key to `.env.local`.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Lint code
