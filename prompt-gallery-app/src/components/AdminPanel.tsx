"use client";

import { useState } from "react";
import { Upload, ImageIcon, FolderPlus } from "lucide-react";
import NewUploadForm from "@/components/admin/NewUploadForm";
import AddToAlbumForm from "@/components/admin/AddToAlbumForm";
import CoverManager from "@/components/CoverManager";

interface CharInfo { character: string; slug: string; coverImage: string; }
interface AlbumInfo { series: string; slug: string; coverImage: string; characters: CharInfo[]; }

const TABS = [
  { id: "upload",    label: "New Upload",     icon: Upload },
  { id: "add",       label: "Add to Album",   icon: FolderPlus },
  { id: "covers",    label: "Edit Covers",    icon: ImageIcon },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminPanel({ albums, knownLinks }: { albums: AlbumInfo[]; knownLinks: Record<string, string> }) {
  const [tab, setTab] = useState<TabId>("upload");

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "var(--space-5)",
          width: "fit-content",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px", border: "none",
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-3)",
                fontSize: "12px", fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms ease, color 150ms ease",
                outline: active ? "1px solid var(--accent-border)" : "none",
              }}
            >
              <Icon style={{ width: "13px", height: "13px" }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "upload" && <NewUploadForm knownLinks={knownLinks} />}
      {tab === "add"    && <AddToAlbumForm albums={albums} knownLinks={knownLinks} />}
      {tab === "covers" && <CoverManager albums={albums} />}
    </div>
  );
}
