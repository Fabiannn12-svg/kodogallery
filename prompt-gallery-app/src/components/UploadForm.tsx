"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { nanoid } from "nanoid";
import { extractSDMetadata, type SDMetadata } from "@/lib/sdMetadata";
import {
  Upload, X, Plus, ImageIcon, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

// ── Tiny UI primitives ────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-raised)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "var(--text)",
  outline: "none",
  fontFamily: "var(--font-body)",
  transition: "border-color 150ms ease",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "88px",
  lineHeight: 1.6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--text-3)",
  marginBottom: "6px",
};

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-raised)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "var(--space-5)",
  marginBottom: "var(--space-4)",
};

// ── Cover image dropzone ──────────────────────────────────────

function CoverDropzone({
  label, ratio, value, onChange,
}: { label: string; ratio: "16/9" | "4/5"; value: File | null; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = value ? URL.createObjectURL(value) : null;
  const [drag, setDrag] = useState(false);

  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) onChange(f);
        }}
        style={{
          aspectRatio: ratio,
          borderRadius: "12px",
          border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
          background: drag ? "var(--accent-bg)" : "var(--bg-subtle)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          transition: "border-color 150ms ease, background 150ms ease",
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-3)" }}>
            <ImageIcon style={{ width: "24px", height: "24px", marginBottom: "6px" }} />
            <p style={{ fontSize: "11px" }}>{ratio === "16/9" ? "16:9 cover" : "4:5 portrait"}</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
}

// ── Image file card ───────────────────────────────────────────

interface ImgCard {
  id: string;
  file: File;
  preview: string;
  meta: SDMetadata | null;
  uploading: boolean;
  done: boolean;
  filename: string;
}

function ImageCard({ card, onRemove }: { card: ImgCard; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <img src={card.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.file.name}</p>
          {card.meta
            ? <p style={{ fontSize: "10px", color: "oklch(0.72 0.16 145)" }}>✓ SD metadata detected</p>
            : <p style={{ fontSize: "10px", color: "var(--text-3)" }}>No SD metadata</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {card.done && <CheckCircle2 style={{ width: "16px", height: "16px", color: "oklch(0.72 0.16 145)" }} />}
          {card.uploading && <Loader2 style={{ width: "16px", height: "16px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />}
          {card.meta && (
            <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}>
              {open ? <ChevronUp style={{ width: "16px" }} /> : <ChevronDown style={{ width: "16px" }} />}
            </button>
          )}
          <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}>
            <X style={{ width: "16px" }} />
          </button>
        </div>
      </div>
      {open && card.meta && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "var(--space-3)", fontSize: "11px", color: "var(--text-2)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {card.meta.sampling_steps && <span>Steps: <b>{card.meta.sampling_steps}</b></span>}
          {card.meta.sampling_method && <span>Sampler: <b>{card.meta.sampling_method}</b></span>}
          {card.meta.cfg_scale && <span>CFG: <b>{card.meta.cfg_scale}</b></span>}
          {card.meta.seed && <span>Seed: <b>{card.meta.seed}</b></span>}
          {card.meta.width && <span>Size: <b>{card.meta.width}×{card.meta.height}</b></span>}
          {card.meta.model && <span style={{ gridColumn: "1/-1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Model: <b>{card.meta.model}</b></span>}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────

export default function UploadForm() {
  // Core fields
  const [animeName, setAnimeName] = useState("");
  const [charName, setCharName]   = useState("");
  const [tags, setTags]           = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState("");
  const [title, setTitle]         = useState("");

  // Prompt fields — auto-filled from first image with metadata
  const [posPrompt, setPosPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [cfgScale, setCfgScale]   = useState("");
  const [steps, setSteps]         = useState("");
  const [sampler, setSampler]     = useState("");
  const [seed, setSeed]           = useState("");
  const [width, setWidth]         = useState("");
  const [height, setHeight]       = useState("");
  const [model, setModel]         = useState("");

  // Images
  const [cards, setCards]         = useState<ImgCard[]>([]);
  const imgRef                    = useRef<HTMLInputElement>(null);

  // Covers
  const [seriesCover, setSeriesCover]   = useState<File | null>(null);
  const [charCover, setCharCover]       = useState<File | null>(null);

  // Submit state
  const [status, setStatus] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // ── auto-fill from SD metadata ──
  const applyMeta = useCallback((meta: SDMetadata) => {
    if (meta.positive_prompt) setPosPrompt(p => p || meta.positive_prompt!);
    if (meta.negative_prompt) setNegPrompt(p => p || meta.negative_prompt!);
    if (meta.cfg_scale)       setCfgScale(p => p || meta.cfg_scale!);
    if (meta.sampling_steps)  setSteps(p    => p || meta.sampling_steps!);
    if (meta.sampling_method) setSampler(p  => p || meta.sampling_method!);
    if (meta.seed)            setSeed(p     => p || meta.seed!);
    if (meta.width)           setWidth(p    => p || meta.width!);
    if (meta.height)          setHeight(p   => p || meta.height!);
    if (meta.model)           setModel(p    => p || meta.model!);
  }, []);

  // ── handle image file add ──
  const addImages = useCallback(async (files: FileList) => {
    const newCards: ImgCard[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()!.toLowerCase();
      const id  = nanoid(10);
      const filename = `${id}.${ext}`;
      const meta = await extractSDMetadata(file);
      if (meta) applyMeta(meta);
      newCards.push({
        id, file, filename,
        preview: URL.createObjectURL(file),
        meta, uploading: false, done: false,
      });
    }
    setCards(prev => [...prev, ...newCards]);
  }, [applyMeta]);

  // ── upload one file via server-side proxy (no CORS issues) ──
  const uploadFile = async (file: File, filename: string, folder = "images") => {
    const form = new FormData();
    form.append("file", file);
    form.append("filename", filename);
    form.append("folder", folder);
    const res = await fetch("/api/upload-file", { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return filename;
  };

  // ── add tag ──
  const addTag = (val: string) => {
    const t = val.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeName || !charName || cards.length === 0) {
      setErrMsg("Anime name, character name, and at least one image are required.");
      return;
    }
    setStatus("uploading"); setErrMsg("");

    try {
      // 1. Upload images
      const uploadedFilenames: string[] = [];
      for (const card of cards) {
        setCards(prev => prev.map(c => c.id === card.id ? { ...c, uploading: true } : c));
        await uploadFile(card.file, card.filename, "images");
        setCards(prev => prev.map(c => c.id === card.id ? { ...c, uploading: false, done: true } : c));
        uploadedFilenames.push(card.filename);
      }

      // 2. Upload covers
      let seriesCoverFilename = "";
      let charCoverFilename   = "";
      if (seriesCover) {
        const ext = seriesCover.name.split(".").pop()!.toLowerCase();
        seriesCoverFilename = `cover_series_${nanoid(8)}.${ext}`;
        await uploadFile(seriesCover, seriesCoverFilename, "images");
      }
      if (charCover) {
        const ext = charCover.name.split(".").pop()!.toLowerCase();
        charCoverFilename = `cover_char_${nanoid(8)}.${ext}`;
        await uploadFile(charCover, charCoverFilename, "images");
      }

      // 3. Build metadata
      const id = nanoid(12);
      const allTags = [charName.trim(), animeName.trim(), ...tags];
      const lorasFromMeta = cards
        .flatMap(c => c.meta?.loras || [])
        .filter((l, i, arr) => arr.findIndex(x => x.name === l.name) === i)
        .map(l => ({ name: l.name }));

      const metadata = {
        id,
        title: title || `${charName} — ${animeName}`,
        tags: allTags,
        positive_prompt: posPrompt,
        negative_prompt: negPrompt,
        cfg_scale:        cfgScale || undefined,
        sampling_steps:   steps    || undefined,
        sampling_method:  sampler  || undefined,
        seed:             seed     || undefined,
        width:            width    ? parseInt(width)  : undefined,
        height:           height   ? parseInt(height) : undefined,
        checkpoints: model ? [{ name: model }] : [],
        loras: lorasFromMeta,
        images: uploadedFilenames.map(f => ({ filename: f })),
        series_cover_image: seriesCoverFilename || undefined,
        char_cover_image:   charCoverFilename   || undefined,
        created_at: Date.now(),
      };

      // 4. Save metadata
      const saveRes = await fetch("/api/save-metadata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
      if (!saveRes.ok) throw new Error("Failed to save metadata");

      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div style={{ ...sectionStyle, textAlign: "center", padding: "var(--space-8)" }}>
        <CheckCircle2 style={{ width: "48px", height: "48px", color: "oklch(0.72 0.16 145)", margin: "0 auto var(--space-4)" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-2)" }}>Upload complete!</h2>
        <p style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "var(--space-5)" }}>Your generation has been saved to the gallery.</p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
          <a href="/" style={{ padding: "8px 20px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-2)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>View Gallery</a>
          <button onClick={() => { setStatus("idle"); setCards([]); setAnimeName(""); setCharName(""); setTags([]); setTitle(""); setPosPrompt(""); setNegPrompt(""); setCfgScale(""); setSteps(""); setSampler(""); setSeed(""); setWidth(""); setHeight(""); setModel(""); setSeriesCover(null); setCharCover(null); }}
            style={{ padding: "8px 20px", borderRadius: "99px", border: "1px solid var(--accent-border)", background: "var(--accent-bg)", color: "var(--accent)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Album info ── */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-4)" }}>Album Info</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <div>
            <label style={labelStyle}>Anime / Series *</label>
            <input value={animeName} onChange={e => setAnimeName(e.target.value)} placeholder="e.g. Blend S" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Character Name *</label>
            <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Kaho Hinata" required style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <label style={labelStyle}>Title (optional)</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto: Character — Anime" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Extra Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
            {tags.map(t => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "99px", background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
                {t}
                <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0, lineHeight: 1 }}><X style={{ width: "10px" }} /></button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }} placeholder="Type tag + Enter" style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={() => addTag(tagInput)} style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-2)", cursor: "pointer", fontSize: "13px" }}>Add</button>
          </div>
        </div>
      </div>

      {/* ── Custom covers ── */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Custom Album Covers</p>
        <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "var(--space-4)" }}>Optional. If left empty, the first uploaded image is used.</p>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)" }}>
          <CoverDropzone label="Series Cover (16:9)" ratio="16/9" value={seriesCover} onChange={setSeriesCover} />
          <CoverDropzone label="Character Cover (4:5)" ratio="4/5" value={charCover} onChange={setCharCover} />
        </div>
      </div>

      {/* ── Images ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>Images *</p>
            <p style={{ fontSize: "11px", color: "var(--text-3)" }}>PNG/WebP with A1111/Forge metadata will be auto-parsed.</p>
          </div>
          <button type="button" onClick={() => imgRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", border: "1px solid var(--accent-border)", background: "var(--accent-bg)", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
            <Plus style={{ width: "14px" }} /> Add Images
          </button>
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { if (e.target.files) addImages(e.target.files); e.target.value = ""; }} />

        {cards.length === 0 ? (
          <div
            onClick={() => imgRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) addImages(e.dataTransfer.files); }}
            style={{ border: "2px dashed var(--border)", borderRadius: "12px", padding: "var(--space-7)", textAlign: "center", cursor: "pointer", color: "var(--text-3)" }}
          >
            <Upload style={{ width: "28px", height: "28px", margin: "0 auto var(--space-3)" }} />
            <p style={{ fontSize: "13px" }}>Drop images here or click to browse</p>
            <p style={{ fontSize: "11px", marginTop: "4px" }}>PNG · WebP · JPG</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {cards.map(card => (
              <ImageCard key={card.id} card={card} onRemove={() => setCards(prev => prev.filter(c => c.id !== card.id))} />
            ))}
            <button type="button" onClick={() => imgRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "10px", border: "1px dashed var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontSize: "12px" }}>
              <Plus style={{ width: "14px" }} /> Add more
            </button>
          </div>
        )}
      </div>

      {/* ── Prompt fields (auto-fill) ── */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Prompt & Parameters</p>
        <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "var(--space-4)" }}>Auto-filled from image metadata. Edit freely.</p>

        <div style={{ marginBottom: "var(--space-4)" }}>
          <label style={labelStyle}>Positive Prompt</label>
          <textarea value={posPrompt} onChange={e => setPosPrompt(e.target.value)} placeholder="masterpiece, best quality, 1girl …" style={textareaStyle} />
        </div>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <label style={labelStyle}>Negative Prompt</label>
          <textarea value={negPrompt} onChange={e => setNegPrompt(e.target.value)} placeholder="ugly, blurry …" style={{ ...textareaStyle, minHeight: "64px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
          {[["CFG Scale", cfgScale, setCfgScale, "7"], ["Steps", steps, setSteps, "28"], ["Sampler", sampler, setSampler, "DPM++ 2M"]].map(([lbl, val, set, ph]) => (
            <div key={lbl as string}>
              <label style={labelStyle}>{lbl as string}</label>
              <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={ph as string} style={inputStyle} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)" }}>
          {[["Seed", seed, setSeed, "-1"], ["Width", width, setWidth, "512"], ["Height", height, setHeight, "768"]].map(([lbl, val, set, ph]) => (
            <div key={lbl as string}>
              <label style={labelStyle}>{lbl as string}</label>
              <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={ph as string} style={inputStyle} />
            </div>
          ))}
        </div>
        {model && (
          <div style={{ marginTop: "var(--space-3)" }}>
            <label style={labelStyle}>Model / Checkpoint</label>
            <input value={model} onChange={e => setModel(e.target.value)} style={inputStyle} />
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {(status === "error" || errMsg) && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderRadius: "10px", background: "oklch(0.18 0.06 25 / 0.3)", border: "1px solid oklch(0.35 0.12 25)", color: "oklch(0.75 0.15 25)", fontSize: "13px", marginBottom: "var(--space-4)" }}>
          <AlertCircle style={{ width: "16px", flexShrink: 0 }} />
          {errMsg || "Upload failed. Please try again."}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={status === "uploading"}
        style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: status === "uploading" ? "var(--bg-subtle)" : "var(--accent)", color: "white", fontSize: "14px", fontWeight: 700, cursor: status === "uploading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 200ms ease, opacity 200ms ease", opacity: status === "uploading" ? 0.7 : 1 }}
      >
        {status === "uploading" ? (<><Loader2 style={{ width: "16px", animation: "spin 1s linear infinite" }} />Uploading…</>) : (<><Upload style={{ width: "16px" }} />Upload to Gallery</>)}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
