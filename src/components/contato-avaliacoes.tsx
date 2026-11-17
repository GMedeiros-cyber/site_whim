import { QuoteIcon, StarIcon } from "lucide-react";

import { Container, Destaque, Titulo, secao } from "@/components/blocos";
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

type Depoimento = { texto: string; nome: string; empresa: string };

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
        <Titulo id="contato-titulo">
          Fale com <Destaque>a Whim.</Destaque>
        </Titulo>

        <div className={cn(
            "mt-8 grid rounded-[28px] bg-background p-2 shadow-[0_24px_56px_-24px] shadow-primary/20 sm:mt-10 lg:rounded-[36px] lg:p-3",
            MOSTRAR_AVALIACOES ? "lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]" : "max-w-[720px]"
          )}>
          <div className="px-4 pt-6 pb-8 sm:px-7 sm:pt-8 lg:px-9 lg:py-10">
            <h3 className="text-xl font-semibold tracking-[-0.01em]">Mande sua mensagem</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Abre o WhatsApp com tudo escrito. É só enviar.
            </p>
            <FormContato className="mt-6" />
          </div>

          {MOSTRAR_AVALIACOES && <Avaliacoes />}
        </div>

        <InfoContato />
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
      className="scroll-mt-24 overflow-hidden rounded-[22px] bg-muted px-4 py-6 sm:px-7 sm:py-8 lg:rounded-[28px] lg:p-7"
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
    <dl className="mt-9 grid gap-6 px-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-12 lg:grid-cols-[minmax(0,300px)_auto_auto] lg:justify-start lg:gap-x-20 lg:px-3">
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
