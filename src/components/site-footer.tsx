import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRightIcon } from "lucide-react";

import { Container } from "@/components/blocos";
import { LinkNav } from "@/components/link-nav";
import { PreferenciasCookies } from "@/components/medicao";
import { RedesSociais } from "@/components/redes-sociais";
import { ACAO, NAVEGACAO } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { CONTATO, EMPRESA, WHATSAPP } from "@/lib/whim";

/** Links do rodapé: alvo de toque de 44px no celular/tablet, compacto no PC. */
const link =
  "inline-flex min-h-11 min-w-11 items-center gap-1 rounded-sm underline-offset-4 transition-colors hover:text-primary-foreground hover:underline focus-visible:text-primary-foreground lg:min-h-0 lg:min-w-0 lg:py-1";

const novaAba = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Mapa embutido (sempre visível; citado na /privacidade). */
const MAPA_EMBED =
  "https://www.google.com/maps?q=Av.+Brigadeiro+Faria+Lima,+110,+Bom+Clima,+Guarulhos+-+SP,+07130-000&output=embed";

export function SiteFooter() {
  return (
    // pb maior: no fim da página, o botão flutuante do WhatsApp (até 80 px do
    // chão) não pode tapar os links da última linha.
    <footer className="bg-primary pt-14 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] text-sm text-primary-foreground/75 sm:pt-16">
      {/* Telas grandes: 1520 px a partir de 1800 px, como a home e o Monte sua peça. */}
      <Container className="min-[112.5rem]:max-w-[1520px]">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.8fr_1.15fr_1.7fr]">
          {/* Marca */}
          <div className="flex flex-col items-start gap-4">
            <Link href="/" aria-label="Whim Confecção e Estamparia, página inicial" className="rounded-sm">
              <Image
                src="/brand/whim-logo-branco.svg"
                alt=""
                width={444}
                height={138}
                className="h-11 w-auto"
              />
            </Link>
            <p className="max-w-[30ch] leading-relaxed text-pretty">
              Silk, DTF, bordado e confecção para empresas, escolas e confecções em Guarulhos/SP.
            </p>
          </div>

          <Coluna id="navegacao" titulo="Navegação">
            <ul className="grid grid-cols-2 gap-x-6 sm:flex sm:flex-col lg:gap-1">
              {[...NAVEGACAO, ACAO].map((l) => (
                <li key={l.href}>
                  <LinkNav href={l.href} className={link}>
                    {l.label}
                  </LinkNav>
                </li>
              ))}
            </ul>
          </Coluna>

          <Coluna id="atendimento" titulo="Atendimento">
            <ul className="flex flex-col lg:gap-1">
              <li>
                <a href={`https://wa.me/${WHATSAPP}`} className={link}>
                  <span className="sr-only">WhatsApp: </span>
                  {CONTATO.whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTATO.email}`} className={cn(link, "break-all")}>
                  <span className="sr-only">E-mail: </span>
                  {CONTATO.email}
                </a>
              </li>
              <li className="flex min-h-11 items-center lg:min-h-0 lg:py-1">{CONTATO.horario}</li>
            </ul>
            <RedesSociais className="mt-3" />
          </Coluna>

          <Coluna id="endereco" titulo="Endereço">
            <address className="flex flex-col gap-1 not-italic">
              <Linha partes={CONTATO.logradouro.split(" · ")} />
              <Linha partes={[CONTATO.bairro, CONTATO.cidade]} />
              <span>CEP {CONTATO.cep}</span>
            </address>
            <iframe
              src={MAPA_EMBED}
              title="Mapa com a localização da Whim"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="mt-1 h-[190px] w-full rounded-[18px] border border-primary-foreground/15 bg-primary-foreground/10"
            />
            <a href={CONTATO.mapa} {...novaAba} className={cn(link, "w-fit")}>
              Abrir no Google Maps
              <ArrowUpRightIcon aria-hidden className="size-3.5 text-accent" />
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </Coluna>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-primary-foreground/15 pt-6 text-xs leading-relaxed text-primary-foreground/60 md:flex-row md:items-center md:justify-between md:gap-8">
          <p>
            © <Ano /> {EMPRESA.marca} · {EMPRESA.razaoSocial} · CNPJ {EMPRESA.cnpj}
          </p>
          <div className="flex shrink-0 flex-wrap gap-x-6">
            <Link href="/privacidade" className={link}>
              Política de privacidade
            </Link>
            <PreferenciasCookies className={cn(link, "cursor-pointer")} />
            {/* Crédito de quem fez o site. Usa api.whatsapp.com (e não wa.me) para não contar
                como contato com a Whim na medição (medicao.tsx ouve os links do wa.me). */}
            <a
              href="https://api.whatsapp.com/send?phone=5511940807393"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              Desenvolvido por Tribus Labs
              <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/** Linha de endereço que só quebra nos " · ". */
function Linha({ partes }: { partes: string[] }) {
  return (
    <span>
      {partes.map((p, i) => (
        <span key={p}>
          {i > 0 && " · "}
          <span className="whitespace-nowrap">{p}</span>
        </span>
      ))}
    </span>
  );
}

function Coluna({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`rodape-${id}`} className="flex flex-col gap-3">
      <h2
        id={`rodape-${id}`}
        className="flex items-center gap-2.5 text-[11.5px] font-medium tracking-[0.22em] text-primary-foreground uppercase before:h-px before:w-[22px] before:bg-accent"
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Ano atual. Com Cache Components, `new Date()` precisa ficar num escopo em cache. */
async function Ano() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
