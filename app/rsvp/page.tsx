import RsvpForm from "./rsvp-form";
import SiteShell from "../components/site-shell";
import { rsvpsAreOpen } from "@/lib/rsvp-window";

// Rendered per request so the page switches to "replies have closed" at
// the deadline without a redeploy.
export const dynamic = "force-dynamic";

export default function RsvpPage() {
  return (
    <SiteShell>
      <RsvpForm closed={!rsvpsAreOpen()} />
    </SiteShell>
  );
}
