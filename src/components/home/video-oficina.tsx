"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo curto da oficina (sem som), em loop. Só baixa e toca quando aparece na tela e
 * pausa quando sai. Com movimento reduzido fica parado no primeiro quadro (o pôster).
 */
export function VideoOficina({ src, poster, rotulo }: { src: string; poster: string; rotulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [carregar, setCarregar] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCarregar(true);
          if (!reduzido) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { rootMargin: "200px" }
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
      playsInline
      preload="none"
      aria-label={rotulo}
      className="absolute inset-0 size-full object-cover"
    />
  );
}
