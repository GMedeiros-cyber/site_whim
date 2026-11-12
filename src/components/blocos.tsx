import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rótulo pequeno em caixa-alta com o traço turquesa antes. */
export function Eyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[11.5px] font-medium uppercase tracking-[0.22em] text-muted-foreground before:h-px before:w-[22px] before:bg-accent",
        className
      )}
      {...props}
    />
  );
}

/** Título de seção (h2 por padrão; h1 no topo das páginas internas). */
export function Titulo({
  as: Tag = "h2",
  className,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h1" | "h2" }) {
  return (
    <Tag
      className={cn(
        "mt-4 text-[clamp(1.625rem,4.2vw,2.875rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-balance",
        className
      )}
      {...props}
    />
  );
}

/** Trecho destacado com o marca-texto turquesa. */
export function Destaque({
  className,
  ...props
}: React.ComponentProps<"em">) {
  return (
    <em
      className={cn(
        "rounded-[2px] bg-linear-to-b from-transparent from-70% to-accent/40 to-70% px-[0.06em] not-italic",
        className
      )}
      {...props}
    />
  );
}

/** Largura máxima e respiro lateral das seções. */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1180px] px-5", className)}
      {...props}
    />
  );
}

/** Respiro vertical padrão das seções (âncoras param abaixo do header fixo). */
export const secao = "scroll-mt-24 py-14 sm:py-[clamp(72px,10vw,128px)]";

/** Seta dos botões; anda um pouco quando o botão recebe hover. */
export function Seta() {
  return (
    <ArrowRightIcon
      data-icon="inline-end"
      className="transition-transform motion-safe:group-hover/button:translate-x-1"
    />
  );
}
