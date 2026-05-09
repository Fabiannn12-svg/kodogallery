import { getSeriesAlbums } from "@/lib/data";
import CoverManager from "@/components/CoverManager";

export const revalidate = 0;

export default async function CoversPage() {
  const albums = await getSeriesAlbums();

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "clamp(32px,5vw,56px) clamp(24px,5vw,48px)",
        }}
      >
        <div style={{ marginBottom: "var(--space-7)" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Album Covers
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
            Manage cover images for series (16:9) and characters (4:5). Changes apply immediately.
          </p>
        </div>

        <CoverManager albums={albums} />
      </div>
    </main>
  );
}
