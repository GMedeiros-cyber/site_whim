// Navegação global do site: a mesma lista no header e no rodapé de todas as páginas.

export type ItemNav = {
  label: string;
  href: string;
  /** Some do desktop estreito (601 a 820px); continua no menu do celular. */
  opcional?: boolean;
};

/** Links do header (seções da home). Fora da home, levam à home na seção certa. */
export const NAVEGACAO: ItemNav[] = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/#sobre", opcional: true },
  { label: "Serviços", href: "/#servicos", opcional: true },
  { label: "Processo", href: "/#processo", opcional: true },
  { label: "Clientes", href: "/#clientes" },
];

/** Botão de ação do header. */
export const ACAO: ItemNav = { label: "Monte sua peça", href: "/monte-sua-peca" };
