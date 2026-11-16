import type { MetadataRoute } from "next";

import { EMPRESA } from "@/lib/whim";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: EMPRESA.marca,
    short_name: "Whim",
    description: "Silk, DTF, bordado e confecção para empresas, escolas e confecções em Guarulhos/SP.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#373857",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
