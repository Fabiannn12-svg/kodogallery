import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/update-cover
 * Body: {
 *   filename: string         — filename already on R2 (after presign upload)
 *   type: "series" | "char"
 *   seriesName: string       — the series tag value to match (tags[1])
 *   characterName?: string   — the character tag value to match (tags[0])
 * }
 * Updates series_cover_image / char_cover_image on every matching metadata JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const { filename, type, seriesName, characterName } = await req.json();

    if (!filename || !type || !seriesName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const metadataDir = path.join(process.cwd(), "data", "metadata");
    const files = await fs.readdir(metadataDir);
    let updated = 0;

    for (const file of files.filter((f) => f.endsWith(".json"))) {
      const filePath = path.join(metadataDir, file);
      try {
        const raw  = await fs.readFile(filePath, "utf-8");
        const item = JSON.parse(raw);
        const itemSeries = (item.tags?.[1] as string | undefined) ?? "";
        const itemChar   = (item.tags?.[0] as string | undefined) ?? "";
        const seriesMatch = itemSeries.toLowerCase() === seriesName.toLowerCase();

        if (type === "series" && seriesMatch) {
          item.series_cover_image = filename;
          await fs.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
          updated++;
        } else if (
          type === "char" &&
          seriesMatch &&
          characterName &&
          itemChar.toLowerCase() === characterName.toLowerCase()
        ) {
          item.char_cover_image = filename;
          await fs.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
          updated++;
        }
      } catch {
        // skip malformed files
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("update-cover error", err);
    return NextResponse.json({ error: "Failed to update cover" }, { status: 500 });
  }
}
