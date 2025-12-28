"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import { logout } from "@/utils/logout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Protect route ---------------- */

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [user, loading, router]);

  /* ---------------- Initialize form ---------------- */

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--panel-bg)", color: "var(--muted)" }}
      >
        Loading account…
      </div>
    );
  }

  if (!user) return null;

  /* ---------------- Save profile ---------------- */

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const userRef = doc(dbClient, "users", user.uid);

      await updateDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
      });

      setUser({
        ...user,
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
      });

      setEditing(false);
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-8">My Account</h1>

        {/* ACCOUNT OVERVIEW */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            background: "var(--panel-bg-soft)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            Signed in as
          </p>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-medium">
                {user.firstName} {user.lastName ?? ""}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {user.phone}
              </p>
            </div>

            <button
              onClick={logout}
              className="text-sm transition"
              style={{ color: "#ef4444" }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            ["Orders", "/orders", "Track, return or reorder items"],
            ["Addresses", "/addresses", "Manage delivery addresses"],
            ["Help & Support", "/support", "Contact customer support"],
          ].map(([title, href, desc]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl p-5 transition"
              style={{
                background: "var(--panel-bg-soft)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="font-medium mb-1">{title}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {desc}
              </p>
            </Link>
          ))}
        </div>

        {/* PERSONAL DETAILS */}
        <div
          className="rounded-2xl p-6 max-w-xl"
          style={{
            background: "var(--panel-bg-soft)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2 className="text-lg font-medium mb-4">Personal Details</h2>

          {/* NAME */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                Name
              </p>

              {editing ? (
                <div className="space-y-3">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full rounded-lg px-4 py-2 outline-none"
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--fg)",
                    }}
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name (optional)"
                    className="w-full rounded-lg px-4 py-2 outline-none"
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--fg)",
                    }}
                  />
                </div>
              ) : (
                <p className="font-medium">
                  {user.firstName} {user.lastName ?? ""}
                </p>
              )}

              {error && (
                <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>
                  {error}
                </p>
              )}
            </div>

            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm"
                style={{ color: "rgb(212,175,55)" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-sm"
                style={{ color: "rgb(212,175,55)" }}
              >
                Edit
              </button>
            )}
          </div>

          {/* PHONE */}
          <div className="mt-6">
            <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
              Phone
            </p>
            <p className="font-medium">{user.phone}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
