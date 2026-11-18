"use client";

import { useState } from "react";
import { ArrowUpRightIcon, QuoteIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Depoimento = { texto: string; nome: string; empresa: string };

/**
 * Celular: o depoimento num cartão azul-marinho, antes do formulário (proposta de 18/11). Sem
 * barra de arrastar nem cartões vazios; com mais de um, trocam no mesmo cartão pelos pontinhos.
 */
export function DepoimentoCelular({
  depoimentos,
  emBreve,
  mapa,
  className,
}: {
  depoimentos: Depoimento[];
  emBreve: boolean;
  mapa: string;
  className?: string;
}) {
  const [atual, setAtual] = useState(0);
  const d = depoimentos[atual];
  if (!d) return null;

  return (
    <section aria-labelledby="depoimento-titulo" className={cn("rounded-[22px] bg-primary p-5 text-primary-foreground", className)}>
      <h3 id="depoimento-titulo" className="sr-only">
        O que dizem de nós
      </h3>
      <figure aria-live="polite">
        <QuoteIcon aria-hidden className="size-5 fill-accent text-accent" />
        <blockquote className="mt-3 text-[15px] leading-relaxed">
          <p>{d.texto}</p>
        </blockquote>
        <figcaption className="mt-5 flex items-center gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
            {d.nome.charAt(0)}
          </span>
          <span className="grid min-w-0">
            <span className="text-sm font-semibold">{d.nome}</span>
            <span className="text-xs text-primary-foreground/75">{d.empresa}</span>
          </span>
        </figcaption>
      </figure>

      {depoimentos.length > 1 && (
        <div role="group" aria-label="Escolher depoimento" className="-mb-2 mt-3 flex justify-center">
          {depoimentos.map((x, i) => (
            <button
              key={x.nome + x.empresa}
              type="button"
              aria-label={`Depoimento ${i + 1} de ${depoimentos.length}`}
              aria-current={i === atual || undefined}
              onClick={() => setAtual(i)}
              className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-accent/60"
            >
              <span aria-hidden className={cn("size-2 rounded-full", i === atual ? "bg-accent" : "bg-primary-foreground/35")} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-primary-foreground/15 pt-1 text-xs">
        {emBreve && <span className="min-w-0 text-primary-foreground/75">Mais depoimentos em breve</span>}
        <a
          href={mapa}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent/60"
        >
          Ver no Google Maps <ArrowUpRightIcon aria-hidden className="size-3.5" />
        </a>
      </div>
    </section>
  );
}
