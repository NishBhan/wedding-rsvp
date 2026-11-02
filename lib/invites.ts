import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

// Server-only: uses the service-role client. Client components may import
// the types below (they're erased at build time) but never the functions.

export type InviteType = "couple" | "plus_one" | "solo";

export type Invite = {
  id: string;
  code: string;
  type: InviteType;
  guestName: string;
  partnerName: string | null;
  // This invite's own reply-by date ("2026-11-30"), or null for the
  // site-wide one.
  replyBy: string | null;
};

export type InviteRsvp = {
  attending: boolean;
  plusOne: boolean;
  plusOneName: string | null;
  partnerAttending: boolean | null;
};

type InviteRow = {
  id: string;
  code: string;
  guest_name: string;
  partner_name: string | null;
  plus_one_allowed: boolean;
  reply_by?: string | null;
};

export function inviteTypeOf(row: Pick<InviteRow, "partner_name" | "plus_one_allowed">): InviteType {
  if (row.partner_name && row.partner_name.trim()) return "couple";
  return row.plus_one_allowed ? "plus_one" : "solo";
}

export function inviteUrl(code: string) {
  return `${SITE_URL.replace(/\/$/, "")}/rsvp/${code}`;
}

function normalizeCode(raw: string) {
  return raw.trim().toLowerCase();
}

// Thrown when the database can't be reached, so callers can tell "this
// link doesn't exist" (null) apart from "try again in a moment".
export class InviteLookupError extends Error {}

export async function getInviteByCode(
  rawCode: string
): Promise<{ invite: Invite; existing: InviteRsvp | null } | null> {
  const code = normalizeCode(rawCode);
  if (!/^[a-z0-9-]{4,64}$/.test(code)) return null;

  const supabase = createAdminClient();
  const columns = "id, code, guest_name, partner_name, plus_one_allowed";
  const lookup = (cols: string) => supabase.from("invites").select(cols).eq("code", code).maybeSingle();
  // reply_by exists once its schema.sql line has been run.
  let result = await lookup(`${columns}, reply_by`);
  if (result.error) result = await lookup(columns);
  const { data, error } = result;

  if (error) {
    console.error("getInviteByCode failed:", error.message);
    throw new InviteLookupError(error.message);
  }
  if (!data) return null;

  const row = data as unknown as InviteRow;
  const invite: Invite = {
    id: row.id,
    code: row.code,
    type: inviteTypeOf(row),
    guestName: row.guest_name.trim(),
    partnerName: row.partner_name?.trim() || null,
    replyBy: row.reply_by ?? null,
  };

  const { data: rsvp, error: rsvpError } = await supabase
    .from("rsvps")
    .select("attending, plus_one, plus_one_name, partner_attending")
    .eq("invite_id", row.id)
    .maybeSingle();

  // Without the existing reply the page would show a blank form and a
  // couple's send would overwrite both answers, so treat this as an outage.
  if (rsvpError) {
    console.error("getInviteByCode rsvp lookup failed:", rsvpError.message);
    throw new InviteLookupError(rsvpError.message);
  }

  return {
    invite,
    existing: rsvp
      ? {
          attending: rsvp.attending,
          plusOne: rsvp.plus_one,
          plusOneName: rsvp.plus_one_name,
          partnerAttending: rsvp.partner_attending,
        }
      : null,
  };
}

// The same lookup, shared within one page request: the invite page's link
// preview tags and its body both need the invite, and this keeps that to a
// single database round trip. (Server actions use getInviteByCode directly.)
export const getInviteForPage = cache(getInviteByCode);
