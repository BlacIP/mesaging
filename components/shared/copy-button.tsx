"use client";

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="copy-button" type="button" aria-label="Copy endpoint" title="Copy endpoint" onClick={() => void copy()}>
      {copied ? <RiCheckLine aria-hidden size={17} /> : <RiFileCopyLine aria-hidden size={17} />}
    </button>
  );
}
