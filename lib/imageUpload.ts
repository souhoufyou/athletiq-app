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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

/**
 * Read any image/GIF/video file the user picked and produce a base64 data URL
 * suitable for localStorage.
 *   - JPG/PNG → compressed via canvas (max 600 px, JPEG q=0.8)
 *   - GIF     → raw data URL (compression would kill the animation)
 *   - VIDEO   → raw data URL, max 3 MB
 *
 * Returns the data URL + a discriminator so the UI can render the right tag.
 */
export async function fileToExerciseMedia(
  file: File
): Promise<{ dataUrl: string; type: "image" | "gif" | "video" }> {
  if (typeof window === "undefined") throw new Error("Browser only");

  const isImage = file.type.startsWith("image/");
  const isGif = file.type === "image/gif";
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Format non supporté. Choisis une image, un GIF ou une vidéo.");
  }

  // Hard caps to protect localStorage (≈5 MB total per origin)
  const MAX_RAW = 3 * 1024 * 1024;
  if ((isGif || isVideo) && file.size > MAX_RAW) {
    throw new Error("Fichier trop lourd (max 3 Mo pour les GIF / vidéos).");
  }

  if (isGif) {
    return { dataUrl: await fileToDataUrl(file), type: "gif" };
  }
  if (isVideo) {
    return { dataUrl: await fileToDataUrl(file), type: "video" };
  }
  // Static image: compress to 600 px square thumbnail.
  return { dataUrl: await fileToCompressedAvatar(file, 600, 0.8), type: "image" };
}
