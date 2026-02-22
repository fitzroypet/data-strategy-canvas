-- Onboarding v1 columns
alter table public.user_profiles
  add column if not exists onboarding_completed_at timestamptz null,
  add column if not exists onboarding_skipped_at timestamptz null,
  add column if not exists onboarding_version text null;

create index if not exists user_profiles_onboarding_version_idx
  on public.user_profiles (onboarding_version);
