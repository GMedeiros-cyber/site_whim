import type { Metadata } from "next";
import Link from "next/link";

import { Container, Destaque, Seta, Titulo } from "@/components/blocos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { ACAO } from "@/lib/navegacao";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Página não encontrada | Whim Confecção e Estamparia",
};

export default function NaoEncontrada() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center bg-muted">
        <Container className="pt-36 pb-24 sm:pt-44 sm:pb-32">
          <Titulo as="h1" className="max-w-[16ch]">
            Esta página <Destaque>não existe.</Destaque>
          </Titulo>
          <p className="mt-[18px] max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px]">
            Erro 404: o endereço pode ter mudado ou estar com algum erro de digitação. Siga por um destes caminhos:
          </p>
          <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link href="/" className={cn(buttonVariants({ size: "xl" }), "w-full sm:w-auto")}>
              Voltar ao início <Seta />
            </Link>
            <Link href={ACAO.href} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}>
              {ACAO.label}
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
