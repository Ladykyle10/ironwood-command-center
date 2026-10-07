-- =============================================================================
-- Ironwood Command Center — Supabase / PostgreSQL schema
-- Mirrors src/lib/types.ts. Run in the Supabase SQL editor (or `supabase db push`).
-- Row-level security enforces organization isolation and Ironwood roles.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- Enumerations ----------
create type domain_t as enum ('HR','DOT','SAFETY','CONTRACTOR','RECRUITING','LEADERSHIP','OPERATIONS');
create type role_t as enum ('CLIENT_VIEWER','CLIENT_ADMIN','IRONWOOD_CONSULTANT','IRONWOOD_ADMIN');
create type service_status_t as enum ('ACTIVE','NOT_ACTIVE','PROPOSED');
create type org_status_t as enum ('ACTIVE','ONBOARDING','INACTIVE');
create type urgency_t as enum ('HIGH','MEDIUM','LOW','INFO');
create type signal_status_t as enum ('DRAFT','PUBLISHED','ARCHIVED');
create type match_status_t as enum ('APPLIES','WATCH','NO_ACTION','HANDLING');
create type priority_t as enum ('CRITICAL','HIGH','MEDIUM','LOW');
create type action_status_t as enum ('NEW','IN_PROGRESS','WAITING_ON_CLIENT','WAITING_ON_IRONWOOD','COMPLETE','NOT_APPLICABLE');
create type recurrence_t as enum ('NONE','MONTHLY','QUARTERLY','ANNUAL');
create type work_status_t as enum ('SCHEDULED','IN_PROGRESS','REVIEW','COMPLETE');
create type deadline_type_t as enum ('REGULATORY','DOCUMENT','TRAINING','CERTIFICATION','MEDICAL_CARD','CDL','VEHICLE','INSURANCE','PORTAL','POLICY','AUDIT','REVIEW');
create type deadline_status_t as enum ('UPCOMING','COMPLETE','MISSED');
create type document_category_t as enum ('POLICY','FORM','TRAINING','HR','DOT','SAFETY','CONTRACTOR','GUIDANCE','TEMPLATE','IRONWOOD');
create type question_status_t as enum ('NEW','REVIEWING','RESPONDED','FOLLOW_UP_REQUIRED','CLOSED');
create type notification_type_t as enum ('DEADLINE','ACTION_ASSIGNED','SIGNAL','DOCUMENT_EXPIRATION','CONSULTANT_RESPONSE','WORK_COMPLETE','GAP','QUESTION');
create type activity_type_t as enum ('SIGNAL','ACTION','WORK','DOCUMENT','DEADLINE','QUESTION','READINESS','PROFILE');
create type actor_t as enum ('IRONWOOD','CLIENT','SYSTEM');

-- ---------- Core ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text not null,
  naics_code text,
  hq_city text not null,
  hq_state text not null,
  states_of_operation text[] not null default '{}',
  employee_count int not null default 0,
  revenue_range text,
  facility_count int not null default 1,
  website text,
  phone text,
  status org_status_t not null default 'ONBOARDING',
  services jsonb not null default '{}'::jsonb,   -- { "HR": "ACTIVE", ... }
  profile jsonb not null default '{}'::jsonb,    -- ClientProfile (hr/dot/safety/contractor)
  branding jsonb,                                 -- white-label overrides
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  email text unique not null,
  domains domain_t[] not null default '{}'
);

-- One row per auth user. `org_id` is set for client users; `consultant_id` for Ironwood staff.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role role_t not null default 'CLIENT_VIEWER',
  org_id uuid references organizations(id) on delete set null,
  consultant_id uuid references consultants(id) on delete set null,
  title text,
  created_at timestamptz not null default now()
);

create table org_consultants (
  org_id uuid references organizations(id) on delete cascade,
  consultant_id uuid references consultants(id) on delete cascade,
  primary key (org_id, consultant_id)
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, address text, city text not null, state text not null, zip text,
  employee_count int not null default 0,
  is_headquarters boolean not null default false
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, title text, email text not null, phone text,
  is_primary boolean not null default false
);

-- ---------- Readiness requirements (configurable rules) ----------
create table requirements (
  id text primary key,
  domain domain_t not null,
  title text not null,
  gap_title text,
  description text not null,
  weight int not null default 1,
  applies_when jsonb not null,    -- RuleSet
  satisfied_when jsonb not null,  -- RuleSet
  recommendation text not null,
  active boolean not null default true
);

-- ---------- Signals ----------
create table signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  domain domain_t not null,
  jurisdiction text not null,
  regulatory_body text not null,
  published_date date not null,
  effective_date date,
  summary text not null,
  affected_industries text[] not null default '{}',
  affected_characteristics text[] not null default '{}',
  applies jsonb not null,  -- RuleSet
  watch jsonb,             -- RuleSet
  recommended_action text not null,
  urgency urgency_t not null default 'MEDIUM',
  source_url text, source_label text,
  commentary text not null default '',
  status signal_status_t not null default 'DRAFT',
  is_demo boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table signal_matches (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  status match_status_t not null,
  reasons text[] not null default '{}',
  evaluated_at timestamptz not null default now(),
  override_by uuid references profiles(id),
  override_note text,
  acknowledged_at timestamptz,
  unique (signal_id, org_id)
);

-- ---------- Actions, work, deadlines ----------
create table actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  domain domain_t not null,
  description text not null,
  recommended_action text,
  ironwood_owner_id uuid references consultants(id),
  client_owner_id uuid references contacts(id),
  priority priority_t not null default 'MEDIUM',
  due_date date,
  status action_status_t not null default 'NEW',
  recurrence recurrence_t not null default 'NONE',
  signal_id uuid references signals(id) on delete set null,
  completed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table action_notes (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references actions(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text not null,
  text text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table action_resources (
  action_id uuid references actions(id) on delete cascade,
  document_id uuid,
  primary key (action_id, document_id)
);

create table work_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  domain domain_t not null,
  consultant_id uuid references consultants(id),
  status work_status_t not null default 'IN_PROGRESS',
  status_label text not null default 'In progress',
  progress int not null default 0 check (progress between 0 and 100),
  started_at timestamptz not null default now(),
  target_date date,
  completed_at timestamptz,
  summary text not null default '',
  signal_id uuid references signals(id) on delete set null
);

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  domain domain_t not null,
  date date not null,
  type deadline_type_t not null,
  description text,
  related_action_id uuid references actions(id) on delete set null,
  related_document_id uuid,
  recurrence recurrence_t not null default 'NONE',
  status deadline_status_t not null default 'UPCOMING'
);

-- ---------- Documents (metadata now; storage_path → Supabase Storage later) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  category document_category_t not null,
  domain domain_t,
  version text not null default '1.0',
  uploaded_at timestamptz not null default now(),
  owner_name text not null,
  review_date date,
  expiration_date date,
  url text,
  storage_path text,     -- bucket object path when uploads are enabled
  file_name text,
  size_label text
);

-- ---------- Ask Ironwood ----------
create table questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  submitted_by uuid references profiles(id),
  submitted_by_name text not null,
  text text not null,
  domain domain_t not null,
  urgency urgency_t not null,
  submitted_at timestamptz not null default now(),
  assigned_consultant_id uuid references consultants(id),
  status question_status_t not null default 'NEW',
  triage jsonb not null  -- Triage
);

create table question_notes (          -- internal only
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table question_responses (      -- client-facing thread
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text not null,
  from_side actor_t not null default 'IRONWOOD',
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------- Notifications, activity, readiness history, manual gaps ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  audience actor_t not null,            -- CLIENT or IRONWOOD
  user_id uuid references profiles(id), -- optional per-user targeting
  type notification_type_t not null,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  emailed_at timestamptz,               -- set by the (future) email dispatcher
  created_at timestamptz not null default now()
);

create table activity (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type activity_type_t not null,
  title text not null,
  detail text,
  at timestamptz not null default now(),
  actor actor_t not null,
  actor_name text,
  href text
);

create table readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  date date not null,
  scores jsonb not null,
  unique (org_id, date)
);

create table manual_gaps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  domain domain_t not null,
  title text not null,
  detail text not null,
  recommendation text not null,
  severity text not null check (severity in ('HIGH','MEDIUM','LOW')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table branding (
  id int primary key default 1 check (id = 1),
  portal_name text not null default 'Ironwood Command Center',
  primary_color text not null default '#0b1526',
  logo_text text not null default 'IRONWOOD',
  logo_url text,
  support_email text not null default 'info@ironwoodbc.com',
  support_phone text not null default '888-743-5238'
);
insert into branding (id) values (1) on conflict do nothing;

-- ---------- Indexes ----------
create index on signal_matches (org_id, status);
create index on actions (org_id, status, due_date);
create index on deadlines (org_id, date);
create index on documents (org_id, category);
create index on questions (org_id, status);
create index on notifications (org_id, audience, read);
create index on activity (org_id, at desc);

-- =============================================================================
-- Row-level security
-- =============================================================================
-- Helpers read the caller's profile once per statement.
create or replace function auth_role() returns role_t language sql stable security definer as
  $$ select role from profiles where id = auth.uid() $$;
create or replace function auth_org() returns uuid language sql stable security definer as
  $$ select org_id from profiles where id = auth.uid() $$;
create or replace function is_ironwood() returns boolean language sql stable as
  $$ select auth_role() in ('IRONWOOD_CONSULTANT','IRONWOOD_ADMIN') $$;
create or replace function is_ironwood_admin() returns boolean language sql stable as
  $$ select auth_role() = 'IRONWOOD_ADMIN' $$;
create or replace function is_client_admin() returns boolean language sql stable as
  $$ select auth_role() = 'CLIENT_ADMIN' $$;

alter table organizations enable row level security;
alter table consultants enable row level security;
alter table profiles enable row level security;
alter table org_consultants enable row level security;
alter table locations enable row level security;
alter table contacts enable row level security;
alter table requirements enable row level security;
alter table signals enable row level security;
alter table signal_matches enable row level security;
alter table actions enable row level security;
alter table action_notes enable row level security;
alter table action_resources enable row level security;
alter table work_items enable row level security;
alter table deadlines enable row level security;
alter table documents enable row level security;
alter table questions enable row level security;
alter table question_notes enable row level security;
alter table question_responses enable row level security;
alter table notifications enable row level security;
alter table activity enable row level security;
alter table readiness_snapshots enable row level security;
alter table manual_gaps enable row level security;
alter table branding enable row level security;

-- Profiles: users see themselves; Ironwood sees all; only admins change roles.
create policy "profiles self or ironwood read" on profiles for select using (id = auth.uid() or is_ironwood());
create policy "profiles admin write" on profiles for all using (is_ironwood_admin()) with check (is_ironwood_admin());

-- Organizations: clients see their own; Ironwood sees all; Ironwood writes; client admins may edit their own org.
create policy "org read" on organizations for select using (id = auth_org() or is_ironwood());
create policy "org ironwood write" on organizations for all using (is_ironwood()) with check (is_ironwood());
create policy "org client admin update" on organizations for update using (id = auth_org() and is_client_admin()) with check (id = auth_org() and is_client_admin());

-- Generic org-scoped tables: read own org or Ironwood; Ironwood writes; client admins write within their org.
do $$
declare t text;
begin
  foreach t in array array['locations','contacts','actions','deadlines','documents','questions','question_responses','manual_gaps','readiness_snapshots','activity','action_resources']
  loop
    execute format('create policy "%1$s read" on %1$s for select using (org_id = auth_org() or is_ironwood())', t);
    execute format('create policy "%1$s ironwood write" on %1$s for all using (is_ironwood()) with check (is_ironwood())', t);
    execute format('create policy "%1$s client admin write" on %1$s for all using (org_id = auth_org() and is_client_admin()) with check (org_id = auth_org() and is_client_admin())', t);
  end loop;
end $$;
-- action_resources and some tables lack org_id directly; tighten via joins in a later migration if needed.

-- Action notes: visible to the org (non-internal) and Ironwood (all).
create policy "action_notes read" on action_notes for select using (
  is_ironwood() or (not internal and exists (select 1 from actions a where a.id = action_id and a.org_id = auth_org()))
);
create policy "action_notes write" on action_notes for insert with check (
  is_ironwood() or exists (select 1 from actions a where a.id = action_id and a.org_id = auth_org() and auth_role() in ('CLIENT_ADMIN','CLIENT_VIEWER'))
);

-- Internal question notes: Ironwood only.
create policy "question_notes ironwood" on question_notes for all using (is_ironwood()) with check (is_ironwood());

-- Signals: published visible to everyone signed in; drafts to Ironwood; writes Ironwood only.
create policy "signals read" on signals for select using (status = 'PUBLISHED' or is_ironwood());
create policy "signals ironwood write" on signals for all using (is_ironwood()) with check (is_ironwood());

-- Signal matches: org sees its own; Ironwood all; Ironwood writes; client may acknowledge (update) its own.
create policy "matches read" on signal_matches for select using (org_id = auth_org() or is_ironwood());
create policy "matches ironwood write" on signal_matches for all using (is_ironwood()) with check (is_ironwood());
create policy "matches client ack" on signal_matches for update using (org_id = auth_org()) with check (org_id = auth_org());

-- Work items, consultants, org_consultants, requirements, branding: read by all signed-in; write by Ironwood.
create policy "work read" on work_items for select using (org_id = auth_org() or is_ironwood());
create policy "work write" on work_items for all using (is_ironwood()) with check (is_ironwood());
create policy "consultants read" on consultants for select using (auth.uid() is not null);
create policy "consultants write" on consultants for all using (is_ironwood_admin()) with check (is_ironwood_admin());
create policy "org_consultants read" on org_consultants for select using (org_id = auth_org() or is_ironwood());
create policy "org_consultants write" on org_consultants for all using (is_ironwood()) with check (is_ironwood());
create policy "requirements read" on requirements for select using (auth.uid() is not null);
create policy "requirements write" on requirements for all using (is_ironwood_admin()) with check (is_ironwood_admin());
create policy "branding read" on branding for select using (true);
create policy "branding write" on branding for all using (is_ironwood_admin()) with check (is_ironwood_admin());

-- Notifications: client audience scoped to org; Ironwood audience to Ironwood; users may mark their own read.
create policy "notifications read" on notifications for select using (
  (audience = 'CLIENT' and org_id = auth_org()) or (audience = 'IRONWOOD' and is_ironwood())
);
create policy "notifications update" on notifications for update using (
  (audience = 'CLIENT' and org_id = auth_org()) or (audience = 'IRONWOOD' and is_ironwood())
);
create policy "notifications insert" on notifications for insert with check (is_ironwood() or org_id = auth_org());

-- Keep updated_at fresh.
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger organizations_touch before update on organizations for each row execute function touch_updated_at();

-- New auth users get a profile row (role defaults to CLIENT_VIEWER; Ironwood admin assigns org/role).
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, email) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
