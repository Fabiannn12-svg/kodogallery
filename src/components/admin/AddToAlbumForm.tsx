"use client";

import { useState, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import { ChevronDown } from "lucide-react";
import {
  card, label, input, ImageDropzone, PromptFields,
  SubmitBtn, ErrBanner, SuccessCard, uploadFileToR2,
  type ImgCard,
} from "./shared";
import type { SDMetadata } from "@/lib/sdMetadata";

interface CharInfo { character: string; slug: string; coverImage: string; }
interface AlbumInfo { series: string; slug: string; coverImage: string; characters: CharInfo[]; }

export default function AddToAlbumForm({ albums, knownLinks = {} }: { albums: AlbumInfo[]; knownLinks?: Record<string, string> }) {
  // Selection
  const [seriesSlug, setSeriesSlug] = useState("");
  const [charSlug,   setCharSlug]   = useState("");

  const selectedSeries = albums.find(a => a.slug === seriesSlug) ?? null;
  const selectedChar   = selectedSeries?.characters.find(c => c.slug === charSlug) ?? null;

  // Prompt fields
  const [posPrompt, setPosPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [cfgScale,  setCfgScale]  = useState("");
  const [steps,     setSteps]     = useState("");
  const [sampler,   setSampler]   = useState("");
  const [seed,      setSeed]      = useState("");
  const [checkpoints, setCheckpoints] = useState<{name: string; link: string}[]>([]);
  const [loras, setLoras]             = useState<{name: string; link: string}[]>([]);

  // Images
  const [cards,   setCards]   = useState<ImgCard[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);

  // Status
  const [status, setStatus] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const applyMeta = useCallback((meta: SDMetadata) => {
    if (meta.positive_prompt) setPosPrompt(p => p || meta.positive_prompt!);
    if (meta.negative_prompt) setNegPrompt(p => p || meta.negative_prompt!);
    if (meta.cfg_scale)       setCfgScale(p  => p || meta.cfg_scale!);
    if (meta.sampling_steps)  setSteps(p     => p || meta.sampling_steps!);
    if (meta.sampling_method) setSampler(p   => p || meta.sampling_method!);
    if (meta.seed)            setSeed(p      => p || meta.seed!);
    
    // Auto-fill Checkpoints
    if (meta.model) {
      setCheckpoints(prev => {
        if (prev.some(c => c.name === meta.model)) return prev;
        return [...prev, { name: meta.model!, link: knownLinks[meta.model!] || "" }];
      });
    }
    
    // Auto-fill LoRAs
    if (meta.loras && meta.loras.length > 0) {
      setLoras(prev => {
        const newLoras = [...prev];
        for (const l of meta.loras!) {
          if (!newLoras.some(x => x.name === l.name)) {
            newLoras.push({ name: l.name, link: knownLinks[l.name] || "" });
          }
        }
        return newLoras;
      });
    }
  }, [knownLinks]);

  const reset = () => {
    setSeriesSlug(""); setCharSlug("");
    setPosPrompt(""); setNegPrompt(""); setCfgScale(""); setSteps("");
    setSampler(""); setSeed(""); setCheckpoints([]); setLoras([]);
    setCards([]);
    setStatus("idle"); setErrMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries || !selectedChar || cards.length === 0) {
      setErrMsg("Select a series, character, and add at least one image.");
      return;
    }
    setStatus("uploading"); setErrMsg("");

    try {
      // Upload images
      const filenames: string[] = [];
      for (const c of cards) {
        setCards(prev => prev.map(x => x.id === c.id ? { ...x, uploading: true } : x));
        await uploadFileToR2(c.file, c.filename);
        setCards(prev => prev.map(x => x.id === c.id ? { ...x, uploading: false, done: true } : x));
        filenames.push(c.filename);
      }

      // Save metadata — tags[0]=character, tags[1]=series (same convention)
      const id = nanoid(12);
      const payload = {
        id,
        title: `${selectedChar.character} — ${selectedSeries.series}`,
        tags: [selectedChar.character, selectedSeries.series],
        positive_prompt: posPrompt || undefined,
        negative_prompt: negPrompt || undefined,
        cfg_scale:        cfgScale  || undefined,
        sampling_steps:   steps     || undefined,
        sampling_method:  sampler   || undefined,
        seed:             seed      || undefined,
        checkpoints:      checkpoints.filter(c => c.name.trim()),
        loras:            loras.filter(l => l.name.trim()),
        images: cards.map(c => ({
          filename: c.filename,
          metadata: c.meta ? {
            positive_prompt: c.meta.positive_prompt || undefined,
            negative_prompt: c.meta.negative_prompt || undefined,
            sampling_steps: c.meta.sampling_steps || undefined,
            sampling_method: c.meta.sampling_method || undefined,
            cfg_scale: c.meta.cfg_scale || undefined,
            seed: c.meta.seed || undefined,
            width: c.meta.width?.toString() || undefined,
            height: c.meta.height?.toString() || undefined,
            model: c.meta.model || undefined,
          } : undefined
        })),
        created_at: Date.now(),
      };

      const res = await fetch("/api/save-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save metadata");
      setStatus("done");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  if (status === "done") return <SuccessCard onReset={reset} />;

  const selectStyle: React.CSSProperties = {
    ...input,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "32px",
    cursor: "pointer",
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Series + Character picker */}
      <div style={card}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-4)" }}>Pick Album</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div>
            <p style={label}>Series</p>
            <select
              value={seriesSlug}
              onChange={e => { setSeriesSlug(e.target.value); setCharSlug(""); }}
              required
              style={selectStyle}
            >
              <option value="">— Select series —</option>
              {albums.map(a => (
                <option key={a.slug} value={a.slug}>{a.series}</option>
              ))}
            </select>
          </div>

          <div>
            <p style={label}>Character</p>
            <select
              value={charSlug}
              onChange={e => setCharSlug(e.target.value)}
              required
              disabled={!selectedSeries}
              style={{ ...selectStyle, opacity: !selectedSeries ? 0.4 : 1 }}
            >
              <option value="">— Select character —</option>
              {selectedSeries?.characters.map(c => (
                <option key={c.slug} value={c.slug}>{c.character}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected summary */}
        {selectedSeries && selectedChar && (
          <div style={{ marginTop: "var(--space-3)", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
            {selectedChar.coverImage && (
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/images/${selectedChar.coverImage}`}
                alt=""
                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }}
              />
            )}
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>{selectedChar.character}</p>
              <p style={{ fontSize: "10px", color: "var(--text-3)" }}>{selectedSeries.series}</p>
            </div>
          </div>
        )}
      </div>

      {/* Images */}
      <div style={card}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Images *</p>
        <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "var(--space-3)" }}>SD metadata auto-detected from PNG/WebP.</p>
        <ImageDropzone cards={cards} setCards={setCards} imgRef={imgRef} applyMeta={applyMeta} />
      </div>

      {/* Prompt fields */}
      <div style={card}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Prompt & Parameters</p>
        <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "var(--space-4)" }}>Auto-filled from image metadata. Edit freely.</p>
        <PromptFields {...{ posPrompt, setPosPrompt, negPrompt, setNegPrompt, cfgScale, setCfgScale, steps, setSteps, sampler, setSampler, seed, setSeed, checkpoints, setCheckpoints, loras, setLoras }} />
      </div>

      {errMsg && <ErrBanner msg={errMsg} />}
      <SubmitBtn loading={status === "uploading"} label="Add to Album" />
    </form>
  );
}
