/**
 * Entrada da home, em sequência: abertura (logo pintado) → tinta da palavra "Vista"
 * → barra de navegação. Toca em toda carga da home e quando se clica no logo da barra
 * (pedido de 17/11). Chegando à home por outro link, tudo já aparece pronto.
 *
 * A fase fica em <html data-intro>, para o CSS esconder a barra antes da 1ª pintura:
 *   "espera"   abertura na tela, parada até a página hidratar e as imagens decodificarem
 *   "abertura" abertura tocando
 *   "tinta"    a tinta pintando o "Vista"
 *   (ausente)  tudo pronto
 * Na carga, quem marca "espera" é SCRIPT_CARGA (script em linha: só roda na carga).
 */
export const EVENTO_FIM = "whim:abertura-fim";
export const EVENTO_REINICIO = "whim:abertura-reinicio";

type Fase = "espera" | "abertura" | "tinta";

const html = () => document.documentElement;
const marcar = (fase?: Fase) => {
  if (fase) html().dataset.intro = fase;
  else delete html().dataset.intro;
};

export const faseIntro = () => html().dataset.intro as Fase | undefined;
export const aberturaNaTela = () => faseIntro() === "espera" || faseIntro() === "abertura";

/**
 * Antes da 1ª pintura: marca a espera e trava a rolagem (o gutter fica, para a página
 * não mudar de largura ao destravar). Com movimento reduzido, nada disso.
 */
export const SCRIPT_CARGA = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.dataset.intro="espera";h.style.overflow="hidden";h.style.scrollbarGutter="stable"}}catch(e){}})()`;

export function travarRolagem(trava: boolean) {
  html().style.overflow = trava ? "hidden" : "";
  html().style.scrollbarGutter = trava ? "stable" : "";
}

/** Clique no logo da barra: na home a entrada recomeça já; fora dela, quando a home montar. */
export function pedirIntro(naHome: boolean) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  marcar("espera");
  if (naHome) window.dispatchEvent(new Event(EVENTO_REINICIO));
}

export function avisarFimDaAbertura() {
  if (aberturaNaTela()) marcar("tinta");
  window.dispatchEvent(new Event(EVENTO_FIM));
}

/** A palavra ficou pronta: a barra de navegação entra. */
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
