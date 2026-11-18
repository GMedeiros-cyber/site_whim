"use client";

import { useId, useRef, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { TecnicaFotos, type Foto } from "@/components/home/tecnica-fotos";
import { cn } from "@/lib/utils";

type Tecnica = { nome: string; fotos: Foto[]; texto: string; bomPara: string };

/**
 * Técnicas no celular (referencia/celular-18-11): abas Silk | DTF | Bordado e um cartão só,
 * o da aba, com as fotos que já trocam sozinhas. Setas, Home e End trocam de aba.
 * No PC continuam os três cartões (page.tsx).
 */
export function TecnicasAbas({ tecnicas, className }: { tecnicas: Tecnica[]; className?: string }) {
  const [atual, setAtual] = useState(0);
  const id = useId();
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const t = tecnicas[atual];
  const ir = (i: number) => {
    const n = (i + tecnicas.length) % tecnicas.length;
    setAtual(n);
    abas.current[n]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Técnicas de estampa"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") ir(atual + 1);
          else if (e.key === "ArrowLeft") ir(atual - 1);
          else if (e.key === "Home") ir(0);
          else if (e.key === "End") ir(tecnicas.length - 1);
          else return;
          e.preventDefault();
        }}
        className="flex gap-1 rounded-full border border-primary/8 bg-background p-1"
      >
        {tecnicas.map((x, i) => (
          <button
            key={x.nome}
            ref={(el) => {
              abas.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-aba${i}`}
            aria-selected={i === atual}
            aria-controls={`${id}-painel`}
            tabIndex={i === atual ? 0 : -1}
            onClick={() => setAtual(i)}
            className={cn(
              "min-h-11 flex-1 cursor-pointer rounded-full text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
              i === atual && "bg-accent/16 font-semibold text-foreground"
            )}
          >
            {x.nome}
          </button>
        ))}
      </div>
      <article
        id={`${id}-painel`}
        role="tabpanel"
        aria-labelledby={`${id}-aba${atual}`}
        className="mt-3 overflow-hidden rounded-[24px] border border-primary/6 bg-background"
      >
        <TecnicaFotos key={t.nome} nome={t.nome} fotos={t.fotos} className="aspect-[7/5]" />
        <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-5">
          <h3 className="text-xl font-semibold tracking-[-0.02em]">{t.nome}</h3>
          <p className="text-sm leading-normal text-muted-foreground">{t.texto}</p>
          <p className="text-[13px] leading-normal">
            <strong className="font-semibold">Bom para:</strong> {t.bomPara}
          </p>
        </div>
      </article>
    </div>
  );
}

/**
 * Confecção, Uniformes e "Não sabe qual?" no celular: linhas curtas com seta. As duas
 * primeiras abrem o texto (uma por vez); a azul-marinho leva ao WhatsApp.
 */
export function TambemLinhas({
  itens,
  whatsapp,
  className,
}: {
  itens: { nome: string; resumo: string; texto: string }[];
  whatsapp: string;
  className?: string;
}) {
  const [aberta, setAberta] = useState<number | null>(null);
  const id = useId();
  const linha =
    "flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] px-[18px] py-2.5 text-left text-[15px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {itens.map((item, i) => {
        const nome = (
          <span className="flex flex-col">
            {item.nome}
            <span className="text-xs font-normal opacity-75">{item.resumo}</span>
          </span>
        );
        if (i === itens.length - 1) {
          return (
            <a key={item.nome} href={whatsapp} className={cn(linha, "bg-primary text-primary-foreground")}>
              {nome}
              <ChevronRightIcon aria-hidden className="size-[18px] shrink-0" />
            </a>
          );
        }
        const ativa = aberta === i;
        return (
          <div key={item.nome} className="rounded-[18px] border border-primary/6 bg-background">
            <button
              type="button"
              aria-expanded={ativa}
              aria-controls={`${id}-${i}`}
              onClick={() => setAberta(ativa ? null : i)}
              className={cn(linha, "cursor-pointer")}
            >
              {nome}
              <ChevronRightIcon
                aria-hidden
                className={cn("size-[18px] shrink-0 transition-transform duration-300 motion-reduce:transition-none", ativa && "rotate-90")}
              />
            </button>
            <div
              id={`${id}-${i}`}
              inert={!ativa}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                ativa ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <p className="overflow-hidden px-[18px] text-sm leading-normal text-muted-foreground">
                <span className="block pb-4">{item.texto}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
