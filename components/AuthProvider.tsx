"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../libs/firebase-client";
import { useAppConfigStore, useAuthStore } from "../store/useAppStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clearUser = useAuthStore((s) => s.clearUser);
  const loadConfig = useAppConfigStore((s) => s.loadConfig);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        clearUser(); // 🔥 token expired / logged out
      }
    });

    return () => unsub();
  }, [clearUser]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return <>{children}</>;
}
