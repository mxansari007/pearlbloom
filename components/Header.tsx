"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "../utils/logout";
import { useCartStore } from "@/store/useCartStore";
import ThemeToggle from "./ThemeToggle";
import {
  ShoppingBag,
  User,
  Heart,
  Menu,
  ChevronDown,
  Package,
  LogOut,
  Settings,
  Compass,
} from "lucide-react";

/* ---------------- Catalog taxonomy data ---------------- */

const STYLES: [string, string][] = [
  ["Stud Earrings", "stud"],
  ["Hoop Earrings", "hoop"],
  ["Drop Earrings", "drop"],
  ["Dangle Earrings", "dangle"],
  ["Statement Earrings", "statement"],
  ["Jhumka Earrings", "jhumka"],
  ["Chandbali Earrings", "chandbali"],
  ["Ear Cuffs Earrings", "ear-cuffs"],
  ["Mismatch Earrings", "mismatch"],
  ["Clip-on Earrings", "clip-on"],
  ["Long Earrings", "long"],
  ["Huggies Earrings", "huggies"],
  ["Bali Earrings", "bali"],
];

const FINISHES: [string, string][] = [
  ["Gold Plated Earrings", "gold-plated"],
  ["Gold Tone Earrings", "gold-tone"],
  ["Anti Tarnish Earrings", "anti-tarnish"],
  ["Waterproof Earrings", "waterproof"],
  ["Oxidised Earrings", "oxidised"],
  ["Silver Tone Earrings", "silver-tone"],
  ["Enamel Earrings", "enamel"],
  ["Pearl Earrings", "pearl"],
  ["Crystal Earrings", "crystal"],
  ["CZ Earrings", "cz"],
  ["American Diamond Earrings", "american-diamond"],
  ["Stone Earrings", "stone"],
  ["Kundan Earrings", "kundan"],
];

const OCCASIONS: [string, string][] = [
  ["Daily Wear Earrings", "daily-wear"],
  ["Office Wear Earrings", "office-wear"],
  ["Party Wear Earrings", "party-wear"],
  ["Festive Wear Earrings", "festive-wear"],
  ["Wedding Wear Earrings", "wedding-wear"],
  ["Bridal Earrings", "bridal"],
  ["College Wear Earrings", "college-wear"],
  ["Gift Earrings", "gift"],
  ["Earrings Set", "set"],
];

const CURATED: { label: string; desc: string; href: string }[] = [
  { label: "All Earrings", desc: "Explore the core entire catalog", href: "/earrings" },
  { label: "New Arrivals", desc: "Recently crafted creations", href: "/earrings/new-arrivals" },
  { label: "Best Sellers", desc: "Treasured favorites voted by you", href: "/earrings/best-sellers" },
];

function MegaColumn({
  title,
  count,
  items,
  param,
  onNavigate,
}: {
  title: string;
  count: number;
  items: [string, string][];
  param: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <h3
        className="font-display italic text-lg pb-2 mb-2"
        style={{ color: "var(--fg)", fontWeight: 400, borderBottom: "1px solid var(--hero-hairline)" }}
      >
        {title} <span style={{ color: "rgb(var(--bronze-rgb))" }}>({count})</span>
      </h3>
      <ul className="mega-scroll pr-2 space-y-1.5">
        {items.map(([label, slug]) => (
          <li key={slug}>
            <Link
              href={`/earrings/${param}/${slug}`}
              className="mega-link text-sm py-1"
              onClick={onNavigate}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Only use hover-to-open on devices that actually hover (desktop). On touch
  // screens hover is emulated, which made the first tap open-then-close — so we
  // rely on tap/click there instead (single tap opens).
  const [hoverCapable, setHoverCapable] = useState(false);

  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const catalogRef = useRef<HTMLDivElement | null>(null);
  const megaPanelRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolledRef = useRef(false);

  const openCart = useCartStore((s) => s.open);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  /* Scroll detection */
  useEffect(() => {
    function onScroll() {
      const nextScrolled = window.scrollY > 20;
      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Detect whether the device truly supports hover (desktop pointer) */
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  /* Click-outside handlers */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setUserMenuOpen(false);
      const inCatalog =
        (catalogRef.current && catalogRef.current.contains(t)) ||
        (megaPanelRef.current && megaPanelRef.current.contains(t));
      if (!inCatalog) setCatalogOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Catalog hover open/close (with small delay) */
  const openCatalog = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCatalogOpen(true);
  };
  const closeCatalogSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCatalogOpen(false), 160);
  };

  const solidHeader = scrolled || catalogOpen;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href.split("?")[0] && !href.includes("?");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-shadow duration-300 will-change-[box-shadow] ${
          solidHeader ? "backdrop-blur-xl shadow-lg" : "backdrop-blur-sm"
        }`}
        style={{
          background: solidHeader ? "var(--header-bg)" : "transparent",
          borderBottom: solidHeader ? "1px solid var(--header-border)" : "1px solid transparent",
        }}
      >
        <div className="container flex items-center justify-between h-16 md:h-[72px]">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "rgba(var(--gold-rgb), 0.08)",
                border: "1px solid rgba(var(--bronze-rgb), 0.4)",
              }}
            >
              <Image src="/logo.svg" alt="Pearl Bloom" width={20} height={20} className="object-contain" />
            </span>
            <span className="font-display text-lg md:text-xl tracking-tight" style={{ color: "var(--header-text)" }}>
              Pearl Bloom
            </span>
          </Link>

          {/* Desktop Navigation — floating pill capsule */}
          <nav className="nav-pill hidden lg:flex items-center gap-1">
            <Link href="/" className={`nav-pill__link ${isActive("/") ? "is-active" : ""}`}>
              Home
            </Link>
            <Link href="/earrings" className={`nav-pill__link ${isActive("/earrings") ? "is-active" : ""}`}>
              All Earrings
            </Link>

            {/* Catalog mega-menu trigger */}
            <div
              ref={catalogRef}
              className="relative"
              onMouseEnter={hoverCapable ? openCatalog : undefined}
              onMouseLeave={hoverCapable ? closeCatalogSoon : undefined}
            >
              <button
                type="button"
                onClick={() => setCatalogOpen((v) => !v)}
                className={`nav-pill__link inline-flex items-center gap-1.5 ${catalogOpen ? "is-active" : ""}`}
                aria-expanded={catalogOpen}
                aria-haspopup="true"
              >
                Catalog
                <ChevronDown size={14} className={`transition-transform duration-200 ${catalogOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            <Link href="/earrings/new-arrivals" className={`nav-pill__link ${isActive("/earrings/new-arrivals") ? "is-active" : ""}`}>
              New Arrivals
            </Link>
            <Link href="/earrings/best-sellers" className={`nav-pill__link ${isActive("/earrings/best-sellers") ? "is-active" : ""}`}>
              Best Sellers
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <ThemeToggle />

            <Link href="/wishlist">
              <button
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--header-hover)] hover:scale-105"
                style={{ color: "var(--header-text)" }}
                aria-label="Wishlist"
              >
                <Heart size={20} strokeWidth={1.5} />
              </button>
            </Link>

            <button
              onClick={openCart}
              aria-label={`Cart with ${cartCount} items`}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--header-hover)] hover:scale-105"
              style={{ color: "var(--header-text)" }}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center animate-scale-in"
                  style={{ background: "rgb(var(--bronze-rgb))", color: "#fff" }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 mx-1.5" style={{ background: "var(--header-border)" }} />

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--header-hover)]"
                  style={{ color: "var(--header-text)" }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(var(--bronze-rgb), 0.12)", border: "1px solid rgba(var(--bronze-rgb), 0.25)" }}
                  >
                    <User size={16} style={{ color: "rgb(var(--bronze-rgb))" }} />
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--header-muted)" }}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
                    style={{ background: "var(--panel-bg)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(var(--bronze-rgb), 0.06)" }}
                    >
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>My Account</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Manage your profile</p>
                    </div>
                    <div className="py-2">
                      {[
                        { icon: Package, label: "Orders", href: "/orders" },
                        { icon: Heart, label: "Wishlist", href: "/wishlist" },
                        { icon: Settings, label: "Profile", href: "/profile" },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--header-hover)]"
                          style={{ color: "var(--fg)" }}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon size={16} style={{ color: "var(--muted)" }} />
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="py-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button
                  className="px-5 py-2.5 rounded-xl text-[12.5px] font-semibold uppercase tracking-[0.1em] transition-all duration-300 hover:opacity-75 hover:scale-[1.02] active:scale-[0.98] text-white"
                  style={{ background: "rgb(var(--bronze-rgb))", boxShadow: "0 6px 18px rgba(var(--bronze-rgb), 0.3)" }}
                >
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={(e) => {
                // Buttons may be rendered inside a navigable header area by
                // a parent integration. Cancelling both propagation and the
                // anchor default keeps this action local in either case.
                e.preventDefault();
                e.stopPropagation();
                openCart();
              }}
              aria-label="Open cart"
              className="header-icon-hover relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ color: "var(--header-text)" }}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: "rgb(var(--bronze-rgb))", color: "#fff" }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
              }}
              aria-label="Open menu"
              className="header-icon-hover ml-auto w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ color: "var(--header-text)" }}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Catalog Mega-Menu */}
        {catalogOpen && (
          <div
            ref={megaPanelRef}
            className="hidden lg:block absolute left-0 right-0 top-full animate-fade-in-up"
            onMouseEnter={hoverCapable ? openCatalog : undefined}
            onMouseLeave={hoverCapable ? closeCatalogSoon : undefined}
          >
            <div className="container">
              <div
                className="mt-2 rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  background: "var(--mega-bg)",
                  border: "1px solid var(--mega-border)",
                }}
              >
                <div className="grid grid-cols-[1.05fr_1.1fr_1.15fr_1fr] gap-8 p-7">
                  {/* Curated View */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <Compass size={15} style={{ color: "rgb(var(--bronze-rgb))" }} />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                        style={{ color: "rgb(var(--bronze-rgb))" }}
                      >
                        Curated View
                      </span>
                    </div>

                    <div className="space-y-1">
                      {CURATED.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="group block rounded-lg px-3 py-2 -mx-3 transition-colors duration-200 hover:bg-red-500/10"
                          onClick={() => setCatalogOpen(false)}
                        >
                          <p
                            className="text-sm font-semibold uppercase tracking-wide transition-colors duration-200 group-hover:text-[rgb(239,68,68)]"
                            style={{ color: "var(--fg)" }}
                          >
                            {c.label}
                          </p>
                          <p className="leading-tight mt-0" style={{ color: "var(--muted)", fontSize: "12.6px", lineHeight: 1.3 }}>
                            {c.desc}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <MegaColumn title="Style" count={STYLES.length} items={STYLES} param="style" onNavigate={() => setCatalogOpen(false)} />
                  <MegaColumn title="Finish" count={FINISHES.length} items={FINISHES} param="finish" onNavigate={() => setCatalogOpen(false)} />
                  <MegaColumn title="Occasion" count={OCCASIONS.length} items={OCCASIONS} param="occasion" onNavigate={() => setCatalogOpen(false)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-16 md:h-[72px]" />

      <MobileMenu open={open} onClose={() => setOpen(false)} catalog={{ styles: STYLES, finishes: FINISHES, occasions: OCCASIONS, curated: CURATED }} />
    </>
  );
}
