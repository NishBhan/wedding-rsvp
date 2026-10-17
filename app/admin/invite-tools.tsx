"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveMessageTemplate, setInviteSent, setInviteTier, type TemplateState } from "./actions";
import { TIERS, tierLabel } from "@/lib/tiers";
import {
  MESSAGE_TEMPLATE_MAX,
  SENDERS,
  fillMessage,
  needsSender,
  youFor,
  type Recipient,
  type Sender,
} from "@/lib/invite-message";

// Who is sending, remembered on this device: Nish's phone stays "Nish".
const SENDER_STORAGE_KEY = "wedding-admin-sender";

const MessageContext = createContext<{ template: string; sender: Sender | null }>({
  template: "",
  sender: null,
});

export function MessageProvider({
  template,
  children,
}: {
  template: string;
  children: React.ReactNode;
}) {
  const [sender, setSender] = useState<Sender | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SENDER_STORAGE_KEY);
      if (saved && (SENDERS as readonly string[]).includes(saved)) setSender(saved as Sender);
    } catch {
      // Storage blocked: just ask again each visit.
    }
  }, []);

  const choose = (s: Sender) => {
    setSender(s);
    try {
      localStorage.setItem(SENDER_STORAGE_KEY, s);
    } catch {}
  };

  return (
    <MessageContext.Provider value={{ template, sender }}>
      <div className="sender-switch" role="radiogroup" aria-label="Sending as">
        <span className="sender-label">Sending as</span>
        {SENDERS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={sender === s}
            className={`admin-small-button sender-option${sender === s ? " is-active" : ""}`}
            onClick={() => choose(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {children}
    </MessageContext.Provider>
  );
}

// "Sent" tickbox for one invite. Ticks straight away and saves in the
// background; if the save fails it unticks again and says why.
export function SentCheckbox({
  inviteId,
  sent,
  label,
}: {
  inviteId: string;
  sent: boolean;
  label: string;
}) {
  const [checked, setChecked] = useState(sent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setChecked(sent), [sent]);

  return (
    <span className="sent-cell">
      <input
        type="checkbox"
        className="sent-checkbox"
        checked={checked}
        disabled={pending}
        aria-label={`Invite sent to ${label}`}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          setError(null);
          startTransition(async () => {
            const problem = await setInviteSent(inviteId, next);
            if (problem) {
              setChecked(!next);
              setError(problem);
            }
          });
        }}
      />
      {error && <span className="error">{error}</span>}
    </span>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or clipboard access blocked: copy via a hidden field.
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

// Copies one guest's filled-in message, link included, ready to paste.
// On a couple's invite it first asks who it's going to: both of them in a
// group chat, or one of them on their own.
export function CopyMessageButton({
  guestName,
  partnerName,
  link,
}: {
  guestName: string;
  partnerName: string | null;
  link: string;
}) {
  const { template, sender } = useContext(MessageContext);
  const [state, setState] = useState<"idle" | "copied" | "failed" | "sender">("idle");
  const [choosing, setChoosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    if (choosing) dialog.current?.showModal();
  }, [choosing]);

  const copy = async (recipient: Recipient) => {
    const message = fillMessage(template, { guestName, partnerName, link, sender, recipient });
    setState((await copyText(message)) ? "copied" : "failed");
  };

  const close = () => {
    dialog.current?.close();
    setChoosing(false);
  };

  const options: { recipient: Recipient; label: string }[] = partnerName
    ? [
        { recipient: "both", label: "Both, in a group chat" },
        { recipient: "guest", label: `Just ${guestName}` },
        { recipient: "partner", label: `Just ${partnerName}` },
      ]
    : [];

  return (
    <>
      <button
        type="button"
        className="admin-small-button"
        title={partnerName ? undefined : fillMessage(template, { guestName, partnerName, link, sender })}
        onClick={async () => {
          if (!sender && needsSender(template)) return setState("sender");
          if (partnerName) return setChoosing(true);
          await copy("both");
        }}
      >
        {state === "copied"
          ? (
              <>
                <span className="label-long">Copied</span>
                <span className="label-short">✓ Done</span>
              </>
            )
          : state === "failed"
            ? "Couldn't copy"
            : state === "sender"
              ? "Choose who's sending"
              : (
                <>
                  <span className="label-long">Copy message</span>
                  <span className="label-short">Copy</span>
                </>
              )}
      </button>
      {choosing && (
        <dialog ref={dialog} className="editor-dialog" onClose={() => setChoosing(false)}>
          <div className="invite-editor">
            <h3>Who are you sending this to?</h3>
            <div className="recipient-options">
              {options.map((o) => (
                <button
                  key={o.recipient}
                  type="button"
                  className="recipient-option"
                  onClick={async () => {
                    close();
                    await copy(o.recipient);
                  }}
                >
                  <strong>{o.label}</strong>
                  <small>
                    &hellip;it wouldn&rsquo;t be the same without{" "}
                    {youFor(guestName, partnerName, o.recipient)}!
                  </small>
                </button>
              ))}
            </div>
            <div className="editor-actions">
              <button type="button" className="admin-small-button sender-option" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

function SaveTemplateButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-small-button" disabled={pending}>
      {pending ? "Saving…" : "Save message"}
    </button>
  );
}

// The message template, shared by everyone who logs in to /admin.
export function TemplateEditor({
  template,
  enabled,
}: {
  template: string;
  enabled: boolean;
}) {
  const [state, action] = useFormState<TemplateState, FormData>(saveMessageTemplate, {
    status: "idle",
  });

  return (
    <form action={action} className="template-editor">
      <label htmlFor="template" className="visually-hidden">
        Invite message
      </label>
      <p className="admin-help">
        Each row&rsquo;s &ldquo;Copy message&rdquo; button fills in: <code>{"{you}"}</code>{" "}
        (&ldquo;you&rdquo; for a single guest; for a couple, &ldquo;you two, Priya &amp;
        Joost&rdquo; in a group chat or &ldquo;you &amp; Joost&rdquo; when sent to Priya alone;
        Copy asks which), <code>{"{name}"}</code> (whoever it&rsquo;s going to),{" "}
        <code>{"{other}"}</code> (Wout when Nish is sending, and the other way round),{" "}
        <code>{"{me}"}</code> (whoever is sending), <code>{"{link}"}</code> (their personal
        link) and <code>{"{deadline}"}</code> (the reply-by date).
      </p>
      <textarea
        id="template"
        name="template"
        rows={18}
        defaultValue={template}
        maxLength={MESSAGE_TEMPLATE_MAX}
        disabled={!enabled}
      />
      <div className="template-actions">
        {enabled && <SaveTemplateButton />}
        {state.status === "saved" && <span className="saved-note">Saved</span>}
        {state.status === "error" && <span className="error">{state.message}</span>}
      </div>
    </form>
  );
}

// Tier dropdown for one invite. Saves on change; puts the old tier back
// and says why if the save fails.
export function TierSelect({
  inviteId,
  tier,
  label,
}: {
  inviteId: string;
  tier: number | null;
  label: string;
}) {
  const [value, setValue] = useState<number | null>(tier);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setValue(tier), [tier]);

  return (
    <span className="sent-cell">
      <select
        className="tier-select"
        value={value ?? ""}
        disabled={pending}
        aria-label={`Tier for ${label}`}
        onChange={(e) => {
          const next = e.target.value ? Number(e.target.value) : null;
          const before = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const problem = await setInviteTier(inviteId, next);
            if (problem) {
              setValue(before);
              setError(problem);
            }
          });
        }}
      >
        <option value="">–</option>
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </span>
  );
}
