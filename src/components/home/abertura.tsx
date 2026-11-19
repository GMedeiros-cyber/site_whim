"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import "./abertura.css";
import {
  EVENTO_FIM,
  SCRIPT_CARGA,
  aberturaNaTela,
  avisarFimDaAbertura,
  travarRolagem,
} from "@/lib/abertura";

const assinar = (avisar: () => void) => {
  window.addEventListener(EVENTO_FIM, avisar);
  return () => window.removeEventListener(EVENTO_FIM, avisar);
};

/**
 * Abertura da home: o símbolo da Whim é pintado pela tinta e a escrita entra (~3,5 s).
 * Toca em toda carga da home; o logo da barra não a repete (pedido de 18/11).
 * Vem no HTML do servidor e anima já no 1º desenho, só com transform e opacity (no
 * compositor, a hidratação não engasga). O React decide se ela fica na árvore; o nó
 * nunca é tirado à mão. Um toque (ou tecla) pula. No fim, a tinta do "Vista" começa.
 */
export function Abertura() {
  const ref = useRef<HTMLDivElement>(null);
  // No HTML do servidor ela sempre vem; no cliente, só enquanto a fase da entrada pede
  // (chegando à home por outro link, ou com movimento reduzido, não há abertura).
  const tocando = useSyncExternalStore(assinar, aberturaNaTela, () => true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!tocando || !el) return;
    travarRolagem(true);

    let acabou = false;
    let fim = 0;
    const terminar = () => {
      if (acabou) return;
      acabou = true;
      clearTimeout(fim);
      travarRolagem(false);
      avisarFimDaAbertura(); // a fase vira "tinta" e a abertura sai da árvore
    };
    // A saída já pode ter acabado antes da hidratação (celular lento): o `finished`
    // resolve na hora nesse caso. O timer é só a garantia.
    const saida = el.getAnimations().find((a) => a instanceof CSSAnimation && a.animationName === "abertura-sai");
    saida?.finished.then(terminar, () => {});
    fim = window.setTimeout(terminar, 4800);

    const pular = () => {
      el.dataset.pulou = "";
      clearTimeout(fim);
      fim = window.setTimeout(terminar, 600);
    };
    el.addEventListener("pointerdown", pular, { once: true });
    window.addEventListener("keydown", pular, { once: true });

    return () => {
      acabou = true;
      clearTimeout(fim);
      el.removeEventListener("pointerdown", pular);
      window.removeEventListener("keydown", pular);
      travarRolagem(false);
    };
  }, [tocando]);

  if (!tocando) return null;
  return (
    <>
      <div ref={ref} id="abertura" className="abertura" aria-hidden="true" title="Toque para pular">
        <div className="abertura-palco">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="abertura-fantasma" src="/brand/abertura/fantasma.webp" alt="" fetchPriority="low" />
          <div className="abertura-rodo abertura-rodo1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/abertura/contorno.webp" alt="" />
          </div>
          <div className="abertura-rodo abertura-rodo2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/whim-simbolo-camiseta.webp" alt="" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="abertura-palavra" src="/brand/whim-escrita.svg" alt="" />
        </div>
        <span className="abertura-pular">Toque para pular</span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_CARGA }} />
    </>
  );
}
