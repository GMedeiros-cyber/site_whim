// Rolagem das âncoras da home ("/", "/#sobre"...) feita aqui, e não pelo Link do Next:
// o Link não rola quando o endereço já é o mesmo (ex.: voltou ao topo com "Início" e clicou
// em "Sobre" de novo) e a barra precisa saber para onde a página está indo.
//
// Enquanto a rolagem suave vai até a seção clicada, a barra fica "travada" nela (não passa
// pelas seções do meio). A trava sai quando a página chega, quando a pessoa mexe na rolagem
// (roda do mouse, toque, teclado) ou, no máximo, depois de 1,5 s.

type Trava = { href: string; el: HTMLElement | null; ate: number };

let trava: Trava | null = null;

/** href da seção para onde a página está rolando por clique, ou null. */
export function destinoTravado(): string | null {
  if (!trava) return null;
  if (performance.now() > trava.ate || chegou(trava)) trava = null;
  return trava?.href ?? null;
}

export function soltarTrava() {
  trava = null;
}

function chegou(t: Trava) {
  if (!t.el) return window.scrollY <= 2;
  const margem = parseFloat(getComputedStyle(t.el).scrollMarginTop) || 0;
  const top = t.el.getBoundingClientRect().top;
  const fim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  return Math.abs(top - margem) < 6 || (fim && top > 0);
}

/** id da seção de um href da home ("/" → topo). */
export function idDaSecao(href: string) {
  return href === "/" ? "topo" : href.split("#")[1] || null;
}

/**
 * Rola até a seção do href e atualiza o endereço. Devolve false se a seção não existe na
 * página (aí o Link segue o caminho normal).
 */
export function rolarPara(href: string): boolean {
  const id = idDaSecao(href);
  const el = href === "/" ? null : id ? document.getElementById(id) : null;
  if (href !== "/" && !el) return false;

  const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = suave ? "smooth" : "instant";
  trava = { href, el, ate: performance.now() + 1500 };
  if (el) el.scrollIntoView({ behavior, block: "start" });
  else window.scrollTo({ top: 0, behavior });
  // O Next acompanha o replaceState do navegador (o usePathname continua certo).
  window.history.replaceState(window.history.state, "", href);
  return true;
}
