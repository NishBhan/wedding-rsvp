import { RSVP_URL } from "./site";

/* Builds and downloads an .ics holding 14-16 November 2027 as an all-day
   block ("Nishtha & Wouter's Wedding", Bengaluru, India), with the RSVP
   link carried in the description and URL fields so guests can find their
   way back here. DTEND is exclusive, so 20271117 covers the 14th-16th. */
export function downloadWeddingIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nishtha and Wouter//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:wedding-days@nishthaandwouter",
    "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""),
    "DTSTART;VALUE=DATE:20271114",
    "DTEND;VALUE=DATE:20271117",
    "SUMMARY:Nishtha & Wouter's Wedding",
    "LOCATION:Bengaluru\\, India",
    "DESCRIPTION:Celebrations in Bengaluru. Details: " + RSVP_URL,
    "URL:" + RSVP_URL,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Nishtha-and-Wouter-wedding.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    // download unsupported - no fallback needed
  }
}
