import { icsResponse, rsvpReminderIcs } from "@/lib/calendar";
import { SITE_URL } from "@/lib/site";

// ?code=<invite code> makes the reminder link back to that guest's own
// invite. The code is only echoed into the link, never looked up.
export function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const link = /^[a-z0-9-]{4,64}$/.test(code)
    ? `${SITE_URL.replace(/\/$/, "")}/rsvp/${code}`
    : SITE_URL;
  return icsResponse(rsvpReminderIcs(link), "RSVP-reminder.ics");
}
