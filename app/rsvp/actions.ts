"use server";

import { createServerClient } from "@/lib/supabase/server";

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
  const dietaryNotes = String(formData.get("dietaryNotes") || "").trim();

  if (!name) {
    return { status: "error", message: "Please enter your name." };
  }

  if (attending && plusOne && !plusOneName) {
    return {
      status: "error",
      message: "Please enter your plus one's name, or switch plus one to no.",
    };
  }

  const supabase = createServerClient();

  const { error } = await supabase.from("rsvps").insert({
    name,
    attending,
    plus_one: attending ? plusOne : false,
    plus_one_name: attending && plusOne ? plusOneName : null,
    dietary_notes: dietaryNotes || null,
  });

  if (error) {
    console.error("RSVP insert failed:", error.message);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  return { status: "success" };
}
