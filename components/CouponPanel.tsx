"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Info, Tag, Trash2, X } from "lucide-react";
import { useCouponStore, type CouponItemInput, type CouponPublic } from "@/store/useCouponStore";

type Offer = {
  id: string;
  code: string;
  title: string | null;
  discountType: "percent" | "flat";
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startAtMs: number | null;
  endAtMs: number | null;
  scope: "all" | "products" | "collections" | "categories";
};

function buildTermsText(c: Pick<Offer, "discountType" | "discountValue" | "maxDiscount" | "minSubtotal" | "startAtMs" | "endAtMs" | "scope">) {
  const parts: string[] = [];
  parts.push(
    c.discountType === "percent"
      ? `${c.discountValue}% off`
      : `₹${Math.round(c.discountValue).toLocaleString("en-IN")} off`
  );
  if (typeof c.maxDiscount === "number" && c.maxDiscount > 0) {
    parts.push(`Max discount ₹${Math.round(c.maxDiscount).toLocaleString("en-IN")}`);
  }
  if (typeof c.minSubtotal === "number" && c.minSubtotal > 0) {
    parts.push(`Min order ₹${Math.round(c.minSubtotal).toLocaleString("en-IN")}`);
  }
  if (c.startAtMs) parts.push(`Starts ${new Date(c.startAtMs).toLocaleDateString("en-IN")}`);
  if (c.endAtMs) parts.push(`Ends ${new Date(c.endAtMs).toLocaleDateString("en-IN")}`);
  if (c.scope === "all") parts.push("All products");
  if (c.scope === "products") parts.push("Selected products");
  if (c.scope === "collections") parts.push("Selected collections");
  if (c.scope === "categories") parts.push("Selected categories");
  return parts.join(" • ");
}

function InfoTooltip({ text, mounted }: { text: string; mounted: boolean }) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  return (
    <span
      ref={anchorRef}
      className="coupon-tip__icon"
      onMouseEnter={() => {
        const el = anchorRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const left = Math.min(window.innerWidth - 16, Math.max(16, r.left + r.width / 2));
        const top = r.bottom + 10;
        setPos({ left, top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <Info size={12} />
      {mounted && pos
        ? createPortal(
            <div
              className="coupon-tip__portal"
              style={{
                position: "fixed",
                left: pos.left,
                top: pos.top,
                transform: "translateX(-50%)",
                zIndex: 100000,
              }}
            >
              <div className="coupon-tip__bubble">{text}</div>
            </div>,
            document.body
          )
        : null}
    </span>
  );
}

function couponToInputValue(coupon: CouponPublic | null, appliedCode: string) {
  if (coupon?.code) return coupon.code;
  if (appliedCode) return appliedCode;
  return "";
}

export default function CouponPanel({
  items,
  subtotal,
  userId,
  title = "Apply Coupon",
}: {
  items: CouponItemInput[];
  subtotal: number;
  userId?: string | null;
  title?: string;
}) {
  const {
    appliedCode,
    status,
    error,
    coupon,
    discountAmount,
    apply,
    clear,
  } = useCouponStore();

  const [input, setInput] = useState("");
  const [offersModalOpen, setOffersModalOpen] = useState(false);
  const canUseDom = typeof document !== "undefined";

  const { data: offers = [], isLoading: offersLoading } = useSWR(
    "/api/coupons/active",
    async (url: string) => {
      const r = await fetch(url, { method: "GET" });
      const json: unknown = await r.json().catch(() => ({}));
      const obj = typeof json === "object" && json !== null ? (json as { coupons?: unknown }) : {};
      const list = Array.isArray(obj.coupons) ? obj.coupons : [];
      return list as Offer[];
    }
  );

  useEffect(() => {
    if (!canUseDom) return;
    if (!offersModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [canUseDom, offersModalOpen]);

  const appliedSummary = useMemo(() => {
    if (!coupon || status !== "applied") return null;
    return {
      code: coupon.code,
      title: coupon.title,
      termsText: coupon.termsText,
      discountAmount,
    };
  }, [coupon, discountAmount, status]);

  const sortedOffers = useMemo(() => {
    const eligible: Offer[] = [];
    const ineligible: Offer[] = [];
    offers.forEach((o) => {
      const min = typeof o.minSubtotal === "number" ? o.minSubtotal : null;
      if (min && subtotal < min) ineligible.push(o);
      else eligible.push(o);
    });
    return [...eligible, ...ineligible];
  }, [offers, subtotal]);

  return (
    <div className="coupon-panel">
      {appliedSummary ? (
        <div className="coupon-row coupon-row--applied">
          <div className="coupon-row__left">
            <div className="coupon-row__text">
              <div className="coupon-row__title">{appliedSummary.code}</div>
              <div className="coupon-row__subtitle">
                Saved ₹{Math.max(0, appliedSummary.discountAmount).toLocaleString("en-IN")}
                {appliedSummary.title ? ` • ${appliedSummary.title}` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              clear();
              setInput("");
            }}
            className="coupon-row__action coupon-row__action--icon"
            type="button"
            aria-label="Remove applied coupon"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="coupon-row">
          <div className="coupon-row__left">
            <div className="coupon-row__icon">
              <Tag size={16} />
            </div>
            <div className="coupon-row__text">
              <div className="coupon-row__title">{title}</div>
              <div className="coupon-row__subtitle">
                {offersLoading ? "Loading available coupons…" : offers.length ? `${offers.length} offers available` : "No offers right now"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOffersModalOpen(true);
              if (!input) setInput(couponToInputValue(coupon, appliedCode));
            }}
            className="coupon-row__action coupon-row__action--primary"
            type="button"
            disabled={offersLoading || offers.length === 0}
          >
            APPLY
          </button>
        </div>
      )}

      {error ? (
        <div className="coupon-panel__error">{error}</div>
      ) : null}

      {canUseDom && offersModalOpen
        ? createPortal(
            <div
              className="coupon-modal__overlay"
              onClick={() => setOffersModalOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div className="coupon-modal__dialog" onClick={(e) => e.stopPropagation()}>
                <div className="coupon-modal__header">
                  <div className="coupon-modal__titleWrap">
                    <div className="coupon-modal__title">Apply Coupon</div>
                    <div className="coupon-modal__subtitle">Enter a code or pick from offers.</div>
                  </div>
                  <button className="coupon-modal__close" onClick={() => setOffersModalOpen(false)} type="button">
                    <X size={16} />
                  </button>
                </div>

                <div className="coupon-modal__body">
                  <div className="coupon-modal__inputRow">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="coupon-modal__input"
                    />
                    <button
                      onClick={() => apply({ code: input, items, subtotal, userId: userId ?? null })}
                      disabled={status === "applying" || items.length === 0}
                      className="coupon-modal__check"
                      type="button"
                    >
                      {status === "applying" ? "CHECKING…" : "CHECK"}
                    </button>
                  </div>

                  {error ? <div className="coupon-modal__error">{error}</div> : null}

                  <div className="coupon-modal__sectionTitle">Available Offers</div>

                  {offersLoading ? (
                    <div className="coupon-modal__empty">Loading coupons…</div>
                  ) : sortedOffers.length ? (
                    <div className="coupon-modal__list">
                      {sortedOffers.map((o) => {
                        const min = typeof o.minSubtotal === "number" ? o.minSubtotal : null;
                        const eligible = !min || subtotal >= min;
                        const delta = min ? Math.max(0, min - subtotal) : 0;
                        const terms = buildTermsText(o);
                        return (
                          <div key={o.id} className={`coupon-card ${eligible ? "coupon-card--eligible" : "coupon-card--locked"}`}>
                            <div className="coupon-card__top">
                              <div className="coupon-card__left">
                                <div className="coupon-card__codeRow">
                                  <span className="coupon-card__code">{o.code}</span>
                                  <InfoTooltip text={terms} mounted={canUseDom} />
                                </div>
                                {o.title ? <div className="coupon-card__title">{o.title}</div> : null}
                              </div>
                              <div className={`coupon-card__badge ${eligible ? "coupon-card__badge--eligible" : "coupon-card__badge--locked"}`}>
                                {eligible ? "Eligible" : `Add ₹${delta.toLocaleString("en-IN")}`}
                              </div>
                            </div>

                            <div className="coupon-card__value">
                              {o.discountType === "percent"
                                ? `${o.discountValue}% off`
                                : `₹${Math.round(o.discountValue).toLocaleString("en-IN")} off`}
                              {typeof o.maxDiscount === "number" && o.maxDiscount > 0
                                ? ` (up to ₹${Math.round(o.maxDiscount).toLocaleString("en-IN")})`
                                : ""}
                            </div>

                            <button
                              onClick={async () => {
                                await apply({ code: o.code, items, subtotal, userId: userId ?? null });
                                setOffersModalOpen(false);
                              }}
                              disabled={!eligible || status === "applying"}
                              className="coupon-card__apply"
                              type="button"
                            >
                              APPLY
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="coupon-modal__empty">No coupons available right now.</div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
