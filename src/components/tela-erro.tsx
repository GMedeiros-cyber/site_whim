"use client";

import { useEffect } from "react";
import Image from "next/image";

import { Container, Destaque, Titulo } from "@/components/blocos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Erros que somem ao recarregar: arquivo de um deploy anterior que já não existe
// (ChunkLoadError) ou DOM mexido fora do React ("not a child of this node").
const RECUPERAVEL = /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|not a child of this node/i;
const CHAVE = "whim-recarregou-em";

/** Recarrega sozinho uma vez por minuto, no máximo, para não entrar em laço. */
function recarregarSePuder(error: unknown) {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (!RECUPERAVEL.test(texto)) return;
  try {
    if (Date.now() - Number(sessionStorage.getItem(CHAVE) ?? 0) < 60_000) return;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    return;
  }
  location.reload();
}

/** Tela de erro com a cara do site (error.tsx e global-error.tsx). */
export function TelaErro({ error }: { error: unknown }) {
  useEffect(() => {
    console.error(error);
    recarregarSePuder(error);
  }, [error]);

  return (
    <main id="conteudo" tabIndex={-1} className="outline-none flex flex-1 items-center bg-muted">
      <Container className="py-24 sm:py-32">
        {/* <a> e não <Link> (aqui e no botão): depois de um erro, a navegação completa é a mais segura. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" aria-label="Whim Confecção e Estamparia, página inicial" className="inline-block rounded-sm">
          <Image src="/brand/whim-logo-horizontal.webp" alt="" width={1386} height={486} className="h-12 w-auto" />
        </a>
        <Titulo as="h1" className="mt-10 max-w-[16ch]">
          Esta página <Destaque>não carregou.</Destaque>
        </Titulo>
        <p className="mt-[18px] max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px]">
          Pode ter sido uma atualização do site ou a conexão. Recarregue para tentar de novo.
        </p>
        <div className="mt-8 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <button type="button" onClick={() => location.reload()} className={cn(buttonVariants({ size: "xl" }), "w-full sm:w-auto")}>
            Recarregar a página
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full sm:w-auto")}>
            Voltar ao início
          </a>
        </div>
      </Container>
    </main>
  );
}
