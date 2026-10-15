-- Run this in the Supabase SQL editor for your project. Safe to re-run:
-- every statement skips or replaces what already exists.

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending boolean not null,
  plus_one boolean not null default false,
  plus_one_name text,
  dietary_notes text,
  submitted_at timestamptz not null default now()
);

-- Row Level Security: anyone can submit an RSVP, nobody can read
-- the table from the browser. The admin page reads via the
-- service role key on the server, which bypasses RLS entirely.
alter table rsvps enable row level security;

drop policy if exists "anyone can insert an rsvp" on rsvps;
create policy "anyone can insert an rsvp"
  on rsvps for insert
  to anon
  with check (true);

-- No select policy for anon/authenticated on purpose - the public
-- site should never be able to read the guest list back.

-- ---------------------------------------------------------------------
-- Invites (personal RSVP links). Safe to run on a live database: it only
-- adds a table and nullable columns, existing rsvps rows are untouched.
--
-- One row per invitation. The invite type is derived, not stored:
--   partner_name set           -> couple: both named, each answers yes/no
--   plus_one_allowed = true    -> single guest who may add a plus-one
--   neither                    -> single guest, no plus-one
-- Each invite's personal link is <site>/rsvp/<code>.
-- ---------------------------------------------------------------------

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  guest_name text not null,
  partner_name text,
  plus_one_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint couple_has_no_plus_one
    check (not (coalesce(trim(partner_name), '') <> '' and plus_one_allowed))
);

-- No policies at all: only the service role (server code) can read
-- invites, so the guest list can't be pulled from the browser.
alter table invites enable row level security;

alter table rsvps add column if not exists invite_id uuid references invites(id) on delete set null;
alter table rsvps add column if not exists partner_name text;
alter table rsvps add column if not exists partner_attending boolean;

-- One reply per invite; a second submission updates it. Plain unique
-- (not partial) so upserts can target it; NULLs from shared-link
-- replies don't collide with each other.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rsvps_invite_id_key') then
    alter table rsvps add constraint rsvps_invite_id_key unique (invite_id);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Tighten the public insert rule (replaces the open policy created above,
-- now that the invite columns exist). The public key can only add a plain
-- shared-link reply: it cannot attach a reply to someone's invite, set a
-- partner's answer, or store names longer than the site allows. Personal
-- link replies are written by the server with the service role, which
-- this policy doesn't affect.
-- ---------------------------------------------------------------------
drop policy if exists "anyone can insert an rsvp" on rsvps;
create policy "anyone can insert an rsvp"
  on rsvps for insert
  to anon
  with check (
    invite_id is null
    and partner_name is null
    and partner_attending is null
    and char_length(name) between 1 and 80
    and (plus_one_name is null or char_length(plus_one_name) <= 80)
  );

-- ---------------------------------------------------------------------
-- Admin: tracking who has been sent their invite, and the message
-- template used to send it. Both are only read and written by the server
-- (service role), so neither has any policies.
-- ---------------------------------------------------------------------
alter table invites add column if not exists sent_at timestamptz;

create table if not exists admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table admin_settings enable row level security;
