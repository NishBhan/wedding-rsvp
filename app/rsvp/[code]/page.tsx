import type { Metadata } from "next";
import Invitation from "../../components/invitation";
import InviteNotFound from "./invite-not-found";
import InviteUnavailable from "./invite-unavailable";
import { getInviteForPage, InviteLookupError, inviteUrl } from "@/lib/invites";
import { rsvpsAreOpen } from "@/lib/rsvp-window";
import { OG_IMAGE, RSVP_DEADLINE_LABEL } from "@/lib/site";

// Always read fresh: edits to the invites table show up immediately, and a
// guest reopening their link sees the answer they last gave.
export const dynamic = "force-dynamic";

// The link preview a guest sees in WhatsApp before they even open it names
// them. Unknown codes and outages fall back to the site-wide preview.
export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  try {
    const found = await getInviteForPage(params.code);
    if (!found) return {};
    const { invite } = found;
    const names = invite.partnerName ? `${invite.guestName} & ${invite.partnerName}` : invite.guestName;
    const title = `${names}, you're invited to Nishtha & Wouter's wedding`;
    const description = `14–15 November 2027, Bengaluru, India. Please reply by ${RSVP_DEADLINE_LABEL}.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: inviteUrl(invite.code),
        siteName: "Nishtha & Wouter",
        images: [OG_IMAGE],
      },
      twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    };
  } catch {
    return {};
  }
}

export default async function InvitePage({ params }: { params: { code: string } }) {
  let found;
  try {
    found = await getInviteForPage(params.code);
  } catch (e) {
    if (e instanceof InviteLookupError) return <InviteUnavailable />;
    throw e;
  }
  if (!found) return <InviteNotFound />;
  return <Invitation invite={found.invite} existing={found.existing} closed={!rsvpsAreOpen()} />;
}
