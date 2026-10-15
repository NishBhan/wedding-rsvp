import {
  SITE_URL,
  RSVP_REMINDER_END,
  RSVP_REMINDER_START,
  RSVP_REMINDER_TITLE,
} from "./site";

/* Calendar files, served from real URLs (app/calendar/*) rather than
   built in the browser: iPhone Safari and the WhatsApp in-app browser open
   a text/calendar URL straight into "Add to Calendar", and Outlook and
   Android calendar apps import it, whereas a script-generated blob
   download often does nothing there. */

const WEDDING_DESCRIPTION = `The celebrations begin on the evening of 14 November and end late on 15 November. Plan to travel home on 16 November. Details: ${SITE_URL}`;

// Text values in .ics escape backslashes, commas, semicolons and newlines.
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

function ics(event: { uid: string; start: string; end: string; summary: string; location?: string; description: string; url: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nishtha and Wouter//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""),
    `DTSTART;VALUE=DATE:${event.start}`,
    `DTEND;VALUE=DATE:${event.end}`,
    `SUMMARY:${esc(event.summary)}`,
    ...(event.location ? [`LOCATION:${esc(event.location)}`] : []),
    `DESCRIPTION:${esc(event.description)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

// The two wedding days, 14 and 15 November 2027, as an all-day block
// (DTEND is exclusive, so 20271116 ends after the 15th). The 16th is the
// day guests travel home, mentioned in the description.
export function weddingIcs() {
  return ics({
    uid: "wedding-days@nishthaandwouter",
    start: "20271114",
    end: "20271116",
    summary: "Nishtha & Wouter's Wedding",
    location: "Bengaluru, India",
    description: WEDDING_DESCRIPTION,
    url: SITE_URL,
  });
}

// All-day reminder on the day before the RSVP deadline, linking back to
// the guest's own invite when there is one.
export function rsvpReminderIcs(link: string) {
  return ics({
    uid: "rsvp-reminder@nishthaandwouter",
    start: RSVP_REMINDER_START,
    end: RSVP_REMINDER_END,
    summary: RSVP_REMINDER_TITLE,
    description: `Reply here: ${link}`,
    url: link,
  });
}

export const GOOGLE_WEDDING_CALENDAR_URL = `https://calendar.google.com/calendar/render?${new URLSearchParams({
  action: "TEMPLATE",
  text: "Nishtha & Wouter's Wedding",
  dates: "20271114/20271116",
  location: "Bengaluru, India",
  details: WEDDING_DESCRIPTION,
}).toString()}`;

export function icsResponse(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
