"use client";

import { applyName } from "@/components/shared/client-data";
import { AiAssist } from "@/components/shared/ai-assist";
import { BankMessage } from "@/lib/types";
import { useState } from "react";
import { formatDate } from "./message-table";

export function BankMessageDialog({
  herName,
  initialEditing = false,
  message,
  onClose,
  onSave
}: {
  herName: string;
  initialEditing?: boolean;
  message: BankMessage;
  onClose: () => void;
  onSave: (id: number, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(message.body);
  const [editing, setEditing] = useState(initialEditing);
  const [isSaving, setIsSaving] = useState(false);

  async function saveEdit() {
    setIsSaving(true);
    try {
      await onSave(message.id, draft);
      setEditing(false);
    } catch {
      // The page-level notice shows the save error.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="bank-message-title"
        aria-modal="true"
        className="message-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p>#{message.id} / {message.period} / {message.sent ? "sent" : "unsent"}</p>
            <h2 id="bank-message-title">Message Details</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {editing ? (
          <div className="textarea-shell editor-shell">
            <textarea className="message-editor" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <AiAssist draft={draft} herName={herName} period={message.period} onUse={setDraft} />
          </div>
        ) : (
          <div className="message-full">{applyName(message.body, herName)}</div>
        )}
        <p className="message-meta">
          Send count: {message.send_count} / Last sent:{" "}
          {message.last_sent_at ? formatDate(message.last_sent_at) : "Never"}
        </p>
        <div className="modal-actions">
          {editing ? (
            <>
              <button disabled={isSaving} type="button" onClick={() => { setDraft(message.body); setEditing(false); }}>Cancel</button>
              <button disabled={isSaving} type="button" onClick={() => void saveEdit()}>
                {isSaving ? "Saving message..." : "Save message"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}>Edit message</button>
          )}
        </div>
      </section>
    </div>
  );
}
