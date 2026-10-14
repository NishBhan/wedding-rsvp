import { submitRsvp, type RsvpState } from "./actions";

/* Client-side wrapper around the submitRsvp server action. If the request
   never reaches the server (patchy mobile data, airplane mode), calling the
   action throws, which used to crash the page. Instead the form stays as
   it was, with the guest's answers kept, and shows a retry message. */
export async function safeSubmitRsvp(prev: RsvpState, formData: FormData): Promise<RsvpState> {
  try {
    return await submitRsvp(prev, formData);
  } catch {
    return {
      status: "error",
      message:
        "We couldn’t reach the server, so your reply hasn’t been sent yet. Please check your connection and try again.",
    };
  }
}
