# Wedding RSVP

A one-page RSVP site for Nishtha & Wouter's wedding, plus a password-gated
admin page to see responses and export a CSV.

## How it's built

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres) for storage, accessed via server actions
- No guest accounts, no invite codes — one shared link, guests type their
  own name
- Admin page gated by a single shared password (not full auth — fine for
  two people)

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. In the SQL editor, paste and run everything in `supabase/schema.sql`.
   This creates the `rsvps` table and locks it down with Row Level
   Security: anyone can insert a row, nobody can read the table from the
   browser.
3. In Project Settings → API, copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this one secret — never put it in
     `NEXT_PUBLIC_*`)

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

`ADMIN_PASSWORD` is whatever you and Wouter want to use to log into
`/admin`. Pick something real, not "password".

## 3. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/rsvp` for the guest form and
`http://localhost:3000/admin` for the dashboard.

## 4. Deploy

Push this to a GitHub repo and import it into
[Vercel](https://vercel.com/new). Add the same four environment variables
in the Vercel project settings before the first deploy. Vercel will give
you a URL like `your-wedding.vercel.app` — you can attach a custom domain
later if you want.

## What's in each folder

- `app/rsvp/` — the public form. `actions.ts` is the server action that
  inserts a row; `rsvp-form.tsx` is the client form calling it.
- `app/admin/` — `page.tsx` shows a login form or the dashboard depending
  on a cookie; `actions.ts` handles login/logout; `export/route.ts` is the
  CSV download.
- `lib/supabase/` — three small clients: `client.ts` (browser, unused by
  default but there if you need it), `server.ts` (anon key, insert-only),
  `admin.ts` (service role key, used only by the gated admin page).
- `supabase/schema.sql` — run this once in the Supabase SQL editor.

## Things you might want to add later

- **Duplicate detection**: right now two people can both submit as
  "Priya Sharma" and you'll get two rows. If your guest list is small
  enough to eyeball in the CSV before finalizing headcount, this is fine.
  If not, add a "search your name first" step before the form.
- **Edit an existing RSVP**: currently a second submission is a new row,
  not an update. Same tradeoff as above — cheap to skip, cheap to add if
  it becomes annoying.
- **A closing date**: the form doesn't currently check whether it's past
  1 November 2026. Easy to add a date check in `actions.ts` if you want
  the form to stop accepting responses automatically.
