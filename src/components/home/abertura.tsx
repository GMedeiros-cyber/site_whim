"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import "./abertura.css";
import {
  EVENTO_FIM,
  EVENTO_REINICIO,
  SCRIPT_CARGA,
  aberturaNaTela,
  avisarFimDaAbertura,
  faseIntro,
  travarRolagem,
} from "@/lib/abertura";

const assinar = (avisar: () => void) => {
  window.addEventListener(EVENTO_FIM, avisar);
  window.addEventListener(EVENTO_REINICIO, avisar);
  return () => {
    window.removeEventListener(EVENTO_FIM, avisar);
    window.removeEventListener(EVENTO_REINICIO, avisar);
  };
};

/**
 * Abertura da home: o símbolo da Whim é pintado pela tinta e a escrita entra (~3,5 s).
 * Toca em toda carga da home e quando o logo da barra é clicado (src/lib/abertura.ts).
 * Vem no HTML do servidor para aparecer antes de tudo, parada ("espera") até a página
 * hidratar e as imagens decodificarem: assim a hidratação não engasga a animação.
 * Um toque (ou tecla) pula. No fim, a tinta da palavra "Vista" começa.
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

    let vivo = true;
    let comecou = false;
    let fim = 0;
    const terminar = () => {
      clearTimeout(fim);
      travarRolagem(false);
      avisarFimDaAbertura(); // a fase vira "tinta" e a abertura sai da árvore
    };
    const comecar = () => {
      if (!vivo || comecou) return;
      comecou = true;
      if (faseIntro() === "espera") document.documentElement.dataset.intro = "abertura";
      clearTimeout(fim);
      fim = window.setTimeout(terminar, 4800); // garantia, se o animationend não vier
    };
    const imagens = [...el.querySelectorAll("img")].map((i) => i.decode().catch(() => {}));
    Promise.all(imagens).then(() => requestAnimationFrame(comecar));
    fim = window.setTimeout(comecar, 1500); // imagem lenta não segura a abertura

    const pular = () => {
      comecar();
      el.dataset.pulou = "";
      clearTimeout(fim);
      fim = window.setTimeout(terminar, 600);
    };
    const aoAcabar = (e: AnimationEvent) => {
      if (e.target === el && e.animationName === "abertura-sai") terminar();
    };
    el.addEventListener("animationend", aoAcabar);
    el.addEventListener("pointerdown", pular, { once: true });
    window.addEventListener("keydown", pular, { once: true });

    return () => {
      vivo = false;
      clearTimeout(fim);
      el.removeEventListener("animationend", aoAcabar);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="abertura-tinta1" src="/brand/abertura/contorno.webp" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="abertura-tinta2" src="/brand/whim-simbolo-camiseta.webp" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="abertura-palavra" src="/brand/whim-escrita.svg" alt="" />
        </div>
        <span className="abertura-pular">Toque para pular</span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_CARGA }} />
    </>
  );
}
