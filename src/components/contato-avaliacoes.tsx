import { MailIcon, MapPinIcon, MessageCircleIcon, QuoteIcon, StarIcon } from "lucide-react";

import { Container, Destaque, Titulo, secao } from "@/components/blocos";
import { DepoimentoCelular, type Depoimento } from "@/components/depoimento-celular";
import { FormContato } from "@/components/form-contato";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CONTATO, WHATSAPP } from "@/lib/whim";

/** Link dos dados de contato: alvo de 44px abaixo de 1024px e de 28px no PC (como o rodapé). */
const linkInfo =
  "inline-flex min-h-11 w-fit items-center rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-h-0 lg:py-1";

// Nunca colocar depoimento inventado aqui: só os reais, com autorização de quem escreveu,
// com o texto exatamente como a pessoa mandou. Sem estrelas: os depoimentos chegam pelo
// WhatsApp, sem nota. Os cartões vazios completam 3 até chegarem os outros.
const MOSTRAR_AVALIACOES = true;

const DEPOIMENTOS: Depoimento[] = [
  {
    // Recebido pela Whim no WhatsApp em 17/11/2026.
    texto:
      "Excelente empresa!! Atendimento impecável, profissionais atenciosos e muito competentes. Compromissados com as entregas. Produtos/serviços de qualidade e muita dedicação em cada detalhe. Recomendo !!",
    nome: "Patricia",
    empresa: "Electrochemical",
  },
];

/** Seção única "Contato + Avaliações" (direção B: claro em camadas). */
export function ContatoAvaliacoes() {
  return (
    <section id="contato" aria-labelledby="contato-titulo" className={cn(secao, "bg-muted")}>
      {/* Telas grandes: a mesma largura do personalizador (1520 px a partir de 1800 px). */}
      <Container className="min-[112.5rem]:max-w-[1520px]">
        <Titulo id="contato-titulo" className="cel:text-center">
          Fale com <Destaque>a Whim.</Destaque>
        </Titulo>

        {/* Celular (proposta de 18/11): o depoimento primeiro, depois o formulário e, no fim, os
            contatos como atalhos de toque. No PC fica como está. */}
        <p className="mt-2 text-sm text-muted-foreground min-[601px]:hidden cel:text-center">A equipe responde pelo WhatsApp, de segunda a sexta.</p>
        {MOSTRAR_AVALIACOES && (
          <DepoimentoCelular depoimentos={DEPOIMENTOS} emBreve={DEPOIMENTOS.length < 3} mapa={CONTATO.mapa} className="mt-6 min-[601px]:hidden" />
        )}

        <div className={cn(
            "mt-8 grid rounded-[28px] bg-background p-2 shadow-[0_24px_56px_-24px] shadow-primary/20 max-[600px]:mt-4 sm:mt-10 lg:rounded-[36px] lg:p-3",
            MOSTRAR_AVALIACOES ? "lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]" : "max-w-[720px]"
          )}>
          <div className="px-4 pt-6 pb-8 sm:px-7 sm:pt-8 lg:px-9 lg:py-10">
            <h3 className="text-xl font-semibold tracking-[-0.01em] cel:text-center">Mande sua mensagem</h3>
            <p className="mt-2 text-sm text-muted-foreground cel:text-center">
              Abre o WhatsApp com tudo escrito. É só enviar.
            </p>
            <FormContato className="mt-6" />
          </div>

          {MOSTRAR_AVALIACOES && <Avaliacoes />}
        </div>

        <InfoContato />
        <AtalhosContato />
      </Container>
    </section>
  );
}

function Avaliacoes() {
  // Cartões vazios só para completar 3 enquanto os outros depoimentos não chegam.
  const vazios = [
    ["w-[92%]", "w-[76%]", "w-[58%]"],
    ["w-[88%]", "w-[64%]", "w-[70%]"],
    ["w-[80%]", "w-[90%]", "w-[46%]"],
  ].slice(0, Math.max(0, 3 - DEPOIMENTOS.length));

  const cartao =
    "w-[min(85%,320px)] shrink-0 snap-start rounded-[20px] border border-border/60 bg-background p-5 lg:w-auto lg:border-transparent";

  return (
    <div
      id="avaliacoes"
      className="scroll-mt-24 overflow-hidden rounded-[22px] bg-muted px-4 py-6 max-[600px]:hidden sm:px-7 sm:py-8 lg:rounded-[28px] lg:p-7"
    >
      <h3 className="text-xl font-semibold tracking-[-0.01em]">O que dizem de nós</h3>
      {vazios.length > 0 && (
        <>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent bg-background px-3.5 py-1.5 text-xs font-medium">
            <StarIcon aria-hidden className="size-3.5 fill-accent text-accent" />
            Mais depoimentos em breve
          </p>
          <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            Outros clientes estão mandando os depoimentos deles. Você também encontra a Whim no{" "}
            <a
              href={CONTATO.mapa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Google Maps
            </a>
            .
          </p>
        </>
      )}

      <ul
        aria-label="Depoimentos de clientes"
        className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:-mx-7 sm:scroll-px-7 sm:px-7 lg:mx-0 lg:grid lg:snap-none lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {DEPOIMENTOS.map((d) => (
          <li key={d.nome + d.empresa} className={cartao}>
            <figure>
              <QuoteIcon aria-hidden className="size-5 fill-accent text-accent" />
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground">
                <p>{d.texto}</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {d.nome.charAt(0)}
                </span>
                <span className="grid min-w-0">
                  <span className="text-sm font-semibold">{d.nome}</span>
                  <span className="text-xs text-muted-foreground">{d.empresa}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
        {vazios.map((linhas, i) => (
          <li key={i} aria-hidden className={cartao}>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, s) => (
                <StarIcon key={s} className="size-3.5 fill-muted-foreground/15 text-muted-foreground/25" />
              ))}
            </div>
            <div className="mt-4 grid gap-2.5">
              {linhas.map((w) => (
                <Skeleton key={w} className={cn("h-[9px] motion-reduce:animate-none", w)} />
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <span className="size-9 shrink-0 rounded-full bg-muted" />
              <div className="grid min-w-0 gap-1.5">
                <Skeleton className="h-[7px] w-16 motion-reduce:animate-none" />
                <Skeleton className="h-[7px] w-24 motion-reduce:animate-none" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoContato() {
  const info = [
    { titulo: "Endereço", conteudo: CONTATO.endereco },
    { titulo: "Horário", conteudo: CONTATO.horario },
    {
      titulo: "WhatsApp e e-mail",
      conteudo: (
        <span className="-my-2.5 flex flex-col lg:-my-1">
          <a href={`https://wa.me/${WHATSAPP}`} className={linkInfo}>
            {CONTATO.whatsapp}
          </a>
          <a href={`mailto:${CONTATO.email}`} className={cn(linkInfo, "break-words")}>
            {CONTATO.email}
          </a>
        </span>
      ),
    },
  ];

  return (
    <dl className="mt-9 grid gap-6 px-1 max-[600px]:hidden md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-12 lg:grid-cols-[minmax(0,300px)_auto_auto] lg:justify-start lg:gap-x-20 lg:px-3">
      {info.map((i) => (
        <div key={i.titulo} className="relative pl-5">
          <span aria-hidden className="absolute top-[7px] left-0 size-2 rounded-full bg-accent" />
          <dt className="text-[13px] font-semibold">{i.titulo}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{i.conteudo}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Celular: os contatos como atalhos de toque (WhatsApp com o horário, e-mail e o endereço no mapa). */
function AtalhosContato() {
  const [rua, ...resto] = CONTATO.endereco.split(" · ");
  const horario = CONTATO.horario.charAt(0).toLowerCase() + CONTATO.horario.slice(1);
  const atalhos = [
    { href: `https://wa.me/${WHATSAPP}`, Icone: MessageCircleIcon, titulo: CONTATO.whatsapp, detalhe: `WhatsApp · ${horario}`, fora: true },
    { href: `mailto:${CONTATO.email}`, Icone: MailIcon, titulo: CONTATO.email, detalhe: "E-mail", fora: false },
    { href: CONTATO.mapa, Icone: MapPinIcon, titulo: rua, detalhe: `${resto.join(" · ")} · abrir no mapa`, fora: true },
  ];
  return (
    <ul aria-label="Contatos" className="mt-4 grid gap-2.5 min-[601px]:hidden">
      {atalhos.map(({ href, Icone, titulo, detalhe, fora }) => (
        <li key={href}>
          <a
            href={href}
            {...(fora ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex min-h-16 items-center gap-3 rounded-2xl bg-background px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/16 text-primary">
              <Icone className="size-[18px]" />
            </span>
            <span className="grid min-w-0">
              <span className="text-sm font-semibold break-words">{titulo}</span>
              <span className="text-xs text-muted-foreground">{detalhe}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
