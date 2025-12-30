"use client";

import "../globals.css";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { track } from "@/utils/analytics";


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

  /* ================= EFFECTS ================= */

  // Cleanup reCAPTCHA on unmount to prevent stale widget references
  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
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
      setResendTimer(RESEND_DELAY);
      setCanResend(false);
      track("login_otp_sent", { method: "phone_otp" });
    } catch (err: unknown) {
      console.error(err);
      resetRecaptcha();
      
      // Detailed debugging for the user
      const hostname = window.location.hostname;
      console.error(`[Auth Debug] Current hostname: "${hostname}"`);
      console.error(`[Auth Debug] If this hostname is not in Firebase Console > Auth > Settings > Authorized Domains, phone auth will fail.`);

      const errorObj = err as { code?: string; message?: string };

      if (errorObj.code === 'auth/invalid-app-credential') {
        setError(`Configuration error: Domain "${hostname}" is not authorized. Check Firebase Console.`);
      } else if (errorObj.code === 'auth/too-many-requests') {
        setError("Too many requests. Please try again later.");
      } else if (typeof errorObj.message === 'string' && errorObj.message.includes('CAPTCHA_CHECK_FAILED')) {
        setError(`Domain "${hostname}" is not authorized for reCAPTCHA. Please add it to Firebase Console.`);
      } else {
        setError(
          "Security check failed. Please click Continue again or reload the page."
        );
      }
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
      track("login_otp_resent", { method: "phone_otp" });
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
        track("signup_started", { method: "phone_otp" });
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
      track("login_success", { method: "phone_otp" });
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
      track("signup_completed", { method: "phone_otp" });
      window.location.href = "/";
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow Effects */}  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(var(--gold-rgb),0.08)] rounded-full blur-[120px] pointer-events-none" />
      
      <div 
        className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-300"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 20px 50px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(var(--gold-rgb), 0.1)"
        }}
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg"
             style={{
               background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.2), rgba(var(--gold-rgb), 0.05))",
               border: "1px solid rgba(var(--gold-rgb), 0.2)"
             }}
          >
             <Image 
               src="/logo.svg" 
               alt="Logo" 
               width={32} 
               height={32}
               className="w-8 h-8 object-contain"
             />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Pearl Bloom</h1>
          <p className="text-sm opacity-60 font-medium tracking-wide uppercase">Elegance that Blooms</p>
        </div>

        {step === "phone" && (
          <div className="animate-fade-in">
            <label className="text-xs font-semibold uppercase tracking-wider opacity-50 ml-1">Phone number</label>

            <div 
              className="flex mt-2 rounded-lg overflow-hidden transition-all duration-300 group focus-within:border-[rgb(var(--gold-rgb))] focus-within:ring-1 focus-within:ring-[rgb(var(--gold-rgb))]"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)"
              }}
            >
              <span className="px-4 py-3.5 text-sm font-medium flex items-center border-r" style={{ color: "var(--input-text)", borderColor: "var(--input-border)" }}>+91</span>
              <input
                className="w-full px-4 py-3.5 outline-none bg-transparent placeholder-[var(--input-placeholder)]"
                style={{ color: "var(--input-text)" }}
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
              className="mt-8 w-full rounded-xl py-3.5 font-bold text-[#0a0a0a] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #f8e7b0)",
                boxShadow: "0 4px 20px rgba(var(--gold-rgb), 0.25)"
              }}
            >
              {loading ? "Sending OTP…" : "Continue"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="animate-fade-in">
            <p className="text-sm text-center opacity-70 mb-6">
              Enter the code sent to <span className="font-semibold text-[rgb(var(--gold-rgb))]">+91 {phone}</span>
            </p>

            <input
              className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))] transition-all"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              placeholder="••••••"
            />

            {error && <ErrorBox message={error} />}

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="mt-8 w-full rounded-xl py-3.5 font-bold text-[#0a0a0a] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #f8e7b0)",
                boxShadow: "0 4px 20px rgba(var(--gold-rgb), 0.25)"
              }}
            >
              {loading ? "Verifying…" : "Verify Code"}
            </button>

            <div className="mt-6 text-center text-sm">
              {!canResend ? (
                <span className="opacity-50">Resend OTP in {resendTimer}s</span>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={loading}
                  className="font-medium hover:underline transition-all"
                  style={{ color: "rgb(var(--gold-rgb))" }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
               <h3 className="text-lg font-semibold">Welcome to Pearl Bloom</h3>
               <p className="text-sm opacity-60 mt-1">Let’s get to know you</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 ml-1 mb-1.5 block">First Name</label>
                <input
                  className="w-full rounded-xl px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] outline-none transition-all duration-300 focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))]"
                  placeholder="e.g. Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-50 ml-1 mb-1.5 block">Last Name <span className="opacity-50 normal-case font-normal">(Optional)</span></label>
                <input
                  className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))] transition-all"
                  placeholder="e.g. Johnson"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            <button
              onClick={saveProfile}
              disabled={loading}
              className="mt-8 w-full rounded-xl py-3.5 font-bold text-[#0a0a0a] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #f8e7b0)",
                boxShadow: "0 4px 20px rgba(var(--gold-rgb), 0.25)"
              }}
            >
              {loading ? "Creating Account…" : "Complete Profile"}
            </button>
          </div>
        )}
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div 
      className="mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-3 animate-shake"
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        color: "#ef4444"
      }}
    >
      <span className="text-lg leading-none mt-0.5">!</span>
      <div className="flex-1">
        {message}
        <button
          className="block mt-1 font-semibold underline opacity-80 hover:opacity-100"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
