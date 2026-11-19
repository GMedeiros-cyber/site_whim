"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo curto da oficina (sem som), em loop contínuo (o fim já emenda no começo, com uma
 * fusão de 0,6 s feita no arquivo). Só baixa e toca quando aparece na tela e
 * pausa quando sai. Com movimento reduzido fica parado no primeiro quadro (o pôster).
 */
export function VideoOficina({ src, poster, rotulo }: { src: string; poster: string; rotulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [carregar, setCarregar] = useState(false);
  const [mover, setMover] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCarregar(true);
          setMover(!reduzido);
          if (!reduzido && v.currentSrc) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      // Só baixa quando aparece (auditoria de 19/11): com 200 px de folga, no PC o mosaico logo
      // abaixo da hero baixava o vídeo na carga da página.
      { threshold: 0.1 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={carregar ? src : undefined}
      poster={poster}
      muted
      loop
      autoPlay={mover}
      playsInline
      preload="none"
      aria-label={rotulo}
      className="absolute inset-0 size-full object-cover"
    />
  );
}
