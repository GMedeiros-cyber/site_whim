import type { Metadata } from "next";

import { ContatoAvaliacoes } from "@/components/contato-avaliacoes";
import { Personalizador } from "@/components/personalizador";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd, migalhas } from "@/lib/schema";
import { metadados } from "@/lib/site";

export const metadata: Metadata = metadados(
  "Monte sua peça | Whim Confecção e Estamparia",
  "Escolha a peça, a cor e a estampa e receba o orçamento da Whim no WhatsApp.",
  "/monte-sua-peca"
);

export default function MonteSuaPeca() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="outline-none flex-1">
        <Personalizador />
        <ContatoAvaliacoes />
      </main>
      <SiteFooter />
      <JsonLd dados={migalhas("Monte sua peça", "/monte-sua-peca")} />
    </>
  );
}
