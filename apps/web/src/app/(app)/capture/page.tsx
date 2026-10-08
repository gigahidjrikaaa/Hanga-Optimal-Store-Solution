/**
 * Capture — Screen 2 in design_system.md §3.
 *
 * Notebook photo upload → Firebase Storage.
 * PRD §5: Notebook photo → SKU extraction (Gemini Flash) — Wow moment #1.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CaptureCard } from "@/components/capture-card";
import { DEMO_SHOP_ID } from "@/lib/constants";

export default function CapturePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
      const response = await fetch(
        `${apiUrl}/extractions/shops/${DEMO_SHOP_ID}/extractions`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const extraction = await response.json();
        sessionStorage.setItem("current_extraction", JSON.stringify(extraction));
      }
    } catch (err) {
      console.warn("Using offline demo extraction pipeline:", err);
    } finally {
      setIsUploading(false);
      router.push("/capture/confirm");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 py-6 px-4">
        <div>
          <h1 className="text-title text-ink-900">Catat Penjualan</h1>
          <p className="text-body text-ink-600 mt-1">
            Foto halaman buku catatan Anda. AI akan membaca dan mencatat otomatis.
          </p>
        </div>

        <CaptureCard onCapture={handleCapture} isUploading={isUploading} />

        {/* Tips */}
        <div
          className="bg-surface p-4 flex flex-col gap-3"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3 className="text-heading text-ink-900">💡 Tips foto yang baik</h3>
          <ul className="text-body text-ink-600 list-disc pl-5 flex flex-col gap-1">
            <li>Cahaya cukup terang, tanpa bayangan</li>
            <li>Foto satu halaman penuh</li>
            <li>Tulisan terlihat jelas</li>
            <li>Letakkan buku di permukaan rata</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
