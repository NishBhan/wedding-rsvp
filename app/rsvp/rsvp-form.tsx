"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { submitRsvp, RsvpState } from "./actions";
import { checkExistingRsvp, removeSelfAsPlusOne, ExistingMatch } from "./lookup-actions";
import OrnamentDivider from "../components/ornament-divider";
import CalendarCheckIcon from "../components/calendar-check-icon";
import { downloadWeddingIcs } from "@/lib/calendar";
import { RSVP_DEADLINE_LABEL } from "@/lib/site";
import type { Invite, InviteRsvp } from "@/lib/invites";

const initialState: RsvpState = { status: "idle" };

type Step = "name" | "attend" | "plus" | "accept" | "decline";

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending || disabled}>
      {pending ? "Sending..." : "Send my RSVP"}
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

type YesNo = "yes" | "no" | "";

const yesNo = (value: boolean | null | undefined): YesNo =>
  value === true ? "yes" : value === false ? "no" : "";

const firstNameOf = (fullName: string) => fullName.trim().split(" ")[0] || "";

// Shared link: name -> attend -> plus. Personal link with a plus-one
// allowed: attend -> plus (no name step). Solo and couple invites are a
// single question, so they get no step counter.
function progressLabel(step: Step, invite?: Invite) {
  if (!invite) {
    if (step === "name") return "RSVP · Step 1 of 3";
    if (step === "attend") return "RSVP · Step 2 of 3";
    if (step === "plus") return "RSVP · Step 3 of 3";
    return "";
  }
  if (invite.type === "plus_one") {
    if (step === "attend") return "RSVP · Step 1 of 2";
    if (step === "plus") return "RSVP · Step 2 of 2";
  }
  return "";
}

export default function RsvpForm({
  invite,
  existing = null,
}: {
  invite?: Invite;
  existing?: InviteRsvp | null;
} = {}) {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [step, setStep] = useState<Step>(invite ? "attend" : "name");
  const [name, setName] = useState(invite?.guestName ?? "");
  const [nameError, setNameError] = useState("");
  const [attending, setAttending] = useState<YesNo>(yesNo(existing?.attending));
  const [partnerAttending, setPartnerAttending] = useState<YesNo>(
    yesNo(existing?.partnerAttending)
  );
  const [plusOne, setPlusOne] = useState<YesNo>(existing ? yesNo(existing.plusOne) : "");
  const [plusOneName, setPlusOneName] = useState(existing?.plusOneName ?? "");
  const [weddingSaved, setWeddingSaved] = useState(false);

  // "You're already on the list" detection while typing on the name step.
  const [existingId, setExistingId] = useState<string | null>(null);
  const [match, setMatch] = useState<ExistingMatch | null>(null);
  const [matchDismissed, setMatchDismissed] = useState(false);
  const [plusOneResolution, setPlusOneResolution] = useState<
    "none" | "still-coming" | "removed"
  >("none");
  const [keptAnswer, setKeptAnswer] = useState(false);

  useEffect(() => {
    if (invite || step !== "name" || matchDismissed) return;
    const handle = setTimeout(() => {
      checkExistingRsvp(name).then((result) => {
        setMatch(result.kind === "none" ? null : result);
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [invite, name, step, matchDismissed]);

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

  const updateMyAnswer = () => {
    if (!match || match.kind !== "primary") return;
    setExistingId(match.id);
    setAttending(match.attending ? "yes" : "no");
    setPlusOne(match.plusOne ? "yes" : "no");
    setPlusOneName(match.plusOneName || "");
    setMatchDismissed(true);
    goToStep("attend");
  };

  const keepMyAnswer = () => {
    setMatchDismissed(true);
    setKeptAnswer(true);
  };

  // Invite names are written the way the guest is addressed ("Marc
  // Antoine", "Daan van Gestel"), so use them whole. A typed name on the
  // shared link is a full name, so greet by its first word.
  const firstName = invite ? invite.guestName : firstNameOf(name);
  const isCouple = invite?.type === "couple";
  const partnerFirstName = invite?.partnerName ?? "";
  const greetingNames = isCouple ? `${firstName} & ${partnerFirstName}` : firstName;
  const offersPlusOne = !invite || invite.type === "plus_one";

  if (keptAnswer) {
    return (
      <div className="rsvp-section confirmation">
        <img src="/assets/monogram-mark.png" alt="" className="monogram" />
        <h1>You&apos;re all set.</h1>
        <p>We already have your answer — no need to do anything else. You can close this.</p>
      </div>
    );
  }

  // --- "You're already down as {name}'s plus-one" branch ---
  if (
    step === "name" &&
    match &&
    match.kind === "plus_one" &&
    !matchDismissed &&
    plusOneResolution === "none"
  ) {
    const primaryFirstName = match.primaryName.split(" ")[0];
    return (
      <div className="rsvp-section">
        <div className="motif-row">
          <PairMotif />
        </div>
        <img src="/assets/monogram-mark.png" alt="" className="step-monogram" />
        <h1>Looks like you&apos;re already on the list.</h1>
        <p className="subtitle">
          You&apos;re down as {match.primaryName}&apos;s plus-one, and{" "}
          {match.attending
            ? `${primaryFirstName} said they'll be there.`
            : `${primaryFirstName} said they can't make it.`}
        </p>
        <div className="response-group" style={{ marginTop: "clamp(28px,5vw,40px)", textAlign: "left" }}>
          <button
            type="button"
            className="response-option-btn"
            onClick={() => setPlusOneResolution("still-coming")}
          >
            Still coming with them
          </button>
          <button
            type="button"
            className="response-option-btn outline"
            onClick={async () => {
              await removeSelfAsPlusOne(match.primaryId);
              setPlusOneResolution("removed");
            }}
          >
            Actually, I can&apos;t make it
          </button>
        </div>
        <button
          type="button"
          className="link-back"
          onClick={() => {
            setMatchDismissed(true);
            setMatch(null);
          }}
        >
          That&apos;s not me — I have a different name
        </button>
      </div>
    );
  }

  if (plusOneResolution === "still-coming") {
    return (
      <div className="rsvp-section confirmation">
        <img src="/assets/monogram-mark.png" alt="" className="monogram" />
        <h1>Wonderful — see you there!</h1>
        <p>You&apos;re all set. No need to do anything else — you can close this.</p>
      </div>
    );
  }

  if (plusOneResolution === "removed") {
    return (
      <div className="rsvp-section confirmation">
        <img src="/assets/monogram-mark.png" alt="" className="monogram" />
        <h1>Thanks for letting us know.</h1>
        <p>
          We&apos;ve updated {match && match.kind === "plus_one" ? match.primaryName : "their"}
          {"'"}s RSVP. You&apos;re all set — you can close this.
        </p>
      </div>
    );
  }

  // --- Post-submit confirmation ---
  if (state.status === "success") {
    const guestComing = attending === "yes";
    const partnerComing = isCouple && partnerAttending === "yes";
    const isAttending = guestComing || partnerComing;
    const hasPlusOne = guestComing && offersPlusOne && plusOne === "yes";

    let thanks = `Thank you, ${firstName || "friend"} — your place is saved.`;
    if (isCouple) {
      if (guestComing && partnerComing) {
        thanks = `Thank you, ${greetingNames} — your places are saved.`;
      } else {
        const coming = guestComing ? firstName : partnerFirstName;
        const missing = guestComing ? partnerFirstName : firstName;
        thanks = `Thank you — ${coming}'s place is saved. We'll miss ${missing}, but completely understand.`;
      }
    }

    return (
      <div className="rsvp-section confirmation">
        <OrnamentDivider />
        <img src="/assets/monogram-mark.png" alt="" className="monogram" />
        <h1>
          {isAttending
            ? "We're so excited to celebrate with you!"
            : "Thank you for letting us know."}
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
            ? thanks
            : "We’ll miss having you with us in Bengaluru, but completely understand. Thank you for telling us early."}
        </p>

        {hasPlusOne && (
          <div className="joining-panel">
            <span className="joining-label">JOINING YOU</span>
            <div className="joining-name">{plusOneName.trim() || "Name to be confirmed"}</div>
          </div>
        )}

        {isAttending && (
          <>
            <div className="details-panel">
              <div className="details-panel-label">YOU DON&rsquo;T NEED TO FIGURE OUT THE REST JUST YET</div>
              <p>
                The full agenda, along with accommodation, transport and dress guidance, is
                coming soon, so there&rsquo;s no need to book your travel just yet. If
                you&rsquo;re thinking of extending your trip into a longer holiday, we&rsquo;re
                happy to connect you with a travel desk to help plan it.
              </p>
            </div>
            <div className="calendar-link-row">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  downloadWeddingIcs();
                  setWeddingSaved(true);
                }}
                className="calendar-link"
              >
                Add the wedding to my calendar
                <CalendarCheckIcon />
              </a>
            </div>
            {weddingSaved && (
              <p className="saved-note">Saved — 14 to 16 November 2027 are held in your calendar.</p>
            )}
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
      {(step === "plus" || step === "accept" || step === "decline") && (
        <input type="hidden" name="attending" value={attending} />
      )}
      {existingId && <input type="hidden" name="existingId" value={existingId} />}
      {invite && <input type="hidden" name="inviteCode" value={invite.code} />}

      <div className="motif-row">
        {step === "name" && <TulipMotif />}
        {(step === "attend" || step === "decline") && <PairMotif />}
        {(step === "plus" || step === "accept") && <LotusMotif />}
        {progressLabel(step, invite) && (
          <div className="rsvp-progress">{progressLabel(step, invite)}</div>
        )}
      </div>

      {step === "name" && (
        <div className="rsvp-section">
          <img src="/assets/monogram-mark.png" alt="" className="step-monogram" />
          <h1>We&apos;d love to know if you can join us.</h1>
          <p className="subtitle">14&ndash;15 November 2027, Bengaluru, India.</p>
          <p className="rsvp-deadline">Kindly reply by {RSVP_DEADLINE_LABEL}</p>

          <div className="name-field">
            <label htmlFor="name" className="rsvp-label">
              Your name
            </label>
            <p className="rsvp-hint">Please include your first and last name.</p>
            <input
              type="text"
              id="name"
              className="rsvp-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setMatchDismissed(false);
                setExistingId(null);
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

          {match && match.kind === "primary" && !matchDismissed && (
            <div className="match-banner">
              <p>
                Looks like <strong>{match.name}</strong> already responded —{" "}
                {match.attending ? "you said you'll be there" : "you said you can't make it"}
                {match.attending && match.plusOne
                  ? `, with ${match.plusOneName || "a plus-one"}`
                  : ""}
                . Want to change it?
              </p>
              <div className="match-banner-actions">
                <button type="button" className="link-back match-banner-link" onClick={updateMyAnswer}>
                  Yes, update it
                </button>
                <button type="button" className="link-back match-banner-link" onClick={keepMyAnswer}>
                  No, that&apos;s correct
                </button>
              </div>
            </div>
          )}

          <button type="button" className="btn-primary" onClick={submitName}>
            Continue
          </button>
        </div>
      )}

      {step === "attend" && isCouple && (
        <div className="rsvp-section">
          <p className="eyebrow">Hello, {greetingNames}</p>
          <h1>Will you both be there?</h1>
          <p className="subtitle">14&ndash;15 November 2027, Bengaluru, India</p>
          <p className="rsvp-deadline">Kindly reply by {RSVP_DEADLINE_LABEL}</p>
          {existing && (
            <p className="rsvp-fine-note">
              You&apos;ve already replied. Change anything below and send it again.
            </p>
          )}

          {[
            { label: invite.guestName, field: "attending", value: attending, set: setAttending },
            {
              label: invite.partnerName ?? "",
              field: "partnerAttending",
              value: partnerAttending,
              set: setPartnerAttending,
            },
          ].map((person) => (
            <fieldset key={person.field} className="couple-person">
              <legend className="rsvp-label">{person.label}</legend>
              <div className="plus-one-grid couple-grid">
                <label className="plus-one-option">
                  <input
                    type="radio"
                    name={person.field}
                    value="yes"
                    checked={person.value === "yes"}
                    onChange={() => person.set("yes")}
                  />
                  <span>{person.value === "yes" ? "✓  Coming" : "Coming"}</span>
                </label>
                <label className="plus-one-option">
                  <input
                    type="radio"
                    name={person.field}
                    value="no"
                    checked={person.value === "no"}
                    onChange={() => person.set("no")}
                  />
                  <span>Can&apos;t make it</span>
                </label>
              </div>
            </fieldset>
          ))}

          {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

          <SubmitButton disabled={!attending || !partnerAttending} />
        </div>
      )}

      {step === "attend" && !isCouple && (
        <div className="rsvp-section">
          <p className="eyebrow">{firstName ? `Hello, ${firstName}` : "Hello"}</p>
          <h1>Will you be there?</h1>
          <p className="subtitle">14&ndash;15 November 2027, Bengaluru, India</p>
          {invite && <p className="rsvp-deadline">Kindly reply by {RSVP_DEADLINE_LABEL}</p>}
          <div className="response-group" style={{ marginTop: "clamp(30px,5vw,42px)", textAlign: "left" }}>
            <button
              type="button"
              className="response-option-btn"
              onClick={() => {
                setAttending("yes");
                goToStep(offersPlusOne ? "plus" : "accept");
              }}
            >
              Yes! I&apos;ll be there
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
              I&apos;m sorry, I can&apos;t make it
            </button>
          </div>
          {existing && (
            <p className="rsvp-fine-note">
              You&apos;ve already replied
              {existing.attending ? " that you'll be there" : " that you can't make it"}. Pick
              again to change it.
            </p>
          )}
          {offersPlusOne && (
            <p className="rsvp-fine-note">If you&apos;re bringing someone, you can add them next.</p>
          )}
          {!invite && (
            <button type="button" className="link-back" onClick={() => goToStep("name")}>
              Go back
            </button>
          )}
        </div>
      )}

      {step === "plus" && (
        <div className="rsvp-section">
          <h1 className="plus-one-heading">Bringing a plus one?</h1>

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
              <span>No, just me</span>
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

      {step === "accept" && (
        <div className="rsvp-section">
          <h1>Wonderful!</h1>
          <p className="subtitle">
            We can&rsquo;t wait to celebrate with you in Bengaluru. Send your RSVP and
            we&rsquo;ll save your place.
          </p>

          {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

          <SubmitButton />
          <button type="button" className="link-back" onClick={() => goToStep("attend")}>
            Go back
          </button>
        </div>
      )}

      {step === "decline" && (
        <div className="rsvp-section">
          <h1>We understand!</h1>
          <p className="subtitle">
            Thank you for letting us know early - it genuinely helps. We&rsquo;ll miss
            having you with us in Bengaluru, but completely understand.
          </p>

          {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

          <SubmitButton />
          <button type="button" className="link-back" onClick={() => goToStep("attend")}>
            I change my mind!
          </button>
        </div>
      )}
    </form>
  );
}
