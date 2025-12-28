import { Suspense } from "react";
import AddressesClient from "./AddressClient";

export default function AddressesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ color: "var(--muted)" }}
        >
          Loading addresses…
        </div>
      }
    >
      <AddressesClient />
    </Suspense>
  );
}
