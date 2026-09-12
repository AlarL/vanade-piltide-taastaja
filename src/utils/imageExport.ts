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

// Helper to trigger a browser file download. Blob URLs are far more reliable on
// mobile browsers than multi-megabyte data: URLs.
export function downloadDataUrl(dataUrl: string, filename: string): void {
  let objectUrl: string | null = null;
  const link = document.createElement("a");
  try {
    objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl));
    link.href = objectUrl;
  } catch {
    link.href = dataUrl;
  }
  link.download = filename;
  link.rel = "noopener";
  link.target = "_self";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 60000);
}

export type SaveImageOutcome = "shared" | "downloaded";

/**
 * Saves an image to the device. On touch devices the native share sheet is used
 * when available ("Salvesta pilti" works there even when <a download> is blocked
 * in in-app browsers); otherwise a normal file download is triggered.
 */
export async function saveImageToDevice(
  dataUrl: string,
  filename: string
): Promise<SaveImageOutcome> {
  const isTouchDevice =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  if (isTouchDevice) {
    try {
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return "shared";
      }
    } catch (err: any) {
      // User dismissed the share sheet - do not fall back to a second action
      if (err?.name === "AbortError") return "shared";
      console.warn("Share failed, falling back to download:", err);
    }
  }

  downloadDataUrl(dataUrl, filename);
  return "downloaded";
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

// Generate a high-resolution side-by-side (Enne ja Pärast) comparison image
export async function createSideBySideComparisonImage(
  originalSrc: string,
  restoredSrc: string
): Promise<string> {
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const [imgOriginal, imgRestored] = await Promise.all([
    loadImage(originalSrc),
    loadImage(restoredSrc),
  ]);

  // Normalize target height for uniform comparison
  const targetHeight = Math.max(imgOriginal.naturalHeight, imgRestored.naturalHeight, 1000);
  const scaleOrig = targetHeight / imgOriginal.naturalHeight;
  const scaleRest = targetHeight / imgRestored.naturalHeight;

  const widthOrig = Math.round(imgOriginal.naturalWidth * scaleOrig);
  const widthRest = Math.round(imgRestored.naturalWidth * scaleRest);

  const dividerWidth = 8;
  const padding = 24;
  const headerHeight = 70;

  const totalWidth = widthOrig + widthRest + dividerWidth + padding * 2;
  const totalHeight = targetHeight + headerHeight + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  // Background - Scandinavian stone neutral
  ctx.fillStyle = "#fcfbf9";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw Header Title & Subtitle
  ctx.fillStyle = "#1c1917"; // stone-900
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Vanade fotode taastaja", padding, padding + 30);

  ctx.fillStyle = "#78716c"; // stone-500
  ctx.font = "14px sans-serif";
  ctx.fillText("Enne ja pärast taastamist", padding, padding + 52);

  const imagesStartY = padding + headerHeight;

  // Draw Original Image
  ctx.drawImage(imgOriginal, padding, imagesStartY, widthOrig, targetHeight);

  // Draw Divider
  ctx.fillStyle = "#e7e5e4"; // stone-200
  ctx.fillRect(padding + widthOrig, imagesStartY, dividerWidth, targetHeight);

  // Draw Restored Image
  ctx.drawImage(
    imgRestored,
    padding + widthOrig + dividerWidth,
    imagesStartY,
    widthRest,
    targetHeight
  );

  // Draw Label Pill for "ENNE"
  drawBadge(ctx, "ORIGINAAL (ENNE)", padding + 16, imagesStartY + 20, "#292524", "#ffffff");

  // Draw Label Pill for "PÄRAST"
  drawBadge(
    ctx,
    "TAASTATUD (PÄRAST)",
    padding + widthOrig + dividerWidth + 16,
    imagesStartY + 20,
    "#115e59",
    "#ffffff"
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bgColor: string,
  textColor: string
) {
  ctx.save();
  ctx.font = "bold 12px sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 12;
  const padY = 6;
  const h = 24;
  const w = metrics.width + padX * 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  // Round rect
  const r = 6;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.fillText(text, x + padX, y + 16);
  ctx.restore();
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
