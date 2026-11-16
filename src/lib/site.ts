// Configuração pública do site, vinda de variáveis de ambiente (ver .env.example).
import type { Metadata } from "next";

import { EMPRESA } from "@/lib/whim";

/** URL pública, sem barra no fim. Em produção, definir NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

// Os IDs vão parar dentro de <script>: só letras, números, _ e -.
const id = (valor?: string) => (valor && /^[\w-]+$/.test(valor) ? valor : undefined);

/** Contas de medição e anúncios. Sem ID, a ferramenta não carrega. */
export const MEDICAO = {
  gtm: id(process.env.NEXT_PUBLIC_GTM_ID),
  ga4: id(process.env.NEXT_PUBLIC_GA4_ID),
  gads: id(process.env.NEXT_PUBLIC_GADS_ID),
  meta: id(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  clarity: id(process.env.NEXT_PUBLIC_CLARITY_ID),
};
export const TEM_MEDICAO = Object.values(MEDICAO).some(Boolean);

/** title, description, canonical, Open Graph e Twitter de uma página (a imagem vem do opengraph-image). */
export function metadados(titulo: string, descricao: string, caminho: string): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      title: titulo,
      description: descricao,
      url: caminho,
      siteName: EMPRESA.marca,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  };
}
