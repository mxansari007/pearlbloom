"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Pencil, Trash2 } from "lucide-react";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Address } from "@/types/user";

const IN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

type FormErrors = Partial<Record<keyof Address, string>>;

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function validateAddress(
  form: Address,
  pincodeVerified: boolean
): FormErrors {
  const errors: FormErrors = {};

  if (!form.fullName.trim() || form.fullName.trim().length < 2) {
    errors.fullName = "Enter full name.";
  }

  const phone = onlyDigits(form.phone);
  if (phone.length !== 10) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }

  if (!form.line1.trim() || form.line1.trim().length < 5) {
    errors.line1 = "Enter a complete address.";
  }

  if (!/^\d{6}$/.test(form.postalCode.trim())) {
    errors.postalCode = "Enter a valid 6-digit pincode.";
  } else if (!pincodeVerified) {
    errors.postalCode = "Pincode not verified.";
  }

  if (!form.city.trim()) {
    errors.city = "City is required.";
  }

  if (!form.state.trim()) {
    errors.state = "State is required.";
  }

  return errors;
}

async function lookupPincode(pincode: string) {
  const resp = await fetch(`/api/geo/pincode?pincode=${encodeURIComponent(pincode)}`, {
    method: "GET",
    cache: "no-store",
  });
  const json: unknown = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
    const msg = typeof obj.error === "string" ? obj.error : "Invalid pincode";
    throw new Error(msg);
  }
  return json as { valid: boolean; city: string; state: string; country: string };
}

async function checkServiceability(pincode: string) {
  const resp = await fetch(
    `/api/shipping/nimbus/serviceability?pincode=${encodeURIComponent(pincode)}`,
    { method: "GET", cache: "no-store" }
  );
  const json: unknown = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
    const msg = typeof obj.error === "string" ? obj.error : "Serviceability check failed";
    throw new Error(msg);
  }
  const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
  return Boolean(obj.serviceable);
}

export default function AddressClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect"); // 👈 NEW

  const { user } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pincodeStatus, setPincodeStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "valid" }
    | { state: "invalid"; message: string }
  >({ state: "idle" });
  const [serviceabilityStatus, setServiceabilityStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "serviceable" }
    | { state: "not_serviceable" }
    | { state: "error"; message: string }
  >({ state: "idle" });

  const [form, setForm] = useState<Address>({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    createdAt: 0,
  });

  /* ---------------- Protect route ---------------- */

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=/addresses${redirect ? `?redirect=${redirect}` : ""}`);
    }
  }, [user, router, redirect]);

  /* ---------------- Load addresses ---------------- */

  const loadAddresses = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

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

  useEffect(() => {
    if (!showForm) return;
    const pin = onlyDigits(form.postalCode).slice(0, 6);
    if (pin.length !== 6) {
      setPincodeStatus({ state: "idle" });
      setServiceabilityStatus({ state: "idle" });
      return;
    }

    let cancelled = false;
    setPincodeStatus({ state: "checking" });
    setServiceabilityStatus({ state: "idle" });

    lookupPincode(pin)
      .then((data) => {
        if (cancelled) return;
        if (!data?.valid) {
          setPincodeStatus({ state: "invalid", message: "Invalid pincode" });
          setServiceabilityStatus({ state: "idle" });
          return;
        }
        setForm((prev) => ({
          ...prev,
          postalCode: pin,
          city: data.city,
          state: data.state,
          country: data.country,
        }));
        setPincodeStatus({ state: "valid" });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : null;
        setPincodeStatus({ state: "invalid", message: msg || "Invalid pincode" });
        setServiceabilityStatus({ state: "idle" });
      });

    return () => {
      cancelled = true;
    };
  }, [form.postalCode, showForm]);

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
    const pincodeVerified = pincodeStatus.state === "valid";
    const nextErrors = validateAddress(form, pincodeVerified);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);

      const pin = onlyDigits(form.postalCode).slice(0, 6);
      setServiceabilityStatus({ state: "checking" });
      const ok = await checkServiceability(pin);
      if (!ok) {
        setServiceabilityStatus({ state: "not_serviceable" });
        setErrors((prev) => ({ ...prev, postalCode: "Delivery not available to this pincode." }));
        return;
      }
      setServiceabilityStatus({ state: "serviceable" });

      const isFirstAddress = addresses.length === 0;
      if (editingAddressId) {
        await runTransaction(dbClient, async (tx) => {
          tx.update(doc(dbClient, "users", user.uid, "addresses", editingAddressId), {
            ...form,
            phone: onlyDigits(form.phone),
            postalCode: onlyDigits(form.postalCode).slice(0, 6),
            createdAt: form.createdAt || Date.now(),
          });
        });
      } else {
        await addDoc(collection(dbClient, "users", user.uid, "addresses"), {
          ...form,
          phone: onlyDigits(form.phone),
          postalCode: onlyDigits(form.postalCode).slice(0, 6),
          isDefault: isFirstAddress,
          createdAt: Date.now(),
        });
      }

      setShowForm(false);
      setEditingAddressId(null);
      setForm({
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        createdAt: Date.now(),
      });
      setErrors({});
      setPincodeStatus({ state: "idle" });
      setServiceabilityStatus({ state: "idle" });

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
            ← Back to {redirect?.includes("checkout") ? "Checkout" : "Profile"}
          </Link>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingAddressId(null);
              setErrors({});
              setPincodeStatus({ state: "idle" });
              setServiceabilityStatus({ state: "idle" });
              return;
            }
            setEditingAddressId(null);
            setForm({
              fullName: "",
              phone: "",
              line1: "",
              line2: "",
              city: "",
              state: "",
              postalCode: "",
              country: "India",
              createdAt: Date.now(),
            });
            setErrors({});
            setPincodeStatus({ state: "idle" });
            setServiceabilityStatus({ state: "idle" });
            setShowForm(true);
          }}
          className="mb-6 rounded-xl px-5 py-2 text-sm font-medium text-black"
          style={{ background: "rgb(212,175,55)" }}
        >
          {showForm ? "Close" : "Add New Address"}
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
            <div>
              <div className="text-sm font-medium">
                {editingAddressId ? "Edit address" : "Add new address"}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Pincode validates city/state and checks delivery availability.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  Full name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm"
                  placeholder="Your name"
                />
                {errors.fullName && (
                  <div className="mt-1 text-xs text-red-300">{errors.fullName}</div>
                )}
              </div>

              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: onlyDigits(e.target.value).slice(0, 10) }))
                  }
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm"
                  placeholder="10-digit number"
                />
                {errors.phone && <div className="mt-1 text-xs text-red-300">{errors.phone}</div>}
              </div>

              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  Pincode
                </label>
                <input
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, postalCode: onlyDigits(e.target.value).slice(0, 6) }))
                  }
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm"
                  placeholder="6-digit pincode"
                />
                <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {pincodeStatus.state === "checking"
                    ? "Validating pincode…"
                    : pincodeStatus.state === "valid"
                      ? serviceabilityStatus.state === "checking"
                        ? "Checking delivery availability…"
                        : serviceabilityStatus.state === "serviceable"
                          ? "Delivery available."
                          : serviceabilityStatus.state === "not_serviceable"
                            ? "Delivery not available to this pincode."
                            : serviceabilityStatus.state === "error"
                              ? serviceabilityStatus.message
                              : "Pincode verified."
                      : pincodeStatus.state === "invalid"
                        ? pincodeStatus.message
                        : ""}
                </div>
                {errors.postalCode && (
                  <div className="mt-1 text-xs text-red-300">{errors.postalCode}</div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  Address line
                </label>
                <input
                  value={form.line1}
                  onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm"
                  placeholder="House no, street, area"
                />
                {errors.line1 && <div className="mt-1 text-xs text-red-300">{errors.line1}</div>}
              </div>

              <div className="md:col-span-2">
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  Landmark (optional)
                </label>
                <input
                  value={form.line2 || ""}
                  onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm"
                  placeholder="Landmark, building, etc."
                />
              </div>

              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  disabled={pincodeStatus.state !== "valid"}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm disabled:opacity-60"
                  placeholder={pincodeStatus.state === "valid" ? "City" : "Enter pincode first"}
                />
                {errors.city && <div className="mt-1 text-xs text-red-300">{errors.city}</div>}
              </div>

              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>
                  State
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  disabled={pincodeStatus.state !== "valid"}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-4 py-2 text-sm disabled:opacity-60"
                >
                  <option value="" disabled>
                    {pincodeStatus.state === "valid" ? "Select state" : "Enter pincode first"}
                  </option>
                  {IN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && <div className="mt-1 text-xs text-red-300">{errors.state}</div>}
              </div>
            </div>

            <button
              onClick={saveAddress}
              disabled={
                saving ||
                pincodeStatus.state === "checking" ||
                serviceabilityStatus.state === "checking" ||
                serviceabilityStatus.state === "not_serviceable" ||
                serviceabilityStatus.state === "error"
              }
              className="rounded-xl px-5 py-2 text-black text-sm disabled:opacity-60"
              style={{ background: "rgb(212,175,55)" }}
            >
              {saving ? "Saving…" : editingAddressId ? "Update Address" : "Save Address"}
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
                    onClick={() => {
                      setEditingAddressId(a.id || null);
                      setShowForm(true);
                      setErrors({});
                      setPincodeStatus({ state: "idle" });
                      setServiceabilityStatus({ state: "idle" });
                      setForm({
                        id: a.id,
                        fullName: a.fullName || "",
                        phone: a.phone || "",
                        line1: a.line1 || "",
                        line2: a.line2 || "",
                        city: a.city || "",
                        state: a.state || "",
                        postalCode: a.postalCode || "",
                        country: a.country || "India",
                        isDefault: a.isDefault,
                        createdAt: a.createdAt || Date.now(),
                      });
                    }}
                    title="Edit address"
                    style={{ color: "rgb(212,175,55)" }}
                  >
                    <Pencil size={16} />
                  </button>

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
