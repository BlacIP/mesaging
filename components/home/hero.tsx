import Link from "next/link";
import { MobileActions } from "@/components/shared/mobile-actions";

export function Hero({ total }: { total: number }) {
  return (
    <section className="hero">
      <div>
        <h1>Sweet Messages</h1>
        <p>Manage {total} messages your iPhone Shortcuts can use for morning and night.</p>
      </div>
      <div className="hero-actions">
        <Link className="link-button" href="/bank">View bank table</Link>
        <Link className="link-button" href="/settings">Settings</Link>
      </div>
      <MobileActions items={[{ href: "/bank", label: "View bank table" }, { href: "/settings", label: "Settings" }]} />
    </section>
  );
}
