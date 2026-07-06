"use client";

import { useState } from "react";
import { PeriodFilter, StatusFilter } from "./types";

type Counts = Record<PeriodFilter | StatusFilter, number>;

type Props = {
  counts: Counts;
  period: PeriodFilter;
  status: StatusFilter;
  onPeriod: (period: PeriodFilter) => void;
  onStatus: (status: StatusFilter) => void;
};

export function FilterToolbar({ counts, period, status, onPeriod, onStatus }: Props) {
  return (
    <section className="bank-toolbar" aria-label="Bank filters">
      <div className="mobile-filter-grid">
        <MobileDropdown
          label="Period"
          options={[
            ["all", `All periods (${counts.all})`],
            ["morning", `Morning (${counts.morning})`],
            ["night", `Night (${counts.night})`]
          ]}
          value={period}
          onChange={(value) => onPeriod(value as PeriodFilter)}
        />
        <MobileDropdown
          label="Status"
          options={[
            ["all", "All statuses"],
            ["sent", `Sent (${counts.sent})`],
            ["unsent", `Unsent (${counts.unsent})`]
          ]}
          value={status}
          onChange={(value) => onStatus(value as StatusFilter)}
        />
      </div>

      <div className="filter-group desktop-filter-group">
        <span>Period</span>
        <FilterButton active={period === "all"} onClick={() => onPeriod("all")}>All ({counts.all})</FilterButton>
        <FilterButton active={period === "morning"} onClick={() => onPeriod("morning")}>Morning ({counts.morning})</FilterButton>
        <FilterButton active={period === "night"} onClick={() => onPeriod("night")}>Night ({counts.night})</FilterButton>
      </div>

      <div className="filter-group desktop-filter-group">
        <span>Status</span>
        <FilterButton active={status === "all"} onClick={() => onStatus("all")}>All</FilterButton>
        <FilterButton active={status === "sent"} onClick={() => onStatus("sent")}>Sent ({counts.sent})</FilterButton>
        <FilterButton active={status === "unsent"} onClick={() => onStatus("unsent")}>Unsent ({counts.unsent})</FilterButton>
      </div>
    </section>
  );
}

function MobileDropdown({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: [string, string][];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(([key]) => key === value)?.[1] ?? label;

  return (
    <div className="mobile-filter-select">
      <span>{label}</span>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {selected}<strong>⌄</strong>
      </button>
      {open && (
        <div className="mobile-filter-menu">
          {options.map(([key, text]) => (
            <button key={key} type="button" className={key === value ? "active" : ""} onClick={() => { onChange(key); setOpen(false); }}>
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={active ? "filter-button active" : "filter-button"} type="button" onClick={onClick}>
      {children}
    </button>
  );
}
