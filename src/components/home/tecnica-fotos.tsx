"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type Foto = { src: string; alt: string };

const INTERVALO = 4500;

/**
 * Fotos de uma técnica, uma por vez, trocando por esmaecimento (sem arrastar, para não
 * brigar com o carrossel dos cartões no celular). Troca sozinha enquanto o cartão está na
 * tela e o mouse não está em cima; com movimento reduzido, só troca pelos pontos ou ao
 * tocar na foto. A primeira foto vem no HTML; as outras carregam quando o cartão aparece.
 */
export function TecnicaFotos({
  nome,
  fotos,
  className,
  pausado = false,
}: {
  nome: string;
  fotos: Foto[];
  className?: string;
  /** Cartão escondido (abas do celular): não troca de foto sozinho. */
  pausado?: boolean;
}) {
  const [atual, setAtual] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const [parado, setParado] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visivel || parado || pausado || fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setAtual((a) => (a + 1) % fotos.length), INTERVALO);
    return () => window.clearInterval(t);
  }, [visivel, parado, pausado, fotos.length]);

  return (
    <div
      ref={ref}
      className={cn("relative aspect-[3/4]", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setParado(true)}
      onPointerLeave={() => setParado(false)}
    >
      <button
        type="button"
        onClick={() => setAtual((a) => (a + 1) % fotos.length)}
        aria-label={`${nome}: próxima foto`}
        className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {fotos.map((f, i) => (
          <Image
            key={f.src}
            src={f.src}
            alt={i === atual ? f.alt : ""}
            aria-hidden={i !== atual}
            fill
            loading={i === 0 ? undefined : visivel || atual === i ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 33vw, 76vw"
            className={cn(
              "object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
              i === atual ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
      </button>
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-[5px] text-[11px] text-foreground">
        Imagem ilustrativa
      </span>
      <div className="absolute inset-x-0 bottom-1.5 flex justify-center">
        {fotos.map((f, i) => (
          <button
            key={f.src}
            type="button"
            onClick={() => setAtual(i)}
            aria-label={`${nome}: foto ${i + 1} de ${fotos.length}`}
            aria-current={i === atual}
            className="grid size-8 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cel:size-11"
          >
            <span
              className={cn(
                "h-1.5 rounded-full bg-background shadow-[0_1px_3px_rgb(0_0_0/0.35)] transition-all duration-300",
                i === atual ? "w-5 opacity-100" : "w-1.5 opacity-70"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
