"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { bulkUpdateInvites, type BulkChange } from "./actions";
import type { InviteTableRow } from "./invites-table";
import { TIERS, tierLabel } from "@/lib/tiers";
import { DEFAULT_DEADLINE, deadlineFor } from "@/lib/site";

const list = (rows: InviteTableRow[], extra: (r: InviteTableRow) => string = () => "") =>
  rows
    .slice(0, 8)
    .map((r) => r.names + extra(r))
    .join(", ") + (rows.length > 8 ? ` and ${rows.length - 8} more` : "");

// What a bulk change will do, in words, for the double-check.
function describe(change: BulkChange, rows: InviteTableRow[]) {
  const n = rows.length;
  const invites = `${n} ${n === 1 ? "invite" : "invites"}`;
  const notes: string[] = [];
  if ("tier" in change) {
    const moving = rows.filter((r) => r.tier !== null && r.tier !== change.tier);
    if (moving.length) {
      notes.push(`${moving.length} already in another tier will move: ${list(moving, (r) => ` (${tierLabel(r.tier)})`)}.`);
    }
    return {
      title: change.tier === null ? `Take ${invites} out of their tier` : `Put ${invites} in ${tierLabel(change.tier)}`,
      notes,
    };
  }
  const d = deadlineFor(change.replyBy);
  const sentWithOther = rows.filter((r) => r.sent && r.deadlineLabel !== d.label);
  notes.push(
    "Their copied message, their invitation page and their calendar reminder will show this date, and they can reply or change their answer until the end of that day (London time)."
  );
  if (sentWithOther.length) {
    notes.push(
      `${sentWithOther.length} already sent their invite with a different date, so let them know: ${list(sentWithOther, (r) => ` (was ${r.deadlineLabel})`)}.`
    );
  }
  return {
    title:
      change.replyBy === null
        ? `Put ${invites} back on the usual reply-by date, ${DEFAULT_DEADLINE.label}`
        : `Reply-by date for ${invites}: ${d.label}`,
    notes,
  };
}

// The bar shown while invites are selected: set their tier or reply-by
// date in one go, after a double-check.
export function BulkBar({
  selected,
  tiersEnabled,
  replyByEnabled,
  onDone,
  onClear,
}: {
  selected: InviteTableRow[];
  tiersEnabled: boolean;
  replyByEnabled: boolean;
  onDone: (message: string) => void;
  onClear: () => void;
}) {
  const [tier, setTier] = useState<string>("");
  const [date, setDate] = useState("");
  const [confirming, setConfirming] = useState<BulkChange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (confirming) dialog.current?.showModal();
  }, [confirming]);

  const close = () => {
    dialog.current?.close();
    setConfirming(null);
  };

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const n = selected.length;
  const summary = confirming ? describe(confirming, selected) : null;

  return (
    <div className="bulk-bar" role="region" aria-label="Change selected invites">
      <strong className="bulk-count">
        {n} selected
      </strong>
      {tiersEnabled && (
        <span className="bulk-group">
          <label htmlFor="bulk-tier" className="visually-hidden">
            Tier for selected invites
          </label>
          <select
            id="bulk-tier"
            className="tier-select"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="">Choose tier…</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {tierLabel(t)}
              </option>
            ))}
            <option value="none">No tier</option>
          </select>
          <button
            type="button"
            className="admin-small-button"
            disabled={n === 0 || !tier}
            onClick={() => setConfirming({ tier: tier === "none" ? null : Number(tier) })}
          >
            Set tier
          </button>
        </span>
      )}
      {replyByEnabled && (
        <span className="bulk-group">
          <label htmlFor="bulk-date" className="bulk-label">
            Reply by
          </label>
          <input
            id="bulk-date"
            type="date"
            className="bulk-date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            className="admin-small-button"
            disabled={n === 0 || !date}
            onClick={() => setConfirming({ replyBy: date })}
          >
            Set date
          </button>
          <button
            type="button"
            className="admin-small-button sender-option"
            disabled={n === 0}
            onClick={() => setConfirming({ replyBy: null })}
          >
            Use usual date
          </button>
        </span>
      )}
      <button type="button" className="admin-small-button sender-option" onClick={onClear} disabled={n === 0}>
        Clear selection
      </button>
      {error && <span className="error">{error}</span>}

      {confirming && summary && (
        <dialog ref={dialog} className="editor-dialog" onClose={() => setConfirming(null)}>
          <div className="invite-editor">
            <h3>Please double-check</h3>
            <ul className="editor-changes">
              <li>{summary.title}.</li>
              <li>{list(selected)}</li>
            </ul>
            {summary.notes.length > 0 && (
              <ul className="editor-warnings">
                {summary.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
            <div className="editor-actions">
              <button
                type="button"
                className="admin-small-button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    const problem = await bulkUpdateInvites(
                      selected.map((r) => r.id),
                      confirming
                    );
                    close();
                    if (problem) setError(problem);
                    else onDone(`${summary.title}: done.`);
                  })
                }
              >
                {pending ? "Saving…" : "Confirm"}
              </button>
              <button type="button" className="admin-small-button sender-option" onClick={close} disabled={pending}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
