// Dados reais da Whim (fonte: referencia/prototipo/README.md).

export const WHATSAPP = "5511945448802";

export const CONTATO = {
  endereco: "Av. Brigadeiro Faria Lima, 110 · 2º andar · Bom Clima · Guarulhos/SP",
  horario: "Das 6h às 18h",
  whatsapp: "+55 11 94544-8802",
  email: "vendas@whimconfeccao.com.br",
};

export function linkWhatsApp(texto: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
