// Envio dos contatos para o banco (POST /api/contatos). Só no navegador.
import { lerOrigem, medir } from "@/components/medicao";

export type Contato = {
  origem: "formulario" | "monte-sua-peca";
  nome: string;
  email: string;
  telefone: string;
  mensagem?: string;
  /** Texto do resumo, quando vem do Monte sua peça. */
  pedido?: string;
  consentimento: true;
  /** O texto exato da caixa que a pessoa marcou. */
  consentimento_texto: string;
  /** Caixa opcional "Quero receber novidades e ofertas da Whim." (desmarcada por padrão). */
  ofertas?: boolean;
  /** O texto exato dessa caixa; obrigatório quando `ofertas` é true. */
  ofertas_texto?: string;
  /** Valor do campo isca (input escondido name="site"); pessoas deixam vazio. */
  site?: string;
};

/**
 * Guarda o contato no banco e, se gravou, dispara o `generate_lead` (só com consentimento de cookies).
 * Nunca lança erro nem espera nada do WhatsApp: chame sem `await` e abra o WhatsApp em seguida,
 * no mesmo clique (senão o navegador bloqueia a nova aba).
 */
export async function enviarContato(dados: Contato): Promise<boolean> {
  try {
    const r = await fetch("/api/contatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lerOrigem(), ...dados, pagina: location.pathname }),
      keepalive: true, // termina mesmo se a página mudar
    });
    if (r.status === 201) medir("generate_lead", { origem: dados.origem });
    return r.ok;
  } catch {
    return false;
  }
}
