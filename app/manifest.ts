import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sweet Messages",
    short_name: "Messages",
    description: "Private morning and night message bank.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8fb",
    theme_color: "#be185d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
