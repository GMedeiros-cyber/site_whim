// Teste do site PUBLICADO como iPhone (pedido de 24/11, docs/qualidade/iphone-24-11.md).
// WebKit do Playwright, perfis iPhone SE, iPhone 15 e iPhone 15 Pro Max em retrato.
// Só lê e clica: wa.me, api.whatsapp.com e /api/contatos ficam bloqueados (page.route), nada é enviado.
//
// Uma vez (nesta pasta): npm i && npx playwright-core install webkit
// Rodar:   node iphone.mjs [paginas|idas|tudo] ["iPhone SE,iPhone 15,iPhone 15 Pro Max"] [voltas=20] [base]
import { webkit, devices } from "playwright-core";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [MODO = "tudo", PERFIS = "iPhone SE,iPhone 15,iPhone 15 Pro Max", VOLTAS = "20", BASE = "https://whimconfeccao.com.br"] = process.argv.slice(2);
const PRINTS = fileURLToPath(new URL("../../docs/qualidade/prints/iphone-24-11/", import.meta.url));
const SAIDA = fileURLToPath(new URL("./saida/", import.meta.url));
mkdirSync(PRINTS, { recursive: true });
mkdirSync(SAIDA, { recursive: true });
const LOG = `${SAIDA}/resultados-${MODO}.jsonl`;
writeFileSync(LOG, "");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (perfil) => perfil.replace("iPhone ", "").replace(/\s+/g, "").toLowerCase(); // se, 15, 15promax

const resultados = [];
function anotar(r) {
  resultados.push(r);
  appendFileSync(LOG, JSON.stringify(r) + "\n");
  console.log(`${r.ok ? "ok   " : "FALHA"} [${r.perfil}] ${r.pagina} · ${r.item}${r.ok ? "" : `: ${r.det}`}`.slice(0, 500));
}

async function contexto(browser, perfil) {
  const d = { ...devices[perfil] };
  delete d.defaultBrowserType;
  const ctx = await browser.newContext({ ...d, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
  // Segurança: nada sai para o WhatsApp nem para o banco de contatos da Whim.
  const bloqueados = [];
  await ctx.route(/(^https?:\/\/(wa\.me|api\.whatsapp\.com)\/)|\/api\/contatos/, (rota) => {
    bloqueados.push(rota.request().method() + " " + rota.request().url().slice(0, 120));
    return rota.abort("blockedbyclient");
  });
  await ctx.addInitScript(() => {
    window.open = () => null; // um link target=_blank aberto por engano não sai da página
    try { sessionStorage.setItem("whim-dica-whatsapp", "1"); } catch {} // balão do flutuante (testado à parte em 16/11)
  });
  return { ctx, bloqueados };
}

for (const perfil of PERFIS.split(",")) {
  const browser = await webkit.launch();
  const tag = slug(perfil);
  const { ctx, bloqueados } = await contexto(browser, perfil);
  const p = await ctx.newPage();
  p.setDefaultTimeout(20000);
  const { width: W, height: H } = devices[perfil].viewport;
  let erros = [];
  p.on("console", (m) => m.type() === "error" && erros.push(m.text().slice(0, 300)));
  p.on("pageerror", (e) => erros.push("pageerror: " + String(e.message).slice(0, 300)));
  const ok = (pagina, item, cond, det = "", print = "") => anotar({ perfil, pagina, item, ok: !!cond, det: String(det).slice(0, 800), print });
  const foto = async (nome, op = {}) => {
    const arq = `${tag}-${nome}.jpg`;
    await (op.el ?? p).screenshot({ path: PRINTS + arq, type: "jpeg", quality: op.fullPage ? 55 : 70, scale: "css", fullPage: op.fullPage, animations: "allow" });
    return arq;
  };
  const tentar = async (pagina, item, fn) => {
    try { await fn(); } catch (e) {
      const print = await foto(`${pagina}-erro-${item.replace(/\W+/g, "_").slice(0, 24)}`).catch(() => "");
      ok(pagina, item, false, "script: " + String(e.message).split("\n")[0], print);
    }
  };
  // Rolagem lateral: largura do conteúdo × tela, e se a página anda de lado ao tentar rolar.
  const lateral = () => p.evaluate(() => {
    const d = document.documentElement;
    const sobra = d.scrollWidth - d.clientWidth;
    const y = scrollY;
    scrollTo({ left: 80, top: y, behavior: "instant" });
    const anda = scrollX;
    scrollTo({ left: 0, top: y, behavior: "instant" });
    const largos = sobra > 0 || anda > 0
      ? [...document.body.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && e.checkVisibility()).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)}`)
      : [];
    return { sobra, anda, largos };
  });
  // Espera a entrada da home acabar (<html data-intro> sai) e devolve quanto levou; se passar do limite, o estado.
  const esperarEntrada = async (limite) => {
    const t0 = Date.now();
    while (Date.now() - t0 < limite) {
      if (await p.evaluate(() => !document.documentElement.dataset.intro)) return { ms: Date.now() - t0 };
      await espera(250);
    }
    return { ms: Date.now() - t0, preso: await p.evaluate(() => { const c = document.querySelector("h1 canvas"); return { intro: document.documentElement.dataset.intro, estado: document.querySelector("h1 [data-estado]")?.dataset.estado ?? "-", canvasAtivo: c?.hasAttribute("data-ativo"), canvasW: c?.width }; }) };
  };
  const semLateral = (l) => l.sobra <= 0 && l.anda === 0;
  const cookies = async (pagina) => {
    const b = p.getByRole("button", { name: /^Aceitar/i }).filter({ visible: true });
    const apareceu = (await b.count()) > 0;
    if (apareceu) await b.first().click();
    ok(pagina, "aviso de cookies", true, apareceu ? "apareceu e foi aceito" : "não apareceu (já aceito antes neste perfil, ou sem IDs de medição)");
  };
  const consoleOk = (pagina, filtro = () => true) => {
    const e = [...new Set(erros.filter(filtro))];
    ok(pagina, "console sem erros", e.length === 0, e.join(" | "));
    erros = [];
  };
  // O elemento está inteiro na tela e é ele que recebe o toque no centro (nada por cima).
  const tocavel = (loc) => loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { naTela: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, livre: !!topo && (topo === el || el.contains(topo)), r: [Math.round(r.top), Math.round(r.bottom), innerHeight] };
  });
  const flutuanteVisivel = () => p.evaluate(() => {
    const a = document.querySelector('a[aria-label="Pedir orçamento no WhatsApp"]');
    return !!a && a.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  });
  const barraVisivel = () => p.evaluate(() => {
    const n = document.querySelector('nav[aria-label="Navegação principal"]');
    const r = n?.getBoundingClientRect();
    return { visivel: !!r && r.bottom > 0 && r.top >= 0 && n.checkVisibility(), oculta: !!document.querySelector("header[data-oculta]"), top: Math.round(r?.top ?? -1) };
  });
  // Antes do print da página inteira: rola tudo (carrega as imagens lazy) e mede a rolagem lateral em cada parada.
  const percorrer = async (pagina) => {
    const altura = await p.evaluate(() => document.documentElement.scrollHeight);
    let pior = { sobra: 0, anda: 0, largos: [] };
    const vazando = new Set();
    for (let y = 0; y < altura; y += Math.round(H * 0.6)) {
      await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      await espera(350);
      const l = await lateral();
      if (l.sobra > pior.sobra || l.anda > pior.anda) pior = l;
      // Texto maior que o próprio botão/link (corta ou passa da borda em telas estreitas).
      (await p.evaluate(() => [...document.querySelectorAll("a, button, [role=tab]")]
        .filter((e) => e.checkVisibility() && e.clientWidth > 2 && e.scrollWidth > e.clientWidth + 1) // > 2: o "Pular para o conteúdo" fica com 1 px até ganhar foco
        .map((e) => `${(e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40)} (${e.clientWidth}/${e.scrollWidth}px)`))).forEach((x) => vazando.add(x));
    }
    ok(pagina, "sem rolagem lateral (página toda)", semLateral(pior), JSON.stringify(pior));
    ok(pagina, "nenhum texto maior que o próprio botão ou link", vazando.size === 0, [...vazando].join(" | "));
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await espera(600);
    return foto(`${pagina}-inteira`, { fullPage: true });
  };

  if (MODO !== "idas") {
    // ============================ HOME
    await tentar("home", "abertura na 1ª carga da sessão", async () => {
      await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      const fase = await p.evaluate(() => document.documentElement.dataset.intro ?? "(nenhuma)");
      await espera(900);
      const print = await foto("home-abertura");
      const e = await esperarEntrada(30000);
      ok("home", "abertura toca na 1ª carga (sessão nova)", fase === "abertura", `data-intro=${fase}`, print);
      ok("home", "entrada (abertura + tinta) termina", !e.preso, JSON.stringify(e));
    });
    await tentar("home", "abertura ao recarregar", async () => {
      await p.reload({ waitUntil: "domcontentloaded" });
      const fases = [];
      for (let i = 0; i < 6; i++) {
        fases.push(await p.evaluate(() => document.documentElement.dataset.intro ?? "-"));
        await espera(250);
      }
      ok("home", "abertura NÃO toca ao recarregar na mesma sessão", !fases.includes("abertura"), fases.join(","));
      const e = await esperarEntrada(20000);
      ok("home", "tinta do Vista termina ao recarregar", !e.preso, JSON.stringify(e), e.preso ? await foto("home-recarga-presa") : "");
      await p.waitForLoadState("load");
      await espera(600);
    });
    await tentar("home", "carga", async () => {
      await cookies("home");
      const print = await foto("home-topo");
      const l = await lateral();
      ok("home", "sem rolagem lateral (1ª tela)", semLateral(l), JSON.stringify(l), print);
      const inteira = await percorrer("home");
      ok("home", "print da página inteira", true, "", inteira);
    });

    await tentar("home", "menu e seção atual", async () => {
      const marcas = [];
      for (const [id, rot] of [["sobre", "Sobre"], ["servicos", "Serviços"], ["processo", "Processo"], ["clientes", "Clientes"]]) {
        await p.evaluate((id) => { const el = document.getElementById(id); scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.3, behavior: "instant" }); }, id);
        await espera(400);
        await p.evaluate(() => scrollBy({ top: -60, behavior: "instant" })); // subir um pouco mostra a barra
        await espera(500);
        await p.getByRole("button", { name: /Menu/ }).click();
        await espera(400);
        const atual = await p.evaluate(() => document.querySelector('#menu-principal [aria-current="location"]')?.textContent.trim() ?? "-");
        marcas.push(`${rot}=${atual}`);
        if (rot === "Processo") ok("home", "menu aberto", true, "", await foto("home-menu"));
        await p.keyboard.press("Escape");
        await espera(300);
      }
      ok("home", "menu marca a seção atual", marcas.every((m) => m.split("=")[0] === m.split("=")[1]), marcas.join(" "));
      await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await espera(300);
      await p.getByRole("button", { name: /Menu/ }).click();
      await p.locator("#menu-principal").getByRole("link", { name: "Processo" }).click();
      await espera(1500);
      const topo = await p.evaluate(() => Math.round(document.getElementById("processo").getBoundingClientRect().top));
      ok("home", "menu → Processo rola até a seção, abaixo da barra", topo >= 40 && topo <= 160, `topo=${topo}`);
    });

    await tentar("home", "técnicas", async () => {
      await p.evaluate(() => document.getElementById("servicos").scrollIntoView({ behavior: "instant" }));
      await espera(1200);
      for (const aba of ["DTF", "Bordado", "Silk"]) {
        const t = p.locator("#servicos").getByRole("tab", { name: aba });
        await t.click();
        await espera(600);
        const sel = await t.getAttribute("aria-selected");
        const vis = await p.evaluate((aba) => [...document.querySelectorAll("#servicos h3")].find((x) => x.textContent.trim() === aba && x.checkVisibility({ opacityProperty: true }))?.textContent ?? "", aba);
        ok("home", `aba ${aba}`, sel === "true" && vis === aba, `aria-selected=${sel} cartão=${vis}`);
      }
      // O carrossel do Silk passa do vídeo (1º) para as fotos depois de 8 s: volta ao 1º.
      await p.locator("#servicos").getByRole("button", { name: /^Silk: foto 1 de/ }).filter({ visible: true }).first().click();
      await espera(1200);
      const v = await p.evaluate(async () => {
        const vis = [...document.querySelectorAll("#servicos video")].find((x) => /yamaha/.test(x.getAttribute("poster") || "") && x.checkVisibility({ opacityProperty: true }));
        if (!vis) return null;
        const t0 = vis.currentTime;
        await new Promise((r) => setTimeout(r, 1200));
        return {
          src: (vis.currentSrc || "").split("/").pop(),
          tocando: !vis.paused && vis.currentTime > t0,
          t: [+t0.toFixed(2), +vis.currentTime.toFixed(2)],
          mudo: vis.muted,
          playsinline: vis.playsInline || vis.hasAttribute("playsinline"),
          telaCheia: !!document.fullscreenElement || !!vis.webkitDisplayingFullscreen,
          controles: vis.controls,
          readyState: vis.readyState,
          erro: vis.error ? vis.error.code : null,
          h264: vis.canPlayType('video/mp4; codecs="avc1.42E01E"'),
          h264High: vis.canPlayType('video/mp4; codecs="avc1.640028"'),
        };
      });
      const print = await foto("home-silk-yamaha", { el: p.locator("#servicos") });
      ok("home", "vídeo da Yamaha no Silk: mudo, sem tela cheia, inline", v && v.mudo && v.playsinline && !v.telaCheia && /yamaha/.test(v.src), JSON.stringify(v), print);
      ok("home", "vídeo da Yamaha no Silk: tocando", v?.tocando, JSON.stringify(v), print);
    });

    await tentar("home", "capítulos", async () => {
      const grupo = p.getByRole("group", { name: "Capítulos da oficina" });
      await p.evaluate(() => document.querySelector('[aria-label="Capítulos da oficina"]').scrollIntoView({ block: "end", behavior: "instant" }));
      const cap = () => p.evaluate(() => [...document.querySelectorAll('[aria-label="Capítulos da oficina"] button')].findIndex((b) => b.getAttribute("aria-current") === "step"));
      const c0 = await cap();
      await espera(4500);
      const c1 = await cap();
      ok("home", "capítulos da oficina trocam sozinhos", c1 !== c0, `${c0}→${c1}`);
      await grupo.getByRole("button").nth(2).click();
      await espera(900);
      const c2 = await cap();
      const vid = await p.evaluate(() => { const v = document.querySelector("#sobre video"); return v ? { tocando: !v.paused, mudo: v.muted, src: (v.currentSrc || "").split("/").pop(), erro: v.error?.code ?? null } : null; });
      const print = await foto("home-capitulos", { el: p.locator("#sobre") });
      ok("home", "toque no 3º capítulo", c2 === 2, `capítulo=${c2} vídeo=${JSON.stringify(vid)}`, print);
    });

    await tentar("home", "passos do pedido à entrega", async () => {
      const lista = p.locator('ol[aria-label="Etapas do pedido"]');
      const forma = await lista.evaluate((ol) => {
        const lis = [...ol.children].map((li) => li.getBoundingClientRect());
        return { n: lis.length, vertical: lis.every((r, i) => i === 0 || (r.top >= lis[i - 1].bottom - 1 && Math.abs(r.left - lis[0].left) < 2)), visivel: ol.checkVisibility() };
      });
      ok("home", "passos na vertical", forma.n === 5 && forma.vertical && forma.visivel, JSON.stringify(forma));
      const atual = () => lista.evaluate((ol) => [...ol.children].findIndex((li) => li.getAttribute("aria-current") === "step"));
      const topo = await lista.evaluate((ol) => ol.getBoundingClientRect().top + scrollY);
      const alto = await lista.evaluate((ol) => ol.getBoundingClientRect().height);
      // A linha de leitura fica a 60% da tela: a lista sobe dela (frac 0) até passar inteira (frac 1).
      const rolar = async (frac) => {
        await p.evaluate(([t, a, f]) => scrollTo({ top: t - innerHeight * 0.6 + f * a, behavior: "instant" }), [topo, alto, frac]);
        await espera(450);
        return atual();
      };
      const vistos = [];
      for (const f of [0, 0.25, 0.45, 0.65, 0.85, 1.05]) vistos.push(await rolar(f));
      const sobe = vistos.every((v, i) => i === 0 || v >= vistos[i - 1]);
      await espera(300);
      const print = await foto("home-passos");
      ok("home", "passos acendem com a rolagem (0 → 4)", sobe && vistos[0] === 0 && vistos.at(-1) === 4, vistos.join(","), print);
      const volta = [];
      for (const f of [0.85, 0.4, -0.3]) volta.push(await rolar(f));
      ok("home", "passos apagam ao rolar para cima", volta.every((v, i) => i === 0 || v <= volta[i - 1]) && volta.at(-1) === 0, volta.join(","));
      await lista.getByRole("button", { name: /^Passo 4/ }).click();
      await espera(400);
      ok("home", "toque num passo o marca", (await atual()) === 3, String(await atual()));
    });

    await tentar("home", "marcas", async () => {
      await p.evaluate(() => document.getElementById("clientes").scrollIntoView({ behavior: "instant" }));
      await espera(1200);
      const m = await p.evaluate(() => {
        const imgs = [...document.querySelectorAll("#clientes img")];
        const faixa = document.querySelector("#clientes [class*=marquee]");
        return { total: imgs.length, carregadas: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, yamaha: imgs.some((i) => i.alt === "Yamaha"), anim: faixa ? getComputedStyle(faixa).animationName : "(sem faixa)", estado: faixa ? getComputedStyle(faixa).animationPlayState : "" };
      });
      const print = await foto("home-marcas", { el: p.locator("#clientes") });
      ok("home", "faixa de marcas andando, logos carregados, com a Yamaha", m.yamaha && m.carregadas === m.total && m.anim !== "none" && m.estado === "running", JSON.stringify(m), print);
    });
    consoleOk("home");

    // ============================ MONTE SUA PEÇA
    await tentar("monte", "pedido inteiro", async () => {
      await p.goto(BASE + "/monte-sua-peca", { waitUntil: "load" });
      await espera(1500);
      await cookies("monte");
      ok("monte", "1ª tela", true, "", await foto("monte-topo"));
      const atual = () => p.evaluate(() => [...document.querySelectorAll('li[data-estado="atual"] p')].map((x) => x.textContent).join(" "));
      const barra = () => p.locator("[data-barra-acoes]").filter({ visible: true }).first();
      const continuar = async () => { await barra().getByRole("button", { name: /^Continuar/ }).click(); await espera(900); };
      const conferirPasso = async (rot, temVoltar, temContinuar) => {
        const l = await lateral();
        const flu = await flutuanteVisivel();
        const v = temVoltar ? await tocavel(barra().getByRole("button", { name: /Voltar/ })) : null;
        const c = temContinuar ? await tocavel(barra().getByRole("button", { name: /^Continuar/ })) : null;
        const print = await foto(`monte-${rot}`);
        ok("monte", `passo ${rot}: sem rolagem lateral`, semLateral(l), JSON.stringify(l), print);
        ok("monte", `passo ${rot}: botão flutuante escondido`, !flu, `flutuante visível=${flu}`, print);
        if (v) ok("monte", `passo ${rot}: Voltar visível e livre`, v.naTela && v.livre, JSON.stringify(v), print);
        if (c) ok("monte", `passo ${rot}: Continuar visível e livre`, c.naTela && c.livre, JSON.stringify(c), print);
      };
      const arara = p.locator('[role=group][aria-label="Arara de modelos"]');
      const srcCamiseta = () => arara.getByRole("button", { name: "Camiseta" }).locator("img").getAttribute("src");

      // 1 · Peça: tocar na camiseta não pode mudar a cor dela
      if (!/Qual peça/.test(await atual())) throw new Error("não abriu no passo Peça: " + (await atual()));
      const antes = await srcCamiseta();
      await arara.getByRole("button", { name: "Polo" }).click();
      await espera(500);
      await arara.getByRole("button", { name: "Camiseta" }).click();
      await espera(800);
      const depois = await srcCamiseta();
      const pressionada = await arara.getByRole("button", { name: "Camiseta" }).getAttribute("aria-pressed");
      await conferirPasso("1-peca", false, true);
      ok("monte", "passo Peça: a peça não muda de cor antes do passo Cor", antes === depois && pressionada === "true", `antes=${antes} depois=${depois} pressionada=${pressionada}`);
      await continuar();

      // 2 · Cor
      if (!/cor/i.test(await atual())) throw new Error("não chegou ao passo Cor: " + (await atual()));
      await p.getByRole("group", { name: "Cor do tecido" }).getByRole("button", { name: "Azul-marinho" }).click();
      await espera(800);
      await conferirPasso("2-cor", true, true);
      // Voltar para Peça: abre o passo para editar (Cancelar/Salvar); Salvar volta ao passo Cor.
      await barra().getByRole("button", { name: /Voltar/ }).click();
      await espera(900);
      const naCor = await srcCamiseta();
      const salvar = await tocavel(barra().getByRole("button", { name: "Salvar" }));
      ok("monte", "Voltar do passo Cor abre o passo Peça (Cancelar e Salvar visíveis)", /Qual peça/.test(await atual()) && salvar.naTela && salvar.livre, `camiseta=${naCor} salvar=${JSON.stringify(salvar)}`, await foto("monte-1-peca-voltar"));
      await barra().getByRole("button", { name: "Salvar" }).click();
      await espera(900);
      if (!/cor/i.test(await atual())) throw new Error("Salvar não voltou ao passo Cor: " + (await atual()));
      await continuar();

      // 3 · Estampa: peito esquerdo com um PNG de teste
      if (!/Onde vai a estampa/.test(await atual())) throw new Error("não chegou ao passo Estampa: " + (await atual()));
      await p.getByText("Peito esquerdo", { exact: true }).filter({ visible: true }).first().click();
      await espera(600);
      // PNG de teste gerado na hora: fundo transparente, círculo turquesa e "TESTE" em azul-marinho.
      const png = Buffer.from((await p.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 600;
        const g = c.getContext("2d");
        g.fillStyle = "#31C4EA";
        g.beginPath(); g.arc(300, 300, 290, 0, 7); g.fill();
        g.fillStyle = "#373857"; g.font = "bold 150px sans-serif"; g.textAlign = "center"; g.fillText("TESTE", 300, 350);
        return c.toDataURL("image/png");
      })).split(",")[1], "base64");
      writeFileSync(`${SAIDA}/estampa-teste.png`, png);
      await p.locator('input[type=file][aria-label="Arte de peito esquerdo"]').setInputFiles({ name: "estampa-teste.png", mimeType: "image/png", buffer: png });
      await espera(2500);
      const anexou = await p.getByRole("button", { name: "Trocar arte de peito esquerdo" }).filter({ visible: true }).count();
      await conferirPasso("3-estampa", true, true);
      ok("monte", "estampa PNG anexada no peito esquerdo", anexou > 0, `botão Trocar arte=${anexou}`);
      await continuar();

      // 4 · Quantidade: 50 peças M
      if (!/Quantas peças/.test(await atual())) throw new Error("não chegou ao passo Quantidade: " + (await atual()));
      const m = p.getByRole("textbox", { name: "Quantidade M" }).filter({ visible: true }).first();
      await m.fill("50");
      await m.blur();
      await espera(600);
      const total = await p.locator('[aria-live="polite"]').filter({ hasText: "Total" }).filter({ visible: true }).first().textContent();
      await conferirPasso("4-quantidade", true, true);
      ok("monte", "quantidade 50 M dá total de 50 peças", /50 peças/.test(total), total);
      await continuar();

      // 5 · Resumo: só lê o link do WhatsApp (bloqueado de qualquer forma)
      await espera(1200);
      await conferirPasso("5-resumo", true, false);
      const zap = barra().getByRole("link", { name: /Pedir orçamento no WhatsApp/ });
      const href = decodeURIComponent((await zap.getAttribute("href")) ?? "");
      const z = await tocavel(zap);
      ok("monte", "resumo: botão do WhatsApp visível e livre", z.naTela && z.livre, JSON.stringify(z));
      const precisa = [/wa\.me\/5511945448802/, /Camiseta/, /Azul-marinho/, /Peito esquerdo/i, /M 50/, /50 peças/];
      const falta = precisa.filter((r) => !r.test(href)).map(String);
      ok("monte", "mensagem do resumo com peça, cor, posição, tamanho e total", falta.length === 0, `falta=${falta.join(",")} · ${href}`);
      writeFileSync(`${SAIDA}/mensagem-${tag}.txt`, href);
      await p.evaluate(() => scrollTo({ top: 1e7, behavior: "instant" }));
      await espera(500);
      ok("monte", "fim da página", true, "", await foto("monte-fim"));
      const inteira = await percorrer("monte");
      ok("monte", "print da página inteira", true, "", inteira);
    });
    consoleOk("monte");

    // ============================ /privacidade e 404
    for (const [rota, pag] of [["/privacidade", "privacidade"], ["/pagina-que-nao-existe-24-11", "404"]]) {
      await tentar(pag, "carga", async () => {
        const r = await p.goto(BASE + rota, { waitUntil: "load" });
        await espera(1200);
        await cookies(pag);
        ok(pag, "status HTTP", pag === "404" ? r.status() === 404 : r.status() === 200, r.status());
        const print = await foto(`${pag}-topo`);
        const l = await lateral();
        ok(pag, "sem rolagem lateral (1ª tela)", semLateral(l), JSON.stringify(l), print);
        const inteira = await percorrer(pag);
        ok(pag, "print da página inteira", true, "", inteira);
      });
      // o 404 do próprio documento aparece no console; só os erros de JS contam
      consoleOk(pag, (e) => !(pag === "404" && /404|Failed to load resource/.test(e)));
    }
  }

  // ============================ IDAS E VOLTAS Monte ↔ home (lógica de scripts/idas-e-voltas.mjs)
  if (MODO !== "paginas") {
    const naHome = (u) => new URL(u).pathname === "/";
    const noMonte = (u) => new URL(u).pathname === "/monte-sua-peca";
    const ate = async (pg, cond, passo) => {
      for (let i = 0; i < 120; i++) { if (cond(pg.url())) return; await espera(100); }
      throw new Error(`${passo}: não chegou (url ${pg.url()})`);
    };
    // A transição de tinta engole cliques enquanto passa: espera ela acabar.
    const semTransicao = (pg) => pg.waitForFunction(() => !document.querySelector(".pinta-tinta")?.hasAttribute("data-ativa"), null, { timeout: 10000, polling: 100 });
    for (const como of ["logo", "menu", "voltar"]) {
      const { ctx: c2, bloqueados: b2 } = await contexto(browser, perfil);
      const pg = await c2.newPage();
      pg.setDefaultTimeout(15000);
      const errs = [];
      pg.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 300)));
      pg.on("pageerror", (e) => errs.push("pageerror: " + String(e.message).slice(0, 300)));
      let erroTela = 0, semBarra = 0, feitas = 0;
      const detBarra = [];
      let print = "";
      try {
        await pg.goto(BASE + "/");
        await pg.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 30000, polling: 200 });
        for (let i = 0; i < Number(VOLTAS); i++) {
          await espera(400);
          await semTransicao(pg);
          const l = pg.locator("#fim").getByRole("link", { name: /Monte sua peça/ });
          await l.scrollIntoViewIfNeeded();
          await l.click();
          await ate(pg, noMonte, "Monte pela chamada final");
          await espera(900);
          if (await pg.getByText("não carregou").count()) { erroTela++; print ||= await pg.screenshot({ path: `${PRINTS}${tag}-idas-${como}-erro.jpg`, type: "jpeg", quality: 70, scale: "css" }).then(() => `${tag}-idas-${como}-erro.jpg`); }
          await semTransicao(pg);
          if (como === "logo") await pg.getByRole("link", { name: "Whim Confecção e Estamparia, página inicial" }).first().click();
          else if (como === "menu") {
            await pg.getByRole("button", { name: /Menu/ }).click();
            await pg.locator("#menu-principal").getByRole("link", { name: "Início" }).click();
          } else await pg.goBack({ waitUntil: "commit" });
          await ate(pg, naHome, `home pelo ${como}`);
          await espera(900);
          await semTransicao(pg).catch(() => {});
          if (await pg.getByText("não carregou").count()) {
            erroTela++;
            print ||= await pg.screenshot({ path: `${PRINTS}${tag}-idas-${como}-erro.jpg`, type: "jpeg", quality: 70, scale: "css" }).then(() => `${tag}-idas-${como}-erro.jpg`);
            await pg.goto(BASE + "/");
          }
          const b = await pg.evaluate(() => {
            const n = document.querySelector('nav[aria-label="Navegação principal"]');
            const r = n?.getBoundingClientRect();
            return { ok: !!r && r.top >= 0 && r.bottom > 0 && !document.querySelector("header[data-oculta]"), top: Math.round(r?.top ?? -1), y: Math.round(scrollY) };
          });
          if (!b.ok) { semBarra++; detBarra.push(`${i + 1}:${JSON.stringify(b)}`); print ||= await pg.screenshot({ path: `${PRINTS}${tag}-idas-${como}-sem-barra.jpg`, type: "jpeg", quality: 70, scale: "css" }).then(() => `${tag}-idas-${como}-sem-barra.jpg`); }
          feitas++;
        }
      } catch (e) {
        errs.push("script: " + String(e.message).split("\n")[0]);
        print ||= await pg.screenshot({ path: `${PRINTS}${tag}-idas-${como}-falha.jpg`, type: "jpeg", quality: 70, scale: "css" }).then(() => `${tag}-idas-${como}-falha.jpg`).catch(() => "");
      }
      const e = [...new Set(errs)];
      ok("idas", `${VOLTAS} idas e voltas pelo ${como}: sem tela de erro`, feitas === Number(VOLTAS) && erroTela === 0, `feitas=${feitas} telaErro=${erroTela}`, print);
      ok("idas", `${VOLTAS} idas e voltas pelo ${como}: barra aparece ao voltar à home`, semBarra === 0 && feitas > 0, `sem barra=${semBarra} ${detBarra.slice(0, 3).join(" ")}`, print);
      ok("idas", `${VOLTAS} idas e voltas pelo ${como}: console sem erros`, e.length === 0, e.join(" | "));
      bloqueados.push(...b2);
      await c2.close();
    }
  }

  ok("segurança", "nenhuma mensagem nem contato enviado (pedidos bloqueados)", true, bloqueados.length ? bloqueados.join(" | ") : "nenhum pedido a wa.me, api.whatsapp.com ou /api/contatos");
  await ctx.close();
  await browser.close();
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\nok ${resultados.length - falhas.length}, falhas ${falhas.length}`);
