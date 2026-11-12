"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ItemNav = {
  label: string;
  href: string;
  /** Some do desktop estreito (601 a 820px); continua no menu do celular. */
  opcional?: boolean;
};

const MENU_ID = "menu-principal";

/**
 * Header flutuante. Desktop: símbolo + links + botão de ação.
 * Celular (até 600px): símbolo + escrita WHIM e botão "Menu", que abre um
 * popover nativo (fecha ao tocar fora e com Esc; ao escolher, fechamos aqui).
 */
export function SiteHeader({ links, cta }: { links: ItemNav[]; cta: ItemNav }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const fechar = () => menuRef.current?.hidePopover();
  // O botão de ação entra no menu, a não ser que já leve a uma seção listada.
  const itensMenu = links.some((l) => l.href === cta.href)
    ? links
    : [...links, cta];

  return (
    <header className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex justify-center min-[601px]:top-4">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto flex w-full items-center justify-between gap-1 rounded-full border border-primary/10 bg-background/60 p-1.5 shadow-[0_10px_40px_-18px] shadow-primary/40 backdrop-blur-xl backdrop-saturate-150 min-[601px]:w-auto min-[601px]:gap-1.5 min-[601px]:p-2"
      >
        <Link
          href="/"
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
        </Link>

        {/* Desktop */}
        <ul className="hidden min-[601px]:flex min-[601px]:gap-0.5">
          {links.map((l) => (
            <li key={l.href} className={cn(l.opcional && "hidden min-[821px]:block")}>
              <Link
                href={l.href}
                className="block rounded-full px-4 py-3 text-[15px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={cta.href}
          className="hidden rounded-full bg-primary px-[22px] py-[13px] text-[15px] font-semibold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/85 min-[601px]:block"
        >
          {cta.label}
        </Link>

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
            {itensMenu.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={fechar}
                  className="flex min-h-12 items-center rounded-2xl px-[18px] text-base font-medium transition-colors hover:bg-accent/15"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
