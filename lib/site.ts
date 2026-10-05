// Shared constants used by the calendar links/downloads on both the
// homepage and the RSVP confirmation screen, and by the page metadata
// in app/layout.tsx. Single source of truth for the site's domain.
export const SITE_URL = "https://www.fishfoundherwater.com/";
export const RSVP_URL = "https://www.fishfoundherwater.com/rsvp";

// The reply-by date, shown on the save-the-date page, the RSVP form and
// in the calendar reminder. Change all three here.
export const RSVP_DEADLINE_LABEL = "8th November 2026";

// Prefilled Google Calendar link for the "not ready to RSVP yet" reminder
// on the save-the-date page: an all-day nudge on 7 November 2026, the day
// before the reply date. Personal-link guests get their own link in the
// details so the reminder takes them straight back to their invite.
export function rsvpReminderCalendarUrl(link: string = SITE_URL) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "RSVP due for Nish & Wout's wedding on the 8th.",
    dates: "20261107/20261108",
    location: link,
    details: `RSVP here: ${link}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
