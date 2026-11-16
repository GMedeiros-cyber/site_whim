"use client";

import { Children, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * No celular, faixa com scroll-snap que sangra até a borda da tela, com
 * bolinhas de posição. Do tablet para cima vira o layout passado em className
 * (grade); as bolinhas somem.
 */
export function Carrossel({
  rotulo,
  className,
  children,
}: {
  rotulo: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [ativo, setAtivo] = useState(0);
  const total = Children.count(children);

  return (
    <>
      <div
        role="group"
        aria-label={rotulo}
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollWidth - el.clientWidth;
          setAtivo(max > 0 ? Math.round((el.scrollLeft / max) * (total - 1)) : 0);
        }}
        className={cn(
          "-mx-5 flex snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0",
          className
        )}
      >
        {children}
      </div>
      <div aria-hidden className="mt-3.5 flex gap-1.5 md:hidden">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-primary/20 transition-all duration-300",
              i === ativo && "w-[18px] bg-accent"
            )}
          />
        ))}
      </div>
    </>
  );
}
