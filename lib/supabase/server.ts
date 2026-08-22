import { createClient } from "@supabase/supabase-js";

// Anon-key client for server actions that only ever INSERT.
// RLS on the rsvps table restricts this to insert-only, so
// there's no read risk even though this runs server-side.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
