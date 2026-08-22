import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "wedding_admin";

export function isAdminAuthed() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME);
  return Boolean(cookie && cookie.value === process.env.ADMIN_PASSWORD);
}
