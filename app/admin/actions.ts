"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DAYS,
  adminSessionToken,
  safeEqual,
} from "@/lib/admin-auth";

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
