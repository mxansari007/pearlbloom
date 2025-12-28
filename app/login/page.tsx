"use client";

import "../globals.css";

import { useState,useEffect } from "react";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { auth, dbClient } from "@/libs/firebase-client";
import type { AppUser } from "@/types/user";
import { useAuthStore } from "@/store/useAppStore";
import {
  getRecaptchaVerifier,
  resetRecaptcha,
} from "@/utils/initRecaptcha";

import { initAppCheck } from "@/utils/initAppCheck";

type Step = "phone" | "otp" | "profile";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
  initAppCheck();
}, []);




  /* ================= SEND OTP ================= */

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const verifier = getRecaptchaVerifier();
      if (!verifier) {
        setError("Unable to start verification. Please reload the page.");
        return;
      }

      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        verifier
      );

      setConfirmation(result);
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      resetRecaptcha();

      setError(
        "Security check failed. Please click Continue again or reload the page."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    if (!confirmation || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cred = await confirmation.confirm(otp);
      const firebaseUser = cred.user;
      setFirebaseUid(firebaseUser.uid);

      const userRef = doc(dbClient, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      const now = Date.now();

      if (!snap.exists()) {
        const newUser: AppUser = {
          uid: firebaseUser.uid,
          phone: firebaseUser.phoneNumber!,
          role: "customer",
          createdAt: now,
          lastLoginAt: now,
        };

        await setDoc(userRef, newUser);
        setStep("profile");
        return;
      }

      const appUser = snap.data() as AppUser;
      await updateDoc(userRef, { lastLoginAt: now });

      if (!appUser.firstName) {
        setStep("profile");
        return;
      }

      setUser(appUser);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      window.location.href = redirect;
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE PROFILE ================= */

  const saveProfile = async () => {
    if (!firstName.trim() || !firebaseUid) {
      setError("First name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userRef = doc(dbClient, "users", firebaseUid);

      const appUser: AppUser = {
        uid: firebaseUid,
        phone: `+91${phone}`,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        role: "customer",
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      await updateDoc(userRef, appUser);
      setUser(appUser);
      window.location.href = "/";
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: "var(--panel-bg-soft)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Pearl Bloom</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Elegance that Blooms
          </p>
        </div>

        {/* PHONE STEP */}
        {step === "phone" && (
          <>
            <label className="text-xs" style={{ color: "var(--muted)" }}>
              Phone number
            </label>

            <div
              className="flex mt-2 rounded-xl overflow-hidden"
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--panel-bg)",
              }}
            >
              <span className="px-4 py-3 text-sm">+91</span>
              <input
                className="w-full px-4 py-3 outline-none bg-transparent"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>

            {error && <ErrorBox message={error} />}

            <button
              onClick={sendOtp}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-black font-medium"
            >
              {loading ? "Sending OTP…" : "Continue"}
            </button>
          </>
        )}

        {/* OTP STEP */}
        {step === "otp" && (
          <>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Enter the code sent to +91 {phone}
            </p>

            <input
              className="w-full rounded-xl px-4 py-3 text-center tracking-[0.35em]"
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--panel-bg)",
              }}
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
            />

            {error && <ErrorBox message={error} />}

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-black font-medium"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </>
        )}

        {/* PROFILE STEP */}
        {step === "profile" && (
          <>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Let’s get to know you
            </p>

            <input
              className="w-full rounded-xl px-4 py-3 mb-3"
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--panel-bg)",
              }}
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              className="w-full rounded-xl px-4 py-3"
              style={{
                border: "1px solid var(--border-subtle)",
                background: "var(--panel-bg)",
              }}
              placeholder="Last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            {error && <ErrorBox message={error} />}

            <button
              onClick={saveProfile}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-black font-medium"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </>
        )}
      </div>

      {/* MUST BE PRESENT & STABLE */}
      <div id="recaptcha-container" />
    </div>
  );
}

/* ================= Error Box ================= */

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="mt-3 rounded-lg px-4 py-2 text-sm"
      style={{
        background: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.3)",
      }}
    >
      {message}
      <button
        className="block mt-2 underline"
        onClick={() => window.location.reload()}
      >
        Reload page
      </button>
    </div>
  );
}
