/**
 * Client-safe utilities (no Node.js imports)
 */

export function getImageUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return `${base}/images/${filename}`;
}
