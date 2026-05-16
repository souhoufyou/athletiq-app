/**
 * Read a user-selected image file, resize/compress it via canvas, and return
 * a base64 data URL suitable for localStorage (typically <60 KB).
 *
 * The image is cropped to a square (center crop) so it looks good in a circular
 * or rounded-square avatar slot.
 */
export async function fileToCompressedAvatar(
  file: File,
  size = 256,
  quality = 0.75
): Promise<string> {
  if (typeof window === "undefined") throw new Error("Browser only");
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }

  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(blobUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context indisponible.");

    // Center-crop to square then draw at target size
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de lire l'image."));
    img.src = src;
  });
}
