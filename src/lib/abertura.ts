/**
 * Combina a abertura (logo pintado) com a tinta da palavra "Vista":
 * a primeira chamada decide se a abertura toca nesta visita e guarda a resposta,
 * para os dois componentes concordarem. Quando a abertura acaba, dispara EVENTO_FIM.
 */
export const CHAVE_ABERTURA = "whim-abertura-vista";
export const EVENTO_FIM = "whim:abertura-fim";

let decisao: boolean | undefined;
let acabou = false;

export function aberturaVaiTocar(): boolean {
  if (decisao !== undefined) return decisao;
  let vista = false;
  try {
    vista = sessionStorage.getItem(CHAVE_ABERTURA) === "1";
  } catch {}
  decisao = !vista && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  return decisao;
}

export function avisarFimDaAbertura() {
  if (acabou) return;
  acabou = true;
  window.dispatchEvent(new Event(EVENTO_FIM));
}

/** Roda `fn` já, ou quando a abertura terminar. Devolve a função que cancela a espera. */
export function depoisDaAbertura(fn: () => void): () => void {
  if (!aberturaVaiTocar() || acabou) {
    fn();
    return () => {};
  }
  window.addEventListener(EVENTO_FIM, fn, { once: true });
  return () => window.removeEventListener(EVENTO_FIM, fn);
}
