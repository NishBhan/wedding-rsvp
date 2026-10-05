import RsvpForm from "../../rsvp-form";
import SiteShell from "../../../components/site-shell";
import InviteNotFound from "../invite-not-found";
import { getInviteByCode } from "@/lib/invites";

// Always read fresh: a guest reopening their link should see the answer
// they just gave, not a cached page.
export const dynamic = "force-dynamic";

export default async function InviteRsvpPage({ params }: { params: { code: string } }) {
  const found = await getInviteByCode(params.code);
  if (!found) return <InviteNotFound />;

  return (
    <SiteShell>
      <RsvpForm invite={found.invite} existing={found.existing} />
    </SiteShell>
  );
}
