-- Run this in the Supabase SQL editor for your project.

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

create policy "anyone can insert an rsvp"
  on rsvps for insert
  to anon
  with check (true);

-- No select policy for anon/authenticated on purpose - the public
-- site should never be able to read the guest list back.
