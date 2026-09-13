/**
 * Utility functions for exporting and downloading photos, composite before/after images, and video frames.
 */

// Synchronous data URL -> Blob so the user gesture stays intact (required by iOS share sheet)
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/png";
  if (!header.includes("base64")) {
    return new Blob([decodeURIComponent(data)], { type: mime });
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Downloads an image to the device. Always a plain file download — no share sheet, no options.
 * Returns true when the download was triggered.
 */
export function downloadImage(dataUrl: string, filename: string): boolean {
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl!), 60000);
    return true;
  } catch (err) {
    console.error("Download failed:", err);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return false;
  }
}

// Extract a crisp still frame from a playing or paused HTMLVideoElement
export function captureVideoFrame(videoElement: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Failed to capture video frame:", err);
    return null;
  }
}

// Crop a sub-region of a base64 image (0..1 coordinates) and return cropped base64 JPEG
export async function cropImageBase64(
  srcBase64: string,
  startXRatio: number,
  endXRatio: number,
  startYRatio = 0,
  endYRatio = 1
): Promise<string> {
  if (startXRatio <= 0.01 && endXRatio >= 0.99 && startYRatio <= 0.01 && endYRatio >= 0.99) {
    return srcBase64;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const naturalW = img.naturalWidth || 1920;
      const naturalH = img.naturalHeight || 1080;

      const x = Math.max(0, Math.floor(naturalW * startXRatio));
      const w = Math.min(naturalW - x, Math.floor(naturalW * (endXRatio - startXRatio)));
      const y = Math.max(0, Math.floor(naturalH * startYRatio));
      const h = Math.min(naturalH - y, Math.floor(naturalH * (endYRatio - startYRatio)));

      if (w < 64 || h < 64) {
        resolve(srcBase64);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(srcBase64);
        return;
      }

      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => resolve(srcBase64);
    img.src = srcBase64;
  });
}
