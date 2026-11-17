#!/usr/bin/env node
/**
 * Espaços vazios grandes, como o vão embaixo da vitrine do Monte sua peça (pedido do Gabriel,
 * 17/11/2026, noite). Páginas /, /monte-sua-peca (passos Peça, Estampa e Resumo), /privacidade e
 * 404, a 1280 × 800, 1920 × 1080 e 2560 × 1440 e com zoom de 67% e 50% (numa tela 1920 × 1080).
 * Gera docs/qualidade/espacos-vazios.md e os prints marcados em docs/qualidade/prints/vazios/.
 *
 * Uma vez:  npm i --no-save playwright-core   (não muda o package.json; usa o Chrome instalado)
 * Rodar:    npm run build && npx next start -p 3417, e depois
 *           node scripts/espacos-vazios.mjs --url http://localhost:3417
 *
 * Como mede: rola a página de meia em meia tela (com a barra, o botão do WhatsApp e o que mais
 * for fixo escondidos), fotografa e procura o maior retângulo só com fundo liso dentro da faixa
 * do conteúdo que está na tela. Conta como vão, com pelo menos 30% da altura da tela (e 240 px)
 * e 30% da largura do conteúdo:
 *   - "coluna": tem conteúdo ao lado em pelo menos metade da altura (uma coluna acabou e a do
 *     lado continua, como embaixo da vitrine) e não é a margem de um bloco centralizado;
 *   - "faixa": quase a largura toda do conteúdo e pelo menos metade da altura da tela.
 * O respiro em volta de títulos e as margens dos lados em tela larga não entram (a largura que o
 * conteúdo ocupa fica numa tabela à parte).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Falta o Playwright: rode `npm i --no-save playwright-core axe-core` uma vez.");
  process.exit(1);
}
const args = process.argv.slice(2);
const BASE = (args.includes("--url") ? args[args.indexOf("--url") + 1] : "http://localhost:3000").replace(/\/$/, "");
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRINTS = join(RAIZ, "docs/qualidade/prints/vazios");
const MD = join(RAIZ, "docs/qualidade/espacos-vazios.md");
if (existsSync(PRINTS)) for (const f of readdirSync(PRINTS)) rmSync(join(PRINTS, f));
mkdirSync(PRINTS, { recursive: true });

const TELAS = [
  { nome: "1280", w: 1280, h: 800 },
  { nome: "1920", w: 1920, h: 1080 },
  { nome: "2560", w: 2560, h: 1440 },
  { nome: "zoom 67%", w: 1920, h: 1080, zoom: 0.67 },
  { nome: "zoom 50%", w: 1920, h: 1080, zoom: 0.5 },
];

/** Quem cuida de cada pedaço (referencia/home/README.md, "Quem mexe em quê", e o RELATORIO). */
function dono(pagina, secao) {
  if (secao === "rodapé") return "agente 2 (rodapé; `site-footer.tsx` é compartilhado, pedir antes)";
  if (pagina === "/") return "agente 2 (home)";
  if (pagina.startsWith("/monte-sua-peca")) return "agente 1 (Monte sua peça)";
  return "agente 3 (qualidade: /privacidade e 404)";
}

const PAGINAS = [
  { nome: "/", url: "/", prep: async (p) => (await p.waitForTimeout(800), await p.keyboard.press("Shift"), await p.waitForTimeout(2500)) },
  { nome: "/monte-sua-peca (passo Peça)", url: "/monte-sua-peca", prep: monte(0) },
  { nome: "/monte-sua-peca (passo Estampa)", url: "/monte-sua-peca", prep: monte(2), so: "#personalizar" },
  { nome: "/monte-sua-peca (passo Resumo)", url: "/monte-sua-peca", prep: monte(4), so: "#personalizar" },
  { nome: "/privacidade", url: "/privacidade" },
  { nome: "404", url: "/pagina-que-nao-existe" },
];

/** Monte sua peça no passo `n` (no Estampa, Peito esquerdo e Costas inteira marcados). */
function monte(n) {
  return async (page) => {
    await page.waitForFunction(() => document.querySelector('[role=group][aria-label^="Prévia da peça"] canvas')?.dataset.quadro);
    for (let i = 0; i < n; i++) {
      if (i === 2) {
        for (const nome of ["Peito esquerdo", "Costas inteira"]) await page.getByRole("checkbox", { name: nome, exact: true }).click();
        await page.waitForTimeout(800);
      }
      await page.getByRole("button", { name: /^Continuar/ }).click();
    }
    if (n === 2) {
      for (const nome of ["Peito esquerdo", "Costas inteira"]) await page.getByRole("checkbox", { name: nome, exact: true }).click();
    }
    await page.waitForTimeout(1200);
  };
}

/** No navegador da página: esconde o que é fixo e diz onde está o conteúdo (faixa e seções). */
function prepararTela() {
  for (const e of document.querySelectorAll("body *")) if (getComputedStyle(e).position === "fixed") e.style.setProperty("visibility", "hidden", "important");
  const vistos = [];
  for (const e of document.querySelectorAll("main *, footer *")) {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.width > innerWidth * 0.9 || r.bottom < 0 || r.top > innerHeight) continue;
    const s = getComputedStyle(e);
    if (s.visibility === "hidden" || s.opacity === "0" || e.closest("[aria-hidden=true]:not(svg)")) continue;
    const texto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (texto || /^(IMG|CANVAS|SVG|svg|VIDEO|IFRAME|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName)) vistos.push([r.left, r.right]);
  }
  if (!vistos.length) return { esq: 0, dir: 0, altura: document.documentElement.scrollHeight };
  const esq = Math.max(0, Math.min(...vistos.map((v) => v[0]))), dir = Math.min(innerWidth, Math.max(...vistos.map((v) => v[1])));
  return { esq, dir, altura: document.documentElement.scrollHeight };
}

/** Seção que está no ponto (x, y) da tela. */
function secaoEm([x, y]) {
  const e = document.elementFromPoint(x, y);
  if (!e) return "?";
  if (e.closest("footer")) return "rodapé";
  const s = e.closest("section[id], [id=contato], [id=personalizar], main");
  const t = s?.querySelector("h1, h2")?.innerText.replace(/\s+/g, " ").trim();
  return s ? `${s.id ? `#${s.id}` : s.tagName.toLowerCase()}${t ? ` ("${t.slice(0, 40)}")` : ""}` : e.tagName.toLowerCase();
}

let oficina;
/**
 * Maior retângulo só de fundo liso (células de 8 px com cor uniforme) entre x0 e x1, que tenha
 * pelo menos minH de altura e minW de largura. Devolve também o print marcado (JPEG).
 */
async function procurar(png, { x0, x1, minH, minW, escala }) {
  return oficina.evaluate(
    async ([b64, x0, x1, minH, minW, escala]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, W, H).data;
      const T = Math.max(4, Math.round(8 * escala)), cx0 = Math.ceil((x0 * escala) / T), cx1 = Math.floor((x1 * escala) / T), linhas = Math.floor(H / T), cols = cx1 - cx0;
      const liso = (cx, cy) => {
        let min = [255, 255, 255], max = [0, 0, 0];
        for (let y = cy * T; y < cy * T + T; y += 2)
          for (let x = cx * T; x < cx * T + T; x += 2) {
            const i = (y * W + x) * 4;
            for (let k = 0; k < 3; k++) [min[k], max[k]] = [Math.min(min[k], d[i + k]), Math.max(max[k], d[i + k])];
          }
        return max[0] - min[0] <= 6 && max[1] - min[1] <= 6 && max[2] - min[2] <= 6;
      };
      const vazio = Array.from({ length: linhas }, (_, r) => Array.from({ length: cols }, (_, c2) => liso(cx0 + c2, r)));
      // Soma de células com conteúdo por linha, para saber se há algo ao lado de um trecho.
      const soma = vazio.map((l) => l.reduce((a, v, i) => (a.push(a[i] + (v ? 0 : 1)), a), [0]));
      const tem = (r, a, b) => b > a && soma[r][b] - soma[r][a] > 0;
      // Primeira e última coluna com conteúdo em cada linha (-1 se a linha é só fundo).
      const prim = vazio.map((l) => l.findIndex((v) => !v)), ult = vazio.map((l) => l.findLastIndex((v) => !v));
      function valido(r0, r1, c0, c1, h, w) {
        const n = r1 - r0 + 1;
        if (w >= 0.8 * ((cols * T) / escala) && h >= minH * (0.5 / 0.3)) return "faixa";
        let lado = 0, ini = cols, fim = -1;
        for (let r = r0; r <= r1; r++) {
          if (tem(r, 0, c0) || tem(r, c1 + 1, cols)) lado++;
          if (prim[r] >= 0) [ini, fim] = [Math.min(ini, prim[r]), Math.max(fim, ult[r])];
        }
        // Margem de bloco centralizado: o conteúdo dessas linhas tem sobra parecida dos dois lados.
        const centralizado = fim >= 0 && Math.abs(ini - (cols - 1 - fim)) <= 0.25 * cols;
        return lado >= 0.5 * n && !centralizado ? "coluna" : null;
      }
      const alt = new Array(cols).fill(0);
      let melhor = null;
      for (let r = 0; r < linhas; r++) {
        for (let c2 = 0; c2 < cols; c2++) alt[c2] = vazio[r][c2] ? alt[c2] + 1 : 0;
        // Para cada coluna, o retângulo mais largo com a altura dela (pilha).
        const esq = new Array(cols), dir = new Array(cols), pilha = [];
        for (let i = 0; i < cols; i++) {
          while (pilha.length && alt[pilha.at(-1)] >= alt[i]) pilha.pop();
          esq[i] = pilha.length ? pilha.at(-1) + 1 : 0;
          pilha.push(i);
        }
        pilha.length = 0;
        for (let i = cols - 1; i >= 0; i--) {
          while (pilha.length && alt[pilha.at(-1)] >= alt[i]) pilha.pop();
          dir[i] = pilha.length ? pilha.at(-1) - 1 : cols - 1;
          pilha.push(i);
        }
        for (let i = 0; i < cols; i++) {
          const h = (alt[i] * T) / escala, w = ((dir[i] - esq[i] + 1) * T) / escala;
          if (h < minH || w < minW || (melhor && h * w <= melhor.h * melhor.w)) continue;
          const tipo = valido(r - alt[i] + 1, r, esq[i], dir[i], h, w);
          if (tipo) melhor = { x: ((cx0 + esq[i]) * T) / escala, y: ((r - alt[i] + 1) * T) / escala, w, h, tipo };
        }
      }
      if (!melhor) return null;
      g.lineWidth = Math.max(3, 4 * escala);
      g.setLineDash([14 * escala, 8 * escala]);
      g.strokeStyle = "#c0182b";
      g.strokeRect(melhor.x * escala, melhor.y * escala, melhor.w * escala, melhor.h * escala);
      const s = Math.min(1, 1280 / W), o = document.createElement("canvas");
      o.width = Math.round(W * s);
      o.height = Math.round(H * s);
      o.getContext("2d").drawImage(c, 0, 0, o.width, o.height);
      return { ...melhor, jpg: o.toDataURL("image/jpeg", 0.72).split(",")[1] };
    },
    [png.toString("base64"), x0, x1, minH, minW, escala]
  );
}

const browser = await chromium.launch({ channel: "chrome" });
oficina = await (await browser.newContext()).newPage();
const achados = [], larguras = [];
let n = 0;
for (const tela of TELAS) {
  for (const pg of PAGINAS) {
    const z = tela.zoom ?? 1;
    const ctx = await browser.newContext({ viewport: { width: Math.round(tela.w / z), height: Math.round(tela.h / z) }, deviceScaleFactor: z });
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("whim-dica-whatsapp", "1");
      } catch {}
    });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + pg.url, { waitUntil: "load" });
      await pg.prep?.(page);
      const vw = Math.round(tela.w / z), vh = Math.round(tela.h / z);
      // Primeiro uma passada inteira, para as entradas com a rolagem acontecerem.
      let { altura } = await page.evaluate(prepararTela);
      for (let y = 0; y < altura; y += vh / 2) {
        await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
        await page.waitForTimeout(120);
      }
      let ini = 0, fim = altura - vh;
      if (pg.so) {
        const r = await page.evaluate((s) => (({ top, bottom }) => ({ top: top + scrollY, bottom: bottom + scrollY }))(document.querySelector(s).getBoundingClientRect()), pg.so);
        ini = Math.max(0, r.top - 80);
        fim = Math.max(ini, r.bottom - vh);
      }
      const daPagina = [];
      let ocupa = 0;
      for (let y = ini; ; y = Math.min(fim, y + vh / 2)) {
        await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
        await page.waitForTimeout(450);
        const agora = await page.evaluate(prepararTela); // esconde o que ficou fixo depois de rolar e mede a faixa desta tela
        const real = await page.evaluate(() => scrollY);
        ocupa = Math.max(ocupa, (agora.dir - agora.esq) / vw);
        const png = await page.screenshot();
        const r = agora.dir - agora.esq > 0 ? await procurar(png, { x0: agora.esq, x1: agora.dir, minH: Math.max(240, 0.3 * vh), minW: 0.3 * (agora.dir - agora.esq), escala: z }) : null;
        if (r) {
          const topo = Math.round(real + r.y);
          const ja = daPagina.find((a) => topo < a.topo + a.h && a.topo < topo + r.h);
          const secao = await page.evaluate(secaoEm, [r.x + r.w / 2, r.y + r.h / 2]);
          if (!ja || r.h * r.w > ja.h * ja.w) {
            const nome = `v${String(++n).padStart(2, "0")}-${tela.nome.replace(/\D+/g, "")}-${pg.url.replace(/\W+/g, "") || "home"}${pg.so ? `-${pg.nome.match(/passo (\w+)/)[1].toLowerCase()}` : ""}.jpg`;
            writeFileSync(join(PRINTS, nome), Buffer.from(r.jpg, "base64"));
            const achado = { tela: tela.nome, pagina: pg.nome, secao, topo, tipo: r.tipo, h: Math.round(r.h), w: Math.round(r.w), pctAltura: Math.round((100 * r.h) / vh), print: `prints/vazios/${nome}`, dono: dono(pg.url, secao) };
            if (ja) Object.assign(ja, achado);
            else daPagina.push(achado);
          }
        }
        if (y >= fim) break;
      }
      achados.push(...daPagina);
      larguras.push({ tela: tela.nome, pagina: pg.nome, ocupa });
      console.log(`${tela.nome} ${pg.nome}: ${daPagina.length ? daPagina.map((a) => `${a.h}×${a.w} px em ${a.secao}`).join("; ") : "sem vão grande"}`);
    } catch (e) {
      achados.push({ tela: tela.nome, pagina: pg.nome, secao: `erro no teste: ${e.message.split("\n")[0]}`, h: 0, w: 0, pctAltura: 0, print: "", dono: "-" });
      console.log(`${tela.nome} ${pg.nome}: ERRO ${e.message.split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();

// A leitura dos achados (o que é vão de verdade e de quem é) é feita no olho e fica entre as marcas.
const INICIO = "<!-- leitura manual: o script mantém o que estiver entre esta linha e a de fim -->";
const FIM = "<!-- fim da leitura manual -->";
const antigo = existsSync(MD) ? readFileSync(MD, "utf8") : "";
const leitura = antigo.includes(INICIO) ? antigo.slice(antigo.indexOf(INICIO) + INICIO.length, antigo.indexOf(FIM)).trim() : "## Leitura\n\n(Nada ainda.)";
const L = [
  "# Espaços vazios grandes",
  "",
  `Gerado por \`scripts/espacos-vazios.mjs\` em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, contra ${BASE}.`,
  "Telas: 1280 × 800, 1920 × 1080, 2560 × 1440 e 1920 × 1080 com zoom de 67% (2866 × 1612 px de CSS) e de 50% (3840 × 2160 px de CSS).",
  "Entra aqui o vão (só fundo liso) com pelo menos 30% da altura da tela e 30% da largura do conteúdo, medido com a barra e o botão do WhatsApp escondidos: **coluna** quando ao lado há conteúdo em pelo menos metade da altura (uma coluna acabou e a outra continua, como embaixo da vitrine do Monte sua peça), **faixa** quando ocupa quase a largura toda e pelo menos metade da altura da tela. Respiro em volta de títulos e margens de bloco centralizado não contam. O retângulo vermelho tracejado no print é o vão.",
  "",
  INICIO,
  leitura,
  FIM,
  "",
  "## Vãos encontrados (automático)",
  "",
  ...(achados.length
    ? ["| Página | Tela | Onde | Tipo | Tamanho | Print | Dono |", "|---|---|---|---|---|---|---|", ...achados.map((a) => `| ${a.pagina} | ${a.tela} | ${a.secao} | ${a.tipo ?? "-"} | ${a.h} × ${a.w} px (${a.pctAltura}% da altura da tela), a ${a.topo} px do topo | ${a.print ? `[print](${a.print})` : "-"} | ${a.dono} |`)]
    : ["Nenhum."]),
  "",
  "## Quanto da largura o conteúdo ocupa",
  "",
  "Da borda esquerda à direita dos textos e imagens, na tela mais larga de cada página (na home, a faixa de logos vai de borda a borda e puxa o número para cima).",
  "",
  `| Página | ${TELAS.map((t) => t.nome).join(" | ")} |`,
  `|---|${TELAS.map(() => "---").join("|")}|`,
  ...PAGINAS.map((p) => `| ${p.nome} | ${TELAS.map((t) => larguras.find((l) => l.tela === t.nome && l.pagina === p.nome)).map((l) => (l ? `${Math.round(100 * l.ocupa)}%` : "-")).join(" | ")} |`),
  "",
];
writeFileSync(MD, L.join("\n"));
console.log(`\n${achados.length} vão(s). Relatório: ${MD}`);
