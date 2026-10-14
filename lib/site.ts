// Shared constants used by the calendar links/downloads on both the
// homepage and the RSVP confirmation screen, and by the page metadata
// in app/layout.tsx. Single source of truth for the site's domain.
export const SITE_URL = "https://www.fishfoundherwater.com/";
export const RSVP_URL = "https://www.fishfoundherwater.com/rsvp";

// Replies close at the end of 15 November 2026, London time. London is on
// GMT (UTC+0) in November, so that is 23:59:59 UTC. This is the single
// source for the deadline: the date guests see, the calendar reminder and
// the lock (lib/rsvp-window.ts) all come from it. Guests only ever see the
// date, never the exact time.
export const RSVP_CLOSES_AT = "2026-11-15T23:59:59Z";

// The deadline's calendar date in London, e.g. { day: 15, month: "November", year: 2026 }.
function londonDate(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: Number(get("day")), month: get("month"), year: Number(get("year")) };
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

const deadline = londonDate(RSVP_CLOSES_AT);

// "15th November 2026"
export const RSVP_DEADLINE_LABEL = `${ordinal(deadline.day)} ${deadline.month} ${deadline.year}`;

// The reminder sits on the day before the deadline, as an all-day event.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const deadlineDay = new Date(Date.UTC(deadline.year, MONTHS.indexOf(deadline.month), deadline.day));
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
export const RSVP_REMINDER_START = ymd(new Date(deadlineDay.getTime() - 86400000));
export const RSVP_REMINDER_END = ymd(deadlineDay);
export const RSVP_REMINDER_TITLE = `RSVP due for Nish & Wout's wedding on the ${ordinal(deadline.day)}`;

// Prefilled Google Calendar link for the "not ready to RSVP yet" reminder.
// Personal-link guests get their own link in the details so the reminder
// takes them straight back to their invite.
export function rsvpReminderCalendarUrl(link: string = SITE_URL) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: RSVP_REMINDER_TITLE,
    dates: `${RSVP_REMINDER_START}/${RSVP_REMINDER_END}`,
    location: link,
    details: `RSVP here: ${link}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
