import { icsResponse, rsvpReminderIcs } from "@/lib/calendar";
import { getInviteByCode } from "@/lib/invites";
import { SITE_URL, deadlineFor } from "@/lib/site";

export const dynamic = "force-dynamic";

// ?code=<invite code> makes the reminder link back to that guest's own
// invite and fall on that invite's reply-by date. If the code is unknown or
// the lookup fails, it falls back to the site-wide date.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const valid = /^[a-z0-9-]{4,64}$/.test(code);
  const link = valid ? `${SITE_URL.replace(/\/$/, "")}/rsvp/${code}` : SITE_URL;
  let replyBy: string | null = null;
  if (valid) {
    try {
      replyBy = (await getInviteByCode(code))?.invite.replyBy ?? null;
    } catch {
      // Use the site-wide date.
    }
  }
  return icsResponse(rsvpReminderIcs(link, deadlineFor(replyBy)), "RSVP-reminder.ics");
}
