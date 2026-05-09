import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const metadataDir = path.join(process.cwd(), "data", "metadata");
    await fs.mkdir(metadataDir, { recursive: true });

    const filePath = path.join(metadataDir, `${body.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("save-metadata error", err);
    return NextResponse.json({ error: "Failed to save metadata" }, { status: 500 });
  }
}
