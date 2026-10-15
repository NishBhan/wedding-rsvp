"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { previewInvite, saveInvite, type InvitePreview } from "./actions";
import type { InviteType } from "@/lib/invites";
import { MAX_NAME_LENGTH } from "@/lib/site";

type Initial = { id?: string; type: InviteType; guestName: string; partnerName: string };

const TYPES: { value: InviteType; label: string; hint: string }[] = [
  { value: "solo", label: "Single", hint: "One guest, no plus-one" },
  { value: "plus_one", label: "Single + 1", hint: "One guest who may bring someone" },
  { value: "couple", label: "Couple", hint: "Two named guests, each answers" },
];

// Add or edit one invite in two steps: fill in, then check exactly what
// will change (and what it does to any reply already given) before saving.
function InviteEditor({ initial, onClose }: { initial: Initial; onClose: () => void }) {
  const [type, setType] = useState<InviteType>(initial.type);
  const [guestName, setGuestName] = useState(initial.guestName);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [result, setResult] = useState<{ message: string; link: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const adding = !initial.id;

  const input = { id: initial.id, type, guestName, partnerName };
  const reviewing = preview?.ok === true;

  const check = () =>
    startTransition(async () => {
      setError(null);
      const p = await previewInvite(input);
      if (p.ok) setPreview(p);
      else setError(p.error);
    });

  const save = () =>
    startTransition(async () => {
      setError(null);
      const r = await saveInvite(input);
      if (r.ok) setResult({ message: r.message, link: r.link });
      else {
        setPreview(null);
        setError(r.error);
      }
    });

  if (result) {
    return (
      <div className="invite-editor">
        <h3>{result.message}</h3>
        <p>
          Their link: <a href={result.link}>{result.link}</a>
        </p>
        <div className="editor-actions">
          {adding && (
            <button
              type="button"
              className="admin-small-button"
              onClick={() => {
                setResult(null);
                setPreview(null);
                setGuestName("");
                setPartnerName("");
              }}
            >
              Add another
            </button>
          )}
          <button type="button" className="admin-small-button sender-option" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (reviewing && preview.ok) {
    return (
      <div className="invite-editor">
        <h3>Please double-check</h3>
        <ul className="editor-changes">
          {preview.changes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {preview.warnings.length > 0 && (
          <ul className="editor-warnings">
            {preview.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        {error && <p className="error">{error}</p>}
        <div className="editor-actions">
          <button type="button" className="admin-small-button" onClick={save} disabled={pending}>
            {pending ? "Saving…" : adding ? "Confirm and add" : "Confirm and save"}
          </button>
          <button
            type="button"
            className="admin-small-button sender-option"
            onClick={() => setPreview(null)}
            disabled={pending}
          >
            Go back and edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="invite-editor"
      onSubmit={(e) => {
        e.preventDefault();
        check();
      }}
    >
      <h3>{adding ? "Add an invite" : "Edit invite"}</h3>
      <fieldset className="editor-types">
        <legend>Type</legend>
        {TYPES.map((t) => (
          <label key={t.value} className={`editor-type${type === t.value ? " is-active" : ""}`}>
            <input
              type="radio"
              name="type"
              value={t.value}
              checked={type === t.value}
              onChange={() => setType(t.value)}
            />
            <span>
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="editor-guest">{type === "couple" ? "First guest" : "Guest"}</label>
        <input
          type="text"
          id="editor-guest"
          value={guestName}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setGuestName(e.target.value)}
          autoComplete="off"
        />
      </div>
      {type === "couple" && (
        <div>
          <label htmlFor="editor-partner">Partner</label>
          <input
            type="text"
            id="editor-partner"
            value={partnerName}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setPartnerName(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="editor-actions">
        <button type="submit" className="admin-small-button" disabled={pending}>
          {pending ? "Checking…" : "Check changes"}
        </button>
        <button type="button" className="admin-small-button sender-option" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// A button that opens the editor in a dialog (Esc closes it).
function EditorDialog({
  label,
  className,
  initial,
}: {
  label: string;
  className: string;
  initial: Initial;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);

  const close = () => {
    ref.current?.close();
    setOpen(false);
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <dialog ref={ref} className="editor-dialog" onClose={() => setOpen(false)}>
          <InviteEditor initial={initial} onClose={close} />
        </dialog>
      )}
    </>
  );
}

export function AddInviteButton() {
  return (
    <EditorDialog
      label="+ Add an invite"
      className="admin-small-button"
      initial={{ type: "solo", guestName: "", partnerName: "" }}
    />
  );
}

export function EditInviteButton({ initial }: { initial: Required<Initial> }) {
  return <EditorDialog label="Edit" className="admin-small-button sender-option" initial={initial} />;
}
