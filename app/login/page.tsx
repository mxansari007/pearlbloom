"use client";

import "../globals.css";

import { useState, useEffect } from "react";
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

type Step = "phone" | "otp" | "profile";

const RESEND_DELAY = 60; // seconds

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

  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const setUser = useAuthStore((s) => s.setUser);

  /* ================= RESEND COUNTDOWN ================= */

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

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
      setResendTimer(RESEND_DELAY);
      setCanResend(false);
    } catch (err) {
      console.error(err);
      resetRecaptcha();
      setError(
        "Security check failed. Please click Continue again or reload the page."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */

  const resendOtp = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      setError(null);

      resetRecaptcha();
      const verifier = getRecaptchaVerifier();

      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        verifier!
      );

      setConfirmation(result);
      setResendTimer(RESEND_DELAY);
      setCanResend(false);
    } catch {
      setError("Failed to resend OTP. Please try again.");
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

      await setDoc(userRef, appUser, { merge: true });

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">Pearl Bloom</h1>
          <p className="mt-2 text-sm">Elegance that Blooms</p>
        </div>

        {step === "phone" && (
          <>
            <label className="text-xs">Phone number</label>

            <div className="flex mt-2 rounded-xl overflow-hidden border">
              <span className="px-4 py-3 text-sm">+91</span>
              <input
                className="w-full px-4 py-3 outline-none"
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
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 font-medium"
            >
              {loading ? "Sending OTP…" : "Continue"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="text-xs mb-4">
              Enter the code sent to +91 {phone}
            </p>

            <input
              className="w-full rounded-xl px-4 py-3 text-center tracking-[0.35em] border"
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
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 font-medium"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>

            <div className="mt-4 text-center text-sm">
              {!canResend ? (
                <span>Resend OTP in {resendTimer}s</span>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={loading}
                  className="underline text-yellow-500"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}

        {step === "profile" && (
          <>
            <p className="text-sm mb-4">Let’s get to know you</p>

            <input
              className="w-full rounded-xl px-4 py-3 mb-3 border"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              className="w-full rounded-xl px-4 py-3 border"
              placeholder="Last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            {error && <ErrorBox message={error} />}

            <button
              onClick={saveProfile}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 font-medium"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </>
        )}
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-lg px-4 py-2 text-sm bg-red-100 text-red-600">
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
