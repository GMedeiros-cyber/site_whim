import type { Metadata } from "next";

import { ContatoAvaliacoes } from "@/components/contato-avaliacoes";
import { Personalizador } from "@/components/personalizador";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Monte sua peça | Whim Confecção e Estamparia",
  description:
    "Escolha a peça, a cor e a estampa e receba o orçamento da Whim no WhatsApp.",
};

export default function MonteSuaPeca() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Personalizador />
        <ContatoAvaliacoes />
      </main>
      <SiteFooter />
    </>
  );
}
