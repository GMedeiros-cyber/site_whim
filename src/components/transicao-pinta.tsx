"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import "./transicao-pinta.css";
import { ACAO } from "@/lib/navegacao";

/** Fecha a espera da transição aberta, quando a rota nova já está na tela. */
let rotaTrocou: (() => void) | null = null;

/**
 * Transição "a página se pinta" (no layout), só ao ir para o Monte sua peça ou sair dele.
 * Usa a View Transitions API direto: o clique num link interno que entra ou sai do Monte
 * sua peça abre a transição, navega por baixo e a captura nova sai quando a rota troca.
 * (O <ViewTransition> do React esconde a captura da página inteira e só anima trechos
 * nomeados; a tinta precisa cobrir a tela toda.) A tinta está em transicao-pinta.css.
 * Sem a API, com movimento reduzido, clique com tecla ou link externo: navegação normal.
 */
export function TransicaoPinta() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    rotaTrocou?.();
    rotaTrocou = null;
  }, [pathname]);

  useEffect(() => {
    // Captura: roda antes do onClick do Link, que respeita o preventDefault.
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin) return;
      if ((location.pathname === ACAO.href) === (url.pathname === ACAO.href)) return;
      if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      document.startViewTransition(
        () =>
          new Promise<void>((pronto) => {
            rotaTrocou = pronto;
            setTimeout(pronto, 3000); // rota lenta não deixa a tela congelada
            router.push(url.pathname + url.search + url.hash);
          })
      );
    };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, [router]);

  return null;
}
