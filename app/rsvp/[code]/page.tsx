import Link from "next/link";
import RsvpForm from "../rsvp-form";
import SiteShell from "../../components/site-shell";
import { getInviteByCode } from "@/lib/invites";

// Always read fresh: a guest reopening their link should see the answer
// they just gave, not a cached page.
export const dynamic = "force-dynamic";

export default async function InviteRsvpPage({ params }: { params: { code: string } }) {
  const found = await getInviteByCode(params.code);

  if (!found) {
    return (
      <SiteShell>
        <div className="rsvp-section">
          <img src="/assets/monogram-mark.png" alt="" className="step-monogram" />
          <h1>We couldn&apos;t find this invitation.</h1>
          <p className="subtitle">
            Please double-check the link you were sent, or RSVP with your name instead.
          </p>
          <Link href="/rsvp" className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            RSVP with my name
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <RsvpForm invite={found.invite} existing={found.existing} />
    </SiteShell>
  );
}
