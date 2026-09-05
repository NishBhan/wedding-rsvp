import Link from "next/link";
import SiteShell from "./components/site-shell";
import AnimatedMonogram from "./components/animated-monogram";
import OrnamentDivider from "./components/ornament-divider";
import HeroLandscape from "./components/hero-landscape";
import CalendarCheckIcon from "./components/calendar-check-icon";
import { RSVP_REMINDER_CALENDAR_URL } from "@/lib/site";

export default function HomePage() {
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
          need to be locked in early, we&apos;re hoping to hear back by 10th
          October 2026.
        </p>

        <div className="hero-cta">
          <Link href="/rsvp" className="btn-primary hero-btn">
            Confirm your RSVP!
          </Link>
        </div>

        <div className="hero-reminder">
          <p>
            Need some time to decide? Add a reminder for the{" "}
            <a
              href={RSVP_REMINDER_CALENDAR_URL}
              target="_blank"
              rel="noopener"
              className="calendar-link"
            >
              RSVP to your calendar
              <CalendarCheckIcon />
            </a>
            .
          </p>
        </div>
      </section>

      <HeroLandscape />

      <section className="planning-note">
        <div className="planning-note-inner">
          <OrnamentDivider />
          <h2>A little note for your planning</h2>
          <p>
            Our celebrations will begin on the evening of the 14th and
            continue through the night of the 15th. Please plan to arrive in
            Bengaluru by the afternoon of the 14th and depart on the 16th.
          </p>
          <p className="planning-note-fine">
            The full agenda is coming soon, along with details on stay,
            logistics, dress guidance and everything else you&apos;ll need
            for the celebrations.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
