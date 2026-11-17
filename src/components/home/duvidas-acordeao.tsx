"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { DUVIDAS } from "@/components/home/duvidas";
import { cn } from "@/lib/utils";

/**
 * Acordeão das Dúvidas frequentes: uma pergunta aberta por vez (a primeira começa aberta),
 * seta que gira e abertura suave (linhas da grade de 0fr a 1fr). Cada pergunta é um
 * <button aria-expanded> dentro de um h3; a resposta fechada fica inerte (fora do leitor).
 */
export function DuvidasAcordeao() {
  const [aberta, setAberta] = useState<number | null>(0);
  const id = useId();

  return (
    <div className="border-t">
      {DUVIDAS.map((d, i) => {
        const ativa = aberta === i;
        return (
          <div key={d.pergunta} className="border-b">
            <h3>
              <button
                type="button"
                id={`${id}-p${i}`}
                aria-expanded={ativa}
                aria-controls={`${id}-r${i}`}
                onClick={() => setAberta(ativa ? null : i)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-5 rounded-sm py-5 text-left text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-lg"
              >
                {d.pergunta}
                <ChevronDownIcon
                  aria-hidden
                  className={cn(
                    "size-5 shrink-0 text-primary/70 transition-transform duration-500 ease-out motion-reduce:transition-none",
                    ativa && "rotate-180 text-primary"
                  )}
                />
              </button>
            </h3>
            <div
              id={`${id}-r${i}`}
              role="region"
              aria-labelledby={`${id}-p${i}`}
              inert={!ativa}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none",
                ativa ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "max-w-[60ch] pb-[22px] text-[15.5px] leading-[1.65] text-pretty text-muted-foreground transition-transform duration-500 ease-out motion-reduce:transition-none",
                    !ativa && "-translate-y-2"
                  )}
                >
                  {d.resposta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
