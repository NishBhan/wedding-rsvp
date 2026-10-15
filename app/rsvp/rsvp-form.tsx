"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/site";
import type { RsvpState } from "./actions";
import { safeSubmitRsvp } from "./safe-submit";
import OrnamentDivider from "../components/ornament-divider";
import MonogramImg from "../components/monogram-img";
import AttendingDetails from "../components/attending-details";
import { RSVP_DEADLINE_LABEL } from "@/lib/site";

const initialState: RsvpState = { status: "idle" };

type Step = "name" | "attend" | "plus" | "decline";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Sending…" : "Send my reply"}
    </button>
  );
}

function TulipMotif() {
  return (
    <svg width="62" height="62" viewBox="0 0 70 70" className="motif" aria-hidden="true">
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
    <svg width="62" height="62" viewBox="0 0 70 70" className="motif" aria-hidden="true">
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
    <svg width="62" height="62" viewBox="0 0 70 70" className="motif" aria-hidden="true">
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

const PROGRESS_LABEL: Record<Step, string> = {
  name: "Reply · Step 1 of 3",
  attend: "Reply · Step 2 of 3",
  plus: "Reply · Step 3 of 3",
  decline: "",
};

export default function RsvpForm({ closed = false }: { closed?: boolean }) {
  const [state, formAction] = useFormState(safeSubmitRsvp, initialState);
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

  const firstName = name.trim().split(" ")[0] || "";

  if (closed) {
    return (
      <div className="rsvp-section confirmation">
        <MonogramImg name="monogram-mark" alt="" className="monogram" />
        <h1>Replies have now closed.</h1>
        <p>
          Thank you to everyone who replied. If your plans have changed, just message
          Nish or Wout on WhatsApp and we&rsquo;ll sort it out together.
        </p>
      </div>
    );
  }

  // --- Post-submit confirmation ---
  if (state.status === "success") {
    const isAttending = attending === "yes";
    const hasPlusOne = isAttending && plusOne === "yes";

    return (
      <div className="rsvp-section confirmation">
        <OrnamentDivider />
        <MonogramImg name="monogram-mark" alt="" className="monogram" />
        <h1>
          {isAttending
            ? "We can’t wait to celebrate with you!"
            : "We’ll miss you"}
        </h1>
        <div
          className="hero-dates"
          style={{ fontSize: "clamp(52px,14vw,110px)", margin: "22px 0 0", animation: "none" }}
        >
          14<span className="dash">&ndash;</span>15
        </div>
        <div className="hero-month" style={{ margin: "6px 0 0", animation: "none" }}>NOVEMBER 2027</div>
        <div className="hero-location" style={{ margin: "20px 0 0", animation: "none" }}>BENGALURU, INDIA</div>
        <p>
          {isAttending
            ? `Thank you, ${firstName || "friend"}. Your place is saved.`
            : "Thank you for letting us know, and for telling us early. We completely understand."}
        </p>

        {hasPlusOne && (
          <div className="joining-panel">
            <span className="joining-label">JOINING YOU</span>
            <div className="joining-name">{plusOneName.trim() || "Name to be confirmed"}</div>
          </div>
        )}

        {isAttending && <AttendingDetails />}
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

      <div className="motif-row">
        {step === "name" && <TulipMotif />}
        {(step === "attend" || step === "decline") && <PairMotif />}
        {step === "plus" && <LotusMotif />}
        {PROGRESS_LABEL[step] && <div className="rsvp-progress">{PROGRESS_LABEL[step]}</div>}
      </div>

      {step === "name" && (
        <div className="rsvp-section">
          <MonogramImg name="monogram-mark" alt="" className="step-monogram" />
          <h1>We&apos;d love to know if you can join us.</h1>
          <p className="subtitle">14&ndash;15 November 2027, Bengaluru, India.</p>
          <p className="rsvp-deadline">Please reply by {RSVP_DEADLINE_LABEL}</p>

          <div className="name-field">
            <label htmlFor="name" className="rsvp-label">
              Your name
            </label>
            <p className="rsvp-hint">Please include your first and last name.</p>
            <input
              type="text"
              id="name"
              maxLength={MAX_NAME_LENGTH}
              className="rsvp-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitName();
                }
              }}
              placeholder="e.g. Anjali Rao"
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
            />
            {nameError && <p className="rsvp-error">{nameError}</p>}
          </div>

          <button type="button" className="btn-primary" onClick={submitName}>
            Continue
          </button>
        </div>
      )}

      {step === "attend" && (
        <div className="rsvp-section">
          <p className="eyebrow">{firstName ? `Hello, ${firstName}` : "Hello"}</p>
          <h1>Will you be there?</h1>
          <p className="subtitle">14&ndash;15 November 2027, Bengaluru, India</p>
          <div className="response-group" style={{ marginTop: "clamp(30px,5vw,42px)", textAlign: "left" }}>
            <button
              type="button"
              className="response-option-btn"
              onClick={() => {
                setAttending("yes");
                goToStep("plus");
              }}
            >
              Yes, I&apos;ll be there
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
              Sorry, I can&apos;t make it
            </button>
          </div>
          <p className="rsvp-fine-note">If you&apos;re bringing someone, you can add them next.</p>
          <button type="button" className="link-back" onClick={() => goToStep("name")}>
            Go back
          </button>
        </div>
      )}

      {step === "plus" && (
        <div className="rsvp-section">
          <h1 className="plus-one-heading">Bringing someone with you?</h1>

          <div className="plus-one-grid">
            <label className="plus-one-option">
              <input
                type="radio"
                name="plusOne"
                value="yes"
                checked={plusOne === "yes"}
                onChange={() => setPlusOne("yes")}
              />
              <span>{plusOne === "yes" ? "✓  Yes" : "Yes"}</span>
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
              <span>Just me</span>
            </label>
          </div>

          {plusOne === "yes" && (
            <div className="plus-one-name-field">
              <label htmlFor="plusOneName" className="rsvp-label">
                Their name
              </label>
              <input
                type="text"
                id="plusOneName"
                maxLength={MAX_NAME_LENGTH}
                name="plusOneName"
                className="rsvp-input"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                placeholder="Their full name"
                autoCapitalize="words"
              />
            </div>
          )}

          {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

          <SubmitButton />
          <button type="button" className="link-back" onClick={() => goToStep("attend")}>
            Go back
          </button>
        </div>
      )}

      {step === "decline" && (
        <div className="rsvp-section">
          <h1>We&rsquo;ll miss you</h1>
          <p className="subtitle">
            Thank you for letting us know early. It really helps, and we completely
            understand.
          </p>

          {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

          <SubmitButton />
          <button type="button" className="link-back" onClick={() => goToStep("attend")}>
            I&apos;ve changed my mind
          </button>
        </div>
      )}
    </form>
  );
}
