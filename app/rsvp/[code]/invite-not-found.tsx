import Link from "next/link";
import SiteShell from "../../components/site-shell";

export default function InviteNotFound() {
  return (
    <SiteShell>
      <div className="rsvp-section">
        <img src="/assets/monogram-mark.png" alt="" className="step-monogram" />
        <h1>We couldn&apos;t find this invitation.</h1>
        <p className="subtitle">
          Please double-check the link you were sent, or RSVP with your name instead.
        </p>
        <Link
          href="/rsvp"
          className="btn-primary"
          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
        >
          RSVP with my name
        </Link>
      </div>
    </SiteShell>
  );
}
