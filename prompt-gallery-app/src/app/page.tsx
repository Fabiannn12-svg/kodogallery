import { getSeriesAlbums } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import SeriesSearch from "@/components/SeriesSearch";

export const revalidate = 0;

export default async function HomePage() {
  const albums = await getSeriesAlbums();
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)",
        }}
      >
        {/* Header/Title is inside SeriesSearch */}
        <SeriesSearch albums={albums} r2={r2} />
      </div>
    </main>
  );
}
