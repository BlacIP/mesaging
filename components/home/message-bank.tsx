"use client";

import { AiAssist } from "@/components/shared/ai-assist";
import { Period } from "@/lib/types";

type Props = {
  count: number;
  herName: string;
  isAdding: boolean;
  newValue: string;
  period: Period;
  title: string;
  onAdd: (period: Period) => Promise<void>;
  onChange: (value: string) => void;
  onPreview: (period: Period) => void;
};

export function MessageBank({
  count,
  herName,
  isAdding,
  newValue,
  period,
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
        </div>
        <button type="button" disabled={count === 0} onClick={() => onPreview(period)}>
          Preview next
        </button>
      </div>

      <div className="textarea-shell">
        <textarea
          value={newValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Write a new ${period} message. Use {name} where needed, shown as ${herName || "My Love"} in the UI.`}
        />
        <AiAssist draft={newValue} herName={herName} period={period} onUse={onChange} />
      </div>

      <div className="bank-actions">
        <button type="button" disabled={isAdding} onClick={() => onAdd(period)}>
          {isAdding ? "Adding to bank..." : "Add to bank"}
        </button>
      </div>
    </article>
  );
}
