import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pearl Bloom — Artificial Earrings for Women",
    short_name: "Pearl Bloom",
    description: "Affordable anti-tarnish, skin-safe artificial earrings for women in India.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f3",
    theme_color: "#5b1a23",
    icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
