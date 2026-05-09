"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Images, Search } from "lucide-react";

interface Character {
  slug: string;
  character: string;
}

interface Album {
  slug: string;
  series: string;
  coverImage: string | null;
  totalImages: number;
  characters: Character[];
}

interface Props {
  albums: Album[];
  r2: string;
}

export default function SeriesSearch({ albums, r2 }: Props) {
  const [query, setQuery] = useState("");

  const filteredAlbums = albums.filter(
    (album) =>
      album.series.toLowerCase().includes(query.toLowerCase()) ||
      album.characters.some((c) => c.character.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", gap: "16px", flexWrap: "wrap" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Browse by Series
        </p>
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          >
            <Search style={{ width: "16px", height: "16px" }} />
          </div>
          <input
            type="text"
            placeholder="Search series or characters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 42px",
              borderRadius: "99px",
              border: "1px solid var(--border)",
              background: "var(--bg-raised)",
              color: "var(--text)",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
              e.target.style.boxShadow = "0 0 0 2px var(--accent-border)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {filteredAlbums.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)" }}>
          <p>No series or characters found matching "{query}".</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--space-5)",
          }}
        >
          {filteredAlbums.map((album, i) => {
            const coverUrl = album.coverImage ? `${r2}/images/${album.coverImage}` : null;
            const delay = Math.min(i * 60, 400);

            return (
              <Link
                key={album.slug}
                href={`/series/${album.slug}`}
                className="card-lift pressable anim-fade-up"
                style={{
                  display: "block",
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  textDecoration: "none",
                  animationDelay: `${delay}ms`,
                }}
              >
                {/* Cover image — 16:9 */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "var(--bg-subtle)",
                    overflow: "hidden",
                  }}
                >
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={album.series}
                      fill
                      className="card-cover-img"
                      style={{ objectFit: "cover", objectPosition: "top" }}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Images style={{ width: "32px", height: "32px", color: "var(--border-hi)" }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "var(--space-4) var(--space-5) var(--space-5)" }}>
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--text)",
                      marginBottom: "var(--space-2)",
                      lineHeight: 1.2,
                    }}
                  >
                    {album.series}
                  </h2>

                  <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "var(--space-4)" }}>
                    {album.characters.length} character{album.characters.length !== 1 ? "s" : ""}&ensp;·&ensp;{album.totalImages} images
                  </p>

                  {/* Character pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {album.characters.slice(0, 4).map((c) => (
                      <span
                        key={c.slug}
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.02em",
                          padding: "4px 10px",
                          borderRadius: "99px",
                          background: "var(--bg-subtle)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {c.character}
                      </span>
                    ))}
                    {album.characters.length > 4 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "99px",
                          background: "var(--accent-bg)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        +{album.characters.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
