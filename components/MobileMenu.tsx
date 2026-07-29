"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Home,
  Gem,
  Shapes,
  Droplets,
  CalendarHeart,
  Sparkles,
  Star,
  Heart,
  Mail,
  LogIn,
  Package,
  User,
  LogOut,
  ShoppingBag,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "@/utils/logout";
import ThemeToggle from "./ThemeToggle";

type Pair = [string, string];

type Catalog = {
  styles: Pair[];
  finishes: Pair[];
  occasions: Pair[];
  curated: { label: string; desc: string; href: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  catalog?: Catalog;
};

export default function MobileMenu({ open, onClose, catalog }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Exact match only, so a parent like "All Earrings" (/earrings) doesn't
  // light up on every /earrings/* sub-page alongside the real current item.
  const isActive = (href: string) => pathname === href;

  /* ---------- lock body scroll ---------- */
  useEffect(() => {
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      document.documentElement.classList.add("no-scroll");
      focusTimer = setTimeout(() => {
        const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 120);
    } else {
      document.documentElement.classList.remove("no-scroll");
    }
    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      document.documentElement.classList.remove("no-scroll");
    };
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

  function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const groups: { title: string; param: string; items: Pair[]; icon: typeof Shapes }[] = catalog
    ? [
        { title: "Style", param: "style", items: catalog.styles, icon: Shapes },
        { title: "Finish", param: "finish", items: catalog.finishes, icon: Droplets },
        { title: "Occasion", param: "occasion", items: catalog.occasions, icon: CalendarHeart },
      ]
    : [];

  const primary: [string, string, typeof Home][] = [
    ["Home", "/", Home],
    ["All Earrings", "/earrings", Gem],
  ];

  const secondary: [string, string, typeof Home][] = [
    ["New Arrivals", "/earrings/new-arrivals", Sparkles],
    ["Best Sellers", "/earrings/best-sellers", Star],
    ["Wishlist", "/wishlist", Heart],
    ["Contact", "/contact", Mail],
  ];

  // running index so the staggered entrance flows top-to-bottom across sections
  let i = 0;
  const delay = () => ({ animationDelay: `${Math.min(i++ * 35, 450)}ms` });

  return (
    <div
      className={`mm-backdrop fixed inset-0 z-50 flex ${
        open ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible"
      }`}
      onMouseDown={onBackdropClick}
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      {/* Floating panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`mm-panel ml-auto my-3 mr-3 h-[calc(100%-1.5rem)] w-[88%] max-w-sm rounded-[1.75rem] overflow-hidden flex flex-col transform-gpu ${
          open
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "translate-x-[115%] opacity-0 pointer-events-none invisible"
        }`}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--header-border)",
          color: "var(--header-text)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
        }}
      >
        <div className="h-full grid grid-rows-[auto_minmax(0,1fr)_auto] px-5 py-5">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-3 text-lg font-display" onClick={onClose}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "rgba(var(--gold-rgb), 0.08)",
                  border: "1px solid rgba(var(--bronze-rgb), 0.4)",
                }}
              >
                <Image src="/logo.svg" alt="Pearl Bloom Logo" width={20} height={20} className="object-contain" />
              </div>
              <span>Pearl Bloom</span>
            </Link>

            <button
              aria-label="Close menu"
              onClick={onClose}
              className="mm-close flex items-center justify-center w-11 h-11 rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav key={open ? "open" : "closed"} className="mt-6 min-h-full overflow-y-auto -mr-2 pr-1.5 filter-scroll">
            <ul className="space-y-1">
              {primary.map(([label, href, Icon]) => (
                <li key={href} className="mm-anim" style={delay()}>
                  <Link
                    href={href}
                    className={`mm-link ${isActive(href) ? "is-active" : ""}`}
                    onClick={onClose}
                  >
                    <span className="mm-link__icon"><Icon size={18} strokeWidth={1.75} /></span>
                    <span>{label}</span>
                  </Link>
                </li>
              ))}

              {/* Catalog accordion groups */}
              {groups.map((g) => {
                const isOpen = openGroup === g.title;
                const GIcon = g.icon;
                return (
                  <li key={g.title} className="mm-anim" style={delay()}>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : g.title)}
                      className="mm-link w-full"
                      aria-expanded={isOpen}
                    >
                      <span className="mm-link__icon"><GIcon size={18} strokeWidth={1.75} /></span>
                      <span>
                        {g.title}{" "}
                        <span style={{ color: "rgb(var(--bronze-rgb))" }}>({g.items.length})</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        style={{ color: "var(--header-muted)" }}
                      />
                    </button>
                    <div className={`mm-accordion ${isOpen ? "is-open" : ""}`}>
                      <div>
                        <ul className="pl-11 pr-1 pt-0.5 pb-1.5 space-y-0.5">
                          {g.items.map(([label, slug]) => (
                            <li key={slug}>
                              <Link
                                href={`/earrings/${g.param}/${slug}`}
                                className="mm-sub"
                                onClick={onClose}
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}

              {secondary.map(([label, href, Icon]) => (
                <li key={href} className="mm-anim" style={delay()}>
                  <Link
                    href={href}
                    className={`mm-link ${isActive(href) ? "is-active" : ""}`}
                    onClick={onClose}
                  >
                    <span className="mm-link__icon"><Icon size={18} strokeWidth={1.75} /></span>
                    <span>{label}</span>
                  </Link>
                </li>
              ))}

              {/* Divider */}
              <li className="mx-2 my-2" style={{ borderTop: "1px solid var(--header-border)" }} />

              {/* Auth */}
              {!isAuthenticated ? (
                <li className="mm-anim" style={delay()}>
                  <Link
                    href="/login"
                    className={`mm-link ${isActive("/login") ? "is-active" : ""}`}
                    onClick={onClose}
                  >
                    <span className="mm-link__icon"><LogIn size={18} strokeWidth={1.75} /></span>
                    <span>Login</span>
                  </Link>
                </li>
              ) : (
                <>
                  {([
                    ["Orders", "/orders", Package],
                    ["Profile", "/profile", User],
                  ] as [string, string, typeof Home][]).map(([label, href, Icon]) => (
                    <li key={href} className="mm-anim" style={delay()}>
                      <Link
                        href={href}
                        className={`mm-link ${isActive(href) ? "is-active" : ""}`}
                        onClick={onClose}
                      >
                        <span className="mm-link__icon"><Icon size={18} strokeWidth={1.75} /></span>
                        <span>{label}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="mm-anim" style={delay()}>
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="mm-link mm-link--danger w-full"
                    >
                      <span className="mm-link__icon"><LogOut size={18} strokeWidth={1.75} /></span>
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Footer */}
          <div className="mt-4 pt-4 shrink-0 flex items-center gap-3" style={{ borderTop: "1px solid var(--header-border)" }}>
            <ThemeToggle />
            <Link
              href="/earrings"
              onClick={onClose}
              className="mm-shop flex-1 flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold uppercase tracking-wide text-white"
            >
              <ShoppingBag size={17} strokeWidth={2} />
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
