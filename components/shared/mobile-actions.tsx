"use client";

import { RiArchiveDrawerLine, RiCloseLine, RiEdit2Line, RiMenuLine, RiRefreshLine, RiSettings3Line } from "@remixicon/react";
import Link from "next/link";
import { ReactNode } from "react";
import { useState } from "react";
import { useSheetDrag } from "./use-sheet-drag";

type ActionItem = {
  href?: string;
  label: string;
  menuOnly?: boolean; // shown in the Menu sheet but not in the bottom tab bar
  onClick?: () => void;
};

export function MobileActions({ items, menuItems = [] }: { items: ActionItem[]; menuItems?: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const barItems = items.filter((item) => !item.menuOnly);
  const { sheetRef, handleProps } = useSheetDrag<HTMLElement>(() => setOpen(false));

  function run(action?: () => void) {
    setOpen(false);
    action?.();
  }

  return (
    <>
      <nav className="mobile-action-bar" aria-label="Mobile page actions">
        {barItems.map((item) => item.href ? (
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
          <aside className="action-sheet" aria-label="Page actions" ref={sheetRef} onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" aria-hidden {...handleProps} />
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
              {menuItems.map((item) => (
                <button className="sheet-secondary" key={item.label} type="button" onClick={() => run(item.onClick)}>
                  {item.label}
                </button>
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
