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
import { roomKey } from "@/lib/rooms";

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
  room?: string | null;
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
  searchParams: {
    error?: string;
    tier?: string;
    unsent?: string;
    noroom?: string;
    type?: string;
    show?: string;
  };
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

  // sent_at, tier and room each exist once the matching line of
  // schema.sql has been run. Until then the page works without that part.
  const INVITE_COLUMNS = "id, code, guest_name, partner_name, plus_one_allowed";
  const hasColumn = async (column: string) =>
    !(await supabase.from("invites").select(column).limit(1)).error;
  const [sentTracking, tiersEnabled, roomsEnabled] = await Promise.all([
    hasColumn("sent_at"),
    hasColumn("tier"),
    hasColumn("room"),
  ]);
  const columns = [
    INVITE_COLUMNS,
    sentTracking && "sent_at",
    tiersEnabled && "tier",
    roomsEnabled && "room",
  ]
    .filter(Boolean)
    .join(", ");
  const { data: inviteData, error: inviteError } = await supabase
    .from("invites")
    .select(columns)
    .order("guest_name", { ascending: true });

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
  const activeTier = tierFilter === "invalid" ? undefined : tierFilter;

  // Rooms: how many people on each invite are coming (0 if they've said no,
  // null if they haven't replied), and who still needs a room.
  const comingOn = (i: InviteRow) => {
    const r = rsvpByInvite.get(i.id);
    if (!r) return null;
    return (r.attending ? 1 : 0) + (r.attending && r.plus_one ? 1 : 0) + (r.partner_attending === true ? 1 : 0);
  };
  const needsRoom = (i: InviteRow) => !i.room && (comingOn(i) ?? 0) > 0;
  const needsRoomCount = roomsEnabled ? invites.filter(needsRoom).length : 0;
  const noRoomOnly = roomsEnabled && searchParams.noroom === "1";

  // Type (?type=couple, plus_one or solo) and reply status. By default the
  // list leaves out invites where nobody is coming; ?show=declined shows
  // just those, ?show=all shows everyone.
  const INVITE_TYPES: InviteType[] = ["couple", "plus_one", "solo"];
  const typeFilter = INVITE_TYPES.find((t) => t === searchParams.type);
  const show: "active" | "declined" | "all" =
    searchParams.show === "declined" || searchParams.show === "all" ? searchParams.show : "active";
  const declined = (i: InviteRow) => comingOn(i) === 0;
  const matchesShow = (i: InviteRow) =>
    show === "all" ? true : show === "declined" ? declined(i) : !declined(i);

  const shownInvites = invites.filter(
    (i) =>
      (tierFilter === undefined || tierFilter === "invalid" || tierOf(i) === tierFilter) &&
      (!unsentOnly || !i.sent_at) &&
      (!noRoomOnly || needsRoom(i)) &&
      (!typeFilter || inviteTypeOf(i) === typeFilter) &&
      matchesShow(i)
  );
  type View = {
    tier: number | null | undefined;
    unsent: boolean;
    noRoom: boolean;
    type: InviteType | undefined;
    show: "active" | "declined" | "all";
  };
  const hrefWith = (changes: Partial<View>) => {
    const v: View = {
      tier: activeTier,
      unsent: unsentOnly,
      noRoom: noRoomOnly,
      type: typeFilter,
      show,
      ...changes,
    };
    const q = new URLSearchParams();
    if (v.tier !== undefined) q.set("tier", v.tier === null ? "none" : String(v.tier));
    if (v.unsent) q.set("unsent", "1");
    if (v.noRoom) q.set("noroom", "1");
    if (v.type) q.set("type", v.type);
    if (v.show !== "active") q.set("show", v.show);
    const qs = q.toString();
    return `/admin${qs ? `?${qs}` : ""}#invites`;
  };
  const filterHref = (tier: number | null | undefined, unsent: boolean, noRoom = noRoomOnly) =>
    hrefWith({ tier, unsent, noRoom });

  // Rooms summary: every room in use, who's in it and how many are coming.
  const rooms = new Map<string, { name: string; invites: InviteRow[] }>();
  for (const i of invites) {
    if (!i.room) continue;
    const key = roomKey(i.room);
    if (!rooms.has(key)) rooms.set(key, { name: i.room, invites: [] });
    rooms.get(key)!.invites.push(i);
  }
  const roomList = Array.from(rooms.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "en", { numeric: true })
  );
  const roomNames = roomList.map((r) => r.name);

  // The exact SQL still needed for any feature that's switched off.
  const missingSql = [
    !sentTracking && "alter table invites add column if not exists sent_at timestamptz;",
    templateError &&
      "create table if not exists admin_settings (\n  key text primary key,\n  value text not null,\n  updated_at timestamptz not null default now()\n);\nalter table admin_settings enable row level security;",
    !tiersEnabled && "alter table invites add column if not exists tier smallint check (tier between 1 and 9);",
    !roomsEnabled && "alter table invites add column if not exists room text check (char_length(room) <= 60);",
  ].filter((line): line is string => Boolean(line));

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
      {missingSql.length > 0 && (
        <div className="error" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0 }}>
            Some features are switched off until the database is updated. Run this in the Supabase
            SQL Editor, then refresh this page. It only adds things; no replies or guests are
            touched.
          </p>
          <pre className="sql-snippet">{missingSql.join("\n\n")}</pre>
        </div>
      )}

      <MessageProvider template={template}>
        <div className="invites-toolbar">
          <AddInviteButton defaultTier={tiersEnabled ? (activeTier ?? null) : undefined} />
        </div>
        <nav className="invite-filters" aria-label="Filter by reply and type">
          <div className="filter-tabs">
            {(
              [
                ["active", "Coming or not replied", invites.filter((i) => !declined(i)).length],
                ["declined", "Not coming", invites.filter(declined).length],
                ["all", "Everyone", invites.length],
              ] as const
            ).map(([value, label, count]) => (
              <a key={value} href={hrefWith({ show: value })} aria-current={show === value ? "page" : undefined}>
                {label} ({count})
              </a>
            ))}
          </div>
          <div className="filter-tabs">
            <a href={hrefWith({ type: undefined })} aria-current={!typeFilter ? "page" : undefined}>
              All types
            </a>
            {(
              [
                ["couple", "Couples"],
                ["plus_one", "Singles + 1"],
                ["solo", "Singles"],
              ] as const
            ).map(([value, label]) => (
              <a key={value} href={hrefWith({ type: value })} aria-current={typeFilter === value ? "page" : undefined}>
                {label} ({invites.filter((i) => inviteTypeOf(i) === value).length})
              </a>
            ))}
          </div>
        </nav>
        {(tiersEnabled || sentTracking || roomsEnabled) && (
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
            {roomsEnabled && (
              <a
                className="filter-toggle"
                href={filterHref(activeTier, unsentOnly, !noRoomOnly)}
                data-on={noRoomOnly ? "true" : undefined}
              >
                <span aria-hidden="true">{noRoomOnly ? "☑" : "☐"}</span> Coming, no room yet (
                {needsRoomCount})
              </a>
            )}
          </nav>
        )}
        <InvitesTable
          total={invites.length}
          tiersEnabled={tiersEnabled}
          sentTracking={sentTracking}
          roomsEnabled={roomsEnabled}
          roomNames={roomNames}
          emptyMessage={
            show === "declined"
              ? "No one here has said they can't come."
              : noRoomOnly
              ? "Everyone coming has a room."
              : unsentOnly
                ? "Everyone here has been sent their invite."
                : "No invites here yet."
          }
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
            coming: comingOn(i),
            room: i.room ?? null,
          }))}
        />
      </MessageProvider>
      <p className="admin-help" style={{ marginTop: 12 }}>
        Use <strong>Edit</strong> to fix a name or change between Single, Single + 1 and Couple.
        You&rsquo;ll see exactly what changes before anything is saved, and the guest&rsquo;s link
        never changes.
      </p>

      {roomsEnabled && (
        <>
          <h2 id="rooms" className="admin-section-title">
            Rooms
          </h2>
          <p className="admin-help">
            {roomList.length} {roomList.length === 1 ? "room" : "rooms"} in use,{" "}
            {roomList.reduce((n, r) => n + r.invites.reduce((m, i) => m + (comingOn(i) ?? 0), 0), 0)} people
            placed. {needsRoomCount > 0 ? (
              <a href={filterHref(undefined, false, true)}>
                {needsRoomCount} {needsRoomCount === 1 ? "invite" : "invites"} coming without a room
              </a>
            ) : (
              "Everyone coming has a room."
            )}
          </p>
          {roomList.length > 0 && (
            <div className="table-scroll">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>People coming</th>
                    <th>Who</th>
                  </tr>
                </thead>
                <tbody>
                  {roomList.map((room) => (
                    <tr key={room.name}>
                      <td className="invite-names">{room.name}</td>
                      <td>{room.invites.reduce((n, i) => n + (comingOn(i) ?? 0), 0)}</td>
                      <td>
                        {room.invites
                          .map((i) => {
                            const c = comingOn(i);
                            const status = c === null ? "not replied" : c === 0 ? "not coming" : `${c} coming`;
                            return `${inviteNames(i)} (${status})`;
                          })
                          .join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

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
