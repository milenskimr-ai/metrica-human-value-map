-- =================================================================
-- METRICA HUMAN VALUE MAP — initial schema
-- One row per completed test (session). Contact fields stay NULL
-- until the visitor submits the optional lead form.
-- =================================================================

create table if not exists public.diagnostic_sessions (
  id                  uuid primary key,                 -- session ID generated in the browser
  language            text not null check (language in ('bg', 'en')),
  conference_mode     boolean not null default false,
  completed_at        timestamptz not null default now(),

  -- all answers as stable IDs, e.g. {"monthly_contacts": ["over_2000"], ...}
  answers             jsonb not null,
  -- copied out of `answers` for easy filtering in the admin dashboard
  business_type       text,
  monthly_contacts    text,
  biggest_challenge   text,

  -- computed on the server from `answers` with the scoring config of that moment
  automation_score    smallint not null check (automation_score between 0 and 100),
  human_value_score   smallint not null check (human_value_score between 0 and 100),
  cx_maturity_score   smallint not null check (cx_maturity_score between 0 and 100),
  automation_level    text not null check (automation_level in ('low', 'medium', 'high')),
  human_value_level   text not null check (human_value_level in ('low', 'medium', 'high')),
  cx_maturity_level   text not null check (cx_maturity_level in ('low', 'medium', 'high')),
  biggest_opportunity text not null,
  scoring_version     text not null,

  -- lead (optional)
  first_name          text,
  last_name           text,
  company             text,
  email               text,
  website             text,
  phone               text,
  lead_submitted_at   timestamptz,

  -- consent (GDPR): what was agreed to, when, and in which wording
  consent_given       boolean not null default false,
  consent_at          timestamptz,
  consent_version     text,
  consent_text        text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint lead_requires_consent check (email is null or (consent_given and consent_at is not null))
);

create index if not exists diagnostic_sessions_completed_at_idx on public.diagnostic_sessions (completed_at desc);
create index if not exists diagnostic_sessions_leads_idx on public.diagnostic_sessions (lead_submitted_at desc) where email is not null;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists diagnostic_sessions_updated_at on public.diagnostic_sessions;
create trigger diagnostic_sessions_updated_at
  before update on public.diagnostic_sessions
  for each row execute function public.set_updated_at();

-- Row Level Security ON with NO policies:
-- the public "anon" key can neither read nor write this table.
-- Only the server (service-role key, used in Next.js API routes) has access.
alter table public.diagnostic_sessions enable row level security;
revoke all on public.diagnostic_sessions from anon, authenticated;
