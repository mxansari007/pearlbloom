"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { Package, MapPin, LogOut, MessageCircle, Pencil, Check } from "lucide-react";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "@/utils/logout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace("/login?redirect=/profile");
  }, [user, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      setBirthday(user.birthday ?? "");
    }
  }, [user]);

  if (!user) return null;

  const initials =
    `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.trim() ||
    (user.phone ?? "U").slice(-2);

  const openChat = () => window.dispatchEvent(new Event("pearlbloom:open-chat"));

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const userRef = doc(dbClient, "users", user.uid);
      await updateDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        birthday: birthday || null,
      });

      setUser({
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim() || "",
        email: email.trim() || undefined,
        birthday: birthday || undefined,
      });

      setEditing(false);
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: "var(--panel-bg-soft)",
    border: "1px solid var(--border-subtle)",
  } as const;

  const inputClass =
    "w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))] transition-all";

  return (
    <div
      className="min-h-screen px-5 sm:px-6 py-12"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div className="max-w-3xl mx-auto">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
          style={{ color: "rgb(var(--bronze-rgb))" }}
        >
          Pearl Bloom
        </p>
        <h1 className="text-3xl md:text-4xl font-display mb-8" style={{ color: "var(--fg)" }}>
          My Account
        </h1>

        {/* ACCOUNT OVERVIEW */}
        <div className="rounded-2xl p-6 mb-8" style={cardStyle}>
          <div className="flex items-center gap-4">
            <div
              className="grid place-items-center w-14 h-14 rounded-full shrink-0 text-lg font-semibold uppercase"
              style={{
                background: "linear-gradient(135deg, rgba(var(--gold-rgb),0.22), rgba(var(--bronze-rgb),0.18))",
                color: "rgb(var(--bronze-rgb))",
                border: "1px solid rgba(var(--gold-rgb),0.3)",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>
                Signed in as
              </p>
              <p className="text-lg font-medium truncate">
                {user.firstName} {user.lastName ?? ""}
              </p>
              <p className="text-sm truncate" style={{ color: "var(--muted)" }}>
                {user.phone}
              </p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3.5 py-2 transition hover:bg-[rgba(239,68,68,0.1)]"
              style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/orders" className="account-tile rounded-2xl p-5" style={cardStyle}>
            <span
              className="grid place-items-center w-9 h-9 rounded-full mb-3"
              style={{ background: "rgba(var(--gold-rgb),0.14)", color: "rgb(var(--bronze-rgb))" }}
            >
              <Package size={16} />
            </span>
            <p className="font-medium">Orders</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Track, return or reorder
            </p>
          </Link>

          <Link href="/addresses" className="account-tile rounded-2xl p-5" style={cardStyle}>
            <span
              className="grid place-items-center w-9 h-9 rounded-full mb-3"
              style={{ background: "rgba(var(--gold-rgb),0.14)", color: "rgb(var(--bronze-rgb))" }}
            >
              <MapPin size={16} />
            </span>
            <p className="font-medium">Addresses</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Manage delivery addresses
            </p>
          </Link>

          {/* Help & Support → opens the live chat widget */}
          <button
            type="button"
            onClick={openChat}
            className="account-chat-btn group rounded-2xl p-5 text-left text-black
                       bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500
                       transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99]"
            style={{ boxShadow: "0 14px 30px -14px rgba(180,140,40,0.7)" }}
          >
            <span className="grid place-items-center w-9 h-9 rounded-full mb-3 bg-black/10">
              <MessageCircle size={16} />
            </span>
            <p className="font-semibold flex items-center gap-1.5">
              Help &amp; Support
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">›</span>
            </p>
            <p className="text-sm mt-0.5 text-black/70">Chat with us now</p>
          </button>
        </div>

        {/* PERSONAL DETAILS */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display" style={{ color: "var(--fg)" }}>
              Personal Details
            </h2>
            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2 text-black
                           bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 transition disabled:opacity-60"
              >
                <Check size={14} />
                {saving ? "Saving…" : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2 transition hover:bg-[rgba(var(--gold-rgb),0.1)]"
                style={{ color: "rgb(var(--bronze-rgb))", border: "1px solid rgba(var(--gold-rgb),0.35)" }}
              >
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>

          {error && (
            <p className="mb-4 text-xs" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={`mt-1.5 ${inputClass}`} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name (optional)" className={`mt-1.5 ${inputClass}`} />
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`mt-1.5 ${inputClass}`} />
                <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>For order updates &amp; offers.</p>
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Birthday (optional)</label>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={`mt-1.5 ${inputClass}`} />
                <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>So we can send you a little something. 🎁</p>
              </div>
            </div>
          ) : (
            <dl className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              <Row label="Name" value={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—"} />
              <Row label="Email" value={user.email || "Not added"} muted={!user.email} />
              <Row label="Birthday" value={user.birthday || "Not added"} muted={!user.birthday} />
              <Row label="Phone" value={user.phone} />
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: muted ? "var(--muted)" : "var(--fg)" }}>
        {value}
      </span>
    </div>
  );
}
