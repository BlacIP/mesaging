"use client";

import { applyName } from "@/components/shared/client-data";
import { BankMessage } from "@/lib/types";
import { RiEdit2Line, RiExternalLinkLine, RiMore2Fill, RiSendPlaneLine } from "@remixicon/react";
import { useState } from "react";

type Props = {
  herName: string;
  messages: BankMessage[];
  onEdit: (message: BankMessage) => void;
  onForceNext: (message: BankMessage) => Promise<void> | void;
  onOpen: (message: BankMessage) => void;
};

export function MessageTable({ herName, messages, onEdit, onForceNext, onOpen }: Props) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  function runAction(message: BankMessage, action: (message: BankMessage) => Promise<void> | void) {
    setOpenMenu(null);
    void action(message);
  }

  return (
    <>
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
                <td><PeriodPill message={message} /></td>
                <td><StatusPill message={message} /></td>
                <td className="message-cell">{applyName(message.body, herName)}</td>
                <td>{message.send_count}</td>
                <td>{message.last_sent_at ? formatDate(message.last_sent_at) : "-"}</td>
                <td className="table-actions"><RowActions message={message} /></td>
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
      <section className="mobile-message-list" aria-label="Message bank list">
        {messages.map((message) => (
          <article className="mobile-message-card" key={message.id}>
            <div className="mobile-card-head">
              <div>
                <strong>#{message.id}</strong>
                <div className="mobile-card-pills"><PeriodPill message={message} /><StatusPill message={message} /></div>
              </div>
              <RowActions message={message} />
            </div>
            <p>{applyName(message.body, herName)}</p>
            <small>Sent {message.send_count} times / Last: {message.last_sent_at ? formatDate(message.last_sent_at) : "Never"}</small>
          </article>
        ))}
        {messages.length === 0 && <p className="empty-card">No messages match these filters.</p>}
      </section>
    </>
  );

  function RowActions({ message }: { message: BankMessage }) {
    return (
      <div className="row-menu">
        <button
          aria-expanded={openMenu === message.id}
          aria-label={`Actions for message ${message.id}`}
          className="ellipsis-button"
          type="button"
          onClick={() => setOpenMenu(openMenu === message.id ? null : message.id)}
        >
          <RiMore2Fill aria-hidden size={20} />
        </button>
        {openMenu === message.id && (
          <div className="row-menu-list" role="menu">
            <button type="button" role="menuitem" onClick={() => runAction(message, onOpen)}>
              <span><RiExternalLinkLine aria-hidden size={17} /></span> Open
            </button>
            <button type="button" role="menuitem" onClick={() => runAction(message, onEdit)}>
              <span><RiEdit2Line aria-hidden size={17} /></span> Edit
            </button>
            <button disabled={message.forced_next} type="button" role="menuitem" onClick={() => runAction(message, onForceNext)}>
              <span><RiSendPlaneLine aria-hidden size={17} /></span> {message.forced_next ? "Already next" : "Send next"}
            </button>
          </div>
        )}
      </div>
    );
  }
}

function PeriodPill({ message }: { message: BankMessage }) {
  return <span className={`period-pill ${message.period}`}>{message.period}</span>;
}

function StatusPill({ message }: { message: BankMessage }) {
  return <span className={message.sent ? "status-pill sent" : "status-pill unsent"}>{message.sent ? "Sent" : "Unsent"}</span>;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
