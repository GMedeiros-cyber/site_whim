import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { BotaoWhatsApp } from "@/components/botao-whatsapp";
import { Medicao } from "@/components/medicao";
import { TransicaoPinta } from "@/components/transicao-pinta";
import { JsonLd, NEGOCIO } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

// Sem o 300: nenhuma página usa, e cada peso é um arquivo a mais antes da 1ª pintura.
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Whim Confecção e Estamparia",
  description: "Silk, DTF, bordado e confecção para empresas, escolas e confecções em Guarulhos/SP.",
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  // O Safari do iPhone transforma telefone, CEP, CNPJ e endereço em links mexendo no HTML antes do
  // React hidratar: o React não reconhece o DOM (erro #418), recria a página (a abertura recomeça) e
  // depois pode falhar ao mexer nesses nós ("not a child of this node"). Os contatos já são links.
  formatDetection: { telephone: false, address: false, email: false, date: false },
};

export const viewport: Viewport = {
  themeColor: "#373857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script da abertura marca <html data-intro> e trava a rolagem
    // antes da hidratação (src/lib/abertura.ts).
    <html
      lang="pt-BR"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${poppins.variable} h-full antialiased motion-safe:scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        {/* Primeira parada do Tab: pula a barra (aparece só com o foco). Cada página tem <main id="conteudo">. */}
        <a
          href="#conteudo"
          // O not-sr-only zera o padding: o padding vem junto, no foco (pílula de 44 px de altura).
          className="sr-only rounded-full bg-primary text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:px-5 focus:py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Pular para o conteúdo
        </a>
        {children}
        <BotaoWhatsApp />
        <TransicaoPinta />
        <JsonLd dados={NEGOCIO} />
        <Medicao />
      </body>
    </html>
  );
}
