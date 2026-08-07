import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Água Rural",
    short_name: "Água Rural",
    description: "Controle e gestão da água no campo.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8f9",
    theme_color: "#063550",
    orientation: "portrait",
    icons: [
      {
        src: "/app-icon.png",
        sizes: "1536x1536",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
