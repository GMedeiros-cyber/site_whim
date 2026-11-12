import Image from "next/image";
import Link from "next/link";
import { PanelTopIcon, PrinterIcon, ScissorsIcon, ShirtIcon } from "lucide-react";

import { Container, Destaque, Eyebrow, Seta, Titulo, secao } from "@/components/blocos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type ItemNav } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS: ItemNav[] = [
  { label: "Início", href: "#topo" },
  { label: "Sobre", href: "#sobre", opcional: true },
  { label: "Serviços", href: "#servicos", opcional: true },
  { label: "Processo", href: "#processo", opcional: true },
  { label: "Clientes", href: "#clientes" },
];

const TAGS = ["Silk screen", "DTF", "Bordado", "Confecção", "Uniformes", "Oficina própria"];

const SERVICOS = [
  { Icone: PanelTopIcon, nome: "Silk screen", texto: "Para tiragens maiores e cores chapadas, com o toque e a durabilidade da tinta na tela." },
  { Icone: PrinterIcon, nome: "DTF", texto: "Para artes com muitas cores, degradês e pedidos menores, com acabamento fotográfico." },
  { Icone: ScissorsIcon, nome: "Confecção", texto: "Modelagem, corte e costura da peça do zero, no tecido e no tamanho que você precisar." },
  { Icone: ShirtIcon, nome: "Uniformes", texto: "Para empresas e escolas, com padrão de cor, logo bordado ou estampado e reposição fácil." },
];

const PASSOS = [
  { nome: "Monte a peça", texto: "Escolha peça, cor e estampa aqui no site." },
  { nome: "Orçamento", texto: "O resumo chega para a equipe no WhatsApp." },
  { nome: "Arte aprovada", texto: "Ajustamos a arte e enviamos para você aprovar." },
  { nome: "Produção", texto: "Gravação da tela, impressão e acabamento." },
  { nome: "Entrega", texto: "Retirada em Guarulhos ou envio." },
];

// null = espaço reservado para o logo de um cliente (ainda não temos os arquivos).
const MARCAS = ["Globo", "Lollapalooza", null, null, null, null];

export default function Home() {
  return (
    <>
      <SiteHeader links={LINKS} cta={{ label: "Monte sua peça", href: "/monte-sua-peca" }} />
      <main className="flex-1">
        <Hero />
        <QuemSomos />
        <OQueFazemos />
        <ComoFunciona />
        <Clientes />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section id="topo" className="p-2 sm:p-3">
      <div className="relative isolate grid min-h-[calc(100svh-1rem)] grid-rows-[auto_1fr_auto_auto] gap-5 overflow-hidden rounded-3xl p-5 pt-22 text-primary-foreground md:min-h-[min(94vh,860px)] md:grid-cols-2 md:grid-rows-[1fr_auto] md:gap-0 md:rounded-[30px] md:p-[clamp(22px,4vw,48px)] md:pt-[clamp(110px,14vw,150px)]">
        <Image
          src="/images/hero.webp"
          alt="Mãos passando o rodo na tela de serigrafia"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover object-[center_40%] motion-safe:animate-hero-zoom"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-200 from-primary/5 from-20% via-primary/35 via-55% to-primary/90" />

        <div className="row-start-1 grid gap-2 self-start rounded-[20px] border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3.5 backdrop-blur-md md:col-start-2 md:max-w-[300px] md:justify-self-end md:px-5 md:py-[18px]">
          <Eyebrow className="text-primary-foreground/85">Silk · DTF · Confecção</Eyebrow>
          <p className="text-sm text-primary-foreground/90">
            Peças para empresas, escolas e eventos, feitas numa oficina própria em Guarulhos.
          </p>
        </div>

        <span className="absolute top-1/2 left-[clamp(14px,2vw,24px)] hidden -translate-y-1/2 rotate-180 text-[11px] tracking-[0.28em] text-primary-foreground/60 uppercase [writing-mode:vertical-rl] md:block">
          Guarulhos · SP · desde 2021
        </span>

        <h1 className="row-start-3 self-end text-[clamp(2rem,9.4vw,2.75rem)] leading-[1.06] font-bold tracking-[-0.025em] text-balance md:col-start-1 md:row-start-2 md:text-[clamp(2.125rem,4.7vw,4.25rem)]">
          Cada peça passa
          <br />
          pelas <em className="text-accent not-italic">nossas mãos.</em>
        </h1>

        <div className="row-start-4 grid justify-items-start gap-4 self-end md:col-start-2 md:row-start-2 md:max-w-[300px] md:justify-self-end">
          <p className="text-[14.5px] text-primary-foreground/85">
            Monte sua peça no site e receba o orçamento direto no WhatsApp.
          </p>
          <Link href="/monte-sua-peca" className={cn(buttonVariants({ variant: "secondary", size: "xl" }), "w-full sm:w-auto")}>
            Monte sua peça <Seta />
          </Link>
        </div>

        <span className="absolute bottom-[18px] left-1/2 hidden -translate-x-1/2 text-[10.5px] tracking-[0.24em] text-primary-foreground/55 uppercase md:block">
          role para conhecer
        </span>
      </div>
    </section>
  );
}

/** Foto em pílula no meio do texto do manifesto. */
function Chip({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative mx-[0.08em] inline-block h-[1em] w-[1.9em] overflow-hidden rounded-full align-[-0.08em] transition-[width] duration-600 motion-safe:hover:w-[2.8em]">
      <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
    </span>
  );
}

function QuemSomos() {
  return (
    <section id="sobre" className={secao}>
      <Container>
        <Eyebrow>Quem somos</Eyebrow>
        <p className="mt-[22px] max-w-[34ch] text-[clamp(1.3125rem,5.6vw,1.625rem)] leading-[1.3] font-medium tracking-[-0.02em] text-pretty sm:text-[clamp(1.375rem,3.8vw,2.75rem)]">
          Fundada em 2021 por Wallan, depois de 15 anos de experiência, a Whim{" "}
          <Chip src="/images/f42.webp" alt="Camisas azuis na mesa de silk" /> grava telas,{" "}
          <Chip src="/images/f35.webp" alt="Camisetas pretas na mesa de estampa" /> corta, costura e estampa peças
          para empresas, escolas e eventos, <Destaque>tudo na mesma oficina</Destaque>{" "}
          <Chip src="/images/f41.webp" alt="Estampador trabalhando na mesa" /> em Guarulhos.
        </p>
        <ul className="mt-9 flex flex-wrap gap-2.5">
          {TAGS.map((t) => (
            <li key={t}>
              <Badge variant="outline" className="h-auto px-3.5 py-2 tracking-[0.06em]">
                {t}
              </Badge>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function OQueFazemos() {
  return (
    <section id="servicos" className={cn(secao, "pt-0 sm:pt-0")}>
      <Container>
        <Eyebrow>O que fazemos</Eyebrow>
        <Titulo>
          Quatro jeitos de <Destaque>vestir sua marca.</Destaque>
        </Titulo>
        <div className="mt-7 grid gap-x-[clamp(24px,5vw,72px)] sm:mt-11 md:grid-cols-2">
          {SERVICOS.map(({ Icone, nome, texto }) => (
            <article key={nome} className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1.5 border-t py-5 sm:py-[26px]">
              <Icone aria-hidden strokeWidth={1.4} className="row-span-2 size-7 self-start text-accent" />
              <h3 className="text-2xl leading-[1.15] font-semibold">{nome}</h3>
              <p className="col-start-2 text-[14.5px] text-muted-foreground">{texto}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="processo" className={cn(secao, "bg-muted")}>
      <Container>
        <Eyebrow>Como funciona</Eyebrow>
        <Titulo>
          Do pedido <Destaque>à entrega.</Destaque>
        </Titulo>
        <ol className="relative mt-12 grid gap-6 min-[480px]:grid-cols-2 min-[901px]:grid-cols-5 min-[901px]:gap-4 min-[901px]:before:absolute min-[901px]:before:inset-x-0 min-[901px]:before:top-[19px] min-[901px]:before:h-px min-[901px]:before:bg-border">
          {PASSOS.map((p, i) => (
            <li key={p.nome} className="relative grid content-start gap-2.5">
              <span aria-hidden className="grid size-[38px] place-items-center rounded-full border bg-background text-[13px] font-semibold tabular-nums">
                {i + 1}
              </span>
              <h3 className="text-[19px] leading-[1.15] font-semibold">{p.nome}</h3>
              <p className="text-[13.5px] text-muted-foreground">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function ListaMarcas({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("flex shrink-0 items-center gap-16 pr-16 motion-reduce:flex-wrap motion-reduce:gap-y-6", className)} {...props}>
      {MARCAS.map((m, i) =>
        m ? (
          <li key={i} className="flex items-center gap-16 text-[clamp(1.25rem,2.6vw,1.875rem)] font-semibold whitespace-nowrap text-muted-foreground after:size-[7px] after:rounded-full after:bg-accent">
            {m}
          </li>
        ) : (
          <li key={i} className="rounded-[10px] border border-dashed px-[22px] py-3.5 text-xs tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase">
            logo do cliente
          </li>
        )
      )}
    </ul>
  );
}

function Clientes() {
  return (
    <section id="clientes" className={secao}>
      <Container>
        <Eyebrow>Quem já vestiu Whim</Eyebrow>
        <Titulo>
          Peças que <Destaque>já rodaram por aí.</Destaque>
        </Titulo>

        <div className="mt-9 grid grid-cols-2 gap-3.5 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[22px] bg-muted md:col-span-1 md:aspect-auto">
            <Image src="/images/f17.webp" alt="Camisetas pretas estampadas para cliente" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-[center_60%]" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-muted">
            <Image src="/images/f35.webp" alt="Mesa de estampa com camisetas pretas" fill sizes="(min-width: 768px) 30vw, 50vw" className="object-cover" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-muted">
            <Image src="/images/f42.webp" alt="Camisas azuis na mesa de silk" fill sizes="(min-width: 768px) 30vw, 50vw" className="object-cover" />
          </div>
        </div>

        {/* Carrossel de marcas: duas cópias da lista para o loop não ter emenda. */}
        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]">
          <div className="flex w-max motion-safe:animate-marquee motion-safe:hover:[animation-play-state:paused] motion-reduce:w-auto">
            <ListaMarcas aria-label="Marcas atendidas" />
            <ListaMarcas aria-hidden className="motion-reduce:hidden" />
          </div>
        </div>

        <div className="mt-[clamp(64px,9vw,110px)] grid items-end gap-7 rounded-[22px] bg-primary px-6 py-8 text-primary-foreground sm:rounded-[28px] sm:p-[clamp(36px,6vw,72px)] md:grid-cols-[1.3fr_0.7fr]">
          <div>
            <Titulo className="mt-0">
              Sua próxima peça
              <br />
              <em className="text-accent not-italic">começa aqui.</em>
            </Titulo>
            <p className="mt-3.5 text-primary-foreground/75">
              Escolha o modelo, a cor e a estampa. O orçamento chega no seu WhatsApp.
            </p>
          </div>
          <Link href="/monte-sua-peca" className={cn(buttonVariants({ variant: "secondary", size: "xl" }), "justify-self-start md:justify-self-end")}>
            Monte sua peça <Seta />
          </Link>
        </div>
      </Container>
    </section>
  );
}
