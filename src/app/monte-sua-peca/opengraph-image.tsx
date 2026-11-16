import { imagemOg } from "@/lib/og";

export const alt = "Monte sua peça na Whim Confecção e Estamparia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return imagemOg("Monte sua peça.", "Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim.");
}
