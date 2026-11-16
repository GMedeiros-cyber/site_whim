import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { BotaoWhatsApp } from "@/components/botao-whatsapp";
import { Medicao } from "@/components/medicao";
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
};

export const viewport: Viewport = {
  themeColor: "#373857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} h-full antialiased motion-safe:scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <BotaoWhatsApp />
        <JsonLd dados={NEGOCIO} />
        <Medicao />
      </body>
    </html>
  );
}
