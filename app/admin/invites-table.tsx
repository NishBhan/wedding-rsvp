"use client";

import { useState } from "react";
import { CopyMessageButton, SentCheckbox, TierSelect } from "./invite-tools";
import { EditInviteButton } from "./invite-editor";
import type { InviteType } from "@/lib/invites";

export type InviteTableRow = {
  id: string;
  url: string;
  names: string;
  guestName: string;
  partnerName: string | null;
  type: InviteType;
  typeLabel: string;
  tier: number | null;
  sent: boolean;
  replied: boolean;
};

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// The invites list. Actions sit on the left (sent, copy, edit) so it can be
// worked through on a phone without scrolling sideways; the long link is on
// the far right. The search box narrows the rows as you type.
export function InvitesTable({
  rows,
  total,
  tiersEnabled,
  sentTracking,
  emptyMessage,
}: {
  rows: InviteTableRow[];
  total: number;
  tiersEnabled: boolean;
  sentTracking: boolean;
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const q = fold(query);
  const shown = q ? rows.filter((r) => fold(r.names).includes(q)) : rows;

  return (
    <>
      <div className="invite-search">
        <label htmlFor="invite-search" className="visually-hidden">
          Search by name
        </label>
        <input
          id="invite-search"
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <span className="filter-count" aria-live="polite">
          Showing {shown.length} of {total}
        </span>
      </div>
      <div className="table-scroll">
        <table className="invites-table">
          <thead>
            <tr>
              <th>Sent</th>
              <th>Invited</th>
              <th>
                <span className="visually-hidden">Message</span>
              </th>
              <th>
                <span className="visually-hidden">Edit</span>
              </th>
              <th>Replied</th>
              {tiersEnabled && <th>Tier</th>}
              <th>Type</th>
              <th>Personal link</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8}>{q ? `No one called “${query.trim()}” here.` : emptyMessage}</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className={r.sent ? "invite-sent" : undefined}>
                <td>
                  {sentTracking ? (
                    <SentCheckbox inviteId={r.id} sent={r.sent} label={r.names} />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="invite-names">{r.names}</td>
                <td>
                  <CopyMessageButton guestName={r.guestName} partnerName={r.partnerName} link={r.url} />
                </td>
                <td>
                  <EditInviteButton
                    initial={{
                      id: r.id,
                      type: r.type,
                      guestName: r.guestName,
                      partnerName: r.partnerName ?? "",
                      tier: tiersEnabled ? r.tier : undefined,
                    }}
                  />
                </td>
                <td>
                  <span className={`badge ${r.replied ? "yes" : "no"}`}>{r.replied ? "Yes" : "Not yet"}</span>
                </td>
                {tiersEnabled && (
                  <td>
                    <TierSelect inviteId={r.id} tier={r.tier} label={r.names} />
                  </td>
                )}
                <td className="invite-type">{r.typeLabel}</td>
                <td>
                  <a href={r.url}>{r.url}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
