import { RSVP_DEADLINE_LABEL } from "@/lib/site";

// The message sent with each personal link, written once in /admin and
// filled in per invite. Stored in admin_settings under this key.
export const MESSAGE_TEMPLATE_KEY = "invite_message_template";
export const MESSAGE_TEMPLATE_MAX = 4000;

export const MESSAGE_PLACEHOLDERS = ["{name}", "{link}", "{deadline}"] as const;

export const DEFAULT_MESSAGE_TEMPLATE = `Hi {name}!

We're getting married in Bengaluru on 14–15 November 2027, and we'd love you to be there. Your invitation is here:

{link}

Please reply by {deadline}.

Love,
Nish & Wout`;

// Safe to call from client components: only string work, no server imports
// beyond the deadline label.
export function fillMessage(template: string, values: { name: string; link: string }) {
  return template
    .replace(/\{name\}/g, values.name)
    .replace(/\{link\}/g, values.link)
    .replace(/\{deadline\}/g, RSVP_DEADLINE_LABEL);
}
