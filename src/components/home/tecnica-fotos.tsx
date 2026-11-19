"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type Foto = {
  src: string;
  alt: string;
  /** Vídeo curto da própria Whim (sem som, em loop); `src` vira o pôster. */
  video?: string;
  /** Material da Whim (não é IA): sem o selo "Imagem ilustrativa". */
  real?: boolean;
  /** Ponto da foto/vídeo que fica no centro do recorte (object-position). */
  foco?: string;
};

const INTERVALO = 4500;
const INTERVALO_VIDEO = 8000; // o loop do vídeo tem 8 s

/**
 * Fotos de uma técnica, uma por vez, trocando por esmaecimento (sem arrastar, para não
 * brigar com o carrossel dos cartões no celular). Troca sozinha enquanto o cartão está na
 * tela e o mouse não está em cima; com movimento reduzido, só troca pelos pontos ou ao
 * tocar na foto. A primeira foto vem no HTML; as outras carregam quando o cartão aparece.
 * Uma das mídias pode ser um vídeo curto da Whim (o do silk da Yamaha, 19/11), sem o selo.
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
  // Arrastar para o lado troca a foto (pedido de 19/11); o toque simples continua passando.
  const arrasto = useRef<{ x: number; y: number } | null>(null);
  const arrastou = useRef(false);
  const passar = (d: number) => setAtual((a) => (a + d + fotos.length) % fotos.length);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [carregar, setCarregar] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisivel(e.isIntersecting);
        if (e.isIntersecting) setCarregar(true);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visivel || parado || pausado || fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // O vídeo fica um loop inteiro antes de passar; as fotos, 4,5 s.
    const t = window.setTimeout(
      () => setAtual((a) => (a + 1) % fotos.length),
      fotos[atual]?.video ? INTERVALO_VIDEO : INTERVALO
    );
    return () => window.clearTimeout(t);
  }, [visivel, parado, pausado, fotos, atual]);

  // O vídeo só baixa quando o cartão aparece e só toca quando é a mídia da vez.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const pode = visivel && !pausado && fotos[atual]?.video && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (pode && v.currentSrc) v.play().catch(() => {});
    else v.pause();
  }, [visivel, pausado, atual, fotos, carregar]);

  return (
    <div
      ref={ref}
      className={cn("relative aspect-[3/4]", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setParado(true)}
      onPointerLeave={() => setParado(false)}
    >
      <button
        type="button"
        onPointerDown={(e) => {
          arrasto.current = { x: e.clientX, y: e.clientY };
          arrastou.current = false;
        }}
        onPointerUp={(e) => {
          const a = arrasto.current;
          arrasto.current = null;
          if (!a) return;
          const dx = e.clientX - a.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - a.y)) {
            arrastou.current = true;
            passar(dx < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => (arrasto.current = null)}
        onClick={() => {
          if (arrastou.current) arrastou.current = false;
          else passar(1);
        }}
        aria-label={`${nome}: próxima foto`}
        className="absolute inset-0 cursor-pointer touch-pan-y outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {fotos.map((f, i) =>
          f.video ? (
            <video
              key={f.src}
              ref={videoRef}
              src={carregar ? f.video : undefined}
              poster={f.src}
              muted
              loop
              playsInline
              preload="none"
              aria-label={i === atual ? f.alt : undefined}
              aria-hidden={i !== atual}
              style={f.foco ? { objectPosition: f.foco } : undefined}
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
                i === atual ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <Image
              key={f.src}
              src={f.src}
              alt={i === atual ? f.alt : ""}
              aria-hidden={i !== atual}
              fill
              draggable={false}
              loading={i === 0 ? undefined : visivel || atual === i ? "eager" : "lazy"}
              sizes="(min-width: 1024px) 380px, (min-width: 768px) 33vw, 76vw"
              style={f.foco ? { objectPosition: f.foco } : undefined}
              className={cn(
                "object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
                i === atual ? "opacity-100" : "opacity-0"
              )}
            />
          )
        )}
      </button>
      {!fotos[atual]?.real && (
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-[5px] text-[11px] text-foreground">
          Imagem ilustrativa
        </span>
      )}
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
