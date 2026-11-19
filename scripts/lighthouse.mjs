// Lighthouse no celular e no PC (home, Monte sua peça e /privacidade). Usa o Chromium do Playwright.
// Uma vez: npm i --no-save lighthouse playwright-core && npx playwright-core install chromium
// Rodar:    node scripts/lighthouse.mjs http://localhost:3430 saida
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [BASE, SAIDA] = process.argv.slice(2);
mkdirSync(SAIDA, { recursive: true });
const CHROME = join(homedir(), "AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe");
const LH = join(dirname(fileURLToPath(import.meta.url)), "../node_modules/lighthouse/cli/index.js");
const kb = (b) => Math.round(b / 1024);
const linhas = [];
for (const [rota, nome] of [["/", "home"], ["/monte-sua-peca", "monte"], ["/privacidade", "privacidade"]]) {
  for (const forma of ["celular", "pc"]) {
    const arq = join(SAIDA, `lh-${nome}-${forma}.json`);
    const args = [LH, BASE + rota, "--output=json", `--output-path=${arq}`, "--quiet", "--chrome-flags=--headless=new --no-sandbox", "--only-categories=performance,accessibility,best-practices,seo", "--locale=pt-BR"];
    if (forma === "pc") args.push("--preset=desktop");
    try {
      execFileSync(process.execPath, args, { env: { ...process.env, CHROME_PATH: CHROME }, stdio: "inherit", timeout: 240000 });
    } catch (e) {
      console.log("falhou", nome, forma, e.message.split("\n")[0]);
      continue;
    }
    const r = JSON.parse(readFileSync(arq, "utf8"));
    const a = r.audits;
    const nota = (c) => Math.round((r.categories[c]?.score ?? 0) * 100);
    const itens = a["network-requests"]?.details?.items ?? [];
    const porTipo = {};
    for (const i of itens) porTipo[i.resourceType] = (porTipo[i.resourceType] ?? 0) + (i.transferSize ?? 0);
    const pesados = [...itens].sort((x, y) => (y.transferSize ?? 0) - (x.transferSize ?? 0)).slice(0, 6).map((i) => `${i.url.replace(BASE, "").split("?")[0].slice(-60)} ${kb(i.transferSize ?? 0)} KB`);
    const lcpEl = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? a["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet ?? "";
    const falhas = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable" && x.scoreDisplayMode !== "manual").map((x) => `${x.id}${x.displayValue ? ` (${x.displayValue})` : ""}`);
    const linha = {
      pagina: nome, forma,
      desempenho: nota("performance"), acessibilidade: nota("accessibility"), praticas: nota("best-practices"), seo: nota("seo"),
      lcp: a["largest-contentful-paint"].displayValue, fcp: a["first-contentful-paint"].displayValue, tbt: a["total-blocking-time"].displayValue, cls: a["cumulative-layout-shift"].displayValue, si: a["speed-index"].displayValue,
      pesoKB: kb(a["total-byte-weight"].numericValue), requisicoes: itens.length,
      porTipoKB: Object.fromEntries(Object.entries(porTipo).map(([k, v]) => [k, kb(v)]).sort((x, y) => y[1] - x[1])),
      pesados, lcpEl: lcpEl.slice(0, 160), falhas,
    };
    linhas.push(linha);
    console.log(JSON.stringify(linha));
  }
}
writeFileSync(join(SAIDA, "lighthouse.json"), JSON.stringify(linhas, null, 1));
