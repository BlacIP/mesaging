import Link from "next/link";
import { MobileActions } from "@/components/shared/mobile-actions";

export function Hero({ total }: { total: number }) {
  return (
    <section className="hero">
      <div>
        <p className="kicker">Every morning &middot; every night</p>
        <h1>Sweet Messages</h1>
        <p>{total} messages in the bank, ready for her mornings and nights.</p>
      </div>
      <div className="hero-actions">
        <Link className="link-button" href="/bank">View bank table</Link>
        <Link className="link-button" href="/history">Prompt history</Link>
        <Link className="link-button" href="/settings">Settings</Link>
      </div>
      <MobileActions items={[{ href: "/bank", label: "View bank table" }, { href: "/history", label: "Prompt history" }, { href: "/settings", label: "Settings" }]} />
    </section>
  );
}
