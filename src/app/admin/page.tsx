import { getSeriesAlbums } from "@/lib/data";
import AdminPanel from "@/components/AdminPanel";

export const revalidate = 0;

export default async function AdminPage() {
  const albums = await getSeriesAlbums();

  const albumData = albums.map((a) => ({
    series: a.series,
    slug: a.slug,
    coverImage: a.coverImage,
    characters: a.characters.map((c) => ({
      character: c.character,
      slug: c.slug,
      coverImage: c.coverImage,
      seriesSlug: c.seriesSlug,
    })),
  }));

  const knownLinks: Record<string, string> = {};
  for (const a of albums) {
    for (const c of a.characters) {
      for (const item of c.items) {
        for (const ckpt of item.checkpoints || []) {
          if (ckpt.link && ckpt.name) knownLinks[ckpt.name] = ckpt.link;
        }
        for (const lora of item.loras || []) {
          if (lora.link && lora.name) knownLinks[lora.name] = lora.link;
        }
      }
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "clamp(28px,4vw,48px) clamp(24px,5vw,48px)",
        }}
      >
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "4px" }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>Manage uploads, album covers, and add to existing collections.</p>
        </div>

        <AdminPanel albums={albumData} knownLinks={knownLinks} />
      </div>
    </main>
  );
}
