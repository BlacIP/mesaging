"use client";

import { TouchEvent, useRef } from "react";

/** Drag-to-dismiss for bottom sheets: spread the returned handleProps on the
 * grab-handle element and attach sheetRef to the sheet itself. Dragging the
 * handle moves the sheet with the finger; releasing past the threshold closes
 * it, anything less springs back. */
export function useSheetDrag<T extends HTMLElement = HTMLDivElement>(onClose: () => void, threshold = 80) {
  const sheetRef = useRef<T | null>(null);
  const startY = useRef<number | null>(null);
  const delta = useRef(0);

  const handleProps = {
    onTouchStart(event: TouchEvent<HTMLElement>) {
      startY.current = event.touches[0].clientY;
      delta.current = 0;
      if (sheetRef.current) sheetRef.current.style.transition = "none";
    },
    onTouchMove(event: TouchEvent<HTMLElement>) {
      if (startY.current === null) return;
      delta.current = Math.max(0, event.touches[0].clientY - startY.current);
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta.current}px)`;
    },
    onTouchEnd() {
      const sheet = sheetRef.current;
      startY.current = null;
      if (!sheet) return;

      if (delta.current > threshold) {
        sheet.style.transform = "";
        sheet.style.transition = "";
        onClose();
      } else {
        sheet.style.transition = "transform 180ms ease";
        sheet.style.transform = "translateY(0)";
        window.setTimeout(() => {
          if (sheetRef.current) sheetRef.current.style.transition = "";
        }, 200);
      }
      delta.current = 0;
    }
  };

  return { sheetRef, handleProps };
}
