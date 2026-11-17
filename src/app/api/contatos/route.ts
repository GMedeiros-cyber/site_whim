// Guarda no MySQL da Hostinger os contatos do formulário e do Monte sua peça.
// O WhatsApp abre de qualquer jeito: esta rota só guarda a cópia (ver src/lib/contatos.ts).
// Os contatos são vistos e exportados pelo phpMyAdmin do hPanel. Roda em Node (o padrão; com
// Cache Components o `runtime` não pode ser declarado).
import mysql from "mysql2/promise";

const ORIGENS = new Set(["formulario", "monte-sua-peca"]);
const RASTREIO = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

const CRIAR_TABELA = `CREATE TABLE IF NOT EXISTS contatos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  origem VARCHAR(20) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  mensagem TEXT NULL,
  pedido TEXT NULL,
  pagina VARCHAR(300) NULL,
  utm_source VARCHAR(200) NULL,
  utm_medium VARCHAR(200) NULL,
  utm_campaign VARCHAR(200) NULL,
  utm_term VARCHAR(200) NULL,
  utm_content VARCHAR(200) NULL,
  gclid VARCHAR(500) NULL,
  fbclid VARCHAR(500) NULL,
  consentimento TINYINT(1) NOT NULL,
  consentimento_texto VARCHAR(500) NOT NULL,
  INDEX (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

let pool: mysql.Pool | undefined;
let tabela: Promise<unknown> | undefined;

/** Pool do MySQL, ou null sem as variáveis DB_* (no PC, o banco não existe). */
function banco() {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_NAME || !DB_USER) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT) || 3306,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      charset: "utf8mb4",
      connectionLimit: 3,
    });
    // criado_em no horário de Brasília (sem horário de verão desde 2019), para ler no phpMyAdmin.
    pool.on("connection", (c) => c.query("SET time_zone = '-03:00'"));
  }
  tabela ??= pool.query(CRIAR_TABELA).catch((e) => {
    tabela = undefined; // tenta de novo na próxima chamada
    throw e;
  });
  return pool;
}

// ponytail: limite em memória, por processo; vale para 1 instância (Hostinger). Sem guardar IP.
const JANELA = 60_000;
const envios = new Map<string, number[]>();
function passouDoLimite(chave: string, max: number) {
  const agora = Date.now();
  const recentes = (envios.get(chave) ?? []).filter((t) => agora - t < JANELA);
  recentes.push(agora);
  envios.set(chave, recentes);
  if (envios.size > 5000) envios.clear();
  return recentes.length > max;
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Linha = Record<string, string | number | null>;

/** Valida o corpo; devolve a linha da tabela ou a mensagem de erro. */
function validar(corpo: Record<string, unknown>): Linha | string {
  const origem = texto(corpo.origem);
  const nome = texto(corpo.nome);
  const email = texto(corpo.email).toLowerCase();
  const telefone = texto(corpo.telefone).replace(/\D/g, "");
  const mensagem = texto(corpo.mensagem);
  const pedido = texto(corpo.pedido);
  const pagina = texto(corpo.pagina);
  const consentimentoTexto = texto(corpo.consentimento_texto);

  if (!ORIGENS.has(origem)) return "Origem inválida.";
  if (nome.length < 2 || nome.length > 120) return "Informe o nome.";
  if (email.length > 254 || !EMAIL.test(email)) return "Informe um e-mail válido.";
  if (telefone.length < 10 || telefone.length > 13) return "Informe um telefone com DDD.";
  if (mensagem.length > 2000) return "Mensagem longa demais.";
  if (pedido.length > 6000) return "Pedido longo demais.";
  if (pagina && (!pagina.startsWith("/") || pagina.length > 300)) return "Página inválida.";
  if (corpo.consentimento !== true || consentimentoTexto.length < 10 || consentimentoTexto.length > 500)
    return "É preciso autorizar o uso dos dados.";

  const linha: Linha = {
    origem,
    nome,
    email,
    telefone,
    mensagem: mensagem || null,
    pedido: pedido || null,
    pagina: pagina || null,
    consentimento: 1,
    consentimento_texto: consentimentoTexto,
  };
  for (const campo of RASTREIO) linha[campo] = texto(corpo[campo]).slice(0, campo.endsWith("clid") ? 500 : 200) || null;
  return linha;
}

const resposta = (status: number, corpo: object) => Response.json(corpo, { status });

export async function POST(req: Request) {
  // Só aceita envios do próprio site.
  const de = req.headers.get("origin");
  if (de && new URL(de).host !== req.headers.get("host")) return resposta(403, { erro: "Origem não permitida." });
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) return resposta(413, { erro: "Envio grande demais." });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "?";
  if (passouDoLimite(`ip:${ip}`, 5) || passouDoLimite("todos", 60))
    return resposta(429, { erro: "Muitos envios seguidos. Tente de novo em um minuto." });

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: "Envio inválido." });
  }
  if (!corpo || typeof corpo !== "object") return resposta(400, { erro: "Envio inválido." });

  // Campo isca: pessoas não veem o "site"; robô que preenche recebe "ok" e nada é gravado.
  if (texto(corpo.site)) return resposta(201, { ok: true });

  const linha = validar(corpo);
  if (typeof linha === "string") return resposta(400, { erro: linha });

  const db = banco();
  if (!db) {
    console.warn("[contatos] Sem as variáveis DB_*: contato não gravado (normal fora da Hostinger).");
    return resposta(200, { ok: true, gravado: false });
  }
  try {
    await tabela;
    await db.query("INSERT INTO contatos SET ?", [linha]);
    return resposta(201, { ok: true });
  } catch (e) {
    console.error("[contatos] Falha ao gravar:", e instanceof Error ? e.message : e);
    return resposta(500, { erro: "Não deu para salvar agora." });
  }
}
