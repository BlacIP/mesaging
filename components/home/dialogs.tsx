"use client";

import { AppConfig, Period } from "@/lib/types";
import { formatPeriod } from "@/components/shared/client-data";

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
  message,
  onClose
}: {
  message: { period: Period; message: string };
  onClose: () => void;
}) {
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
        <div className={`message-full ${message.period}`}>{message.message}</div>
        <p className="message-meta">This preview does not mark the message as sent.</p>
      </section>
    </div>
  );
}
