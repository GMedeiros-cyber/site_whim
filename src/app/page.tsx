import Image from "next/image";
import Link from "next/link";

import { Container, Destaque, Seta, Titulo, secao } from "@/components/blocos";
import { Abertura } from "@/components/home/abertura";
import { Carrossel } from "@/components/home/carrossel";
import { DUVIDAS } from "@/components/home/duvidas";
import { Etapas } from "@/components/home/etapas";
import { PalavraTinta } from "@/components/home/palavra-tinta";
import "@/components/home/transicoes.css";
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

/** Seção que sobe por cima da anterior (cantos de cima, sombra e margem negativa). */
const sobrepoe =
  "relative isolate -mt-7 rounded-t-[28px] shadow-[0_-24px_40px_-34px] shadow-primary/35 md:-mt-10 md:rounded-t-[40px]";
/** Título e linha de apoio que sobem ao entrar na tela. */
const sobe = "home-sobe";
const apoio = "mt-[18px] max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px]";

// A Whim faz silk, DTF e bordado (não faz sublimação: briefing de 16/11).
const TECNICAS_TOPO = ["Silk", "DTF", "Bordado"];

const OFICINA = [
  { nome: "Gravação de telas", texto: "A arte vira tela para o silk." },
  { nome: "Corte e costura", texto: "A peça nasce do tecido." },
  { nome: "Estampa", texto: "Silk, DTF ou bordado." },
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
];

const TAMBEM = [
  { nome: "Confecção", texto: "Camiseta, polo, regata, moletom e baby look, do tecido ao acabamento, do infantil 2 ao adulto G3." },
  { nome: "Uniformes", texto: "Para empresas e escolas, com padrão de cor, logo bordado ou estampado e reposição fácil." },
  { nome: "Não sabe qual?", texto: "Mande a arte: a equipe indica a técnica que fica melhor." },
];

// Clientes que a Whim autorizou citar (briefing de 16/11). Logos oficiais já em
// cinza, 120 px de altura (fontes em referencia/logos-clientes.md).
// `largura` = largura real do arquivo; `altura` = altura no PC (× 0,72 no celular).
const MARCAS = [
  { nome: "Globo", arquivo: "globo", largura: 514, altura: 37 },
  { nome: "Lollapalooza", arquivo: "lollapalooza", largura: 568, altura: 35 },
  { nome: "Santander", arquivo: "santander", largura: 688, altura: 32 },
  { nome: "SBT", arquivo: "sbt", largura: 120, altura: 52 },
  { nome: "Bauducco", arquivo: "bauducco", largura: 345, altura: 45 },
  { nome: "Aurora", arquivo: "aurora", largura: 518, altura: 37 },
  { nome: "Electrochemical", arquivo: "electrochemical", largura: 982, altura: 27 },
  { nome: "Lopes Kalil Engenharia", arquivo: "lopes-kalil", largura: 120, altura: 52 },
  { nome: "Indovinya", arquivo: "indovinya", largura: 388, altura: 42 },
  { nome: "Colégio Progresso", arquivo: "colegio-progresso", largura: 283, altura: 49 },
];

export default function Home() {
  return (
    <>
      <Abertura />
      <SiteHeader />
      <main className="flex-1">
        <Topo />
        <QuemSomos />
        <OQueFazemos />
        <ComoFunciona />
        <Clientes />
        <Duvidas />
        <Convite />
      </main>
      <SiteFooter />
    </>
  );
}

function Topo() {
  return (
    <section id="topo" className="p-2 md:p-3">
      <div
        className={cn(
          "relative isolate flex min-h-[calc(100svh-1rem)] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-primary px-5 pt-28 pb-24 text-center text-primary-foreground md:min-h-[min(880px,calc(100svh-1.5rem))] md:rounded-[32px] md:px-10 md:pt-32 md:pb-28",
          "home-recua"
        )}
      >
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
          Uniformes, camisetas e peças com a sua marca. Silk, DTF e bordado numa oficina própria em
          Guarulhos.
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
    <section id="sobre" className={cn(secao, "relative isolate bg-background")}>
      <Container className="grid gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16 lg:gap-y-9">
        <div className="lg:self-end">
          <Titulo className={cn("max-w-[13ch]", sobe)}>
            Uma oficina, <Destaque>do fio à estampa.</Destaque>
          </Titulo>
          <p className={cn(apoio, sobe)}>
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
    <section id="servicos" className={cn(secao, sobrepoe, "bg-muted")}>
      <Container>
        <Titulo className={sobe}>
          Três jeitos de <Destaque>estampar sua marca.</Destaque>
        </Titulo>
        <p className={cn(apoio, sobe)}>
          Cada técnica deixa a arte de um jeito. Veja como fica cada uma e para o que ela é melhor.
        </p>

        <div className="mt-9 md:mt-14">
          <Carrossel rotulo="Técnicas de estampa" className="gap-3 md:grid md:grid-cols-3 md:gap-5">
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
                    sizes="(min-width: 1024px) 380px, (min-width: 768px) 33vw, 76vw"
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
    <section id="processo" className={cn(secao, sobrepoe, "bg-background")}>
      <Container>
        <Titulo className={sobe}>
          Do pedido <Destaque>à entrega.</Destaque>
        </Titulo>
        <div className="mt-10 lg:mt-16">
          <Etapas />
        </div>
      </Container>
    </section>
  );
}

/** Faixa de logos. A cópia do carrossel fica escondida do leitor de tela. */
function ListaMarcas({ copia = false }: { copia?: boolean }) {
  return (
    <ul
      aria-hidden={copia || undefined}
      className={cn(
        "flex shrink-0 items-center gap-11 pr-11 md:gap-18 md:pr-18 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:px-5",
        copia && "motion-reduce:hidden"
      )}
    >
      {MARCAS.map((m) => (
        <li key={m.arquivo} className="shrink-0">
          {/* Arquivos já leves e no tamanho certo: sem otimizar de novo. Sem lazy:
              dentro da faixa com overflow escondido, o lazy só carrega o logo quando
              ele entra na tela e ele "pisca". Prioridade baixa para não atrasar o topo. */}
          <Image
            src={`/clientes/${m.arquivo}.webp`}
            alt={copia ? "" : m.nome}
            width={m.largura}
            height={120}
            unoptimized
            loading="eager"
            fetchPriority="low"
            style={{ "--h": `${m.altura}px` } as React.CSSProperties}
            className="h-[calc(var(--h)*0.72)] w-auto opacity-85 transition-opacity hover:opacity-100 md:h-(--h)"
          />
        </li>
      ))}
    </ul>
  );
}

function Clientes() {
  return (
    <section id="clientes" className={cn(secao, sobrepoe, "bg-muted")}>
      <Container>
        <Titulo className={sobe}>
          Marcas que <Destaque>confiam na oficina.</Destaque>
        </Titulo>
      </Container>

      {/* De ponta a ponta da tela; pausa com o mouse em cima ou com foco.
          Cada metade tem a lista duas vezes (~4000 px no PC) para telas largas não verem emenda. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Clientes da Whim (o carrossel pausa com o foco)"
        className="group mt-10 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:mt-[52px]"
      >
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] motion-reduce:[mask-image:none]">
          <div
            style={{ animationDuration: "40s" }}
            className="flex w-max group-hover:[animation-play-state:paused] group-focus:[animation-play-state:paused] motion-safe:animate-marquee motion-reduce:w-auto"
          >
            <ListaMarcas />
            {[1, 2, 3].map((n) => (
              <ListaMarcas key={n} copia />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section id="duvidas" className={cn(secao, sobrepoe, "bg-background")}>
      <Container className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16">
        <div>
          <Titulo className={sobe}>
            Antes de <Destaque>pedir o orçamento.</Destaque>
          </Titulo>
          <p className={cn(apoio, sobe)}>As perguntas que mais chegam no WhatsApp, respondidas aqui.</p>
        </div>
        <div className="border-t">
          {DUVIDAS.map((d, i) => (
            <details key={d.pergunta} open={i === 0} className="group border-b">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 rounded-sm py-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-lg [&::-webkit-details-marker]:hidden">
                {d.pergunta}
                {/* + que vira − (o traço vertical deita) com fundo turquesa quando aberta */}
                <span
                  aria-hidden
                  className="relative size-7 shrink-0 rounded-full bg-muted transition-colors group-open:bg-accent before:absolute before:inset-x-2 before:top-[13px] before:h-0.5 before:rounded-full before:bg-primary after:absolute after:inset-x-2 after:top-[13px] after:h-0.5 after:rotate-90 after:rounded-full after:bg-primary after:transition-transform group-open:after:rotate-0"
                />
              </summary>
              <p className="mb-[22px] max-w-[60ch] text-[15.5px] leading-[1.65] text-pretty text-muted-foreground">
                {d.resposta}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Convite() {
  return (
    <section id="fim" className="relative isolate bg-primary text-primary-foreground">
      {/* Borda de tinta: o azul-marinho escorre por cima da seção anterior. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute inset-x-0 -top-[38px] h-10 w-full fill-primary md:-top-[58px] md:h-[60px]"
      >
        <path d="M0 60 L0 38 C 80 30 140 44 220 36 C 300 26 340 12 430 20 C 520 28 560 46 660 40 C 760 34 800 14 900 18 C 990 22 1040 40 1130 36 C 1220 32 1260 10 1340 16 C 1390 20 1420 30 1440 28 L1440 60 Z" />
        <circle cx="318" cy="22" r="5" />
        <circle cx="1012" cy="30" r="3.5" />
        <circle cx="1268" cy="8" r="4" />
      </svg>
      <Container>
        <div className="flex flex-col items-center border-b border-primary-foreground/15 pt-20 pb-14 text-center md:pt-30 md:pb-24">
          <h2 className={cn("text-5xl leading-none font-bold tracking-[-0.045em] md:text-[80px]", sobe)}>
            Monte a sua <em className="text-accent not-italic">peça.</em>
          </h2>
          <p className="mt-[22px] mb-8 max-w-[46ch] text-base leading-relaxed text-pretty text-primary-foreground/80 md:text-[17px]">
            Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim,
            e quem responde é a Caroline.
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
