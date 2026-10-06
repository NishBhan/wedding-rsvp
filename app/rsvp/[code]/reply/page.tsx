import { redirect } from "next/navigation";

// The RSVP now lives on the invitation page itself. Kept so any
// /rsvp/<code>/reply link that was opened before still lands somewhere.
export default function ReplyRedirect({ params }: { params: { code: string } }) {
  redirect(`/rsvp/${params.code}#rsvp`);
}
