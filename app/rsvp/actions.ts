"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInviteByCode } from "@/lib/invites";
import { rsvpsAreOpen, RSVPS_CLOSED_MID_FORM_MESSAGE } from "@/lib/rsvp-window";

export type RsvpState = {
  status: "idle" | "success" | "error";
  message?: string;
  // Set when the reply arrived after the deadline and was not saved.
  closed?: boolean;
  // Couple invites: both answers as saved, which can include a change the
  // partner made from another phone a moment earlier.
  saved?: { attending: boolean; partnerAttending: boolean | null };
};

export async function submitRsvp(
  _prevState: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  // The lock: nothing is written after the deadline, whichever page the
  // reply came from or however long the form was left open.
  if (!rsvpsAreOpen()) {
    return { status: "error", closed: true, message: RSVPS_CLOSED_MID_FORM_MESSAGE };
  }

  const name = String(formData.get("name") || "").trim();
  const attending = formData.get("attending") === "yes";
  const plusOne = formData.get("plusOne") === "yes";
  const plusOneName = String(formData.get("plusOneName") || "").trim();
  const inviteCode = String(formData.get("inviteCode") || "").trim();

  if (inviteCode) return submitInviteRsvp(inviteCode, formData);

  if (!name) {
    return { status: "error", message: "Please enter your name so we know who is replying." };
  }

  if (attending && plusOne && !plusOneName) {
    return {
      status: "error",
      message: "We just need a name for them — you can change it later.",
    };
  }

  const record = {
    name,
    attending,
    plus_one: attending ? plusOne : false,
    plus_one_name: attending && plusOne ? plusOneName : null,
  };

  // Shared-link replies are always new rows. Nothing sent from the browser
  // can choose an existing row to overwrite: only a personal invite code
  // (below) authorises editing a reply.
  const { error } = await createServerClient().from("rsvps").insert(record);

  if (error) {
    console.error("RSVP save failed:", error.message);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  return { status: "success" };
}

/* Personal-link RSVPs (/rsvp/<code>). Names and what the guest is allowed
   to answer come from the invite row, never from the form, so editing the
   form in devtools can't rename a guest or add a plus-one to a solo invite.
   One row per invite: a second submission overwrites the first. */
async function submitInviteRsvp(code: string, formData: FormData): Promise<RsvpState> {
  const found = await getInviteByCode(code);
  if (!found) {
    return {
      status: "error",
      message: "We couldn't find this invitation. Please check the link you were sent.",
    };
  }
  const { invite } = found;

  const attending = formData.get("attending") === "yes";
  const partnerAttending = formData.get("partnerAttending") === "yes";
  const plusOne = invite.type === "plus_one" && attending && formData.get("plusOne") === "yes";
  const plusOneName = String(formData.get("plusOneName") || "").trim();

  if (plusOne && !plusOneName) {
    return {
      status: "error",
      message: "We just need a name for them — you can change it later.",
    };
  }

  const isCouple = invite.type === "couple";
  const record = {
    invite_id: invite.id,
    name: invite.guestName,
    attending,
    plus_one: plusOne,
    plus_one_name: plusOne ? plusOneName : null,
    partner_name: isCouple ? invite.partnerName : null,
    partner_attending: isCouple ? partnerAttending : null,
    submitted_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();

  // Couples often reply from two phones. When a reply already exists, write
  // only the answers this person actually changed, so partners editing at
  // the same time don't overwrite each other with a stale copy of the
  // other's answer. ("changed" is absent only from pages loaded before this
  // shipped; they fall back to writing both answers.)
  const { error } =
    isCouple && found.existing && formData.has("changed")
      ? await supabase
          .from("rsvps")
          .update({
            name: record.name,
            partner_name: record.partner_name,
            submitted_at: record.submitted_at,
            ...(changedFields(formData).has("attending") ? { attending } : {}),
            ...(changedFields(formData).has("partnerAttending")
              ? { partner_attending: partnerAttending }
              : {}),
          })
          .eq("invite_id", invite.id)
      : await supabase.from("rsvps").upsert(record, { onConflict: "invite_id" });

  if (error) {
    console.error("Invite RSVP save failed:", error.message);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  if (isCouple) {
    const { data } = await supabase
      .from("rsvps")
      .select("attending, partner_attending")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (data) {
      return {
        status: "success",
        saved: { attending: data.attending, partnerAttending: data.partner_attending },
      };
    }
  }

  return { status: "success" };
}

function changedFields(formData: FormData) {
  return new Set(String(formData.get("changed") || "").split(",").filter(Boolean));
}
