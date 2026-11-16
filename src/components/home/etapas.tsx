"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const PASSOS = [
  { nome: "Monte a peça", texto: "Escolha peça, cor e estampa aqui no site." },
  { nome: "Orçamento", texto: "O resumo chega para a equipe no WhatsApp." },
  { nome: "Arte aprovada", texto: "Ajustamos a arte e enviamos para você aprovar." },
  { nome: "Produção", texto: "Gravação da tela, impressão e acabamento." },
  { nome: "Entrega", texto: "Retirada em Guarulhos ou envio." },
];
const ULTIMO = PASSOS.length - 1;
const TRECHO = 1500; // ms de uma bolinha até a próxima
const PAUSA = 250; // parada em cada etapa
const FOGOS = Array.from({ length: 12 }, (_, i) => i * 30); // ângulos

const suave = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * Como funciona. Quando a lista aparece (uma vez), a linha turquesa avança e
 * acende cada bolinha ao passar; no 5 saem fogos discretos. `--p` vai de 0 a 4
 * (trechos percorridos). Com movimento reduzido o CSS já mostra tudo aceso.
 */
export function Etapas() {
  const listaRef = useRef<HTMLOListElement>(null);
  const fogosRef = useRef<HTMLSpanElement>(null);
  const [aceso, setAceso] = useState(0);

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let inicio = 0;
    const quadro = (agora: number) => {
      const e = Math.max(0, agora - inicio);
      const k = Math.floor(e / (TRECHO + PAUSA));
      const p = k >= ULTIMO ? ULTIMO : k + suave(Math.min(1, (e - k * (TRECHO + PAUSA)) / TRECHO));
      lista.style.setProperty("--p", String(p));
      setAceso(Math.floor(p));
      if (p < ULTIMO) raf = requestAnimationFrame(quadro);
      else estourar(fogosRef.current);
    };
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        io.disconnect();
        inicio = performance.now() + 300;
        raf = requestAnimationFrame(quadro);
      },
      { threshold: 0.5 }
    );
    io.observe(lista);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol
      ref={listaRef}
      className="grid gap-[26px] [--p:0] motion-reduce:[--p:4] lg:grid-cols-5 lg:gap-5"
    >
      {PASSOS.map((passo, i) => (
        <li
          key={passo.nome}
          className="relative grid grid-cols-[46px_1fr] gap-x-4 gap-y-1.5 lg:flex lg:flex-col lg:gap-3"
        >
          {/* Trecho até a próxima bolinha: vertical no celular, horizontal no PC. */}
          {i < ULTIMO && (
            <span
              aria-hidden
              style={{ "--k": i } as React.CSSProperties}
              className="absolute top-[23px] left-[22px] h-[calc(100%+26px)] w-0.5 bg-primary/12 lg:top-[22px] lg:left-[23px] lg:h-0.5 lg:w-[calc(100%+20px)]"
            >
              <span className="block size-full origin-top bg-accent max-lg:scale-y-[clamp(0,var(--p)_-_var(--k),1)] lg:origin-left lg:scale-x-[clamp(0,var(--p)_-_var(--k),1)]" />
            </span>
          )}
          {i === ULTIMO && (
            <span ref={fogosRef} aria-hidden className="absolute top-[23px] left-[23px]">
              {FOGOS.map((a) => (
                <span
                  key={a}
                  className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-accent opacity-0 odd:-top-0.5 odd:-left-0.5 odd:size-1 odd:bg-primary"
                />
              ))}
            </span>
          )}
          <span
            aria-hidden
            className={cn(
              "relative z-10 row-span-2 grid size-[46px] place-items-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-300 motion-reduce:border-accent motion-reduce:bg-accent",
              i <= aceso ? "border-accent bg-accent" : "border-primary/16 bg-background"
            )}
          >
            {i + 1}
          </span>
          <h3 className="mt-2.5 text-[19px] leading-[1.15] font-semibold tracking-[-0.01em] lg:mt-1.5 lg:text-[21px]">
            {passo.nome}
          </h3>
          <p className="text-[14.5px] leading-[1.55] text-muted-foreground">{passo.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/** 12 pontinhos saem do centro da bolinha 5 até ~46 px e somem. */
function estourar(fogos: HTMLElement | null) {
  Array.from(fogos?.children ?? []).forEach((ponto, i) => {
    const giro = `rotate(${FOGOS[i]}deg)`;
    ponto.animate(
      [
        { opacity: 1, transform: `${giro} translateX(0)` },
        { opacity: 0, transform: `${giro} translateX(46px)` },
      ],
      { duration: 650, easing: "cubic-bezier(.2,.7,.3,1)" }
    );
  });
}
