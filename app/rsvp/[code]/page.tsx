import Invitation from "../../components/invitation";
import InviteNotFound from "./invite-not-found";
import InviteUnavailable from "./invite-unavailable";
import { getInviteByCode, InviteLookupError } from "@/lib/invites";
import { rsvpsAreOpen } from "@/lib/rsvp-window";

// Always read fresh: edits to the invites table show up immediately, and a
// guest reopening their link sees the answer they last gave.
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { code: string } }) {
  let found;
  try {
    found = await getInviteByCode(params.code);
  } catch (e) {
    if (e instanceof InviteLookupError) return <InviteUnavailable />;
    throw e;
  }
  if (!found) return <InviteNotFound />;
  return <Invitation invite={found.invite} existing={found.existing} closed={!rsvpsAreOpen()} />;
}
