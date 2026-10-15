"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/site";
import type { RsvpState } from "../actions";
import { safeSubmitRsvp } from "../safe-submit";
import AttendingDetails from "../../components/attending-details";
import OrnamentDivider from "../../components/ornament-divider";
import FishLeap from "../../components/fish-leap";
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

// The reply we have for this invite, in a sentence, for returning guests
// and for the closed view.
function replySummary(existing: InviteRsvp, invite: Invite) {
  const guest = invite.guestName;
  const partner = invite.partnerName ?? "";
  if (invite.type === "couple") {
    const a = existing.attending;
    const b = existing.partnerAttending === true;
    if (a && b) return "You’re both coming.";
    if (!a && !b) return "You’ve both let us know you can’t make it.";
    return `${a ? guest : partner} is coming, and ${a ? partner : guest} can’t make it.`;
  }
  if (!existing.attending) return "You’ve let us know you can’t make it.";
  return existing.plusOne && existing.plusOneName
    ? `You’re coming, with ${existing.plusOneName}.`
    : "You’re coming.";
}

/* One stable <section> for every state (form, confirmation, closed). Each
   state is a keyed <div>, so switching state swaps that whole <div> rather
   than editing text nodes one by one. That matters because browser
   translation (Chrome, Safari) replaces page text with its own nodes, and
   React crashed ("removeChild") when it later tried to remove text nodes
   that translation had already moved. */
function RsvpSection({
  sectionRef,
  confirmation = false,
  children,
}: {
  sectionRef: React.RefObject<HTMLElement>;
  confirmation?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      id="rsvp"
      className={confirmation ? "invite-rsvp confirmation" : "invite-rsvp"}
    >
      {children}
    </section>
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
  closed,
}: {
  invite: Invite;
  existing: InviteRsvp | null;
  inviteLink: string;
  closed: boolean;
}) {
  const [state, formAction] = useFormState(safeSubmitRsvp, initialState);
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
    if (state.status === "success" || state.closed) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.status, state.closed]);

  if (closed || state.closed) {
    const summary = existing ? replySummary(existing, invite) : null;
    const coming = Boolean(existing && (existing.attending || existing.partnerAttending));
    // After the deadline the heading follows the reply: guests who are
    // coming are simply told we'll see them; everyone else hears that
    // replies have closed, kindly.
    const closedHeading = coming && !state.closed ? "See you in Bengaluru" : "Replies have now closed";
    return (
      <RsvpSection sectionRef={sectionRef} confirmation>
        <div key="closed">
          <OrnamentDivider />
          <h2 className="invite-rsvp-heading">{closedHeading}</h2>
          {state.closed && <p className="rsvp-error">{state.message}</p>}
          <p>{summary ?? "We didn’t receive a reply from you before replies closed."}</p>
          {!state.closed && (
            <p className="rsvp-fine-note">
              If anything has changed, please message Nishtha or Wouter directly and
              we&rsquo;ll sort it out together.
            </p>
          )}
        </div>
      </RsvpSection>
    );
  }

  if (state.status === "success") {
    // For couples, trust what was saved: it may include the partner's own
    // change made from their phone.
    const guestComing = state.saved ? state.saved.attending : attending === "yes";
    const partnerComing = isCouple && (state.saved ? state.saved.partnerAttending === true : partnerAttending === "yes");
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
      body = `Your place is saved. ${missing}, we’ll miss you, and there will be a glass raised to you in Bengaluru.`;
    } else {
      const who = isCouple ? `${guest} & ${partner}` : guest;
      heading = `We’ll miss you, ${who}.`;
      body =
        "Thank you for telling us, and for telling us early. You’ll be in our hearts on the day, and there will be a glass raised to you in Bengaluru.";
    }

    return (
      <RsvpSection sectionRef={sectionRef} confirmation>
        <div key="done">
          {anyoneComing ? <FishLeap /> : <OrnamentDivider />}
          <h2 className="invite-rsvp-heading">{heading}</h2>
          <p>{body}</p>
          {bringingSomeone && (
            <div className="joining-panel">
              <span className="joining-label">JOINING YOU</span>
              <div className="joining-name" translate="no">
                {plusOneName.trim()}
              </div>
            </div>
          )}
          {anyoneComing && <AttendingDetails />}
          <p className="rsvp-fine-note">
            {`Plans change, and that’s alright. You can come back to this link and update your reply on or before ${RSVP_DEADLINE_LABEL}.`}
          </p>
        </div>
      </RsvpSection>
    );
  }

  const ready = isCouple
    ? attending !== "" && partnerAttending !== ""
    : attending !== "" && (!allowsPlusOne || attending === "no" || plusOne !== "");

  return (
    <RsvpSection sectionRef={sectionRef}>
      <div key="form">
        <OrnamentDivider />
        <h2 className="invite-rsvp-heading">
          {existing ? "Your reply" : isCouple ? "Will you both join us?" : "Will you join us?"}
        </h2>
        <p className="rsvp-deadline">
          {existing
            ? `You can change your reply on or before ${RSVP_DEADLINE_LABEL}`
            : `Kindly reply by ${RSVP_DEADLINE_LABEL}`}
        </p>
        {existing && (
          <p className="rsvp-fine-note">
            {`${replySummary(existing, invite)} Nothing to do unless your plans have changed.`}
          </p>
        )}

        <form action={formAction}>
          <input type="hidden" name="inviteCode" value={invite.code} />
          {isCouple && (
            <input
              type="hidden"
              name="changed"
              value={[
                attending !== yesNo(existing?.attending) && "attending",
                partnerAttending !== yesNo(existing?.partnerAttending) && "partnerAttending",
              ]
                .filter(Boolean)
                .join(",")}
            />
          )}

          {isCouple ? (
            [
              { label: guest, field: "attending", value: attending, set: setAttending },
              { label: partner, field: "partnerAttending", value: partnerAttending, set: setPartnerAttending },
            ].map((person) => (
              <fieldset key={person.field} className="couple-person">
                <legend className="rsvp-label" translate="no">
                  {person.label}
                </legend>
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
              <a href={`/calendar/rsvp-reminder.ics?code=${invite.code}`} className="calendar-link">
                RSVP to your calendar
                <CalendarCheckIcon />
              </a>{" "}
              (or{" "}
              <a href={rsvpReminderCalendarUrl(inviteLink)} target="_blank" rel="noopener" className="calendar-link">
                Google Calendar
              </a>
              ).
            </p>
          </div>
        )}
      </div>
    </RsvpSection>
  );
}
