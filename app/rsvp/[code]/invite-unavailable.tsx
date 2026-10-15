import SiteShell from "../../components/site-shell";
import MonogramImg from "../../components/monogram-img";

// Shown when the database can't be reached, so a guest isn't told their
// perfectly good link doesn't exist.
export default function InviteUnavailable() {
  return (
    <SiteShell>
      <div className="rsvp-section">
        <MonogramImg name="monogram-mark" alt="" className="step-monogram" />
        <h1>We&apos;re having trouble loading your invitation.</h1>
        <p className="subtitle">
          Your link is fine. Please try again in a few minutes.
        </p>
      </div>
    </SiteShell>
  );
}
