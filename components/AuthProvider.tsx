"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../libs/firebase-client";
import { useAuthStore } from "../store/useAppStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        clearUser(); // 🔥 token expired / logged out
      }
    });

    return () => unsub();
  }, [clearUser]);

  return <>{children}</>;
}
