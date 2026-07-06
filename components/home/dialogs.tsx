"use client";

import { AppConfig, Period } from "@/lib/types";
import { AiAssist } from "@/components/shared/ai-assist";
import { applyName, formatPeriod } from "@/components/shared/client-data";
import { useState } from "react";

export function SettingsSavedDialog({ config, onClose }: { config: AppConfig; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="settings-saved-title"
        aria-modal="true"
        className="save-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="settings-saved-title">Settings saved</h2>
        <p>Messages now show {config.her_name || "My Love"} wherever {"{name}"} is used.</p>
        <button type="button" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}

export function PreviewDialog({
  herName,
  message,
  onClose,
  onSave
}: {
  herName: string;
  message: { id: number; period: Period; body: string };
  onClose: () => void;
  onSave: (id: number, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(message.body);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function saveEdit() {
    setIsSaving(true);
    try {
      await onSave(message.id, draft);
    } catch {
      // The page-level notice shows the save error.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="preview-title"
        aria-modal="true"
        className="message-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p>Preview next</p>
            <h2 id="preview-title">{formatPeriod(message.period)} message</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {editing ? (
          <div className="textarea-shell editor-shell">
            <textarea className="message-editor" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <AiAssist draft={draft} herName={herName} period={message.period} onUse={setDraft} />
          </div>
        ) : (
          <div className={`message-full ${message.period}`}>{applyName(draft, herName)}</div>
        )}
        <p className="message-meta">This preview does not mark the message as sent.</p>
        <div className="modal-actions">
          {editing ? (
            <>
              <button disabled={isSaving} type="button" onClick={() => { setDraft(message.body); setEditing(false); }}>Cancel</button>
              <button disabled={isSaving} type="button" onClick={() => void saveEdit()}>
                {isSaving ? "Saving edit..." : "Save edit"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}>Edit preview</button>
          )}
        </div>
      </section>
    </div>
  );
}
