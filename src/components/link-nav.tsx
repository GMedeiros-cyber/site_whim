"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { rolarPara } from "@/lib/rolagem";

/**
 * Link da navegação global. Na home, "Início" (/) e "/#secao" rolam até a seção por
 * src/lib/rolagem.ts (o Link do Next não rola quando o endereço já é o mesmo). Fora da home,
 * os mesmos hrefs levam para a home na seção certa.
 */
export function LinkNav({
  href,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || pathname !== "/") return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // nova aba
        if ((href === "/" || href.startsWith("/#")) && rolarPara(href)) e.preventDefault();
      }}
      {...props}
    />
  );
}

/** Indica se o href é a página aberta (só para rotas, não para âncoras). */
export function useAtivo(href: string) {
  const pathname = usePathname();
  return !href.includes("#") && href !== "/" && pathname === href;
}
