/**
 * Entrada da home, em sequência: abertura (logo pintado) → tinta da palavra "Vista".
 * Toca em toda carga da home. Chegando à home por um link (inclusive o logo da barra,
 * pedido de 18/11), tudo já aparece pronto.
 *
 * A fase fica em <html data-intro>:
 *   "abertura" abertura tocando (começa no 1º desenho; a rolagem fica travada)
 *   "tinta"    a tinta pintando o "Vista"
 *   (ausente)  tudo pronto
 * Na carga, quem marca "abertura" é SCRIPT_CARGA (script em linha: só roda na carga).
 */
export const EVENTO_FIM = "whim:abertura-fim";

type Fase = "abertura" | "tinta";

const html = () => document.documentElement;
const marcar = (fase?: Fase) => {
  if (fase) html().dataset.intro = fase;
  else delete html().dataset.intro;
};

export const faseIntro = () => html().dataset.intro as Fase | undefined;
export const aberturaNaTela = () => faseIntro() === "abertura";

/**
 * Antes da 1ª pintura: marca a abertura e trava a rolagem (o gutter fica, para a página
 * não mudar de largura ao destravar). Com movimento reduzido, nada disso.
 */
export const SCRIPT_CARGA = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.dataset.intro="abertura";h.style.overflow="hidden";h.style.scrollbarGutter="stable"}}catch(e){}})()`;

export function travarRolagem(trava: boolean) {
  html().style.overflow = trava ? "hidden" : "";
  html().style.scrollbarGutter = trava ? "stable" : "";
}

export function avisarFimDaAbertura() {
  if (aberturaNaTela()) marcar("tinta");
  window.dispatchEvent(new Event(EVENTO_FIM));
}

/** A palavra ficou pronta: fim da entrada. */
export function avisarVistaPronta() {
  marcar();
}

/** Roda `fn` quando a abertura acabar (ou já, se ela não está na tela). Devolve o cancelamento. */
export function depoisDaAbertura(fn: () => void): () => void {
  if (!aberturaNaTela()) {
    fn();
    return () => {};
  }
  window.addEventListener(EVENTO_FIM, fn, { once: true });
  return () => window.removeEventListener(EVENTO_FIM, fn);
}
