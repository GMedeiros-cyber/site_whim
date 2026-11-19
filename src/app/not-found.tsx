import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import manifest from "../../public/arara/manifest.json";
import { Container, Destaque, Seta, Titulo } from "@/components/blocos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { ACAO } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

export const metadata: Metadata = {
  title: "Página não encontrada | Whim Confecção e Estamparia",
};

// A arara com o cabide do meio vazio: a peça (a página) que não está aqui. Os quadros parados de
// frente, na cor própria de cada peça (manifest), como no passo Peça do celular.
const PECAS = [manifest.pecas[1], manifest.pecas[3]]; // polo azul-marinho e baby look turquesa (a camiseta branca some no fundo claro)
const quadroDeFrente = (p: (typeof PECAS)[number]) =>
  `${p.coresPasta}${(manifest.cores.find((c) => c.nome === p.cor) ?? manifest.cores[0]).pasta}/${String(p.coresQuadros).padStart(3, "0")}.webp`;

export default function NaoEncontrada() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex flex-1 items-center bg-muted outline-none">
        <Container className="grid items-center gap-12 pt-36 pb-24 sm:pt-44 sm:pb-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16 cel:text-center">
          <div>
            <Titulo as="h1" className="max-w-[16ch] cel:mx-auto">
              Esta página <Destaque>não existe.</Destaque>
            </Titulo>
            <p className="mt-[18px] max-w-[46ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px] cel:mx-auto">
              O endereço pode ter mudado ou ter um erro de digitação. Siga por um destes caminhos:
            </p>
            <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link href="/" className={cn(buttonVariants({ size: "xl" }), "w-full sm:w-auto")}>
                Voltar ao início <Seta />
              </Link>
              <Link href={ACAO.href} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}>
                {ACAO.label}
              </Link>
              <a
                href={linkWhatsApp("Olá, Whim! Cheguei numa página que não existe no site e queria um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}
              >
                Falar no WhatsApp
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </div>
          </div>

          {/* --w: largura de cada cabide; --cano: altura do cano (mesma proporção da arara). */}
          <div aria-hidden className="mx-auto hidden w-fit [--cano:calc(var(--w)*0.1067)] [--w:150px] md:block lg:[--w:170px]">
            <div
              className="h-(--cano) w-full bg-size-[100%_100%] mix-blend-multiply"
              style={{ backgroundImage: `url(${manifest.cano.arquivo})` }}
            />
            <div className="flex gap-3 px-3">
              {[PECAS[0], null, PECAS[1]].map((p, i) =>
                p ? (
                  <Image
                    key={p.id}
                    src={quadroDeFrente(p)}
                    alt=""
                    width={p.largura}
                    height={p.altura}
                    unoptimized
                    className="-mt-[calc(var(--cano)/2+var(--w)*0.0875)] aspect-[3/4] w-(--w) max-w-none"
                  />
                ) : (
                  <span key={i} className="w-(--w)" />
                )
              )}
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
