// components/product/featureIcons.tsx
//
// Shared icon registry for the admin-configurable PDP "highlights":
//   • feature badges (the 2×2 grid in the buy-box)
//   • assurance cards (the pair under the gallery)
//
// The KEYS below MUST stay in sync with the icon dropdown in the admin repo
// (pearlbloom-admin/src/pages/ProductEditPage.tsx → ICON_OPTIONS). The admin
// shows a friendly label + emoji preview; the storefront renders the matching
// lucide line icon here.
import type { ReactNode } from "react";
import {
  ShieldHalf,
  ShieldCheck,
  Droplets,
  Sparkles,
  Feather,
  Gem,
  Leaf,
  Heart,
  Award,
  Star,
  Crown,
  Truck,
  PackageCheck,
  Clock,
  Sun,
  Recycle,
  type LucideProps,
} from "lucide-react";
import type { FeatureBadge, AssuranceCard } from "@/types/products";

type IconComponent = (props: LucideProps) => ReactNode;

export const FEATURE_ICONS: Record<string, IconComponent> = {
  "shield-half": ShieldHalf,
  "shield-check": ShieldCheck,
  droplet: Droplets,
  sparkles: Sparkles,
  feather: Feather,
  gem: Gem,
  leaf: Leaf,
  heart: Heart,
  award: Award,
  star: Star,
  crown: Crown,
  truck: Truck,
  "package-check": PackageCheck,
  clock: Clock,
  sun: Sun,
  recycle: Recycle,
};

/** Resolve an admin-set icon key to a rendered lucide icon. Unknown/empty keys
 *  fall back to a neutral sparkle so a card never renders without an icon. */
export function resolveFeatureIcon(
  key: string | undefined,
  size = 18
): ReactNode {
  const Icon = (key && FEATURE_ICONS[key]) || Sparkles;
  return <Icon size={size} />;
}

/** Honest default badges — shown when a product has no admin-set badges yet.
 *  Mirrors the original hardcoded PDP design so existing products are unchanged. */
export const DEFAULT_FEATURE_BADGES: FeatureBadge[] = [
  { icon: "shield-half", title: "Anti-Tarnish", subtitle: "Protective sealed finish", highlight: false },
  { icon: "droplet", title: "Water-Resistant", subtitle: "Sweat & splash friendly", highlight: false },
  { icon: "sparkles", title: "Hypoallergenic", subtitle: "Lead & nickel free", highlight: true },
  { icon: "feather", title: "Lightweight", subtitle: "Comfortable all-day wear", highlight: false },
];

/** Honest default assurance cards — shown when a product has none set. */
export const DEFAULT_ASSURANCE_CARDS: AssuranceCard[] = [
  { icon: "sparkles", eyebrow: "Crafted Finish", title: "18K Gold-Tone Plating" },
  { icon: "shield-check", eyebrow: "Everyday Durable", title: "Anti-Tarnish Coating" },
];
