// Shared constants used by the calendar links/downloads on both the
// homepage and the RSVP confirmation screen, and by the page metadata
// in app/layout.tsx. Single source of truth for the site's domain.
export const SITE_URL = "https://www.fishfoundherwater.com/";
export const RSVP_URL = "https://www.fishfoundherwater.com/rsvp";

// Prefilled Google Calendar link for the "not ready to RSVP yet" reminder
// on the homepage: an all-day nudge on 9 October 2026, the day before the
// hoped-for reply date, with the site as both location and details.
const reminderParams = new URLSearchParams({
  action: "TEMPLATE",
  text: "RSVP due for Nish & Wout's wedding on the 10th.",
  dates: "20261009/20261010",
  location: SITE_URL,
  details: `RSVP here: ${SITE_URL}`,
});

export const RSVP_REMINDER_CALENDAR_URL = `https://calendar.google.com/calendar/render?${reminderParams.toString()}`;
