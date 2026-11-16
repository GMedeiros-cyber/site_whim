import { imagemOg } from "@/lib/og";

export const alt = "Whim Confecção e Estamparia: vista a sua marca, peça por peça";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return imagemOg("Vista a sua marca, peça por peça.", "Uniformes e camisetas com a sua marca. Silk, DTF e bordado numa oficina própria em Guarulhos/SP.");
}
