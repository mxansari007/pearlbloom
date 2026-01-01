"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import type { Address } from "@/types/user";
import { dbClient } from "@/libs/firebase-client";

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

export default function CheckoutAddressSection({
  userId,
  title = "Shipping Address",
  selectedAddressId,
  onSelectAddressId,
  onSelectedAddress,
}: {
  userId: string;
  title?: string;
  selectedAddressId: string | null;
  onSelectAddressId: (id: string | null) => void;
  onSelectedAddress: (address: Address | null) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

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
  const [errors, setErrors] = useState<FormErrors>({});

  const stateOptions = useMemo(() => {
    const current = form.state.trim();
    if (!current) return IN_STATES;
    if (IN_STATES.includes(current)) return IN_STATES;
    return [current, ...IN_STATES];
  }, [form.state]);

  const selected = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const editingAddress = useMemo(
    () => addresses.find((a) => a.id === editingAddressId) ?? null,
    [addresses, editingAddressId]
  );

  useEffect(() => {
    onSelectedAddress(selected);
  }, [selected, onSelectedAddress]);

  const loadAddresses = useCallback(async () => {
    try {
      const q = query(
        collection(dbClient, "users", userId, "addresses"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Address) }));
      setAddresses(list);

      if (list.length === 0) {
        onSelectAddressId(null);
        setEditingAddressId(null);
        setShowForm(true);
        return;
      }

      if (!selectedAddressId) {
        const def = list.find((a) => a.isDefault) ?? list[0];
        onSelectAddressId(def?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [onSelectAddressId, selectedAddressId, userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
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
  }, [form.postalCode]);

  async function saveNewAddress() {
    const pincodeVerified = pincodeStatus.state === "valid";
    const nextErrors = validateAddress(form, pincodeVerified);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const pin = onlyDigits(form.postalCode).slice(0, 6);
      setServiceabilityStatus({ state: "checking" });
      const ok = await checkServiceability(pin);
      if (!ok) {
        setServiceabilityStatus({ state: "not_serviceable" });
        setErrors((prev) => ({ ...prev, postalCode: "Delivery not available to this pincode." }));
        return;
      }
      setServiceabilityStatus({ state: "serviceable" });

      const defaultAddress = addresses.find((a) => a.isDefault);
      const isFirst = addresses.length === 0;
      const makeDefault = isFirst;
      const addressRef = editingAddressId
        ? doc(dbClient, "users", userId, "addresses", editingAddressId)
        : doc(collection(dbClient, "users", userId, "addresses"));
      const isEditing = Boolean(editingAddressId);

      await runTransaction(dbClient, async (tx) => {
        if (!isEditing && makeDefault && defaultAddress?.id) {
          tx.update(doc(dbClient, "users", userId, "addresses", defaultAddress.id), {
            isDefault: false,
          });
        }
        const nextData = {
          ...form,
          phone: onlyDigits(form.phone),
          postalCode: onlyDigits(form.postalCode).slice(0, 6),
          isDefault: isEditing ? Boolean(editingAddress?.isDefault) : makeDefault,
          createdAt: isEditing ? (editingAddress?.createdAt ?? Date.now()) : Date.now(),
        };
        if (isEditing) {
          tx.update(addressRef, nextData);
        } else {
          tx.set(addressRef, nextData);
        }
      });

      await loadAddresses();
      onSelectAddressId(addressRef.id);
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
    } finally {
      setSaving(false);
    }
  }

  async function makeDefaultAddress(addressId: string) {
    const currentDefault = addresses.find((a) => a.isDefault);
    if (currentDefault?.id === addressId) return;
    await runTransaction(dbClient, async (tx) => {
      if (currentDefault?.id) {
        tx.update(doc(dbClient, "users", userId, "addresses", currentDefault.id), { isDefault: false });
      }
      tx.update(doc(dbClient, "users", userId, "addresses", addressId), { isDefault: true });
    });
    await loadAddresses();
    onSelectAddressId(addressId);
  }

  async function deleteAddress(address: Address) {
    if (!address.id) return;
    const ok = confirm("Delete this address?");
    if (!ok) return;

    const remaining = addresses.filter((a) => a.id !== address.id);

    await runTransaction(dbClient, async (tx) => {
      tx.delete(doc(dbClient, "users", userId, "addresses", address.id!));
      if (address.isDefault && remaining.length > 0 && remaining[0]?.id) {
        tx.update(doc(dbClient, "users", userId, "addresses", remaining[0].id), { isDefault: true });
      }
    });

    await loadAddresses();
    if (selectedAddressId === address.id) {
      const next = remaining.find((a) => a.isDefault) ?? remaining[0] ?? null;
      onSelectAddressId(next?.id ?? null);
    }
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--panel-bg-soft)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Choose an address or add a new one.
          </p>
        </div>
        <button
          type="button"
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
          className="rounded-xl px-4 py-2 text-sm font-medium transition"
          style={{
            background: showForm ? "rgba(255,255,255,0.06)" : "rgba(var(--gold-rgb),0.18)",
            border: "1px solid var(--border-subtle)",
            color: showForm ? "var(--fg)" : "rgb(var(--gold-rgb))",
          }}
        >
          {showForm ? "Close" : "Add new"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          Loading addresses…
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => onSelectAddressId(addr.id!)}
              className={`text-left relative p-4 rounded-xl cursor-pointer border-2 transition-all ${
                selectedAddressId === addr.id
                  ? "border-[rgb(var(--gold-rgb))]"
                  : "border-transparent hover:border-[var(--border-subtle)]"
              }`}
              style={{ background: "var(--panel-bg)" }}
            >
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {!addr.isDefault && addresses.some((a) => a.isDefault) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeDefaultAddress(addr.id!);
                    }}
                    className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      background: "rgba(var(--gold-rgb),0.12)",
                      color: "rgb(var(--gold-rgb))",
                      border: "1px solid rgba(var(--gold-rgb),0.22)",
                    }}
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAddressId(addr.id!);
                    setShowForm(true);
                    setErrors({});
                    setPincodeStatus({ state: "idle" });
                    setServiceabilityStatus({ state: "idle" });
                    setForm({
                      id: addr.id,
                      fullName: addr.fullName || "",
                      phone: addr.phone || "",
                      line1: addr.line1 || "",
                      line2: addr.line2 || "",
                      city: addr.city || "",
                      state: addr.state || "",
                      postalCode: addr.postalCode || "",
                      country: addr.country || "India",
                      isDefault: addr.isDefault,
                      createdAt: addr.createdAt || Date.now(),
                    });
                  }}
                  className="p-1 rounded-md"
                  style={{ border: "1px solid var(--border-subtle)" }}
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAddress(addr);
                  }}
                  className="p-1 rounded-md"
                  style={{ border: "1px solid var(--border-subtle)", color: "#ef4444" }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="font-medium mb-1">{addr.fullName}</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ""}
                <br />
                {addr.city}, {addr.state} {addr.postalCode}
                <br />
                {addr.country}
              </div>
              <div className="mt-2 text-sm">{addr.phone}</div>
              {addr.isDefault && (
                <div
                  className="absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded-full"
                  style={{
                    background: "rgba(var(--gold-rgb),0.18)",
                    color: "rgb(var(--gold-rgb))",
                    border: "1px solid rgba(var(--gold-rgb),0.25)",
                  }}
                >
                  Default
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {showForm && (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ background: "var(--panel-bg)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">
                {editingAddressId ? "Edit address" : "Add new address"}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Pincode validates city/state and checks delivery availability.
              </div>
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm disabled:opacity-60"
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
                className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-color)] px-4 py-2 text-sm disabled:opacity-60"
              >
                <option value="" disabled>
                  {pincodeStatus.state === "valid" ? "Select state" : "Enter pincode first"}
                </option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && <div className="mt-1 text-xs text-red-300">{errors.state}</div>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingAddressId(null);
                setErrors({});
                setPincodeStatus({ state: "idle" });
                setServiceabilityStatus({ state: "idle" });
              }}
              className="rounded-xl px-4 py-2 text-sm"
              style={{ border: "1px solid var(--border-subtle)", color: "var(--fg)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNewAddress}
              disabled={
                saving ||
                pincodeStatus.state === "checking" ||
                serviceabilityStatus.state === "checking" ||
                serviceabilityStatus.state === "not_serviceable" ||
                serviceabilityStatus.state === "error"
              }
              className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-60"
              style={{
                background: "linear-gradient(to right, #fcd34d, #fbbf24)",
                color: "#000",
              }}
            >
              {saving ? "Saving…" : editingAddressId ? "Update address" : "Save address"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
