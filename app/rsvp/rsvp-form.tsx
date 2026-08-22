"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitRsvp, RsvpState } from "./actions";

const initialState: RsvpState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send RSVP"}
    </button>
  );
}

export default function RsvpForm() {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [plusOne, setPlusOne] = useState<"yes" | "no" | "">("");

  if (state.status === "success") {
    return (
      <div className="confirmation">
        <p className="eyebrow">Thank you</p>
        <h1>We&apos;ve got your RSVP</h1>
        <p>
          Thanks for letting us know. If anything changes before 1 November
          2026, just fill out the form again with the same name and we&apos;ll
          update it.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">Save the Date</p>
      <h1>Nishtha &amp; Wouter</h1>
      <p className="subtitle">14 &ndash; 15 November 2027, Bengaluru</p>
      <p className="details">
        Please RSVP by <strong>1st November 2026</strong>
      </p>

      <form action={formAction}>
        <div>
          <label htmlFor="name">Your name</label>
          <input type="text" id="name" name="name" required />
        </div>

        <div>
          <label>Will you be attending?</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="attending"
                value="yes"
                checked={attending === "yes"}
                onChange={() => setAttending("yes")}
                required
              />
              Yes
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="attending"
                value="no"
                checked={attending === "no"}
                onChange={() => {
                  setAttending("no");
                  setPlusOne("");
                }}
              />
              No
            </label>
          </div>
        </div>

        {attending === "yes" && (
          <>
            <div>
              <label>Bringing a plus one?</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="plusOne"
                    value="yes"
                    checked={plusOne === "yes"}
                    onChange={() => setPlusOne("yes")}
                  />
                  Yes
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="plusOne"
                    value="no"
                    checked={plusOne === "no"}
                    onChange={() => setPlusOne("no")}
                  />
                  No
                </label>
              </div>
            </div>

            {plusOne === "yes" && (
              <div>
                <label htmlFor="plusOneName">Plus one&apos;s name</label>
                <input type="text" id="plusOneName" name="plusOneName" />
              </div>
            )}

            <div>
              <label htmlFor="dietaryNotes">
                Dietary restrictions (optional)
              </label>
              <textarea id="dietaryNotes" name="dietaryNotes" />
            </div>
          </>
        )}

        {state.status === "error" && <p className="error">{state.message}</p>}

        <SubmitButton />
      </form>
    </>
  );
}
