"use client";

import { api, readableError } from "@/components/shared/client-data";
import { Period } from "@/lib/types";
import { RiAiGenerate, RiCloseLine } from "@remixicon/react";
import { useEffect, useState } from "react";

const loveLoadingLines = [
  "building love...",
  "love is sweet...",
  "love is kind...",
  "choosing tender words...",
  "warming the message...",
  "adding a little romance...",
  "finding the right feeling...",
  "polishing the butterflies..."
];

export function AiAssist({
  draft,
  herName,
  onUse,
  period
}: {
  draft: string;
  herName: string;
  onUse: (message: string) => void;
  period: Period;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState("romantic");
  const [length, setLength] = useState("medium");
  const [focus, setFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!isGenerating) return;

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loveLoadingLines.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [isGenerating]);

  async function generate() {
    setIsGenerating(true);
    setLoadingIndex(0);
    setNotice(null);

    try {
      const data = await api<{ suggestions: string[] }>("/api/ai/messages", {
        method: "POST",
        body: JSON.stringify({ draft, focus, herName, length, mode: draft ? "edit" : "generate", period, tone })
      });
      setSuggestions(data.suggestions);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not generate messages"));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <span className="ai-anchor">
      <button className="icon-button ai-button" type="button" aria-label="AI assist" title="AI assist" onClick={() => setOpen(!open)}>
        <RiAiGenerate aria-hidden size={19} />
      </button>
      {open && (
        <div className="ai-popover" role="menu" aria-label="AI assist options">
          <div className="ai-popover-head">
            <strong>AI assist</strong>
            <button type="button" aria-label="Close AI options" onClick={() => setOpen(false)}>
              <RiCloseLine aria-hidden size={18} />
            </button>
          </div>
          {notice && (
            <p className="inline-notice">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)}>Clear</button>
            </p>
          )}
          <OptionRow label="Tone" options={["romantic", "playful", "deep"]} value={tone} onChange={setTone} />
          <OptionRow label="Length" options={["short", "medium", "long"]} value={length} onChange={setLength} />
          <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="Mention mood, memory, prayer..." />
          <button className="ai-generate" type="button" disabled={isGenerating} onClick={() => void generate()}>
            {isGenerating ? loveLoadingLines[loadingIndex] : "Generate"}
          </button>
          {suggestions.length > 0 && (
            <button className="clear-suggestions" type="button" onClick={() => setSuggestions([])}>
              Clear suggestions
            </button>
          )}
          <div className="suggestion-list compact">
            {suggestions.map((message) => (
              <button className="suggestion-option" key={message} type="button" onClick={() => { onUse(message); setOpen(false); }}>
                {message}
              </button>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

function OptionRow({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="ai-option-row">
      <span>{label}</span>
      {options.map((option) => (
        <button className={option === value ? "active" : ""} key={option} type="button" onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}
