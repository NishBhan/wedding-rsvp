"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { submitRsvp, RsvpState } from "./actions";

const initialState: RsvpState = { status: "idle" };

type Step = "name" | "attend" | "plus" | "decline";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Sending..." : label}
    </button>
  );
}

function TulipMotif() {
  return (
    <svg width="52" height="52" viewBox="0 0 70 70" className="motif" aria-hidden="true">
      <g fill="none" stroke="#1B3A6B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 64 V30" />
        <path
          d="M26 30 C24 18 29 10 35 6 C41 10 46 18 44 30 C40 34 30 34 26 30 Z"
          fill="#1B3A6B"
          fillOpacity=".1"
        />
        <path d="M35 7 V31M27 28 C23 20 25 14 28 10M43 28 C47 20 45 14 42 10" />
        <path d="M35 46 C26 45 20 39 18 32M35 52 C44 51 50 45 52 38" />
        <circle cx="35" cy="6" r="2" fill="#B08D4F" stroke="none" />
      </g>
    </svg>
  );
}

function PairMotif() {
  return (
    <svg width="52" height="52" viewBox="0 0 70 70" className="motif" aria-hidden="true">
      <g fill="none" stroke="#1B3A6B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 64 C24 44 20 36 20 28M46 64 C46 44 50 36 50 28" />
        <path
          d="M13 28 C12 19 16 13 20 10 C24 13 28 19 27 28 C24 31 16 31 13 28 Z"
          fill="#1B3A6B"
          fillOpacity=".1"
        />
        <path
          d="M43 28 C42 19 46 13 50 10 C54 13 58 19 57 28 C54 31 46 31 43 28 Z"
          fill="#1B3A6B"
          fillOpacity=".1"
        />
        <path d="M20 11 V29M50 11 V29M35 64 C35 54 30 50 26 48M35 64 C35 54 40 50 44 48" />
        <circle cx="35" cy="58" r="2" fill="#B08D4F" stroke="none" />
      </g>
    </svg>
  );
}

function LotusMotif() {
  return (
    <svg width="52" height="52" viewBox="0 0 70 70" className="motif" aria-hidden="true">
      <g fill="none" stroke="#1B3A6B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 54 C31 42 32 30 35 22 C38 30 39 42 35 54 Z" fill="#1B3A6B" fillOpacity=".12" />
        <path d="M35 54 C25 47 20 38 18 28 C27 31 33 42 35 54 Z" fill="#1B3A6B" fillOpacity=".07" />
        <path d="M35 54 C45 47 50 38 52 28 C43 31 37 42 35 54 Z" fill="#1B3A6B" fillOpacity=".07" />
        <path d="M35 54 C24 52 15 47 10 41M35 54 C46 52 55 47 60 41" />
        <path d="M14 58 C22 54 48 54 56 58" />
        <circle cx="35" cy="20" r="2" fill="#B08D4F" stroke="none" />
      </g>
    </svg>
  );
}

function VineDivider() {
  return (
    <svg
      width="100%"
      height="40"
      viewBox="0 0 900 46"
      preserveAspectRatio="xMidYMid slice"
      className="vine-divider"
      aria-hidden="true"
    >
      <defs>
        <pattern id="nwvineB" width="150" height="46" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#1B3A6B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 38 C18 38 24 30 37 30 C50 30 56 38 75 38 C94 38 100 30 113 30 C126 30 132 38 150 38" />
            <path d="M37 30 V16" />
            <path
              d="M31 16 C30 9 33 4 37 2 C41 4 44 9 43 16 C41 19 33 19 31 16 Z"
              fill="#1B3A6B"
              fillOpacity=".16"
            />
            <path d="M37 3 V17M31.5 15 C29 10 30 6 32 4M42.5 15 C45 10 44 6 42 4" />
            <path d="M37 27 C31 26 27 22 26 18M37 27 C43 26 47 22 48 18" />
            <path
              d="M113 29 C110 22 111 16 113 12 C115 16 116 22 113 29 Z"
              fill="#1B3A6B"
              fillOpacity=".16"
            />
            <path
              d="M113 29 C106 25 103 20 102 15 C107 17 111 22 113 29 Z"
              fill="#1B3A6B"
              fillOpacity=".1"
            />
            <path
              d="M113 29 C120 25 123 20 124 15 C119 17 115 22 113 29 Z"
              fill="#1B3A6B"
              fillOpacity=".1"
            />
            <path d="M113 29 C104 27 99 24 96 21M113 29 C122 27 127 24 130 21" />
            <circle cx="75" cy="30" r="2.2" fill="#B08D4F" stroke="none" />
            <path d="M69 33 C71 31 73 30 75 30M81 33 C79 31 77 30 75 30" />
            <circle cx="55" cy="20" r="1.3" fill="#1B3A6B" stroke="none" />
            <circle cx="95" cy="20" r="1.3" fill="#1B3A6B" stroke="none" />
          </g>
        </pattern>
      </defs>
      <rect width="900" height="46" fill="url(#nwvineB)" />
    </svg>
  );
}

export default function RsvpForm() {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [plusOne, setPlusOne] = useState<"yes" | "no" | "">("");
  const [plusOneName, setPlusOneName] = useState("");

  const goToStep = (next: Step) => {
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const submitName = () => {
    if (!name.trim()) {
      setNameError("Please enter your name so we know who is replying.");
      return;
    }
    setNameError("");
    goToStep("attend");
  };

  // --- Post-submit confirmation ---
  if (state.status === "success") {
    return (
      <div className="rsvp-section confirmation">
        <VineDivider />
        <img src="/monogram.png" alt="" className="monogram" />
        {attending === "yes" ? (
          <>
            <p className="eyebrow">With our love</p>
            <h1>We&apos;re so excited to celebrate with you!</h1>
            <p>
              You don&apos;t need to figure out the rest just yet. We&apos;ll
              send the formal invitation closer to the wedding to know if
              anything has changed, with the full agenda, recommended
              arrival dates, accommodation, transport, dress guidance and
              everything else you&apos;ll need.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Thank you for telling us</p>
            <h1>We understand!</h1>
            <p>
              Thank you for telling us this early &mdash; it genuinely
              helps. We would have loved to see you there, but we&apos;ll
              raise a glass to you in Bengaluru.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={formAction}>
      {/* Hidden fields carry forward values decided on earlier steps,
          so the single form submission at the end has everything. */}
      {step !== "name" && <input type="hidden" name="name" value={name} />}
      {(step === "plus" || step === "decline") && (
        <input type="hidden" name="attending" value={attending} />
      )}

      {step === "name" && (
        <div className="rsvp-section">
          <div className="motif-row">
            <TulipMotif />
          </div>
          <img src="/monogram.png" alt="" className="step-monogram" />
          <h1>We&apos;d love to know if you can join us.</h1>
          <p className="subtitle">
            Just a heads up so we can start planning &mdash; not a final answer.
          </p>

          <div className="name-field">
            <label htmlFor="name">Your name</label>
            <p className="field-hint">As you&apos;d like it to appear on the formal invite.</p>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitName();
                }
              }}
              placeholder="e.g. Anjali Rao"
            />
            {nameError && <p className="error">{nameError}</p>}
          </div>

          <button type="button" className="btn-primary" onClick={submitName}>
            Continue
          </button>
        </div>
      )}

      {step === "attend" && (
        <div className="rsvp-section">
          <div className="motif-row">
            <PairMotif />
          </div>
          <p className="eyebrow">Hello, {name.split(" ")[0] || "there"}</p>
          <h1>How is it looking?</h1>
          <p className="subtitle">
            14&ndash;15 November 2027, Bengaluru. We will not count this as
            your final confirmation, but it helps us plan logistics!
          </p>
          <div className="response-group">
            <button
              type="button"
              className="response-option-btn"
              onClick={() => {
                setAttending("yes");
                goToStep("plus");
              }}
            >
              Yes, count me in!
            </button>
            <button
              type="button"
              className="response-option-btn outline"
              onClick={() => {
                setAttending("no");
                setPlusOne("");
                goToStep("decline");
              }}
            >
              I already know I can&apos;t make it
            </button>
          </div>
          <button
            type="button"
            className="link-back"
            onClick={() => goToStep("name")}
          >
            Go back
          </button>
        </div>
      )}

      {step === "plus" && (
        <div className="rsvp-section">
          <div className="motif-row">
            <LotusMotif />
          </div>
          <p className="eyebrow">Your party</p>
          <h1>Bringing someone with you?</h1>
          <p className="subtitle plus-subtitle">Your invitation includes one guest.</p>

          <div className="plus-one-grid">
            <label className="plus-one-option">
              <input
                type="radio"
                name="plusOne"
                value="yes"
                checked={plusOne === "yes"}
                onChange={() => setPlusOne("yes")}
              />
              <span>{plusOne === "yes" ? "\u2713 YES" : "YES"}</span>
            </label>
            <label className="plus-one-option">
              <input
                type="radio"
                name="plusOne"
                value="no"
                checked={plusOne === "no"}
                onChange={() => {
                  setPlusOne("no");
                  setPlusOneName("");
                }}
              />
              <span>No, just me</span>
            </label>
          </div>

          {plusOne === "yes" && (
            <div className="plus-one-name-field">
              <label htmlFor="plusOneName">Their name</label>
              <input
                type="text"
                id="plusOneName"
                name="plusOneName"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                placeholder="Their full name"
              />
            </div>
          )}

          {state.status === "error" && <p className="error">{state.message}</p>}

          <SubmitButton label="Submit Response!" />
          <button
            type="button"
            className="link-back"
            onClick={() => goToStep("attend")}
          >
            Go back
          </button>
        </div>
      )}

      {step === "decline" && (
        <div className="rsvp-section">
          <div className="motif-row">
            <PairMotif />
          </div>
          <h1>We understand!</h1>
          <p className="subtitle">
            Thank you for telling us this early &mdash; it genuinely helps.
            We would have loved to see you there, but we&apos;ll raise a
            glass to you in Bengaluru.
          </p>

          {state.status === "error" && <p className="error">{state.message}</p>}

          <SubmitButton label="Submit Response!" />
          <button
            type="button"
            className="link-back"
            onClick={() => goToStep("attend")}
          >
            I change my mind!
          </button>
        </div>
      )}
    </form>
  );
}
