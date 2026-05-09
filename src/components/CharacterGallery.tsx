"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Lightbox from "@/components/Lightbox";
import { getImageUrl } from "@/lib/utils";
import type { PromptItem } from "@/lib/types";
import { Copy, Check, X, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  items: PromptItem[];
  character: string;
}

// ── Grid constants ────────────────────────────────────────────
const GAP       = 6;   // px — uniform gap everywhere
const ROW_UNIT  = 10;  // px — grid-auto-rows value
const ROW_STEP  = ROW_UNIT + GAP; // 16px per span unit

function getColCount() {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 640)  return 3;
  return 2;
}

// ── CopyButton ────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", padding: "4px 10px", borderRadius: "99px", border: "1px solid var(--border)", background: copied ? "oklch(0.35 0.12 145 / 0.2)" : "var(--bg-subtle)", color: copied ? "oklch(0.75 0.16 145)" : "var(--text-3)", cursor: "pointer", transition: "all 150ms ease" }}
    >
      {copied ? <Check style={{ width: "10px" }} /> : <Copy style={{ width: "10px" }} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── ParamChip ─────────────────────────────────────────────────
function ParamChip({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "10px", padding: "var(--space-2) var(--space-3)" }}>
      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "3px" }}>{label}</p>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CharacterGallery({ items }: Props) {
  const [lightbox,   setLightbox]   = useState<{ images: { url: string; title?: string }[]; index: number } | null>(null);
  const [activeItem, setActiveItem] = useState<PromptItem | null>(null);
  // span map: key = `${itemId}-${imgIdx}` → number of grid row spans
  const [spans, setSpans] = useState<Record<string, number>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/delete-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setActiveItem(null);
        router.refresh();
      } else {
        alert("Failed to delete post");
      }
    } catch (e) {
      alert("Error deleting post");
    } finally {
      setIsDeleting(false);
    }
  };

  const getAllImages = useCallback((item: PromptItem) => {
    if (item.images && item.images.length > 0) {
      return item.images.map(img => ({
        url: getImageUrl(img.filename),
        title: item.title,
        metadata: img.metadata || {
          positive_prompt: item.positive_prompt,
          negative_prompt: item.negative_prompt,
          sampling_steps: item.sampling_steps,
          sampling_method: item.sampling_method,
          cfg_scale: item.cfg_scale,
          seed: item.seed,
          width: item.width?.toString(),
          height: item.height?.toString(),
        }
      }));
    } else {
      const filenames = item.image_filenames || (item.image_filename ? [item.image_filename] : []);
      return filenames.map(f => ({ 
        url: getImageUrl(f), 
        title: item.title,
        metadata: {
          positive_prompt: item.positive_prompt,
          negative_prompt: item.negative_prompt,
          sampling_steps: item.sampling_steps,
          sampling_method: item.sampling_method,
          cfg_scale: item.cfg_scale,
          seed: item.seed,
          width: item.width?.toString(),
          height: item.height?.toString(),
        }
      }));
    }
  }, []);

  const imgRefs = useRef<Map<string, HTMLImageElement>>(new Map());

  // Calculate row span from natural image dimensions
  const calcSpan = useCallback((key: string, img: HTMLImageElement) => {
    if (!gridRef.current) return;
    imgRefs.current.set(key, img);
    const cols     = getColCount();
    const gridW    = gridRef.current.offsetWidth;
    const colWidth = (gridW - GAP * (cols - 1)) / cols;
    const nH       = img.naturalHeight || 1;
    const nW       = img.naturalWidth  || 1;
    const itemH    = colWidth * (nH / nW);
    // Total height a span N occupies = N*ROW_UNIT + (N-1)*GAP = N*ROW_STEP - GAP
    // Solve for N: N = ceil((itemH + GAP) / ROW_STEP)
    const span = Math.ceil((itemH + GAP) / ROW_STEP);
    setSpans(prev => ({ ...prev, [key]: span }));
  }, []);

  // Recalculate all spans on window resize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!gridRef.current) return;
        const cols     = getColCount();
        const gridW    = gridRef.current.offsetWidth;
        const colWidth = (gridW - GAP * (cols - 1)) / cols;
        
        setSpans(prev => {
          const next = { ...prev };
          let changed = false;
          imgRefs.current.forEach((img, key) => {
            const nH    = img.naturalHeight || 1;
            const nW    = img.naturalWidth  || 1;
            if (nH <= 1 || nW <= 1) return; // Skip if not fully loaded
            const itemH = colWidth * (nH / nW);
            const span  = Math.ceil((itemH + GAP) / ROW_STEP);
            if (next[key] !== span) {
              next[key] = span;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Only show 1 card per item (batch upload)
  const allCards = items.map(item => {
    const filenames = item.images?.map(i => i.filename) || item.image_filenames || (item.image_filename ? [item.image_filename] : []);
    return { item, filename: filenames[0], idx: 0, isFirst: true };
  }).filter(c => c.filename); // Ensure there is an image

  return (
    <>
      {/* ── Prompt Detail Sheet ───────────────────────────── */}
      <AnimatePresence>
        {activeItem && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setActiveItem(null)}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "oklch(0 0 0 / 0.7)", backdropFilter: "blur(6px)" }}
            />
            <motion.div key="sheet"
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", zIndex: 41, width: "100%", maxWidth: "640px", maxHeight: "82dvh", overflowY: "auto", background: "var(--bg-raised)", border: "1px solid var(--border-hi)", borderBottom: "none", borderRadius: "24px 24px 0 0", padding: "var(--space-6)" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
                <div style={{ width: "36px", height: "4px", borderRadius: "99px", background: "var(--border-hi)" }} />
              </div>
              <div style={{ position: "absolute", top: "var(--space-5)", right: "var(--space-5)", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleDelete(activeItem.id)}
                  disabled={isDeleting}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid oklch(0.35 0.12 25)", background: "oklch(0.18 0.06 25 / 0.3)", color: "oklch(0.75 0.15 25)", cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isDeleting ? 0.5 : 1, transition: "all 150ms ease" }}
                  title="Delete Post"
                >
                  <Trash2 style={{ width: "14px" }} />
                </button>
                <button onClick={() => setActiveItem(null)}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                ><X style={{ width: "14px" }} /></button>
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-3)", paddingRight: "40px", lineHeight: 1.3 }}>{activeItem.title}</h3>

              {activeItem.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
                  {activeItem.tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", padding: "4px 10px", borderRadius: "99px", background: "var(--accent-bg)", color: "var(--accent-hi)", border: "1px solid var(--accent-border)" }}>{tag}</span>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
                <ParamChip label="CFG Scale" value={activeItem.cfg_scale} />
                <ParamChip label="Steps"     value={activeItem.sampling_steps} />
                <ParamChip label="Sampler"   value={activeItem.sampling_method} />
                <ParamChip label="Seed"      value={activeItem.seed} />
                <ParamChip label="Width"     value={activeItem.width  ? `${activeItem.width}px`  : undefined} />
                <ParamChip label="Height"    value={activeItem.height ? `${activeItem.height}px` : undefined} />
              </div>

              {activeItem.positive_prompt && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.72 0.16 145)" }}>Positive</span>
                    <CopyButton text={activeItem.positive_prompt} />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: 1.7, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "12px", padding: "var(--space-3) var(--space-4)", fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeItem.positive_prompt}</p>
                </div>
              )}

              {activeItem.negative_prompt && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.65 0.15 25)" }}>Negative</span>
                    <CopyButton text={activeItem.negative_prompt} />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: 1.7, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "12px", padding: "var(--space-3) var(--space-4)", fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeItem.negative_prompt}</p>
                </div>
              )}

              {(activeItem.checkpoints?.length || 0) > 0 && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.72 0.14 70)", marginBottom: "var(--space-2)" }}>Checkpoints</p>
                  {activeItem.checkpoints!.map((c, i) => (
                    <a key={i} href={c.link || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "12px", color: "oklch(0.72 0.14 70)", textDecoration: "none", marginBottom: "var(--space-1)" }}>
                      <ExternalLink style={{ width: "10px", flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    </a>
                  ))}
                </div>
              )}

              {(activeItem.loras?.length || 0) > 0 && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "var(--space-2)" }}>LoRAs</p>
                  {activeItem.loras!.map((l, i) => (
                    <a key={i} href={l.link || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "12px", color: "var(--accent-hi)", textDecoration: "none", marginBottom: "var(--space-1)" }}>
                      <ExternalLink style={{ width: "10px", flexShrink: 0 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      {/* ── CSS Grid masonry — equal 6px gaps everywhere ──── */}
      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: `${ROW_UNIT}px`,
          gap: `${GAP}px`,
          padding: `${GAP}px`,   /* outer padding = gap → all gaps equal */
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gallery-grid"
      >
        {allCards.map(({ item, filename, idx, isFirst }, cardIndex) => {
          const imageUrl  = getImageUrl(filename);
          const key       = `${item.id}-${idx}`;
          const span      = spans[key] ?? 30;   /* default 30 rows ≈ portrait */
          const allImgCount = item.images?.length || item.image_filenames?.length || (item.image_filename ? 1 : 0);
          const delay     = Math.min(cardIndex * 30, 500);

          return (
            <div
              key={key}
              style={{
                gridRowEnd: `span ${span}`,
                animation: `fadeIn 0.35s ease both`,
                animationDelay: `${delay}ms`,
              }}
            >
              <div
                className="gallery-card"
                onClick={() => { setLightbox({ images: getAllImages(item), index: idx }); }}
                style={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                  transition: "opacity 200ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={item.title || "Gallery image"}
                  loading="lazy"
                  onLoad={e => calcSpan(key, e.currentTarget)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "8px" }}
                />

                {/* Hover overlay */}
                <div
                  className="card-overlay"
                  style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, oklch(0.08 0.008 270 / 0.95) 0%, oklch(0.08 0.008 270 / 0.3) 40%, transparent 100%)", opacity: 0, transition: "opacity 220ms ease", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "10px", borderRadius: "8px" }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "white", lineHeight: 1.3, marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                    {item.title}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setActiveItem(item); }}
                    style={{ alignSelf: "flex-start", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 9px", borderRadius: "99px", border: "1px solid var(--accent-border)", background: "var(--accent-bg)", color: "var(--accent-hi)", cursor: "pointer", backdropFilter: "blur(4px)" }}
                  >
                    View Prompt
                  </button>
                </div>

                {/* Multi-image badge */}
                {isFirst && allImgCount > 1 && (
                  <div style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "99px", padding: "2px 7px", fontSize: "9px", fontWeight: 700, color: "white", letterSpacing: "0.06em" }}>
                    {allImgCount}×
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .gallery-grid { }
        @media (max-width: 1023px) { .gallery-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 639px)  { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
