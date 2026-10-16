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
        className={`w-16 h-16 flex items-center justify-center text-4xl rounded-full ${
          isUploading ? "scanning" : ""
        }`}
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

      <div className="p-3 bg-canvas border border-border/80 rounded-lg text-caption text-ink-600 text-left flex flex-col gap-1 w-full max-w-xs">
        <span className="font-semibold text-ink-900 flex items-center gap-1 text-xs">
          <span>💡</span> Tips foto catatan penjualan:
        </span>
        <ul className="list-disc list-inside text-[11px] space-y-0.5 text-ink-600">
          <li>Pastikan nama barang dan angka penjualan jelas</li>
          <li>Arahkan kamera tegak lurus dari atas kertas</li>
          <li>Pencahayaan terang dan hindari bayangan tangan</li>
        </ul>
      </div>

      {isUploading ? (
        <div className="w-full rise-in">
          <div
            className="h-2 sweep-bar w-full"
            style={{
              borderRadius: "var(--radius-badge)",
              backgroundColor: "var(--color-brand-100)",
            }}
            role="progressbar"
            aria-label="Mengunggah foto"
          />
          <p className="text-caption text-ink-600 mt-2 text-center">
            Hanga sedang membaca catatan… ✨
          </p>
        </div>
      ) : (
        <label
          title="Buka kamera atau pilih foto buku catatan"
          className="touch-target text-body font-semibold py-3 px-6 text-surface cursor-pointer pressable shadow-sm"
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--color-brand-600)",
            transitionDuration: "var(--duration-fast)",
          }}
        >
          Ambil Foto Catatan
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
