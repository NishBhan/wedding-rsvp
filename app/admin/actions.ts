"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DAYS,
  adminSessionToken,
  isAdminAuthed,
  safeEqual,
} from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MESSAGE_TEMPLATE_KEY, MESSAGE_TEMPLATE_MAX } from "@/lib/invite-message";
import { planInviteChange, type InviteInput } from "@/lib/admin-invites";
import { inviteUrl } from "@/lib/invites";
import { parseTier } from "@/lib/tiers";

const LOGGED_OUT = "You've been logged out. Refresh the page and log in again.";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !safeEqual(password, expected)) {
    // Slows down password guessing: every wrong attempt costs 1.5 seconds.
    // (Serverless instances don't share memory, so a lockout counter here
    // wouldn't hold; a long, unique ADMIN_PASSWORD is the real protection.)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    redirect("/admin?error=1");
  }

  cookies().set(ADMIN_COOKIE_NAME, adminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * ADMIN_SESSION_DAYS,
  });

  redirect("/admin");
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}

// Ticks or unticks "invite sent" for one invite. Returns an error message
// for the admin page to show, or null.
export async function setInviteSent(inviteId: string, sent: boolean): Promise<string | null> {
  if (!isAdminAuthed()) return LOGGED_OUT;
  if (!/^[\w-]{1,64}$/.test(inviteId)) return "Unknown invite.";

  const { error } = await createAdminClient()
    .from("invites")
    .update({ sent_at: sent ? new Date().toISOString() : null })
    .eq("id", inviteId);
  if (error) {
    console.error("setInviteSent failed:", error.message);
    return "Couldn't save. Check your connection and try again.";
  }
  revalidatePath("/admin");
  return null;
}

export type TemplateState = { status: "idle" | "saved" | "error"; message?: string };

export async function saveMessageTemplate(
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  if (!isAdminAuthed()) {
    return { status: "error", message: LOGGED_OUT };
  }
  const value = String(formData.get("template") ?? "").replace(/\r\n/g, "\n").trim();
  if (!value) return { status: "error", message: "The message can't be empty." };
  if (value.length > MESSAGE_TEMPLATE_MAX) {
    return { status: "error", message: `Keep the message under ${MESSAGE_TEMPLATE_MAX} characters.` };
  }
  if (!value.includes("{link}")) {
    return { status: "error", message: "Add {link} where each guest's personal link should go." };
  }

  const { error } = await createAdminClient()
    .from("admin_settings")
    .upsert(
      { key: MESSAGE_TEMPLATE_KEY, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) {
    console.error("saveMessageTemplate failed:", error.message);
    return { status: "error", message: "Couldn't save the message. Try again in a moment." };
  }
  revalidatePath("/admin");
  return { status: "saved" };
}

// Sets an invite's tier (null clears it). Returns an error message or null.
export async function setInviteTier(inviteId: string, raw: number | null): Promise<string | null> {
  if (!isAdminAuthed()) return LOGGED_OUT;
  if (!/^[\w-]{1,64}$/.test(inviteId)) return "Unknown invite.";
  const tier = parseTier(raw);
  if (tier === "invalid") return "Unknown tier.";
  const { error } = await createAdminClient().from("invites").update({ tier }).eq("id", inviteId);
  if (error) {
    console.error("setInviteTier failed:", error.message);
    return "Couldn't save. Try again.";
  }
  revalidatePath("/admin");
  return null;
}

export type InvitePreview =
  | { ok: true; changes: string[]; warnings: string[] }
  | { ok: false; error: string };

// Step 1 of adding or editing an invite: say exactly what will change,
// without changing anything.
export async function previewInvite(input: InviteInput): Promise<InvitePreview> {
  if (!isAdminAuthed()) return { ok: false, error: LOGGED_OUT };
  const plan = await planInviteChange(createAdminClient(), input);
  return plan.ok ? { ok: true, changes: plan.changes, warnings: plan.warnings } : plan;
}

export type InviteSaveResult = { ok: true; message: string; link: string } | { ok: false; error: string };

// Step 2, after the admin has confirmed: plan again against the current
// data (someone may have replied in the meantime) and apply.
export async function saveInvite(input: InviteInput): Promise<InviteSaveResult> {
  if (!isAdminAuthed()) return { ok: false, error: LOGGED_OUT };
  const supabase = createAdminClient();
  const plan = await planInviteChange(supabase, input);
  if (!plan.ok) return plan;

  if (input.id) {
    const { data, error } = await supabase
      .from("invites")
      .update(plan.row)
      .eq("id", input.id)
      .select("code")
      .single();
    if (error || !data) {
      console.error("saveInvite update failed:", error?.message);
      return { ok: false, error: "Couldn't save. Nothing was changed. Try again in a moment." };
    }
    if (plan.rsvpPatch) {
      const { error: rsvpError } = await supabase
        .from("rsvps")
        .update(plan.rsvpPatch)
        .eq("invite_id", input.id);
      if (rsvpError) {
        console.error("saveInvite rsvp tidy failed:", rsvpError.message);
        return {
          ok: false,
          error: "The invite was saved, but their old answer couldn't be removed. Open Edit and save again.",
        };
      }
    }
    revalidatePath("/admin");
    return { ok: true, message: "Saved.", link: inviteUrl(data.code) };
  }

  const { data, error } = await supabase.from("invites").insert(plan.row).select("code").single();
  if (error || !data) {
    console.error("saveInvite insert failed:", error?.message);
    return { ok: false, error: "Couldn't add the invite. Try again in a moment." };
  }
  revalidatePath("/admin");
  const names = plan.row.partner_name ? `${plan.row.guest_name} & ${plan.row.partner_name}` : plan.row.guest_name;
  return { ok: true, message: `Added ${names}.`, link: inviteUrl(data.code) };
}
