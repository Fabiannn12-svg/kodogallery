import Link from "next/link";
import { Settings } from "lucide-react";

export default function Navbar() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: "1px solid var(--border)",
        background: "oklch(0.10 0.008 270 / 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(24px, 5vw, 48px)",
          height: "52px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "var(--accent)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.6" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text)", fontFamily: "var(--font-display)" }}>
            Promptify
          </span>
        </Link>

        {/* Admin button — right side */}
        <div style={{ marginLeft: "auto" }}>
          <Link
            href="/admin"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: 600,
              padding: "6px 12px", borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-raised)",
              color: "var(--text-2)",
              textDecoration: "none",
            }}
          >
            <Settings style={{ width: "13px", height: "13px" }} />
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
