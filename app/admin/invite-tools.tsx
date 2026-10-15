"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveMessageTemplate, setInviteSent, type TemplateState } from "./actions";
import { MESSAGE_TEMPLATE_MAX } from "@/lib/invite-message";

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
export function CopyMessageButton({ message }: { message: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <button
      type="button"
      className="admin-small-button"
      title={message}
      onClick={async () => setState((await copyText(message)) ? "copied" : "failed")}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy message"}
    </button>
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
      <label htmlFor="template">Invite message</label>
      <p className="admin-help">
        Use <code>{"{name}"}</code> for the guest&rsquo;s name (both names for a couple),{" "}
        <code>{"{link}"}</code> for their personal link and <code>{"{deadline}"}</code> for the
        reply-by date. Each row&rsquo;s &ldquo;Copy message&rdquo; button fills these in.
      </p>
      <textarea
        id="template"
        name="template"
        rows={10}
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
