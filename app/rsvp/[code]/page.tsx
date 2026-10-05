import SaveTheDate from "../../components/save-the-date";
import InviteNotFound from "./invite-not-found";
import { getInviteByCode, inviteUrl } from "@/lib/invites";

// Always read fresh so edits to the invites table show up immediately.
export const dynamic = "force-dynamic";

// A personal invite link opens on the save-the-date page, greeted by name.
// Its button continues to this guest's own RSVP form at ./reply.
export default async function InvitePage({ params }: { params: { code: string } }) {
  const found = await getInviteByCode(params.code);
  if (!found) return <InviteNotFound />;

  const { invite } = found;
  // Names are used exactly as written in the invites table.
  const names = invite.partnerName
    ? `${invite.guestName} & ${invite.partnerName}`
    : invite.guestName;

  return (
    <SaveTheDate
      guestNames={names}
      rsvpHref={`/rsvp/${invite.code}/reply`}
      reminderLink={inviteUrl(invite.code)}
    />
  );
}
