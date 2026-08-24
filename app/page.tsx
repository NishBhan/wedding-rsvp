import Link from "next/link";
import SiteShell from "./components/site-shell";

export default function HomePage() {
  return (
    <SiteShell showArch={false}>
      <section className="hero">
        <p className="eyebrow">Save the Date</p>
        <div className="hero-monogram">
          <img src="/monogram.png" alt="Nishtha & Wouter monogram" />
        </div>
        <h1 className="hero-names">
          Nishtha <span className="amp">&amp;</span> Wouter
        </h1>
        <div className="hero-divider">
          <span />
          <span className="diamond" />
          <span />
        </div>
        <div className="hero-dates">
          14<span className="dash">&ndash;</span>15
        </div>
        <div className="hero-month">NOVEMBER 2027</div>
        <div className="hero-location">BENGALURU, INDIA</div>

        <div className="hero-cta">
          <Link href="/rsvp" className="btn-primary hero-btn">
            Let us know how it&apos;s looking
          </Link>
        </div>

        <p className="hero-blurb">
          The wedding is still over a year away, so this is only an early
          check-in &mdash; nothing you say now is locked in. A formal
          invitation with the agenda, hotels, travel and dress guidance will
          follow closer to the time.
        </p>
      </section>
    </SiteShell>
  );
}
