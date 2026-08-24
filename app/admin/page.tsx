import { createAdminClient } from "@/lib/supabase/admin";
import { login, logout } from "./actions";
import { isAdminAuthed } from "@/lib/admin-auth";

type Rsvp = {
  id: string;
  name: string;
  attending: boolean;
  plus_one: boolean;
  plus_one_name: string | null;
  submitted_at: string;
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
            <input type="text" id="password" name="password" required />
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

  const rsvps = (data as Rsvp[]) ?? [];

  const attendingCount = rsvps.filter((r) => r.attending).length;
  const declinedCount = rsvps.filter((r) => !r.attending).length;
  const plusOnesCount = rsvps.filter((r) => r.attending && r.plus_one).length;
  const headcount = attendingCount + plusOnesCount;

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
      </div>

      <a className="export-link" href="/admin/export">
        Download CSV
      </a>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Attending</th>
            <th>Plus One</th>
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
              <td>{r.plus_one ? r.plus_one_name || "Unnamed" : "-"}</td>
              <td>{new Date(r.submitted_at).toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
