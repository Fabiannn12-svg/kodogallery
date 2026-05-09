import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "metadata", `${id}.json`);
    
    try {
      await fs.unlink(filePath);
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e; // Ignore if file already doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-post error", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
