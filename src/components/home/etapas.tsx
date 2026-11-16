"use client";

import { useEffect, useRef } from "react";

const PASSOS = [
  { nome: "Monte a peça", texto: "Escolha peça, cor e estampa aqui no site." },
  { nome: "Orçamento", texto: "O resumo chega para a equipe no WhatsApp." },
  { nome: "Arte aprovada", texto: "Ajustamos a arte e enviamos para você aprovar." },
  { nome: "Produção", texto: "Gravação da tela, impressão e acabamento." },
  { nome: "Entrega", texto: "Retirada em Guarulhos ou envio." },
];
const ULTIMO = PASSOS.length - 1;
const FOGOS = Array.from({ length: 12 }, (_, i) => i * 30); // ângulos

/**
 * Como funciona. `--home-p` (0 a 4 trechos) anda com a rolagem pelo CSS
 * (`.home-etapas` em transicoes.css): cada trecho da linha enche de `--k` até
 * `--k + 1` e cada bolinha acende quando `--home-p` chega no seu `--k`.
 * O JS só solta os fogos do 5 uma vez, na primeira vez que ele acende.
 */
export function Etapas() {
  const listaRef = useRef<HTMLOListElement>(null);
  const fogosRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const lista = listaRef.current;
    if (
      !lista ||
      !CSS.supports("animation-timeline: view()") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const olhar = () => {
      if (parseFloat(getComputedStyle(lista).getPropertyValue("--home-p")) < ULTIMO) return;
      window.removeEventListener("scroll", olhar);
      estourar(fogosRef.current);
    };
    window.addEventListener("scroll", olhar, { passive: true });
    return () => window.removeEventListener("scroll", olhar);
  }, []);

  return (
    <ol ref={listaRef} className="home-etapas grid gap-[26px] lg:grid-cols-5 lg:gap-5">
      {PASSOS.map((passo, i) => (
        <li
          key={passo.nome}
          style={{ "--k": i } as React.CSSProperties}
          className="relative grid grid-cols-[46px_1fr] gap-x-4 gap-y-1.5 lg:flex lg:flex-col lg:gap-3"
        >
          {/* Trecho até a próxima bolinha: vertical no celular, horizontal no PC. */}
          {i < ULTIMO && (
            <span
              aria-hidden
              className="absolute top-[23px] left-[22px] h-[calc(100%+26px)] w-0.5 bg-primary/12 lg:top-[22px] lg:left-[23px] lg:h-0.5 lg:w-[calc(100%+20px)]"
            >
              <span className="block size-full origin-top bg-accent max-lg:scale-y-[clamp(0,var(--home-p)_-_var(--k),1)] lg:origin-left lg:scale-x-[clamp(0,var(--home-p)_-_var(--k),1)]" />
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
          {/* O turquesa (::before) aparece quando --home-p chega em --k:
              (p - k) * 20 + 1 vai de 0 a 1 no último 0,05 do trecho. */}
          <span
            aria-hidden
            className="relative z-10 row-span-2 grid size-[46px] place-items-center rounded-full border border-primary/16 bg-background text-sm font-semibold tabular-nums before:absolute before:-inset-px before:-z-10 before:rounded-full before:bg-accent before:opacity-[clamp(0,(var(--home-p)_-_var(--k))_*_20_+_1,1)]"
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
