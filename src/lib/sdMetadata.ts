/**
 * Parse Stable Diffusion A1111/Forge PNG/WebP metadata (text chunks)
 * Works entirely in the browser using FileReader + DataView
 */

export interface SDMetadata {
  positive_prompt?: string;
  negative_prompt?: string;
  cfg_scale?: string;
  sampling_steps?: string;
  sampling_method?: string;
  seed?: string;
  width?: string;
  height?: string;
  model?: string;
  model_hash?: string;
  vae?: string;
  clip_skip?: string;
  loras?: Array<{ name: string; weight?: string }>;
  raw?: string;
}

/** Read PNG tEXt / iTXt chunks looking for SD "parameters" */
async function parsePngChunks(buffer: ArrayBuffer): Promise<string | null> {
  const view = new DataView(buffer);
  // PNG signature: 8 bytes
  let offset = 8;
  while (offset < view.byteLength - 8) {
    const length = view.getUint32(offset);
    const typeBytes = new Uint8Array(buffer, offset + 4, 4);
    const type = String.fromCharCode(...typeBytes);
    if (type === "tEXt" || type === "iTXt") {
      const dataBytes = new Uint8Array(buffer, offset + 8, length);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(dataBytes);
      // tEXt: "keyword\0text", look for "parameters"
      const nullIdx = text.indexOf("\0");
      if (nullIdx !== -1) {
        const keyword = text.slice(0, nullIdx).toLowerCase().replace(/\x00/g, "");
        if (keyword === "parameters") {
          return text.slice(nullIdx + 1);
        }
      }
    }
    if (type === "IEND") break;
    offset += 12 + length; // length(4) + type(4) + data(length) + crc(4)
  }
  return null;
}

/** Read WebP EXIF / XMP or just the raw bytes for metadata strings */
async function parseWebpChunks(buffer: ArrayBuffer): Promise<string | null> {
  // WebP: "RIFF????WEBP" then VP8 chunks
  const view = new DataView(buffer);
  const sig = new Uint8Array(buffer, 0, 4);
  if (String.fromCharCode(...sig) !== "RIFF") return null;

  let offset = 12; // skip RIFF header
  while (offset < view.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === "EXIF" || chunkId === "XMP ") {
      const data = new Uint8Array(buffer, offset + 8, chunkSize);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
      if (text.includes("parameters")) {
        const match = text.match(/parameters[^\w]([\s\S]+)/i);
        if (match) return match[1];
      }
    }
    offset += 8 + chunkSize + (chunkSize % 2); // RIFF chunks are word-aligned
  }
  return null;
}

/**
 * Parse the raw A1111/Forge "parameters" string into structured fields.
 *
 * Format example:
 * masterpiece, best quality, 1girl, ...
 * Negative prompt: ugly, blurry, ...
 * Steps: 28, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 123456789,
 * Size: 512x768, Model hash: abc123, Model: somemodel_v1,
 * Lora hashes: "lora1: abc, lora2: def", Version: ...
 */
export function parseSDParameterString(raw: string): SDMetadata {
  const result: SDMetadata = { raw };

  // Split on "Negative prompt:" — everything before is positive
  const negIdx = raw.search(/Negative prompt:/i);
  if (negIdx !== -1) {
    result.positive_prompt = raw.slice(0, negIdx).trim();
    const afterNeg = raw.slice(negIdx + "Negative prompt:".length);

    // The parameters block starts after a newline following the negative prompt
    const paramLineIdx = afterNeg.search(/\nSteps:|Steps:/);
    if (paramLineIdx !== -1) {
      result.negative_prompt = afterNeg.slice(0, paramLineIdx).trim();
      parseParamLine(afterNeg.slice(paramLineIdx), result);
    } else {
      result.negative_prompt = afterNeg.trim();
    }
  } else {
    // No negative — everything until Steps: is positive
    const paramLineIdx = raw.search(/\nSteps:|Steps:/);
    if (paramLineIdx !== -1) {
      result.positive_prompt = raw.slice(0, paramLineIdx).trim();
      parseParamLine(raw.slice(paramLineIdx), result);
    } else {
      result.positive_prompt = raw.trim();
    }
  }

  return result;
}

function parseParamLine(line: string, out: SDMetadata) {
  const kv = (key: string) => {
    const match = line.match(new RegExp(`${key}:\\s*([^,\\n]+)`, "i"));
    return match ? match[1].trim() : undefined;
  };

  out.sampling_steps   = kv("Steps");
  out.sampling_method  = kv("Sampler");
  out.cfg_scale        = kv("CFG scale");
  out.seed             = kv("Seed");
  out.model            = kv("Model");
  out.model_hash       = kv("Model hash");
  out.vae              = kv("VAE");
  out.clip_skip        = kv("Clip skip");

  const sizeMatch = line.match(/Size:\s*(\d+)x(\d+)/i);
  if (sizeMatch) {
    out.width  = sizeMatch[1];
    out.height = sizeMatch[2];
  }

  // Extract LoRAs from positive prompt  <lora:name:weight>
  if (out.positive_prompt) {
    const loraMatches = [...out.positive_prompt.matchAll(/<lora:([^:>]+):?([^>]*)>/gi)];
    if (loraMatches.length) {
      out.loras = loraMatches.map((m) => ({ name: m[1], weight: m[2] || "1" }));
    }
  }
}

/** Main entry: given a File, return parsed SDMetadata or null */
export async function extractSDMetadata(file: File): Promise<SDMetadata | null> {
  try {
    const buffer = await file.arrayBuffer();
    let raw: string | null = null;

    if (file.type === "image/png" || file.name.endsWith(".png")) {
      raw = await parsePngChunks(buffer);
    } else if (file.type === "image/webp" || file.name.endsWith(".webp")) {
      raw = await parseWebpChunks(buffer);
    }

    if (!raw) return null;
    return parseSDParameterString(raw);
  } catch (e) {
    console.warn("extractSDMetadata failed:", e);
    return null;
  }
}
