"use client";

import { RiCloseLine, RiDownloadCloud2Line, RiShareForwardLine } from "@remixicon/react";
import { useEffect, useState } from "react";

type Props = {
  variant: "floating" | "settings";
};

export function InstallPrompt({ variant }: Props) {
  const [visible, setVisible] = useState(variant === "settings");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (variant !== "floating") return;
    const isInstalled = isStandalone();
    setInstalled(isInstalled);
    if (isInstalled) return;

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 60000);
    return () => window.clearTimeout(timer);
  }, [variant]);

  if (installed || !visible) return null;

  return (
    <>
      <section className={variant === "floating" ? "install-float" : "install-panel"}>
        <div>
          <strong>Download to phone</strong>
          <p>Save Sweet Messages to your home screen for quick access.</p>
        </div>
        <div className="install-actions">
          <button type="button" onClick={() => setDetailsOpen(true)}>
            <RiDownloadCloud2Line aria-hidden size={18} /> Download
          </button>
          {variant === "floating" && (
            <button className="install-close" type="button" aria-label="Hide install prompt" onClick={() => setVisible(false)}>
              <RiCloseLine aria-hidden size={18} />
            </button>
          )}
        </div>
      </section>
      {detailsOpen && <InstallSteps onClose={() => setDetailsOpen(false)} />}
    </>
  );
}

function InstallSteps({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p>iPhone install</p>
            <h2 id="install-title">Add to Home Screen</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <ol>
          <li>Open this site in Safari.</li>
          <li>Tap the Share button <RiShareForwardLine aria-label="Share" size={16} />.</li>
          <li>Choose Add to Home Screen, then tap Add.</li>
        </ol>
      </section>
    </div>
  );
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
