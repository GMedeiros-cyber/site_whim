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
    if (!lista || !CSS.supports("animation-timeline: view()") || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const olhar = () => {
      // Escondida (celular, que usa EtapasCelular): a animação não roda e o valor fica no máximo.
      if (!lista.checkVisibility() || parseFloat(getComputedStyle(lista).getPropertyValue("--home-p")) < ULTIMO) return;
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

/**
 * Celular: os 5 passos numa linha do tempo vertical (opção A, aprovada em 24/11). Todos os
 * nomes e frases ficam à vista; conforme a pessoa rola, a linha e as bolinhas acendem até o
 * passo que cruza 60% da altura da tela, e o passo atual fica um pouco maior. Volta ao rolar
 * para cima. Tocar num passo também o marca; a rolagem volta a mandar quando muda de passo.
 */
export function EtapasCelular({ className }: { className?: string }) {
  const [atual, setAtual] = useState(0);
  const itens = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let ultimo = -1;
    const ler = () => {
      raf = 0;
      const linha = innerHeight * 0.6;
      let n = -1;
      itens.current.forEach((li, i) => {
        if (!li) return;
        const r = li.getBoundingClientRect();
        if (r.height && r.top + 20 <= linha) n = i;
      });
      if (n < 0) {
        const primeiro = itens.current[0]?.getBoundingClientRect();
        if (!primeiro?.height) return; // escondido (PC)
        n = 0;
      }
      // No fim da página o último passo acende mesmo sem chegar à linha.
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) n = ULTIMO;
      if (n !== ultimo) {
        ultimo = n;
        setAtual(n);
      }
    };
    const aoRolar = () => {
      raf ||= requestAnimationFrame(ler);
    };
    ler();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoRolar);
    return () => {
      removeEventListener("scroll", aoRolar);
      removeEventListener("resize", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol aria-label="Etapas do pedido" className={cn("mx-auto max-w-[22rem] text-left", className)}>
      {PASSOS.map((passo, i) => {
        const feito = i <= atual;
        const agora = i === atual;
        return (
          <li
            key={passo.nome}
            ref={(el) => {
              itens.current[i] = el;
            }}
            aria-current={agora ? "step" : undefined}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* Trecho da linha até a próxima bolinha: enche quando o próximo passo acende. */}
            {i < ULTIMO && (
              <span aria-hidden className="absolute top-10 bottom-0 left-[19px] w-0.5 bg-primary/12">
                <span
                  className={cn(
                    "block size-full origin-top bg-accent transition-transform duration-500 ease-out motion-reduce:transition-none",
                    i < atual ? "scale-y-100" : "scale-y-0"
                  )}
                />
              </span>
            )}
            <button
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Passo ${i + 1}: ${passo.nome}`}
              className="relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className={cn(
                  "grid place-items-center rounded-full border-2 text-[13px] font-bold tabular-nums transition-[width,height,background-color,border-color,color] duration-300 motion-reduce:transition-none",
                  agora ? "size-10" : "size-[34px]",
                  feito
                    ? "border-accent bg-accent text-primary"
                    : "border-primary/14 bg-background text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
            </button>
            <div className="min-w-0 pt-1.5">
              <h3
                className={cn(
                  "text-base leading-snug font-semibold transition-colors duration-300",
                  feito ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {passo.nome}
              </h3>
              <p
                className={cn(
                  "mt-0.5 text-[14px] leading-normal text-muted-foreground transition-opacity duration-300",
                  agora ? "opacity-100" : "opacity-75"
                )}
              >
                {passo.texto}
              </p>
            </div>
          </li>
        );
      })}
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
