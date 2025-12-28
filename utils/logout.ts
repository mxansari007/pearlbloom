import { signOut } from "firebase/auth";
import { auth } from "@/libs/firebase-client";
import { useAuthStore } from "../store/useAppStore";

export async function logout() {
  try {
    // 1️⃣ Firebase logout
    await signOut(auth);
  } finally {
    // 2️⃣ Clear Zustand (even if Firebase fails)
    useAuthStore.getState().clearUser();

    // 3️⃣ Optional: redirect
    window.location.href = "/login";
  }
}
