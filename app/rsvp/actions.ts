"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RsvpState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitRsvp(
  _prevState: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const name = String(formData.get("name") || "").trim();
  const attending = formData.get("attending") === "yes";
  const plusOne = formData.get("plusOne") === "yes";
  const plusOneName = String(formData.get("plusOneName") || "").trim();
  const existingId = String(formData.get("existingId") || "").trim();

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

  // existingId is only ever set by rsvp-form.tsx after checkExistingRsvp
  // (lookup-actions.ts) matched this exact name to a row already in the
  // table — this is an update to that specific row, not an arbitrary
  // client-chosen id, so it needs the service-role client the same way
  // the admin dashboard does (the anon key has no UPDATE policy at all).
  const { error } = existingId
    ? await createAdminClient().from("rsvps").update(record).eq("id", existingId)
    : await createServerClient().from("rsvps").insert(record);

  if (error) {
    console.error("RSVP save failed:", error.message);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  return { status: "success" };
}
