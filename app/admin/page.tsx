import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { login, logout } from "./actions";
import { isAdminAuthed } from "@/lib/admin-auth";
import { inviteTypeOf, inviteUrl, InviteType } from "@/lib/invites";
import { DEFAULT_MESSAGE_TEMPLATE, MESSAGE_TEMPLATE_KEY } from "@/lib/invite-message";
import { MessageProvider, TemplateEditor } from "./invite-tools";
import { AddInviteButton } from "./invite-editor";
import { InvitesTable } from "./invites-table";
import { parseTier, tierLabel } from "@/lib/tiers";

type Rsvp = {
  id: string;
  name: string;
  attending: boolean;
  plus_one: boolean;
  plus_one_name: string | null;
  invite_id: string | null;
  partner_name: string | null;
  partner_attending: boolean | null;
  submitted_at: string;
};

type InviteRow = {
  id: string;
  code: string;
  guest_name: string;
  partner_name: string | null;
  plus_one_allowed: boolean;
  sent_at?: string | null;
  tier?: number | null;
};

const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  couple: "Couple",
  plus_one: "Single + 1",
  solo: "Single",
};

// Keep the dashboard out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; tier?: string; unsent?: string };
}) {
  if (!isAdminAuthed()) {
    return (
      <div className="page">
        <form action={login} className="login-form card">
          <p className="eyebrow">Admin</p>
          <h1 style={{ fontSize: 24 }}>RSVP dashboard</h1>
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          {searchParams.error && (
            <p className="error">Wrong password. Try again.</p>
          )}
          <button type="submit">Log in</button>
        </form>
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("submitted_at", { ascending: false });

  // sent_at and admin_settings only exist once the latest schema.sql has
  // been run. Until then the page still works, just without sent tracking.
  const INVITE_COLUMNS = "id, code, guest_name, partner_name, plus_one_allowed";
  const loadInvites = (columns: string) =>
    supabase.from("invites").select(columns).order("guest_name", { ascending: true });
  let sentTracking = true;
  let tiersEnabled = true;
  let invitesResult = await loadInvites(`${INVITE_COLUMNS}, sent_at, tier`);
  if (invitesResult.error) {
    tiersEnabled = false;
    invitesResult = await loadInvites(`${INVITE_COLUMNS}, sent_at`);
  }
  if (invitesResult.error) {
    sentTracking = false;
    invitesResult = await loadInvites(INVITE_COLUMNS);
  }
  const { data: inviteData, error: inviteError } = invitesResult;

  const { data: templateRow, error: templateError } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", MESSAGE_TEMPLATE_KEY)
    .maybeSingle();
  const template = (templateRow?.value as string | undefined) ?? DEFAULT_MESSAGE_TEMPLATE;

  const rsvps = (data as Rsvp[]) ?? [];
  const invites = (inviteData as unknown as InviteRow[] | null) ?? [];
  const rsvpByInvite = new Map(rsvps.filter((r) => r.invite_id).map((r) => [r.invite_id, r]));
  // Show names as they are now on the invite, not the copy saved with the
  // reply, so a name corrected in the invites table shows up everywhere.
  const inviteById = new Map(invites.map((i) => [i.id, i]));
  const guestNameOf = (r: Rsvp) => (r.invite_id && inviteById.get(r.invite_id)?.guest_name) || r.name;
  const partnerNameOf = (r: Rsvp) =>
    (r.invite_id && inviteById.get(r.invite_id)?.partner_name) || r.partner_name;

  // A shared-link reply (no invite) whose first name matches someone on the
  // invite list may be the same person replying twice, once by name and
  // once by personal link. Flag it so it can be checked by hand before
  // trusting the headcount.
  const firstWord = (name: string | null) =>
    (name ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .split(/\s+/)[0] ?? "";
  const possibleDuplicates = (r: Rsvp) => {
    const first = firstWord(r.name);
    if (!first) return [];
    return invites
      .filter((i) => firstWord(i.guest_name) === first || firstWord(i.partner_name) === first)
      .map((i) => (i.partner_name ? `${i.guest_name} & ${i.partner_name}` : i.guest_name));
  };

  // Every total counts people, not responses: the guest, their plus-one
  // (only if the guest is coming) and, on a couple invite, the partner,
  // whose answer is independent of the guest's.
  const peopleAttending = rsvps.reduce(
    (n, r) =>
      n +
      (r.attending ? 1 : 0) +
      (r.attending && r.plus_one ? 1 : 0) +
      (r.partner_attending === true ? 1 : 0),
    0
  );
  const peopleDeclining = rsvps.reduce(
    (n, r) => n + (r.attending ? 0 : 1) + (r.partner_attending === false ? 1 : 0),
    0
  );
  const awaitingCount = invites.filter((i) => !rsvpByInvite.has(i.id)).length;
  const sentCount = invites.filter((i) => i.sent_at).length;
  const inviteNames = (i: InviteRow) =>
    i.partner_name ? `${i.guest_name} & ${i.partner_name}` : i.guest_name;

  // Tiers: which batch each invite goes out in. The list below can show
  // one tier (?tier=2, or ?tier=none) and only invites not sent yet
  // (?unsent=1), so a batch can be worked through top to bottom.
  const tierOf = (i: InviteRow) => i.tier ?? null;
  const tiersInUse = Array.from(new Set(invites.map(tierOf).filter((t): t is number => t !== null))).sort();
  const hasUntiered = invites.some((i) => tierOf(i) === null);
  const tierGroups: (number | null)[] = [...tiersInUse, ...(hasUntiered ? [null] : [])];
  const tierFilter = !tiersEnabled || !searchParams.tier
    ? undefined
    : searchParams.tier === "none"
      ? null
      : parseTier(searchParams.tier);
  const unsentOnly = sentTracking && searchParams.unsent === "1";
  const shownInvites = invites.filter(
    (i) =>
      (tierFilter === undefined || tierFilter === "invalid" || tierOf(i) === tierFilter) &&
      (!unsentOnly || !i.sent_at)
  );
  const filterHref = (tier: number | null | undefined, unsent: boolean) => {
    const q = new URLSearchParams();
    if (tier !== undefined) q.set("tier", tier === null ? "none" : String(tier));
    if (unsent) q.set("unsent", "1");
    const qs = q.toString();
    return `/admin${qs ? `?${qs}` : ""}#invites`;
  };
  const activeTier = tierFilter === "invalid" ? undefined : tierFilter;

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h1>RSVPs</h1>
        <form action={logout}>
          <button type="submit" style={{ marginTop: 0 }}>
            Log out
          </button>
        </form>
      </div>

      {error && <p className="error">Could not load RSVPs: {error.message}</p>}
      {inviteError && <p className="error">Could not load invites: {inviteError.message}</p>}

      <div className="stats">
        <div className="stat">
          <span className="number">{peopleAttending}</span>
          <span className="label">People attending</span>
        </div>
        <div className="stat">
          <span className="number">{peopleDeclining}</span>
          <span className="label">People declining</span>
        </div>
        <div className="stat">
          <span className="number">{rsvps.length}</span>
          <span className="label">Responses</span>
        </div>
        <div className="stat">
          <span className="number">{awaitingCount}</span>
          <span className="label">Invites awaiting reply</span>
        </div>
        {sentTracking && (
          <div className="stat">
            <span className="number">
              {sentCount}/{invites.length}
            </span>
            <span className="label">Invites sent</span>
          </div>
        )}
      </div>

      {sentTracking && tiersEnabled && tierGroups.length > 0 && (
        <div className="tier-stats" aria-label="Invites sent by tier">
          {tierGroups.map((t) => {
            const inTier = invites.filter((i) => tierOf(i) === t);
            const sent = inTier.filter((i) => i.sent_at).length;
            return (
              <a
                key={t ?? "none"}
                href={filterHref(t, false)}
                className={`tier-stat${sent === inTier.length ? " is-done" : ""}`}
              >
                <strong>{tierLabel(t)}</strong> {sent}/{inTier.length} sent
              </a>
            );
          })}
        </div>
      )}

      <h2 id="invites" className="admin-section-title">Invites</h2>
      {(!sentTracking || !tiersEnabled || templateError) && (
        <p className="error" style={{ marginBottom: 16 }}>
          To save the message, tick off sent invites and use tiers, run the latest{" "}
          <code>supabase/schema.sql</code> in the Supabase SQL Editor, then refresh this page.
        </p>
      )}

      <MessageProvider template={template}>
        <div className="invites-toolbar">
          <AddInviteButton defaultTier={tiersEnabled ? (activeTier ?? null) : undefined} />
        </div>
        {(tiersEnabled || sentTracking) && (
          <nav className="invite-filters" aria-label="Filter invites">
            {tiersEnabled && (
              <div className="filter-tabs">
                <a
                  href={filterHref(undefined, unsentOnly)}
                  aria-current={activeTier === undefined ? "page" : undefined}
                >
                  All ({invites.length})
                </a>
                {tierGroups.map((t) => (
                  <a
                    key={t ?? "none"}
                    href={filterHref(t, unsentOnly)}
                    aria-current={activeTier === t ? "page" : undefined}
                  >
                    {tierLabel(t)} ({invites.filter((i) => tierOf(i) === t).length})
                  </a>
                ))}
              </div>
            )}
            {sentTracking && (
              <a
                className="filter-toggle"
                href={filterHref(activeTier, !unsentOnly)}
                data-on={unsentOnly ? "true" : undefined}
              >
                <span aria-hidden="true">{unsentOnly ? "☑" : "☐"}</span> Not sent yet only
              </a>
            )}
          </nav>
        )}
        <InvitesTable
          total={invites.length}
          tiersEnabled={tiersEnabled}
          sentTracking={sentTracking}
          emptyMessage={unsentOnly ? "Everyone here has been sent their invite." : "No invites here yet."}
          rows={shownInvites.map((i) => ({
            id: i.id,
            url: inviteUrl(i.code),
            names: inviteNames(i),
            guestName: i.guest_name,
            partnerName: i.partner_name,
            type: inviteTypeOf(i),
            typeLabel: INVITE_TYPE_LABEL[inviteTypeOf(i)],
            tier: tierOf(i),
            sent: Boolean(i.sent_at),
            replied: rsvpByInvite.has(i.id),
          }))}
        />
      </MessageProvider>
      <p className="admin-help" style={{ marginTop: 12 }}>
        Use <strong>Edit</strong> to fix a name or change between Single, Single + 1 and Couple.
        You&rsquo;ll see exactly what changes before anything is saved, and the guest&rsquo;s link
        never changes.
      </p>

      <h2 className="admin-section-title">Replies</h2>
      <a className="export-link" href="/admin/export">
        Download CSV
      </a>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Attending</th>
              <th>Plus One / Partner</th>
              <th>Via</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id}>
                <td>{guestNameOf(r)}</td>
                <td>
                  <span className={`badge ${r.attending ? "yes" : "no"}`}>
                    {r.attending ? "Yes" : "No"}
                  </span>
                </td>
                <td>
                  {partnerNameOf(r)
                    ? `${partnerNameOf(r)}: ${r.partner_attending ? "Yes" : "No"}`
                    : r.plus_one
                      ? r.plus_one_name || "Unnamed"
                      : "-"}
                </td>
                <td>
                  {r.invite_id ? (
                    "Personal link"
                  ) : possibleDuplicates(r).length > 0 ? (
                    <>
                      Shared link.{" "}
                      <strong>Possible duplicate of: {possibleDuplicates(r).join("; ")}</strong>
                    </>
                  ) : (
                    "Shared link"
                  )}
                </td>
                <td>{new Date(r.submitted_at).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="admin-section-title">Invite message</h2>
      <TemplateEditor template={template} enabled={!templateError} />
    </div>
  );
}
