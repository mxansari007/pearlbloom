"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "../utils/logout";
import { useCartStore } from "@/store/useCartStore";
import ThemeToggle from "./ThemeToggle";
import { ShoppingBag, User, Heart, Menu, ChevronDown, Package, LogOut, Settings } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openCart = useCartStore((s) => s.open);
  const cartCount = useCartStore(
    (s) => s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  /* ---------------- Scroll Detection ---------------- */

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------- Route Change Handler ---------------- */

  useEffect(() => {
    function onRoute() {
      setOpen(false);
      setUserMenuOpen(false);
    }
    window.addEventListener("popstate", onRoute);
    return () => window.removeEventListener("popstate", onRoute);
  }, []);

  /* ---------------- Click Outside Handler ---------------- */

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
        className={`
          fixed inset-x-0 top-0 z-40 transition-all duration-300
          ${scrolled ? "backdrop-blur-xl shadow-lg" : "backdrop-blur-sm"}
        `}
        style={{
          background: scrolled 
            ? "var(--header-bg)" 
            : "transparent",
          borderBottom: scrolled 
            ? "1px solid var(--header-border)" 
            : "1px solid transparent",
        }}
      >
        <div className="container flex items-center justify-between h-16 md:h-18">

          {/* Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.2), rgba(var(--gold-rgb), 0.05))",
                border: "1px solid rgba(var(--gold-rgb), 0.2)",
              }}
            >
              <Image 
                src="/logo.svg" 
                alt="Pearl Bloom Logo" 
                width={22} 
                height={22} 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span 
                className="text-base font-display tracking-tight transition-colors"
                style={{ color: "var(--header-text)" }}
              >
                Pearl Bloom
              </span>
              <span 
                className="text-[10px] uppercase tracking-widest hidden sm:block"
                style={{ color: "var(--header-muted)" }}
              >
                Jewelry
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-xl hover:bg-[var(--header-hover)]"
                style={{ color: "var(--header-text)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">

            <ThemeToggle />

            {/* Wishlist */}
            <Link href="/wishlist">
              <button
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--header-hover)] hover:scale-105"
                style={{ color: "var(--header-text)" }}
                aria-label="Wishlist"
              >
                <Heart size={20} strokeWidth={1.5} />
              </button>
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label={`Cart with ${cartCount} items`}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--header-hover)] hover:scale-105"
              style={{ color: "var(--header-text)" }}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                             rounded-full text-[10px] font-bold
                             flex items-center justify-center
                             animate-scale-in"
                  style={{
                    background: "rgb(var(--gold-rgb))",
                    color: "#000",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div 
              className="w-px h-6 mx-2"
              style={{ background: "var(--header-border)" }}
            />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--header-hover)]"
                  style={{ color: "var(--header-text)" }}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(var(--gold-rgb), 0.1)",
                      border: "1px solid rgba(var(--gold-rgb), 0.2)",
                    }}
                  >
                    <User size={16} className="text-amber-400" />
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--header-muted)" }}
                  />
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {/* Header */}
                    <div 
                      className="px-4 py-3"
                      style={{ 
                        borderBottom: "1px solid var(--border-subtle)",
                        background: "rgba(var(--gold-rgb), 0.05)",
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                        My Account
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        Manage your profile
                      </p>
                    </div>

                    {/* Links */}
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

                    {/* Logout */}
                    <div 
                      className="py-2"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
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
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #e6c547)",
                    color: "#000",
                    boxShadow: "0 4px 15px rgba(var(--gold-rgb), 0.2)",
                  }}
                >
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            
            <button 
              onClick={openCart}
              aria-label="Open cart"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ color: "var(--header-text)" }}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1
                             rounded-full text-[9px] font-bold
                             flex items-center justify-center"
                  style={{
                    background: "rgb(var(--gold-rgb))",
                    color: "#000",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--header-hover)]"
              style={{ color: "var(--header-text)" }}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16 md:h-18" />
      
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
