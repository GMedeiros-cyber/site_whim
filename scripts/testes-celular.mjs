#!/usr/bin/env node
/**
 * Celular de 18/11 (referencia/celular-18-11/): confere o site a 360, 390 e 430 px no Chromium e no
 * WebKit do Playwright e compara 1280 e 1920 com a versão de antes. Só lê o site; não muda nada.
 * Gera docs/qualidade/celular-18-11.md e os prints em docs/qualidade/prints/celular/.
 *
 * Uma vez:  npm i --no-save playwright-core axe-core && npx playwright-core install chromium webkit
 * Servidores: o site novo (npm run build && npx next start -p 3417) e, para o antes/depois, o main
 *           de antes em outra pasta (git worktree add --detach ../whim-antes <commit>, npm ci,
 *           npm run build, npx next start -p 3418).
 * Rodar:    node scripts/testes-celular.mjs --url http://localhost:3417 --antes http://localhost:3418
 *   --so celular,referencia,pc   só essas partes
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let chromium, webkit;
try {
  ({ chromium, webkit } = await import("playwright-core"));
} catch {
  console.error("Falta o Playwright: rode `npm i --no-save playwright-core axe-core` e `npx playwright-core install chromium webkit`.");
  process.exit(1);
}
const args = process.argv.slice(2);
const opcao = (k, padrao) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : padrao);
const BASE = opcao("url", "http://localhost:3000").replace(/\/$/, "");
const ANTES = opcao("antes", "").replace(/\/$/, "");
const SO = opcao("so", "").split(",").filter(Boolean);
const roda = (p) => !SO.length || SO.includes(p);

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRINTS = join(RAIZ, "docs/qualidade/prints/celular");
const MD = join(RAIZ, "docs/qualidade/celular-18-11.md");
const REF = join(RAIZ, "referencia/celular-18-11");
mkdirSync(PRINTS, { recursive: true });

const CELULARES = [
  { nome: "360", w: 360, h: 780 },
  { nome: "390", w: 390, h: 844 },
  { nome: "430", w: 430, h: 932 },
];
const NAVEGADORES = [
  ["Chromium", chromium],
  ["WebKit", webkit],
];

const resultados = [];
function anotar(parte, item, onde, ok, detalhe = "", print = "") {
  resultados.push({ parte, item, onde, ok: !!ok, detalhe, print });
  console.log(`${ok ? "ok   " : "FALHA"} [${onde}] ${item}: ${detalhe}`);
}

// ---------------------------------------------------------------------------------------------
// Navegador, prints e comparação de imagens (na "oficina", uma página em branco do Chromium).

const abertos = [];
let oficina;
async function navegador(tipo) {
  const b = await tipo.launch();
  abertos.push(b);
  return b;
}
async function pagina(browser, { w, h, toque = true, dpr = 2, reduzido = false }) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr,
    isMobile: toque,
    hasTouch: toque,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: reduzido ? "reduce" : "no-preference",
  });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("whim-dica-whatsapp", "1");
    } catch {}
    window.__abertos = [];
    window.open = (u) => (window.__abertos.push(String(u)), null);
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.erros = [];
  // Aviso do WebKit quando o teste muda o tamanho da tela (não é do site).
  page.on("pageerror", (e) => !/ResizeObserver loop/.test(e.message) && page.erros.push(e.message));
  page.on("console", (m) => {
    if (m.type() !== "error" || /google|maps\.|gstatic/i.test(m.text() + (m.location()?.url ?? ""))) return;
    if (/status of 404/.test(m.text()) && (page.url() + (m.location()?.url ?? "")).includes("pagina-que-nao-existe")) return; // o 404 da página 404
    if (/ResizeObserver loop/.test(m.text())) return; // aviso do WebKit quando o teste muda o tamanho da tela
    page.erros.push(`${m.text()}${m.location()?.url ? ` (${m.location().url.replace(BASE, "")} em ${page.url().replace(BASE, "")})` : ""}`);
  });
  await page.route("**/api/contatos", (r) => r.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' }));
  // O mapa do Google (rodapé) muda os ladrilhos de uma carga para outra: fica em branco nos dois lados.
  if (reduzido) await page.route(/google\.com\/maps|maps\.googleapis|maps\.gstatic/, (r) => r.abort());
  return page;
}
const fechar = (page) => page.context().close();

/** PNG → JPEG reduzido (no máximo `max` px de largura; 420 basta para ler uma tela de celular) em prints/celular/<nome>.jpg. */
async function salvar(png, nome, max = 420) {
  const jpg = await oficina.evaluate(
    async ([b64, max]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const s = Math.min(1, max / img.naturalWidth), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.75).split(",")[1];
    },
    [png.toString("base64"), max]
  );
  writeFileSync(join(PRINTS, `${nome}.jpg`), Buffer.from(jpg, "base64"));
  return `prints/celular/${nome}.jpg`;
}
const print = async (alvo, nome, { max, ...opcoes } = {}) => salvar(await alvo.screenshot(opcoes), nome, max);

/** Imagens lado a lado (com título em cima de cada uma), todas na mesma largura. */
async function lado(imagens, nome, largura = 390) {
  const b64 = await oficina.evaluate(
    async ([imgs, largura]) => {
      const el = await Promise.all(imgs.map(async (i) => {
        const im = new Image();
        im.src = "data:image/png;base64," + i.b64;
        await im.decode();
        return im;
      }));
      const alturas = el.map((im) => (im.naturalHeight * largura) / im.naturalWidth), topo = 30;
      const c = document.createElement("canvas");
      c.width = imgs.length * (largura + 16) + 16;
      c.height = Math.min(16000, Math.max(...alturas) + topo + 16);
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.font = "600 15px sans-serif";
      g.fillStyle = "#373857";
      el.forEach((im, i) => {
        const x = 16 + i * (largura + 16);
        g.fillText(imgs[i].titulo, x, 21, largura);
        g.drawImage(im, x, topo, largura, alturas[i]);
      });
      return c.toDataURL("image/jpeg", 0.72).split(",")[1];
    },
    [imagens.map((i) => ({ b64: i.png.toString("base64"), titulo: i.titulo })), largura]
  );
  writeFileSync(join(PRINTS, `${nome}.jpg`), Buffer.from(b64, "base64"));
  return `prints/celular/${nome}.jpg`;
}

/** Compara dois PNG do mesmo tamanho: % de pixels diferentes, caixa da diferença e o print marcado. */
async function diferenca(a, b) {
  return oficina.evaluate(
    async ([a, b]) => {
      const carrega = async (s) => {
        const im = new Image();
        im.src = "data:image/png;base64," + s;
        await im.decode();
        return im;
      };
      const [ia, ib] = await Promise.all([carrega(a), carrega(b)]);
      const W = Math.max(ia.naturalWidth, ib.naturalWidth), H = Math.max(ia.naturalHeight, ib.naturalHeight);
      const dados = (im) => {
        const c = new OffscreenCanvas(W, H), g = c.getContext("2d");
        g.fillStyle = "#ff00ff";
        g.fillRect(0, 0, W, H);
        g.drawImage(im, 0, 0);
        return g.getImageData(0, 0, W, H).data;
      };
      const da = dados(ia), db = dados(ib);
      let n = 0;
      const caixa = [W, H, -1, -1];
      const marca = new OffscreenCanvas(W, H), gm = marca.getContext("2d");
      gm.drawImage(ib, 0, 0);
      gm.fillStyle = "rgba(255,255,255,0.6)";
      gm.fillRect(0, 0, W, H);
      const md = gm.getImageData(0, 0, W, H);
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) <= 24) continue;
        n++;
        const x = p % W, y = (p / W) | 0;
        caixa[0] = Math.min(caixa[0], x);
        caixa[1] = Math.min(caixa[1], y);
        caixa[2] = Math.max(caixa[2], x);
        caixa[3] = Math.max(caixa[3], y);
        md.data.set([220, 20, 60, 255], i);
      }
      gm.putImageData(md, 0, 0);
      const s = Math.min(1, 800 / W), o = new OffscreenCanvas(Math.round(W * s), Math.round(H * s));
      o.getContext("2d").drawImage(marca, 0, 0, o.width, o.height);
      const blob = await o.convertToBlob({ type: "image/jpeg", quality: 0.72 });
      const jpg = await new Promise((ok) => {
        const f = new FileReader();
        f.onload = () => ok(f.result.split(",")[1]);
        f.readAsDataURL(blob);
      });
      return { pct: (100 * n) / (W * H), n, caixa, alturas: [ia.naturalHeight, ib.naturalHeight], jpg };
    },
    [a.toString("base64"), b.toString("base64")]
  );
}

/** Rola a página inteira devagar (imagens com carregamento tardio e entradas com a rolagem). */
async function rolarTudo(page, passo = 0.6) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += vh * passo) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
}

// ---------------------------------------------------------------------------------------------
// PC: 1280 e 1920, antes × depois (com movimento reduzido nos dois, para as animações não contarem).

const PAGINAS_PC = [
  { nome: "home", url: "/" },
  { nome: "monte", url: "/monte-sua-peca", prep: (p) => p.waitForFunction(() => document.querySelector('[role=group][aria-label^="Prévia da peça"] canvas')?.dataset.quadro).catch(() => {}) },
  { nome: "privacidade", url: "/privacidade" },
  { nome: "404", url: "/pagina-que-nao-existe" },
];

async function testarPC() {
  if (!ANTES) return anotar("pc", "Antes e depois a 1280 e 1920", "-", false, "falta --antes (URL do site de antes)");
  const b = await navegador(chromium);
  for (const tela of [{ w: 1280, h: 800 }, { w: 1920, h: 1080 }]) {
    for (const pg of PAGINAS_PC) {
      const shots = [];
      for (const base of [ANTES, BASE]) {
        const page = await pagina(b, { ...tela, toque: false, dpr: 1, reduzido: true });
        await page.goto(base + pg.url, { waitUntil: "load" });
        await pg.prep?.(page);
        await rolarTudo(page);
        shots.push(await page.screenshot({ fullPage: true }));
        await fechar(page);
      }
      const d = await diferenca(shots[0], shots[1]);
      const nome = `pc-${tela.w}-${pg.nome}`;
      const mudou = d.pct > 0.05 || d.alturas[0] !== d.alturas[1];
      let p = "";
      if (mudou) {
        writeFileSync(join(PRINTS, `${nome}-diferenca.jpg`), Buffer.from(d.jpg, "base64"));
        p = await lado([{ png: shots[0], titulo: "Antes" }, { png: shots[1], titulo: "Depois" }], `${nome}-antes-depois`, 640);
      } else p = await salvar(shots[1], `${nome}-depois`, 640);
      anotar(
        "pc",
        `${pg.nome} igual ao de antes`,
        String(tela.w),
        !mudou,
        mudou
          ? `${d.pct.toFixed(2)}% dos pixels mudaram${d.alturas[0] !== d.alturas[1] ? `, altura ${d.alturas[0]} → ${d.alturas[1]} px` : ""}, entre y ${d.caixa[1]} e ${d.caixa[3]} ([diferença em vermelho](prints/celular/${nome}-diferenca.jpg))`
          : `igual (${d.pct.toFixed(3)}% de pixels diferentes, abaixo de 0,05%)`,
        p
      );
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Referência: as três telas aprovadas ao lado do site a 390 (Chromium e WebKit).

async function testarReferencia() {
  const ref = (n) => readFileSync(join(REF, `${n}.png`));
  const telas = { Chromium: {}, WebKit: {} };
  for (const [nome, tipo] of NAVEGADORES) {
    const b = await navegador(tipo);
    const page = await pagina(b, { w: 390, h: 844, dpr: 1, reduzido: true });
    await page.goto(BASE + "/", { waitUntil: "load" });
    await rolarTudo(page);
    telas[nome].home = await page.screenshot({ fullPage: true });
    await page.goto(BASE + "/monte-sua-peca", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    // Sem a barra e o botão fixos por cima (a referência mostra a seção sozinha).
    const semFixos = await page.addStyleTag({ content: "header, .botao-whatsapp, [aria-label='Pedir orçamento no WhatsApp'] { visibility: hidden !important; }" });
    telas[nome].contato = await page.locator("#contato").screenshot();
    await semFixos.evaluate((e) => e.remove());
    // Passo Estampa com o Peito esquerdo marcado e passo Quantidade com 60 peças, rolados até o topo do passo.
    await irAoPasso(page, 2);
    await page.getByRole("checkbox", { name: "Peito esquerdo", exact: true }).click().catch(() => {});
    await page.waitForTimeout(1500); // a página rola suave depois de marcar
    await topoDoPasso(page);
    telas[nome].estampa = await page.screenshot();
    await irAoPasso(page, 3);
    for (const [t, n] of [["P", 10], ["M", 20], ["G", 20], ["GG", 10]]) await page.locator(`input[aria-label="Quantidade ${t}"]`).fill(String(n)).catch(() => {});
    await page.waitForTimeout(500);
    await topoDoPasso(page);
    telas[nome].quantidade = await page.screenshot();
    await fechar(page);
  }
  const p1 = await lado([{ png: ref("CelularHome"), titulo: "Referência" }, { png: telas.Chromium.home, titulo: "Chromium 390" }, { png: telas.WebKit.home, titulo: "WebKit 390" }], "ref-home");
  const p2 = await lado(
    [
      { png: ref("CelularMonte"), titulo: "Referência" },
      { png: telas.Chromium.estampa, titulo: "Chromium · Estampa" },
      { png: telas.WebKit.estampa, titulo: "WebKit · Estampa" },
      { png: telas.Chromium.quantidade, titulo: "Chromium · Quantidade" },
      { png: telas.WebKit.quantidade, titulo: "WebKit · Quantidade" },
    ],
    "ref-monte"
  );
  const p3 = await lado([{ png: ref("CelularContato"), titulo: "Referência" }, { png: telas.Chromium.contato, titulo: "Chromium 390" }, { png: telas.WebKit.contato, titulo: "WebKit 390" }], "ref-contato");
  anotar("referencia", "Home ao lado da referência", "390", true, "comparação no olho: ver a leitura manual", p1);
  anotar("referencia", "Monte sua peça ao lado da referência", "390", true, "comparação no olho: ver a leitura manual", p2);
  anotar("referencia", "Fale com a Whim ao lado da referência", "390", true, "comparação no olho: ver a leitura manual", p3);
}

/** Monte sua peça: avança com Continuar até o passo `n` (0 = Peça). */
async function irAoPasso(page, n) {
  for (let i = 0; i < 6; i++) {
    const atual = await passoAtual(page);
    if (atual >= n) return;
    await page.getByRole("button", { name: /^Continuar/ }).first().click();
    await page.waitForTimeout(400);
  }
}
const NOMES_PASSOS = ["Peça", "Cor", "Estampa", "Quantidade", "Resumo"];
/** Índice do passo atual (o que tem aria-current="step"). */
const passoAtual = (page) =>
  page.evaluate((nomes) => {
    const el = document.querySelector('[aria-current="step"]');
    const t = el?.innerText ?? "";
    return nomes.findIndex((n) => t.includes(n));
  }, NOMES_PASSOS);
/** Rola até o começo do conteúdo do passo aberto (o título do passo). */
async function topoDoPasso(page) {
  await page
    .locator('ol[aria-label="Passos do pedido"] li[aria-current="step"] p[tabindex]')
    .filter({ visible: true })
    .evaluate((t) => t.scrollIntoView({ block: "start", behavior: "instant" }))
    .catch(() => {});
  await page.waitForTimeout(600);
}

// ---------------------------------------------------------------------------------------------
// Celular: 360, 390 e 430 no Chromium e no WebKit.

async function testarCelular() {
  for (const [nav, tipo] of NAVEGADORES) {
    const b = await navegador(tipo);
    for (const tela of CELULARES) {
      const onde = `${nav} ${tela.nome}`;
      const page = await pagina(b, tela);
      try {
        await testarHome(page, onde, tela);
      } catch (e) {
        anotar("celular", "Home: o teste parou", onde, false, e.message.split("\n")[0], await print(page, `erro-home-${nav}-${tela.nome}`).catch(() => ""));
      }
      try {
        await testarMonte(page, onde, tela);
      } catch (e) {
        anotar("celular", "Monte sua peça: o teste parou", onde, false, e.message.split("\n")[0], await print(page, `erro-monte-${nav}-${tela.nome}`).catch(() => ""));
      }
      try {
        await testarOutras(page, onde);
      } catch (e) {
        anotar("celular", "Outras páginas: o teste parou", onde, false, e.message.split("\n")[0]);
      }
      anotar("celular", "Sem erro no console", onde, !page.erros.length, page.erros.slice(0, 2).join(" | ") || "nenhum");
      await fechar(page);
    }
  }
}

const lateral = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
/** Retângulo da barra fixa do topo (o header). */
const barraTopo = (page) =>
  page.evaluate(() => {
    const h = [...document.querySelectorAll("header, nav[aria-label='Navegação principal']")].find((e) => getComputedStyle(e).position === "fixed" || getComputedStyle(e).position === "sticky");
    const r = h?.getBoundingClientRect();
    return r ? { top: r.top, bottom: r.bottom } : { top: 0, bottom: 0 };
  });
/** Controles visíveis com menos de 44 px (alvo medido pelo rótulo, se houver; link no meio do texto não conta). */
const alvosPequenos = (page, raiz) =>
  page.evaluate((raiz) => {
    const sel = "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=tab], [role=checkbox]";
    return [...document.querySelectorAll(`${raiz} :is(${sel})`)]
      .filter((e) => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return s.visibility !== "hidden" && s.display !== "none" && s.pointerEvents !== "none" && r.width > 1 && r.height > 1 && !e.closest("[aria-hidden=true], [inert]") && e.checkVisibility?.() !== false && !(e.type === "file" && e.closest("label"));
      })
      .map((e) => {
        const alvo = e.closest("label") ?? e, r = alvo.getBoundingClientRect();
        const p = e.closest("p, li");
        const noTexto = e.tagName === "A" && p && p.innerText.trim().length > e.innerText.trim().length + 10;
        return { nome: (e.getAttribute("aria-label") || e.innerText || e.tagName).replace(/\s+/g, " ").trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), noTexto };
      })
      .filter((x) => (x.w < 44 || x.h < 44) && !x.noTexto)
      .map((x) => `${x.nome} (${x.w} × ${x.h})`);
  }, raiz);
const unicos = (l) => [...new Set(l)];

async function testarHome(page, onde, tela) {
  const n = `${onde.replace(" ", "-")}`;
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.keyboard.press("Shift").catch(() => {}); // pula a abertura
  await page.waitForTimeout(1800);

  // Hero: texto embaixo, "Vista" à esquerda, um botão de largura toda e "Ver o que fazemos" como link.
  const hero = await page.evaluate(() => {
    const s = document.querySelector("#topo"), r = s.getBoundingClientRect();
    const h1 = s.querySelector("h1")?.getBoundingClientRect();
    const vis = (e) => e && e.checkVisibility() && e.getBoundingClientRect().width > 0;
    const botao = [...s.querySelectorAll("a, button")].filter(vis).find((e) => e.innerText.includes("Pedir orçamento no WhatsApp"))?.getBoundingClientRect();
    const ver = [...s.querySelectorAll("a")].filter(vis).filter((e) => e.innerText.includes("Ver o que fazemos"));
    return { topo: r.top, altura: r.height, esquerda: r.left, largura: r.width, h1, botao, ver: ver.length, botoes: [...s.querySelectorAll("a, button")].filter(vis).filter((e) => getComputedStyle(e).backgroundColor !== "rgba(0, 0, 0, 0)").length };
  });
  const fh = [
    !(hero.h1 && hero.h1.top > hero.topo + hero.altura * 0.4) && "o título não está na parte de baixo da foto",
    !(hero.h1 && hero.h1.left - hero.esquerda < 48) && "o \"Vista\" não está à esquerda",
    !(hero.botao && hero.botao.width > hero.largura * 0.8) && "o botão do WhatsApp não ocupa a largura",
    hero.ver !== 1 && `"Ver o que fazemos" aparece ${hero.ver} vez(es)`,
  ].filter(Boolean);
  anotar("celular", "Home · hero", onde, !fh.length, fh.join("; ") || "texto embaixo, Vista à esquerda, um botão de largura toda e o link Ver o que fazemos", await print(page, `home-hero-${n}`));

  // Barra fixa e menu: abre, marca a seção atual, leva a cada seção sem a barra cobrir o título.
  const menu = page.getByRole("button", { name: "Menu" });
  const fm = [];
  let pMenu = "";
  for (const [i, secao] of ["Sobre", "Serviços", "Processo", "Clientes"].entries()) {
    // A barra some ao rolar para baixo: rolar um pouco para cima faz ela voltar, como a pessoa faria.
    if (i > 0) {
      await page.evaluate(() => scrollBy({ top: -60, behavior: "instant" }));
      await page.waitForTimeout(500);
    }
    await menu.click();
    await page.waitForTimeout(450);
    if (i === 0) {
      pMenu = await print(page, `home-menu-${n}`);
      const aberto = await page.evaluate(() => !!document.querySelector(":popover-open, [aria-expanded=true]"));
      if (!aberto) fm.push("o menu não abre");
    }
    const link = page.locator(".menu-celular a, :popover-open a").filter({ hasText: new RegExp(`^${secao}$`) }).first();
    await link.click();
    await page.waitForTimeout(1500);
    const r = await page.evaluate((secao) => {
      const id = { Sobre: "sobre", Serviços: "servicos", Processo: "processo", Clientes: "clientes" }[secao];
      const t = document.querySelector(`#${id} h2`)?.getBoundingClientRect();
      const fechado = !document.querySelector(":popover-open");
      const atual = document.querySelector("header a[aria-current], nav a[aria-current]")?.innerText.trim() ?? "";
      return { titulo: t?.top ?? -1, fechado, atual };
    }, secao);
    const barra = await barraTopo(page);
    if (r.titulo < barra.bottom - 1 || r.titulo > tela.h * 0.6) fm.push(`${secao}: título em y ${Math.round(r.titulo)} (barra até ${Math.round(barra.bottom)})`);
    if (!r.fechado) fm.push(`${secao}: o menu não fechou`);
    // Seção marcada ao chegar (os links do menu fechado continuam no HTML com o aria-current).
    const marcado = await page.evaluate(() => [...document.querySelectorAll(".menu-celular a, #menu-principal a")].find((a) => a.getAttribute("aria-current"))?.innerText.trim() ?? "");
    if (marcado !== secao) fm.push(`${secao}: ao chegar, o menu marca "${marcado}"`);
  }
  anotar("celular", "Home · menu e barra fixa (âncoras não ficam embaixo da barra)", onde, !fm.length, fm.join("; ") || "abre, marca a seção atual e leva a Sobre, Serviços, Processo e Clientes com o título abaixo da barra", pMenu);

  // Quem somos: só o vídeo e as 4 etapas em 2 × 2.
  const sobre = await page.evaluate(() => {
    const s = document.querySelector("#sobre");
    const imgs = [...s.querySelectorAll("img")].filter((e) => e.checkVisibility() && e.getBoundingClientRect().width > 40).length;
    const video = [...s.querySelectorAll("video")].some((v) => v.checkVisibility());
    const itens = [...s.querySelectorAll("ul > li")].filter((e) => e.checkVisibility()).map((e) => e.getBoundingClientRect());
    const xs = new Set(itens.map((r) => Math.round(r.left))), ys = new Set(itens.map((r) => Math.round(r.top)));
    return { imgs, video, n: itens.length, colunas: xs.size, linhas: ys.size };
  });
  await page.locator("#sobre").scrollIntoViewIfNeeded();
  anotar("celular", "Home · Quem somos", onde, sobre.video && !sobre.imgs && sobre.n === 4 && sobre.colunas === 2 && sobre.linhas === 2,
    `vídeo ${sobre.video ? "sim" : "NÃO"}, ${sobre.imgs} foto(s) do mosaico à vista, ${sobre.n} etapas em ${sobre.colunas} colunas × ${sobre.linhas} linhas`, await print(page.locator("#sobre"), `home-sobre-${n}`));

  // Técnicas: abas (clique e setas), pílula na ativa, um cartão; Confecção e Uniformes abrem; "Não sabe qual?" vai ao WhatsApp.
  const abas = page.getByRole("tablist", { name: "Técnicas de estampa" });
  const ft = [];
  const lerAba = () =>
    page.evaluate(() => {
      const l = document.querySelector('[role=tablist][aria-label="Técnicas de estampa"]');
      const sel = l.querySelector('[aria-selected="true"]');
      const outra = l.querySelector('[aria-selected="false"]');
      const painel = document.getElementById(sel.getAttribute("aria-controls"));
      return { sel: sel.innerText.trim(), titulo: painel?.querySelector("h3")?.innerText.trim(), fundo: getComputedStyle(sel).backgroundColor, fundoOutra: getComputedStyle(outra).backgroundColor, cartoes: document.querySelectorAll('#servicos [role=tabpanel]').length };
    });
  if (!(await abas.count())) ft.push("sem as abas Silk | DTF | Bordado");
  else {
    await abas.scrollIntoViewIfNeeded();
    const a0 = await lerAba();
    await abas.getByRole("tab", { name: "DTF" }).click();
    const a1 = await lerAba();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    const a2 = await lerAba();
    if (a0.sel !== "Silk" || a0.titulo !== "Silk") ft.push(`começa em "${a0.sel}" / "${a0.titulo}"`);
    if (a1.sel !== "DTF" || a1.titulo !== "DTF") ft.push(`tocar em DTF mostra "${a1.titulo}"`);
    if (a2.sel !== "Bordado") ft.push(`seta para a direita foi para "${a2.sel}"`);
    if (a1.fundo === a1.fundoOutra || a1.fundo === "rgba(0, 0, 0, 0)") ft.push("a aba ativa não tem a pílula");
    if (a1.cartoes !== 1) ft.push(`${a1.cartoes} cartões`);
  }
  for (const nome of ["Confecção", "Uniformes"]) {
    const bt = page.locator("#servicos button[aria-expanded]").filter({ hasText: nome }).first();
    if (!(await bt.count())) {
      ft.push(`sem a linha ${nome}`);
      continue;
    }
    await bt.click();
    await page.waitForTimeout(400);
    const aberto = await bt.evaluate((e) => e.getAttribute("aria-expanded") === "true" && (document.getElementById(e.getAttribute("aria-controls"))?.getBoundingClientRect().height ?? 0) > 10);
    if (!aberto) ft.push(`${nome} não abre`);
  }
  const naoSabe = await page.evaluate(() => [...document.querySelectorAll("#servicos a")].find((a) => a.checkVisibility() && a.innerText.includes("Não sabe qual"))?.getAttribute("href") ?? "");
  if (!/wa\.me/.test(naoSabe)) ft.push(`"Não sabe qual?" leva a "${naoSabe}"`);
  anotar("celular", "Home · técnicas (abas, pílula e acordeão)", onde, !ft.length, ft.join("; ") || "abas por toque e setas, pílula na ativa, um cartão, Confecção e Uniformes abrem, Não sabe qual? abre o WhatsApp", await print(page.locator("#servicos"), `home-tecnicas-${n}`));

  // Processo: 5 passos numa linha; começa no 1; tocar no 3 mostra só a frase dele.
  const proc = page.getByRole("tablist", { name: "Etapas do pedido" });
  const fp = [];
  if (!(await proc.count())) fp.push("sem a linha de passos");
  else {
    await proc.scrollIntoViewIfNeeded();
    const lerProc = () =>
      page.evaluate(() => {
        const l = document.querySelector('[role=tablist][aria-label="Etapas do pedido"]');
        const tabs = [...l.querySelectorAll("[role=tab]")];
        const sel = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
        const painel = document.getElementById(tabs[sel].getAttribute("aria-controls"));
        return { n: tabs.length, linhas: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size, sel, frase: painel?.innerText.replace(/\s+/g, " ").trim() };
      });
    const p0 = await lerProc();
    await proc.getByRole("tab").nth(2).click();
    const p2 = await lerProc();
    if (p0.n !== 5 || p0.linhas !== 1) fp.push(`${p0.n} passos em ${p0.linhas} linha(s)`);
    if (p0.sel !== 0) fp.push(`começa no passo ${p0.sel + 1}`);
    if (p2.sel !== 2 || !/Arte aprovada/.test(p2.frase)) fp.push(`tocar no 3 mostra "${p2.frase}"`);
  }
  anotar("celular", "Home · processo", onde, !fp.length, fp.join("; ") || "5 passos numa linha, começa no 1, tocar no 3 mostra só a frase dele", await print(page.locator("#processo"), `home-processo-${n}`));

  // Dúvidas: sem foto, 4 perguntas e "Ver as 8 perguntas"; o acordeão abre.
  const fd = [];
  const contaDuvidas = () => page.evaluate(() => ({ visiveis: [...document.querySelectorAll("#duvidas button[aria-expanded]")].filter((b) => b.checkVisibility()).length, fotos: [...document.querySelectorAll("#duvidas img")].filter((i) => i.checkVisibility() && i.getBoundingClientRect().width > 40).length }));
  await page.locator("#duvidas").scrollIntoViewIfNeeded();
  const d0 = await contaDuvidas();
  const pDuv = await print(page.locator("#duvidas"), `home-duvidas-${n}`);
  const ver = page.locator("#duvidas button").filter({ hasText: /Ver as \d+ perguntas/ });
  if (await ver.count()) await ver.click();
  else fd.push('sem "Ver as 8 perguntas"');
  await page.waitForTimeout(300);
  const d1 = await contaDuvidas();
  const segunda = page.locator("#duvidas button[aria-expanded]").nth(1);
  await segunda.click();
  await page.waitForTimeout(400);
  const abriu = await segunda.getAttribute("aria-expanded");
  if (d0.fotos) fd.push(`${d0.fotos} foto(s)`);
  if (d0.visiveis !== 4) fd.push(`${d0.visiveis} perguntas no começo`);
  if (d1.visiveis !== 8) fd.push(`${d1.visiveis} perguntas depois de "Ver as 8"`);
  if (abriu !== "true") fd.push("a pergunta não abre");
  anotar("celular", "Home · dúvidas", onde, !fd.length, fd.join("; ") || "sem foto, 4 perguntas, Ver as 8 perguntas mostra as 8 e o acordeão abre", pDuv);

  // Rodapé: Navegação fechada que abre, "Ver no mapa" sem o mapa embutido, Tribus Labs.
  const fr = [];
  const rod = await page.evaluate(() => {
    const f = document.querySelector("footer");
    const d = [...f.querySelectorAll("details")].find((x) => x.checkVisibility() && x.innerText.includes("Navegação"));
    const iframe = [...f.querySelectorAll("iframe")].some((i) => i.checkVisibility());
    const mapa = [...f.querySelectorAll("a")].some((a) => a.checkVisibility() && a.innerText.includes("Ver no mapa"));
    const baixou = performance.getEntriesByType("resource").some((e) => /google\.com\/maps|maps\.googleapis/.test(e.name));
    return { navegacao: !!d, aberta: d?.open, iframe, mapa, baixou, tribus: f.innerText.includes("Desenvolvido por Tribus Labs") };
  });
  if (!rod.navegacao) fr.push("sem o acordeão Navegação");
  else {
    if (rod.aberta) fr.push("Navegação começa aberta");
    await page.locator("footer details summary").filter({ hasText: "Navegação" }).click();
    const aberta = await page.evaluate(() => [...document.querySelectorAll("footer details")].find((x) => x.innerText.includes("Navegação"))?.open);
    if (!aberta) fr.push("Navegação não abre");
  }
  if (rod.iframe) fr.push("o mapa embutido aparece");
  if (rod.baixou) fr.push("o mapa embutido é baixado");
  if (!rod.mapa) fr.push('sem "Ver no mapa"');
  if (!rod.tribus) fr.push('sem "Desenvolvido por Tribus Labs"');
  await page.locator("footer").scrollIntoViewIfNeeded();
  anotar("celular", "Rodapé (acordeão e mapa)", onde, !fr.length, fr.join("; ") || "Navegação fechada que abre, Ver no mapa sem baixar o mapa, Tribus Labs", await print(page.locator("footer"), `rodape-${n}`));

  const l = await lateral(page);
  const pequenos = unicos(await alvosPequenos(page, "main, footer"));
  anotar("celular", "Home · sem rolagem lateral", onde, l <= 0, l > 0 ? `${l} px` : "ok");
  anotar("celular", "Home · alvos de toque ≥ 44 px", onde, !pequenos.length, pequenos.slice(0, 8).join("; ") || "todos com 44 px ou mais");
}

async function testarOutras(page, onde) {
  for (const [nome, url] of [["/privacidade", "/privacidade"], ["404", "/pagina-que-nao-existe"]]) {
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForTimeout(500);
    const l = await lateral(page);
    anotar("celular", `${nome} · sem rolagem lateral`, onde, l <= 0, l > 0 ? `${l} px` : "ok");
  }
}

/** Medidas do Monte sua peça no celular: barra do topo, bloco preso (vitrine + passos), barra de ações. */
const medidasMonte = (page) =>
  page.evaluate(() => {
    const r = (e) => e && (({ top, bottom, left, right, height }) => ({ top, bottom, left, right, height }))(e.getBoundingClientRect());
    const previa = document.querySelector('[role=group][aria-label^="Prévia da peça"]');
    let fixa = previa;
    while (fixa && getComputedStyle(fixa).position !== "sticky") fixa = fixa.parentElement;
    const ol = document.querySelector('nav[aria-label="Passos"] ol');
    const atual = ol?.querySelector('[aria-current="step"]');
    const barra = [...document.querySelectorAll("[data-barra-acoes]")].find((b) => b.checkVisibility());
    const zap = document.querySelector('a[aria-label="Pedir orçamento no WhatsApp"]');
    const titulo = [...document.querySelectorAll('ol[aria-label="Passos do pedido"] li[aria-current="step"] p[tabindex]')].find((p) => p.checkVisibility());
    const header = document.querySelector("header");
    return {
      vh: innerHeight,
      header: r(header),
      oculta: header?.hasAttribute("data-oculta"),
      fixa: r(fixa),
      previa: r(previa),
      ol: r(ol),
      atual: r(atual),
      atualNome: atual?.innerText.replace(/\s+/g, " ").trim(),
      passos: ol ? ol.querySelectorAll("li").length : 0,
      rolaDeLado: ol ? ol.scrollWidth > ol.clientWidth : false,
      barra: r(barra),
      botoes: barra ? [...barra.querySelectorAll("button, a")].filter((b) => b.checkVisibility()).map((b) => b.innerText.replace(/\s+/g, " ").trim()) : [],
      zap: r(zap),
      titulo: r(titulo),
      tituloTexto: titulo?.innerText.trim(),
      lado: document.documentElement.scrollWidth - innerWidth,
      fim: document.documentElement.scrollHeight,
    };
  });
const sobrepoe = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

async function testarMonte(page, onde, tela) {
  const n = onde.replace(" ", "-");
  await page.goto(BASE + "/monte-sua-peca", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector('[role=group][aria-label^="Prévia da peça"] canvas')?.dataset.quadro, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);

  // A arara do topo vira o passo 1: o primeiro bloco embaixo da barra é a vitrine.
  const topo = await page.evaluate(() => ({
    araraTopo: [...document.querySelectorAll('ul[aria-label="Arara de modelos"]')].filter((u) => u.checkVisibility()).map((u) => Math.round(u.getBoundingClientRect().top + scrollY)),
    vitrine: Math.round(document.querySelector('[role=group][aria-label^="Prévia da peça"]').getBoundingClientRect().top + scrollY),
  }));
  const araraNoPasso = topo.araraTopo.length === 1 && topo.araraTopo[0] > topo.vitrine;
  anotar("celular", "Monte · a arara do topo vira o passo 1", onde, araraNoPasso, araraNoPasso ? "a única arara fica no passo Peça, embaixo da vitrine" : `araras em y ${topo.araraTopo.join(", ")} (vitrine em ${topo.vitrine})`);

  const proximos = ["Cor", "Estampa", "Quantidade", "Resumo"];
  const f = { presa: [], passos: [], rola: [], barra: [], coberto: [], zap: [], lado: [] };
  const prints = [];
  for (let i = 0; i <= 4; i++) {
    // Mede como o passo chega (depois do Continuar), antes de mexer nele (preencher rola a página).
    await page.waitForTimeout(500);
    const m = await medidasMonte(page);
    const nome = NOMES_PASSOS[i];
    if (i === 2) await page.getByRole("checkbox", { name: "Peito esquerdo", exact: true }).click();
    if (i === 3) for (const [t, q] of [["P", 10], ["M", 20], ["G", 20], ["GG", 10]]) await page.locator(`input[aria-label="Quantidade ${t}"]`).fill(String(q));
    if (i === 2 || i === 3) {
      await page.locator('ol[aria-label="Passos do pedido"] li[aria-current="step"] p[tabindex]').filter({ visible: true }).evaluate((t) => t.scrollIntoView({ block: "start", behavior: "instant" }));
      await page.waitForTimeout(400);
    }
    prints[i] = await print(page, `monte-passo${i + 1}-${n}`);
    // Vitrine presa embaixo da barra, ~270 px (ou 32% da altura em tela baixa), com a linha de passos.
    if (!m.fixa) f.presa.push(`${nome}: a vitrine não é presa`);
    else {
      if (!m.oculta && m.fixa.top < m.header.bottom - 1) f.presa.push(`${nome}: a vitrine começa embaixo da barra (${Math.round(m.fixa.top)} < ${Math.round(m.header.bottom)})`);
      if (m.previa.height < 160 || m.previa.height > 280) f.presa.push(`${nome}: vitrine com ${Math.round(m.previa.height)} px`);
    }
    // Passos numa linha, o atual à vista (com a pílula) e rolando de lado.
    if (m.passos !== 5) f.passos.push(`${nome}: ${m.passos} passos na linha`);
    if (!m.atualNome?.includes(nome)) f.passos.push(`${nome}: a linha marca "${m.atualNome}"`);
    else if (m.atual.left < m.ol.left - 1 || m.atual.right > m.ol.right + 1) f.passos.push(`${nome}: o passo atual sai da linha (${Math.round(m.atual.left)} a ${Math.round(m.atual.right)} de ${Math.round(m.ol.left)} a ${Math.round(m.ol.right)})`);
    // Barra de ações no pé da tela, com o próximo passo; no último, o WhatsApp.
    if (!m.barra) f.barra.push(`${nome}: sem a barra de ações`);
    else {
      if (Math.abs(m.barra.bottom - m.vh) > 2) f.barra.push(`${nome}: a barra termina em ${Math.round(m.barra.bottom)} (tela ${m.vh})`);
      const esperado = i < 4 ? `Continuar · ${proximos[i]}` : "WhatsApp";
      if (!m.botoes.some((b) => b.includes(esperado))) f.barra.push(`${nome}: botões "${m.botoes.join(" / ")}"`);
      if (i > 0 && !m.botoes.some((b) => b.includes("Voltar") || b === "")) f.barra.push(`${nome}: sem Voltar`);
      if (sobrepoe(m.zap, m.barra)) f.zap.push(`${nome}: o botão flutuante cobre a barra`);
    }
    // O título do passo fica abaixo do bloco preso.
    if (m.titulo && m.fixa && m.titulo.top < m.fixa.bottom - 1) f.coberto.push(`${nome}: o título do passo fica embaixo da vitrine`);
    if (m.lado > 0) f.lado.push(`${nome}: ${m.lado} px`);

    // Só o conteúdo do passo rola: desce 300 px, a vitrine e a linha ficam no lugar; no fim, nada embaixo da barra.
    await page.evaluate(() => scrollBy({ top: 300, behavior: "instant" }));
    await page.waitForTimeout(450);
    const d = await medidasMonte(page);
    if (d.fixa && (d.fixa.top < -1 || d.fixa.top > 83 || Math.abs(d.previa.height - m.previa.height) > 1)) f.rola.push(`${nome}: a vitrine saiu do lugar (topo em ${Math.round(d.fixa.top)})`);
    if (d.ol && (d.ol.bottom < 0 || d.ol.top > (d.fixa?.bottom ?? 0))) f.rola.push(`${nome}: a linha de passos saiu da tela`);
    // Rolado até o fim do passo (a barra presa chega ao lugar dela), o último item tem de ficar acima da barra.
    await page.evaluate(() => {
      const li = [...document.querySelectorAll('ol[aria-label="Passos do pedido"] li[aria-current="step"]')].find((x) => x.checkVisibility());
      li?.scrollIntoView({ block: "end", behavior: "instant" });
    });
    await page.waitForTimeout(300);
    const fimPasso = await page.evaluate(() => {
      const li = [...document.querySelectorAll('ol[aria-label="Passos do pedido"] li[aria-current="step"]')].find((x) => x.checkVisibility());
      const barra = li?.querySelector("[data-barra-acoes]");
      const itens = [...(li?.querySelectorAll("button, a, input, select, label, p") ?? [])].filter((e) => e.checkVisibility() && !barra?.contains(e));
      const u = itens.at(-1)?.getBoundingClientRect();
      return { fundo: u?.bottom ?? 0, barra: barra?.getBoundingClientRect().top ?? innerHeight, texto: itens.at(-1)?.innerText?.replace(/\s+/g, " ").slice(0, 30) };
    });
    if (fimPasso.fundo > fimPasso.barra + 1) f.coberto.push(`${nome}: "${fimPasso.texto}" fica embaixo da barra de ações`);
    await page.evaluate(() => document.querySelector('nav[aria-label="Passos"]')?.scrollIntoView({ block: "nearest", behavior: "instant" }));
    if (i < 4) {
      await page.locator("[data-barra-acoes]").filter({ visible: true }).getByRole("button", { name: /^Continuar/ }).click();
      await page.waitForTimeout(600);
    }
  }
  const ok = (l) => !l.length;
  anotar("celular", "Monte · vitrine presa embaixo da barra", onde, ok(f.presa), f.presa.join("; ") || "nos 5 passos, presa embaixo da barra, com 160 a 280 px", prints[2]);
  anotar("celular", "Monte · linha de passos (pílula no atual, rola de lado)", onde, ok(f.passos), f.passos.join("; ") || "5 passos numa linha; o atual marcado e à vista em todos os passos", prints[3]);
  anotar("celular", "Monte · só o conteúdo do passo rola", onde, ok(f.rola), f.rola.join("; ") || "ao rolar o passo, a vitrine e a linha de passos ficam no lugar", prints[3]);
  anotar("celular", "Monte · Voltar e Continuar no pé da tela", onde, ok(f.barra), f.barra.join("; ") || 'nos 5 passos, presos no pé, com "Continuar · próximo passo" e, no Resumo, o WhatsApp', prints[4]);
  anotar("celular", "Monte · nada coberto pela vitrine nem pela barra de ações", onde, ok(f.coberto), f.coberto.join("; ") || "título de cada passo abaixo da vitrine e o fim de cada passo acima da barra", prints[1]);
  anotar("celular", "Monte · botão flutuante do WhatsApp acima da barra", onde, ok(f.zap), f.zap.join("; ") || "o botão flutuante não cobre a barra em nenhum passo", prints[0]);
  anotar("celular", "Monte · sem rolagem lateral", onde, ok(f.lado), f.lado.join("; ") || "nos 5 passos");

  // Tocar num passo feito volta para ele (e Salvar leva de volta).
  const cor = page.getByRole("button", { name: /^Cor, feito/ });
  let volta = "";
  if (await cor.count()) {
    await cor.click();
    await page.waitForTimeout(500);
    const m = await medidasMonte(page);
    volta = m.atualNome?.includes("Cor") ? "" : `tocar em Cor marca "${m.atualNome}"`;
    const salvar = page.locator("[data-barra-acoes]").filter({ visible: true }).getByRole("button", { name: "Salvar" });
    if (await salvar.count()) await salvar.click();
    await page.waitForTimeout(500);
  } else volta = 'sem o botão "Cor, feito: voltar para este passo"';
  anotar("celular", "Monte · tocar num passo feito volta para ele", onde, !volta, volta || "tocar em Cor abre o passo Cor; Salvar volta ao Resumo");

  // Teclado aberto (simulado: a tela perde 45% da altura): o campo em foco e a barra continuam à vista.
  const ft = [];
  for (const [passo, achar] of [
    [3, (p) => p.locator('input[aria-label="Quantidade M"]')],
    [1, async (p) => {
      const outra = p.getByRole("button", { name: "Outra cor", exact: true });
      if (await outra.count()) await outra.click();
      return p.getByPlaceholder("Ex.: verde-bandeira");
    }],
  ]) {
    await page.setViewportSize({ width: tela.w, height: tela.h });
    const chip = page.locator(`nav[aria-label="Passos"] li[data-passo="${passo}"] button`);
    if (await chip.count()) await chip.click();
    await page.waitForTimeout(500);
    const campo = await achar(page);
    if (!(await campo.count())) {
      ft.push(`${NOMES_PASSOS[passo]}: campo não encontrado`);
      continue;
    }
    await campo.tap().catch(() => campo.click());
    await page.setViewportSize({ width: tela.w, height: Math.round(tela.h * 0.55) });
    // Ao abrir o teclado, o navegador rola o campo em foco para a área que sobra (aqui, para o meio).
    await page.evaluate(() => document.activeElement?.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(700);
    const k = await page.evaluate(() => {
      const e = document.activeElement, r = e.getBoundingClientRect();
      const barra = [...document.querySelectorAll("[data-barra-acoes]")].find((b) => b.checkVisibility())?.getBoundingClientRect();
      const previa = document.querySelector('[role=group][aria-label^="Prévia da peça"]');
      let fixa = previa;
      while (fixa && getComputedStyle(fixa).position !== "sticky") fixa = fixa.parentElement;
      const fr = fixa?.getBoundingClientRect();
      return { campo: { top: r.top, bottom: r.bottom }, barra: barra && { top: barra.top, bottom: barra.bottom }, fixa: fr && { bottom: fr.bottom }, vh: innerHeight, foco: e.tagName };
    });
    const kp = await print(page, `monte-teclado-${NOMES_PASSOS[passo].toLowerCase()}-${n}`);
    if (!k.barra || k.barra.bottom > k.vh + 1 || k.barra.top < 0) ft.push(`${NOMES_PASSOS[passo]}: a barra sai da tela`);
    if (k.campo.bottom > (k.barra?.top ?? k.vh) + 1) ft.push(`${NOMES_PASSOS[passo]}: o campo fica embaixo da barra`);
    if (k.fixa && k.campo.top < k.fixa.bottom - 1) ft.push(`${NOMES_PASSOS[passo]}: o campo fica embaixo da vitrine (só sobram ${Math.round((k.barra?.top ?? k.vh) - k.fixa.bottom)} px entre a vitrine e a barra)`);
    if (passo === 3) prints.teclado = kp;
  }
  await page.setViewportSize({ width: tela.w, height: tela.h });
  anotar("celular", "Monte · Voltar e Continuar com o teclado aberto (simulado)", onde, !ft.length, ft.join("; ") || "com 45% a menos de altura, a barra fica no pé e o campo em foco aparece entre a vitrine e a barra", prints.teclado);

  const pequenos = unicos(await alvosPequenos(page, "#personalizar"));
  anotar("celular", "Monte · alvos de toque ≥ 44 px", onde, !pequenos.length, pequenos.slice(0, 8).join("; ") || "todos com 44 px ou mais");

  // Fale com a Whim: título → depoimento → formulário → contatos como atalhos.
  await page.locator("#contato").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const c = await page.evaluate(() => {
    const s = document.querySelector("#contato");
    const vis = (e) => e && e.checkVisibility() && e.getBoundingClientRect().height > 0;
    const y = (e) => (vis(e) ? e.getBoundingClientRect().top + scrollY : null);
    const titulo = s.querySelector("h2");
    const dep = [...s.querySelectorAll("blockquote, figure, [data-depoimento]")].find(vis) ?? [...s.querySelectorAll("*")].find((e) => vis(e) && e.children.length && e.innerText.includes("Patricia") && e.innerText.length < 600);
    const form = [...s.querySelectorAll("form")].find(vis);
    const links = [...s.querySelectorAll("a[href]")].filter(vis).map((a) => ({ href: a.getAttribute("href"), y: a.getBoundingClientRect().top + scrollY, h: a.getBoundingClientRect().height, texto: a.innerText.replace(/\s+/g, " ").trim().slice(0, 50) }));
    const vazios = [...s.querySelectorAll("[data-slot=skeleton], .animate-pulse")].filter(vis).length;
    return { titulo: y(titulo), dep: y(dep), form: y(form), links, vazios, texto: s.innerText };
  });
  const fc = [];
  const zap = c.links.find((l) => /wa\.me|whatsapp/i.test(l.href) && c.form !== null && l.y > c.form);
  const mail = c.links.find((l) => l.href.startsWith("mailto:"));
  const mapa = c.links.find((l) => /google\.[^/]+\/maps|maps\.app|goo\.gl\/maps/.test(l.href) && l.y > (c.form ?? 0));
  if (!(c.titulo < c.dep && c.dep < c.form)) fc.push(`ordem: título ${c.titulo}, depoimento ${c.dep}, formulário ${c.form}`);
  if (c.vazios) fc.push(`${c.vazios} cartão(ões) vazio(s)`);
  if (!/Mais depoimentos em breve/.test(c.texto)) fc.push('sem "Mais depoimentos em breve"');
  if (!/Ver no Google Maps/.test(c.texto)) fc.push('sem "Ver no Google Maps"');
  if (!zap) fc.push("sem o atalho do WhatsApp depois do formulário");
  if (!mail || mail.y < (c.form ?? 0)) fc.push("sem o atalho do e-mail depois do formulário");
  if (!mapa) fc.push("sem o atalho do endereço (abrir no mapa)");
  if (zap && !/9h às 18h/.test(c.texto)) fc.push("o atalho do WhatsApp sem o horário");
  const curtos = [zap, mail, mapa].filter((l) => l && l.h < 44).map((l) => `${l.texto} (${Math.round(l.h)} px)`);
  if (curtos.length) fc.push(`atalhos com menos de 44 px: ${curtos.join(", ")}`);
  anotar("celular", "Fale com a Whim · ordem e atalhos", onde, !fc.length, fc.join("; ") || "título, depoimento (sem cartões vazios), formulário e os atalhos de WhatsApp com horário, e-mail e endereço", await print(page.locator("#contato"), `contato-${n}`));
  const pc = unicos(await alvosPequenos(page, "#contato"));
  anotar("celular", "Fale com a Whim · alvos de toque ≥ 44 px", onde, !pc.length, pc.slice(0, 8).join("; ") || "todos com 44 px ou mais");
}

// ---------------------------------------------------------------------------------------------
// Relatório

function gerarMarkdown() {
  const INICIO = "<!-- leitura manual: o script mantém o que estiver entre esta linha e a de fim -->";
  const FIM = "<!-- fim da leitura manual -->";
  const antigo = existsSync(MD) ? readFileSync(MD, "utf8") : "";
  const leitura = antigo.includes(INICIO) ? antigo.slice(antigo.indexOf(INICIO) + INICIO.length, antigo.indexOf(FIM)).trim() : "## Comparação com a referência\n\n(Nada ainda.)";
  const falhas = resultados.filter((r) => !r.ok);
  const PARTES = { celular: "Celular (360, 390 e 430 px; Chromium e WebKit)", referencia: "Referência ao lado do site", pc: "PC: 1280 e 1920, antes e depois" };
  const L = [
    "# Celular de 18/11 · testes",
    "",
    `Gerado por \`scripts/testes-celular.mjs\` em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, contra ${BASE}${ANTES ? ` (antes: ${ANTES})` : ""}.`,
    "Referência: `referencia/celular-18-11/` (aprovada pelo Gabriel em 18/11). O WhatsApp e o envio do contato são interceptados.",
    "",
    `**${resultados.length - falhas.length} verificações ok e ${falhas.length} com falha.**`,
    "",
    "## Falhas",
    "",
    ...(falhas.length ? falhas.map((r) => `- **${r.item}** (${r.onde}): ${r.detalhe}${r.print ? ` · [print](${r.print})` : ""}`) : ["Nenhuma."]),
    "",
    INICIO,
    leitura,
    FIM,
    "",
  ];
  for (const [parte, titulo] of Object.entries(PARTES)) {
    const rs = resultados.filter((r) => r.parte === parte);
    if (!rs.length) continue;
    L.push(`## ${titulo}`, "", "| Verificação | Onde | Resultado | Print |", "|---|---|---|---|");
    for (const r of rs) L.push(`| ${r.item} | ${r.onde} | ${r.ok ? "ok" : "**falha**"}: ${r.detalhe.replace(/\|/g, "/")} | ${r.print ? `[print](${r.print})` : "-"} |`);
    L.push("");
  }
  writeFileSync(MD, L.join("\n"));
}

oficina = await (await (await navegador(chromium)).newContext()).newPage();
const inicio = Date.now();
try {
  if (roda("celular")) await testarCelular();
  if (roda("referencia")) await testarReferencia();
  if (roda("pc")) await testarPC();
} catch (e) {
  anotar("celular", "O teste parou", "-", false, e.message.split("\n")[0]);
  console.error(e);
} finally {
  gerarMarkdown();
  const md = readFileSync(MD, "utf8");
  for (const p of readdirSync(PRINTS)) if (!md.includes(`prints/celular/${p}`)) rmSync(join(PRINTS, p));
  await Promise.all(abertos.map((b) => b.close()));
  console.log(`\n${resultados.filter((r) => !r.ok).length} falha(s) em ${resultados.length} verificações, ${Math.round((Date.now() - inicio) / 1000)} s. Relatório: ${MD}`);
}
