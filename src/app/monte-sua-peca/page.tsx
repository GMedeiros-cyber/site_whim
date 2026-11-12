import type { Metadata } from "next";

import { Container, Destaque, Eyebrow, Titulo, secao } from "@/components/blocos";
import { FormContato } from "@/components/form-contato";
import { Personalizador } from "@/components/personalizador";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type ItemNav } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CONTATO, WHATSAPP } from "@/lib/whim";

export const metadata: Metadata = {
  title: "Monte sua peça | Whim Confecção e Estamparia",
  description:
    "Escolha a peça, a cor e a estampa e receba o orçamento da Whim no WhatsApp.",
};

const LINKS: ItemNav[] = [
  { label: "Início", href: "/" },
  { label: "Personalizar", href: "#personalizar" },
  { label: "Contato", href: "#contato" },
  { label: "Avaliações", href: "#avaliacoes", opcional: true },
];

export default function MonteSuaPeca() {
  return (
    <>
      <SiteHeader links={LINKS} cta={{ label: "Orçamento", href: "#contato" }} />
      <main className="flex-1">
        <Personalizador />
        <Contato />
        <Avaliacoes />
      </main>
      <SiteFooter />
    </>
  );
}

function Contato() {
  const info = [
    { titulo: "Endereço", conteudo: CONTATO.endereco },
    { titulo: "Horário", conteudo: CONTATO.horario },
    {
      titulo: "WhatsApp e e-mail",
      conteudo: (
        <span className="flex flex-col">
          <a href={`https://wa.me/${WHATSAPP}`} className="w-fit underline-offset-4 hover:underline">{CONTATO.whatsapp}</a>
          <a href={`mailto:${CONTATO.email}`} className="w-fit underline-offset-4 hover:underline">{CONTATO.email}</a>
        </span>
      ),
    },
  ];

  return (
    <section id="contato" className={cn(secao, "bg-muted")}>
      <Container className="grid gap-[clamp(28px,5vw,72px)] md:grid-cols-2">
        <div>
          <Eyebrow>Contato</Eyebrow>
          <Titulo>
            Prefere <Destaque>falar direto?</Destaque>
          </Titulo>
          <FormContato />
        </div>
        <dl className="grid content-start gap-[22px] md:mt-7">
          {info.map((i) => (
            <div key={i.titulo} className="border-t pt-3.5">
              <dt className="mb-1 text-[13px] font-semibold tracking-[0.06em] uppercase">{i.titulo}</dt>
              <dd className="text-muted-foreground">{i.conteudo}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Avaliacoes() {
  // Espaço reservado: as avaliações reais do Google entram depois. Nada inventado aqui.
  const linhas = [
    ["w-[92%]", "w-[76%]", "w-[58%]"],
    ["w-[88%]", "w-[64%]", "w-[70%]"],
    ["w-[80%]", "w-[90%]", "w-[46%]"],
  ];

  return (
    <section id="avaliacoes" className={secao}>
      <Container>
        <Eyebrow>Avaliações do Google</Eyebrow>
        <Titulo>
          O que dizem <Destaque>de nós.</Destaque>
        </Titulo>
        <ul className="mt-9 grid gap-4 md:grid-cols-3">
          {linhas.map((larguras, i) => (
            <li key={i} className="grid gap-3 rounded-[20px] border p-[22px]">
              {larguras.map((w) => (
                <Skeleton key={w} className={cn("h-[9px] motion-reduce:animate-none", w)} />
              ))}
              <p className="text-xs text-muted-foreground">Avaliação real do Google entra aqui</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
