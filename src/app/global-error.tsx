"use client";

import { Poppins } from "next/font/google";
import "./globals.css";

import { TelaErro } from "@/components/tela-erro";

// Substitui o layout raiz quando o erro é nele: precisa de <html>, <body>, fonte e CSS próprios.
const poppins = Poppins({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "600", "700"] });

export default function ErroGeral({ error }: { error: unknown }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <title>Esta página não carregou | Whim Confecção e Estamparia</title>
        <TelaErro error={error} />
      </body>
    </html>
  );
}
