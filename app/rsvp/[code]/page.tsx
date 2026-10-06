import Invitation from "../../components/invitation";
import InviteNotFound from "./invite-not-found";
import { getInviteByCode } from "@/lib/invites";

// Always read fresh: edits to the invites table show up immediately, and a
// guest reopening their link sees the answer they last gave.
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { code: string } }) {
  const found = await getInviteByCode(params.code);
  if (!found) return <InviteNotFound />;
  return <Invitation invite={found.invite} existing={found.existing} />;
}
