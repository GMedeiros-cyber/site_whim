import { DUVIDAS } from "@/components/home/duvidas";
import { SITE_URL } from "@/lib/site";
import { CONTATO, EMPRESA } from "@/lib/whim";

// Resumo para assistentes de IA (llmstxt.org). Só dados confirmados pela Whim.
export function GET() {
  const texto = `# ${EMPRESA.marca}

> Oficina própria de confecção e estamparia em Guarulhos/SP, fundada em 2021. Faz silk, DTF, bordado, confecção e uniformes para empresas, escolas, confecções e eventos. Não vende pelo site: o orçamento é feito pelo WhatsApp.

- Técnicas: silk screen, DTF e bordado (não faz sublimação).
- Peças: camiseta, polo, regata, moletom gola careca e canguru e baby look.
- Tamanhos: infantil do 2 ao 16 e adulto do PP ao G3.
- Pedido mínimo: 50 peças. Prazo de produção: 20 a 30 dias, conforme a quantidade e o modelo.
- Região atendida: Guarulhos e Grande São Paulo.
- Clientes: Globo, Lollapalooza, Santander, SBT, Bauducco, Aurora Coop, Electrochemical, Lopes Kalil Engenharia, Indovinya e Colégio Progresso (Guarulhos).

## Páginas

- [Início](${SITE_URL}/): quem é a Whim, técnicas, como funciona, clientes e dúvidas frequentes.
- [Monte sua peça](${SITE_URL}/monte-sua-peca): escolha peça, cor, estampa e tamanhos e envie o pedido de orçamento pelo WhatsApp.
- [Política de privacidade](${SITE_URL}/privacidade): como a Whim trata os dados pessoais (LGPD).

## Dúvidas frequentes

${DUVIDAS.map((d) => `- ${d.pergunta} ${d.resposta}`).join("\n")}

## Contato

- WhatsApp (orçamentos): ${CONTATO.whatsapp}
- E-mail: ${CONTATO.email}
- Instagram: ${CONTATO.instagramUrl}
- Endereço: ${CONTATO.logradouro.replace(" · ", ", ")}, ${CONTATO.bairro}, ${CONTATO.cidade}, CEP ${CONTATO.cep}
- Horário: ${CONTATO.horario.toLowerCase()}
- ${EMPRESA.razaoSocial}, CNPJ ${EMPRESA.cnpj}
`;

  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
