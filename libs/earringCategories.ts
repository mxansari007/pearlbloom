/* ------------------------------------------------------------------
   Earring category taxonomy — powers the Catalog mega-menu and the
   35 dedicated category landing pages (13 style + 13 finish + 9 occasion).
   Plain data module (no server imports) so client + server can both use it.
------------------------------------------------------------------- */

export type CatType = "style" | "finish" | "occasion";

export interface EarringCategory {
  type: CatType;
  slug: string;
  name: string; // short, e.g. "Stud"
  label: string; // nav label, e.g. "Stud Earrings"
  h1: string; // page heading, e.g. "The Stud Silhouette Room"
  description: string;
}

export const TYPE_META: Record<CatType, { breadcrumb: string; kicker: string }> = {
  style: { breadcrumb: "Style Collection", kicker: "13 Registered Forms • Profile Page" },
  finish: { breadcrumb: "Finish Collection", kicker: "13 Registered Finishes • Profile Page" },
  occasion: { breadcrumb: "Occasion Collection", kicker: "9 Dress Occasions • Profile Page" },
};

export const STYLE_CATEGORIES: EarringCategory[] = [
  { type: "style", slug: "stud", name: "Stud", label: "Stud Earrings", h1: "The Stud Silhouette Room", description: "Ultra-lightweight everyday elegance sitting flush to the lobe. Designed with featherlight distributions specifically balanced to protect sensitive ear lobes during longer wearing sessions." },
  { type: "style", slug: "hoop", name: "Hoop", label: "Hoop Earrings", h1: "The Endless Hoop Room", description: "Circles that never break their stride — from whisper-thin everyday rings to bold statement loops. Smooth hinged closures keep them secure from the morning commute to midnight." },
  { type: "style", slug: "drop", name: "Drop", label: "Drop Earrings", h1: "The Graceful Drop Room", description: "A single elegant fall of gold and stone that catches the light with every turn of the head. Weighted to swing gently without ever dragging on the lobe." },
  { type: "style", slug: "dangle", name: "Dangle", label: "Dangle Earrings", h1: "The Dangle Movement Room", description: "Layered elements that move and shimmer as you do, drawing the eye downward in a slow, deliberate cascade. Engineered to stay light despite their length." },
  { type: "style", slug: "statement", name: "Statement", label: "Statement Earrings", h1: "The Statement Maker Room", description: "Bold, architectural and impossible to ignore — the pieces you reach for when the outfit needs a final word. Crafted big on presence, gentle on weight." },
  { type: "style", slug: "jhumka", name: "Jhumka", label: "Jhumka Earrings", h1: "The Classic Jhumka Room", description: "The timeless bell-domed silhouette rooted in Indian tradition, finished with delicate fringe that chimes softly with movement. Heritage shape in a modern anti-tarnish build." },
  { type: "style", slug: "chandbali", name: "Chandbali", label: "Chandbali Earrings", h1: "The Regal Chandbali Room", description: "Crescent-moon grandeur layered in intricate detail for festive and bridal moments. Old-world opulence rendered in lightweight, skin-safe metal." },
  { type: "style", slug: "ear-cuffs", name: "Ear Cuffs", label: "Ear Cuffs Earrings", h1: "The Modern Ear Cuff Room", description: "No-piercing-needed sculptural metal that hugs the ear's edge for an effortless, editorial look. Adjustable curves designed to sit comfortably for hours." },
  { type: "style", slug: "mismatch", name: "Mismatch", label: "Mismatch Earrings", h1: "The Mismatch Pairing Room", description: "Two deliberately different earrings made to be worn together — asymmetry curated, never accidental. For the ear party that breaks the rules beautifully." },
  { type: "style", slug: "clip-on", name: "Clip-on", label: "Clip-on Earrings", h1: "The Comfort Clip-On Room", description: "All the drama, none of the piercing — cushioned clip mechanisms that grip gently and stay put. Designed for sensitive and un-pierced ears alike." },
  { type: "style", slug: "long", name: "Long", label: "Long Earrings", h1: "The Long Line Room", description: "Elongating, neck-lengthening drops that fall well past the lobe for instant elegance. Balanced weight keeps even the longest silhouettes feather-comfortable." },
  { type: "style", slug: "huggies", name: "Huggies", label: "Huggies Earrings", h1: "The Snug Huggies Room", description: "Petite hoops that hug the lobe close for a modern, stackable everyday staple. Smooth click closures sized to sit flush and secure." },
  { type: "style", slug: "bali", name: "Bali", label: "Bali Earrings", h1: "The Traditional Bali Room", description: "The textured, ridged hoop beloved across generations — earthy, ornamental and endlessly wearable. Reimagined in anti-tarnish gold for daily devotion." },
];

export const FINISH_CATEGORIES: EarringCategory[] = [
  { type: "finish", slug: "gold-plated", name: "Gold Plated", label: "Gold Plated Earrings", h1: "The Gold Plated Room", description: "Rich micro-layered gold plating over a durable core for that solid-gold glow at a fraction of the price. Sealed to resist fading through everyday wear." },
  { type: "finish", slug: "gold-tone", name: "Gold Tone", label: "Gold Tone Earrings", h1: "The Gold Tone Room", description: "Warm, luminous gold colouring that flatters every skin tone without the precious-metal price tag. Consistent shine designed to last." },
  { type: "finish", slug: "anti-tarnish", name: "Anti Tarnish", label: "Anti Tarnish Earrings", h1: "The Anti-Tarnish Room", description: "Proprietary shielding that blocks oxidation so your gold stays gold — shower after shower, season after season. Engineered for set-and-forget shine." },
  { type: "finish", slug: "waterproof", name: "Waterproof", label: "Waterproof Earrings", h1: "The Waterproof Room", description: "Sweat-, shower- and swim-safe coatings built for the gym, the beach and the monsoon. Wear them everywhere and never think twice." },
  { type: "finish", slug: "oxidised", name: "Oxidised", label: "Oxidised Earrings", h1: "The Oxidised Silver Room", description: "Deliberately darkened, antique-finish metal with heritage shadow and depth. The moody, artisanal counterpart to high-shine gold." },
  { type: "finish", slug: "silver-tone", name: "Silver Tone", label: "Silver Tone Earrings", h1: "The Silver Tone Room", description: "Bright, cool-spectrum brilliance for a clean, contemporary edge. A modern neutral that pairs with everything in your wardrobe." },
  { type: "finish", slug: "enamel", name: "Enamel", label: "Enamel Earrings", h1: "The Enamel Colour Room", description: "Hand-filled glossy colour fused to metal for playful pops that resist chipping. Vivid, smooth and surprisingly durable." },
  { type: "finish", slug: "pearl", name: "Pearl", label: "Pearl Earrings", h1: "The Pearl Finish Room", description: "Individually selected freshwater and shell pearls with soft, natural lustre. Timeless femininity for bridal days and quiet evenings alike." },
  { type: "finish", slug: "crystal", name: "Crystal", label: "Crystal Earrings", h1: "The Crystal Sparkle Room", description: "Faceted crystals cut to throw maximum fire under any light. The fastest way to add sparkle without the carat count." },
  { type: "finish", slug: "cz", name: "CZ", label: "CZ Earrings", h1: "The CZ Brilliance Room", description: "Cubic-zirconia stones with diamond-bright clarity and a dazzling return of light. Luxe shine, honestly accessible." },
  { type: "finish", slug: "american-diamond", name: "American Diamond", label: "American Diamond Earrings", h1: "The American Diamond Room", description: "Premium AD stones set with jeweller precision for red-carpet glitter every day. Maximum brilliance, beautifully affordable." },
  { type: "finish", slug: "stone", name: "Stone", label: "Stone Earrings", h1: "The Coloured Stone Room", description: "Jewel-toned stones — ruby reds, emerald greens, sapphire blues — for a pop of colour that elevates any look. Hand-set for secure, lasting wear." },
  { type: "finish", slug: "kundan", name: "Kundan", label: "Kundan Earrings", h1: "The Heritage Kundan Room", description: "The ancient art of glass-set gold, layered for rich, regal Indian craftsmanship. Festive grandeur in a hypoallergenic, lightweight build." },
];

export const OCCASION_CATEGORIES: EarringCategory[] = [
  { type: "occasion", slug: "daily-wear", name: "Daily Wear", label: "Daily Wear Earrings", h1: "The Daily Wear Room", description: "Ultralight comfort studs and loops designed for continuous, all-day wear. So easy and weightless you'll forget you have them on." },
  { type: "occasion", slug: "office-wear", name: "Office Wear", label: "Office Wear Earrings", h1: "The Office Wear Room", description: "Refined, minimalist classics that anchor your formal weekday wardrobe. Polished enough for the boardroom, gentle enough for back-to-back meetings." },
  { type: "occasion", slug: "party-wear", name: "Party Wear", label: "Party Wear Earrings", h1: "The Party Wear Room", description: "Vibrant, light-catching statements built for dazzling evening coordination. Designed to turn heads from arrival to the last dance." },
  { type: "occasion", slug: "festive-wear", name: "Festive Wear", label: "Festive Wear Earrings", h1: "The Festive Wear Room", description: "Traditional bell-shaped motifs and crescent alignments for celebration and ceremony. Heritage sparkle for every festival on the calendar." },
  { type: "occasion", slug: "wedding-wear", name: "Wedding Wear", label: "Wedding Wear Earrings", h1: "The Wedding Wear Room", description: "Show-stopping grandeur crafted for the biggest days and brightest lehengas. Opulent looks rendered in feather-light, all-day-comfortable metal." },
  { type: "occasion", slug: "bridal", name: "Bridal", label: "Bridal Earrings", h1: "The Bridal Room", description: "Heirloom-worthy statement pieces for the bride and her closest circle. Old-world romance designed to photograph beautifully and wear comfortably." },
  { type: "occasion", slug: "college-wear", name: "College Wear", label: "College Wear Earrings", h1: "The College Wear Room", description: "Trend-forward, budget-friendly picks that move from lectures to evening plans. Lightweight, durable and endlessly photogenic." },
  { type: "occasion", slug: "gift", name: "Gift", label: "Gift Earrings", h1: "The Gift Room", description: "Pre-boxed, thoughtfully curated selections to show you care without breaking the bank. Ready to gift, impossible to get wrong." },
  { type: "occasion", slug: "set", name: "Earrings Set", label: "Earrings Set", h1: "The Earring Sets Room", description: "Curated multi-piece and stacking packs to build the perfect multi-pierced ear. Coordinated by our stylists so you don't have to." },
];

export const ALL_CATEGORIES: EarringCategory[] = [
  ...STYLE_CATEGORIES,
  ...FINISH_CATEGORIES,
  ...OCCASION_CATEGORIES,
];

export const ALL_EARRINGS = {
  breadcrumb: "Master Directory",
  kicker: "35 Dedicated Catalogs • Master Directory",
  h1: "The Complete Earrings Directory",
  description:
    "Every silhouette, finish and occasion in one place — the full Pearl Bloom catalog of gold-plated, anti-tarnish, hypoallergenic earrings. Browse, filter and find your next everyday favourite.",
};

export function getCategory(type: string, slug: string): EarringCategory | null {
  return (
    ALL_CATEGORIES.find((c) => c.type === type && c.slug === slug) ?? null
  );
}

export function categoryHref(c: { type: CatType; slug: string }): string {
  return `/earrings/${c.type}/${c.slug}`;
}

export function allCategoryParams(): { type: string; slug: string }[] {
  return ALL_CATEGORIES.map((c) => ({ type: c.type, slug: c.slug }));
}
