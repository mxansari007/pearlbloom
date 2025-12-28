"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  runTransaction,
} from "firebase/firestore";
import { Trash2 } from "lucide-react";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Address } from "@/types/user";

export default function AddressesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect"); // 👈 NEW

  const { user } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Address>({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    createdAt: Date.now(),
  });

  /* ---------------- Protect route ---------------- */

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=/addresses${redirect ? `?redirect=${redirect}` : ""}`);
    }
  }, [user, router, redirect]);

  /* ---------------- Load addresses ---------------- */

  const loadAddresses = async () => {
    if (!user) return;

    const q = query(
      collection(dbClient, "users", user.uid, "addresses"),
      orderBy("createdAt", "asc")
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Address),
    }));

    setAddresses(list);
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

//   if (loading) {
//     return (
//       <div
//         className="min-h-screen flex items-center justify-center"
//         style={{ background: "var(--panel-bg)", color: "var(--muted)" }}
//       >
//         Loading addresses…
//       </div>
//     );
//   }

  if (!user) return null;

  const primaryAddress = addresses.find((a) => a.isDefault);

  /* ---------------- Set primary address ---------------- */

  const setPrimaryAddress = async (newPrimaryId: string) => {
    if (!user || !primaryAddress) return;

    await runTransaction(dbClient, async (tx) => {
      tx.update(
        doc(dbClient, "users", user.uid, "addresses", primaryAddress.id!),
        { isDefault: false }
      );

      tx.update(
        doc(dbClient, "users", user.uid, "addresses", newPrimaryId),
        { isDefault: true }
      );
    });

    await loadAddresses();

    // 👈 Return to checkout if intent exists
    if (redirect) {
      router.push(redirect);
    }
  };

  /* ---------------- Delete address ---------------- */

  const deleteAddress = async (address: Address) => {
    if (!user || !address.id) return;

    const ok = confirm("Are you sure you want to delete this address?");
    if (!ok) return;

    await runTransaction(dbClient, async (tx) => {
      tx.delete(
        doc(dbClient, "users", user.uid, "addresses", address.id!)
      );

      if (address.isDefault) {
        const remaining = addresses.filter((a) => a.id !== address.id);
        if (remaining.length > 0) {
          tx.update(
            doc(
              dbClient,
              "users",
              user.uid,
              "addresses",
              remaining[0].id!
            ),
            { isDefault: true }
          );
        }
      }
    });

    await loadAddresses();
  };

  /* ---------------- Add address ---------------- */

  const saveAddress = async () => {
    if (!form.fullName || !form.phone || !form.line1 || !form.city) return;

    try {
      setSaving(true);

      const isFirstAddress = addresses.length === 0;

      await addDoc(
        collection(dbClient, "users", user.uid, "addresses"),
        {
          ...form,
          isDefault: isFirstAddress,
          createdAt: Date.now(),
        }
      );

      setShowForm(false);
      setForm({
        fullName: "",
        phone: "",
        line1: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        createdAt: Date.now(),
      });

      await loadAddresses();

      // 👈 If coming from checkout, return automatically
      if (redirect) {
        router.push(redirect);
      }
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Addresses</h1>

          <Link
            href={redirect || "/profile"}
            className="text-sm"
            style={{ color: "rgb(212,175,55)" }}
          >
            ← Back to {redirect === "/checkout" ? "Checkout" : "Profile"}
          </Link>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mb-6 rounded-xl px-5 py-2 text-sm font-medium text-black"
          style={{ background: "rgb(212,175,55)" }}
        >
          {showForm ? "Cancel" : "Add New Address"}
        </button>

        {/* FORM */}
        {showForm && (
          <div
            className="rounded-2xl p-6 mb-10 max-w-xl space-y-4"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {["fullName", "phone", "line1", "city", "state", "postalCode"].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field.replace(/^\w/, (c) => c.toUpperCase())}
                  className="w-full rounded-lg px-4 py-2 outline-none"
                  style={{
                    background: "var(--panel-bg)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--fg)",
                  }}
                  value={(form as any)[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                />
              )
            )}

            <button
              onClick={saveAddress}
              disabled={saving}
              className="rounded-xl px-5 py-2 text-black text-sm"
              style={{ background: "rgb(212,175,55)" }}
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        )}

        {/* ADDRESS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-6"
              style={{
                background: "var(--panel-bg-soft)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{a.fullName}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {a.phone}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {a.isDefault && (
                    <span className="text-xs text-green-500 font-medium">
                      Primary
                    </span>
                  )}

                  <button
                    onClick={() => deleteAddress(a)}
                    style={{ color: "#ef4444" }}
                    title="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm">
                {a.line1}, {a.city}, {a.state} {a.postalCode}
              </p>
              <p className="text-sm">{a.country}</p>

              {!a.isDefault && primaryAddress && (
                <button
                  onClick={() => setPrimaryAddress(a.id!)}
                  className="mt-3 text-sm"
                  style={{ color: "rgb(212,175,55)" }}
                >
                  Make Primary
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
