import { RSVP_CLOSES_AT } from "./site";

// Server-only: whether replies are still being accepted. Checked by the
// submit action (the real lock) and by the RSVP pages (to show the closed
// view). RSVP_CLOSES_AT_OVERRIDE, an ISO timestamp, moves the cut-off on a
// test deployment; leave it unset in production.
export function rsvpsAreOpen(now: Date = new Date()) {
  const closesAt = new Date(process.env.RSVP_CLOSES_AT_OVERRIDE || RSVP_CLOSES_AT);
  return now.getTime() <= closesAt.getTime();
}

export const RSVPS_CLOSED_MID_FORM_MESSAGE =
  "Replies closed before we could save this, so nothing has changed. If your plans have changed, please message Nish or Wout on WhatsApp.";
