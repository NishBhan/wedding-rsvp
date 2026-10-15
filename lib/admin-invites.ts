import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteTypeOf, inviteUrl, type InviteType } from "@/lib/invites";
import { MAX_NAME_LENGTH } from "@/lib/site";

// Server-only: adding and editing invites from /admin. Every change is
// planned first (what changes, and what it does to a reply already given),
// shown to the admin to double-check, then planned again and applied.

export type InviteInput = {
  id?: string;
  type: InviteType;
  guestName: string;
  partnerName: string;
};

export type InvitePlan =
  | {
      ok: true;
      changes: string[];
      warnings: string[];
      row: { guest_name: string; partner_name: string | null; plus_one_allowed: boolean };
      rsvpPatch: Record<string, null | boolean> | null;
    }
  | { ok: false; error: string };

export const TYPE_LABEL: Record<InviteType, string> = {
  couple: "Couple",
  plus_one: "Single + 1",
  solo: "Single",
};

type InviteRow = {
  id: string;
  code: string;
  guest_name: string;
  partner_name: string | null;
  plus_one_allowed: boolean;
  sent_at?: string | null;
};

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
const fold = (s: string | null) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
const firstWord = (s: string | null) => fold(s).split(" ")[0] ?? "";
const namesOf = (i: { guest_name: string; partner_name: string | null }) =>
  i.partner_name ? `${i.guest_name} & ${i.partner_name}` : i.guest_name;

export async function planInviteChange(
  supabase: SupabaseClient,
  input: InviteInput
): Promise<InvitePlan> {
  if (!["couple", "plus_one", "solo"].includes(input.type)) {
    return { ok: false, error: "Choose Single, Single + 1 or Couple." };
  }
  const guest = tidy(String(input.guestName ?? ""));
  const partner = input.type === "couple" ? tidy(String(input.partnerName ?? "")) : "";
  if (!guest) return { ok: false, error: "Add the guest's name." };
  if (input.type === "couple" && !partner) return { ok: false, error: "Add the partner's name." };
  if (guest.length > MAX_NAME_LENGTH || partner.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Names can be up to ${MAX_NAME_LENGTH} characters.` };
  }
  if (partner && fold(partner) === fold(guest)) {
    return { ok: false, error: "The two names are the same." };
  }

  const row = {
    guest_name: guest,
    partner_name: partner || null,
    plus_one_allowed: input.type === "plus_one",
  };

  const columns = "id, code, guest_name, partner_name, plus_one_allowed";
  let list = await supabase.from("invites").select(`${columns}, sent_at`);
  if (list.error) list = await supabase.from("invites").select(columns); // schema not updated yet
  const { data: all, error: listError } = list;
  if (listError) return { ok: false, error: "Couldn't load the guest list. Try again in a moment." };
  const invites = (all ?? []) as unknown as InviteRow[];

  const changes: string[] = [];
  const warnings: string[] = [];
  let rsvpPatch: Record<string, null | boolean> | null = null;

  if (input.id) {
    const current = invites.find((i) => i.id === input.id);
    if (!current) return { ok: false, error: "This invite no longer exists. Refresh the page." };
    const oldType = inviteTypeOf(current);

    if (current.guest_name !== guest) changes.push(`Name: ${current.guest_name} → ${guest}`);
    if (oldType !== input.type) {
      changes.push(`Type: ${TYPE_LABEL[oldType]} → ${TYPE_LABEL[input.type]}`);
    }
    if ((current.partner_name ?? "") !== partner) {
      if (!current.partner_name) changes.push(`Partner added: ${partner}`);
      else if (!partner) changes.push(`Partner removed: ${current.partner_name}`);
      else changes.push(`Partner: ${current.partner_name} → ${partner}`);
    }

    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .select("attending, plus_one, plus_one_name, partner_attending")
      .eq("invite_id", current.id)
      .maybeSingle();
    if (rsvpError) return { ok: false, error: "Couldn't check their reply. Try again in a moment." };

    if (rsvp) {
      const answer = (yes: boolean) => (yes ? "coming" : "not coming");
      if (input.type !== "couple" && rsvp.partner_attending !== null) {
        rsvpPatch = { ...(rsvpPatch ?? {}), partner_name: null, partner_attending: null };
        warnings.push(
          `${current.partner_name ?? "The partner"} already replied (${answer(rsvp.partner_attending)}). That answer will be removed.`
        );
      }
      if (input.type !== "plus_one" && rsvp.plus_one) {
        rsvpPatch = { ...(rsvpPatch ?? {}), plus_one: false, plus_one_name: null };
        warnings.push(
          `${current.guest_name} said they're bringing ${rsvp.plus_one_name || "someone"}. That will be removed.`
        );
      }
      if (input.type === "couple" && oldType !== "couple") {
        warnings.push(`${guest} has already replied. ${partner} hasn't yet, and can answer on the same link.`);
      }
      if (input.type === "plus_one" && oldType !== "plus_one" && rsvp.attending) {
        warnings.push(`${guest} has already replied. To add someone, they open their link again.`);
      }
      if (input.type === "couple" && oldType === "couple" && current.partner_name !== partner && rsvp.partner_attending !== null) {
        warnings.push(
          `${current.partner_name}'s answer (${answer(rsvp.partner_attending)}) stays on this invite and will show as ${partner}'s.`
        );
      }
      if (current.guest_name !== guest) {
        warnings.push(`The reply already given (${answer(rsvp.attending)}) stays and will show under ${guest}.`);
      }
    }
    if (current.sent_at && changes.length > 0) {
      warnings.push("You've already sent this invite. They'll see the change next time they open their link.");
    }
    if (changes.length === 0 && !rsvpPatch) return { ok: false, error: "Nothing has changed." };
    if (changes.length === 0 && rsvpPatch) changes.push("Tidy up an old answer that no longer fits this invite");
    changes.push(`Their link stays the same: ${inviteUrl(current.code)}`);
  } else {
    changes.push(`New invite (${TYPE_LABEL[input.type]}): ${namesOf(row)}`);
    changes.push("A personal link is created when you save.");
  }

  // Possible duplicates: anyone else on the list with the same full name,
  // or the same first name.
  const others = invites.filter((i) => i.id !== input.id);
  for (const name of [guest, partner].filter(Boolean)) {
    const exact = others.filter((i) => fold(i.guest_name) === fold(name) || fold(i.partner_name) === fold(name));
    const similar = others.filter(
      (i) => !exact.includes(i) && (firstWord(i.guest_name) === firstWord(name) || firstWord(i.partner_name) === firstWord(name))
    );
    if (exact.length) {
      warnings.push(`${name} is already on the list: ${exact.map((i) => `${namesOf(i)} (${TYPE_LABEL[inviteTypeOf(i)]})`).join("; ")}.`);
    } else if (similar.length) {
      warnings.push(`Similar name already on the list: ${similar.map((i) => `${namesOf(i)} (${TYPE_LABEL[inviteTypeOf(i)]})`).join("; ")}. Check it's not the same person.`);
    }
  }

  return { ok: true, changes, warnings, row, rsvpPatch };
}
