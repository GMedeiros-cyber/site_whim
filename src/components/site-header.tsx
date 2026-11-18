"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

import { LinkNav, useAtivo } from "@/components/link-nav";
import { faseIntro, pedirIntro } from "@/lib/abertura";
import { ACAO, NAVEGACAO, type ItemNav } from "@/lib/navegacao";
import { cn } from "@/lib/utils";

export type { ItemNav };

const MENU_ID = "menu-principal";

/**
 * Header flutuante, o mesmo em todas as páginas (lista em src/lib/navegacao.ts).
 * Desktop: símbolo + links + botão de ação.
 * Celular (até 600px): símbolo + escrita WHIM e botão "Menu", que abre um
 * popover nativo (fecha ao tocar fora e com Esc; ao escolher, fechamos aqui).
 * Some ao rolar para baixo e volta ao rolar para cima; perto do topo, com o menu aberto
 * ou com o foco dentro dela fica sempre à vista (com movimento reduzido, sem deslizar).
 * O logo recomeça a entrada da home (src/lib/abertura.ts).
 */
export function SiteHeader({
  links = NAVEGACAO,
  cta = ACAO,
}: { links?: ItemNav[]; cta?: ItemNav } = {}) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [descendo, setDescendo] = useState(false);
  // Seção da home em que a pessoa está (ou a que ela acabou de clicar): marca o link na barra.
  const [secao, setSecao] = useState<string | null>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  // Depois de um clique, a pílula fica no link clicado até a rolagem suave terminar (sem
  // passar pelas seções do meio).
  const travaRef = useRef(0);
  const [pilula, setPilula] = useState<{ left: number; width: number } | null>(null);
  const naHome = pathname === "/";
  const hrefAtivo = naHome ? (secao ?? "/") : null;
  const ctaAtivo = useAtivo(cta.href);
  const fechar = () => menuRef.current?.hidePopover();
  // O botão de ação entra no menu, a não ser que já leve a uma seção listada.
  const itensMenu = links.some((l) => l.href === cta.href)
    ? links
    : [...links, cta];

  // Direção da rolagem, lida uma vez por quadro. Movimentos pequenos (menos de 8 px desde a
  // última troca) não mudam nada, para a barra não piscar com o dedo parado.
  useEffect(() => {
    let ultimo = window.scrollY;
    let raf = 0;
    const ler = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < 80) setDescendo(false);
      else if (y > ultimo + 8) setDescendo(true);
      else if (y < ultimo - 8) setDescendo(false);
      else return;
      ultimo = y;
    };
    const aoRolar = () => {
      raf ||= requestAnimationFrame(ler);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Na home, a seção que cruza a linha de 55% da tela define o link marcado.
  useEffect(() => {
    if (!naHome) return;
    const ids = links.map((l) => (l.href === "/" ? "topo" : l.href.split("#")[1])).filter(Boolean);
    let raf = 0;
    const ler = () => {
      raf = 0;
      if (performance.now() < travaRef.current) return;
      const linha = window.innerHeight * 0.55;
      let atual = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= linha) atual = id;
      }
      setSecao(atual === "topo" ? "/" : `/#${atual}`);
    };
    const aoRolar = () => {
      raf ||= requestAnimationFrame(ler);
    };
    // Fim da rolagem suave: solta a trava e lê a seção de novo.
    const aoParar = () => {
      travaRef.current = 0;
      aoRolar();
    };
    ler();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("scrollend", aoParar);
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("scrollend", aoParar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, [naHome, links]);

  // Posição da pílula: medida no link marcado, dentro da lista (o zoom das telas grandes
  // vale para os dois, então as medidas batem).
  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const medir = () => {
      const a = hrefAtivo ? lista.querySelector<HTMLElement>(`a[data-href="${hrefAtivo}"]`) : null;
      const li = a?.parentElement;
      setPilula(li && li.offsetWidth ? { left: li.offsetLeft, width: li.offsetWidth } : null);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(lista);
    return () => ro.disconnect();
  }, [hrefAtivo]);

  return (
    <header
      data-oculta={(descendo && !aberto) || undefined}
      className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex justify-center transition-transform duration-300 ease-out data-oculta:not-focus-within:-translate-y-[calc(100%+2rem)] motion-reduce:transition-none min-[601px]:top-4 min-[1800px]:[zoom:1.2] min-[2400px]:[zoom:1.5]"
    >
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto flex w-full items-center justify-between gap-1 rounded-full border border-primary/10 bg-background/90 p-1.5 shadow-[0_10px_40px_-18px] shadow-primary/40 backdrop-blur-xl backdrop-saturate-150 min-[601px]:w-auto min-[601px]:gap-1.5 min-[601px]:p-2"
      >
        <LinkNav
          href="/"
          onClick={(e) => {
            const naHome = pathname === "/";
            pedirIntro(naHome);
            if (naHome && faseIntro()) {
              // A abertura cobre a tela: rola ao topo na hora, sem a rolagem suave.
              e.preventDefault();
              window.history.replaceState(window.history.state, "", "/");
              window.scrollTo({ top: 0, behavior: "instant" });
            }
          }}
          aria-label="Whim Confecção e Estamparia, página inicial"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full"
        >
          <Image
            src="/brand/whim-simbolo.webp"
            alt=""
            width={48}
            height={48}
            className="size-10 rounded-full bg-background p-1 transition-transform duration-500 motion-safe:hover:-rotate-12 min-[601px]:size-12"
          />
          <Image
            src="/brand/whim-escrita.svg"
            alt=""
            width={302}
            height={138}
            className="h-[34px] w-auto min-[601px]:hidden"
          />
        </LinkNav>

        {/* Desktop */}
        <ul ref={listaRef} className="relative hidden min-[601px]:flex min-[601px]:gap-0.5">
          {/* Pílula turquesa clara atrás do link da seção atual; desliza de um link para o outro. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 rounded-full bg-accent/16 transition-[left,width,opacity] duration-200 ease-out motion-reduce:transition-none",
              pilula ? "opacity-100" : "opacity-0"
            )}
            style={pilula ? { left: pilula.left, width: pilula.width } : undefined}
          />
          {links.map((l) => {
            const marcado = hrefAtivo === l.href;
            return (
              <li key={l.href} className={cn(l.opcional && "hidden min-[821px]:block")}>
                <LinkNav
                  href={l.href}
                  data-href={l.href}
                  aria-current={marcado ? "location" : undefined}
                  onClick={() => {
                    if (!naHome) return;
                    travaRef.current = performance.now() + 1200; // sem scrollend (Safari antigo)
                    setSecao(l.href);
                  }}
                  className={cn(
                    "block rounded-full px-4 py-3 text-[15px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                    marcado && "font-semibold text-foreground"
                  )}
                >
                  {l.label}
                </LinkNav>
              </li>
            );
          })}
        </ul>
        <LinkNav
          href={cta.href}
          aria-current={ctaAtivo ? "page" : undefined}
          className={cn(
            "hidden rounded-full bg-primary px-[22px] py-[13px] text-[15px] font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 min-[601px]:block",
            // Ativo: anel turquesa por dentro, discreto.
            ctaAtivo && "inset-ring-2 inset-ring-accent"
          )}
        >
          {cta.label}
        </LinkNav>

        {/* Celular */}
        <button
          type="button"
          popoverTarget={MENU_ID}
          aria-controls={MENU_ID}
          aria-expanded={aberto}
          className="flex min-h-11 items-center gap-2.5 rounded-full bg-primary pr-[18px] pl-4 text-sm font-semibold text-primary-foreground min-[601px]:hidden"
        >
          {aberto ? <XIcon aria-hidden className="size-[18px]" /> : <MenuIcon aria-hidden className="size-[18px]" />}
          {aberto ? "Fechar" : "Menu"}
        </button>
        <div
          ref={menuRef}
          id={MENU_ID}
          popover="auto"
          onToggle={(e) => setAberto(e.newState === "open")}
          className="inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] bottom-auto m-0 h-auto max-h-[calc(100svh-6rem)] w-auto overflow-y-auto rounded-3xl border bg-background p-2 text-foreground shadow-[0_18px_50px_-20px] shadow-primary/45 min-[601px]:hidden"
        >
          <ul className="flex flex-col gap-0.5">
            {itensMenu.map((l) => {
              const ativo = l.href === cta.href && ctaAtivo;
              return (
                <li key={l.href}>
                  <LinkNav
                    href={l.href}
                    onClick={fechar}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-2.5 rounded-2xl px-[18px] text-base font-medium transition-colors hover:bg-accent/15",
                      ativo && "bg-accent/15 font-semibold"
                    )}
                  >
                    {ativo && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
                    {l.label}
                  </LinkNav>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
