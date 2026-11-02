import { RSVP_CLOSES_AT } from "./site";

// Server-only: whether replies are still being accepted. Checked by the
// submit action (the real lock) and by the RSVP pages (to show the closed
// view). RSVP_CLOSES_AT_OVERRIDE, an ISO timestamp, moves the cut-off on a
// test deployment; leave it unset in production.
// closesAt: an invite's own deadline (see deadlineFor in lib/site.ts), or
// the site-wide one for the shared page.
export function rsvpsAreOpen(now: Date = new Date(), closesAt: string = RSVP_CLOSES_AT) {
  const cutoff = new Date(process.env.RSVP_CLOSES_AT_OVERRIDE || closesAt);
  return now.getTime() <= cutoff.getTime();
}

export const RSVPS_CLOSED_MID_FORM_MESSAGE =
  "Replies closed before we could save this, so nothing has changed. If your plans have changed, please message Nish or Wout on WhatsApp.";
