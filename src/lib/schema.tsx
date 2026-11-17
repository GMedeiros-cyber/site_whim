// Dados estruturados (JSON-LD). Só dados confirmados pela Whim (referencia/briefing-whim.md):
// sem AggregateRating até existirem avaliações reais.
import { SITE_URL } from "@/lib/site";
import { CONTATO, EMPRESA } from "@/lib/whim";

export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }}
    />
  );
}

const NEGOCIO_ID = `${SITE_URL}/#whim`;

const servico = (name: string, description: string) => ({
  "@type": "Offer",
  itemOffered: { "@type": "Service", name, description, provider: { "@id": NEGOCIO_ID } },
});

/** LocalBusiness com os serviços (Service). Vai no layout. */
export const NEGOCIO = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": NEGOCIO_ID,
  name: EMPRESA.marca,
  legalName: EMPRESA.razaoSocial,
  taxID: EMPRESA.cnpj,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/whim-logo-horizontal.webp`,
  image: `${SITE_URL}/images/hero-mesa.webp`,
  description:
    "Oficina própria de confecção e estamparia em Guarulhos/SP: silk, DTF, bordado, confecção e uniformes para empresas, escolas, confecções e eventos.",
  foundingDate: "2021",
  telephone: CONTATO.whatsapp,
  email: CONTATO.email,
  // Igual ao CONTATO.horario (segunda a sexta, das 9h às 18h).
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: `${CONTATO.logradouro.replace(" · ", ", ")}, ${CONTATO.bairro}`,
    addressLocality: "Guarulhos",
    addressRegion: "SP",
    postalCode: CONTATO.cep,
    addressCountry: "BR",
  },
  areaServed: [
    { "@type": "City", name: "Guarulhos" },
    { "@type": "AdministrativeArea", name: "Grande São Paulo" },
  ],
  sameAs: [CONTATO.instagramUrl],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Serviços da Whim",
    itemListElement: [
      servico("Silk screen", "Tinta em cores chapadas, para logos de poucas cores e tiragens maiores."),
      servico("DTF", "Todas as cores, degradês e fotos, para artes coloridas e pedidos menores."),
      servico("Bordado", "A arte costurada em linha, em relevo, para logo no peito de polos e uniformes."),
      servico(
        "Confecção",
        "Camiseta, polo, regata, moletom gola careca e canguru e baby look, do infantil 2 ao adulto G3. A partir de 50 peças."
      ),
      servico("Uniformes", "Para empresas e escolas, com padrão de cor, logo bordado ou estampado e reposição fácil."),
    ],
  },
};

/** FAQPage com as perguntas da seção Dúvidas frequentes. */
export function perguntas(itens: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((d) => ({
      "@type": "Question",
      name: d.pergunta,
      acceptedAnswer: { "@type": "Answer", text: d.resposta },
    })),
  };
}

/** BreadcrumbList de uma página interna: Início › nome. */
export function migalhas(nome: string, caminho: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: nome, item: `${SITE_URL}${caminho}` },
    ],
  };
}
