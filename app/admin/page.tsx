import { createAdminClient } from "@/lib/supabase/admin";
import { login, logout } from "./actions";
import { isAdminAuthed } from "@/lib/admin-auth";
import { inviteTypeOf, inviteUrl, InviteType } from "@/lib/invites";

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
};

const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  couple: "Couple",
  plus_one: "Single + 1",
  solo: "Single",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string };
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

  const { data: inviteData, error: inviteError } = await supabase
    .from("invites")
    .select("id, code, guest_name, partner_name, plus_one_allowed")
    .order("guest_name", { ascending: true });

  const rsvps = (data as Rsvp[]) ?? [];
  const invites = (inviteData as InviteRow[]) ?? [];
  const rsvpByInvite = new Map(rsvps.filter((r) => r.invite_id).map((r) => [r.invite_id, r]));

  // "Attending" counts responses where anyone on them is coming; headcount
  // counts people (guest + plus-one + named partner).
  const attendingCount = rsvps.filter((r) => r.attending || r.partner_attending).length;
  const declinedCount = rsvps.length - attendingCount;
  const plusOnesCount = rsvps.filter((r) => r.attending && r.plus_one).length;
  const partnersCount = rsvps.filter((r) => r.partner_attending).length;
  const headcount =
    rsvps.filter((r) => r.attending).length + plusOnesCount + partnersCount;
  const awaitingCount = invites.filter((i) => !rsvpByInvite.has(i.id)).length;

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
          <span className="number">{rsvps.length}</span>
          <span className="label">Responses</span>
        </div>
        <div className="stat">
          <span className="number">{attendingCount}</span>
          <span className="label">Attending</span>
        </div>
        <div className="stat">
          <span className="number">{declinedCount}</span>
          <span className="label">Declined</span>
        </div>
        <div className="stat">
          <span className="number">{headcount}</span>
          <span className="label">Total headcount</span>
        </div>
        <div className="stat">
          <span className="number">{awaitingCount}</span>
          <span className="label">Invites awaiting reply</span>
        </div>
      </div>

      <a className="export-link" href="/admin/export">
        Download CSV
      </a>

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
              <td>{r.name}</td>
              <td>
                <span className={`badge ${r.attending ? "yes" : "no"}`}>
                  {r.attending ? "Yes" : "No"}
                </span>
              </td>
              <td>
                {r.partner_name
                  ? `${r.partner_name}: ${r.partner_attending ? "Yes" : "No"}`
                  : r.plus_one
                    ? r.plus_one_name || "Unnamed"
                    : "-"}
              </td>
              <td>{r.invite_id ? "Personal link" : "Shared link (unmatched)"}</td>
              <td>{new Date(r.submitted_at).toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 48 }}>Invites</h2>
      <p>
        Add or edit invites in the Supabase <code>invites</code> table. Fill in{" "}
        <code>partner_name</code> for a couple, tick <code>plus_one_allowed</code> for a single
        guest who may bring someone, or leave both empty for a single guest.
      </p>
      <table>
        <thead>
          <tr>
            <th>Invited</th>
            <th>Type</th>
            <th>Personal link</th>
            <th>Replied</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((i) => {
            const url = inviteUrl(i.code);
            return (
              <tr key={i.id}>
                <td>{i.partner_name ? `${i.guest_name} & ${i.partner_name}` : i.guest_name}</td>
                <td>{INVITE_TYPE_LABEL[inviteTypeOf(i)]}</td>
                <td>
                  <a href={url}>{url}</a>
                </td>
                <td>
                  <span className={`badge ${rsvpByInvite.has(i.id) ? "yes" : "no"}`}>
                    {rsvpByInvite.has(i.id) ? "Yes" : "Not yet"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
