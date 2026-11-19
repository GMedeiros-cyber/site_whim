"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

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
        <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-5 text-center">
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
 * Confecção, Uniformes e "Não sabe qual?" no celular, lado a lado numa linha (pedido de 18/11 à
 * noite). As duas primeiras abrem o texto embaixo da linha, na largura toda (uma por vez); a
 * azul-marinho leva ao WhatsApp. Enquanto a linha passa pelo pé da tela, o botão flutuante do
 * WhatsApp some (html[data-sem-flutuante], botao-whatsapp.tsx) para não cobrir a 3ª caixa.
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
  // O texto da última aberta fica enquanto o painel fecha (senão some antes da animação).
  const [mostrada, setMostrada] = useState(0);
  const id = useId();
  const linhaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const linha = linhaRef.current;
    if (!linha) return;
    const html = document.documentElement;
    let raf = 0;
    const ler = () => {
      raf = 0;
      const r = linha.getBoundingClientRect();
      // O botão ocupa os 88 px de baixo da tela (16 de margem + 56 + folga).
      html.toggleAttribute("data-sem-flutuante", r.height > 0 && r.bottom > innerHeight - 88 && r.top < innerHeight);
    };
    const aoMudar = () => {
      raf ||= requestAnimationFrame(ler);
    };
    ler();
    addEventListener("scroll", aoMudar, { passive: true });
    addEventListener("resize", aoMudar);
    return () => {
      removeEventListener("scroll", aoMudar);
      removeEventListener("resize", aoMudar);
      cancelAnimationFrame(raf);
      html.removeAttribute("data-sem-flutuante");
    };
  }, []);

  const caixa =
    "flex min-h-[104px] w-full flex-col items-center justify-between gap-1.5 rounded-[18px] px-1.5 pt-3 pb-2 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
  const ultimo = itens.length - 1;

  return (
    <div className={className}>
      <div ref={linhaRef} className="grid grid-cols-3 gap-2">
        {itens.map((item, i) => {
          const nome = (
            <span className="flex flex-col gap-0.5">
              <span className="text-sm leading-tight font-semibold">{item.nome}</span>
              <span className="text-[11.5px] leading-snug opacity-75">{item.resumo}</span>
            </span>
          );
          if (i === ultimo) {
            return (
              <a key={item.nome} href={whatsapp} className={cn(caixa, "bg-primary text-primary-foreground")}>
                {nome}
                <ChevronRightIcon aria-hidden className="size-[18px] shrink-0" />
              </a>
            );
          }
          const ativa = aberta === i;
          return (
            <button
              key={item.nome}
              type="button"
              aria-expanded={ativa}
              aria-controls={`${id}-texto`}
              onClick={() => {
                setAberta(ativa ? null : i);
                setMostrada(i);
              }}
              className={cn(
                caixa,
                "cursor-pointer border bg-background transition-colors motion-reduce:transition-none",
                ativa ? "border-accent/60 bg-accent/16" : "border-primary/6"
              )}
            >
              {nome}
              <ChevronDownIcon
                aria-hidden
                className={cn("size-[18px] shrink-0 transition-transform duration-300 motion-reduce:transition-none", ativa && "rotate-180")}
              />
            </button>
          );
        })}
      </div>
      <div
        id={`${id}-texto`}
        role="region"
        aria-label={itens[mostrada].nome}
        inert={aberta === null}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          aberta === null ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        )}
      >
        <p className="overflow-hidden text-center text-sm leading-normal text-muted-foreground">
          <span className="block px-2 pt-4">{itens[mostrada].texto}</span>
        </p>
      </div>
    </div>
  );
}
