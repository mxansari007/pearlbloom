// src/app/product/[slug]/layout.tsx
//
// Intentionally a thin pass-through.
//
// This layout used to `await getProductBySlug` and wrap {children} in its own
// <Suspense> boundary — only to render a breadcrumb. That nested an
// out-of-order streamed boundary: the ENTIRE page rendered inside the layout's
// boundary, with RelatedProducts as a second boundary inside that. When the
// product data isn't ready before the shell flushes (e.g. a slow Firestore
// read), React streams those boundaries out of order and reconnects them on the
// client — and that reconnection proved fragile here, leaving the page stuck on
// its skeleton fallback and never hydrating (the buy-box stayed non-interactive).
// It also produced invalid HTML: the root layout already renders a <main>, so
// this layout's <main> was a nested one.
//
// The page now owns its container + breadcrumb and renders as a single,
// reliable tree. Keep this file (it defines the route segment) but do no work.
import type { ReactNode } from "react";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
