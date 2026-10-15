import SiteShell from "./site-shell";
import AnimatedMonogram from "./animated-monogram";
import OrnamentDivider from "./ornament-divider";
import HeroLandscape from "./hero-landscape";
import PlanningNote from "./planning-note";
import InviteRsvp from "../rsvp/[code]/invite-rsvp";
import { RSVP_DEADLINE_LABEL } from "@/lib/site";
import { inviteUrl, type Invite, type InviteRsvp as ExistingRsvp } from "@/lib/invites";

// The letter's first paragraph, written for each kind of invite: a couple
// is invited together, and a guest who may bring someone hears so up front
// rather than discovering it halfway through the RSVP.
const OPENING: Record<Invite["type"], string> = {
  couple:
    "We’re getting married in Bengaluru, and it wouldn’t feel complete without you both. We would love for you to spend two days and two nights celebrating with us.",
  plus_one:
    "We’re getting married in Bengaluru, and it wouldn’t feel complete without you. We would love for you to spend two days and two nights celebrating with us, and you’re very welcome to bring someone with you.",
  solo:
    "We’re getting married in Bengaluru, and it wouldn’t feel complete without you. We would love for you to spend two days and two nights celebrating with us.",
};

/* The invitation a guest sees when they open their personal link
   (/rsvp/<code>): the couple and the dates, then a short letter addressed
   to the guest by name, then the RSVP itself on the same page, then the
   planning note. The homepage (no name) is still the save-the-date. */
export default function Invitation({
  invite,
  existing,
  closed,
}: {
  invite: Invite;
  existing: ExistingRsvp | null;
  closed: boolean;
}) {
  const names = invite.partnerName
    ? `${invite.guestName} & ${invite.partnerName}`
    : invite.guestName;

  return (
    <SiteShell showArch={false}>
      <section className="hero">
        <p className="eyebrow hero-eyebrow">You&rsquo;re invited</p>

        <div className="hero-monogram">
          <AnimatedMonogram />
        </div>

        <h1 className="hero-names">
          Nishtha <span className="amp">&amp;</span> Wouter
        </h1>

        <div className="hero-dates">
          14<span className="dash">&ndash;</span>15
        </div>
        <div className="hero-month">NOVEMBER 2027</div>

        <OrnamentDivider hero />

        <div className="hero-location">BENGALURU, INDIA</div>

        <div className="invite-letter">
          <p className="invite-salutation">
            {existing && !closed ? "Welcome back," : "Dear"}{" "}
            <strong translate="no">{names}</strong>,
          </p>
          <p>{OPENING[invite.type]}</p>
          <p>
            We know a trip to India is a big one, and not an easy thing to say yes to
            this far ahead. We also have venues and rooms to book for everyone, and the
            sooner we know who&rsquo;s coming, the better we can look after you when
            you&rsquo;re here.{!closed && ` If you can, let us know by ${RSVP_DEADLINE_LABEL}.`}
          </p>
          <p className="invite-signoff">
            With love,
            <br />
            Nishtha &amp; Wouter
          </p>
        </div>

        <InviteRsvp
          invite={invite}
          existing={existing}
          inviteLink={inviteUrl(invite.code)}
          closed={closed}
        />
      </section>

      <HeroLandscape />

      <PlanningNote />
    </SiteShell>
  );
}
