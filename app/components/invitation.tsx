import SiteShell from "./site-shell";
import AnimatedMonogram from "./animated-monogram";
import OrnamentDivider from "./ornament-divider";
import HeroLandscape from "./hero-landscape";
import InviteRsvp from "../rsvp/[code]/invite-rsvp";
import { RSVP_DEADLINE_LABEL } from "@/lib/site";
import { inviteUrl, type Invite, type InviteRsvp as ExistingRsvp } from "@/lib/invites";

/* The invitation a guest sees when they open their personal link
   (/rsvp/<code>): the couple and the dates, then a short letter addressed
   to the guest by name, then the RSVP itself on the same page, then the
   planning note. The homepage (no name) is still the save-the-date. */
export default function Invitation({
  invite,
  existing,
}: {
  invite: Invite;
  existing: ExistingRsvp | null;
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
            Dear <strong>{names}</strong>,
          </p>
          <p>
            We&rsquo;re getting married in Bengaluru, and it wouldn&rsquo;t feel
            complete without you. We would love for you to spend two days and two
            nights celebrating with us.
          </p>
          <p>
            We know a trip to India is a big one, and not an easy thing to say yes to
            this far ahead. We also have venues and rooms to book for everyone, and the
            sooner we know who&rsquo;s coming, the better we can look after you when
            you&rsquo;re here. If you can, let us know by {RSVP_DEADLINE_LABEL}.
          </p>
          <p className="invite-signoff">
            With love,
            <br />
            Nishtha &amp; Wouter
          </p>
        </div>

        <InviteRsvp invite={invite} existing={existing} inviteLink={inviteUrl(invite.code)} />
      </section>

      <HeroLandscape />

      <section className="planning-note">
        <div className="planning-note-inner">
          <OrnamentDivider />
          <h2>A little note for your planning</h2>
          <p>
            We&rsquo;re celebrating over two days and two nights. Things begin on the
            afternoon of the 14th, from around 3 or 4pm, and carry on through the
            whole of the 15th.
          </p>
          <p>
            Please plan to arrive in Bengaluru by early afternoon on the 14th, stay
            with us for the nights of the 14th and the 15th, and set off home on the
            morning or early afternoon of the 16th.
          </p>
          <p className="planning-note-fine">
            The full agenda is on its way, along with details on where to stay,
            getting around, what to wear, and ideas for a holiday in India if
            you&rsquo;d like to make a longer trip of it.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
