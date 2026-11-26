// Limites compartidos por la interfaz y sus pruebas (Sprint 6).
export const MAX_EVIDENCE_BYTES = 60 * 1024 * 1024;
const allowed = /\.(png|jpe?g|gif|webp|pdf|docx|txt|mp4|webm)$/i;
export const evidenceAllowed = file => Boolean(
  file && file.size > 0 && file.size <= MAX_EVIDENCE_BYTES && allowed.test(file.name || "")
);

export const bytesLabel = size => size >= 1048576 ? `${(size/1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(size/1024))} KB`;
