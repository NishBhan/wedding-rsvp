import { createClient } from "@supabase/supabase-js";

// Service-role client. This bypasses RLS entirely, so it must
// NEVER be imported into a client component or exposed to the
// browser. Only use it inside server components / server actions
// that are themselves gated by the admin password check.
//
// Every request opts out of Next's fetch cache: otherwise a page like
// /rsvp/<code> can serve a stale invite or miss a reply that was just
// saved, even with `dynamic = "force-dynamic"` on the route.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    }
  );
}
