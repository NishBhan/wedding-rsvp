import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "wedding_admin";
export const ADMIN_SESSION_DAYS = 7;

// The cookie holds an HMAC derived from ADMIN_PASSWORD, never the password
// itself, so reading the cookie off a logged-in device doesn't reveal it.
// Changing ADMIN_PASSWORD signs everyone out.
export function adminSessionToken() {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "")
    .update("wedding-admin-session-v1")
    .digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isAdminAuthed() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookie = cookies().get(ADMIN_COOKIE_NAME);
  return Boolean(cookie && safeEqual(cookie.value, adminSessionToken()));
}
