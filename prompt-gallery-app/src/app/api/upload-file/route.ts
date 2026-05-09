import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

/**
 * POST /api/upload-file
 * FormData: { file: File, filename: string, folder?: string }
 * Uploads the file to R2 server-side — no CORS issues.
 */
export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const file     = form.get("file") as File | null;
    const filename = form.get("filename") as string | null;
    const folder   = (form.get("folder") as string | null) ?? "images";

    if (!file || !filename) {
      return NextResponse.json({ error: "Missing file or filename" }, { status: 400 });
    }

    const buffer      = Buffer.from(await file.arrayBuffer());
    const key         = `${folder}/${filename}`;
    const contentType = file.type || "application/octet-stream";

    await s3.send(
      new PutObjectCommand({
        Bucket:      process.env.R2_BUCKET!,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
      })
    );

    return NextResponse.json({ success: true, key });
  } catch (err) {
    console.error("upload-file error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export const maxDuration = 60; // seconds
