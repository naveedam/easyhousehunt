import { supabase } from "@/integrations/supabase/client";

export const MAX_PHOTOS = 6;
const BUCKET = "property-media";

// Shrink photos in the browser: max 1600px, re-encoded as JPEG
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      "image/jpeg",
      quality
    )
  );
}

// Uploads compressed JPEGs to <userId>/... and returns their public URLs.
// Throws if any photo fails, so a listing is never saved with silently missing photos.
export async function uploadListingPhotos(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  const failed: string[] = [];
  for (const file of files) {
    try {
      const blob = await compressImage(file);
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      console.error("Photo upload failed:", file.name, e);
      failed.push(file.name);
    }
  }
  if (failed.length > 0) {
    throw new Error(
      `Could not upload ${failed.length} photo(s): ${failed.join(", ")}. Please use JPG, PNG or WebP photos and try again.`
    );
  }
  return urls;
}

// Owners control media_urls, so only ever render http(s) URLs
export const httpPhotos = (urls: unknown): string[] =>
  Array.isArray(urls)
    ? urls.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
    : [];
