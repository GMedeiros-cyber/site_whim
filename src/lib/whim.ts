// Dados reais da Whim (fontes: referencia/prototipo/README.md e o contrato).

export const WHATSAPP = "5511945448802";

const logradouro = "Av. Brigadeiro Faria Lima, 110 · 2º andar";
const bairro = "Cocaia"; // confirmado pelo Gabriel em 17/11 à noite (o contrato também diz Cocaia)
const cidade = "Guarulhos/SP";
const cep = "07130-000";

export const CONTATO = {
  logradouro,
  bairro,
  cidade,
  cep,
  /** Endereço em uma linha. */
  endereco: `${logradouro} · ${bairro} · ${cidade}`,
  /** Busca do endereço no Google Maps (abre em nova aba). */
  mapa: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Av. Brigadeiro Faria Lima, 110, ${bairro}, Guarulhos - SP, ${cep}`
  )}`,
  horario: "Segunda a sexta, das 9h às 18h", // confirmado pela Whim em 17/11
  whatsapp: "+55 11 94544-8802",
  email: "vendas@whimconfeccao.com.br",
  instagram: "@whimconfeccao",
  instagramUrl: "https://www.instagram.com/whimconfeccao/",
  facebookUrl: "https://www.facebook.com/whimconfeccoes/",
};

/** Dados da empresa (rodapé e política de privacidade). */
export const EMPRESA = {
  marca: "Whim Confecção e Estamparia",
  razaoSocial: "Gallant Clothing Ltda",
  cnpj: "35.356.367/0001-27",
};

export function linkWhatsApp(texto: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
