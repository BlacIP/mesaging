"use client";

import { applyName } from "@/components/shared/client-data";
import { BankMessage } from "@/lib/types";
import { formatDate } from "./message-table";

export function BankMessageDialog({
  herName,
  message,
  onClose
}: {
  herName: string;
  message: BankMessage;
  onClose: () => void;
}) {
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
        <div className="message-full">{applyName(message.body, herName)}</div>
        <p className="message-meta">
          Send count: {message.send_count} / Last sent:{" "}
          {message.last_sent_at ? formatDate(message.last_sent_at) : "Never"}
        </p>
      </section>
    </div>
  );
}
