import { getCharacterBySlug, getSeriesAlbums } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CharacterGallery from "@/components/CharacterGallery";

export const revalidate = 0;

export async function generateStaticParams() {
  const albums = await getSeriesAlbums();
  const params: { series: string; character: string }[] = [];
  for (const album of albums) {
    for (const char of album.characters) {
      params.push({ series: album.slug, character: char.slug });
    }
  }
  return params;
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ series: string; character: string }>;
}) {
  const { series: seriesSlug, character: charSlug } = await params;
  const charAlbum = await getCharacterBySlug(seriesSlug, charSlug);
  if (!charAlbum) notFound();

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* ── Breadcrumb only — no large title block ─────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--text-3)",
          padding: "10px 10px 6px",   /* small top padding, same side as gallery */
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ color: "var(--text-3)", textDecoration: "none" }}>Home</Link>
        <ChevronRight style={{ width: "11px", height: "11px", flexShrink: 0 }} />
        <Link href={`/series/${seriesSlug}`} style={{ color: "var(--text-3)", textDecoration: "none" }}>
          {charAlbum.series}
        </Link>
        <ChevronRight style={{ width: "11px", height: "11px", flexShrink: 0 }} />
        <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{charAlbum.character}</span>
      </nav>

      {/* ── Gallery — full width, edge-to-edge ─────────────── */}
      <CharacterGallery items={charAlbum.items} character={charAlbum.character} />
    </main>
  );
}
