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
        header-icon-hover
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-[var(--input-bg)] border border-[var(--input-border)]
      "
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} style={{ color: "#5e1830" }} />
      )}
    </button>
  );
}
