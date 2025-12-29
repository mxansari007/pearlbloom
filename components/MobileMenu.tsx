"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "@/utils/logout";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const startNavigation = useUIStore((s) => s.start);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /* ---------- lock body scroll ---------- */
  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("no-scroll");
      setTimeout(() => {
        const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 120);
    } else {
      document.documentElement.classList.remove("no-scroll");
    }
    return () => document.documentElement.classList.remove("no-scroll");
  }, [open]);

  /* ---------- close on escape + focus trap ---------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;

      if (e.key === "Escape") onClose();

      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = panel.querySelectorAll<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ---------- backdrop click ---------- */
  function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex transition-opacity ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onMouseDown={onBackdropClick}
      style={{
        background: "rgba(0,0,0,0.45)",
      }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`ml-auto h-full w-full max-w-sm transform-gpu transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--header-bg)",
          borderLeft: "1px solid var(--header-border)",
          color: "var(--header-text)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="h-full flex flex-col px-6 py-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 text-lg font-display"
              onClick={onClose}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(212,175,55,0.16), transparent)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                    fill="rgb(212,175,55)"
                  />
                </svg>
              </div>
              <span>Pearl Bloom</span>
            </Link>

            <button
              aria-label="Close menu"
              onClick={onClose}
              className="rounded-full p-2 transition"
              style={{
                color: "var(--header-text)",
                background: "var(--header-hover)",
              }}
            >
              ×
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1">
            <ul className="space-y-4">
              {[
                ["Home", "/"],
                ["Products", "/products"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block text-lg font-medium transition"
                    style={{
                      color: "var(--header-text)",
                    }}
                    onClick={onClose}
                  >
                    {label}
                  </Link>
                </li>
              ))}

              {/* Divider */}
              <li
                className="pt-4"
                style={{ borderTop: "1px solid var(--header-border)" }}
              />

              {/* Auth */}
              {!isAuthenticated ? (
                <li>
                  <Link
                    href="/login"
                    className="block text-lg font-medium transition"
                    style={{ color: "var(--header-text)" }}
                    onClick={onClose}
                  >
                    Login
                  </Link>
                </li>
              ) : (
                <>
                  {[
                    ["Orders", "/orders"],
                    ["Wishlist", "/wishlist"],
                    ["Profile", "/profile"],
                  ].map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="block text-lg font-medium transition"
                        style={{ color: "var(--header-text)" }}
                        onClick={onClose}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}

                  <li>
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="w-full text-left text-lg font-medium transition"
                      style={{ color: "#ef4444" }}
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Footer CTA */}
          <div className="mt-auto pt-6">
            <Link
              href="/products"
              onClick={onClose}
              className="block text-center rounded-xl px-5 py-3 font-medium transition"
              style={{
                background: "rgb(212,175,55)",
                color: "#000",
              }}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
