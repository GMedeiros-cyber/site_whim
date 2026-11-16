import Image from "next/image";
import Link from "next/link";

import { Container, Destaque, Eyebrow, Seta, Titulo, secao } from "@/components/blocos";
import { Carrossel } from "@/components/home/carrossel";
import { Etapas } from "@/components/home/etapas";
import { PalavraTinta } from "@/components/home/palavra-tinta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { ACAO } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const WHATSAPP_ORCAMENTO = linkWhatsApp("Olá, Whim! Quero um orçamento.");

const botaoClaro = cn(buttonVariants({ variant: "secondary", size: "xl" }), "w-full sm:w-auto");
const botaoContorno = cn(
  buttonVariants({ size: "xl" }),
  "w-full border-primary-foreground/40 bg-transparent hover:border-accent hover:bg-primary-foreground/10 sm:w-auto"
);

const TECNICAS_TOPO = ["Silk", "DTF", "Bordado", "Sublimação"];

const OFICINA = [
  { nome: "Gravação de telas", texto: "A arte vira tela para o silk." },
  { nome: "Corte e costura", texto: "A peça nasce do tecido." },
  { nome: "Estampa", texto: "Silk, DTF, bordado ou sublimação." },
  { nome: "Acabamento", texto: "Conferência e embalagem." },
];

const FOTOS = [
  { src: "/images/f41.webp", alt: "Estampador trabalhando na mesa longa com peças azuis", legenda: "Estampa em série na mesa longa" },
  { src: "/images/hero.webp", alt: "Mãos passando o rodo na tela de silk", legenda: "Rodo na tela de silk" },
  { src: "/images/f35.webp", alt: "Camisetas pretas estampadas na mesa", legenda: "Peças na mesa de estampa" },
];

// Imagens geradas por IA: sempre com o selo "Imagem ilustrativa".
const TECNICAS = [
  {
    nome: "Silk",
    imagem: "silk",
    alt: "Estampa em silk com cores chapadas numa camiseta azul-marinho",
    texto: "Tinta grossa em cores chapadas, com o toque e a durabilidade da tinta na tela.",
    bomPara: "logos de poucas cores e tiragens maiores.",
  },
  {
    nome: "DTF",
    imagem: "dtf",
    alt: "Estampa colorida em DTF com degradê numa camiseta branca",
    texto: "Todas as cores, degradês e fotos, com acabamento fotográfico.",
    bomPara: "artes coloridas e pedidos menores.",
  },
  {
    nome: "Bordado",
    imagem: "bordado",
    alt: "Logo bordado em linha numa polo azul-marinho",
    texto: "A arte é costurada em linha, em relevo, e dura junto com a peça.",
    bomPara: "logo no peito de polos e uniformes.",
  },
  {
    nome: "Sublimação",
    imagem: "sublimacao",
    alt: "Camiseta esportiva com estampa de sublimação na peça inteira",
    texto: "A tinta entra no tecido e pode cobrir a peça inteira, sem relevo.",
    bomPara: "peças esportivas claras de poliéster.",
  },
];

const TAMBEM = [
  { nome: "Confecção", texto: "Modelagem, corte e costura da peça do zero, no tecido e no tamanho que você precisar." },
  { nome: "Uniformes", texto: "Para empresas e escolas, com padrão de cor, logo bordado ou estampado e reposição fácil." },
  { nome: "Não sabe qual?", texto: "Mande a arte: a equipe indica a técnica que fica melhor." },
];

// null = espaço reservado para o logo de um cliente (ainda não temos os arquivos).
const MARCAS = ["Globo", "Lollapalooza", null, null, null, null];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Topo />
        <QuemSomos />
        <OQueFazemos />
        <ComoFunciona />
        <Clientes />
        <Convite />
      </main>
      <SiteFooter />
    </>
  );
}

function Topo() {
  return (
    <section id="topo" className="p-2 md:p-3">
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-primary px-5 pt-28 pb-24 text-center text-primary-foreground md:min-h-[min(880px,calc(100svh-1.5rem))] md:rounded-[32px] md:px-10 md:pt-32 md:pb-28">
        <Image
          src="/images/hero-mesa.webp"
          alt="Mesa longa de silk com peças estampadas em série na oficina da Whim"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover object-[center_40%] grayscale-35"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-radial-[120%_90%_at_50%_45%] from-primary/60 via-primary/86 via-60% to-primary/97"
        />

        <Image
          src="/brand/whim-logo-branco.svg"
          alt="Whim Confecção e Estamparia"
          width={444}
          height={138}
          loading="eager"
          className="h-[42px] w-auto opacity-95 md:h-[58px]"
        />
        <h1 className="mt-1.5">
          <PalavraTinta>Vista</PalavraTinta>{" "}
          <span className="mt-1.5 block text-[28px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance md:text-[40px]">
            a sua marca, peça por peça.
          </span>
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-pretty text-primary-foreground/80 md:text-base">
          Uniformes, camisetas e peças com a sua marca. Silk, DTF, bordado e sublimação numa
          oficina própria em Guarulhos.
        </p>
        <div className="mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <a href={WHATSAPP_ORCAMENTO} className={botaoClaro}>
            Pedir orçamento no WhatsApp <Seta />
          </a>
          <a href="#servicos" className={botaoContorno}>
            Ver o que fazemos
          </a>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-center justify-center text-xs md:inset-x-10 md:bottom-[30px] md:justify-between">
          <ul aria-label="Técnicas" className="flex flex-wrap justify-center gap-2">
            {TECNICAS_TOPO.map((t) => (
              <li key={t} className="rounded-full border border-primary-foreground/22 px-3 py-[7px] text-primary-foreground/85">
                {t}
              </li>
            ))}
          </ul>
          <span className="hidden text-primary-foreground/65 md:block">role para conhecer</span>
        </div>
      </div>
    </section>
  );
}

function QuemSomos() {
  return (
    <section id="sobre" className={secao}>
      <Container className="grid gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16 lg:gap-y-9">
        <div className="lg:self-end">
          <Eyebrow>Quem somos</Eyebrow>
          <Titulo className="max-w-[13ch]">
            Uma oficina, <Destaque>do fio à estampa.</Destaque>
          </Titulo>
          <p className="mt-[18px] max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px]">
            A Whim nasceu em 2021, quando o Wallan juntou 15 anos de experiência numa oficina
            própria em Guarulhos. Hoje a gente faz peças para empresas, escolas e eventos com todas
            as etapas no mesmo lugar.
          </p>
        </div>

        {/* Mosaico no PC e no tablet; carrossel no celular. */}
        <div className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <Carrossel
            rotulo="Fotos da oficina"
            className="gap-3 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:grid-rows-[260px_260px] md:gap-4"
          >
            {FOTOS.map((f, i) => (
              <figure
                key={f.src}
                className={cn(
                  "relative h-80 w-[80%] shrink-0 snap-start overflow-hidden rounded-[24px] bg-muted md:h-auto md:w-auto",
                  i === 0 && "md:row-span-2"
                )}
              >
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  sizes="(min-width: 1024px) 340px, (min-width: 768px) 50vw, 80vw"
                  className="object-cover"
                />
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1.5 text-xs text-foreground">
                  {f.legenda}
                </figcaption>
              </figure>
            ))}
          </Carrossel>
          <span className="absolute top-4 left-4 hidden rounded-2xl bg-primary px-4 py-3 text-[13px] font-medium text-primary-foreground shadow-[0_16px_30px_-18px] shadow-primary/60 md:block lg:top-7 lg:-left-[22px]">
            Oficina própria · Guarulhos/SP
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-x-[18px] gap-y-4 sm:gap-x-7 sm:gap-y-[22px] lg:col-start-1 lg:self-start">
          {OFICINA.map((etapa) => (
            <li key={etapa.nome} className="flex flex-col gap-1 border-t pt-3.5">
              <span className="text-base font-semibold">{etapa.nome}</span>
              <span className="text-sm leading-normal text-muted-foreground">{etapa.texto}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function OQueFazemos() {
  return (
    <section id="servicos" className={cn(secao, "bg-muted")}>
      <Container>
        <Eyebrow>O que fazemos</Eyebrow>
        <Titulo>
          Quatro jeitos de <Destaque>estampar sua marca.</Destaque>
        </Titulo>
        <p className="mt-[18px] max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px]">
          Cada técnica deixa a arte de um jeito. Veja como fica cada uma e para o que ela é melhor.
        </p>

        <div className="mt-9 md:mt-14">
          <Carrossel
            rotulo="Técnicas de estampa"
            className="gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-4"
          >
            {TECNICAS.map((t) => (
              <article
                key={t.nome}
                className="flex w-[76%] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border border-primary/6 bg-background md:w-auto"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={`/images/estilos/${t.imagem}.webp`}
                    alt={t.alt}
                    fill
                    sizes="(min-width: 1024px) 270px, (min-width: 768px) 45vw, 76vw"
                    className="object-cover"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-[5px] text-[11px] text-foreground">
                    Imagem ilustrativa
                  </span>
                </div>
                <div className="flex flex-col gap-2 px-[22px] pt-[22px] pb-6">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">{t.nome}</h3>
                  <p className="text-[14.5px] leading-[1.55] text-muted-foreground">{t.texto}</p>
                  <p className="mt-1.5 text-[13px] leading-normal">
                    <strong className="font-semibold">Bom para:</strong> {t.bomPara}
                  </p>
                </div>
              </article>
            ))}
          </Carrossel>
        </div>

        <div className="mt-3 grid gap-3 md:mt-5 md:grid-cols-3 md:gap-5">
          {TAMBEM.map((item, i) => {
            const destaque = i === TAMBEM.length - 1;
            return (
              <div
                key={item.nome}
                className={cn(
                  "rounded-[22px] border border-primary/6 bg-background px-5 py-[18px] md:p-[26px]",
                  destaque && "border-transparent bg-primary text-primary-foreground"
                )}
              >
                <h3 className="text-lg font-semibold md:mb-1.5 md:text-xl">{item.nome}</h3>
                <p className={cn("text-[14.5px] leading-[1.55] text-muted-foreground", destaque && "text-primary-foreground/80")}>
                  {item.texto}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="processo" className={secao}>
      <Container>
        <Eyebrow>Como funciona</Eyebrow>
        <Titulo>
          Do pedido <Destaque>à entrega.</Destaque>
        </Titulo>
        <div className="mt-10 lg:mt-16">
          <Etapas />
        </div>
      </Container>
    </section>
  );
}

function ListaMarcas({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "flex shrink-0 items-center gap-7 pr-7 sm:gap-14 sm:pr-14 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-5 motion-reduce:px-5",
        className
      )}
      {...props}
    >
      {MARCAS.map((m, i) =>
        m ? (
          <li
            key={i}
            className="flex items-center gap-7 text-2xl font-semibold tracking-[-0.02em] whitespace-nowrap text-muted-foreground after:size-2 after:rounded-full after:bg-accent sm:gap-14 sm:text-[34px]"
          >
            {m}
          </li>
        ) : (
          <li
            key={i}
            className="rounded-xl border border-dashed border-primary/28 px-6 py-4 text-[13px] whitespace-nowrap text-muted-foreground"
          >
            logo do cliente
          </li>
        )
      )}
    </ul>
  );
}

function Clientes() {
  return (
    <section id="clientes" className={cn(secao, "bg-muted")}>
      <Container>
        <Eyebrow>Quem já vestiu Whim</Eyebrow>
        <Titulo>
          Marcas que <Destaque>confiam na oficina.</Destaque>
        </Titulo>
      </Container>

      {/* De ponta a ponta da tela; pausa com o mouse em cima ou com foco.
          Cada metade tem a lista duas vezes para cobrir telas largas sem emenda. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Clientes da Whim (o carrossel pausa com o foco)"
        className="group mt-10 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:mt-[52px]"
      >
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] motion-reduce:[mask-image:none]">
          <div
            style={{ animationDuration: "28s" }}
            className="flex w-max group-hover:[animation-play-state:paused] group-focus:[animation-play-state:paused] motion-safe:animate-marquee motion-reduce:w-auto"
          >
            <ListaMarcas />
            {[1, 2, 3].map((n) => (
              <ListaMarcas key={n} aria-hidden className="motion-reduce:hidden" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Convite() {
  return (
    <section id="fim" className="bg-primary text-primary-foreground">
      <Container>
        <div className="flex flex-col items-center border-b border-primary-foreground/15 pt-20 pb-14 text-center md:pt-30 md:pb-24">
          <h2 className="text-5xl leading-none font-bold tracking-[-0.045em] md:text-[80px]">
            Monte a sua <em className="text-accent not-italic">peça.</em>
          </h2>
          <p className="mt-[22px] mb-8 max-w-[46ch] text-base leading-relaxed text-pretty text-primary-foreground/80 md:text-[17px]">
            Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim.
          </p>
          <div className="flex w-full flex-col justify-center gap-2.5 sm:w-auto sm:flex-row">
            <Link href={ACAO.href} className={botaoClaro}>
              Monte sua peça <Seta />
            </Link>
            <a href={WHATSAPP_ORCAMENTO} className={botaoContorno}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
