// Idas e voltas Monte sua peça → home no celular (pedido de 18/11 à noite, item 4): pelo logo,
// pelo menu e pelo Voltar do navegador, com e sem a abertura, no Chromium e no WebKit (iPhone 13).
// Conta a tela de erro ("Esta página não carregou") e junta os erros do console.
//
// Uma vez:  npm i --no-save playwright-core && npx playwright-core install chromium webkit
// Rodar:    npm run build && npx next start -p 3427
//           node scripts/idas-e-voltas.mjs http://localhost:3427 20 [Chromium,WebKit] [logo,menu,voltar] [com,sem]
let chromium, webkit, devices;
try {
  ({ chromium, webkit, devices } = await import("playwright-core"));
} catch {
  console.error("Falta o Playwright: rode `npm i --no-save playwright-core` e `npx playwright-core install chromium webkit`.");
  process.exit(1);
}

const BASE = process.argv[2] ?? "http://localhost:3427";
const COMO = process.argv[5] ? process.argv[5].split(",") : ["logo", "menu", "voltar"];
const ABERTURA = process.argv[6] ? process.argv[6].split(",").map((x) => x === "com") : [true, false];
const VOLTAS = Number(process.argv[3] ?? 20);
const NAV = process.argv[4] ? process.argv[4].split(",") : ["Chromium", "WebKit"];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const naHome = (u) => new URL(u).pathname === "/";
const noMonte = (u) => new URL(u).pathname === "/monte-sua-peca";

async function contexto(browser) {
  const iphone = { ...devices["iPhone 13"] };
  delete iphone.defaultBrowserType;
  const ctx = await browser.newContext({ ...iphone, locale: "pt-BR" });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("whim-dica-whatsapp", "1"); } catch {}
  });
  return ctx;
}

const telaErro = (p) => p.getByText("não carregou").count();
async function ate(p, cond, passo) {
  for (let i = 0; i < 100; i++) {
    if (cond(p.url())) return;
    await espera(100);
  }
  throw new Error(`${passo}: não chegou (url ${p.url()})`);
}

// A transição de tinta engole cliques enquanto passa (transicao-pinta.tsx): espera ela acabar.
const semTransicao = (p) => p.waitForFunction(() => !document.querySelector(".pinta-tinta")?.hasAttribute("data-ativa"), null, { timeout: 8000 });
async function irHome(p, como) {
  await semTransicao(p);
  if (como === "logo") await p.getByRole("link", { name: "Whim Confecção e Estamparia, página inicial" }).first().click();
  else if (como === "menu") {
    await p.getByRole("button", { name: /Menu/ }).click();
    await p.locator("#menu-principal").getByRole("link", { name: "Início" }).click();
  } else await p.goBack({ waitUntil: "commit" });
  await ate(p, naHome, `home pelo ${como}`);
}

async function irMonte(p) {
  await semTransicao(p);
  const l = p.locator("#fim").getByRole("link", { name: /Monte sua peça/ });
  await l.scrollIntoViewIfNeeded();
  await l.click();
  await ate(p, noMonte, "Monte pela chamada final");
}

for (const [nome, tipo] of [["Chromium", chromium], ["WebKit", webkit]].filter(([n]) => NAV.includes(n))) {
  const browser = await tipo.launch();
  for (const abertura of ABERTURA) {
    for (const como of COMO) {
      const ctx = await contexto(browser);
      const p = await ctx.newPage();
      p.setDefaultTimeout(10000);
      const erros = [];
      p.on("console", (m) => m.type() === "error" && erros.push(m.text().slice(0, 300)));
      p.on("pageerror", (e) => erros.push("pageerror: " + String(e.message).slice(0, 300)));
      let erroTela = 0;
      let vistaRuim = 0;
      let feitas = 0;
      try {
        if (abertura) {
          await p.goto(BASE + "/");
          await p.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 15000 });
        } else {
          // sem a abertura: entra pelo Monte e chega à home por link
          await p.goto(BASE + "/monte-sua-peca", { waitUntil: "networkidle" });
          await irHome(p, como === "voltar" ? "logo" : como);
        }
        for (let i = 0; i < VOLTAS; i++) {
          await espera(400);
          const estado = await p.evaluate(() => document.querySelector("h1 [data-estado]")?.dataset.estado ?? "?");
          if (estado !== "pronta") vistaRuim++;
          await irMonte(p);
          await espera(900);
          if (await telaErro(p)) erroTela++;
          await irHome(p, como);
          await espera(900);
          if (await telaErro(p)) {
            erroTela++;
            await p.goto(BASE + "/");
          }
          feitas++;
          if (process.env.PASSO) console.error(nome, abertura, como, feitas);
        }
      } catch (e) {
        erros.push("script: " + String(e.message).split("\n")[0]);
        await p.screenshot({ path: `falha-${nome}-${abertura}-${como}.png` }).catch(() => {});
      }
      console.log(JSON.stringify({ nav: nome, abertura, como, feitas, erroTela, vistaRuim, erros: [...new Set(erros)] }));
      await ctx.close();
    }
  }
  await browser.close();
}
