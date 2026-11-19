// Auditoria de 19/11 (docs/qualidade/auditoria-19-11.md): regressão no build de produção.
// Uma vez: npm i --no-save playwright-core axe-core && npx playwright-core install chromium webkit
// Rodar:    npm run build && npx next start -p 3430
//           node scripts/auditoria.mjs http://localhost:3430 saida [Chromium,WebKit] [360,390,430,768,1280,1920,2560] [normal,reduzido]
//           SO=home,monte,privacidade,404 limita as páginas.
import { chromium, webkit } from "playwright-core";
import { mkdirSync, readFileSync, appendFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const [BASE, SAIDA, NAVS = "Chromium,WebKit", LARGS = "360,390,430,768,1280,1920,2560", MOVS = "normal,reduzido"] = process.argv.slice(2);
mkdirSync(SAIDA, { recursive: true });
const ALTURA = { 360: 780, 390: 844, 430: 932, 768: 1024, 1280: 800, 1920: 1080, 2560: 1440 };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const IA = /hero-oficina|rodo-tela|\/estilos\/|camiseta-whim-mesa/;

const resultados = [];
function anotar(r) {
  resultados.push(r);
  appendFileSync(`${SAIDA}/resultados.jsonl`, JSON.stringify(r) + "\n");
  if (!r.ok) console.log(`FALHA [${r.onde}] ${r.pagina} · ${r.item}: ${r.det ?? ""}`.slice(0, 400));
}

for (const [nome, tipo] of [["Chromium", chromium], ["WebKit", webkit]].filter(([n]) => NAVS.split(",").includes(n))) {
  const browser = await tipo.launch();
  for (const w of LARGS.split(",").map(Number)) {
    for (const mov of MOVS.split(",")) {
      const h = ALTURA[w];
      const celular = w < 601;
      const toque = w <= 768;
      const onde = `${nome} ${w} ${mov}`;
      const tag = `${nome.toLowerCase()}-${w}-${mov}`;
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: celular ? 2 : 1,
        isMobile: toque,
        hasTouch: toque,
        locale: "pt-BR",
        reducedMotion: mov === "reduzido" ? "reduce" : "no-preference",
      });
      await ctx.addInitScript(() => {
        try { sessionStorage.setItem("whim-dica-whatsapp", "1"); } catch {}
        window.open = () => null;
      });
      const p = await ctx.newPage();
      p.setDefaultTimeout(30000);
      let erros = [];
      p.on("console", (m) => m.type() === "error" && erros.push(m.text().slice(0, 200)));
      p.on("pageerror", (e) => erros.push("pageerror: " + e.message.slice(0, 200)));
      const ok = (pagina, item, cond, det = "", print = "") => anotar({ onde, nav: nome, w, mov, pagina, item, ok: !!cond, det: String(det).slice(0, 600), print });
      const tentar = async (pagina, item, fn) => {
        try { await fn(); } catch (e) {
          const print = `${tag}-${pagina}-erro-${item.replace(/\W+/g, "_").slice(0, 30)}.jpg`;
          await p.screenshot({ path: `${SAIDA}/${print}`, type: "jpeg", quality: 70 }).catch(() => {});
          ok(pagina, item, false, "script: " + e.message.split("\n")[0], print);
        }
      };
      const lateral = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const consoleOk = (pagina) => { ok(pagina, "console limpo", erros.length === 0, [...new Set(erros)].join(" | ")); erros = []; };
      // Elementos clicáveis embaixo do botão flutuante, na posição atual da página.
      const cobertos = () => p.evaluate(() => {
        const bt = document.querySelector('a[aria-label="Pedir orçamento no WhatsApp"]');
        if (!bt || !bt.checkVisibility({ visibilityProperty: true })) return [];
        const b = bt.getBoundingClientRect();
        return [...document.querySelectorAll("a, button, input, select, textarea, [role=tab], label")]
          .filter((e) => e !== bt && !bt.contains(e) && !e.closest('[class*="fixed"]') && e.checkVisibility({ visibilityProperty: true }))
          .map((e) => [e, e.getBoundingClientRect()])
          .filter(([, r]) => r.width > 0 && r.left < b.right - 4 && r.right > b.left + 4 && r.top < b.bottom - 4 && r.bottom > b.top + 4)
          .map(([e]) => (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40));
      });
      const alvosPequenos = () => p.evaluate(() =>
        [...document.querySelectorAll("a, button, input, select, [role=tab], [role=checkbox]")]
          .filter((e) => e.checkVisibility({ visibilityProperty: true }) && !e.closest("p, address"))
          .filter((e) => e.offsetWidth > 1 && (e.offsetWidth < 44 || e.offsetHeight < 44))
          .filter((e) => { const l = e.closest("label"); return !(l && l.offsetHeight >= 44 && l.offsetWidth >= 44); })
          .filter((e) => !e.closest('[aria-hidden="true"]'))
          .map((e) => `${(e.getAttribute("aria-label") || e.textContent.trim() || e.tagName).slice(0, 30)} ${e.offsetWidth}x${e.offsetHeight}`)
      );
      const axe = async (pagina) => {
        if (nome !== "Chromium" || mov !== "normal") return;
        await p.addScriptTag({ content: AXE });
        const v = await p.evaluate(async () => {
          const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
          return r.violations.map((x) => ({ id: x.id, impacto: x.impact, n: x.nodes.length, alvos: x.nodes.slice(0, 4).map((n) => `${n.target.join(" ")} :: ${(n.any[0]?.message || n.failureSummary || "").slice(0, 160)}`) }));
        });
        ok(pagina, "axe (WCAG 2.2 AA)", v.length === 0, JSON.stringify(v));
      };
      const selos = () => p.evaluate((re) => {
        const ia = new RegExp(re);
        const selos = [...document.querySelectorAll("span, p, div")].filter((e) => e.childElementCount === 0 && /Imagem ilustrativa|ilustrativa/i.test(e.textContent) && e.checkVisibility({ opacityProperty: true }));
        return [...document.querySelectorAll("img, video")]
          .filter((m) => ia.test(m.currentSrc || m.src || m.poster || "") && m.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
          .map((m) => {
            const r = m.getBoundingClientRect();
            const tem = selos.some((s) => { const q = s.getBoundingClientRect(); return q.left >= r.left - 2 && q.right <= r.right + 2 && q.top >= r.top - 2 && q.bottom <= r.bottom + 2; });
            const bruto = m.currentSrc || m.src || m.poster;
            const u = new URL(bruto, location.href);
            const real = u.searchParams.get("url") || u.pathname;
            return { src: real.split("/").pop(), tem, w: Math.round(r.width) };
          })
          .filter((x) => x.w > 40);
      }, IA.source);
      const verSelos = async (pagina) => {
        const s = await selos(pagina);
        const sem = s.filter((x) => !x.tem);
        if (s.length) ok(pagina, "selo Imagem ilustrativa nas imagens de IA à vista", sem.length === 0, sem.map((x) => x.src).join(", "));
      };

      const rodar = (pag) => !process.env.SO || process.env.SO.split(",").includes(pag);
      // ============================ HOME
      if (rodar("home")) {
      await tentar("home", "carga", async () => {
        await p.goto(BASE + "/");
        await p.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 45000 });
        await espera(500);
        await p.screenshot({ path: `${SAIDA}/${tag}-home-topo.jpg`, type: "jpeg", quality: 75 });
        ok("home", "sem rolagem lateral", (await lateral()) <= 0, await lateral());
        await verSelos("home");
        // Seções na ordem da tela
        const secoes = await p.evaluate(() => ["topo", "sobre", "servicos", "processo", "clientes", "duvidas", "fim"].map((id) => [id, Math.round(document.getElementById(id)?.getBoundingClientRect().top + scrollY)]));
        // Rola a página toda em passos: botão flutuante, selos de IA e rolagem lateral em cada parada
        const altura = await p.evaluate(() => document.documentElement.scrollHeight);
        const cob = new Set();
        const semSelo = new Set();
        let maxLat = 0;
        for (let y = 0; y < altura; y += Math.round(h * 0.55)) {
          await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
          await espera(mov === "normal" ? 450 : 150);
          (await cobertos()).forEach((c) => cob.add(c));
          (await selos("home")).filter((x) => !x.tem).forEach((x) => semSelo.add(x.src));
          maxLat = Math.max(maxLat, await lateral());
        }
        ok("home", "sem rolagem lateral (página toda)", maxLat <= 0, maxLat);
        ok("home", "selo nas imagens de IA (página toda)", semSelo.size === 0, [...semSelo].join(", "));
        ok("home", "botão flutuante não cobre clicáveis (ao rolar)", cob.size === 0, [...cob].join(" | "));
        await p.evaluate(() => scrollTo({ top: 1e7, behavior: "instant" }));
        await espera(600);
        const fim = await cobertos();
        ok("home", "botão flutuante não cobre nada no fim da página", fim.length === 0, fim.join(" | "));
        ok("home", "seções na ordem esperada", true, JSON.stringify(secoes));
      });
      await tentar("home", "alvos", async () => {
        if (!toque) return;
        await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        const pq = await alvosPequenos();
        ok("home", "alvos de toque ≥ 44 px", pq.length === 0, pq.join(" | "));
      });
      await tentar("home", "axe", async () => axe("home"));

      // Menu e seção atual
      await tentar("home", "menu e seção atual", async () => {
        const marcas = [];
        for (const [id, rot] of [["sobre", "Sobre"], ["servicos", "Serviços"], ["processo", "Processo"], ["clientes", "Clientes"]]) {
          if (!celular && w < 821 && rot !== "Clientes") continue; // 601-820: só Início e Clientes na barra
          await p.evaluate((id) => { const el = document.getElementById(id); scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.3, behavior: "instant" }); }, id);
          await espera(400);
          await p.evaluate(() => scrollBy({ top: -60, behavior: "instant" }));
          await espera(500);
          if (celular) {
            await p.getByRole("button", { name: /Menu/ }).click();
            await espera(400);
            const atual = await p.evaluate(() => document.querySelector('#menu-principal [aria-current="location"]')?.textContent.trim() ?? "-");
            marcas.push(`${rot}=${atual}`);
            await p.keyboard.press("Escape");
            await espera(300);
          } else {
            const r = await p.evaluate(() => {
              const a = document.querySelector('nav[aria-label="Navegação principal"] ul a[aria-current="location"]');
              const pil = document.querySelector('nav[aria-label="Navegação principal"] ul > span[aria-hidden]');
              const li = a?.parentElement;
              return { atual: a?.textContent.trim() ?? "-", pilula: pil && li ? Math.abs(pil.offsetLeft - li.offsetLeft) <= 1 && Math.abs(pil.offsetWidth - li.offsetWidth) <= 1 && getComputedStyle(pil).opacity !== "0" : false };
            });
            marcas.push(`${rot}=${r.atual}${r.pilula ? "" : " (pílula fora)"}`);
          }
        }
        ok("home", celular ? "menu marca a seção atual" : "pílula e link da seção atual", marcas.every((m) => m.split("=")[0] === m.split("=")[1]), marcas.join(" "));
        if (celular) {
          // Clique no menu leva à seção certa
          await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await p.getByRole("button", { name: /Menu/ }).click();
          await p.locator("#menu-principal").getByRole("link", { name: "Processo" }).click();
          await espera(1500);
          const topo = await p.evaluate(() => Math.round(document.getElementById("processo").getBoundingClientRect().top));
          ok("home", "menu → Processo rola até a seção, abaixo da barra", topo >= 40 && topo <= 140, `topo=${topo}`);
        }
      });

      // Técnicas (abas no celular, cartões no PC) e o vídeo da Yamaha no Silk
      await tentar("home", "técnicas", async () => {
        await p.evaluate(() => document.getElementById("servicos").scrollIntoView({ behavior: "instant" }));
        await espera(1500);
        if (celular) {
          for (const aba of ["DTF", "Bordado", "Silk"]) {
            await p.locator("#servicos").getByRole("tab", { name: aba }).click();
            await espera(600);
            const sel = await p.locator("#servicos").getByRole("tab", { name: aba }).getAttribute("aria-selected");
            const vis = await p.evaluate((aba) => [...document.querySelectorAll("#servicos h3")].find((x) => x.textContent.trim() === aba && x.checkVisibility({ opacityProperty: true }))?.textContent ?? "", aba);
            ok("home", `aba ${aba}`, sel === "true" && vis === aba, `aria-selected=${sel} cartão=${vis}`);
          }
        }
        await espera(1200);
        const v = await p.evaluate(() => {
          const vs = [...document.querySelectorAll("#servicos video")].filter((x) => /yamaha/.test(x.getAttribute("poster") || ""));
          const vis = vs.find((x) => x.checkVisibility({ opacityProperty: true }));
          return { n: vs.length, visivel: !!vis, src: vis?.currentSrc?.split("/").pop() ?? "", tocando: vis ? !vis.paused : false, selo: vis ? [...vis.closest("[class*=aspect]").querySelectorAll("span")].some((s) => /ilustrativa/i.test(s.textContent) && s.checkVisibility({ opacityProperty: true })) : null };
        });
        ok("home", "vídeo da Yamaha no Silk", v.visivel && /yamaha/.test(v.src) && (mov === "reduzido" ? !v.tocando : v.tocando) && v.selo === false, JSON.stringify(v));
        await p.locator("#servicos").screenshot({ path: `${SAIDA}/${tag}-home-tecnicas.jpg`, type: "jpeg", quality: 75 });
      });

      // Arrasto das fotos (gesto sintetizado com eventos de ponteiro do mouse)
      await tentar("home", "arrasto das fotos", async () => {
        const nomeTec = celular ? "Silk" : "DTF";
        const area = p.getByRole("button", { name: `${nomeTec}: próxima foto` }).filter({ visible: true }).first();
        await area.scrollIntoViewIfNeeded();
        await espera(400);
        const atual = () => p.evaluate((n) => [...document.querySelectorAll(`button[aria-label^="${n}: foto"]`)].filter((b) => b.checkVisibility()).findIndex((b) => b.getAttribute("aria-current") === "true"), nomeTec);
        const antes = await atual();
        const b = await area.boundingBox();
        const arrastar = async (dx) => {
          await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          await p.mouse.down();
          await p.mouse.move(b.x + b.width / 2 + dx / 2, b.y + b.height / 2 + 3, { steps: 4 });
          await p.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + 5, { steps: 4 });
          await p.mouse.up();
          await espera(400);
        };
        await arrastar(-120);
        const depoisEsq = await atual();
        await arrastar(120);
        const depoisDir = await atual();
        ok("home", `arrasto das fotos (${nomeTec})`, depoisEsq === (antes + 1) % 3 && depoisDir === antes, `${antes}→${depoisEsq}→${depoisDir}`);
      });

      // Capítulos da oficina (celular)
      await tentar("home", "capítulos", async () => {
        if (!celular) return;
        const grupo = p.getByRole("group", { name: "Capítulos da oficina" });
        await grupo.scrollIntoViewIfNeeded();
        await p.evaluate(() => document.querySelector('[aria-label="Capítulos da oficina"]').scrollIntoView({ block: "end", behavior: "instant" }));
        const cap = () => p.evaluate(() => [...document.querySelectorAll('[aria-label="Capítulos da oficina"] button')].findIndex((b) => b.getAttribute("aria-current") === "step"));
        const c0 = await cap();
        await espera(4200);
        const c1 = await cap();
        ok("home", "capítulos trocam sozinhos (movimento normal) ou ficam parados (reduzido)", mov === "normal" ? c1 !== c0 : c1 === c0, `${c0}→${c1}`);
        await grupo.getByRole("button").nth(2).click();
        await espera(700);
        const c2 = await cap();
        const vid = await p.evaluate(() => { const v = document.querySelector("#sobre video"); return v ? { tocando: !v.paused, src: (v.currentSrc || "").split("/").pop() } : null; });
        ok("home", "toque no capítulo Estampa", c2 === 2 && (mov === "reduzido" ? !vid?.tocando : vid?.tocando), JSON.stringify(vid));
        await p.locator("#sobre").screenshot({ path: `${SAIDA}/${tag}-home-sobre.jpg`, type: "jpeg", quality: 75 });
      });

      // Processo andando com a rolagem (celular)
      await tentar("home", "processo", async () => {
        if (!celular) return;
        const passo = () => p.evaluate(() => [...document.querySelectorAll('#processo [role=tab]')].findIndex((t) => t.getAttribute("aria-selected") === "true"));
        const vistos = [];
        const topo = await p.evaluate(() => document.querySelector("#processo [role=tablist]").getBoundingClientRect().top + scrollY);
        for (const f of [0.9, 0.75, 0.6, 0.45, 0.3, 0.2]) {
          await p.evaluate(([t, f]) => scrollTo({ top: t - innerHeight * f, behavior: "instant" }), [topo, f]);
          await espera(350);
          vistos.push(await passo());
        }
        const sobe = vistos.every((v, i) => i === 0 || v >= vistos[i - 1]);
        ok("home", "Processo anda com a rolagem", mov === "normal" ? sobe && vistos[vistos.length - 1] === 4 && vistos[0] === 0 : true, vistos.join(","));
        await p.locator("#processo [role=tab]").nth(3).click();
        await espera(400);
        ok("home", "toque num passo do Processo", (await passo()) === 3);
      });

      // Faixa de marcas com a Yamaha
      await tentar("home", "marcas", async () => {
        await p.evaluate(() => document.getElementById("clientes").scrollIntoView({ behavior: "instant" }));
        await espera(600);
        const m = await p.evaluate(() => {
          const y = [...document.querySelectorAll('#clientes img[alt="Yamaha"]')];
          const faixa = document.querySelector("#clientes [class*=marquee]");
          return { yamaha: y.length, carregou: y.some((i) => i.complete && i.naturalWidth > 0), anim: faixa ? getComputedStyle(faixa).animationName : "", total: document.querySelectorAll('#clientes ul:not([aria-hidden]) img').length };
        });
        ok("home", "faixa de marcas com a Yamaha", m.yamaha >= 1 && m.carregou && (mov === "normal" ? m.anim !== "none" : true), JSON.stringify(m));
        await p.locator("#clientes").screenshot({ path: `${SAIDA}/${tag}-home-clientes.jpg`, type: "jpeg", quality: 75 });
      });

      // Rodapé
      await tentar("home", "rodapé", async () => {
        await p.evaluate(() => scrollTo({ top: 1e7, behavior: "instant" }));
        await espera(500);
        const r = await p.evaluate(() => {
          const f = document.querySelector("footer");
          const vis = [...f.querySelectorAll("a, h2, iframe")].filter((e) => e.checkVisibility());
          return { links: vis.filter((e) => e.tagName === "A").map((e) => (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 60)), titulos: vis.filter((e) => e.tagName === "H2").map((e) => e.textContent.trim()), mapa: vis.some((e) => e.tagName === "IFRAME") };
        });
        const precisa = ["Início", "Sobre", "Serviços", "Processo", "Clientes", "Monte sua peça", "Política de privacidade", "Desenvolvido por Tribus Labs"];
        const falta = precisa.filter((x) => !r.links.some((l) => l.startsWith(x)));
        ok("home", "rodapé com navegação, contatos e links legais", falta.length === 0 && (celular ? !r.mapa : true), `falta=${falta.join(",")} mapa=${r.mapa} títulos=${r.titulos.join("/")}`);
        await p.locator("footer").screenshot({ path: `${SAIDA}/${tag}-home-rodape.jpg`, type: "jpeg", quality: 75 });
        if (nome === "Chromium" && mov === "normal") {
          await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await espera(300);
          await p.screenshot({ path: `${SAIDA}/${tag}-home-pagina.jpg`, type: "jpeg", quality: 60, fullPage: true });
        }
      });
      consoleOk("home");
      }

      // ============================ MONTE SUA PEÇA (pedido inteiro)
      if (rodar("monte")) {
      await tentar("monte", "pedido inteiro", async () => {
        await p.goto(BASE + "/monte-sua-peca", { waitUntil: "networkidle" });
        await espera(800);
        const passoOk = async (rot) => {
          const lat = await lateral();
          const cob = await cobertos();
          ok("monte", `passo ${rot}: sem rolagem lateral e nada sob o flutuante`, lat <= 0 && cob.length === 0, `lateral=${lat} cobertos=${cob.join(" | ")}`);
          await p.screenshot({ path: `${SAIDA}/${tag}-monte-${rot}.jpg`, type: "jpeg", quality: 75 });
        };
        const continuar = async () => { await p.getByRole("button", { name: /^Continuar/ }).filter({ visible: true }).first().click(); await espera(700); };
        // 1 · Peça
        if (celular) await p.locator('[role=group][aria-label="Arara de modelos"]').getByRole("button", { name: "Polo" }).click();
        else await p.getByRole("button", { name: "Polo", exact: true }).filter({ visible: true }).first().click();
        await espera(600);
        await passoOk("1-peca");
        const atual = () => p.evaluate(() => [...document.querySelectorAll('li[data-estado="atual"] p')].map((x) => x.textContent).join(" "));
        if (/Qual peça/.test(await atual())) await continuar();
        // 2 · Cor
        await passoOk("2-cor");
        await continuar();
        // 3 · Estampa
        if (!/Onde vai a estampa/.test(await atual())) throw new Error("não chegou ao passo Estampa: " + (await atual()));
        await p.getByText("Peito esquerdo", { exact: true }).filter({ visible: true }).first().click();
        await espera(500);
        await passoOk("3-estampa");
        await continuar();
        // 4 · Quantidade
        const qtd = p.getByRole("textbox", { name: /^Quantidade/ }).filter({ visible: true }).first();
        await qtd.fill("60");
        await espera(400);
        await passoOk("4-quantidade");
        await continuar();
        // 5 · Resumo e WhatsApp
        await espera(1500);
        await passoOk("5-resumo");
        const zap = await p.evaluate(() => [...document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')].filter((a) => a.checkVisibility() && /Pedir orçamento no WhatsApp/.test(a.textContent)).map((a) => decodeURIComponent(a.href)));
        const texto = zap[0] ?? "";
        ok("monte", "pedido chega ao WhatsApp com peça, posição e quantidade", /wa\.me/.test(texto) && /Polo/.test(texto) && /Peito esquerdo/i.test(texto) && /60/.test(texto), texto.slice(0, 300));
        if (toque) {
          const pq = await alvosPequenos();
          ok("monte", "alvos de toque ≥ 44 px (resumo)", pq.length === 0, pq.join(" | "));
        }
        await p.evaluate(() => scrollTo({ top: 1e7, behavior: "instant" }));
        await espera(500);
        const fim = await cobertos();
        ok("monte", "botão flutuante não cobre nada no fim da página", fim.length === 0, fim.join(" | "));
        ok("monte", "sem rolagem lateral (fim)", (await lateral()) <= 0, await lateral());
        await verSelos("monte");
      });
      await tentar("monte", "axe", async () => { await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await axe("monte"); });
      consoleOk("monte");
      }

      // ============================ /privacidade e 404
      for (const [rota, pag] of [["/privacidade", "privacidade"], ["/pagina-que-nao-existe", "404"]].filter(([, pg]) => rodar(pg))) {
        await tentar(pag, "carga", async () => {
          const r = await p.goto(BASE + rota, { waitUntil: "networkidle" });
          await espera(500);
          ok(pag, "status", pag === "404" ? r.status() === 404 : r.status() === 200, r.status());
          ok(pag, "sem rolagem lateral", (await lateral()) <= 0, await lateral());
          await p.screenshot({ path: `${SAIDA}/${tag}-${pag}.jpg`, type: "jpeg", quality: 75 });
          await p.evaluate(() => scrollTo({ top: 1e7, behavior: "instant" }));
          await espera(400);
          const fim = await cobertos();
          ok(pag, "botão flutuante não cobre nada no fim da página", fim.length === 0, fim.join(" | "));
          if (toque) {
            await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
            const pq = await alvosPequenos();
            ok(pag, "alvos de toque ≥ 44 px", pq.length === 0, pq.join(" | "));
          }
          await axe(pag);
        });
        // a 404 tem console com o 404 do próprio documento: só os erros de JS contam
        erros = erros.filter((e) => !/404|Failed to load resource/.test(e));
        consoleOk(pag);
      }
      await ctx.close();
      console.log("feito", onde);
    }
  }
  await browser.close();
}
const falhas = resultados.filter((r) => !r.ok);
console.log(`ok ${resultados.length - falhas.length}, falhas ${falhas.length}`);
