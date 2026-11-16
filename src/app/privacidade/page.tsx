import type { Metadata } from "next";

import { Container, Eyebrow, Titulo } from "@/components/blocos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTATO, EMPRESA } from "@/lib/whim";

export const metadata: Metadata = {
  title: "Política de privacidade | Whim Confecção e Estamparia",
  description:
    "Como a Whim Confecção e Estamparia trata os dados pessoais de quem pede orçamento pelo site, pelo WhatsApp ou por e-mail, de acordo com a LGPD.",
};

const ATUALIZACAO = "16 de novembro de 2026";

const linkTexto =
  "font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4 hover:decoration-primary";

export default function Privacidade() {
  const email = (
    <a href={`mailto:${CONTATO.email}`} className={linkTexto}>
      {CONTATO.email}
    </a>
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <Container className="pt-32 pb-20 sm:pt-40 sm:pb-28">
          <article className="mx-auto max-w-[72ch]">
            <header className="border-b pb-8">
              <Eyebrow>LGPD</Eyebrow>
              <Titulo as="h1">Política de privacidade</Titulo>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
                Esta página explica, em português simples, quais dados pessoais recebemos de
                quem pede orçamento, para que usamos e quais são os seus direitos.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Última atualização: {ATUALIZACAO}
              </p>
            </header>

            <div className="mt-4 text-base leading-relaxed text-muted-foreground [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2]:text-foreground [&_li]:pl-1 [&_p+p]:mt-4 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:marker:text-accent">
              <h2>Quem cuida dos seus dados</h2>
              <p>
                O controlador dos dados é a <strong>{EMPRESA.razaoSocial}</strong>, dona da marca{" "}
                {EMPRESA.marca}, CNPJ {EMPRESA.cnpj}, com sede na Av. Brigadeiro Faria Lima, 110,
                2º andar, {CONTATO.bairro}, {CONTATO.cidade}, CEP {CONTATO.cep}.
              </p>
              <p>Para qualquer assunto sobre dados pessoais, escreva para {email}.</p>

              <h2>Quais dados recebemos e como</h2>
              <ul>
                <li>
                  <strong>O formulário de contato e o “Monte sua peça” não guardam dados no site.</strong>{" "}
                  Eles só montam uma mensagem e abrem o WhatsApp. O que você envia por lá segue
                  também as regras do WhatsApp (Meta).
                </li>
                <li>
                  <strong>As artes anexadas no “Monte sua peça” ficam só no seu navegador.</strong>{" "}
                  Elas servem para mostrar a prévia da peça e não são enviadas a nenhum servidor.
                </li>
                <li>
                  <strong>Os dados que você nos manda por WhatsApp ou e-mail</strong> são usados
                  para responder, fazer o orçamento e produzir o seu pedido.
                </li>
              </ul>

              <h2>Por que podemos usar esses dados</h2>
              <p>
                Usamos os dados para os procedimentos antes do contrato, feitos a seu pedido (como
                o orçamento), e para cumprir o contrato, quando o pedido é fechado (art. 7º, inciso V,
                da LGPD). Quando for o caso, também usamos com base no legítimo interesse, para
                atender você e melhorar o nosso serviço.
              </p>

              <h2>Com quem compartilhamos</h2>
              <p>
                Só com quem é necessário para atender você (por exemplo, o WhatsApp, que é o canal
                da conversa) e quando a lei exigir. <strong>Não vendemos dados.</strong>
              </p>

              <h2>Cookies</h2>
              <p>
                O site não usa cookies próprios de rastreamento nem de publicidade. Se um dia
                ativarmos ferramentas de medição (como Google Analytics, Google Tag Manager ou o
                Pixel da Meta), esta política será atualizada e o site vai pedir o seu
                consentimento antes.
              </p>
              <p>
                O rodapé de todas as páginas mostra um <strong>mapa do Google Maps</strong> com o
                endereço da oficina. Esse mapa é carregado direto do Google, que pode usar cookies
                e coletar dados de navegação conforme a{" "}
                <a
                  href="https://policies.google.com/privacy?hl=pt-BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkTexto}
                >
                  política de privacidade do Google
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                .
              </p>

              <h2>Por quanto tempo guardamos</h2>
              <p>
                Pelo tempo necessário para o atendimento e para cumprir as obrigações legais e
                fiscais.
              </p>

              <h2>Os seus direitos</h2>
              <p>Pela LGPD (art. 18), você pode pedir:</p>
              <ul>
                <li>a confirmação de que tratamos os seus dados e o acesso a eles;</li>
                <li>a correção de dados incompletos, errados ou desatualizados;</li>
                <li>a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
                <li>a portabilidade dos dados;</li>
                <li>a informação sobre com quem compartilhamos os seus dados;</li>
                <li>a revogação do consentimento, quando ele tiver sido a base do tratamento.</li>
              </ul>
              <p>
                Faça o pedido pelo e-mail {email}. Você também pode reclamar à Autoridade
                Nacional de Proteção de Dados (ANPD).
              </p>

              <h2>Segurança</h2>
              <p>
                Adotamos cuidados para proteger os dados que recebemos contra acesso, perda ou
                uso indevido.
              </p>

              <h2>Alterações desta política</h2>
              <p>
                Esta política pode mudar, por exemplo, se o site passar a usar ferramentas de
                medição. A versão em vigor é sempre a desta página, com a data da última
                atualização.
              </p>
              <p className="text-sm">Última atualização: {ATUALIZACAO}.</p>
            </div>
          </article>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
