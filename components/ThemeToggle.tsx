"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-[var(--input-bg)] border border-[var(--input-border)]
        hover:bg-[var(--glass)] transition
      "
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-slate-700" />
      )}
    </button>
  );
}
