import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/libs/firebase-client";

let verifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier() {
  if (typeof window === "undefined") return null;

  const container = document.getElementById("recaptcha-container");
  if (!container) return null;

  if (!verifier) {
    verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => resetRecaptcha(),
      }
    );
  }

  return verifier;
}

export function resetRecaptcha() {
  if (verifier) {
    verifier.clear();
    verifier = null;
  }
}
