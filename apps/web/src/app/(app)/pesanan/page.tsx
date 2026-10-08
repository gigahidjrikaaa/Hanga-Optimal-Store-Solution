/**
 * Pesanan — Screen for Order Drafts and Restock History.
 *
 * Fetches persisted orders from the API (briefing_spec.md §6:
 * shops/{shopId}/orders/{id}); falls back to the offline demo list.
 * Tapping WhatsApp on a draft marks it SENT (optimistic + PUT).
 */

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { formatIDR } from "@/lib/design-system";
import type { Order } from "@/types";

const DEMO_ORDERS: Order[] = [
  {
    id: "ORD-20261010-01",
    shop_id: DEMO_SHOP_ID,
    created_at: "2026-10-10T06:15:00+07:00",
    scenario: "BASELINE",
    supplier_ref: "TOKO GROSIR JAYA",
    items: [
      {
        sku: "GULA-1KG",
        name: "Gula Pasir Gulaku 1kg",
        qty: 15,
        unit: "kg",
        est_cost_idr: 210000,
      },
    ],
    est_cost_idr: 210000,
    status: "DRAFTED",
    wa_deep_link:
      "https://wa.me/6281234567890?text=Halo%20Toko%20Grosir%20Jaya,%20Bu%20Sari%20mau%20pesan%20Gula%20Pasir%201kg%20sebanyak%2015%20kg.%20Mohon%20dikirim%20pagi%20ini.%20Terima%20kasih!",
  },
  {
    id: "ORD-20261010-02",
    shop_id: DEMO_SHOP_ID,
    created_at: "2026-10-10T06:18:00+07:00",
    scenario: "BASELINE",
    supplier_ref: "AGEN TELUR BERKAH",
    items: [
      {
        sku: "TELUR-1KG",
        name: "Telur Ayam Negeri 1kg",
        qty: 12,
        unit: "kg",
        est_cost_idr: 336000,
      },
    ],
    est_cost_idr: 336000,
    status: "DRAFTED",
    wa_deep_link:
      "https://wa.me/6281298765432?text=Halo%20Agen%20Telur,%20Bu%20Sari%20pesan%20Telur%2012%20kg%20ya.%20Kirim%20segera.%20Terima%20kasih!",
  },
  {
    id: "ORD-20261008-01",
    shop_id: DEMO_SHOP_ID,
    created_at: "2026-10-08T08:30:00+07:00",
    scenario: "BASELINE",
    supplier_ref: "TOKO GROSIR JAYA",
    items: [
      {
        sku: "MINYAK-GORENG-2L",
        name: "Minyak Bimoli 2L",
        qty: 12,
        unit: "pouch",
        est_cost_idr: 408000,
      },
      {
        sku: "TEPUNG-TERIGU-1KG",
        name: "Tepung Terigu Segitiga Biru 1kg",
        qty: 10,
        unit: "kg",
        est_cost_idr: 110000,
      },
    ],
    est_cost_idr: 518000,
    status: "SENT",
    sent_at: "2026-10-08T08:31:00+07:00",
    wa_deep_link: "https://wa.me/6281234567890",
  },
];

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function itemsLabel(order: Order): string {
  return order.items.map((i) => `${i.name} (${i.qty} ${i.unit})`).join(", ");
}

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Order[]>(`/orders/shops/${DEMO_SHOP_ID}/orders`)
      .then((fetched) => {
        if (!cancelled && fetched.length > 0) setOrders(fetched);
      })
      .catch(() => {
        // Offline: keep the demo list
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markAsSent = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "SENT" } : o))
    );
    api
      .put(`/orders/shops/${DEMO_SHOP_ID}/orders/${orderId}/sent`)
      .catch(() => {
        // Optimistic update stays; server catches up on next visit.
      });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 py-5 px-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <HangaLogo variant="compact" size="sm" />
          <span className="text-caption text-ink-600 font-medium">
            {orders.length} Pesanan Tercatat
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
            const isDraft = order.status === "DRAFTED";

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
                    {formatDate(order.created_at)}
                  </span>
                  <span
                    className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                      isDraft ? "bg-warn-100 text-warn-600" : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    {isDraft ? "DRAF PESANAN" : "TERKIRIM"}
                  </span>
                </div>

                <div>
                  <h3 className="text-heading text-ink-900 font-bold">
                    {order.supplier_ref}
                  </h3>
                  <p className="text-body text-ink-600 mt-0.5">{itemsLabel(order)}</p>
                  <p className="text-numeric text-brand-600 font-bold mt-1">
                    {formatIDR(order.est_cost_idr)}
                  </p>
                </div>

                <div className="pt-1 flex gap-2">
                  <a
                    href={order.wa_deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (isDraft) markAsSent(order.id);
                    }}
                    className="touch-target flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-caption text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>💬</span>
                    <span>{isDraft ? "Kirim via WhatsApp" : "Buka Chat WhatsApp"}</span>
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
