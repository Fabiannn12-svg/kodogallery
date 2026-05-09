"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxImage {
  url: string;
  title?: string;
  metadata?: any;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [showPrompt, setShowPrompt] = useState(false);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconBtn: React.CSSProperties = {
    position: "absolute",
    zIndex: 10,
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid var(--border-hi)",
    background: "oklch(0.10 0.008 270 / 0.7)",
    backdropFilter: "blur(8px)",
    color: "var(--text-2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 150ms ease, color 150ms ease, transform 120ms var(--ease-out-expo)",
  };

  const activeMeta = images[current].metadata;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "oklch(0.05 0.005 270 / 0.96)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ ...iconBtn, top: "20px", right: "20px" }}
        >
          <X style={{ width: "16px", height: "16px" }} />
        </button>

        {/* View Prompt Button */}
        {activeMeta && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPrompt(!showPrompt); }}
            style={{
              position: "absolute",
              top: "20px",
              right: "72px",
              zIndex: 10,
              height: "40px",
              padding: "0 16px",
              borderRadius: "99px",
              border: "1px solid var(--accent-border)",
              background: showPrompt ? "var(--accent)" : "oklch(0.10 0.008 270 / 0.7)",
              backdropFilter: "blur(8px)",
              color: showPrompt ? "white" : "var(--accent-hi)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms ease",
            }}
          >
            {showPrompt ? "Hide Prompt" : "View Prompt"}
          </button>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              style={{ ...iconBtn, left: "16px", top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronLeft style={{ width: "18px", height: "18px" }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              style={{ ...iconBtn, right: "16px", top: "50%", transform: "translateY(-50%)" }}
            >
              <ChevronRight style={{ width: "18px", height: "18px" }} />
            </button>
          </>
        )}

        {/* Image */}
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={images[current].url}
            alt={images[current].title || "Gallery image"}
            width={1200}
            height={1600}
            style={{
              maxWidth: "min(90vw, 960px)",
              maxHeight: "88dvh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
            unoptimized
            priority
          />
        </motion.div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "99px",
                  background: i === current ? "var(--accent)" : "var(--border-hi)",
                  border: "none",
                  cursor: "pointer",
                  transition: "width 200ms var(--ease-out-expo), background 200ms ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        {images[current].title && (
          <div
            style={{
              position: "absolute",
              bottom: images.length > 1 ? "44px" : "20px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "12px",
              color: "var(--text-3)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "80vw",
            }}
          >
            {images[current].title}
          </div>
        )}

        {/* Prompt Overlay */}
        <AnimatePresence>
          {showPrompt && activeMeta && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "80px",
                right: "20px",
                bottom: "20px",
                width: "min(100%, 400px)",
                background: "var(--bg-raised)",
                border: "1px solid var(--border-hi)",
                borderRadius: "16px",
                padding: "24px",
                overflowY: "auto",
                zIndex: 20,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>Image Prompt</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "20px" }}>
                {activeMeta.cfg_scale && <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "8px" }}><p style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase" }}>CFG Scale</p><p style={{ fontSize: "12px", fontWeight: 600 }}>{activeMeta.cfg_scale}</p></div>}
                {activeMeta.sampling_steps && <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "8px" }}><p style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase" }}>Steps</p><p style={{ fontSize: "12px", fontWeight: 600 }}>{activeMeta.sampling_steps}</p></div>}
                {activeMeta.sampling_method && <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "8px" }}><p style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase" }}>Sampler</p><p style={{ fontSize: "12px", fontWeight: 600 }}>{activeMeta.sampling_method}</p></div>}
                {activeMeta.seed && <div style={{ background: "var(--bg-subtle)", padding: "8px", borderRadius: "8px" }}><p style={{ fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase" }}>Seed</p><p style={{ fontSize: "12px", fontWeight: 600 }}>{activeMeta.seed}</p></div>}
              </div>

              {activeMeta.positive_prompt && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.72 0.16 145)", display: "block", marginBottom: "6px" }}>Positive</span>
                  <p style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: 1.6, background: "var(--bg-subtle)", borderRadius: "8px", padding: "12px", fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeMeta.positive_prompt}</p>
                </div>
              )}

              {activeMeta.negative_prompt && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.65 0.15 25)", display: "block", marginBottom: "6px" }}>Negative</span>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: 1.6, background: "var(--bg-subtle)", borderRadius: "8px", padding: "12px", fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeMeta.negative_prompt}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
