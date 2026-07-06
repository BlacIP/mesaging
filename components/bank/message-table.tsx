"use client";

import { applyName } from "@/components/shared/client-data";
import { BankMessage } from "@/lib/types";

type Props = {
  herName: string;
  messages: BankMessage[];
  onOpen: (message: BankMessage) => void;
};

export function MessageTable({ herName, messages, onOpen }: Props) {
  return (
    <section className="table-wrap" aria-label="Message bank table">
      <table className="bank-table">
        <thead>
          <tr>
            {["ID", "Period", "Status", "Message", "Send Count", "Last Sent", ""].map((heading) => (
              <th key={heading}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id}>
              <td>#{message.id}</td>
              <td><span className={`period-pill ${message.period}`}>{message.period}</span></td>
              <td><span className={message.sent ? "status-pill sent" : "status-pill unsent"}>{message.sent ? "Sent" : "Unsent"}</span></td>
              <td className="message-cell">{applyName(message.body, herName)}</td>
              <td>{message.send_count}</td>
              <td>{message.last_sent_at ? formatDate(message.last_sent_at) : "-"}</td>
              <td><button className="table-action" type="button" onClick={() => onOpen(message)}>Open</button></td>
            </tr>
          ))}
          {messages.length === 0 && (
            <tr>
              <td className="empty-table" colSpan={7}>No messages match these filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
