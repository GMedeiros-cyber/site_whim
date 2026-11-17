#!/usr/bin/env node
/**
 * Checklist de UX/UI do Monte sua peça (pedido do Gabriel, 17/11/2026, noite).
 * Gera docs/qualidade/monte-sua-peca-checklist.md, os prints em docs/qualidade/prints/monte/ e o
 * resultado bruto em docs/qualidade/monte-sua-peca-resultados.json. Só lê o site; não muda nada.
 *
 * Uma vez:  npm i --no-save playwright-core axe-core
 *           (não muda o package.json nem o lock; usa o Chrome instalado na máquina)
 * Servidor: npm run build && npx next start -p 3417
 * Rodar:    node scripts/testes-monte.mjs --url http://localhost:3417
 *   --rapido   combinações reduzidas (peça × cor e tecido × técnica, 20 combinações de posições)
 *   --so A,C   só esses grupos; os outros ficam como estavam no .json
 *
 * As artes de teste (PNG, JPG, SVG, PDF, 12 MB…) são geradas na hora, no próprio navegador.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let chromium, AXE;
try {
  ({ chromium } = await import("playwright-core"));
  AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
} catch {
  console.error("Falta o Playwright: rode `npm i --no-save playwright-core axe-core` uma vez.");
  process.exit(1);
}

const args = process.argv.slice(2);
const opcao = (k, padrao) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : padrao);
const BASE = opcao("url", "http://localhost:3000").replace(/\/$/, "");
const RAPIDO = args.includes("--rapido");
const SO = opcao("so", "").split(",").filter(Boolean);
const roda = (g) => !SO.length || SO.includes(g);

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(RAIZ, "docs/qualidade");
const PRINTS = join(DOCS, "prints/monte");
const MD = join(DOCS, "monte-sua-peca-checklist.md");
const JSON_RES = join(DOCS, "monte-sua-peca-resultados.json");
mkdirSync(PRINTS, { recursive: true });

// Dados do produto: os mesmos do site (manifesto da arara e personalizador.tsx).
const MANIFESTO = JSON.parse(readFileSync(join(RAIZ, "public/arara/manifest.json"), "utf8"));
const MODELOS = MANIFESTO.pecas;
const CORES = MANIFESTO.cores;
const NOME = {
  "peito-esquerdo": "Peito esquerdo",
  "peito-direito": "Peito direito",
  "centro-peito": "Centro do peito",
  "frente-inteira": "Frente inteira",
  nuca: "Nuca",
  "costas-em-cima": "Costas em cima",
  "costas-inteira": "Costas inteira",
  "manga-esquerda": "Manga esquerda",
  "manga-direita": "Manga direita",
};
const COSTAS = ["nuca", "costas-em-cima", "costas-inteira"];
const ladoDe = (k) => (COSTAS.includes(k) ? "costas" : "frente");
const areaDe = (m, lado, k) => m.areas[lado][k];
const chavesDe = (m) => Object.keys(NOME).filter((k) => areaDe(m, "frente", k) || areaDe(m, "costas", k));
const modelo = (nome) => MODELOS.find((m) => m.nome === nome);

const TELAS = [
  { nome: "390", w: 390, h: 844, toque: true },
  { nome: "768", w: 768, h: 1024, toque: true },
  { nome: "1280", w: 1280, h: 800 },
  { nome: "1920", w: 1920, h: 1080 },
  { nome: "2560", w: 2560, h: 1440 },
  { nome: "67%", w: 1920, h: 1080, zoom: 0.67 },
];
const T = Object.fromEntries(TELAS.map((t) => [t.nome, t]));

// ---------------------------------------------------------------------------------------------
// Itens do checklist: grupo, título e passos para repetir à mão.

const GRUPOS = {
  A: "Peças, cores, tecidos e técnicas",
  B: "Posições (Frente, Costas e Mangas)",
  C: "Anexos",
  D: "Arte na prévia e na ficha",
  E: "Quantidades",
  F: "Navegação",
  G: "Teclado, leitor de tela, contraste e alvos de toque",
  H: "Ficha baixada e WhatsApp",
  L: "Telas (390, 768, 1280, 1920, 2560 e zoom de 67%)",
};
const ITENS = {
  // X0: o grupo X parou no meio (erro do teste ou do site); o detalhe diz onde.
  ...Object.fromEntries("ABCDEFGHL".split("").map((g) => [`${g}0`, ["O grupo parou com erro", `Rode de novo só este grupo com --so ${g}.`]])),
  A1: ["Cada peça em cada cor: arara, prévia, cartão e vitrine", "Clique em cada peça da arara e, para cada uma, em cada cor da vitrine embaixo da prévia."],
  A2: ["Todas as combinações de peça × cor × tecido × técnica no resumo e na ficha", "Vá até o Resumo. Para cada combinação: Alterar peça (peça e tecido) → Salvar; Alterar estampa (técnica) → Salvar; cor na vitrine. Leia o resumo e o topo da ficha."],
  A3: ["Outra cor, escrita pelo cliente", "No passo Cor, escolha \"Outra cor\" e escreva \"verde-bandeira\"; siga até o Resumo. Depois apague o texto; depois clique numa cor da vitrine."],
  A4: ["Trocar a peça tira as posições que ela não tem, com aviso", "Marque Nuca e as duas mangas na Camiseta; no passo Estampa, clique na Regata da arara; volte à Camiseta, marque Nuca e clique no Moletom."],
  B1: ["Cada posição sozinha, em cada peça", "No passo Estampa, marque uma posição por vez (caixa) e olhe o número no mapa, a linha da lista e o marcador \"Sua arte\" na prévia."],
  B2: ["Posições combinadas", "Marque combinações de Frente, Costas e Mangas (todas as válidas da Camiseta e a combinação máxima das outras peças)."],
  B3: ["Posições que se sobrepõem saem com aviso", "Marque os dois peitos e depois Centro do peito; Centro do peito e depois Peito esquerdo; Frente inteira e depois Centro; Costas em cima e Costas inteira."],
  B4: ["Mapa: clicar ou tocar na área marca e desmarca (com folga nas áreas pequenas)", "No mapa da frente, clique no meio da manga esquerda, de novo para desmarcar, a ~15 px da borda da manga e na barra da camiseta."],
  B5: ["Mangas aparecem nas duas vistas", "Marque Manga esquerda e Manga direita e troque Frente/Costas na prévia."],
  C1: ["PNG com fundo transparente", "Marque Centro do peito e anexe um PNG transparente (círculo vermelho)."],
  C2: ["PNG com fundo (fundo removido; \"Manter o fundo\")", "Anexe um PNG com fundo branco; marque e desmarque \"Manter o fundo\"."],
  C3: ["JPG de foto (aviso do silk e \"Ver em DTF\")", "Com a técnica Silk, anexe uma foto JPG colorida; clique em \"Ver em DTF\"."],
  C4: ["SVG (com e sem largura/altura)", "Anexe um SVG com width/height e um só com viewBox."],
  C5: ["PDF é recusado com mensagem clara", "Anexe um PDF."],
  C6: ["Imagem deitada (e aviso de arte larga na manga)", "Anexe uma imagem 1200 × 300 no Centro do peito e na Manga esquerda."],
  C7: ["Imagem em pé", "Anexe uma imagem 300 × 1200 no Centro do peito."],
  C8: ["Imagem quadrada", "Anexe uma imagem 800 × 800 (quadrado cheio) no Centro do peito."],
  C9: ["Imagem muito pequena (< 200 px)", "Anexe uma imagem de 120 × 120 px."],
  C10: ["Arquivo grande (> 10 MB) é recusado com mensagem", "Anexe um PNG de mais de 10 MB."],
  C11: ["Formato não aceito (GIF, HEIC) é recusado com mensagem", "Anexe um GIF e uma foto HEIC do iPhone."],
  C12: ["Arquivo com extensão de imagem que não abre", "Anexe um .png que não é imagem (arquivo corrompido)."],
  C13: ["Trocar o anexo", "Com uma arte anexada, clique em Trocar e escolha outra (verde)."],
  C14: ["Remover o anexo", "Com uma arte anexada, clique em Remover."],
  C15: ["O mesmo anexo em várias posições", "Anexe no Centro do peito; em Costas inteira use \"Usar a mesma arte de: 1. Centro do peito\"; anexe o mesmo arquivo de novo na Nuca."],
  C16: ["Arrastar e soltar a arte", "Arraste um PNG para a caixa \"Arraste a arte ou clique para escolher\"."],
  C17: ["Prévia de cada anexo aceito (folha de contato)", "Anexe cada arquivo dos itens C1 a C13 no Centro do peito da Camiseta azul-marinho."],
  D1: ["A arte fica dentro da área em cada posição de cada peça", "Em cada peça, marque uma posição por vez e anexe um PNG transparente (círculo vermelho). Compare a prévia com a peça lisa."],
  D2: ["A arte não encosta na gola", "Mesmo passo do D1: olhe o recorte de cada posição perto da gola (peitos, centro, frente inteira, nuca e costas em cima)."],
  D3: ["Sem a arte de exemplo (\"Sua arte\") junto da arte anexada", "Mesmo passo do D1: depois de anexar, o marcador \"Sua arte\" tem que sumir da área."],
  D4: ["Várias posições com arte ao mesmo tempo, todas aparecem", "Marque Peito esquerdo, Peito direito, Nuca, Costas em cima e as duas mangas, anexe uma arte em cada e olhe Frente e Costas."],
  D5: ["Prévia final (depois do passo Estampa) com as artes e a miniatura do outro lado", "Com as artes do D4, siga até a Quantidade e olhe a prévia e a miniatura."],
  D6: ["A arte aparece na ficha em cada posição (foto e miniatura)", "Com as artes do D4, siga até o Resumo e olhe a ficha. Repita com Centro do peito + Costas inteira e com Frente inteira."],
  E1: ["Quantidade zero", "No passo Quantidade, não preencha nada e clique em Continuar."],
  E2: ["Abaixo do mínimo (30 peças)", "Coloque M = 30."],
  E3: ["No mínimo (50 peças), com os botões + e −", "Clique 3 vezes em + no P e 1 vez em −; escreva 48 no M."],
  E4: ["Quantidade muito alta", "Escreva 1000000 no G; depois cole um número de 25 dígitos."],
  E5: ["Tamanhos infantis e adultos juntos", "P 10 e M 20 no Adulto; 4 = 15 e 10 = 5 no Infantil."],
  E6: ["Outro tamanho: adicionar, repetido e remover", "Adulto → Adicionar outro tamanho → G4 → Adicionar; tente g4 de novo; quantidade 5; Remover."],
  E7: ["Letras e sinais no campo de quantidade", "Escreva abc, -5 e 1.5 no campo do GG."],
  F1: ["Continuar e Voltar entre os passos sem perder escolhas", "Faça o pedido inteiro (Polo, tecido, Turquesa, 2 posições com arte, DTF, tamanhos) e volte passo a passo com Voltar/Alterar."],
  F2: ["Alterar + Cancelar desfaz; Alterar + Salvar guarda", "No Resumo, Alterar peça → Regata → Cancelar; de novo → Regata → Salvar."],
  F3: ["Recarregar a página no meio do pedido", "Com o pedido no passo Quantidade, aperte F5 (no celular, puxe a página para baixo)."],
  F4: ["Voltar e avançar do navegador", "Vindo da home, monte parte do pedido, aperte Voltar do navegador e depois Avançar."],
  F5: ["Vir da home pela transição de tinta", "Na home, pule a abertura e clique em \"Monte sua peça\" na barra (no celular, Menu → Monte sua peça)."],
  F6: ["Escolher outra peça na arara no meio do pedido", "No passo Quantidade, clique no Baby look da arara."],
  G1: ["O pedido inteiro só com o teclado", "Do título da página, só Tab, Shift+Tab, Enter, Espaço e setas: Polo, tecido, Turquesa, Peito esquerdo no mapa, Costas inteira, anexo, DTF, quantidade, ficha, dados e envio."],
  G2: ["Foco visível em todos os controles", "Mesmo caminho do G1: cada parada do Tab tem que mostrar o anel de foco."],
  G3: ["Ao avançar, o foco vai para o título do passo", "Clique em Continuar e veja onde fica o foco (o leitor de tela lê o nome do passo)."],
  G4: ["Nomes e estados para o leitor de tela", "Com o leitor de tela (NVDA/VoiceOver), percorra a arara, a prévia, a ficha e os campos."],
  G5: ["Rótulos, ARIA e contraste (axe) em cada passo", "Rode o axe (extensão axe DevTools) em cada passo, a 390 e a 1280."],
  G6: ["Alvos de toque com 44 px ou mais", "Em cada passo, meça os botões, caixas e campos (DevTools)."],
  H1: ["A ficha baixada (PNG) é a mesma da tela", "No Resumo, clique em Baixar ficha."],
  H2: ["A ficha confere com o que foi escolhido", "Compare a ficha com o pedido (peça, cor, técnica, tecido, posições, arquivos, medidas, total e tamanhos)."],
  H3: ["O texto do WhatsApp confere com o resumo", "Preencha os dados e clique em Enviar pelo WhatsApp; compare a mensagem com o resumo."],
  H4: ["Seus dados: erros e foco", "Clique em Enviar com tudo vazio; depois telefone 123 e e-mail a@b."],
  H5: ["O contato gravado leva o mesmo pedido do resumo", "Envie e veja o corpo do POST /api/contatos (DevTools → Rede)."],
  L1: ["Fluxo completo, com print de cada passo", "Faça o pedido do F1 na tela indicada."],
  L2: ["Sem rolagem lateral e nada cortado", "Em cada passo, role para os lados e confira as bordas dos cartões."],
  L3: ["A prévia cabe inteira na tela (PC)", "Em cada passo, role a ficha e veja se a prévia fica inteira na tela."],
  L4: ["Sem vão grande embaixo da vitrine", "Em cada passo, role a ficha até o fim e veja o espaço vazio embaixo da prévia."],
  L5: ["Sem erros no console", "Abra o DevTools → Console durante o fluxo."],
};

let resultados = existsSync(JSON_RES) ? JSON.parse(readFileSync(JSON_RES, "utf8")).resultados ?? [] : [];
const novos = [];
function anotar(id, tela, ok, detalhe = "", print = "") {
  novos.push({ id, tela, ok: !!ok, detalhe, print });
  console.log(`${ok ? "ok   " : "FALHA"} ${id} [${tela}] ${detalhe}`);
}

// ---------------------------------------------------------------------------------------------
// Navegador e ganchos na página.

/** Roda antes do site: WhatsApp e balão fechados, e os textos que a ficha desenha (sem OCR). */
function GANCHOS() {
  try {
    sessionStorage.setItem("whim-dica-whatsapp", "1");
  } catch {}
  window.__abertos = [];
  window.open = (u) => (window.__abertos.push(String(u)), null);
  const textos = new WeakMap(), porBlob = new WeakMap();
  window.__ficha = {};
  const ft = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...r) {
    let l = textos.get(this.canvas);
    if (!l) textos.set(this.canvas, (l = []));
    l.push(String(t));
    return ft.call(this, t, ...r);
  };
  const tb = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (cb, ...r) {
    const lista = textos.get(this);
    return tb.call(
      this,
      (b) => {
        if (b && lista) porBlob.set(b, lista);
        cb(b);
      },
      ...r
    );
  };
  const co = URL.createObjectURL;
  URL.createObjectURL = (o) => {
    const u = co.call(URL, o);
    if (porBlob.has(o)) window.__ficha[u] = porBlob.get(o);
    return u;
  };

  const estampa = () => document.querySelector('[role=group][aria-label^="Prévia da peça"] canvas[width="1800"]');
  window.__guardarPlano = (lado) => {
    const c = estampa();
    (window.__planos ??= {})[lado] = c.getContext("2d").getImageData(0, 0, c.width, c.height);
  };
  /**
   * Compara a prévia com a peça lisa do mesmo lado, perto de uma área: caixa de tudo que mudou,
   * caixa do vermelho (e do verde) das artes de teste e quanto mudou fora do vermelho.
   */
  window.__analisar = (lado, area) => {
    const c = estampa(), W = c.width, H = c.height, plano = window.__planos[lado].data;
    const [x, y, w, h, ang = 0] = area, rad = (ang * Math.PI) / 180, aw = w * W, ah = h * H;
    const bw = Math.abs(aw * Math.cos(rad)) + Math.abs(ah * Math.sin(rad));
    const bh = Math.abs(aw * Math.sin(rad)) + Math.abs(ah * Math.cos(rad));
    const cx = (x + w / 2) * W, cy = (y + h / 2) * H, M = 0.1 * W;
    const caixa = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2];
    const x0 = Math.max(0, Math.floor(caixa[0] - M)), y0 = Math.max(0, Math.floor(caixa[1] - M));
    const x1 = Math.min(W, Math.ceil(caixa[2] + M)), y1 = Math.min(H, Math.ceil(caixa[3] + M)), rw = x1 - x0;
    const d = c.getContext("2d").getImageData(x0, y0, rw, y1 - y0).data;
    const mud = [1e9, 1e9, -1, -1], verm = [1e9, 1e9, -1, -1], verde = [1e9, 1e9, -1, -1];
    const amplia = (b, a, z) => ((b[0] = Math.min(b[0], a)), (b[1] = Math.min(b[1], z)), (b[2] = Math.max(b[2], a)), (b[3] = Math.max(b[3], z)));
    let nm = 0, nv = 0, ng = 0;
    const outros = [];
    for (let yy = y0; yy < y1; yy++)
      for (let xx = x0; xx < x1; xx++) {
        const i = ((yy - y0) * rw + (xx - x0)) * 4, j = (yy * W + xx) * 4;
        const dif = Math.abs(d[i] - plano[j]) + Math.abs(d[i + 1] - plano[j + 1]) + Math.abs(d[i + 2] - plano[j + 2]) + Math.abs(d[i + 3] - plano[j + 3]);
        if (dif < 60) continue;
        nm++;
        amplia(mud, xx, yy);
        if (d[i + 3] > 100 && d[i] - Math.max(d[i + 1], d[i + 2]) > 60) {
          nv++;
          amplia(verm, xx, yy);
        } else if (d[i + 3] > 100 && d[i + 1] - Math.max(d[i], d[i + 2]) > 50) {
          ng++;
          amplia(verde, xx, yy);
        } else outros.push(xx, yy);
      }
    const tol = 0.008 * W;
    let fora = 0;
    for (let k = 0; k < outros.length; k += 2)
      if (outros[k] < verm[0] - tol || outros[k] > verm[2] + tol || outros[k + 1] < verm[1] - tol || outros[k + 1] > verm[3] + tol) fora++;
    return { W, H, caixa, mud, verm, verde, nm, nv, ng, fora, areaPx: aw * ah, tol };
  };
  /** Recorte da prévia em volta da área (com a gola por perto), para o print. */
  window.__recorte = (area, lado) => {
    const c = lado === "mini" ? document.querySelector('[role=group][aria-label^="Prévia da peça"] canvas[width="300"]') : estampa();
    const W = c.width, H = c.height, [x, y, w, h] = area;
    const s = Math.min(W, Math.max(w * W, h * H) * 2.4), o = document.createElement("canvas");
    o.width = o.height = 260;
    const g = o.getContext("2d");
    g.fillStyle = "#F5F7FA";
    g.fillRect(0, 0, 260, 260);
    g.drawImage(c, (x + w / 2) * W - s / 2, (y + h / 2) * H - s / 2, s, s, 0, 0, 260, 260);
    return o.toDataURL("image/jpeg", 0.85);
  };
  /** Vermelho na ficha (PNG 1600 × 1000): na foto de cada lado, na área, e na miniatura da linha. */
  window.__fichaVermelho = async (alvos) => {
    const img = document.querySelector('img[alt^="Ficha da estampa"]');
    const bm = await createImageBitmap(await (await fetch(img.getAttribute("src"))).blob());
    const g = new OffscreenCanvas(bm.width, bm.height).getContext("2d");
    g.drawImage(bm, 0, 0);
    const conta = (rx, ry, rw, rh) => {
      const d = g.getImageData(Math.round(rx), Math.round(ry), Math.max(1, Math.round(rw)), Math.max(1, Math.round(rh))).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] - Math.max(d[i + 1], d[i + 2]) > 60) n++;
      return n;
    };
    return alvos.map(({ lado, area, linha }) => {
      const x = 48 + (lado === "frente" ? 0 : 420) + 5, y = 230, fw = 390, fh = 520;
      const [ax, ay, aw, ah, ang = 0] = area, rad = (ang * Math.PI) / 180;
      const w = aw * fw, h = ah * fh, bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)), bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
      const cx = x + (ax + aw / 2) * fw, cy = y + (ay + ah / 2) * fh;
      const naArea = conta(cx - bw / 2 - 3, cy - bh / 2 - 3, bw + 6, bh + 6);
      const naMiniatura = linha === undefined ? null : conta(1486, 250 + linha * 84 + 8, 58, 58);
      return { naArea, naMiniatura, largura: bm.width, altura: bm.height };
    });
  };
}

let browser, oficina;
async function pagina(tela, extra = {}) {
  const z = tela.zoom ?? 1;
  const ctx = await browser.newContext({
    viewport: { width: Math.round(tela.w / z), height: Math.round(tela.h / z) },
    deviceScaleFactor: z,
    isMobile: !!tela.toque,
    hasTouch: !!tela.toque,
    acceptDownloads: true,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    ...extra,
  });
  await ctx.addInitScript(GANCHOS);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.erros = [];
  page.on("pageerror", (e) => page.erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/google|maps\.|gstatic/i.test(m.text() + (m.location()?.url ?? "")) && page.erros.push(m.text()));
  // O contato não vai para o banco: a rota responde aqui e o corpo fica guardado.
  page.contatos = [];
  await page.route("**/api/contatos", (r) => {
    page.contatos.push(JSON.parse(r.request().postData() ?? "{}"));
    r.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' });
  });
  return page;
}
const fechar = (page) => page.context().close();

const PREVIA = '[role=group][aria-label^="Prévia da peça"]';
async function abrirMonte(page) {
  await page.goto(BASE + "/monte-sua-peca", { waitUntil: "load" });
  await page.waitForFunction((s) => document.querySelector(`${s} canvas`)?.dataset.quadro, PREVIA);
}
const grupo = (page, nome) => page.getByRole("group", { name: nome, exact: true });
const botao = (page, nome) => page.getByRole("button", { name: nome, exact: true });
const caixa = (page, nome) => page.getByRole("checkbox", { name: nome, exact: true });
const indicePasso = (page) =>
  page.evaluate(() => [...document.querySelectorAll('ol[aria-label="Passos do pedido"] > li')].findIndex((li) => li.getAttribute("aria-current") === "step"));
async function continuar(page) {
  const antes = await indicePasso(page);
  await page.getByRole("button", { name: /^Continuar/ }).click();
  await page.waitForFunction((a) => [...document.querySelectorAll('ol[aria-label="Passos do pedido"] > li')].findIndex((li) => li.getAttribute("aria-current") === "step") > a, antes);
}
async function ate(page, n) {
  while ((await indicePasso(page)) < n) await continuar(page);
}
async function alterar(page, passo, fn) {
  await page.getByRole("button", { name: `Alterar ${passo}` }).click();
  await fn();
  await botao(page, "Salvar").click();
}
const arara = (page, nome) => page.locator(`ul[aria-label="Arara de modelos"] button[aria-label="${nome}"]`);
const vitrine = (page, cor) => grupo(page, "Cor do tecido").getByRole("button", { name: cor, exact: true });
const resumo = (page) => page.locator("p", { hasText: "Montei minha peça no site" }).innerText();
async function lado(page, l) {
  const b = grupo(page, "Lado da prévia").getByRole("button", { name: l === "frente" ? "Frente" : "Costas", exact: true });
  if ((await b.getAttribute("aria-pressed")) !== "true") await b.click();
}
/** Espera a prévia composta no lado `l` com exatamente `chaves` (e arte nas de `comArte`). */
async function composta(page, l, chaves, comArte = []) {
  await page.waitForFunction(
    ([s, l, chaves, comArte]) => {
      const d = document.querySelector(`${s} canvas[width="1800"]`)?.dataset.pronto;
      if (!d) return false;
      const j = JSON.parse(d.slice(d.indexOf("|") + 1));
      const p = j.p.map((x) => x[0]);
      return j.lado === l && p.length === chaves.length && chaves.every((k) => p.includes(k)) && j.p.every(([k, url]) => !!url === comArte.includes(k));
    },
    [PREVIA, l, chaves, comArte],
    { timeout: 20000 }
  );
}
const noLado = (m, l, chaves) => chaves.filter((k) => areaDe(m, l, k));
async function anexar(page, chave, arq) {
  await page.locator(`#arte-${chave}`).setInputFiles({ name: arq.nome, mimeType: arq.tipo, buffer: arq.buffer });
}
const esperarFicha = (page) => page.locator('img[alt^="Ficha da estampa"]').waitFor({ timeout: 30000 });
const textosFicha = (page) => page.evaluate(() => window.__ficha[document.querySelector('img[alt^="Ficha da estampa"]').getAttribute("src")] ?? []);
const dentro = (b, c, tol) => b[2] >= 0 && b[0] >= c[0] - tol && b[1] >= c[1] - tol && b[2] <= c[2] + tol && b[3] <= c[3] + tol;

// ---------------------------------------------------------------------------------------------
// Prints e folhas de contato (reduzidos e em JPEG no navegador da "oficina").

async function salvar(png, nome, max = 1280) {
  const jpg = await oficina.evaluate(
    async ([b64, max]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const s = Math.min(1, max / img.naturalWidth), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.72).split(",")[1];
    },
    [png.toString("base64"), max]
  );
  writeFileSync(join(PRINTS, `${nome}.jpg`), Buffer.from(jpg, "base64"));
  return `prints/monte/${nome}.jpg`;
}
const print = async (alvo, nome, { max, ...opcoes } = {}) => salvar(await alvo.screenshot(opcoes), nome, max);
const dataUrl = (png) => "data:image/png;base64," + png.toString("base64");

async function folha(celulas, nome, colunas = 5, lado = 260) {
  const b64 = await oficina.evaluate(
    async ([cel, colunas, lado]) => {
      const rot = 34, linhas = Math.ceil(cel.length / colunas), c = document.createElement("canvas");
      c.width = colunas * (lado + 10) + 10;
      c.height = linhas * (lado + rot + 10) + 10;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.font = "13px sans-serif";
      for (let i = 0; i < cel.length; i++) {
        const img = new Image();
        img.src = cel[i].src;
        await img.decode();
        const x = 10 + (i % colunas) * (lado + 10), y = 10 + Math.floor(i / colunas) * (lado + rot + 10);
        const s = Math.min(lado / img.naturalWidth, lado / img.naturalHeight);
        g.drawImage(img, x + (lado - img.naturalWidth * s) / 2, y + (lado - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
        g.fillStyle = cel[i].falha ? "#c0182b" : "#373857";
        g.fillText((cel[i].falha ? "✗ " : "") + cel[i].rotulo, x, y + lado + 18, lado);
      }
      return c.toDataURL("image/jpeg", 0.8).split(",")[1];
    },
    [celulas, colunas, lado]
  );
  writeFileSync(join(PRINTS, `${nome}.jpg`), Buffer.from(b64, "base64"));
  return `prints/monte/${nome}.jpg`;
}

// ---------------------------------------------------------------------------------------------
// Artes de teste, geradas no navegador.

async function gerarArquivos() {
  const gerar = (s) =>
    oficina.evaluate(async (s) => {
      const c = new OffscreenCanvas(s.w, s.h), g = c.getContext("2d");
      if (s.fundo) {
        g.fillStyle = s.fundo;
        g.fillRect(0, 0, s.w, s.h);
      }
      if (s.ruido) {
        const d = g.createImageData(s.w, s.h), v = new Uint32Array(d.data.buffer);
        for (let i = 0; i < v.length; i++) v[i] = ((Math.random() * 0x1000000) | 0xff000000) >>> 0;
        g.putImageData(d, 0, 0);
      }
      if (s.foto) {
        const gr = g.createLinearGradient(0, 0, s.w, s.h);
        ["#2a7", "#fc3", "#e64", "#36c"].forEach((cor, i) => gr.addColorStop(i / 3, cor));
        g.fillStyle = gr;
        g.fillRect(0, 0, s.w, s.h);
        const d = g.getImageData(0, 0, s.w, s.h);
        for (let i = 0; i < d.data.length; i += 4) {
          const n = (Math.random() - 0.5) * 50;
          d.data[i] += n;
          d.data[i + 1] += n;
          d.data[i + 2] += n;
        }
        g.putImageData(d, 0, 0);
      }
      if (s.forma) {
        g.fillStyle = s.forma;
        if (s.quadrado) g.fillRect(0, 0, s.w, s.h);
        else {
          g.beginPath();
          g.ellipse(s.w / 2, s.h / 2, s.w * 0.45, s.h * 0.45, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      const b = await c.convertToBlob({ type: s.tipo, quality: 0.9 });
      return await new Promise((ok) => {
        const f = new FileReader();
        f.onload = () => ok(f.result.split(",")[1]);
        f.readAsDataURL(b);
      });
    }, s);
  const VERMELHO = "#E5312B", PNG = "image/png";
  const img = async (nome, s) => ({ nome, tipo: s.tipo ?? PNG, buffer: Buffer.from(await gerar({ tipo: PNG, ...s }), "base64") });
  const txt = (nome, tipo, conteudo) => ({ nome, tipo, buffer: Buffer.from(conteudo, conteudo.startsWith("R0lG") ? "base64" : "utf8") });
  const svg = (tam) => `<svg xmlns="http://www.w3.org/2000/svg" ${tam}viewBox="0 0 400 400"><circle cx="200" cy="200" r="180" fill="${VERMELHO}"/></svg>`;
  const A = {
    transparente: await img("logo-transparente.png", { w: 600, h: 600, forma: VERMELHO }),
    fundo: await img("logo-com-fundo.png", { w: 600, h: 600, fundo: "#FFFFFF", forma: VERMELHO }),
    foto: await img("foto-do-evento.jpg", { w: 1200, h: 800, foto: true, tipo: "image/jpeg" }),
    svg: txt("logo.svg", "image/svg+xml", svg('width="400" height="400" ')),
    svgSemTamanho: txt("logo-sem-tamanho.svg", "image/svg+xml", svg("")),
    pdf: txt("arte.pdf", "application/pdf", "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"),
    deitada: await img("faixa-deitada.png", { w: 1200, h: 300, forma: VERMELHO }),
    empe: await img("faixa-em-pe.png", { w: 300, h: 1200, forma: VERMELHO }),
    quadrada: await img("quadrado.png", { w: 800, h: 800, forma: VERMELHO, quadrado: true }),
    pequena: await img("logo-pequeno.png", { w: 120, h: 120, forma: VERMELHO }),
    grande: await img("arte-grande.png", { w: 2048, h: 2048, ruido: true }),
    gif: txt("animacao.gif", "image/gif", "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
    heic: { nome: "IMG_0042.heic", tipo: "image/heic", buffer: Buffer.alloc(4096, 7) },
    corrompida: txt("logo-corrompido.png", PNG, "isto não é uma imagem"),
    verde: await img("logo-verde.png", { w: 600, h: 600, forma: "#2E9E44" }),
  };
  console.log(`artes de teste prontas (grande: ${(A.grande.buffer.length / 1048576).toFixed(1)} MB)`);
  return A;
}

// ---------------------------------------------------------------------------------------------
// A · Peças, cores, tecidos e técnicas

async function testarA() {
  // A1: em todas as telas, cada peça em cada cor (folha de contato da prévia).
  for (const tela of TELAS) {
    const page = await pagina(tela);
    try {
      await abrirMonte(page);
      const celulas = [], erros = [];
      for (const m of MODELOS) {
        await arara(page, m.nome).click();
        for (const c of CORES) {
          await vitrine(page, c.nome).click();
          const pasta = `${m.coresPasta}${c.pasta}/`;
          const certo = await page
            .waitForFunction(([s, pasta]) => {
              const cv = document.querySelector(`${s} canvas`);
              // A arara troca de cor quando os quadros novos chegam (pode ser depois da prévia).
              const ar = document.querySelector('ul[aria-label="Arara de modelos"] button[aria-pressed="true"] canvas');
              return cv?.dataset.cor === pasta && cv.dataset.fade === "0" && (!ar || ar.dataset.cor === pasta);
            }, [PREVIA, pasta], { timeout: 15000 })
            .then(() => true, () => false);
          const e = await page.evaluate(([s]) => {
            const p = document.querySelector(s);
            const sel = document.querySelector('ul[aria-label="Arara de modelos"] button[aria-pressed="true"]');
            return {
              cartao: p.querySelector("p.flex")?.innerText.replace(/\s+/g, " ").trim(),
              rotulo: p.querySelector("canvas")?.getAttribute("aria-label"),
              vitrine: p.querySelector('[aria-label="Cor do tecido"] [aria-pressed="true"]')?.getAttribute("aria-label"),
              arara: sel?.getAttribute("aria-label"),
              araraCor: sel?.querySelector("canvas")?.dataset.cor,
            };
          }, [PREVIA, m.nome]);
          const falhas = [
            !certo && "prévia não trocou",
            e.cartao !== `${m.nome} ${c.nome}` && `cartão "${e.cartao}"`,
            e.rotulo !== `${m.nome} na cor ${c.nome}` && `rótulo "${e.rotulo}"`,
            e.vitrine !== c.nome && `vitrine marca "${e.vitrine}"`,
            e.arara !== m.nome && `arara marca "${e.arara}"`,
            e.araraCor && e.araraCor !== pasta && `arara em ${e.araraCor}`,
          ].filter(Boolean);
          if (falhas.length) erros.push(`${m.nome}/${c.nome}: ${falhas.join(", ")}`);
          await page.waitForTimeout(350); // fim do balanço da troca de cor
          celulas.push({ src: dataUrl(await page.locator(PREVIA).screenshot()), rotulo: `${m.nome} · ${c.nome}`, falha: falhas.length > 0 });
        }
      }
      const p = await folha(celulas, `a1-pecas-cores-${tela.nome.replace("%", "")}`, 5, 200);
      anotar("A1", tela.nome, !erros.length, erros.join("; ") || `${celulas.length} combinações certas (peça, cor, cartão, vitrine e arara)`, p);
    } catch (e) {
      anotar("A1", tela.nome, false, `erro no teste: ${e.message.split("\n")[0]}`, await print(page, `a1-erro-${tela.nome.replace("%", "")}`).catch(() => ""));
    }
    await fechar(page);
  }

  // A2: peça × cor × tecido × técnica no resumo e na ficha (1280).
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    const tecidos = await page.locator("select").first().locator("option").allInnerTexts();
    const tecnicas = ["Silk", "DTF", "Bordado", "Ainda não sei"];
    await ate(page, 4);
    let atual = { peca: "Camiseta", tecido: tecidos[0], tecnica: "Silk", cor: "Azul-marinho" };
    const combos = [];
    if (RAPIDO) {
      for (const m of MODELOS) for (const c of CORES) combos.push({ ...atual, peca: m.nome, cor: c.nome });
      for (const tecido of tecidos) for (const tecnica of tecnicas) combos.push({ ...atual, tecido, tecnica });
    } else for (const m of MODELOS) for (const tecido of tecidos) for (const tecnica of tecnicas) for (const c of CORES) combos.push({ peca: m.nome, tecido, tecnica, cor: c.nome });
    const erros = [];
    const t0 = Date.now();
    for (const x of combos) {
      try {
        if (x.peca !== atual.peca || x.tecido !== atual.tecido)
          await alterar(page, "peça", async () => {
            await grupo(page, "Peça").getByRole("button", { name: x.peca, exact: true }).click();
            await page.locator("select").first().selectOption(x.tecido);
          });
        if (x.tecnica !== atual.tecnica) await alterar(page, "estampa", () => grupo(page, "Técnica").getByRole("button", { name: x.tecnica, exact: true }).click());
        if (x.cor !== atual.cor) await vitrine(page, x.cor).click();
        atual = x;
        const alt = `Ficha da estampa: ${x.peca}, ${x.cor}, ${x.tecido}, ${x.tecnica},`;
        await page.locator(`img[alt^="${alt}"]`).waitFor({ timeout: 30000 });
        const r = await resumo(page), f = await textosFicha(page);
        // Cor da foto da ficha: o meio da foto da frente comparado com o mesmo ponto da foto de
        // cada cor (public/arara/<peça>/cores/<cor>/frente.webp).
        const maisPerto = await page.evaluate(async ([pasta, cores]) => {
          const media = async (src, x, y, w, h) => {
            const bm = await createImageBitmap(await (await fetch(src)).blob());
            const g = new OffscreenCanvas(bm.width, bm.height).getContext("2d");
            g.drawImage(bm, 0, 0);
            const d = g.getImageData(x(bm.width), y(bm.height), w(bm.width), h(bm.height)).data, m = [0, 0, 0];
            for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) m[k] += d[i + k] / (d.length / 4);
            return m;
          };
          const ficha = await media(document.querySelector('img[alt^="Ficha da estampa"]').getAttribute("src"), () => 53 + 195 - 12, () => 230 + 260 - 12, () => 24, () => 24);
          const dist = [];
          for (const c of cores) {
            const m = await media(`${pasta}${c.pasta}/frente.webp`, (w) => w / 2 - (12 * w) / 390, (h) => h / 2 - (12 * h) / 520, (w) => (24 * w) / 390, (h) => (24 * h) / 520);
            dist.push([c.nome, m.reduce((s, v, k) => s + (v - ficha[k]) ** 2, 0)]);
          }
          return dist.sort((a, b) => a[1] - b[1])[0][0];
        }, [modelo(x.peca).coresPasta, CORES]);
        const falta = [
          `• Peça: ${x.peca} · Cor: ${x.cor}`,
          `• Tecido: ${x.tecido}`,
          `• Técnica: ${x.tecnica}`,
        ].filter((l) => !r.includes(l));
        const faltaFicha = [`Ficha da estampa · ${x.peca}`, `Cor: ${x.cor}  ·  Técnica: ${x.tecnica}`, `Tecido: ${x.tecido}`].filter((l) => !f.includes(l));
        if (falta.length || faltaFicha.length || maisPerto !== x.cor)
          erros.push(`${x.peca}/${x.cor}/${x.tecido}/${x.tecnica}: ${[...falta.map((l) => `resumo sem "${l}"`), ...faltaFicha.map((l) => `ficha sem "${l}"`), maisPerto !== x.cor && `foto da ficha parece ${maisPerto}`].filter(Boolean).join(", ")}`);
      } catch (e) {
        erros.push(`${x.peca}/${x.cor}/${x.tecido}/${x.tecnica}: ${e.message.split("\n")[0]}`);
      }
    }
    const p = await print(page.locator("#personalizar"), "a2-resumo-ficha");
    anotar("A2", "1280", !erros.length, erros.slice(0, 8).join("; ") + (erros.length > 8 ? ` (+${erros.length - 8})` : "") || `${combos.length} combinações certas no resumo, no topo da ficha e na cor da foto da ficha (${Math.round((Date.now() - t0) / 1000)} s)`, p);
    await fechar(page);
  }

  // A3: outra cor.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    await ate(page, 1);
    await grupo(page, "Cor").getByRole("button", { name: "Outra cor", exact: true }).click();
    await page.getByPlaceholder("Ex.: verde-bandeira").fill("verde-bandeira");
    const aviso = await page.getByText("A prévia continua em Azul-marinho.").isVisible();
    await ate(page, 4);
    await page.locator('img[alt^="Ficha da estampa: Camiseta, verde-bandeira,"]').waitFor();
    const r1 = await resumo(page), f1 = await textosFicha(page);
    const p = await print(page.locator("#personalizar"), "a3-outra-cor");
    await alterar(page, "cor", () => page.getByPlaceholder("Ex.: verde-bandeira").fill(""));
    const r2 = await resumo(page);
    await vitrine(page, "Preto").click();
    const r3 = await resumo(page);
    const erros = [
      !aviso && 'sem "A prévia continua em Azul-marinho."',
      !r1.includes("• Peça: Camiseta · Cor: verde-bandeira") && "resumo sem a cor escrita",
      !f1.includes("Cor: verde-bandeira (prévia em Azul-marinho)  ·  Técnica: Silk") && "ficha sem \"verde-bandeira (prévia em Azul-marinho)\"",
      !r2.includes("Cor: outra, a combinar") && 'vazia não vira "outra, a combinar"',
      !r3.includes("Cor: Preto") && "clicar na vitrine não volta para a cor da vitrine",
    ].filter(Boolean);
    anotar("A3", "1280", !erros.length, erros.join("; ") || 'resumo "Cor: verde-bandeira", ficha "verde-bandeira (prévia em Azul-marinho)", vazia = "outra, a combinar", vitrine volta para a cor dela', p);
    await fechar(page);
  }

  // A4: trocar a peça com posições que ela não tem.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    await ate(page, 2);
    for (const k of ["nuca", "manga-esquerda", "manga-direita"]) await caixa(page, NOME[k]).click();
    await arara(page, "Regata").click();
    const aviso1 = await page.locator('[role=status]').first().innerText().catch(() => "");
    const lista1 = await page.locator("[data-posicao]").evaluateAll((els) => els.map((e) => e.dataset.posicao));
    const p = await print(page.locator("#personalizar"), "a4-troca-peca");
    await arara(page, "Camiseta").click();
    await arara(page, "Moletom canguru").click();
    const aviso2 = await page.locator('[role=status]').first().innerText().catch(() => "");
    const lista2 = await page.locator("[data-posicao]").evaluateAll((els) => els.map((e) => e.dataset.posicao));
    const erros = [
      aviso1 !== "Regata não tem manga esquerda e manga direita: essas posições saíram." && `aviso da Regata: "${aviso1}"`,
      lista1.join() !== "nuca" && `ficaram ${lista1.join(", ")}`,
      aviso2 !== "Moletom canguru não tem nuca: essa posição saiu." && `aviso do Moletom: "${aviso2}"`,
      lista2.length !== 0 && `no Moletom ficaram ${lista2.join(", ")}`,
    ].filter(Boolean);
    anotar("A4", "1280", !erros.length, erros.join("; ") || `"${aviso1}" / "${aviso2}"`, p);
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// B · Posições

async function testarB() {
  // B1 (sozinhas) e B5 (mangas nas duas vistas), em cada peça.
  {
    const page = await pagina(T["1280"]);
    const erros = [], erros5 = [];
    let printB5 = "";
    for (const m of MODELOS) {
      await abrirMonte(page);
      await grupo(page, "Peça").getByRole("button", { name: m.nome, exact: true }).click();
      await ate(page, 2);
      for (const l of ["costas", "frente"]) {
        await lado(page, l);
        await composta(page, l, []);
        await page.evaluate((l) => window.__guardarPlano(l), l);
      }
      const celulas = [];
      for (const k of chavesDe(m)) {
        const l = ladoDe(k);
        await caixa(page, NOME[k]).click();
        try {
          await composta(page, l, [k]);
          const r = await page.evaluate(([l, a]) => window.__analisar(l, a), [l, areaDe(m, l, k)]);
          const e = await page.evaluate(([s, , l]) => ({
            numero: document.querySelector(`[data-mapa="${l}"] button[aria-pressed="true"]`)?.innerText.trim(),
            botao: document.querySelector(`[data-mapa="${l}"] button[aria-pressed="true"]`)?.getAttribute("aria-label"),
            linha: [...document.querySelectorAll("[data-posicao]")].map((x) => x.dataset.posicao).join(),
            rotulo: document.querySelector(`${s} canvas[width="1800"]`).getAttribute("aria-label"),
          }), [PREVIA, k, l]);
          const f = [
            e.numero !== "1" && `número no mapa "${e.numero}"`,
            !e.botao?.startsWith(NOME[k]) && `área marcada "${e.botao}"`,
            e.linha !== k && `lista "${e.linha}"`,
            !e.rotulo.endsWith("com 1 estampa") && `rótulo "${e.rotulo}"`,
            !r.nm && "marcador não aparece",
            r.nm && !dentro(r.mud, r.caixa, r.tol) && "marcador sai da área",
          ].filter(Boolean);
          if (f.length) erros.push(`${m.nome}/${NOME[k]}: ${f.join(", ")}`);
          celulas.push({ src: await page.evaluate(([a, l]) => window.__recorte(a, l), [areaDe(m, l, k), l]), rotulo: NOME[k], falha: f.length > 0 });
          if (k.startsWith("manga")) {
            await lado(page, "costas");
            await composta(page, "costas", [k]);
            const rc = await page.evaluate(([a]) => window.__analisar("costas", a), [areaDe(m, "costas", k)]);
            if (!rc.nm || !dentro(rc.mud, rc.caixa, rc.tol)) erros5.push(`${m.nome}/${NOME[k]} nas costas`);
            if (m.id === "camiseta" && k === "manga-esquerda") printB5 = await print(page.locator(PREVIA), "b5-manga-nas-costas");
            await lado(page, "frente");
          }
        } catch (e) {
          erros.push(`${m.nome}/${NOME[k]}: ${e.message.split("\n")[0]}`);
        }
        await caixa(page, NOME[k]).click();
        await composta(page, ladoDe(k), []).catch(() => {});
      }
      const p = await folha(celulas, `b1-${m.id}`, 5, 180);
      anotar("B1", "1280", !erros.some((e) => e.startsWith(m.nome + "/")), `${m.nome}: ${erros.filter((e) => e.startsWith(m.nome + "/")).join("; ") || `${celulas.length} posições com número, linha, rótulo e marcador dentro da área`}`, p);
    }
    anotar("B5", "1280", !erros5.length, erros5.join("; ") || "Manga esquerda e direita aparecem na frente e nas costas em Camiseta, Polo, Baby look e Moletom", printB5);
    await fechar(page);
  }

  // B2: combinações.
  {
    const page = await pagina(T["1280"]);
    const F = [[], ["peito-esquerdo"], ["peito-direito"], ["peito-esquerdo", "peito-direito"], ["centro-peito"], ["frente-inteira"]];
    const C = [[], ["nuca"], ["costas-em-cima"], ["costas-inteira"], ["nuca", "costas-em-cima"], ["nuca", "costas-inteira"]];
    const M = [[], ["manga-esquerda"], ["manga-direita"], ["manga-esquerda", "manga-direita"]];
    let combos = F.flatMap((f) => C.flatMap((c) => M.map((mm) => [...f, ...c, ...mm]))).filter((x) => x.length);
    if (RAPIDO) combos = combos.filter((_, i) => i % 7 === 0);
    const maximos = [
      ["Polo", ["peito-esquerdo", "peito-direito", "nuca", "costas-em-cima", "manga-esquerda", "manga-direita"]],
      ["Baby look", ["peito-esquerdo", "peito-direito", "nuca", "costas-inteira", "manga-esquerda", "manga-direita"]],
      ["Regata", ["peito-esquerdo", "peito-direito", "nuca", "costas-em-cima"]],
      ["Moletom canguru", ["peito-esquerdo", "peito-direito", "costas-em-cima", "manga-esquerda", "manga-direita"]],
    ];
    const erros = [];
    let n = 0;
    const testar = async (m, combo) => {
      for (const k of combo) await caixa(page, NOME[k]).click();
      const l = ladoDe(combo.at(-1));
      try {
        await composta(page, l, noLado(m, l, combo));
        const e = await page.evaluate(() => ({
          lista: [...document.querySelectorAll("[data-posicao]")].map((x) => x.dataset.posicao),
          aviso: document.querySelector("#personalizar [role=status]")?.innerText ?? "",
        }));
        if (e.lista.join() !== combo.join() || e.aviso) erros.push(`${m.nome}: ${combo.map((k) => NOME[k]).join(" + ")} → lista ${e.lista.join(", ")}${e.aviso ? `, aviso "${e.aviso}"` : ""}`);
        n++;
      } catch (e) {
        erros.push(`${m.nome}: ${combo.join(" + ")}: ${e.message.split("\n")[0]}`);
      }
      for (const k of combo) await caixa(page, NOME[k]).click();
    };
    await abrirMonte(page);
    await ate(page, 2);
    for (const combo of combos) await testar(modelo("Camiseta"), combo);
    let p = "";
    for (const [nome, combo] of maximos) {
      await arara(page, nome).click();
      await testar(modelo(nome), combo);
      for (const k of combo) await caixa(page, NOME[k]).click();
      await composta(page, ladoDe(combo.at(-1)), noLado(modelo(nome), ladoDe(combo.at(-1)), combo)).catch(() => {});
      if (nome === "Polo") p = await print(page.locator("#personalizar"), "b2-combinacao-maxima");
      for (const k of combo) await caixa(page, NOME[k]).click();
    }
    anotar("B2", "1280", !erros.length, erros.slice(0, 6).join("; ") || `${n} combinações (${combos.length} da Camiseta${RAPIDO ? ", amostra" : ", todas as válidas"} + a máxima de cada outra peça): lista na ordem marcada, prévia com as posições do lado e sem aviso`, p);
    await fechar(page);
  }

  // B3: sobreposições.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    await ate(page, 2);
    const casos = [
      [["peito-esquerdo", "peito-direito"], "centro-peito", ["centro-peito"], "Centro do peito não combina com Peito esquerdo e Peito direito, que saíram."],
      [["centro-peito"], "peito-esquerdo", ["peito-esquerdo"], "Peito esquerdo não combina com Centro do peito, que saiu."],
      [["frente-inteira"], "centro-peito", ["centro-peito"], "Centro do peito não combina com Frente inteira, que saiu."],
      [["peito-direito"], "frente-inteira", ["frente-inteira"], "Frente inteira não combina com Peito direito, que saiu."],
      [["costas-em-cima"], "costas-inteira", ["costas-inteira"], "Costas inteira não combina com Costas em cima, que saiu."],
      [["costas-inteira"], "costas-em-cima", ["costas-em-cima"], "Costas em cima não combina com Costas inteira, que saiu."],
      [["nuca"], "costas-inteira", ["nuca", "costas-inteira"], ""],
      [["manga-esquerda"], "manga-direita", ["manga-esquerda", "manga-direita"], ""],
    ];
    const erros = [];
    let p = "";
    for (const [antes, marca, ficam, aviso] of casos) {
      for (const k of antes) await caixa(page, NOME[k]).click();
      await caixa(page, NOME[marca]).click();
      const e = await page.evaluate(() => ({
        lista: [...document.querySelectorAll("[data-posicao]")].map((x) => x.dataset.posicao),
        aviso: document.querySelector("#personalizar [role=status]")?.innerText ?? "",
      }));
      if (e.lista.join() !== ficam.join() || e.aviso !== aviso) erros.push(`${antes.join("+")} → ${marca}: ficaram ${e.lista.join(", ")}, aviso "${e.aviso}"`);
      if (marca === "centro-peito" && !p) p = await print(page.locator("#personalizar"), "b3-sobreposicao");
      for (const k of e.lista) await caixa(page, NOME[k]).click();
    }
    anotar("B3", "1280", !erros.length, erros.join("; ") || `${casos.length} casos: saem as que se sobrepõem, com o aviso certo; Nuca + Costas inteira e as duas mangas convivem`, p);
    await fechar(page);
  }

  // B4: mapa com mouse (1280) e toque (390).
  for (const tela of [T["1280"], T["390"]]) {
    const page = await pagina(tela);
    await abrirMonte(page);
    await ate(page, 2);
    const mapa = page.locator('[data-mapa="frente"]');
    await mapa.scrollIntoViewIfNeeded();
    const r = await mapa.boundingBox();
    const m = modelo("Camiseta");
    const toque = async (fx, fy) => (tela.toque ? page.touchscreen.tap(r.x + fx * r.width, r.y + fy * r.height) : page.mouse.click(r.x + fx * r.width, r.y + fy * r.height));
    const marcada = () => page.locator("[data-posicao]").evaluateAll((els) => els.map((e) => e.dataset.posicao).join());
    const [x, y, w, h] = areaDe(m, "frente", "manga-esquerda");
    const erros = [];
    await toque(x + w / 2, y + h / 2);
    if ((await marcada()) !== "manga-esquerda") erros.push("clicar no meio da manga não marcou");
    await toque(x + w / 2, y + h / 2);
    if ((await marcada()) !== "") erros.push("clicar de novo não desmarcou");
    const folga = 15 / r.width; // ~15 px à direita da borda da área
    await toque(x + w + folga, y + h / 2);
    if ((await marcada()) !== "manga-esquerda") erros.push("a ~15 px da borda da manga não marcou");
    await toque(x + w + folga, y + h / 2);
    await toque(0.5, 0.86);
    if ((await marcada()) !== "") erros.push(`a barra da camiseta marcou ${await marcada()}`);
    const tamanho = `${Math.round(w * r.width)} × ${Math.round(h * r.height)} px`;
    await toque(x + w / 2, y + h / 2);
    const p = await print(page.locator("#personalizar [data-mapa]").first().locator(".."), `b4-mapa-${tela.nome}`);
    anotar("B4", tela.nome, !erros.length, erros.join("; ") || `marca e desmarca no meio, marca a ~15 px fora da manga (que tem ${tamanho} no mapa) e ignora a barra`, p);
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// C · Anexos

async function testarC(ARQ) {
  const page = await pagina(T["1280"]);
  await abrirMonte(page);
  await ate(page, 2);
  const m = modelo("Camiseta"), CP = "centro-peito";
  await composta(page, "frente", []);
  await page.evaluate(() => window.__guardarPlano("frente"));
  await lado(page, "costas");
  await composta(page, "costas", []);
  await page.evaluate(() => window.__guardarPlano("costas"));
  await caixa(page, NOME[CP]).click();
  await composta(page, "frente", [CP]);
  const linha = (k) => page.locator(`[data-posicao="${k}"]`);
  const remover = async (k) => {
    const b = page.getByRole("button", { name: `Remover arte de ${NOME[k].toLowerCase()}` });
    if (await b.count()) await b.click();
  };
  const estado = (k) =>
    linha(k).evaluate((li) => ({
      arquivo: li.querySelector("[title]")?.getAttribute("title") ?? null,
      erro: li.querySelector("[role=alert]")?.innerText ?? "",
      avisos: [...li.querySelectorAll("[role=status]")].map((x) => x.innerText.replace(/\s+/g, " ").trim()),
      texto: li.innerText.replace(/\s+/g, " "),
    }));
  const analisar = (k, l = ladoDe(k)) => page.evaluate(([l, a]) => window.__analisar(l, a), [l, areaDe(m, l, k)]);
  const celulas = [];

  /** Anexa e devolve o estado da linha e a análise da prévia (se foi aceito). */
  async function caso(id, arq, k = CP, esperar = {}) {
    await remover(k);
    await anexar(page, k, arq);
    await page.waitForTimeout(400);
    const e = await estado(k);
    let r = null;
    if (e.arquivo) {
      const marcadas = await page.locator("[data-posicao]").evaluateAll((els) => els.map((x) => x.dataset.posicao));
      await composta(page, ladoDe(k), noLado(m, ladoDe(k), marcadas), [k]).catch(() => {});
      await page.waitForTimeout(esperar.analise ? 900 : 300); // a análise da arte (avisos) chega depois
      Object.assign(e, await estado(k));
      r = await analisar(k);
      celulas.push({ src: await page.evaluate(([a, l]) => window.__recorte(a, l), [areaDe(m, ladoDe(k), k), ladoDe(k)]), rotulo: `${id} · ${arq.nome}` });
    }
    return { e, r };
  }
  // Artes de teste vermelhas: na prévia tem que aparecer vermelho (o marcador "Sua arte" não conta).
  const viu = (x, vermelha = true) => x.r && (vermelha ? x.r.nv > 0 : x.r.nm / x.r.areaPx > 0.3);
  const aceito = (x, vermelha = true) => x.e.arquivo && viu(x, vermelha) && dentro(x.r.mud, x.r.caixa, x.r.tol);
  const descreve = (x, vermelha = true) =>
    x.e.arquivo
      ? `aceito; prévia ${viu(x, vermelha) ? (dentro(x.r.mud, x.r.caixa, x.r.tol) ? "com a arte dentro da área" : "com a arte FORA da área") : x.r?.nm ? 'SEM a arte (mostra o marcador "Sua arte")' : "SEM a arte (área vazia)"}${x.e.texto.includes("Fundo removido") ? '; a linha diz "Fundo removido na prévia"' : ""}`
      : `recusado: "${x.e.erro}"`;
  const linhaPrint = async (nome) => print(linha(CP), nome);

  let x = await caso("C1", ARQ.transparente);
  anotar("C1", "1280", aceito(x) && x.r.nv > 0 && x.r.fora / x.r.areaPx < 0.01, descreve(x), await linhaPrint("c1-png-transparente"));

  x = await caso("C2", ARQ.fundo, CP, { analise: true });
  const removido = x.e.texto.includes("Fundo removido na prévia");
  let maior = false;
  if (removido) {
    await caixa(page, "Manter o fundo").click();
    await page.waitForTimeout(800);
    const r2 = await analisar(CP);
    maior = r2.nm > x.r.nm * 1.1; // o fundo branco aparece em volta do círculo
    celulas.push({ src: await page.evaluate(([a]) => window.__recorte(a, "frente"), [areaDe(m, "frente", CP)]), rotulo: "C2 · fundo mantido" });
  }
  const p2 = await linhaPrint("c2-png-com-fundo");
  if (removido) await caixa(page, "Manter o fundo").click();
  anotar("C2", "1280", aceito(x) && removido && maior, `${descreve(x)}${removido ? "" : '; SEM "Fundo removido na prévia"'}; "Manter o fundo" ${maior ? "mostra o fundo na prévia" : "NÃO muda a prévia"}`, p2);

  x = await caso("C3", ARQ.foto, CP, { analise: true });
  const avisoSilk = x.e.avisos.find((a) => a.includes("muitas cores ou degradê"));
  let dtf = false;
  if (avisoSilk) {
    await page.getByRole("button", { name: "Ver em DTF" }).click();
    dtf = (await grupo(page, "Técnica").getByRole("button", { name: "DTF", exact: true }).getAttribute("aria-pressed")) === "true";
  }
  const p3 = await linhaPrint("c3-jpg-foto");
  await grupo(page, "Técnica").getByRole("button", { name: "Silk", exact: true }).click();
  anotar("C3", "1280", aceito(x, false) && avisoSilk && dtf, `${descreve(x, false)}; aviso do silk ${avisoSilk ? "aparece" : "NÃO aparece"}; "Ver em DTF" ${dtf ? "troca a técnica" : "NÃO troca"}`, p3);

  const s1 = await caso("C4", ARQ.svg), s2 = await caso("C4", ARQ.svgSemTamanho);
  anotar("C4", "1280", aceito(s1) && aceito(s2), `com tamanho: ${descreve(s1)}; só viewBox: ${descreve(s2)}`, await linhaPrint("c4-svg"));

  x = await caso("C5", ARQ.pdf);
  anotar("C5", "1280", !x.e.arquivo && /PNG, JPG, WebP ou SVG/.test(x.e.erro), descreve(x), await linhaPrint("c5-pdf"));

  x = await caso("C6", ARQ.deitada);
  await caixa(page, NOME["manga-esquerda"]).click();
  const xm = await caso("C6", ARQ.deitada, "manga-esquerda", { analise: true });
  const larga = xm.e.avisos.some((a) => a.includes("larga para a manga"));
  const p6 = await print(linha("manga-esquerda"), "c6-deitada-manga");
  await caixa(page, NOME["manga-esquerda"]).click();
  anotar("C6", "1280", aceito(x) && aceito(xm) && larga, `centro: ${descreve(x)}; manga: ${descreve(xm)}, aviso de arte larga ${larga ? "aparece" : "NÃO aparece"}`, p6);

  x = await caso("C7", ARQ.empe);
  anotar("C7", "1280", aceito(x), descreve(x), await linhaPrint("c7-em-pe"));
  x = await caso("C8", ARQ.quadrada);
  anotar("C8", "1280", aceito(x), descreve(x), await linhaPrint("c8-quadrada"));

  x = await caso("C9", ARQ.pequena, CP, { analise: true });
  const avisoPequena = /pequen|resolu|qualidade/i.test(x.e.texto);
  anotar("C9", "1280", aceito(x) && avisoPequena, `${descreve(x)}; ${avisoPequena ? "avisa que a imagem é pequena" : "nenhum aviso de que 120 px é pouco para imprimir (a prévia aceita sem dizer nada)"}`, await linhaPrint("c9-pequena"));

  x = await caso("C10", ARQ.grande);
  anotar("C10", "1280", !x.e.arquivo && /10 MB/.test(x.e.erro), `${(ARQ.grande.buffer.length / 1048576).toFixed(1)} MB: ${descreve(x)}`, await linhaPrint("c10-grande"));

  const g = await caso("C11", ARQ.gif), hh = await caso("C11", ARQ.heic);
  anotar("C11", "1280", !g.e.arquivo && !hh.e.arquivo && /PNG, JPG/.test(g.e.erro) && /PNG, JPG/.test(hh.e.erro), `GIF: ${descreve(g)}; HEIC: ${descreve(hh)}`, await linhaPrint("c11-formato"));

  x = await caso("C12", ARQ.corrompida, CP, { analise: true });
  const avisaCorrompida = !!x.e.erro || x.e.avisos.some((a) => /abr|ler|imagem/i.test(a));
  anotar("C12", "1280", !x.e.arquivo || avisaCorrompida, x.e.arquivo ? `aceito sem aviso: a linha mostra "${x.e.arquivo}" como anexada e a prévia ${x.r?.nv ? "mostra arte" : "volta ao marcador \"Sua arte\""}` : descreve(x), await linhaPrint("c12-corrompida"));

  // C13 Trocar (pelo botão, com a janela de arquivos).
  x = await caso("C13", ARQ.transparente);
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: `Trocar arte de ${NOME[CP].toLowerCase()}` }).click()]);
  await fc.setFiles({ name: ARQ.verde.nome, mimeType: ARQ.verde.tipo, buffer: ARQ.verde.buffer });
  await page.waitForTimeout(800);
  const e13 = await estado(CP), r13 = await analisar(CP);
  anotar("C13", "1280", e13.arquivo === ARQ.verde.nome && r13.ng > 0 && r13.nv === 0, `linha mostra "${e13.arquivo}"; prévia com ${r13.ng ? "a arte verde" : "SEM a verde"} e ${r13.nv ? "AINDA a vermelha" : "sem a vermelha"}`, await linhaPrint("c13-trocar"));

  // C14 Remover.
  await remover(CP);
  await composta(page, "frente", [CP], []);
  const e14 = await estado(CP), r14 = await analisar(CP);
  anotar("C14", "1280", !e14.arquivo && e14.texto.includes("Arraste a arte") && r14.ng === 0 && r14.nm > 0, `linha volta para "Arraste a arte…"; prévia ${r14.ng ? "AINDA com a arte" : "volta ao marcador"}`, await linhaPrint("c14-remover"));

  // C15 mesma arte em várias posições.
  await anexar(page, CP, ARQ.transparente);
  await caixa(page, NOME["costas-inteira"]).click();
  await linha("costas-inteira").locator("select").selectOption("1");
  await caixa(page, NOME.nuca).click();
  await anexar(page, "nuca", ARQ.transparente);
  await lado(page, "costas");
  await composta(page, "costas", ["costas-inteira", "nuca"], ["costas-inteira", "nuca"]);
  const rci = await analisar("costas-inteira", "costas"), rnu = await analisar("nuca", "costas");
  const nomes15 = [await estado("costas-inteira"), await estado("nuca")].map((e) => e.arquivo);
  const p15 = await print(page.locator("#personalizar"), "c15-mesma-arte");
  anotar("C15", "1280", nomes15.every((n) => n === ARQ.transparente.nome) && rci.nv > 0 && rnu.nv > 0, `"Usar a mesma arte de" e anexar de novo: linhas com ${nomes15.join(" e ")}; prévia das costas com arte em Costas inteira (${rci.nv ? "sim" : "NÃO"}) e Nuca (${rnu.nv ? "sim" : "NÃO"})`, p15);
  for (const k of ["costas-inteira", "nuca"]) await caixa(page, NOME[k]).click();

  // C16 arrastar e soltar.
  await remover(CP);
  await page.evaluate(
    ([b64, nome]) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], nome, { type: "image/png" }));
      const alvo = document.querySelector('[data-posicao="centro-peito"] label');
      for (const tipo of ["dragenter", "dragover", "drop"]) alvo.dispatchEvent(new DragEvent(tipo, { dataTransfer: dt, bubbles: true, cancelable: true }));
    },
    [ARQ.transparente.buffer.toString("base64"), ARQ.transparente.nome]
  );
  await lado(page, "frente");
  await composta(page, "frente", [CP], [CP]).then(() => true, () => false);
  const e16 = await estado(CP);
  anotar("C16", "1280", e16.arquivo === ARQ.transparente.nome, e16.arquivo ? "a arte solta na caixa fica anexada" : "soltar a arte não anexou", await linhaPrint("c16-arrastar"));

  const pf = await folha(celulas, "c-anexos-previa", 5, 200);
  anotar("C17", "1280", true, `folha com a prévia de cada anexo aceito: [c-anexos-previa.jpg](${pf})`, pf);
  await fechar(page);

  // No celular: a linha do anexo e o erro cabem na tela.
  const cel = await pagina(T["390"]);
  await abrirMonte(cel);
  await ate(cel, 2);
  await caixa(cel, NOME[CP]).click();
  await anexar(cel, CP, ARQ.pdf);
  const erro390 = await cel.locator(`[data-posicao="${CP}"] [role=alert]`).innerText().catch(() => "");
  await anexar(cel, CP, ARQ.transparente);
  await cel.waitForTimeout(600);
  const largura = await cel.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const p390 = await print(cel.locator(`[data-posicao="${CP}"]`), "c-anexo-390");
  anotar("C1", "390", largura <= 0 && /PNG, JPG/.test(erro390), `PDF recusado com "${erro390}"; PNG anexado; ${largura > 0 ? `rolagem lateral de ${largura} px` : "sem rolagem lateral"}`, p390);
  await fechar(cel);
}

// ---------------------------------------------------------------------------------------------
// D · Arte na prévia e na ficha

const MAXIMO = ["peito-esquerdo", "peito-direito", "nuca", "costas-em-cima", "manga-esquerda", "manga-direita"];
async function testarD(ARQ) {
  const e1 = [], e2 = [], e3 = [], e4 = [], e5 = [], e6 = [];
  const prints = {};
  for (const m of MODELOS) {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    await grupo(page, "Peça").getByRole("button", { name: m.nome, exact: true }).click();
    await ate(page, 2);
    for (const l of ["costas", "frente"]) {
      await lado(page, l);
      await composta(page, l, []);
      await page.evaluate((l) => window.__guardarPlano(l), l);
    }
    const celulas = [];
    // D1 a D3: uma posição por vez, com arte.
    for (const k of chavesDe(m)) {
      const l = ladoDe(k), a = areaDe(m, l, k);
      try {
        await caixa(page, NOME[k]).click();
        await anexar(page, k, ARQ.transparente);
        await composta(page, l, [k], [k]);
        const r = await page.evaluate(([l, a]) => window.__analisar(l, a), [l, a]);
        const ok1 = r.nv > 0 && dentro(r.verm, r.caixa, r.tol);
        const ok2 = r.nv > 0 && r.verm[1] >= r.caixa[1] - r.tol; // não sobe acima da área (a área é que tem que ficar abaixo da gola)
        const ok3 = r.fora / r.areaPx < 0.01;
        if (!ok1) e1.push(`${m.nome}/${NOME[k]}${r.nv ? ` (sai ${Math.round(Math.max(r.caixa[0] - r.verm[0], r.verm[2] - r.caixa[2], r.caixa[1] - r.verm[1], r.verm[3] - r.caixa[3]))} px de 1800)` : " (sem arte)"}`);
        if (!ok2) e2.push(`${m.nome}/${NOME[k]}`);
        if (!ok3) e3.push(`${m.nome}/${NOME[k]} (${((100 * r.fora) / r.areaPx).toFixed(1)}% da área)`);
        celulas.push({ src: await page.evaluate(([a, l]) => window.__recorte(a, l), [a, l]), rotulo: NOME[k], falha: !(ok1 && ok2 && ok3) });
      } catch (err) {
        e1.push(`${m.nome}/${NOME[k]}: ${err.message.split("\n")[0]}`);
      }
      await caixa(page, NOME[k]).click();
    }
    prints[m.id] = await folha(celulas, `d1-${m.id}`, 5, 200);

    // D4 a D6: todas ao mesmo tempo, prévia final e ficha.
    const combos = [MAXIMO.filter((k) => chavesDe(m).includes(k)), ["centro-peito", "costas-inteira"], ["frente-inteira"]];
    for (const [ci, combo] of combos.entries()) {
      if (ci === 0) {
        for (const k of combo) await caixa(page, NOME[k]).click();
        for (const k of combo) await anexar(page, k, ARQ.transparente);
        const sem = [];
        for (const l of ["frente", "costas"]) {
          await lado(page, l);
          await composta(page, l, noLado(m, l, combo), noLado(m, l, combo));
          for (const k of noLado(m, l, combo)) {
            const r = await page.evaluate(([l, a]) => window.__analisar(l, a), [l, areaDe(m, l, k)]);
            if (!r.nv) sem.push(`${NOME[k]} (${l})`);
          }
        }
        if (sem.length) e4.push(`${m.nome}: sem ${sem.join(", ")}`);
        if (m.id === "camiseta") prints.d4 = await print(page.locator(PREVIA), "d4-varias-artes");
        await continuar(page);
        // D5: prévia final (Quantidade): lado atual com artes + miniatura do outro.
        const final = await page.evaluate(([s]) => {
          const p = document.querySelector(s);
          return { mini: !!p.querySelector('canvas[width="300"]'), vitrine: !!p.querySelector('[aria-label="Cor do tecido"]'), pronto: p.querySelector('canvas[width="1800"]').dataset.pronto ?? "" };
        }, [PREVIA]);
        const comArtes = (JSON.parse(final.pronto.slice(final.pronto.indexOf("|") + 1) || "{}").p ?? []).filter((x) => x[1]).length;
        if (!final.mini || !final.vitrine || !comArtes) e5.push(`${m.nome}: miniatura ${final.mini ? "ok" : "não aparece"}, vitrine ${final.vitrine ? "ok" : "não aparece"}, ${comArtes} artes na prévia`);
        if (m.id === "camiseta") prints.d5 = await print(page.locator(PREVIA), "d5-previa-final");
        await page.locator('input[aria-label="Quantidade M"]').fill("50");
        await continuar(page);
      } else {
        await alterar(page, "estampa", async () => {
          for (const k of await page.locator("[data-posicao]").evaluateAll((els) => els.map((e) => e.dataset.posicao))) await caixa(page, NOME[k]).click();
          for (const k of combo) await caixa(page, NOME[k]).click();
          for (const k of combo) await anexar(page, k, ARQ.transparente);
          await composta(page, ladoDe(combo.at(-1)), noLado(m, ladoDe(combo.at(-1)), combo), noLado(m, ladoDe(combo.at(-1)), combo));
        });
      }
      // D6: a ficha tem a arte na foto e na miniatura de cada linha.
      await page.waitForFunction((n) => document.querySelector('img[alt^="Ficha da estampa"]')?.alt.includes(`${n} ${n === 1 ? "posição" : "posições"}`), combo.length, { timeout: 30000 });
      const alvos = combo.flatMap((k, i) => ["frente", "costas"].filter((l) => areaDe(m, l, k)).map((l, j) => ({ lado: l, area: areaDe(m, l, k), linha: j === 0 ? i : undefined, k })));
      const v = await page.evaluate((a) => window.__fichaVermelho(a), alvos);
      const sem = alvos.filter((a, i) => !v[i].naArea || v[i].naMiniatura === 0).map((a) => `${NOME[a.k]} (${a.lado}${v[alvos.indexOf(a)].naMiniatura === 0 ? ", miniatura" : ""})`);
      if (sem.length) e6.push(`${m.nome}: ${sem.join(", ")}`);
      if (m.id === "camiseta" && ci === 0) prints.d6 = await print(page.locator('img[alt^="Ficha da estampa"]'), "d6-ficha-com-artes", { max: 1600 });
    }
    await fechar(page);
  }
  const lista = MODELOS.map((m) => `[${m.nome}](${prints[m.id]})`).join(" · ");
  anotar("D1", "1280", !e1.length, `${e1.join("; ") || "todas as posições das 5 peças com a arte dentro da área (folga de 0,8% para as dobras)"}. Recortes: ${lista}`, prints.camiseta);
  anotar("D2", "1280", !e2.length, `${e2.join("; ") || "automático: a arte não sobe acima da área em nenhuma posição"}. Se a própria área pega a gola, só o olho vê: ver a revisão visual e os recortes do D1`, prints.camiseta);
  anotar("D3", "1280", !e3.length, e3.join("; ") || 'nenhum resto do marcador "Sua arte" junto da arte, em nenhuma posição', prints.camiseta);
  anotar("D4", "1280", !e4.length, e4.join("; ") || "todas as artes aparecem juntas, na frente e nas costas, nas 5 peças", prints.d4);
  anotar("D5", "1280", !e5.length, e5.join("; ") || "depois do passo Estampa a prévia segue com as artes, a vitrine e a miniatura do outro lado", prints.d5);
  anotar("D6", "1280", !e6.length, e6.join("; ") || "a arte aparece na foto da ficha (frente e costas) e na miniatura de cada linha, nas 3 combinações das 5 peças", prints.d6);
}

// ---------------------------------------------------------------------------------------------
// E · Quantidades

async function testarE() {
  const page = await pagina(T["1280"]);
  await abrirMonte(page);
  await ate(page, 3);
  const q = (t) => page.locator(`input[aria-label="Quantidade ${t}"]`);
  const total = () => page.locator("#personalizar [aria-live=polite]").innerText();
  const passo = page.locator("li[aria-current=step]");

  const t0 = await total();
  const p1 = await print(passo, "e1-zero");
  await continuar(page);
  await esperarFicha(page);
  const r0 = await resumo(page), f0 = await textosFicha(page);
  anotar("E1", "1280", t0.includes("0 peças") && t0.includes("Faltam 50 peças para o mínimo de 50.") && r0.includes("• Tamanhos: a definir · Total: 0 peças") && f0.includes("Total: 0 peças"),
    `mostra "${t0.replace(/\s+/g, " ")}"; deixa continuar e o resumo diz "Tamanhos: a definir · Total: 0 peças" (a ficha também)`, p1);
  await botao(page, "Alterar quantidade").click();

  await q("M").fill("30");
  const t2 = await total();
  anotar("E2", "1280", t2.includes("30 peças") && t2.includes("Faltam 20 peças"), t2.replace(/\s+/g, " "), await print(passo, "e2-abaixo"));

  await q("M").fill("0");
  for (let i = 0; i < 3; i++) await botao(page, "Mais P").click();
  await botao(page, "Menos P").click();
  const p = await q("P").inputValue();
  await q("M").fill("48");
  const t3 = await total();
  const menosDesligado = await botao(page, "Menos G").isDisabled();
  anotar("E3", "1280", p === "2" && t3.includes("50 peças") && !t3.includes("Faltam") && menosDesligado, `+3 −1 deu P = ${p}; ${t3.replace(/\s+/g, " ")}; "−" fica desligado no zero: ${menosDesligado ? "sim" : "não"}`, await print(passo, "e3-minimo"));

  await q("G").fill("1000000");
  const t4 = await total();
  const cabe = await q("G").evaluate((i) => ({ cabe: i.scrollWidth <= i.clientWidth, visivel: i.clientWidth }));
  const p4 = await print(passo, "e4-muito-alta");
  await q("G").fill("9999999999999999999999999");
  const t4b = await total(), v4b = await q("G").inputValue();
  const f4 = [!cabe.cabe && `1000000 não cabe no campo (${cabe.visivel} px)`, !/1000050 peças/.test(t4) && `total "${t4}"`, /e\+/.test(t4b + v4b) && `25 dígitos viram "${v4b}" e total "${t4b.replace(/\s+/g, " ")}"`].filter(Boolean);
  anotar("E4", "1280", !f4.length, f4.join("; ") || "aceita e soma", p4);
  await q("G").fill("0");
  await q("P").fill("0");
  await q("M").fill("0");

  // E5 adultos e infantis.
  await q("P").fill("10");
  await q("M").fill("20");
  await grupo(page, "Grupo de tamanhos").getByRole("button", { name: /^Infantil/ }).click();
  await q("Infantil 4").fill("15");
  await q("Infantil 10").fill("5");
  const chips = await grupo(page, "Grupo de tamanhos").getByRole("button").allInnerTexts();
  const t5 = await total();
  const p5 = await print(passo, "e5-adulto-infantil");
  await botao(page, "Salvar").click();
  await page.waitForFunction(() => window.__ficha[document.querySelector('img[alt^="Ficha da estampa"]')?.getAttribute("src")]?.some((t) => t.startsWith("Total: 50")));
  const r5 = await resumo(page), f5 = await textosFicha(page);
  const lista = "P 10, M 20, Infantil 4: 15, Infantil 10: 5";
  const tamFicha = (() => {
    const i = f5.findIndex((t) => t.startsWith("Tamanhos:"));
    const l = [f5[i]];
    for (let j = i; f5[j]?.endsWith(","); j++) l.push(f5[j + 1]);
    return l.join(" ");
  })();
  anotar("E5", "1280", chips.map((c) => c.replace(/\s+/g, " ")).join("|") === "Adulto · 30|Infantil · 20" && t5.includes("50 peças") && r5.includes(`• Tamanhos: ${lista} · Total: 50 peças`) && tamFicha === `Tamanhos: ${lista}`,
    `grupos "${chips.join(" | ").replace(/\s+/g, " ")}"; resumo "${r5.split("\n").find((l) => l.startsWith("• Tamanhos"))}"; ficha "${tamFicha}"`, p5);

  // E6 outro tamanho.
  await alterar(page, "quantidade", async () => {
    await grupo(page, "Grupo de tamanhos").getByRole("button", { name: /^Adulto/ }).click();
    await page.getByRole("button", { name: "Adicionar outro tamanho" }).click();
    await page.getByLabel("Nome do tamanho adulto").fill("G4");
    await botao(page, "Adicionar").click();
    await page.getByRole("button", { name: "Adicionar outro tamanho" }).click();
    await page.getByLabel("Nome do tamanho adulto").fill("g4");
    const repetidoDesligado = await botao(page, "Adicionar").isDisabled();
    await page.getByLabel("Nome do tamanho adulto").press("Escape");
    const fechou = !(await page.getByLabel("Nome do tamanho adulto").count());
    await q("G4").fill("5");
    page.e6 = { repetidoDesligado, fechou, print: await print(passo, "e6-outro-tamanho") };
  });
  await page.waitForTimeout(200);
  const r6 = await resumo(page);
  await alterar(page, "quantidade", () => botao(page, "Remover tamanho G4").click());
  const r6b = await resumo(page);
  anotar("E6", "1280", page.e6.repetidoDesligado && page.e6.fechou && r6.includes("G4 5") && !r6b.includes("G4"),
    `G4 entra no resumo ("${r6.split("\n").find((l) => l.startsWith("• Tamanhos"))}"); "g4" repetido ${page.e6.repetidoDesligado ? "fica desligado" : "é aceito"}; Esc ${page.e6.fechou ? "fecha" : "não fecha"}; Remover tira do resumo`, page.e6.print);

  // E7 letras e sinais.
  await botao(page, "Alterar quantidade").click();
  const vals = [];
  for (const v of ["abc", "-5", "1.5"]) {
    await q("GG").fill(v);
    vals.push(`${v} → ${await q("GG").inputValue()}`);
  }
  anotar("E7", "1280", vals.join() === "abc → 0,-5 → 5,1.5 → 15", `${vals.join("; ")} (o campo só guarda dígitos)`, await print(passo, "e7-letras"));
  await fechar(page);

  // E4 no celular: o número grande cabe?
  const cel = await pagina(T["390"]);
  await abrirMonte(cel);
  await ate(cel, 3);
  await cel.locator('input[aria-label="Quantidade G"]').fill("1000000");
  const c390 = await cel.locator('input[aria-label="Quantidade G"]').evaluate((i) => i.scrollWidth <= i.clientWidth);
  const lateral = await cel.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  anotar("E4", "390", c390 && lateral <= 0, `${c390 ? "1000000 cabe" : "1000000 não cabe no campo"}; ${lateral > 0 ? `rolagem lateral de ${lateral} px` : "sem rolagem lateral"}`, await print(cel.locator("li[aria-current=step]"), "e4-muito-alta-390"));
  await fechar(cel);
}

// ---------------------------------------------------------------------------------------------
// F · Navegação

/** Pedido de exemplo: Polo, 3º tecido, Turquesa, Peito esquerdo (PNG) + Costas inteira (JPG), DTF, P 20, M 20, G 10. */
async function pedidoExemplo(page, ARQ, prints) {
  const tecido = (await page.locator("select").first().locator("option").allInnerTexts())[2];
  await arara(page, "Polo").click(); // no começo, a arara já leva ao passo Cor
  await page.waitForFunction(() => document.querySelector("li[aria-current=step] p[tabindex]")?.innerText === "Cor");
  await vitrine(page, "Turquesa").click();
  await prints?.(1);
  await botao(page, "Alterar peça").click();
  await page.locator("select").first().selectOption(tecido);
  await prints?.(0);
  await botao(page, "Salvar").click();
  await continuar(page);
  await caixa(page, NOME["peito-esquerdo"]).click();
  await anexar(page, "peito-esquerdo", ARQ.transparente);
  await caixa(page, NOME["costas-inteira"]).click();
  await anexar(page, "costas-inteira", ARQ.foto);
  await grupo(page, "Técnica").getByRole("button", { name: "DTF", exact: true }).click();
  await composta(page, "costas", ["costas-inteira"], ["costas-inteira"]);
  await prints?.(2);
  await continuar(page);
  for (const [t, n] of [["P", 20], ["M", 20], ["G", 10]]) await page.locator(`input[aria-label="Quantidade ${t}"]`).fill(String(n));
  await prints?.(3);
  await continuar(page);
  await esperarFicha(page);
  return { peca: "Polo", tecido, cor: "Turquesa", posicoes: ["peito-esquerdo", "costas-inteira"], tecnica: "DTF", tamanhos: "P 20, M 20, G 10", total: 50 };
}
/** O que cada passo mostra quando aberto com Alterar/Voltar. */
const lerPasso = (page) =>
  page.locator("li[aria-current=step]").evaluate((li) => ({
    titulo: li.querySelector("p[tabindex]")?.innerText,
    pressionados: [...li.querySelectorAll('[aria-pressed="true"]')].map((b) => b.innerText.trim()),
    select: li.querySelector("select")?.value,
    linhas: [...li.querySelectorAll("[data-posicao]")].map((x) => `${x.dataset.posicao}:${x.querySelector("[title]")?.getAttribute("title") ?? ""}`),
    qtd: [...li.querySelectorAll('input[aria-label^="Quantidade"]')].filter((i) => i.value !== "0").map((i) => `${i.getAttribute("aria-label").slice(11)} ${i.value}`),
  }));

async function testarF(ARQ) {
  // F1 e F2.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    const p = await pedidoExemplo(page, ARQ);
    const r1 = await resumo(page);
    const erros = [];
    const esperado = [
      { titulo: "Peça", pressionados: ["Polo"], select: p.tecido },
      { titulo: "Cor", pressionados: ["Turquesa"] },
      { titulo: "Estampa", pressionados: ["DTF"], linhas: [`peito-esquerdo:${ARQ.transparente.nome}`, `costas-inteira:${ARQ.foto.nome}`] },
      { titulo: "Quantidade", qtd: ["P 20", "M 20", "G 10"] },
    ];
    // Voltar do Resumo até a Peça, um passo por vez (Voltar abre o anterior; Salvar volta ao Resumo).
    for (let i = 3; i >= 0; i--) {
      if (i === 3) await botao(page, "Voltar").click();
      else await page.getByRole("button", { name: `Alterar ${esperado[i].titulo.toLowerCase()}` }).click();
      const v = await lerPasso(page);
      for (const [k, val] of Object.entries(esperado[i])) {
        const tem = Array.isArray(val) ? val.every((x) => v[k].some((y) => y.includes(x))) : v[k] === val;
        if (!tem) erros.push(`${esperado[i].titulo}: ${k} = ${JSON.stringify(v[k])}`);
      }
      await botao(page, "Salvar").click();
    }
    const r2 = await resumo(page);
    if (r1 !== r2) erros.push("o resumo mudou depois de ir e voltar");
    const pf1 = await print(page.locator("#personalizar"), "f1-ida-e-volta");
    anotar("F1", "1280", !erros.length, erros.join("; ") || "cada passo reabre com o que foi escolhido (peça, tecido, cor, posições com os arquivos, técnica e tamanhos) e o resumo fica igual", pf1);

    // F2: Alterar + Cancelar desfaz; + Salvar guarda (e tira as mangas da Regata).
    await botao(page, "Alterar peça").click();
    await grupo(page, "Peça").getByRole("button", { name: "Regata", exact: true }).click();
    await botao(page, "Cancelar").click();
    const r3 = await resumo(page);
    await botao(page, "Alterar peça").click();
    await grupo(page, "Peça").getByRole("button", { name: "Regata", exact: true }).click();
    await botao(page, "Salvar").click();
    const r4 = await resumo(page);
    const pf2 = await print(page.locator("#personalizar"), "f2-cancelar-salvar");
    anotar("F2", "1280", r3 === r1 && r4.includes("• Peça: Regata"), `Cancelar ${r3 === r1 ? "volta tudo como estava" : "NÃO desfaz"}; Salvar ${r4.includes("Regata") ? "guarda a Regata" : "não guarda"}`, pf2);
    await fechar(page);
  }

  // F3: recarregar no meio do pedido.
  for (const tela of [T["1280"], T["390"]]) {
    const page = await pagina(tela);
    await abrirMonte(page);
    await pedidoExemplo(page, ARQ);
    await botao(page, "Voltar").click();
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction((s) => document.querySelector(`${s} canvas`)?.dataset.quadro, PREVIA);
    const depois = { passo: await page.locator("li[aria-current=step] p[tabindex]").innerText(), cartao: await page.locator(`${PREVIA} p.flex`).innerText() };
    const manteve = depois.passo === "Quantidade" && depois.cartao.includes("Polo");
    anotar("F3", tela.nome, manteve, manteve ? "o pedido continua depois de recarregar" : `tudo volta ao começo: passo "${depois.passo}", prévia "${depois.cartao.replace(/\s+/g, " ")}" (peça, cor, posições, técnica e tamanhos se perdem)`, await print(page, `f3-recarregar-${tela.nome}`));
    await fechar(page);
  }

  // F4 e F5: da home pela transição, e Voltar/Avançar do navegador (em todas as telas).
  for (const tela of TELAS) {
    const page = await pagina(tela);
    const nome = tela.nome.replace("%", "");
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(800);
      await page.keyboard.press("Shift"); // pula a abertura
      await page.waitForTimeout(600);
      let link = page.locator('a[href="/monte-sua-peca"]:visible').first();
      if (!(await link.count())) {
        await page.getByRole("button", { name: "Menu" }).click();
        link = page.locator('a[href="/monte-sua-peca"]:visible').first();
      }
      await link.click();
      await page.waitForTimeout(250);
      const meio = await print(page, `f5-transicao-meio-${nome}`, { max: 900 });
      await page.waitForURL("**/monte-sua-peca");
      await page.waitForFunction(() => !document.querySelector(".pinta-tinta[data-ativa]"));
      const pronto = await page
        .waitForFunction((s) => document.querySelector(`${s} canvas`)?.dataset.quadro && document.querySelector('ul[aria-label="Arara de modelos"] canvas')?.dataset.quadro, PREVIA, { timeout: 20000 })
        .then(() => true, () => false);
      const erroTela = await page.getByText("Esta página não carregou").count();
      const p = await print(page, `f5-chegou-${nome}`, { max: 900 });
      const erros = [!pronto && "a arara ou a prévia não desenharam", erroTela && 'apareceu "Esta página não carregou"', page.erros.length && `console: ${page.erros[0].slice(0, 120)}`].filter(Boolean);
      anotar("F5", tela.nome, !erros.length, erros.join("; ") || `chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](${meio}))`, p);

      // F4: escolhas, Voltar e Avançar do navegador.
      await arara(page, "Polo").click();
      await vitrine(page, "Turquesa").click();
      await page.goBack();
      await page.waitForURL(BASE + "/");
      await page.waitForTimeout(800);
      await page.goForward();
      await page.waitForURL("**/monte-sua-peca");
      await page.waitForFunction(() => !document.querySelector(".pinta-tinta[data-ativa]"));
      await page.waitForTimeout(1200);
      const cartao = await page.locator(`${PREVIA} p.flex`).innerText().catch(() => "");
      const ok = cartao.includes("Polo") && cartao.includes("Turquesa");
      anotar("F4", tela.nome, ok, ok ? "Voltar e Avançar mantêm a peça e a cor" : `depois de Voltar e Avançar a prévia mostra "${cartao.replace(/\s+/g, " ")}" (as escolhas se perdem)`, await print(page, `f4-voltar-avancar-${nome}`, { max: 900 }));
    } catch (e) {
      anotar("F5", tela.nome, false, `erro no teste: ${e.message.split("\n")[0]}`, await print(page, `f5-erro-${nome}`).catch(() => ""));
    }
    await fechar(page);
  }

  // F6: arara no meio do pedido.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    await ate(page, 3);
    await arara(page, "Baby look").click();
    const v = await page.evaluate(() => ({
      passo: document.querySelector("li[aria-current=step] p[tabindex]")?.innerText,
      peca: document.querySelector('ol[aria-label="Passos do pedido"] li p.truncate')?.innerText,
    }));
    anotar("F6", "1280", v.passo === "Quantidade" && v.peca?.startsWith("Baby look"), `continua no passo "${v.passo}" e o passo Peça mostra "${v.peca}"`, await print(page.locator("#personalizar"), "f6-arara-no-meio"));
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// G · Teclado, leitor de tela, contraste e alvos

const FOCO = () => {
  const e = document.activeElement, s = getComputedStyle(e), l = e.closest("label"), sl = l && getComputedStyle(l);
  const anel = (st) => st && ((st.outlineStyle !== "none" && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== "none");
  return {
    tag: e.tagName.toLowerCase(),
    nome: (e.getAttribute("aria-label") || e.labels?.[0]?.innerText || e.closest("label")?.innerText || e.innerText || e.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 60),
    grupo: e.closest("[role=group],ul[aria-label],fieldset,[data-mapa]")?.getAttribute("aria-label") ?? e.closest("[data-mapa]")?.dataset.mapa ?? "",
    id: e.id,
    visivel: e === document.body || anel(s) || anel(sl),
    dentro: !!e.closest("#personalizar"),
  };
};

async function testarG(ARQ) {
  // G1, G2 e G3: o pedido só com o teclado.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    const paradas = [], erros = [], semFoco = new Set();
    let titulos = 0, avancos = 0;
    const tab = async (cond, volta = false, max = 150) => {
      for (let i = 0; i < max; i++) {
        await page.keyboard.press(volta ? "Shift+Tab" : "Tab");
        const f = await page.evaluate(FOCO);
        paradas.push(f);
        if (!f.visivel && f.dentro) semFoco.add(`${f.tag} "${f.nome}"`);
        if (cond(f)) return f;
      }
      throw new Error("não achou pelo Tab");
    };
    const passo = async (nome, fn) => {
      try {
        await fn();
      } catch (e) {
        erros.push(`${nome}: ${e.message.split("\n")[0]}`);
      }
    };
    const avancar = async () => {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(250);
      avancos++;
      const f = await page.evaluate(() => document.activeElement.matches("li[aria-current=step] p[tabindex]"));
      if (f) titulos++;
      if (f && !page.g3) page.g3 = await print(page.locator("li[aria-current=step]"), "g3-foco-no-titulo");
    };
    await page.locator("h1").click();
    // Grupos de opções (Peça, Técnica…) têm foco itinerante: o Tab entra na opção marcada e as setas andam.
    const opcao = async (grupoNome, nome) => {
      await tab((f) => f.grupo === grupoNome);
      for (let i = 0; i < 8 && (await page.evaluate(FOCO)).nome !== nome; i++) await page.keyboard.press("ArrowRight");
      if ((await page.evaluate(FOCO)).nome !== nome) throw new Error(`as setas não chegam em ${nome}`);
      await page.keyboard.press("Space");
    };
    await passo("Polo", async () => {
      await opcao("Peça", "Polo");
      await page.waitForFunction(() => document.querySelector('[aria-label="Peça"] [aria-pressed="true"]')?.innerText === "Polo");
    });
    await passo("tecido", async () => {
      await tab((f) => f.tag === "select");
      await page.keyboard.press("ArrowDown");
      if ((await page.locator("select").first().inputValue()) === (await page.locator("select option").first().innerText())) throw new Error("a seta não trocou o tecido");
    });
    await passo("Continuar (Peça)", async () => {
      await tab((f) => f.nome.startsWith("Continuar"));
      await avancar();
    });
    await passo("Turquesa na vitrine", async () => {
      await tab((f) => f.grupo === "Cor do tecido" && f.nome === "Turquesa", true);
      await page.keyboard.press("Enter");
      await page.waitForFunction((s) => document.querySelector(`${s} p.flex`)?.innerText.includes("Turquesa"), PREVIA);
    });
    await passo("Continuar (Cor)", async () => {
      await tab((f) => f.nome.startsWith("Continuar"));
      await avancar();
    });
    await passo("Peito esquerdo no mapa", async () => {
      await tab((f) => f.grupo === "frente" && f.nome === "Peito esquerdo");
      await page.keyboard.press("Enter");
      await page.locator('[data-posicao="peito-esquerdo"]').waitFor({ timeout: 3000 });
    });
    await passo("Costas inteira (caixa)", async () => {
      await tab((f) => f.nome === "Costas inteira" && f.grupo !== "costas");
      await page.keyboard.press("Space");
      await page.locator('[data-posicao="costas-inteira"]').waitFor({ timeout: 3000 });
    });
    await passo("anexo pelo teclado", async () => {
      await tab((f) => f.id === "arte-peito-esquerdo");
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 4000 }), page.keyboard.press("Space")]);
      await fc.setFiles({ name: ARQ.transparente.nome, mimeType: ARQ.transparente.tipo, buffer: ARQ.transparente.buffer });
      await page.locator('[data-posicao="peito-esquerdo"] [title]').waitFor({ timeout: 3000 });
    });
    await passo("DTF", async () => {
      await opcao("Técnica", "DTF");
      if ((await grupo(page, "Técnica").getByRole("button", { name: "DTF", exact: true }).getAttribute("aria-pressed")) !== "true") throw new Error("DTF não ficou marcado");
    });
    await passo("Continuar (Estampa)", async () => {
      await tab((f) => f.nome.startsWith("Continuar"));
      await avancar();
    });
    await passo("quantidade", async () => {
      await tab((f) => f.nome === "Mais M");
      await page.keyboard.press("Enter");
      await tab((f) => f.nome === "Quantidade M", true);
      await page.keyboard.press("Control+A");
      await page.keyboard.type("50");
      await tab((f) => f.nome.startsWith("Continuar"));
      await avancar();
    });
    await esperarFicha(page);
    await passo("Baixar ficha", async () => {
      await tab((f) => f.nome.includes("Baixar ficha"));
      await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.keyboard.press("Enter")]);
    });
    await passo("dados e envio", async () => {
      await tab((f) => f.id === "pedido-nome");
      await page.keyboard.type("Teste Teclado");
      await page.keyboard.press("Tab");
      await page.keyboard.type("11945448802");
      await page.keyboard.press("Tab");
      await page.keyboard.type("teclado@exemplo.com.br");
      await tab((f) => f.nome.startsWith("Autorizo"));
      await page.keyboard.press("Space");
      await tab((f) => f.nome.startsWith("Enviar pelo WhatsApp"));
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.__abertos.length > 0, null, { timeout: 4000 });
    });
    const pg = await print(page.locator("#personalizar"), "g1-teclado");
    anotar("G1", "1280", !erros.length, erros.join("; ") || `pedido completo e enviado só com o teclado (${paradas.length} paradas do Tab)`, pg);
    anotar("G2", "1280", !semFoco.size, semFoco.size ? `sem anel de foco: ${[...semFoco].join("; ")}` : `todas as ${paradas.length} paradas com anel de foco`, pg);
    anotar("G3", "1280", titulos === avancos, `${titulos} de ${avancos} avanços levam o foco ao título do passo`, page.g3 ?? "");
    await fechar(page);
  }

  // G4: nomes e estados (leitor de tela) + árvore de acessibilidade salva.
  {
    const page = await pagina(T["1280"]);
    await abrirMonte(page);
    const arvores = [];
    const erros = [];
    const r = await page.evaluate(([s]) => {
      const p = document.querySelector(s);
      return {
        arara: [...document.querySelectorAll('ul[aria-label="Arara de modelos"] button')].map((b) => `${b.getAttribute("aria-label")}:${b.getAttribute("aria-pressed")}`),
        previa: p.querySelector("canvas").getAttribute("aria-label"),
        passoAtual: document.querySelector("li[aria-current=step]") !== null,
      };
    }, [PREVIA]);
    if (r.arara.some((a) => a.startsWith("null"))) erros.push("botão da arara sem nome");
    if (!r.previa) erros.push("prévia sem rótulo");
    if (!r.passoAtual) erros.push('passo atual sem aria-current="step"');
    arvores.push("# Passo Peça\n" + (await page.locator("#personalizar").ariaSnapshot()));
    await ate(page, 2);
    await caixa(page, NOME["peito-esquerdo"]).click();
    await caixa(page, NOME["centro-peito"]).click();
    const aviso = await page.locator("#personalizar [role=status]").first().innerText().catch(() => "");
    if (!aviso) erros.push("aviso de posição que saiu não está num role=status");
    const est = await page.evaluate(([s]) => ({
      estampa: document.querySelector(`${s} canvas[width="1800"]`).getAttribute("aria-label"),
      girando: document.querySelector(`${s} canvas`).getAttribute("aria-hidden"),
      feito: document.querySelector('ol[aria-label="Passos do pedido"] svg[aria-label="feito"]')?.getAttribute("role"),
      mapa: [...document.querySelectorAll("[data-mapa] button")].map((b) => b.getAttribute("aria-label")),
    }), [PREVIA]);
    if (!/frente, com 1 estampa$/.test(est.estampa)) erros.push(`prévia da estampa: "${est.estampa}"`);
    if (est.girando !== "true") erros.push("a peça girando continua visível para o leitor no passo Estampa");
    if (est.feito !== "img") erros.push('o "✓ feito" dos passos é um <svg aria-label> sem role="img" (alguns leitores não leem)');
    arvores.push("# Passo Estampa\n" + (await page.locator("#personalizar").ariaSnapshot()));
    await caixa(page, NOME["centro-peito"]).click();
    await ate(page, 3);
    const vivo = await page.locator("[aria-live=polite]").count();
    if (!vivo) erros.push("total sem aria-live");
    arvores.push("# Passo Quantidade\n" + (await page.locator("#personalizar").ariaSnapshot()));
    await ate(page, 4);
    await esperarFicha(page);
    const alt = await page.locator('img[alt^="Ficha da estampa"]').getAttribute("alt");
    if (/,\d/.test(alt)) erros.push(`texto alternativo da ficha sem espaço: "${alt}"`);
    await page.locator("#personalizar").getByRole("button", { name: /^Enviar pelo WhatsApp/ }).click();
    const alerta = await page.locator("#personalizar [role=alert]").count();
    const invalido = await page.locator('#pedido-nome[aria-invalid="true"][aria-describedby="pedido-nome-erro"]').count();
    if (!invalido) erros.push("campo com erro sem aria-invalid/aria-describedby");
    arvores.push("# Passo Resumo (depois de tentar enviar vazio)\n" + (await page.locator("#personalizar").ariaSnapshot()));
    writeFileSync(join(PRINTS, "g4-arvore-acessibilidade.txt"), arvores.join("\n\n"));
    const pg4 = await print(page.locator('ol[aria-label="Passos do pedido"]'), "g4-passos-e-erros");
    anotar("G4", "1280", !erros.length, `${erros.join("; ") || "arara com nome e aria-pressed, prévia com rótulo, passo atual com aria-current, avisos em role=status, total em aria-live, erros em role=alert com aria-invalid"} (${alerta} alerta${alerta === 1 ? "" : "s"} ao enviar vazio). Árvore completa: [g4-arvore-acessibilidade.txt](prints/monte/g4-arvore-acessibilidade.txt)`, pg4);
    await fechar(page);
  }

  // G5 (axe) e G6 (alvos), em cada passo.
  for (const tela of [T["390"], T["768"], T["1280"]]) {
    const page = await pagina(tela);
    await abrirMonte(page);
    const violacoes = new Map(), pequenos = new Map();
    for (let i = 0; i <= 4; i++) {
      await ate(page, i);
      if (i === 2) {
        await caixa(page, NOME["peito-esquerdo"]).click();
        await anexar(page, "peito-esquerdo", ARQ.foto);
        await caixa(page, NOME["costas-inteira"]).click();
        await page.waitForTimeout(800);
      }
      if (i === 4) await esperarFicha(page);
      await page.waitForTimeout(700); // fim das transições (o selo "Prévia" some com o zoom e volta)
      if (i === 2) page.g56 = await print(page.locator("#personalizar"), `g5-g6-estampa-${tela.nome}`);
      if (tela.nome !== "768") {
        if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
        const r = await page.evaluate(async () => {
          const res = await window.axe.run(document.querySelector("#personalizar"), { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] });
          // target-size nas áreas do mapa não vale: elas não recebem toque (pointer-events: none); o
          // toque vai para o mapa, que acha a área com 22 px de folga (item B4).
          return res.violations.map((v) => ({
            id: v.id,
            ajuda: v.help,
            alvos: v.nodes.filter((n) => !(v.id === "target-size" && document.querySelector(n.target.join(" "))?.closest("[data-mapa]"))).map((n) => `${n.target.join(" ")}${n.any[0]?.data?.contrastRatio ? ` (${n.any[0].data.contrastRatio}:1)` : ""}`),
          }));
        });
        for (const v of r) for (const a of v.alvos) violacoes.set(`${v.id}|${a}`, `${v.id} (${v.ajuda}): ${a}`);
      }
      const p = await page.evaluate(() => {
        const sel = "button, a[href], input:not([type=hidden]), select, textarea, [role=checkbox], [role=slider]";
        return [...document.querySelectorAll(`#personalizar :is(${sel})`)]
          .filter((e) => {
            const s = getComputedStyle(e), r = e.getBoundingClientRect();
            return s.visibility !== "hidden" && s.pointerEvents !== "none" && !(e.type === "file" && e.closest("label")) && (r.width > 1 || r.height > 1) && !e.closest("[aria-hidden=true]");
          })
          .map((e) => {
            const alvo = e.closest("label") ?? e, r = alvo.getBoundingClientRect();
            const noTexto = e.tagName === "A" && e.closest("p") && e.closest("p").innerText.length > e.innerText.length + 10;
            return { nome: (e.getAttribute("aria-label") || e.innerText || e.closest("label")?.innerText || e.tagName).replace(/\s+/g, " ").trim().slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), noTexto };
          })
          .filter((x) => (x.w < 44 || x.h < 44) && !x.noTexto);
      });
      for (const x of p) pequenos.set(`${x.nome}`, `${x.nome} (${x.w} × ${x.h})`);
    }
    if (tela.nome !== "768") anotar("G5", tela.nome, !violacoes.size, [...violacoes.values()].slice(0, 12).join("; ") + (violacoes.size > 12 ? ` (+${violacoes.size - 12})` : "") || "nenhuma violação WCAG 2.2 AA do axe nos 5 passos (rótulos, ARIA e contraste)", page.g56);
    anotar("G6", tela.nome, !pequenos.size, [...pequenos.values()].join("; ") || "todos os controles dos 5 passos com 44 px ou mais (caixas medidas pelo rótulo; links no meio do texto não contam)", page.g56);
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// H · Ficha baixada e WhatsApp

async function testarH(ARQ) {
  for (const tela of [T["1280"], T["390"]]) {
    const page = await pagina(tela);
    await abrirMonte(page);
    const p = await pedidoExemplo(page, ARQ);
    const nome = tela.nome;

    // H1 ficha baixada = ficha da tela.
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Baixar ficha/ }).click()]);
    const baixada = readFileSync(await dl.path());
    const naTela = Buffer.from(await page.evaluate(async () => {
      const b = new Uint8Array(await (await fetch(document.querySelector('img[alt^="Ficha da estampa"]').getAttribute("src"))).arrayBuffer());
      let s = "";
      for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768));
      return btoa(s);
    }), "base64");
    const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const png = baixada.subarray(1, 4).toString() === "PNG";
    const [w, h] = [baixada.readUInt32BE(16), baixada.readUInt32BE(20)];
    const igual = createHash("sha256").update(baixada).digest("hex") === createHash("sha256").update(naTela).digest("hex");
    const pf = await salvar(baixada, `h1-ficha-baixada-${nome}`, 1600);
    anotar("H1", nome, png && w === 1600 && h === 1000 && igual && dl.suggestedFilename() === `ficha-whim-polo-${hoje}.png`,
      `"${dl.suggestedFilename()}", PNG ${w} × ${h}, ${(baixada.length / 1024).toFixed(0)} KB, ${igual ? "igual" : "DIFERENTE"} à da tela`, pf);

    // H2 conteúdo da ficha.
    const f = await textosFicha(page);
    const faltam = [
      "Ficha da estampa · Polo",
      `Cor: Turquesa  ·  Técnica: DTF`,
      `Tecido: ${p.tecido}`,
      "Peito esquerdo",
      "Costas inteira",
      ARQ.transparente.nome,
      ARQ.foto.nome,
      "Total: 50 peças",
      "Tamanhos: P 20, M 20, G 10",
    ].filter((t) => !f.includes(t));
    const temMedidas = f.some((t) => t.startsWith("até ≈")) && f.some((t) => t.startsWith("até A3"));
    anotar("H2", nome, !faltam.length && temMedidas, faltam.length ? `ficha sem: ${faltam.join(", ")}` : `ficha com peça, cor, técnica, tecido, as 2 posições com medida e arquivo, total e tamanhos`, pf);

    // H4 erros e foco; H3 texto do WhatsApp; H5 contato gravado.
    await page.locator("#personalizar").getByRole("button", { name: /^Enviar pelo WhatsApp/ }).click();
    const erros4 = await page.locator('#personalizar [id$="-erro"]').allInnerTexts();
    const foco4 = await page.evaluate(() => document.activeElement.id);
    await page.locator("#pedido-telefone").fill("123");
    await page.locator("#pedido-email").fill("a@b");
    await page.locator("#pedido-nome").fill("Ana Teste");
    await page.locator("#personalizar").getByRole("button", { name: /^Enviar pelo WhatsApp/ }).click();
    const erros4b = await page.locator('#personalizar [id$="-erro"]').allInnerTexts();
    const p4 = await print(page.locator("#personalizar form"), `h4-erros-${nome}`);
    const abertos0 = await page.evaluate(() => window.__abertos.length);
    anotar("H4", nome, erros4.length === 4 && foco4 === "pedido-nome" && erros4b.length === 3 && abertos0 === 0,
      `vazio: ${erros4.length} erros e foco em #${foco4}; telefone 123 e e-mail a@b: "${erros4b.join(" / ")}"; ${abertos0 ? "abriu o WhatsApp mesmo assim" : "não abre o WhatsApp"}`, p4);

    await page.locator("#pedido-telefone").fill("11945448802");
    await page.locator("#pedido-email").fill("ana@exemplo.com.br");
    await page.locator("#personalizar").getByRole("checkbox", { name: "Autorizo a Whim a usar estes dados para responder ao meu contato." }).click();
    await page.locator("#personalizar").getByRole("checkbox", { name: "Quero receber novidades e ofertas da Whim." }).click();
    const textoResumo = await resumo(page);
    await page.locator("#personalizar").getByRole("button", { name: /^Enviar pelo WhatsApp/ }).click();
    await page.waitForFunction(() => window.__abertos.length > 0);
    const aberto = await page.evaluate(() => window.__abertos.at(-1));
    const msg = new URL(aberto).searchParams.get("text");
    const linhas = [
      "• Contato: Ana Teste · (11) 94544-8802 · ana@exemplo.com.br",
      "• Peça: Polo · Cor: Turquesa",
      `• Tecido: ${p.tecido}`,
      "• Técnica: DTF",
      `  1. Peito esquerdo (até ≈ 10 × 10 cm): ${ARQ.transparente.nome}`,
      `  2. Costas inteira (até A3 (29,7 × 42 cm)): ${ARQ.foto.nome}`,
      "• Tamanhos: P 20, M 20, G 10 · Total: 50 peças",
    ].filter((l) => !msg.includes(l));
    anotar("H3", nome, msg === textoResumo && !linhas.length, msg === textoResumo ? (linhas.length ? `igual ao resumo, mas sem: ${linhas.join(" | ")}` : `mensagem igual ao resumo da tela, com contato, peça, cor, tecido, técnica, posições com medida e arquivo e tamanhos (${aberto.split("?")[0]})`) : "a mensagem do WhatsApp é diferente do resumo da tela", await print(page.locator("p", { hasText: "Montei minha peça no site" }), `h3-resumo-${nome}`));
    await page.waitForTimeout(300);
    const c = page.contatos.at(-1) ?? {};
    const ph5 = await print(page.locator("#personalizar form"), `h5-enviado-${nome}`);
    anotar("H5", nome, c.origem === "monte-sua-peca" && c.pedido === textoResumo && c.ofertas === true && c.consentimento === true && c.nome === "Ana Teste",
      `POST /api/contatos: origem "${c.origem}", pedido ${c.pedido === textoResumo ? "igual ao resumo" : "DIFERENTE do resumo"}, consentimento ${c.consentimento}, ofertas ${c.ofertas}`, ph5);
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// L · Telas

async function testarL(ARQ) {
  for (const tela of TELAS) {
    const page = await pagina(tela);
    const nome = tela.nome.replace("%", "");
    const prints = [], lateral = [], cortados = [], foraDaTela = [], vaos = [];
    /** Mede o passo aberto: rolagem lateral, cartões cortados, prévia na tela e vão embaixo dela. */
    const medir = async (i) => {
      const titulo = page.locator("li[aria-current=step] p[tabindex]");
      await titulo.evaluate((t) => t.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForTimeout(500);
      prints[i] = await print(page, `l-${nome}-passo${i + 1}`, { max: 1280 });
      const m = await page.evaluate(async ([s]) => {
        const lado = document.documentElement.scrollWidth - innerWidth;
        // Dentro de faixa com rolagem própria (a arara no celular) passar da borda é de propósito.
        const naFaixa = (e) => {
          for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== "visible") return true;
          return false;
        };
        const cortes = [...document.querySelectorAll("#personalizar *")].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && !e.closest(`ul[aria-label="Arara de modelos"], ${s}, [aria-hidden=true]`) && getComputedStyle(e).position !== "fixed" && !naFaixa(e);
        }).slice(0, 3).map((e) => `<${e.tagName.toLowerCase()} class="${String(e.className).slice(0, 60)}"> (${Math.round(e.getBoundingClientRect().left)} a ${Math.round(e.getBoundingClientRect().right)} px)`);
        // Rola a ficha de cima a baixo e mede a prévia (e o vão embaixo dela) em cada ponto.
        const p = document.querySelector(s), ficha = document.querySelector('ol[aria-label="Passos do pedido"]').parentElement;
        const ini = ficha.getBoundingClientRect().top + scrollY - 100, fim = ficha.getBoundingClientRect().bottom + scrollY - innerHeight + 40;
        let fora = 0, vao = 0, yVao = 0;
        const largo = innerWidth >= 1024;
        for (let y = ini; y <= Math.max(ini, fim); y += innerHeight / 3) {
          scrollTo({ top: y, behavior: "instant" }); // o site rola suave por padrão
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const r = p.getBoundingClientRect(), f = ficha.getBoundingClientRect();
          if (largo && (r.top < -1 || r.bottom > innerHeight + 1) && f.top < innerHeight && f.bottom > 0) fora = Math.max(fora, Math.round(Math.max(-r.top, r.bottom - innerHeight)));
          // Vão: a ficha continua na tela, mas embaixo da prévia (no PC) só há fundo até o fim da tela.
          const v = Math.round(Math.min(innerHeight, f.bottom) - r.bottom);
          if (largo && f.bottom > r.bottom + 40 && v > vao) [vao, yVao] = [v, y];
        }
        if (yVao) scrollTo({ top: yVao, behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { lado, cortes, fora, vao, altura: innerHeight };
      }, [PREVIA]);
      if (m.lado > 0) lateral.push(`passo ${i + 1}: ${m.lado} px`);
      if (m.cortes.length) cortados.push(`passo ${i + 1}: passam da borda ${m.cortes.join(", ")}`);
      if (m.fora) foraDaTela.push(`passo ${i + 1}: ${m.fora} px da prévia fora da tela`);
      if (m.vao > Math.max(160, m.altura * 0.25)) vaos.push(`passo ${i + 1}: ${m.vao} px (${Math.round((100 * m.vao) / m.altura)}% da altura da tela) [print](${await print(page, `l-${nome}-vao-passo${i + 1}`, { max: 1280 })})`);
    };
    try {
      await abrirMonte(page);
      await medir(0);
      await pedidoExemplo(page, ARQ, async (i) => {
        if (i >= 1) await medir(i);
      });
      await medir(4);
      const linksPrints = prints.map((p, i) => `[${i + 1}](${p})`).join(" ");
      anotar("L1", tela.nome, true, `pedido completo nos 5 passos; prints: ${linksPrints}`, prints[2]);
      anotar("L2", tela.nome, !lateral.length && !cortados.length, [...lateral, ...cortados].join("; ") || "sem rolagem lateral e nada passa da borda", prints[2]);
      anotar("L3", tela.nome, !foraDaTela.length, foraDaTela.join("; ") || (tela.w / (tela.zoom ?? 1) >= 1024 ? "a prévia fica inteira na tela enquanto a ficha rola" : "no celular a prévia fica em cima da ficha (não se aplica)"), prints[2]);
      anotar("L4", tela.nome, !vaos.length, vaos.join("; ") || (tela.w / (tela.zoom ?? 1) >= 1024 ? "sem vão grande embaixo da prévia" : "no celular a ficha fica embaixo da prévia (não se aplica)"), prints[2]);
      anotar("L5", tela.nome, !page.erros.length, page.erros.slice(0, 3).join(" | ") || "nenhum erro no console durante os 5 passos", prints[4]);
    } catch (e) {
      anotar("L1", tela.nome, false, `erro no teste: ${e.message.split("\n")[0]}`, await print(page, `l-${nome}-erro`).catch(() => ""));
    }
    await fechar(page);
  }
}

// ---------------------------------------------------------------------------------------------
// Relatório

const INICIO_MANUAL = "<!-- revisão visual: o script mantém o que estiver entre esta linha e a de fim -->";
const FIM_MANUAL = "<!-- fim da revisão visual -->";
function gerarMarkdown() {
  const antigo = existsSync(MD) ? readFileSync(MD, "utf8") : "";
  const manual = antigo.includes(INICIO_MANUAL) ? antigo.slice(antigo.indexOf(INICIO_MANUAL) + INICIO_MANUAL.length, antigo.indexOf(FIM_MANUAL)).trim() : "## Revisão visual\n\n(Nada ainda.)";
  const porId = new Map();
  for (const r of resultados) {
    if (!porId.has(r.id)) porId.set(r.id, []);
    porId.get(r.id).push(r);
  }
  const ordem = (a, b) => a.localeCompare(b, "pt", { numeric: true });
  const ids = [...porId.keys()].sort(ordem);
  const falhas = ids.filter((id) => porId.get(id).some((r) => !r.ok));
  const ordemTela = (r) => TELAS.findIndex((t) => t.nome === r.tela);
  const commit = (() => {
    try {
      return execSync("git rev-parse --short HEAD", { cwd: RAIZ }).toString().trim();
    } catch {
      return "?";
    }
  })();
  const L = [
    "# Monte sua peça · checklist de UX/UI",
    "",
    `Gerado por \`scripts/testes-monte.mjs\` em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, contra ${BASE} (commit \`${commit}\`)${RAPIDO ? ", modo --rapido" : ""}.`,
    "Para rodar de novo: `npm i --no-save playwright-core axe-core`, `npm run build`, `npx next start -p 3417` e `node scripts/testes-monte.mjs --url http://localhost:3417` (o cabeçalho do script explica as opções).",
    "",
    "Telas: 390 × 844 (celular, toque), 768 × 1024 (tablet, toque), 1280 × 800, 1920 × 1080, 2560 × 1440 e 1920 × 1080 com zoom de 67% (2866 × 1612 px de CSS).",
    "As artes de teste são geradas pelo script (círculo vermelho para medir a arte na prévia). O WhatsApp e o envio do contato são interceptados: nada sai do navegador.",
    "",
    `**${ids.length - falhas.length} itens ok e ${falhas.length} com falha.**`,
    "",
    "## Falhas",
    "",
    ...(falhas.length
      ? falhas.flatMap((id) => {
          const rs = porId.get(id).filter((r) => !r.ok).sort((a, b) => ordemTela(a) - ordemTela(b));
          return [`- **${id} · ${ITENS[id][0]}** (${rs.map((r) => r.tela).join(", ")}): ${rs[0].detalhe}${rs[0].print ? ` [print](${rs[0].print})` : ""}`];
        })
      : ["Nenhuma."]),
    "",
    // Revisão feita no olho (prints): o script guarda o que estiver entre as marcas ao rodar de novo.
    INICIO_MANUAL,
    manual,
    FIM_MANUAL,
    "",
  ];
  for (const [g, titulo] of Object.entries(GRUPOS)) {
    const doGrupo = ids.filter((id) => id.replace(/\d+$/, "") === g);
    if (!doGrupo.length) continue;
    L.push(`## ${g} · ${titulo}`, "");
    for (const id of doGrupo) {
      const rs = porId.get(id).sort((a, b) => ordemTela(a) - ordemTela(b));
      const st = rs.every((r) => r.ok) ? "ok" : "falha";
      L.push(`### ${id} · ${ITENS[id][0]} — ${st}`, "", `**Passos para repetir:** ${ITENS[id][1]}`, "");
      for (const r of rs) L.push(`- ${r.ok ? "ok" : "**falha**"} · ${r.tela}: ${r.detalhe}${r.print ? ` · [print](${r.print})` : ""}`);
      L.push("");
    }
  }
  writeFileSync(MD, L.join("\n") + "\n");
}

// ---------------------------------------------------------------------------------------------

browser = await chromium.launch({ channel: "chrome" });
oficina = await (await browser.newContext()).newPage();
const inicio = Date.now();
try {
  const ARQ = await gerarArquivos();
  for (const [g, fn] of Object.entries({ A: testarA, B: testarB, C: testarC, D: testarD, E: testarE, F: testarF, G: testarG, H: testarH, L: testarL })) {
    if (!roda(g)) continue;
    console.log(`\n== ${g} · ${GRUPOS[g]}`);
    try {
      await fn(ARQ);
    } catch (e) {
      anotar(`${g}0`, "-", false, `o grupo parou: ${e.message.split("\n")[0]}`);
      console.error(e);
    }
  }
} finally {
  const rodados = new Set(novos.map((r) => r.id.replace(/\d+$/, "")));
  resultados = [...resultados.filter((r) => !rodados.has(r.id.replace(/\d+$/, ""))), ...novos];
  writeFileSync(JSON_RES, JSON.stringify({ gerado: new Date().toISOString(), base: BASE, resultados }, null, 1));
  gerarMarkdown();
  // Prints que o checklist não cita mais (de rodadas antigas) saem.
  const md = readFileSync(MD, "utf8");
  for (const p of readdirSync(PRINTS)) if (!md.includes(`prints/monte/${p}`)) rmSync(join(PRINTS, p));
  await browser.close();
  console.log(`\n${novos.filter((r) => !r.ok).length} falha(s) em ${novos.length} verificações, ${Math.round((Date.now() - inicio) / 1000)} s. Checklist: ${MD}`);
}
