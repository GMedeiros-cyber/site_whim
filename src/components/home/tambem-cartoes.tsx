"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Os três cartões de baixo das técnicas. Um fica em azul-marinho: começa no último
 * ("Não sabe qual?"); passar o mouse mostra o azul no cartão de baixo do mouse e clicar
 * (ou tocar) leva o azul para ele.
 */
export function TambemCartoes({ itens, className }: { itens: { nome: string; texto: string }[]; className?: string }) {
  const [escolhido, setEscolhido] = useState(itens.length - 1);
  const [sobre, setSobre] = useState<number | null>(null);
  const ativo = sobre ?? escolhido;

  return (
    <div className={cn("mt-3 grid gap-3 md:mt-5 md:grid-cols-3 md:gap-5", className)} onPointerLeave={() => setSobre(null)}>
      {itens.map((item, i) => {
        const destaque = i === ativo;
        return (
          <button
            key={item.nome}
            type="button"
            aria-pressed={i === escolhido}
            onClick={() => setEscolhido(i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && setSobre(i)}
            className={cn(
              "cursor-pointer rounded-[22px] border px-5 py-[18px] text-left transition-colors duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none md:p-[26px]",
              destaque
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-primary/6 bg-background text-foreground"
            )}
          >
            <span className="block text-lg font-semibold md:mb-1.5 md:text-xl">{item.nome}</span>
            <span
              className={cn(
                "block text-[14.5px] leading-[1.55] transition-colors duration-300",
                destaque ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {item.texto}
            </span>
          </button>
        );
      })}
    </div>
  );
}
