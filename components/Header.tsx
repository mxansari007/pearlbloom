"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "../utils/logout";
import { useCartStore } from "@/store/useCartStore";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openCart = useCartStore((s) => s.open);
  const cartCount = useCartStore(
    (s) => s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    function onRoute() {
      setOpen(false);
      setUserMenuOpen(false);
    }
    window.addEventListener("popstate", onRoute);
    return () => window.removeEventListener("popstate", onRoute);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <>
      <header
        className="
          fixed inset-x-0 top-0 z-40 backdrop-blur-sm
          border-b
        "
        style={{
          background: "var(--header-bg)",
          borderColor: "var(--header-border)",
          color: "var(--header-text)",
        }}
      >
        <div className="container flex items-center justify-between py-4">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,175,55,0.16), transparent)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
                  fill="rgb(212,175,55)"
                />
              </svg>
            </div>
            <span className="text-lg font-display tracking-tight">
              Pearl Bloom
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" style={{ color: "var(--header-text)" }}>
              Home
            </Link>
            <Link href="/products" style={{ color: "var(--header-text)" }}>
              Products
            </Link>
            <Link href="/contact" style={{ color: "var(--header-muted)" }}>
              Contact
            </Link>

            {/* Actions */}
            <div className="ml-4 flex items-center gap-4">

              <ThemeToggle />

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative rounded-full p-2 border transition"
                style={{
                  borderColor: "var(--header-border)",
                }}
              >
                🛒
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                               rounded-full bg-amber-400 text-black
                               text-[11px] font-medium
                               flex items-center justify-center"
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="rounded-full p-2 border transition"
                    style={{
                      borderColor: "var(--header-border)",
                    }}
                  >
                    👤
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-3 w-48 rounded-2xl
                                 backdrop-blur-xl shadow-xl overflow-hidden z-50"
                      style={{
                        background: "var(--header-bg)",
                        border: "1px solid var(--header-border)",
                      }}
                    >
                      {[
                        ["Orders", "/orders"],
                        ["Wishlist", "/wishlist"],
                        ["Profile", "/profile"],
                      ].map(([label, href]) => (
                        <Link
                          key={href}
                          href={href}
                          className="block px-4 py-3 text-sm"
                          style={{ color: "var(--header-text)" }}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      ))}

                      <div
                        className="h-px my-1"
                        style={{ background: "var(--header-border)" }}
                      />

                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-sm text-red-500"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <button
                    className="rounded-full border px-4 py-2 text-sm"
                    style={{
                      borderColor: "var(--header-border)",
                      color: "var(--header-text)",
                    }}
                  >
                    Login
                  </button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button onClick={openCart}>🛒</button>
            <button onClick={() => setOpen(true)}>☰</button>
          </div>
        </div>
      </header>

      <div className="h-16 md:h-18" />
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
