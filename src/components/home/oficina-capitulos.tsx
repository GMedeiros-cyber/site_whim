"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type Capitulo = {
  nome: string;
  curto: string;
  texto: string;
  /** Foto do capítulo (ou o pôster do vídeo). */
  src: string;
  alt: string;
  video?: string;
  /** Imagem gerada por IA: leva o selo "Imagem ilustrativa". */
  ilustrativa?: boolean;
};

const DURACAO = 3500;

const REDUZIDO = "(prefers-reduced-motion: reduce)";
const assinarMovimento = (avisar: () => void) => {
  const mq = matchMedia(REDUZIDO);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
};

/**
 * Quem somos no celular (ideia B do Figma, 19/11): a oficina em 4 capítulos, como stories.
 * As barrinhas do alto enchem e o capítulo troca sozinho enquanto o cartão está na tela;
 * tocar num capítulo embaixo, ou arrastar o cartão para o lado, pula. As mídias ficam
 * empilhadas e só trocam a opacidade (sem recriar nada). O vídeo só baixa quando o cartão
 * aparece e só toca no capítulo dele. Com movimento reduzido nada troca sozinho.
 */
export function OficinaCapitulos({ capitulos, className }: { capitulos: Capitulo[]; className?: string }) {
  const [atual, setAtual] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const [carregar, setCarregar] = useState(false);
  const reduzido = useSyncExternalStore(
    assinarMovimento,
    () => matchMedia(REDUZIDO).matches,
    () => false
  );
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const arrasto = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const n = capitulos.length;
  const ir = (i: number) => setAtual(((i % n) + n) % n);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisivel(e.isIntersecting);
        if (e.isIntersecting) setCarregar(true);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Troca sozinho só com o cartão na tela; um toque reinicia a contagem do capítulo.
  useEffect(() => {
    if (!visivel || reduzido) return;
    const t = window.setTimeout(() => setAtual((a) => (a + 1) % n), DURACAO);
    return () => window.clearTimeout(t);
  }, [atual, visivel, reduzido, n]);

  const comVideo = capitulos.findIndex((c) => c.video);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visivel && !reduzido && atual === comVideo && v.currentSrc) v.play().catch(() => {});
    else v.pause();
  }, [visivel, reduzido, atual, comVideo, carregar]);

  const c = capitulos[atual];

  return (
    <div ref={ref} className={className}>
      <div
        className="relative aspect-[11/16] touch-pan-y overflow-hidden rounded-[24px] bg-primary select-none"
        onPointerDown={(e) => (arrasto.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const a = arrasto.current;
          arrasto.current = null;
          if (!a) return;
          const dx = e.clientX - a.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - a.y)) ir(atual + (dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (arrasto.current = null)}
      >
        {capitulos.map((x, i) => (
          <div
            key={x.nome}
            aria-hidden={i !== atual}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
              i === atual ? "opacity-100" : "opacity-0"
            )}
          >
            {x.video ? (
              <video
                ref={videoRef}
                src={carregar ? x.video : undefined}
                poster={x.src}
                muted
                loop
                playsInline
                preload="none"
                aria-label={x.alt}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <Image
                src={x.src}
                alt={i === atual ? x.alt : ""}
                fill
                sizes="92vw"
                draggable={false}
                loading={i === 0 || carregar ? "eager" : "lazy"}
                className="object-cover"
              />
            )}
          </div>
        ))}

        {/* Degradê para o texto (por cima das mídias). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-primary/95 via-primary/55 to-transparent"
        />

        {/* Barrinhas dos capítulos: a atual enche no tempo do capítulo. */}
        <div aria-hidden className="absolute inset-x-4 top-4 flex gap-1.5">
          {capitulos.map((x, i) => (
            <span key={x.nome} className="h-1 flex-1 overflow-hidden rounded-full bg-background/35">
              <span
                key={i === atual ? `${atual}-${visivel}` : i}
                className={cn(
                  "block h-full origin-left rounded-full bg-background",
                  i < atual && "scale-x-100",
                  i > atual && "scale-x-0",
                  i === atual && (visivel && !reduzido ? "oficina-barra" : "scale-x-100")
                )}
                style={i === atual ? ({ "--dur": `${DURACAO}ms` } as React.CSSProperties) : undefined}
              />
            </span>
          ))}
        </div>

        {c.ilustrativa && (
          <span className="pointer-events-none absolute top-8 left-4 rounded-full bg-background/85 px-2.5 py-[5px] text-[11px] text-foreground">
            Imagem ilustrativa
          </span>
        )}

        <div
          key={atual}
          id={`${id}-texto`}
          aria-live="polite"
          className="absolute inset-x-5 bottom-5 animate-in text-left text-primary-foreground duration-500 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          <p className="text-xs font-semibold tracking-[0.04em] text-accent">
            {atual + 1} de {n}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{c.nome}</h3>
          <p className="mt-1 text-sm leading-normal text-primary-foreground/85">{c.texto}</p>
        </div>
      </div>

      <div role="group" aria-label="Capítulos da oficina" className="mt-4 grid grid-cols-4 gap-1.5">
        {capitulos.map((x, i) => (
          <button
            key={x.nome}
            type="button"
            onClick={() => ir(i)}
            aria-current={i === atual ? "step" : undefined}
            aria-controls={`${id}-texto`}
            className={cn(
              "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 text-[11.5px] leading-tight transition-colors duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
              i === atual ? "bg-accent/16 font-semibold text-foreground" : "bg-muted font-medium text-muted-foreground"
            )}
          >
            <span className="text-xs font-bold tabular-nums">{i + 1}</span>
            {x.curto}
          </button>
        ))}
      </div>
    </div>
  );
}
