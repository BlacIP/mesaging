"use client";

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
      <div className="filter-group">
        <span>Period</span>
        <FilterButton active={period === "all"} onClick={() => onPeriod("all")}>All ({counts.all})</FilterButton>
        <FilterButton active={period === "morning"} onClick={() => onPeriod("morning")}>Morning ({counts.morning})</FilterButton>
        <FilterButton active={period === "night"} onClick={() => onPeriod("night")}>Night ({counts.night})</FilterButton>
      </div>

      <div className="filter-group">
        <span>Status</span>
        <FilterButton active={status === "all"} onClick={() => onStatus("all")}>All</FilterButton>
        <FilterButton active={status === "sent"} onClick={() => onStatus("sent")}>Sent ({counts.sent})</FilterButton>
        <FilterButton active={status === "unsent"} onClick={() => onStatus("unsent")}>Unsent ({counts.unsent})</FilterButton>
      </div>
    </section>
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
