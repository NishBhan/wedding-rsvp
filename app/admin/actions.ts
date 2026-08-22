"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin?error=1");
  }

  // Not a real session token - just enough to keep casual visitors
  // out of the guest list. Fine for a two-person admin panel.
  cookies().set(ADMIN_COOKIE_NAME, process.env.ADMIN_PASSWORD as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}
