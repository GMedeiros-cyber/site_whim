// Dados reais da Whim (fontes: referencia/prototipo/README.md e o contrato).

export const WHATSAPP = "5511945448802";

const logradouro = "Av. Brigadeiro Faria Lima, 110 · 2º andar";
const bairro = "Bom Clima"; // decisão do Gabriel em 16/11 (o contrato dizia Cocaia)
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
  horario: "Das 6h às 18h",
  whatsapp: "+55 11 94544-8802",
  email: "vendas@whimconfeccao.com.br",
  instagram: "@whimconfeccao",
  instagramUrl: "https://www.instagram.com/whimconfeccao/",
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
