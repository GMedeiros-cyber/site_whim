// Abre o site publicado dentro de uma moldura de iPhone (corpo, Dynamic Island ou botão de início,
// barra de status e barra do Safari), numa janela do WebKit (motor do Safari) com o toque e o user
// agent do iPhone. A tela do site tem o tamanho do perfil do Playwright, igual ao do teste.
// Mesmos bloqueios do teste: wa.me, api.whatsapp.com e /api/contatos não saem.
//
// Rodar (nesta pasta):  node ver.mjs                      → iPhone 15, home
//                       node ver.mjs "iPhone SE" /monte-sua-peca
//                       node ver.mjs "iPhone SE,iPhone 15,iPhone 15 Pro Max"   → uma janela de cada
// Fechar todas as janelas encerra o script. Cada janela é uma sessão nova (a abertura toca).
//
// O site só deixa ser emoldurado pelo próprio endereço (X-Frame-Options SAMEORIGIN), então a
// moldura é servida aqui mesmo, por page.route, num caminho falso do site: nada muda no servidor.
import { webkit, devices } from "playwright-core";

const [PERFIS = "iPhone 15", CAMINHO = "/", BASE = "https://whimconfeccao.com.br"] = process.argv.slice(2);
const MOLDURA = "/__moldura-iphone";
const ALTURA_MAX = Number(process.env.ALTURA_JANELA ?? 900); // cabe numa tela de 1080 px com a barra de tarefas; a moldura encolhe para caber
const PRINT = process.env.PRINT; // PRINT=arquivo.png: sem janela, só tira o print da moldura e sai (para conferir)

// Medidas da tela (pt) e da moldura por modelo. Sem `screen` no perfil (SE): moldura com botão de início.
function medidas(d) {
  const { width: w, height: h } = d.viewport;
  if (!d.screen) return { w, h, ilha: false, topo: 20, baixo: 44, tela: 20 + h + 44, borda: 14, testa: 78, raio: 44, raioTela: 0 };
  const topo = 54;
  return { w, h, ilha: true, topo, baixo: d.screen.height - topo - h, tela: d.screen.height, borda: 12, testa: 0, raio: w > 400 ? 66 : 60, raioTela: w > 400 ? 55 : 50 };
}

const html = (m, perfil) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${perfil}</title>
<style>
*{box-sizing:border-box;margin:0}
html,body{height:100%;background:#d9dbe3;font-family:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;overflow:hidden}
body{display:grid;place-items:center}
.cel{position:relative;width:${m.w + 2 * m.borda}px;padding:${m.testa || m.borda}px ${m.borda}px;border-radius:${m.raio}px;background:#1d1d1f;
  box-shadow:inset 0 0 0 2px #5b5b60,inset 0 0 0 5px #111,0 30px 60px -20px rgba(0,0,0,.45);transform-origin:center}
.tela{position:relative;width:${m.w}px;height:${m.tela}px;border-radius:${m.raioTela}px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.status{height:${m.topo}px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:${m.ilha ? "6px 32px 0 42px" : "0 8px"};
  font-weight:600;font-size:${m.ilha ? 17 : 12}px;color:#000;background:#fff}
.ilha{position:absolute;top:11px;left:50%;width:124px;height:36px;margin-left:-62px;border-radius:20px;background:#000;z-index:3}
.icones{display:flex;gap:6px;align-items:center}
iframe{display:block;width:${m.w}px;height:${m.h}px;border:0;flex:none;background:#fff}
.safari{flex:1;background:rgba(246,246,248,.96);border-top:.5px solid rgba(0,0,0,.15);display:flex;flex-direction:column;align-items:center;padding-top:${m.ilha ? 8 : 6}px;position:relative}
.end{width:calc(100% - ${m.ilha ? 28 : 16}px);height:${m.ilha ? 46 : 32}px;border-radius:${m.ilha ? 14 : 9}px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);
  display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:${m.ilha ? 16 : 13}px;color:#000}
.end span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:80%}
.barra{display:${m.ilha ? "flex" : "none"};width:100%;justify-content:space-around;margin-top:12px}
button{all:unset;cursor:pointer;color:#0a84ff;font-size:22px;line-height:1;padding:4px 8px}
button:disabled{color:#c7c7cc}
.home{position:absolute;bottom:8px;left:50%;width:134px;height:5px;margin-left:-67px;border-radius:3px;background:#000}
.botao{display:${m.ilha ? "none" : "block"};width:52px;height:52px;margin:13px auto 0;border-radius:50%;box-shadow:inset 0 0 0 2px #3a3a3c}
.alto{display:${m.ilha ? "none" : "block"};position:absolute;top:36px;left:50%;width:56px;height:6px;margin-left:-28px;border-radius:3px;background:#3a3a3c}
</style></head><body>
<div class="cel" id="cel">
  <div class="alto"></div>
  <div class="tela">
    ${m.ilha ? '<div class="ilha"></div>' : ""}
    <div class="status"><span>9:41</span><span class="icones">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .5 10.2 10.2 0 0 0 .8 3.4L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 3.9a6.8 6.8 0 0 0-4.8 1.9L4.4 7c1-.9 2.2-1.4 3.6-1.4ZM8 9l2.3-2.3A3.3 3.3 0 0 0 8 5.8a3.3 3.3 0 0 0-2.3.9Z"/></svg>
      <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#000" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" opacity=".5"/></svg>
    </span></div>
    <iframe id="site" src="${BASE + CAMINHO}" allow="autoplay; fullscreen"></iframe>
    <div class="safari">
      <div class="end"><small style="font-size:.8em">aA</small><span id="url">whimconfeccao.com.br</span><button id="recarregar" title="Recarregar" style="font-size:18px;color:#000">↻</button></div>
      <div class="barra"><button id="voltar" title="Voltar">‹</button><button id="avancar" title="Avançar">›</button><button disabled>⇪</button><button disabled>▢</button><button disabled>⧉</button></div>
      ${m.ilha ? '<div class="home"></div>' : ""}
    </div>
  </div>
  <div class="botao"></div>
</div>
<script>
const site = document.getElementById("site"), cel = document.getElementById("cel");
const ajustar = () => { const s = Math.min(1, (innerHeight - 16) / cel.offsetHeight, (innerWidth - 16) / cel.offsetWidth); cel.style.transform = "scale(" + s + ")"; };
addEventListener("resize", ajustar); ajustar();
document.getElementById("voltar").onclick = () => site.contentWindow.history.back();
document.getElementById("avancar").onclick = () => site.contentWindow.history.forward();
document.getElementById("recarregar").onclick = () => site.contentWindow.location.reload();
setInterval(() => { try { const l = site.contentWindow.location; document.getElementById("url").textContent = l.host + (l.pathname === "/" ? "" : l.pathname); } catch {} }, 400);
</script></body></html>`;

const browser = await webkit.launch({ headless: !!PRINT });
let abertas = 0;
for (const perfil of PERFIS.split(",")) {
  const d = { ...devices[perfil] };
  if (!d.viewport) throw new Error(`Perfil desconhecido: ${perfil}`);
  delete d.defaultBrowserType;
  const m = medidas(d);
  const largura = m.w + 2 * m.borda + 48;
  const altura = Math.min(ALTURA_MAX, m.tela + 2 * (m.testa || m.borda) + 48);
  const ctx = await browser.newContext({ ...d, viewport: { width: largura, height: altura }, screen: { width: largura, height: altura }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
  await ctx.route(/(^https?:\/\/(wa\.me|api\.whatsapp\.com)\/)|\/api\/contatos/, (rota) => {
    console.log(`[${perfil}] bloqueado: ${rota.request().method()} ${rota.request().url().slice(0, 100)}`);
    return rota.abort("blockedbyclient");
  });
  await ctx.route(BASE + MOLDURA, (rota) => rota.fulfill({ contentType: "text/html; charset=utf-8", body: html(m, perfil) }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log(`[${perfil}] erro na página: ${e.message.slice(0, 200)}`));
  if (!PRINT) {
    abertas++;
    p.on("close", () => --abertas || browser.close());
  }
  await p.goto(BASE + MOLDURA);
  if (PRINT) {
    await p.waitForTimeout(9000); // a abertura e a tinta do "Vista"
    await p.screenshot({ path: PRINT.replace(/(\.\w+)$/, `-${perfil.replace(/\W+/g, "")}$1`), scale: "css" });
    await p.close();
    continue;
  }
  console.log(`[${perfil}] aberto: tela do site ${m.w}×${m.h} px, escala ${d.deviceScaleFactor}`);
}
if (PRINT) await browser.close();
