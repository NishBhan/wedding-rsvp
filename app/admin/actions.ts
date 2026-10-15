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
  if (!isAdminAuthed()) return "You've been logged out. Refresh the page and log in again.";
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
    return { status: "error", message: "You've been logged out. Refresh the page and log in again." };
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
