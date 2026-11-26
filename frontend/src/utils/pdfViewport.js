export function boundedPdfScale(width, height, preferred = 1.4) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error("Dimensiones de PDF no válidas");
  return Math.min(preferred, 2400 / width, 2400 / height, Math.sqrt(8_000_000 / width / height));
}
