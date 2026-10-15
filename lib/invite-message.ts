import { RSVP_DEADLINE_LABEL } from "@/lib/site";

// The message sent with each personal link, written once in /admin and
// filled in per invite. Stored in admin_settings under this key.
export const MESSAGE_TEMPLATE_KEY = "invite_message_template";
export const MESSAGE_TEMPLATE_MAX = 4000;

// Who is sending: Nish and Wout each send from their own phone, so the
// message names the other one ("Wout and I are getting married").
export const SENDERS = ["Nish", "Wout"] as const;
export type Sender = (typeof SENDERS)[number];

export const DEFAULT_MESSAGE_TEMPLATE = `IT'S HAPPENING! {other} and I are getting married on 14–15 November 2027 at a nature resort in Bengaluru, India. Aaand it wouldn't be the same without {you}! 🌴

You're going to have an amazing time. Closer to the date we'll share all the details: what to wear, what to expect, what role YOU'LL be playing, and tips for a pre- or post-wedding recovery trip. But before all that, we'd love to know if you can make it.

Please reply by {deadline} using your personal link:
{link}

Questions about bringing young children, or anything else? Just let us know!

Love,
Wouter & Nish

PS We're arranging where everyone stays on the nights of 14 and 15 November, so please don't book anything for those two nights.`;

// True when the template needs to know who is sending.
export function needsSender(template: string) {
  return /\{(me|other)\}/.test(template);
}

// Pure string work, safe in client components.
export function fillMessage(
  template: string,
  values: { guestName: string; partnerName: string | null; link: string; sender: Sender | null }
) {
  const both = values.partnerName ? `${values.guestName} & ${values.partnerName}` : values.guestName;
  const you = values.partnerName ? `you & ${values.partnerName}` : "you";
  const other = values.sender ? SENDERS.find((s) => s !== values.sender)! : "";
  return template
    .replace(/\{name\}/g, both)
    .replace(/\{you\}/g, you)
    .replace(/\{me\}/g, values.sender ?? "")
    .replace(/\{other\}/g, other)
    .replace(/\{link\}/g, values.link)
    .replace(/\{deadline\}/g, RSVP_DEADLINE_LABEL);
}
