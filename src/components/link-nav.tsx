"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link da navegação global. Na home, "Início" (/) volta ao topo com a rolagem
 * suave do site (o Link sozinho mantém a posição); "/#secao" rola até a seção.
 * Fora da home, os mesmos hrefs levam para a home na seção certa.
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
        if (href === "/" && pathname === "/" && !e.defaultPrevented) {
          e.preventDefault();
          window.history.replaceState(window.history.state, "", "/");
          window.scrollTo({ top: 0 });
        }
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
