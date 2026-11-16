import { imagemOg } from "@/lib/og";

export const alt = "Política de privacidade da Whim Confecção e Estamparia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return imagemOg("Política de privacidade.", "Como a Whim trata os dados de quem pede orçamento, de acordo com a LGPD.");
}
