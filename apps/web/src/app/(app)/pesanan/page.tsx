/**
 * Pesanan — Screen for Order Drafts and Restock History.
 *
 * Fetches persisted orders from the API (briefing_spec.md §6:
 * shops/{shopId}/orders/{id}); falls back to the offline demo list.
 * Tapping WhatsApp on a draft marks it SENT (optimistic + PUT).
 *
 * Design notes (Hallmark v2 redesign): the header count sits on its own
 * full-width line and wraps cleanly at 390px (flex-wrap + min-w-0, no
 * mid-word clip); order cards are bg-surface with a hairline border only (one of border
 * or shadow); status pills are sentence-case caption chips on token
 * pairs; exactly one filled primary CTA exists on the screen (the
 * newest draft's "Kirim via WhatsApp"), every other CTA is secondary
 * outlined; icons come from components/icons.tsx (never emoji); motion
 * is state-only via .pressable.
 */

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HangaLogo } from "@/components/hanga-logo";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { api } from "@/lib/api";
import { DEMO_SHOP_ID } from "@/lib/constants";
import { formatIDR } from "@/lib/design-system";
import { useLanguage } from "@/lib/i18n/context";
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

function formatDate(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", {
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
  const { t, language } = useLanguage();
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

  // The single filled primary CTA belongs to the first draft in list order
  // (design.md: one filled primary per screen; position, not timestamp, so
  // two identical draft cards never read as inconsistently styled);
  // every other CTA is secondary outlined.
  const primaryDraftId = orders.find((o) => o.status === "DRAFTED")?.id ?? null;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 py-5 px-4">
        {/* Header — the count gets its own full-width line so it never
            clips mid-word at 390px (flex-wrap + min-w-0, no truncate) */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border pb-3">
          <HangaLogo variant="compact" size="sm" />
          <div className="flex min-w-0 flex-1 justify-end">
            <LanguageSwitcher variant="compact" />
          </div>
          <p className="text-caption text-muted min-w-0 basis-full flex items-center gap-1.5">
            <Icon name="clipboard" size={14} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              {t.pesanan.summaryCount.replace("{count}", String(orders.length))}
            </span>
          </p>
        </div>

        <div>
          <h1 className="text-title text-ink-900">{t.pesanan.title}</h1>
          <p className="text-body text-muted mt-1">
            {t.pesanan.subtitle}
          </p>
        </div>

        {/* Orders list */}
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const isDraft = order.status === "DRAFTED";
            const isPrimaryCta = isDraft && order.id === primaryDraftId;

            return (
              <div
                key={order.id}
                className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption text-muted min-w-0">
                    {formatDate(order.created_at, language)}
                  </span>
                  <span
                    className={`text-caption px-2.5 py-0.5 rounded-full shrink-0 ${
                      isDraft ? "bg-warn-bg text-warn" : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    {isDraft
                      ? (language === "id" ? "Draf pesanan" : "Draft order")
                      : (language === "id" ? "Terkirim" : "Sent via WA")}
                  </span>
                </div>

                <div>
                  <h3 className="text-heading text-ink-900">
                    {order.supplier_ref}
                  </h3>
                  <p className="text-body text-muted mt-0.5">{itemsLabel(order)}</p>
                  <p className="text-numeric text-lg font-semibold text-brand-800 mt-1">
                    {formatIDR(order.est_cost_idr)}
                  </p>
                </div>

                <div className="pt-1 flex gap-2">
                  <a
                    href={order.wa_deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      isDraft
                        ? (language === "id"
                            ? "Buka WhatsApp dengan pesan pesanan otomatis dan tandai sebagai terkirim"
                            : "Open WhatsApp with pre-filled order and mark as sent")
                        : (language === "id"
                            ? "Buka kembali percakapan WhatsApp dengan pemasok"
                            : "Reopen WhatsApp conversation with supplier")
                    }
                    onClick={() => {
                      if (isDraft) markAsSent(order.id);
                    }}
                    className={
                      isPrimaryCta
                        ? "pressable touch-target flex-1 py-2.5 px-3 rounded-lg bg-brand-600 text-white text-caption flex items-center justify-center gap-1.5"
                        : "pressable touch-target flex-1 py-2.5 px-3 rounded-lg border border-border bg-surface hover:bg-canvas text-brand-800 text-caption flex items-center justify-center gap-1.5"
                    }
                  >
                    <Icon name="message" size={18} className="shrink-0" />
                    <span>
                      {isDraft
                        ? (language === "id" ? "Kirim via WhatsApp" : "Send via WhatsApp")
                        : t.pesanan.openWa}
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
