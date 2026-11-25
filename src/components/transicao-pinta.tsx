"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import "./transicao-pinta.css";
import { ACAO } from "@/lib/navegacao";

const EVENTO_FIM = "whim:pinta-fim";

let andando = false;
/** Toque num link durante a transição: vai para lá assim que ela acabar (antes era descartado). */
let proximo: string | null = null;
/** Fecha a espera da troca de rota, quando a rota nova já está na tela. */
let rotaTrocou: (() => void) | null = null;

/**
 * Roda `fn` quando a transição de tinta terminar (ou já, se nenhuma estiver passando).
 * Para trabalho pesado da página de destino (ex.: decodificar os quadros da arara),
 * que não deve disputar a tela com a tinta. Devolve o cancelamento.
 */
export function depoisDaTransicao(fn: () => void): () => void {
  if (!andando) {
    fn();
    return () => {};
  }
  window.addEventListener(EVENTO_FIM, fn, { once: true });
  return () => window.removeEventListener(EVENTO_FIM, fn);
}

const quadro = () => new Promise((r) => requestAnimationFrame(r));

/** Espera as fotos visíveis na 1ª tela da página nova decodificarem (com um limite de tempo). */
async function fotosDaPrimeiraTela(limite: number) {
  const visiveis = Array.from(document.images).filter((img) => {
    const r = img.getBoundingClientRect();
    return r.width > 40 && r.bottom > 0 && r.top < innerHeight && img.loading !== "lazy";
  });
  if (!visiveis.length) return;
  await Promise.race([
    Promise.allSettled(visiveis.map((img) => img.decode())),
    new Promise((r) => setTimeout(r, limite)),
  ]);
}

/**
 * Transição "a página se pinta" (no layout), só ao ir para o Monte sua peça ou sair dele.
 * Uma faixa de tinta (azul-marinho com a frente turquesa e pingos atrás) sobe pela tela só
 * com transform, no compositor: cobre a página, a rota troca por baixo e ela termina de
 * passar revelando a nova. O trabalho pesado da página nova pode esperar `depoisDaTransicao`.
 * Movimento reduzido, clique com tecla ou link externo: navegação normal.
 */
export function TransicaoPinta() {
  const router = useRouter();
  const pathname = usePathname();
  const tintaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rotaTrocou?.();
    rotaTrocou = null;
  }, [pathname]);

  useEffect(() => {
    const passar = async (destino: string) => {
      const tinta = tintaRef.current;
      if (!tinta) return router.push(destino);
      andando = true;
      router.prefetch(destino);
      tinta.dataset.ativa = "";
      const opcoes = { fill: "forwards" } as const;
      try {
        // 1) cobre a tela (a frente passa do topo). Mais calma que antes (pedido de 23/11).
        await tinta.animate([{ transform: "translateY(0)" }, { transform: "translateY(-68.5%)" }], {
          ...opcoes,
          duration: 560,
          easing: "cubic-bezier(.6,0,.3,1)",
        }).finished;
        // 2) com a tela coberta, a rota troca por baixo e esperamos a página nova pintar e as fotos
        //    da 1ª tela decodificarem (rota lenta: segue em 3 s; fotos: no máximo 1,2 s).
        const inicio = performance.now();
        await new Promise<void>((pronto) => {
          rotaTrocou = pronto;
          setTimeout(pronto, 3000);
          router.push(destino);
        });
        await quadro();
        await fotosDaPrimeiraTela(1200);
        // Fica pelo menos 200 ms coberta, para a troca não piscar.
        const resta = 200 - (performance.now() - inicio);
        if (resta > 0) await new Promise((r) => setTimeout(r, resta));
        // 3) termina de passar, revelando a página nova
        await tinta.animate([{ transform: "translateY(-68.5%)" }, { transform: "translateY(-162%)" }], {
          ...opcoes,
          duration: 720,
          easing: "cubic-bezier(.3,0,.2,1)",
        }).finished;
      } finally {
        // Mesmo se uma animação for cancelada, a transição não fica presa (os cliques voltam a valer).
        delete tinta.dataset.ativa;
        tinta.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        andando = false;
        window.dispatchEvent(new Event(EVENTO_FIM));
      }
      const depois = proximo;
      proximo = null;
      if (depois) void passar(depois);
    };

    // Captura: roda antes do onClick do Link, que respeita o preventDefault.
    const clique = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin) return;
      if ((location.pathname === ACAO.href) === (url.pathname === ACAO.href)) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      const destino = url.pathname + url.search + url.hash;
      if (andando) proximo = destino;
      else void passar(destino);
    };
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, [router]);

  return <div ref={tintaRef} aria-hidden className="pinta-tinta" />;
}
