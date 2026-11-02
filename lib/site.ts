// Shared constants used by the calendar links/downloads on both the
// homepage and the RSVP confirmation screen, and by the page metadata
// in app/layout.tsx. Single source of truth for the site's domain.
export const SITE_URL = "https://www.fishfoundherwater.com/";
export const RSVP_URL = "https://www.fishfoundherwater.com/rsvp";

// The link-preview image (WhatsApp, iMessage), shared by every page.
export const OG_IMAGE = {
  url: "https://www.fishfoundherwater.com/og-image.png",
  width: 1200,
  height: 630,
  alt: "Nishtha & Wouter monogram",
};

// Longest name a guest can type (their own on the shared page, or a
// plus-one's). Enforced in the inputs and again in the submit action.
export const MAX_NAME_LENGTH = 80;

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

// Everything that follows from a reply-by date: what guests read, when
// replies lock, and the calendar reminder (an all-day event the day before).
export type Deadline = {
  label: string; // "15 November 2026" (no ordinals, so it reads the same in translation)
  closesAt: string; // ISO time replies lock: the end of that day in London
  reminderStart: string;
  reminderEnd: string;
  reminderTitle: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

// 23:59:59 on that day in London, as a UTC time (London is UTC+1 in summer).
function londonEndOfDay(year: number, monthIndex: number, day: number) {
  const utc = Date.UTC(year, monthIndex, day, 23, 59, 59);
  const londonHour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(
      new Date(utc)
    )
  );
  const offsetHours = londonHour === 23 ? 0 : londonHour + 1;
  return new Date(utc - offsetHours * 3600000).toISOString();
}

function deadlineOn(year: number, monthIndex: number, day: number, closesAt?: string): Deadline {
  const dayDate = new Date(Date.UTC(year, monthIndex, day));
  return {
    label: `${day} ${MONTHS[monthIndex]} ${year}`,
    closesAt: closesAt ?? londonEndOfDay(year, monthIndex, day),
    reminderStart: ymd(new Date(dayDate.getTime() - 86400000)),
    reminderEnd: ymd(dayDate),
    reminderTitle: `Reply to Nish & Wout's wedding invitation by ${day} ${MONTHS[monthIndex]}`,
  };
}

const deadline = londonDate(RSVP_CLOSES_AT);
export const DEFAULT_DEADLINE = deadlineOn(
  deadline.year,
  MONTHS.indexOf(deadline.month),
  deadline.day,
  RSVP_CLOSES_AT
);

// A reply-by date set on one invite ("2026-11-30"), or the site-wide one.
export const REPLY_BY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export function deadlineFor(replyBy: string | null | undefined): Deadline {
  const m = replyBy ? REPLY_BY_PATTERN.exec(replyBy) : null;
  if (!m) return DEFAULT_DEADLINE;
  return deadlineOn(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export const RSVP_DEADLINE_LABEL = DEFAULT_DEADLINE.label;
export const RSVP_REMINDER_START = DEFAULT_DEADLINE.reminderStart;
export const RSVP_REMINDER_END = DEFAULT_DEADLINE.reminderEnd;
export const RSVP_REMINDER_TITLE = DEFAULT_DEADLINE.reminderTitle;

// Prefilled Google Calendar link for the "not ready to RSVP yet" reminder.
// Personal-link guests get their own link in the details so the reminder
// takes them straight back to their invite.
export function rsvpReminderCalendarUrl(link: string = SITE_URL, d: Deadline = DEFAULT_DEADLINE) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: d.reminderTitle,
    dates: `${d.reminderStart}/${d.reminderEnd}`,
    location: link,
    details: `Reply here: ${link}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
