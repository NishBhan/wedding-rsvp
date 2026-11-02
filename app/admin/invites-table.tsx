"use client";

import { useState } from "react";
import { CopyMessageButton, RoomInput, SentCheckbox, TierSelect } from "./invite-tools";
import { EditInviteButton } from "./invite-editor";
import { BulkBar } from "./bulk-bar";
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
  // People coming on this invite: null if they haven't replied yet.
  coming: number | null;
  room: string | null;
  // This invite's own reply-by date ("2026-11-30"), or null for the usual one.
  replyBy: string | null;
  // The date as guests read it ("30 November 2026").
  deadlineLabel: string;
  // True once that date has passed, so the guest can no longer reply.
  closed: boolean;
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
  roomsEnabled,
  replyByEnabled,
  roomNames,
  emptyMessage,
}: {
  rows: InviteTableRow[];
  total: number;
  tiersEnabled: boolean;
  sentTracking: boolean;
  roomsEnabled: boolean;
  replyByEnabled: boolean;
  roomNames: string[];
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const q = fold(query);
  const shown = q ? rows.filter((r) => fold(r.names).includes(q)) : rows;

  // Select mode: tick invites, then set their tier or reply-by date at once.
  const canBulk = tiersEnabled || replyByEnabled;
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<string | null>(null);
  const selected = rows.filter((r) => selectedIds.has(r.id));
  const allShownSelected = shown.length > 0 && shown.every((r) => selectedIds.has(r.id));
  const toggle = (id: string, on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

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
        {canBulk && (
          <button
            type="button"
            className={`admin-small-button sender-option${selecting ? " is-active" : ""}`}
            aria-pressed={selecting}
            onClick={() => {
              setSelecting(!selecting);
              setSelectedIds(new Set());
              setDone(null);
            }}
          >
            {selecting ? "Done selecting" : "Select to change tier or date"}
          </button>
        )}
      </div>
      {selecting && (
        <BulkBar
          selected={selected}
          tiersEnabled={tiersEnabled}
          replyByEnabled={replyByEnabled}
          onClear={() => setSelectedIds(new Set())}
          onDone={(message) => {
            setSelectedIds(new Set());
            setDone(message);
          }}
        />
      )}
      {done && (
        <p className="saved-note" role="status">
          {done}
        </p>
      )}
      <div className="table-scroll">
        <table className="invites-table">
          <thead>
            <tr>
              {selecting && (
                <th className="select-col">
                  <span className="select-head">Select</span>
                  <input
                    type="checkbox"
                    className="sent-checkbox select-checkbox"
                    aria-label="Select all shown"
                    checked={allShownSelected}
                    onChange={(e) =>
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        for (const r of shown) {
                          if (e.target.checked) next.add(r.id);
                          else next.delete(r.id);
                        }
                        return next;
                      })
                    }
                  />
                </th>
              )}
              <th>Sent</th>
              {tiersEnabled && <th>Tier</th>}
              <th>Invited</th>
              <th>Type</th>
              <th>
                <span className="visually-hidden">Message</span>
              </th>
              <th>
                <span className="visually-hidden">Edit</span>
              </th>
              <th>Replied</th>
              <th>Personal link</th>
              {roomsEnabled && <th>Room</th>}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={10}>{q ? `No one called “${query.trim()}” here.` : emptyMessage}</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr
                key={r.id}
                className={[r.sent && "invite-sent", selectedIds.has(r.id) && "invite-selected"]
                  .filter(Boolean)
                  .join(" ") || undefined}
              >
                {selecting && (
                  <td className="select-col">
                    <input
                      type="checkbox"
                      className="sent-checkbox select-checkbox"
                      aria-label={`Select ${r.names}`}
                      checked={selectedIds.has(r.id)}
                      onChange={(e) => toggle(r.id, e.target.checked)}
                    />
                  </td>
                )}
                <td>
                  {sentTracking ? (
                    <SentCheckbox inviteId={r.id} sent={r.sent} label={r.names} />
                  ) : (
                    "-"
                  )}
                </td>
                {tiersEnabled && (
                  <td>
                    <TierSelect inviteId={r.id} tier={r.tier} label={r.names} />
                  </td>
                )}
                <td className="invite-names">
                  {r.names}
                  {r.replyBy && (
                    <small className="invite-reply-by">
                      Reply by {r.deadlineLabel}
                      {r.closed && <span className="reply-closed"> · replies closed</span>}
                    </small>
                  )}
                </td>
                <td className="invite-type">{r.typeLabel}</td>
                <td>
                  <CopyMessageButton
                    guestName={r.guestName}
                    partnerName={r.partnerName}
                    link={r.url}
                    deadline={r.deadlineLabel}
                  />
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
                  {r.coming === null ? (
                    <span className="badge no">Not yet</span>
                  ) : r.coming > 0 ? (
                    <span className="badge yes">{r.coming} coming</span>
                  ) : (
                    <span className="badge declined">Not coming</span>
                  )}
                </td>
                <td>
                  <a href={r.url} className="invite-link">
                    {r.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </td>
                {roomsEnabled && (
                  <td>
                    <RoomInput inviteId={r.id} room={r.room} label={r.names} listId="room-names" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {roomsEnabled && (
        <datalist id="room-names">
          {roomNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
    </>
  );
}
