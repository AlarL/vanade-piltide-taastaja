/**
 * Helpers for the optional "modern photo of the same person" identity reference.
 *
 * Everything here deliberately runs in the browser: the picked photo is decoded,
 * downscaled and cropped locally, so the only thing that ever reaches the AI model
 * is one small square face crop. A full phone photo would cost several image tiles
 * of input tokens for detail the model does not need in order to match a face.
 */

/** Working copy used by the crop UI - big enough to stay sharp when zoomed in. */
export const REFERENCE_EDIT_MAX_DIMENSION = 1600;

/** Uploaded crop size. 768 px is a single image tile for Gemini's tokenizer. */
export const REFERENCE_OUTPUT_SIZE = 768;

export const REFERENCE_OUTPUT_QUALITY = 0.85;
export const REFERENCE_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const REFERENCE_MIME_TYPE = "image/jpeg";

export interface SquareCrop {
  /** Left edge of the crop inside the source image, in source pixels. */
  x: number;
  /** Top edge of the crop inside the source image, in source pixels. */
  y: number;
  /** Side length of the crop, in source pixels. */
  size: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Seda fotot ei õnnestunud avada. Palun proovi mõnda teist pilti."));
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.length > 0) {
        resolve(result);
      } else {
        reject(new Error("Foto lugemine ebaõnnestus. Palun proovi uuesti."));
      }
    };
    reader.onerror = () => reject(new Error("Foto lugemine ebaõnnestus. Palun proovi uuesti."));
    reader.onabort = () => reject(new Error("Foto lugemine katkes. Palun proovi uuesti."));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates the picked file and returns a downscaled data URL for the crop UI.
 * The original multi-megapixel string is dropped as soon as the smaller copy exists.
 */
export async function prepareReferenceSource(file: File): Promise<{ src: string; width: number; height: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Palun vali pildifail (JPG, PNG või WebP).");
  }
  if (file.size > REFERENCE_MAX_FILE_BYTES) {
    throw new Error("Foto on liiga suur. Maksimaalne lubatud suurus on 20 MB.");
  }

  const original = await readFileAsDataUrl(file);
  const img = await loadImage(original);
  const largestSide = Math.max(img.naturalWidth, img.naturalHeight);

  if (largestSide <= REFERENCE_EDIT_MAX_DIMENSION) {
    return { src: original, width: img.naturalWidth, height: img.naturalHeight };
  }

  const scale = REFERENCE_EDIT_MAX_DIMENSION / largestSide;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { src: original, width: img.naturalWidth, height: img.naturalHeight };

  ctx.drawImage(img, 0, 0, width, height);
  const resized = canvas.toDataURL(REFERENCE_MIME_TYPE, 0.92);
  return resized.length > 100
    ? { src: resized, width, height }
    : { src: original, width: img.naturalWidth, height: img.naturalHeight };
}

/** Renders the chosen square region into a fixed-size JPEG data URL. */
export function cropSquareToDataUrl(
  img: HTMLImageElement,
  crop: SquareCrop,
  outSize: number = REFERENCE_OUTPUT_SIZE,
  quality: number = REFERENCE_OUTPUT_QUALITY
): string {
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Foto töötlemine ebaõnnestus selles brauseris.");

  ctx.imageSmoothingQuality = "high";
  // A crop can reach slightly past the edge after clamping rounds; fill first so
  // any uncovered strip stays neutral instead of transparent-turned-black.
  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, 0, outSize, outSize);
  ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, outSize, outSize);

  return canvas.toDataURL(REFERENCE_MIME_TYPE, quality);
}

/** Approximate transfer size of a base64 data URL, for the "how small is it" hint. */
export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

export function formatKilobytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}
