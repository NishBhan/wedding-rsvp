"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/* These actions use the service-role client (bypassing RLS) so the public
   RSVP flow can tell a guest "you're already on the list" and let them
   update their own answer in place, instead of filing a duplicate.

   There is no login on this site, so the only thing gating a lookup or an
   update is knowing someone's exact full name — the same trust level as
   the rest of this invite-only site. To keep it from being a trivial way
   to browse other people's answers, checkExistingRsvp refuses to run on
   anything shorter than a plausible full name, and the client only calls
   it after the guest pauses typing (see the debounce in rsvp-form.tsx),
   never on every keystroke. It still means: anyone who already knows a
   guest's exact name can see whether that guest is coming. */

function normalizeName(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAFullName(normalized: string) {
  return normalized.length >= 4 && normalized.includes(" ");
}

type Row = {
  id: string;
  name: string;
  attending: boolean;
  plus_one: boolean;
  plus_one_name: string | null;
};

export type ExistingMatch =
  | { kind: "none" }
  | {
      kind: "primary";
      id: string;
      name: string;
      attending: boolean;
      plusOne: boolean;
      plusOneName: string | null;
    }
  | {
      kind: "plus_one";
      primaryId: string;
      primaryName: string;
      attending: boolean;
    };

export async function checkExistingRsvp(rawName: string): Promise<ExistingMatch> {
  const normalized = normalizeName(rawName);
  if (!looksLikeAFullName(normalized)) return { kind: "none" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("id, name, attending, plus_one, plus_one_name")
    .limit(1000);

  if (error || !data) {
    // Swallowed to "no match" for the guest, but logged so a broken
    // SUPABASE_SERVICE_ROLE_KEY (or similar) shows up in Vercel's function
    // logs instead of just silently never finding anyone.
    if (error) console.error("checkExistingRsvp lookup failed:", error.message);
    return { kind: "none" };
  }

  const rows = data as Row[];

  const primary = rows.find((r) => normalizeName(r.name) === normalized);
  if (primary) {
    return {
      kind: "primary",
      id: primary.id,
      name: primary.name,
      attending: primary.attending,
      plusOne: primary.plus_one,
      plusOneName: primary.plus_one_name,
    };
  }

  const asPlusOne = rows.find(
    (r) => r.plus_one && r.plus_one_name && normalizeName(r.plus_one_name) === normalized
  );
  if (asPlusOne) {
    return {
      kind: "plus_one",
      primaryId: asPlusOne.id,
      primaryName: asPlusOne.name,
      attending: asPlusOne.attending,
    };
  }

  return { kind: "none" };
}

/* Removes someone as a plus-one from the primary guest's row, without
   touching the primary guest's own attendance. Used only when a plus-one
   says "actually, I can't make it" after being matched by checkExistingRsvp. */
export async function removeSelfAsPlusOne(primaryId: string): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rsvps")
    .update({ plus_one: false, plus_one_name: null })
    .eq("id", primaryId);

  return { ok: !error };
}
