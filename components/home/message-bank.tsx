"use client";

import { Period } from "@/lib/types";

type Props = {
  count: number;
  herName: string;
  newValue: string;
  period: Period;
  shortcutUrl: string;
  title: string;
  onAdd: (period: Period) => Promise<void>;
  onChange: (value: string) => void;
  onPreview: (period: Period) => void;
};

export function MessageBank({
  count,
  herName,
  newValue,
  period,
  shortcutUrl,
  title,
  onAdd,
  onChange,
  onPreview
}: Props) {
  return (
    <article className={`panel bank ${period}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{count} active messages</p>
        </div>
        <button type="button" disabled={count === 0} onClick={() => onPreview(period)}>
          Preview next
        </button>
      </div>

      <textarea
        value={newValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Write a new ${period} message. Use {name} where needed, shown as ${herName || "My Love"} in the UI.`}
      />

      <div className="bank-actions">
        <button type="button" onClick={() => onAdd(period)}>
          Add to bank
        </button>
        <code>{shortcutUrl}</code>
      </div>
    </article>
  );
}
