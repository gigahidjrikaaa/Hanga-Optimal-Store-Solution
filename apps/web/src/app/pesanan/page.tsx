/**
 * Pesanan — Screen for Order Drafts and Restock History.
 *
 * Displays drafted and sent WhatsApp orders for Bu Sari.
 * Contract: docs/briefing_spec.md §6 (shops/{shopId}/orders/{id})
 */

"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";

interface OrderItem {
  id: string;
  date: string;
  supplier: string;
  items: string;
  totalCostIdr: number;
  status: "DRAFT" | "SENT" | "RECEIVED";
  waLink: string;
}

const DEMO_ORDERS: OrderItem[] = [
  {
    id: "ORD-20261010-01",
    date: "10 Okt 2026, 06:15",
    supplier: "TOKO GROSIR JAYA",
    items: "Gula Pasir Gulaku (15 kg)",
    totalCostIdr: 210000,
    status: "DRAFT",
    waLink:
      "https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20mau%20pesan%20Gula%20Pasir%201kg%20sebanyak%2015%20kg.%20Mohon%20dikirim%20pagi%20ini.%20Terima%20kasih!",
  },
  {
    id: "ORD-20261010-02",
    date: "10 Okt 2026, 06:18",
    supplier: "AGEN TELUR BERKAH",
    items: "Telur Ayam Negeri (12 kg)",
    totalCostIdr: 336000,
    status: "DRAFT",
    waLink:
      "https://wa.me/6281298765432?text=Halo%20Agen%20Telur,%20Bu%20Sari%20pesan%20Telur%2012%20kg%20ya.%20Kirim%20segera.%20Terima%20kasih!",
  },
  {
    id: "ORD-20261008-01",
    date: "8 Okt 2026, 08:30",
    supplier: "TOKO GROSIR JAYA",
    items: "Minyak Goreng Bimoli 2L (12 pouch), Terigu Segitiga (10 kg)",
    totalCostIdr: 518000,
    status: "RECEIVED",
    waLink: "https://wa.me/6281234567890",
  },
];

export default function PesananPage() {
  const [orders, setOrders] = useState<OrderItem[]>(DEMO_ORDERS);

  const markAsSent = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "SENT" } : o))
    );
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 py-5 px-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <HangaLogo variant="compact" size="sm" />
          <span className="text-caption text-ink-600 font-medium">
            3 Pesanan Tercatat
          </span>
        </div>

        <div>
          <h1 className="text-title text-ink-900">Daftar Pesanan Restock</h1>
          <p className="text-body text-ink-600 mt-1">
            Kirim draf pesanan langsung ke agen grosir langganan via WhatsApp.
          </p>
        </div>

        {/* Orders list */}
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const isDraft = order.status === "DRAFT";
            const isSent = order.status === "SENT";

            return (
              <div
                key={order.id}
                className="bg-surface p-4 border border-border flex flex-col gap-3"
                style={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-ink-600">
                    {order.date}
                  </span>
                  <span
                    className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                      isDraft
                        ? "bg-warn-100 text-warn-600"
                        : isSent
                        ? "bg-info-100 text-info-600"
                        : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    {isDraft ? "DRAF PESANAN" : isSent ? "TERKIRIM" : "SELESAI DITERIMA"}
                  </span>
                </div>

                <div>
                  <h3 className="text-heading text-ink-900 font-bold">
                    {order.supplier}
                  </h3>
                  <p className="text-body text-ink-600 mt-0.5">{order.items}</p>
                  <p className="text-numeric text-brand-600 font-bold mt-1">
                    Rp {order.totalCostIdr.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="pt-1 flex gap-2">
                  <a
                    href={order.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsSent(order.id)}
                    className="touch-target flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-caption text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>💬</span>
                    <span>
                      {isDraft ? "Kirim via WhatsApp" : "Buka Chat WhatsApp"}
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
