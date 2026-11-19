"use client";

import { useEffect, useId, useRef, useState } from "react";

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
    if (
      !lista ||
      !CSS.supports("animation-timeline: view()") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
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
 * Celular (referencia/celular-18-11): os 5 passos numa linha (círculos ligados por uma
 * linha que fica turquesa até o passo escolhido) e, embaixo, só a frase do passo tocado.
 * Começa no 1; setas, Home e End trocam de passo.
 */
export function EtapasCelular({ className }: { className?: string }) {
  const [atual, setAtual] = useState(0);
  const id = useId();
  const passos = useRef<(HTMLButtonElement | null)[]>([]);
  const ir = (i: number) => {
    const n = Math.max(0, Math.min(ULTIMO, i));
    setAtual(n);
    passos.current[n]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Etapas do pedido"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") ir(atual + 1);
          else if (e.key === "ArrowLeft") ir(atual - 1);
          else if (e.key === "Home") ir(0);
          else if (e.key === "End") ir(ULTIMO);
          else return;
          e.preventDefault();
        }}
        className="relative flex justify-between"
      >
        {/* Linha do centro do 1º ao centro do 5º (botões de 64 px, círculos de 36 px). */}
        <span aria-hidden className="absolute top-[17px] right-8 left-8 h-0.5 bg-primary/12">
          <span
            style={{ transform: `scaleX(${atual / ULTIMO})` }}
            className="block h-full origin-left bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none"
          />
        </span>
        {PASSOS.map((passo, i) => (
          <button
            key={passo.nome}
            ref={(el) => {
              passos.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-passo${i}`}
            aria-selected={i === atual}
            aria-controls={`${id}-frase`}
            tabIndex={i === atual ? 0 : -1}
            onClick={() => setAtual(i)}
            className="relative flex w-16 cursor-pointer flex-col items-center gap-2 rounded-xl pb-1 text-center text-[11px] leading-[1.2] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-9 place-items-center rounded-full border-2 text-[13px] font-bold tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                i <= atual ? "border-accent bg-accent text-primary" : "border-primary/14 bg-background"
              )}
            >
              {i + 1}
            </span>
            {passo.nome}
          </button>
        ))}
      </div>
      <div
        id={`${id}-frase`}
        role="tabpanel"
        aria-labelledby={`${id}-passo${atual}`}
        className="mt-7 rounded-[18px] bg-muted px-[18px] py-4 text-center text-sm leading-normal text-muted-foreground"
      >
        <b className="block text-[15px] font-semibold text-foreground">
          {atual + 1} · {PASSOS[atual].nome}
        </b>
        {PASSOS[atual].texto}
      </div>
    </div>
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
