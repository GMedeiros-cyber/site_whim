import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowDownIcon } from "lucide-react";

import { Container, Destaque, Seta, Titulo, secao, seloIlustrativa } from "@/components/blocos";
import { Abertura } from "@/components/home/abertura";
import { Carrossel } from "@/components/home/carrossel";
import { DUVIDAS } from "@/components/home/duvidas";
import { DuvidasAcordeao } from "@/components/home/duvidas-acordeao";
import { Etapas, EtapasCelular } from "@/components/home/etapas";
import { TambemCartoes } from "@/components/home/tambem-cartoes";
import { TecnicaFotos } from "@/components/home/tecnica-fotos";
import { TambemLinhas, TecnicasAbas } from "@/components/home/tecnicas-celular";
import { OficinaCapitulos, type Capitulo } from "@/components/home/oficina-capitulos";
import { VideoOficina } from "@/components/home/video-oficina";
import { PalavraTinta } from "@/components/home/palavra-tinta";
import "@/components/home/transicoes.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { ACAO } from "@/lib/navegacao";
import { JsonLd, perguntas } from "@/lib/schema";
import { metadados } from "@/lib/site";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

export const metadata: Metadata = metadados(
  "Whim Confecção e Estamparia | Silk, DTF, bordado e uniformes em Guarulhos",
  "Uniformes, camisetas e peças com a sua marca. Silk, DTF e bordado numa oficina própria em Guarulhos/SP, para empresas, escolas e eventos. Orçamento pelo WhatsApp.",
  "/"
);

const WHATSAPP_ORCAMENTO = linkWhatsApp("Olá, Whim! Quero um orçamento.");

const botaoClaro = cn(buttonVariants({ variant: "secondary", size: "xl" }), "w-full sm:w-auto");
const botaoContorno = cn(
  buttonVariants({ size: "xl" }),
  "w-full border-primary-foreground/40 bg-transparent hover:border-accent hover:bg-primary-foreground/10 sm:w-auto"
);

/** Seção que sobe por cima da anterior (cantos de cima, sombra leve e margem negativa). */
const sobrepoe =
  "relative isolate -mt-7 rounded-t-[28px] shadow-[0_-24px_40px_-34px] shadow-primary/20 md:-mt-10 md:rounded-t-[40px]";
/** Fundo das seções cinza (técnicas e clientes): o fundo claro mais perto do branco. */
const cinza = "bg-muted/60";
/** Título e linha de apoio que sobem ao entrar na tela. */
const sobe = "home-sobe";
const apoio = "mt-[18px] max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-[17px] cel:mx-auto";
/** Celular (pedido de 18/11 à noite): títulos, apoio e textos curtos no centro. */
const centro = "cel:text-center";
/** Celular: ~80 px em cima e embaixo de cada seção. Embaixo conta a seção seguinte, que sobe
    28 px por cima desta (sobrepoe): 80 + 28. */
const respiro = "cel:pt-20 cel:pb-[108px]";

// Foto do topo com art direction: paisagem quando a tela é mais larga que alta, retrato
// no resto (celular e tablet em pé). Mesma prioridade alta da foto anterior.
// Hero provisória (18/11): imagem gerada com IA até a Whim ter fotos próprias boas o suficiente.
const HERO = {
  alt: "Pilhas de camisetas e uniformes azul-marinho, brancos e turquesa na mesa de uma oficina de costura (imagem ilustrativa)",
  sizes: "100vw",
  loading: "eager",
  fetchPriority: "high",
} as const;
const HERO_PAISAGEM = "(min-aspect-ratio: 1/1)";
const { srcSet: heroPaisagem } = getImageProps({ ...HERO, src: "/images/hero-oficina-pc.webp", width: 2400, height: 1340 }).props;
const heroRetrato = getImageProps({ ...HERO, src: "/images/hero-oficina-celular-v2.webp", width: 1152, height: 2064 }).props;

const OFICINA = [
  { nome: "Gravação de telas", texto: "A arte vira tela para o silk." },
  { nome: "Corte e costura", texto: "A peça nasce do tecido." },
  { nome: "Estampa", texto: "Silk, DTF ou bordado." },
  { nome: "Acabamento", texto: "Conferência e embalagem." },
];

// Mosaico do Quem somos (17/11 à noite): o vídeo e a foto são da própria Whim (pasta do
// Drive, tratados e sem som); só o rodo é ilustrativo (IA).
const FOTOS: { src: string; alt: string; legenda: string; video?: string }[] = [
  {
    src: "/images/oficina-silk-poster.webp",
    video: "/videos/oficina-silk-loop.mp4",
    alt: "Estampador espalhando tinta branca na tela de silk sobre a mesa longa, com camisetas pretas estampadas",
    legenda: "Silk na mesa longa",
  },
  {
    src: "/images/oficina-mesa-silk.webp",
    alt: "Tela de silk com tinta branca e o rodo sobre a mesa longa, ao lado de camisetas pretas estampadas com uma guitarra",
    legenda: "Tela pronta para a próxima peça",
  },
  { src: "/images/rodo-tela.webp", alt: "Mãos passando o rodo na tela de silk", legenda: "Rodo na tela de silk · ilustrativa" },
];

// Quem somos no celular (ideia B do Figma, 19/11): a oficina em 4 capítulos. Só o vídeo do
// silk é da Whim; as outras são ilustrativas (IA) até chegarem vídeos curtos de cada etapa.
const CAPITULOS: Capitulo[] = [
  { ...OFICINA[0], curto: "Telas", src: "/images/rodo-tela.webp", alt: "Mãos passando o rodo na tela de silk", ilustrativa: true },
  {
    ...OFICINA[1],
    curto: "Costura",
    src: "/images/hero-oficina-celular-v2.webp",
    alt: "Oficina de costura com máquinas, linhas coloridas e camisetas dobradas nas mesas",
    ilustrativa: true,
  },
  { ...OFICINA[2], curto: "Estampa", src: FOTOS[0].src, video: FOTOS[0].video, alt: FOTOS[0].alt },
  {
    ...OFICINA[3],
    curto: "Acabamento",
    src: "/images/camiseta-whim-mesa.webp",
    alt: "Camiseta azul-marinho dobrada com o logo da Whim estampado, na mesa de silk ao lado do rodo e da tinta turquesa",
    ilustrativa: true,
  },
];

// Imagens geradas por IA: sempre com o selo "Imagem ilustrativa".
const TECNICAS = [
  {
    nome: "Silk",
    fotos: [
      // Vídeo real da Whim (19/11): camisetas da Yamaha em silk, tirando a tela e a mesa cheia.
      {
        src: "/images/yamaha-silk-poster.webp",
        video: "/videos/yamaha-silk-loop.mp4",
        alt: "Tela de silk sendo levantada e revelando o logo da Yamaha em branco numa camiseta preta, na mesa longa da oficina",
        real: true,
        foco: "50% 32%",
      },
      { src: "/images/estilos/silk-close.webp", alt: "Rodo passando tinta turquesa na tela de silk sobre uma camiseta azul-marinho" },
      { src: "/images/estilos/silk-2.webp", alt: "Camiseta azul-marinho recém-estampada em silk, com arte geométrica em branco e turquesa e a tinta em relevo" },
    ],
    texto: "Tinta grossa em cores chapadas, com o toque e a durabilidade da tinta na tela.",
    bomPara: "logos de poucas cores e tiragens maiores.",
  },
  {
    nome: "DTF",
    fotos: [
      { src: "/images/estilos/dtf.webp", alt: "Estampa colorida em DTF com degradê numa camiseta branca" },
      { src: "/images/estilos/dtf-2.webp", alt: "Mão tirando o filme transparente de uma estampa DTF colorida de flores numa camiseta branca, ao lado da prensa" },
      { src: "/images/estilos/dtf-3.webp", alt: "Rolo de filme DTF impresso com várias artes coloridas, ao lado de uma camiseta preta dobrada" },
    ],
    texto: "Impressa num filme e aplicada com calor: todas as cores, degradês e fotos, com acabamento fotográfico.",
    bomPara: "artes coloridas e pedidos menores.",
  },
  {
    nome: "Bordado",
    fotos: [
      { src: "/images/estilos/bordado.webp", alt: "Logo bordado em linha numa polo azul-marinho" },
      { src: "/images/estilos/bordado-2.webp", alt: "Máquina de bordar costurando um emblema turquesa e branco numa polo azul-marinho presa no bastidor" },
      { src: "/images/estilos/bordado-3.webp", alt: "Bordado em relevo de uma folha em azul-marinho e turquesa no peito de uma polo branca" },
    ],
    texto: "A arte é costurada em linha, em relevo, e dura junto com a peça.",
    bomPara: "logo no peito de polos e uniformes.",
  },
];

// `resumo`: a linha curta do celular (referencia/celular-18-11).
const TAMBEM = [
  { nome: "Confecção", resumo: "Do tecido ao acabamento", texto: "Camiseta, polo, regata, moletom e baby look, do tecido ao acabamento, do infantil 2 ao adulto G3." },
  { nome: "Uniformes", resumo: "Empresas e escolas", texto: "Para empresas e escolas, com padrão de cor, logo bordado ou estampado e reposição fácil." },
  { nome: "Não sabe qual?", resumo: "A equipe indica a técnica", texto: "Mande a arte: a equipe indica a técnica que fica melhor." },
];
const WHATSAPP_TECNICA = linkWhatsApp("Olá, Whim! Não sei qual técnica escolher para a minha arte.");

// Clientes que a Whim autorizou citar (briefing de 16/11). Logos oficiais já em
// cinza, 120 px de altura (fontes em referencia/logos-clientes.md).
// `largura` = largura real do arquivo; `altura` = altura no PC (× 0,72 no celular).
const MARCAS = [
  { nome: "Globo", arquivo: "globo", largura: 514, altura: 37 },
  { nome: "Lollapalooza", arquivo: "lollapalooza", largura: 568, altura: 35 },
  // Logo oficial do site da Yamaha Motor (global.yamaha-motor.com), sem o slogan, no cinza dos outros.
  { nome: "Yamaha", arquivo: "yamaha", largura: 562, altura: 38 },
  { nome: "Santander", arquivo: "santander", largura: 688, altura: 32 },
  { nome: "SBT", arquivo: "sbt", largura: 120, altura: 52 },
  { nome: "Bauducco", arquivo: "bauducco", largura: 345, altura: 45 },
  { nome: "Aurora", arquivo: "aurora", largura: 182, altura: 50 },
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
      <main id="conteudo" tabIndex={-1} className="outline-none flex-1">
        <Topo />
        {/* Celular: "Marcas que confiam" sobe para logo depois da hero (order); no PC fica onde está. */}
        <div className="home-grande cel:flex cel:flex-col">
          <QuemSomos />
          <OQueFazemos />
          <ComoFunciona />
          <Clientes />
          <Duvidas />
          <Convite />
        </div>
      </main>
      <SiteFooter />
      <JsonLd dados={perguntas(DUVIDAS)} />
    </>
  );
}

function Topo() {
  return (
    <section id="topo" className="p-2 md:p-3">
      <div
        className={cn(
          "relative isolate flex min-h-[calc(100svh-1rem)] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-primary px-5 pt-28 pb-24 text-center text-primary-foreground md:min-h-[min(880px,calc(100svh-1.5rem))] md:rounded-[32px] min-[1800px]:min-h-[calc(100svh/var(--zoom)-1.5rem)]! md:px-10 md:pt-32 md:pb-28",
          // Celular: texto embaixo (referencia/celular-18-11), no centro (pedido de 18/11 à noite).
          "cel:justify-end cel:px-[22px] cel:pb-8",
          "home-recua"
        )}
      >
        <picture>
          <source media={HERO_PAISAGEM} srcSet={heroPaisagem} sizes={HERO.sizes} />
          <img
            {...heroRetrato}
            alt={HERO.alt}
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_50%] [@media(min-aspect-ratio:1/1)]:object-[50%_55%]"
          />
        </picture>
        {/* Hero provisória gerada com IA: o selo da regra de marca (auditoria de 19/11), só no PC
            (no celular saiu, pedido do Gabriel em 25/11). O alt já diz "imagem ilustrativa". */}
        <span aria-hidden className={cn(seloIlustrativa, "bottom-3 left-3 z-10 md:bottom-5 md:left-5 cel:hidden")}>
          Imagem ilustrativa
        </span>
        {/* Véu azul: forte atrás do texto, mais leve nas bordas e embaixo, onde a estampa aparece.
            No celular o texto fica embaixo, então o véu escurece de cima para baixo. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-radial-[90%_62%_at_50%_44%] from-primary/88 via-primary/74 via-55% to-primary/38 cel:bg-linear-to-b cel:from-primary/35 cel:via-primary/55 cel:via-40% cel:to-primary/94"
        />

        {/* Logo no canto superior esquerdo do cartão da hero, na altura da barra (pedido do
            Gabriel, 17/11 à noite). Só a partir de 1024 px: abaixo disso a barra ocupa o meio
            da tela e já mostra o logo. */}
        <span
          role="img"
          aria-label="Whim Confecção e Estamparia"
          className="home-grande absolute top-[11px] left-5 hidden aspect-[444/138] h-10 bg-[url(/brand/whim-logo-branco.svg)] bg-contain bg-no-repeat opacity-95 lg:block"
        />
        <h1>
          <PalavraTinta>Vista</PalavraTinta>{" "}
          <span className="home-grande mt-1.5 block text-[28px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance md:text-[40px] cel:mt-2 cel:text-[22px] cel:leading-[1.15]">
            a sua marca, peça por peça.
          </span>
        </h1>
        <p className="home-grande mt-4 max-w-[52ch] text-[15px] leading-relaxed text-pretty text-primary-foreground/80 md:text-base cel:mt-2.5 cel:leading-normal">
          <span className="cel:hidden">Uniformes, camisetas e peças com a sua marca. Silk, DTF e bordado.</span>
          <span className="min-[601px]:hidden">Silk, DTF e bordado para empresas, escolas e eventos.</span>
        </p>
        <div className="home-grande mt-7 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row cel:mt-[22px]">
          <a href={WHATSAPP_ORCAMENTO} className={botaoClaro}>
            Pedir orçamento no WhatsApp <Seta />
          </a>
          <a href="#servicos" className={cn(botaoContorno, "cel:hidden")}>
            Ver o que fazemos
          </a>
          {/* No celular, um botão só; o segundo vira link de texto. */}
          <a
            href="#servicos"
            className="inline-flex min-h-11 items-center gap-1.5 self-center rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground min-[601px]:hidden"
          >
            Ver o que fazemos <ArrowDownIcon aria-hidden className="size-4" />
          </a>
        </div>

        {/* Ícone de rolagem: balança de leve e some ao rolar (transicoes.css). */}
        <a
          href="#sobre"
          aria-label="Ir para Quem somos"
          className="home-rolar home-grande absolute bottom-3 left-1/2 flex size-11 -translate-x-1/2 items-center justify-center rounded-full text-primary-foreground/75 transition-colors hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground md:bottom-5 cel:hidden"
        >
          <span aria-hidden className="home-rolar-mouse relative h-[34px] w-[22px] rounded-full border-2 border-current">
            <span className="absolute top-1.5 left-1/2 h-[7px] w-[3px] -translate-x-1/2 rounded-full bg-current" />
          </span>
        </a>
      </div>
    </section>
  );
}

function QuemSomos() {
  return (
    <section id="sobre" className={cn(secao, respiro, "relative isolate bg-background")}>
      <Container className="grid gap-y-8 cel:gap-y-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16 lg:gap-y-9">
        <div className="lg:self-end">
          <Titulo className={cn("max-w-[13ch] cel:mx-auto", centro, sobe)}>
            Uma oficina, <Destaque>do fio à estampa.</Destaque>
          </Titulo>
          <p className={cn(apoio, centro, sobe, "cel:mt-3 cel:text-[15px]")}>
            <span className="cel:hidden">
              A Whim nasceu em 2021, quando o fundador juntou 15 anos de experiência numa oficina
              própria em Guarulhos. Hoje a gente faz peças para empresas, escolas e eventos com todas
              as etapas no mesmo lugar.
            </span>
            <span className="min-[601px]:hidden">Desde 2021, em Guarulhos, com todas as etapas no mesmo lugar.</span>
          </p>
        </div>

        {/* Celular: a oficina em capítulos, como stories (ideia B, 19/11). */}
        <OficinaCapitulos capitulos={CAPITULOS} className="mt-7 min-[601px]:hidden" />

        {/* Mosaico no PC e no tablet; carrossel de 601 a 767 px. */}
        <div className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center cel:hidden">
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
                {f.video ? (
                  <VideoOficina src={f.video} poster={f.src} rotulo={f.alt} />
                ) : (
                  <Image
                    src={f.src}
                    alt={f.alt}
                    fill
                    sizes="(min-width: 1024px) 340px, (min-width: 768px) 50vw, 80vw"
                    className="object-cover"
                  />
                )}
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1.5 text-xs text-foreground">
                  {f.legenda}
                </figcaption>
              </figure>
            ))}
          </Carrossel>
        </div>

        {/* No celular as etapas já estão nos capítulos de cima. */}
        <ul className="grid grid-cols-2 gap-x-[18px] gap-y-4 sm:gap-x-7 sm:gap-y-[22px] lg:col-start-1 lg:self-start cel:hidden">
          {OFICINA.map((etapa, i) => (
            <li
              key={etapa.nome}
              className="flex flex-col gap-1 border-t pt-3.5 cel:min-h-12 cel:flex-row cel:items-center cel:gap-2.5 cel:rounded-[14px] cel:border-t-0 cel:bg-muted cel:px-3 cel:py-2.5"
            >
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary min-[601px]:hidden">
                {i + 1}
              </span>
              <span className="text-base font-semibold cel:text-[13px] cel:leading-tight">{etapa.nome}</span>
              <span className="text-sm leading-normal text-muted-foreground cel:hidden">{etapa.texto}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function OQueFazemos() {
  return (
    <section id="servicos" className={cn(secao, respiro, sobrepoe, cinza)}>
      <Container>
        <Titulo className={cn(centro, sobe)}>
          Três jeitos de <Destaque>estampar sua marca.</Destaque>
        </Titulo>
        <p className={cn(apoio, sobe, "cel:hidden")}>
          Cada técnica deixa a arte de um jeito. Veja como fica cada uma e para o que ela é melhor.
        </p>

        {/* Celular: abas e um cartão só; linhas curtas no lugar dos três cartões de baixo. */}
        <TecnicasAbas tecnicas={TECNICAS} className="mt-7 min-[601px]:hidden" />
        <TambemLinhas itens={TAMBEM} whatsapp={WHATSAPP_TECNICA} className="mt-6 min-[601px]:hidden" />

        <div className="mt-9 md:mt-14 cel:hidden">
          <Carrossel rotulo="Técnicas de estampa" className="gap-3 md:grid md:grid-cols-3 md:gap-5">
            {TECNICAS.map((t) => (
              <article
                key={t.nome}
                className="flex w-[76%] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border border-primary/6 bg-background md:w-auto"
              >
                <TecnicaFotos nome={t.nome} fotos={t.fotos} />
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

        <TambemCartoes itens={TAMBEM} className="cel:hidden" />
      </Container>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="processo" className={cn(secao, respiro, sobrepoe, "bg-background")}>
      <Container>
        <Titulo className={cn(centro, sobe)}>
          Do pedido <Destaque>à entrega.</Destaque>
        </Titulo>
        <div className="mt-10 lg:mt-16 cel:hidden">
          <Etapas />
        </div>
        <EtapasCelular className="mt-7 min-[601px]:hidden" />
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
    // Celular: logo depois da hero (order-first), sem subir por cima dela; Quem somos não sobe
    // por cima desta, então embaixo bastam 80 px. Título curto.
    <section id="clientes" className={cn(secao, sobrepoe, cinza, centro, "cel:order-first cel:mt-0 cel:pt-20 cel:pb-20")}>
      <Container>
        <Titulo className={sobe}>
          <span className="cel:hidden">
            Marcas que <Destaque>confiam na Whim.</Destaque>
          </span>
          <span className="min-[601px]:hidden">
            Marcas que <Destaque>confiam.</Destaque>
          </span>
        </Titulo>
      </Container>

      {/* De ponta a ponta da tela; pausa com o mouse em cima ou com foco.
          Cada metade tem a lista duas vezes (~4000 px no PC) para telas largas não verem emenda. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Clientes da Whim (o carrossel pausa com o foco)"
        className="group mt-10 py-2 outline-none cel:mt-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:mt-[52px]"
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
    // Celular: embaixo, a onda da chamada final sobe 38 px por cima (80 + 38).
    <section id="duvidas" className={cn(secao, respiro, sobrepoe, "bg-background cel:pb-[118px]")}>
      {/* Foto à esquerda e perguntas à direita; no PC a foto acompanha a altura das perguntas
          (cresce junto quando uma resposta abre). No celular a foto vem em cima, menor.
          Imagem gerada com IA; o logo é o arquivo oficial aplicado por cima, sem redesenho. */}
      <Container className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-16">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-muted sm:aspect-[2/1] lg:aspect-auto lg:min-h-[560px] cel:hidden">
          <Image
            src="/images/camiseta-whim-mesa.webp"
            alt="Camiseta azul-marinho dobrada com o logo da Whim estampado, na mesa de silk ao lado do rodo e da tinta turquesa"
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover object-[50%_42%]"
          />
          <span className={cn(seloIlustrativa, "bottom-3 left-3")}>Imagem ilustrativa</span>
        </div>
        <div>
          <Titulo className={cn(centro, sobe)}>
            Antes de <Destaque>pedir o orçamento.</Destaque>
          </Titulo>
          <p className={cn(apoio, sobe, "cel:hidden")}>As perguntas que mais chegam no WhatsApp, respondidas aqui.</p>
          <div className="mt-8 md:mt-10 cel:mt-7">
            <DuvidasAcordeao />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Convite() {
  return (
    <section id="fim" className="relative isolate bg-primary text-primary-foreground">
      {/* Borda de tinta: o azul-marinho escorre por cima da seção anterior. Ao entrar na
          tela, a onda corre e cresce e os pingos respingam (transicoes.css). A onda tem 150%
          da largura para correr sem mostrar a ponta. */}
      <div aria-hidden className="home-onda-caixa absolute inset-x-0 -top-[38px] h-10 overflow-clip md:-top-[58px] md:h-[60px]">
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="home-onda absolute bottom-0 -left-1/2 h-full w-[150%] fill-primary"
        >
          <path d="M0 60 L0 38 C 80 30 140 44 220 36 C 300 26 340 12 430 20 C 520 28 560 46 660 40 C 760 34 800 14 900 18 C 990 22 1040 40 1130 36 C 1220 32 1260 10 1340 16 C 1390 20 1420 30 1440 28 L1440 60 Z" />
        </svg>
        {[
          { x: "21%", y: "18%", d: "10px", a: "0%" },
          { x: "62%", y: "34%", d: "6px", a: "10%" },
          { x: "86%", y: "6%", d: "8px", a: "20%" },
        ].map((p) => (
          <span
            key={p.x}
            style={{ left: p.x, top: p.y, "--d": p.d, "--atraso": p.a } as React.CSSProperties}
            className="home-pingo absolute size-(--d) rounded-full bg-primary"
          />
        ))}
      </div>
      <Container>
        <div className="flex flex-col items-center border-b border-primary-foreground/15 pt-20 pb-14 text-center md:pt-30 md:pb-24 cel:pb-20">
          <h2 className={cn("text-5xl leading-none font-bold tracking-[-0.045em] md:text-[80px]", sobe)}>
            Monte a sua <em className="text-accent not-italic">peça.</em>
          </h2>
          <p className="mt-[22px] mb-8 max-w-[46ch] text-base leading-relaxed text-pretty text-primary-foreground/80 md:text-[17px]">
            Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim,
            e a nossa equipe responde.
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
