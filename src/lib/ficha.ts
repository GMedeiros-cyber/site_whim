/**
 * Ficha da estampa em PNG para a equipe da Whim (referencia/previa-cor/README-estampa-2.md, 6).
 * Gerada no navegador, nada vai para servidor.
 */
import { areaDe, type Lado, type Tecnica } from "@/lib/estampa";
import { artePronta, carregar, comporEstampa } from "@/lib/estampa-cliente";

const W = 1600;
const H = 1000;

export type LinhaFicha = {
  numero: number;
  chave: string;
  nome: string; // "Peito esquerdo"
  medida: string; // "até ≈ 10 × 10 cm"
  arquivo?: string;
  url?: string;
  manterFundo: boolean;
};

export type DadosFicha = {
  modelo: { id: string; nome: string; coresPasta: string; areas: object };
  cor: { nome: string; pasta: string };
  tecnica: Tecnica;
  tamanhos: string; // "P 10, M 20" ou "a definir"
  total: number;
  linhas: LinhaFicha[];
  tinta: string; // cor do marcador "Sua arte" (depende do tecido)
};

export const nomeFicha = (id: string, data = new Date()) =>
  `ficha-whim-${id}-${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}.png`;

/** Corta no meio para caber em `max` px, mantendo o começo e o fim com a extensão. */
function cortar(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  if (ctx.measureText(texto).width <= max) return texto;
  const ponto = texto.lastIndexOf(".");
  const fim = texto.slice(Math.max(0, (ponto > 0 ? ponto : texto.length) - 3));
  let ini = texto.slice(0, texto.length - fim.length);
  while (ini.length > 1 && ctx.measureText(`${ini}…${fim}`).width > max) ini = ini.slice(0, -1);
  return `${ini}…${fim}`;
}

export async function gerarFicha(d: DadosFicha): Promise<Blob> {
  const raiz = getComputedStyle(document.documentElement);
  const cor = (v: string) => raiz.getPropertyValue(v).trim();
  const [primaria, destaque, fundo, secundaria, branco] = ["--primary", "--accent", "--muted", "--muted-foreground", "--background"].map(cor);
  const fonte = getComputedStyle(document.body).fontFamily;
  const tecnica = d.tecnica;

  // Fotos de frente e costas com as artes já compostas (técnica simulada), em 1×, no Worker.
  const lados = await Promise.all(
    (["frente", "costas"] as Lado[]).map(async (lado) => {
      const linhas = d.linhas.filter((l) => areaDe(d.modelo, lado, l.chave));
      const { bitmap } = await comporEstampa({
        largura: 900,
        altura: 1200,
        peca: `${d.modelo.coresPasta}${d.cor.pasta}/${lado}.webp`,
        branco: `${d.modelo.coresPasta}branco/${lado}.webp`,
        tecnica,
        camadas: linhas.map((l) => ({ area: areaDe(d.modelo, lado, l.chave)!, url: l.url, manter: l.manterFundo })),
        tinta: d.tinta,
        fonte,
      });
      return { lado, tela: bitmap, linhas };
    })
  );
  const miniaturas = await Promise.all(d.linhas.map((l) => (l.url ? artePronta(l.url, l.manterFundo, tecnica).catch(() => null) : null)));
  const logo = await carregar("/brand/whim-logo-horizontal.webp").catch(() => null);

  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  const texto = (t: string, x: number, y: number, tamanho: number, peso = 400, c = primaria, alinhar: CanvasTextAlign = "left") => {
    ctx.font = `${peso} ${tamanho}px ${fonte}`;
    ctx.fillStyle = c;
    ctx.textAlign = alinhar;
    ctx.fillText(t, x, y);
  };
  const circulo = (n: number, x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = destaque;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = branco;
    ctx.stroke();
    ctx.textBaseline = "middle";
    texto(String(n), x, y + 1, r * 1.1, 700, primaria, "center");
    ctx.textBaseline = "alphabetic";
  };

  ctx.fillStyle = branco;
  ctx.fillRect(0, 0, W, H);

  // Topo: logo, peça, cor, técnica, total e tamanhos.
  if (logo) ctx.drawImage(logo, 48, 40, (logo.naturalWidth / logo.naturalHeight) * 64, 64);
  texto(`Ficha da estampa · ${d.modelo.nome}`, 400, 66, 32, 600);
  texto(`Cor: ${d.cor.nome}  ·  Técnica: ${tecnica}`, 400, 104, 22, 400, secundaria);
  texto(`Total: ${d.total} ${d.total === 1 ? "peça" : "peças"}  ·  Tamanhos: ${d.tamanhos}`, 400, 136, 22, 400, secundaria);
  ctx.fillStyle = fundo;
  ctx.fillRect(48, 164, W - 96, 2);

  // Centro: frente e costas com círculo numerado em cada posição.
  lados.forEach(({ lado, tela: foto, linhas }, i) => {
    const x = 48 + i * 420, y = 200, w = 400, h = 560;
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();
    const fh = h - 40, fw = (fh * 3) / 4, fx = x + (w - fw) / 2, fy = y + 30;
    ctx.drawImage(foto, fx, fy, fw, fh);
    texto(lado === "frente" ? "Frente" : "Costas", x + 20, y + 36, 20, 600);
    for (const l of linhas) {
      const [ax, ay, aw] = areaDe(d.modelo, lado, l.chave)!;
      circulo(l.numero, fx + (ax + aw) * fw, fy + ay * fh, 17);
    }
  });

  // Lateral: nº · posição · até L × A cm · arquivo · miniatura.
  const tx = 908, tw = W - 48 - tx;
  texto("Posições", tx, 226, 22, 600);
  d.linhas.forEach((l, i) => {
    const y = 250 + i * 84;
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(tx, y, tw, 74, 14);
    ctx.fill();
    circulo(l.numero, tx + 34, y + 37, 18);
    texto(l.nome, tx + 66, y + 32, 20, 600);
    texto(l.medida, tx + 66, y + 58, 16, 400, secundaria);
    ctx.font = `400 16px ${fonte}`;
    texto(cortar(ctx, l.arquivo ?? "arte a enviar", 230), tx + 300, y + 44, 16, 400, l.arquivo ? primaria : secundaria);
    const m = miniaturas[i];
    if (m) {
      const s = Math.min(58 / m.width, 58 / m.height);
      ctx.drawImage(m, tx + tw - 66 + (58 - m.width * s) / 2, y + 8 + (58 - m.height * s) / 2, m.width * s, m.height * s);
    }
  });
  if (!d.linhas.length) texto("Nenhuma posição marcada.", tx, 276, 18, 400, secundaria);

  // Rodapé.
  ctx.fillStyle = fundo;
  ctx.fillRect(48, 900, W - 96, 2);
  texto("Prévia ilustrativa. Medidas finais confirmadas pela Whim.", 48, 948, 20, 400, secundaria);
  texto(new Date().toLocaleDateString("pt-BR"), W - 48, 948, 20, 400, secundaria, "right");

  return new Promise((ok, erro) => ctx.canvas.toBlob((b) => (b ? ok(b) : erro(new Error("ficha"))), "image/png"));
}
