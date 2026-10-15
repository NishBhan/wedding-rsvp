import Link from "next/link";
import SiteShell from "./site-shell";
import AnimatedMonogram from "./animated-monogram";
import OrnamentDivider from "./ornament-divider";
import HeroLandscape from "./hero-landscape";
import PlanningNote from "./planning-note";
import CalendarCheckIcon from "./calendar-check-icon";
import { RSVP_DEADLINE_LABEL, rsvpReminderCalendarUrl } from "@/lib/site";

// The save-the-date on the homepage, for anyone without a personal link.
// Personal links get the full invitation instead (components/invitation.tsx).
export default function SaveTheDate() {
  return (
    <SiteShell showArch={false}>
      <section className="hero">
        <p className="eyebrow hero-eyebrow">Save the date</p>

        <div className="hero-monogram">
          <AnimatedMonogram />
        </div>

        <h1 className="hero-names">
          Nishtha <span className="amp">&amp;</span> Wouter
        </h1>

        <div className="hero-dates">
          14<span className="dash">&ndash;</span>15
        </div>
        <div className="hero-month">NOVEMBER 2027</div>

        <OrnamentDivider hero />

        <div className="hero-location">BENGALURU, INDIA</div>

        <p className="hero-blurb">
          We know this is far in advance, but for many of you India is a real
          trip, not just a calendar entry. Since venues and accommodations
          need to be locked in early, we&apos;re hoping to hear back by{" "}
          {RSVP_DEADLINE_LABEL}.
        </p>

        <div className="hero-cta">
          <Link href="/rsvp" className="btn-primary hero-btn">
            Confirm your RSVP!
          </Link>
        </div>

        <div className="hero-reminder">
          <p>
            Need some time to decide? Add a reminder for the{" "}
            <a href="/calendar/rsvp-reminder.ics" className="calendar-link">
              RSVP to your calendar
              <CalendarCheckIcon />
            </a>{" "}
            (or{" "}
            <a href={rsvpReminderCalendarUrl()} target="_blank" rel="noopener" className="calendar-link">
              Google Calendar
            </a>
            ).
          </p>
        </div>
      </section>

      <HeroLandscape />

      <PlanningNote />
    </SiteShell>
  );
}
