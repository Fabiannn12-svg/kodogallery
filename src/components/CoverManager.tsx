"use client";

import { useState, useRef } from "react";
import { nanoid } from "nanoid";
import { ImageIcon, Upload, CheckCircle2, Loader2, ChevronDown, ChevronRight } from "lucide-react";

import type { SeriesAlbum as AlbumInfo } from "@/lib/types";

const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// ── Single cover cell ─────────────────────────────────────────

function CoverCell({
  label,
  currentImage,
  ratio,
  onUpload,
}: {
  label: string;
  currentImage: string;
  ratio: "16/9" | "4/5";
  onUpload: (file: File) => Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setStatus("uploading");
    await onUpload(file);
    setStatus("done");
    setTimeout(() => setStatus("idle"), 2500);
  };

  const currentUrl = currentImage ? `${R2}/images/${currentImage}` : null;
  const displayUrl = preview || currentUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}
      >
        {label}
      </p>

      <div
        onClick={() => status !== "uploading" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handle(f);
        }}
        style={{
          aspectRatio: ratio,
          borderRadius: "10px",
          border: `2px ${drag ? "solid" : "dashed"} ${drag ? "var(--accent)" : status === "done" ? "oklch(0.55 0.16 145)" : "var(--border)"}`,
          background: drag ? "var(--accent-bg)" : "var(--bg-subtle)",
          cursor: status === "uploading" ? "wait" : "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 150ms ease, background 150ms ease",
        }}
      >
        {/* Current / preview image */}
        {displayUrl && (
          <img
            src={displayUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: displayUrl
              ? "oklch(0 0 0 / 0.45)"
              : "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            opacity: status !== "idle" || !displayUrl ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
          className="cover-overlay"
        >
          {status === "uploading" && (
            <Loader2
              style={{ width: "20px", height: "20px", color: "white", animation: "spin 1s linear infinite" }}
            />
          )}
          {status === "done" && (
            <CheckCircle2 style={{ width: "20px", height: "20px", color: "oklch(0.75 0.16 145)" }} />
          )}
          {status === "idle" && (
            <>
              {displayUrl ? (
                <Upload style={{ width: "18px", height: "18px", color: "white" }} />
              ) : (
                <ImageIcon style={{ width: "20px", height: "20px", color: "var(--text-3)" }} />
              )}
              <span style={{ fontSize: "10px", color: displayUrl ? "white" : "var(--text-3)", fontWeight: 600 }}>
                {displayUrl ? "Change" : "Upload"}
              </span>
            </>
          )}
        </div>

        {/* Show overlay on hover via CSS */}
        <style>{`.cover-cell:hover .cover-overlay { opacity: 1 !important; }`}</style>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ── Series row ────────────────────────────────────────────────

function SeriesRow({ album }: { album: AlbumInfo }) {
  const [open, setOpen] = useState(false);

  const uploadCover = async (
    file: File,
    type: "series" | "char",
    seriesName: string,
    characterName?: string
  ) => {
    const ext      = file.name.split(".").pop()!.toLowerCase();
    const filename = `cover_${type}_${nanoid(8)}.${ext}`;

    // 1. Upload via server-side proxy (avoids CORS on direct R2 PUT)
    const form = new FormData();
    form.append("file", file);
    form.append("filename", filename);
    form.append("folder", "images");

    const uploadRes = await fetch("/api/upload-file", { method: "POST", body: form });
    if (!uploadRes.ok) throw new Error("Upload to R2 failed");

    // 2. Patch all matching metadata JSONs
    await fetch("/api/update-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, type, seriesName, characterName }),
    });
  };

  return (
    <div
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "var(--space-3)",
      }}
    >
      {/* Series header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
          gap: "var(--space-4)",
          padding: "var(--space-4) var(--space-5)",
        }}
      >
        {/* Series info + cover */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
          >
            {open
              ? <ChevronDown style={{ width: "16px", height: "16px" }} />
              : <ChevronRight style={{ width: "16px", height: "16px" }} />}
          </button>

          {/* Tiny series cover preview */}
          <div
            style={{
              width: "72px",
              aspectRatio: "16/9",
              borderRadius: "6px",
              overflow: "hidden",
              background: "var(--bg-subtle)",
              flexShrink: 0,
            }}
          >
            {album.coverImage ? (
              <img
                src={`${R2}/images/${album.coverImage}`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ImageIcon style={{ width: "14px", color: "var(--border-hi)" }} />
              </div>
            )}
          </div>

          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>
              {album.series}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-3)" }}>
              {album.characters.length} character{album.characters.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Series cover upload (compact) */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ width: "120px" }}>
            <CoverCell
              label="Series Cover 16:9"
              currentImage={album.coverImage}
              ratio="16/9"
              onUpload={(file) => uploadCover(file, "series", album.series)}
            />
          </div>
        </div>
      </div>

      {/* Characters — collapsible */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "var(--space-4) var(--space-5) var(--space-5)",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: "var(--space-4)",
            }}
          >
            Character Covers (4:5)
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {album.characters.map((char) => (
              <div key={char.slug} className="cover-cell">
                <CoverCell
                  label={char.character}
                  currentImage={char.coverImage}
                  ratio="4/5"
                  onUpload={(file) =>
                    uploadCover(file, "char", album.series, char.character)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function CoverManager({ albums }: { albums: AlbumInfo[] }) {
  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {albums.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-9)",
            color: "var(--text-3)",
            border: "2px dashed var(--border)",
            borderRadius: "16px",
          }}
        >
          <ImageIcon style={{ width: "32px", height: "32px", margin: "0 auto var(--space-3)" }} />
          <p style={{ fontSize: "14px" }}>No series found. Upload some generations first.</p>
        </div>
      ) : (
        albums.map((album) => <SeriesRow key={album.slug} album={album} />)
      )}
    </div>
  );
}
