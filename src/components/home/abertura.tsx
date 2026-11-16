"use client";

import { useLayoutEffect, useRef } from "react";

import "./abertura.css";
import { CHAVE_ABERTURA, aberturaVaiTocar, avisarFimDaAbertura } from "@/lib/abertura";

/**
 * Abertura da home: o símbolo da Whim é pintado pela tinta e a escrita entra (~3,5 s).
 * Vem no HTML do servidor para aparecer antes de qualquer coisa; o script em linha
 * esconde na hora quem já viu nesta sessão ou prefere menos movimento.
 * Um toque (ou tecla) pula. No fim, avisa a tinta da palavra "Vista" para começar.
 */
export function Abertura() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!aberturaVaiTocar()) {
      el.remove();
      avisarFimDaAbertura();
      return;
    }
    try {
      sessionStorage.setItem(CHAVE_ABERTURA, "1");
    } catch {}
    document.documentElement.style.overflow = "hidden";

    let fim = 0;
    const terminar = () => {
      clearTimeout(fim);
      document.documentElement.style.overflow = "";
      el.remove();
      avisarFimDaAbertura();
    };
    const pular = () => {
      el.dataset.pulou = "";
      clearTimeout(fim);
      fim = window.setTimeout(terminar, 600);
    };
    const aoAcabar = (e: AnimationEvent) => {
      if (e.target === el && /abertura-sai|abertura-some/.test(e.animationName)) terminar();
    };
    el.addEventListener("animationend", aoAcabar);
    el.addEventListener("pointerdown", pular, { once: true });
    window.addEventListener("keydown", pular, { once: true });
    fim = window.setTimeout(terminar, 4800); // garantia, se o animationend não vier

    return () => {
      clearTimeout(fim);
      el.removeEventListener("animationend", aoAcabar);
      el.removeEventListener("pointerdown", pular);
      window.removeEventListener("keydown", pular);
      document.documentElement.style.overflow = "";
    };
  }, []);

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
      <script
        // Esconde antes do primeiro desenho quem já viu nesta sessão ou prefere menos movimento.
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${CHAVE_ABERTURA}")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches){var a=document.getElementById("abertura");a&&(a.style.display="none")}}catch(e){}`,
        }}
      />
    </>
  );
}
