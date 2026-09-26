/**
 * CaptureCard — Notebook photo upload trigger.
 *
 * Design: design_system.md §2 — CaptureCard
 * States: default → capturing → uploading (progress).
 */

"use client";

interface CaptureCardProps {
  onCapture: (file: File) => void;
  isUploading?: boolean;
}

export function CaptureCard({ onCapture, isUploading = false }: CaptureCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div
      className="bg-surface p-6 flex flex-col items-center gap-4 text-center"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-16 h-16 flex items-center justify-center text-4xl rounded-full"
        style={{ backgroundColor: "var(--color-brand-100)" }}
      >
        📷
      </div>

      <div>
        <h3 className="text-heading text-ink-900">Foto buku catatan</h3>
        <p className="text-body text-ink-600 mt-1">
          Cukup foto, kami yang baca.
        </p>
      </div>

      {isUploading ? (
        <div className="w-full">
          <div
            className="h-2 overflow-hidden"
            style={{
              borderRadius: "var(--radius-badge)",
              backgroundColor: "var(--color-brand-100)",
            }}
          >
            <div
              className="h-full animate-pulse"
              style={{
                width: "60%",
                backgroundColor: "var(--color-brand-600)",
                borderRadius: "var(--radius-badge)",
              }}
            />
          </div>
          <p className="text-caption text-ink-600 mt-2">Mengunggah...</p>
        </div>
      ) : (
        <label className="touch-target text-body font-semibold py-3 px-6 text-surface cursor-pointer transition-colors"
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-brand-600)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          Ambil Foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
