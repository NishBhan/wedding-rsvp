"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { submitRsvp, RsvpState } from "../actions";
import AttendingDetails from "../../components/attending-details";
import OrnamentDivider from "../../components/ornament-divider";
import CalendarCheckIcon from "../../components/calendar-check-icon";
import { RSVP_DEADLINE_LABEL, rsvpReminderCalendarUrl } from "@/lib/site";
import type { Invite, InviteRsvp } from "@/lib/invites";

type YesNo = "yes" | "no" | "";

const yesNo = (value: boolean | null | undefined): YesNo =>
  value === true ? "yes" : value === false ? "no" : "";

const initialState: RsvpState = { status: "idle" };

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending || disabled}>
      {pending ? "Sending..." : "Send my reply"}
    </button>
  );
}

function Choice({
  name,
  value,
  current,
  onSelect,
  label,
}: {
  name: string;
  value: "yes" | "no";
  current: YesNo;
  onSelect: (v: "yes" | "no") => void;
  label: string;
}) {
  return (
    <label className="plus-one-option">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onSelect(value)}
      />
      <span>{current === value ? `✓  ${label}` : label}</span>
    </label>
  );
}

/* The whole RSVP for a personal invite link, on one page: pick an answer
   (and a plus-one, or each person's answer for a couple), then send. The
   confirmation replaces the form in place. Reopening the link pre-fills the
   last answer, and sending again updates it. */
export default function InviteRsvp({
  invite,
  existing,
  inviteLink,
}: {
  invite: Invite;
  existing: InviteRsvp | null;
  inviteLink: string;
}) {
  const [state, formAction] = useFormState(submitRsvp, initialState);
  const [attending, setAttending] = useState<YesNo>(yesNo(existing?.attending));
  const [partnerAttending, setPartnerAttending] = useState<YesNo>(
    yesNo(existing?.partnerAttending)
  );
  const [plusOne, setPlusOne] = useState<YesNo>(existing ? yesNo(existing.plusOne) : "");
  const [plusOneName, setPlusOneName] = useState(existing?.plusOneName ?? "");
  const sectionRef = useRef<HTMLElement>(null);

  const isCouple = invite.type === "couple";
  const allowsPlusOne = invite.type === "plus_one";
  const guest = invite.guestName;
  const partner = invite.partnerName ?? "";

  useEffect(() => {
    if (state.status === "success") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.status]);

  if (state.status === "success") {
    const guestComing = attending === "yes";
    const partnerComing = isCouple && partnerAttending === "yes";
    const anyoneComing = guestComing || partnerComing;
    const bothComing = isCouple ? guestComing && partnerComing : guestComing;
    const bringingSomeone = allowsPlusOne && guestComing && plusOne === "yes";

    let heading: string;
    let body: string;
    if (bothComing) {
      heading = "We can’t wait to celebrate with you!";
      body = isCouple
        ? `Thank you, ${guest} & ${partner}. Your places are saved, and we’re so happy you’ll be with us in Bengaluru.`
        : `Thank you, ${guest}. Your place is saved, and we’re so happy you’ll be with us in Bengaluru.`;
    } else if (anyoneComing) {
      const coming = guestComing ? guest : partner;
      const missing = guestComing ? partner : guest;
      heading = `We can’t wait to celebrate with you, ${coming}!`;
      body = `Your place is saved. We’ll miss you, ${missing}, and we completely understand. We’ll raise a glass to you from Bengaluru.`;
    } else {
      const who = isCouple ? `${guest} & ${partner}` : guest;
      heading = `We’ll miss you, ${who}.`;
      body =
        "We’re so sorry you can’t be with us, and we completely understand. You’ll be in our hearts on the day, and we’ll raise a glass to you from Bengaluru. Thank you for letting us know.";
    }

    return (
      <section ref={sectionRef} id="rsvp" className="invite-rsvp confirmation">
        <OrnamentDivider />
        <h2 className="invite-rsvp-heading">{heading}</h2>
        <p>{body}</p>
        {bringingSomeone && (
          <div className="joining-panel">
            <span className="joining-label">JOINING YOU</span>
            <div className="joining-name">{plusOneName.trim()}</div>
          </div>
        )}
        {anyoneComing && <AttendingDetails />}
        <p className="rsvp-fine-note">
          Plans change, and that&rsquo;s alright. You can come back to this link and update
          your reply until {RSVP_DEADLINE_LABEL}.
        </p>
      </section>
    );
  }

  const ready = isCouple
    ? attending !== "" && partnerAttending !== ""
    : attending !== "" && (!allowsPlusOne || attending === "no" || plusOne !== "");

  return (
    <section ref={sectionRef} id="rsvp" className="invite-rsvp">
      <OrnamentDivider />
      <h2 className="invite-rsvp-heading">
        {isCouple ? "Will you both join us?" : "Will you join us?"}
      </h2>
      <p className="rsvp-deadline">Kindly reply by {RSVP_DEADLINE_LABEL}</p>
      {existing && (
        <p className="rsvp-fine-note">
          You&apos;ve already replied, thank you. You can change your answer below.
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="inviteCode" value={invite.code} />

        {isCouple ? (
          [
            { label: guest, field: "attending", value: attending, set: setAttending },
            { label: partner, field: "partnerAttending", value: partnerAttending, set: setPartnerAttending },
          ].map((person) => (
            <fieldset key={person.field} className="couple-person">
              <legend className="rsvp-label">{person.label}</legend>
              <div className="plus-one-grid couple-grid">
                <Choice name={person.field} value="yes" current={person.value} onSelect={person.set} label="Coming" />
                <Choice name={person.field} value="no" current={person.value} onSelect={person.set} label="Can’t make it" />
              </div>
            </fieldset>
          ))
        ) : (
          <div className="plus-one-grid invite-answer-grid">
            <Choice name="attending" value="yes" current={attending} onSelect={setAttending} label="Yes, I’ll be there" />
            <Choice
              name="attending"
              value="no"
              current={attending}
              onSelect={(v) => {
                setAttending(v);
                setPlusOne("");
              }}
              label="Sadly, I can’t"
            />
          </div>
        )}

        {allowsPlusOne && attending === "yes" && (
          <div className="invite-plus-one">
            <p className="rsvp-label">Bringing someone with you?</p>
            <div className="plus-one-grid couple-grid">
              <Choice name="plusOne" value="yes" current={plusOne} onSelect={setPlusOne} label="Yes" />
              <Choice
                name="plusOne"
                value="no"
                current={plusOne}
                onSelect={(v) => {
                  setPlusOne(v);
                  setPlusOneName("");
                }}
                label="Just me"
              />
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
          </div>
        )}

        {state.status === "error" && <p className="rsvp-error">{state.message}</p>}

        <div className="invite-send">
          <SendButton disabled={!ready} />
        </div>
      </form>

      {!existing && (
        <div className="hero-reminder invite-reminder">
          <p>
            Need a little time to decide? Add a reminder for the{" "}
            <a
              href={rsvpReminderCalendarUrl(inviteLink)}
              target="_blank"
              rel="noopener"
              className="calendar-link"
            >
              RSVP to your calendar
              <CalendarCheckIcon />
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}
