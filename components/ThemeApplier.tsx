"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeApplier() {
  const { theme } = useThemeStore();

  /* Apply theme to <html> */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /* Safety net: remove any stray scroll-lock left by interrupted panel opens */
  useEffect(() => {
    document.documentElement.classList.remove("no-scroll");
  }, []);

  return null;
}
