/**
 * Entrada da home, em sequência: abertura (logo pintado) → tinta da palavra "Vista".
 * A abertura toca só na 1ª carga da home na sessão (decisão do Gabriel, 19/11); nas cargas
 * seguintes a home vem pronta e só a tinta do "Vista" toca. Chegando à home por um link
 * (inclusive o logo da barra, pedido de 18/11), tudo já aparece pronto.
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
 * Antes da 1ª pintura: na 1ª carga da sessão marca a abertura e trava a rolagem (o gutter fica,
 * para a página não mudar de largura ao destravar); nas seguintes, marca direto a tinta. Sem
 * sessionStorage (navegação privada antiga), a abertura toca como antes. Com movimento reduzido, nada.
 */
export const SCRIPT_CARGA = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement,k="whim-abertura",v=null;try{v=sessionStorage.getItem(k);sessionStorage.setItem(k,"1")}catch(e){}if(v){h.dataset.intro="tinta"}else{h.dataset.intro="abertura";h.style.overflow="hidden";h.style.scrollbarGutter="stable"}}}catch(e){}})()`;

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
