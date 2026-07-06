"use client";

import { RiArchiveDrawerLine, RiCloseLine, RiEdit2Line, RiMenuLine, RiRefreshLine, RiSettings3Line } from "@remixicon/react";
import Link from "next/link";
import { ReactNode } from "react";
import { useState } from "react";

type ActionItem = {
  href?: string;
  label: string;
  onClick?: () => void;
};

export function MobileActions({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);

  function run(action?: () => void) {
    setOpen(false);
    action?.();
  }

  return (
    <>
      <nav className="mobile-action-bar" aria-label="Mobile page actions">
        {items.map((item) => item.href ? (
          <Link className="mobile-action-item" key={item.label} href={item.href}>
            <span>{iconFor(item.label)}</span>
            <small>{item.label}</small>
          </Link>
        ) : (
          <button className="mobile-action-item" key={item.label} type="button" onClick={() => run(item.onClick)}>
            <span>{iconFor(item.label)}</span>
            <small>{item.label}</small>
          </button>
        ))}
        <button className="mobile-action-item" type="button" aria-label="Open actions" onClick={() => setOpen(true)}>
          <span><RiMenuLine aria-hidden size={22} /></span>
          <small>Menu</small>
        </button>
      </nav>
      {open && (
        <div className="action-sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <aside className="action-sheet" aria-label="Page actions" onClick={(event) => event.stopPropagation()}>
            <div className="action-sheet-heading">
              <strong>Actions</strong>
              <button type="button" aria-label="Close actions" onClick={() => setOpen(false)}>
                <RiCloseLine aria-hidden size={20} />
              </button>
            </div>
            <nav className="action-sheet-links">
              {items.map((item) => item.href ? (
                <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
              ) : (
                <button key={item.label} type="button" onClick={() => run(item.onClick)}>{item.label}</button>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function iconFor(label: string): ReactNode {
  const value = label.toLowerCase();
  if (value.includes("settings")) return <RiSettings3Line aria-hidden size={22} />;
  if (value.includes("refresh")) return <RiRefreshLine aria-hidden size={22} />;
  if (value.includes("bank")) return <RiArchiveDrawerLine aria-hidden size={22} />;
  if (value.includes("manage")) return <RiEdit2Line aria-hidden size={22} />;
  return <RiMenuLine aria-hidden size={22} />;
}
