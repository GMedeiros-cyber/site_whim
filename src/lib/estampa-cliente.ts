/**
 * Lado da thread principal da estampa: conversa com o Worker (estampa.worker.ts) por promessas.
 * Manda cada arte uma vez (como ImageBitmap, que também serve para SVG) e faz o marcador
 * "Sua arte" aqui, porque ele usa a fonte da página.
 */
import { marcador, type Area, type InfoArte, type Tecnica } from "./estampa";
import type { Pedido } from "./estampa.worker";

type Resposta = { id: number; erro?: string; bitmap?: ImageBitmap | null; info?: InfoArte | null; ms?: number };

let worker: Worker | null = null;
let seq = 0;
const esperando = new Map<number, (r: Resposta) => void>();
const enviadas = new Map<string, Promise<boolean>>();

function obter() {
  if (!worker) {
    worker = new Worker(new URL("./estampa.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Resposta>) => {
      esperando.get(e.data.id)?.(e.data);
      esperando.delete(e.data.id);
    };
  }
  return worker;
}

function pedir(p: Pedido & { id: number }, transferir: Transferable[] = []) {
  return new Promise<Resposta>((ok, erro) => {
    esperando.set(p.id, (r) => (r.erro ? erro(new Error(r.erro)) : ok(r)));
    obter().postMessage(p, transferir);
  });
}

export function carregar(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

/** Manda a arte para o Worker uma vez; `false` se o arquivo não abrir como imagem. */
function enviar(url: string) {
  let p = enviadas.get(url);
  if (!p) {
    p = carregar(url)
      .then((img) => createImageBitmap(img, img.naturalWidth ? undefined : { resizeWidth: 1024, resizeHeight: 1024 }))
      .then((bitmap) => {
        obter().postMessage({ tipo: "arte", url, bitmap } satisfies Pedido, [bitmap]);
        return true;
      })
      .catch(() => false);
    enviadas.set(url, p);
  }
  return p;
}

export async function analisarArte(url: string) {
  if (!(await enviar(url))) throw new Error("arte");
  const r = await pedir({ tipo: "analisar", id: ++seq, url });
  if (!r.info) throw new Error("arte");
  return r.info;
}

/** A arte já preparada (fundo, margens, cores da técnica), para miniaturas. */
export async function artePronta(url: string, manter: boolean, tecnica: Tecnica) {
  if (!(await enviar(url))) return null;
  return (await pedir({ tipo: "pronta", id: ++seq, url, manter, tecnica })).bitmap ?? null;
}

/**
 * Compõe a peça com as artes no Worker. `largura` 900 = 1×, 1800 = 2×. Camada sem arte
 * (ou com arquivo que não abre) vira o marcador "Sua arte" na cor `tinta`.
 */
export async function comporEstampa(o: {
  largura: number;
  altura: number;
  peca: string;
  branco: string;
  tecnica: Tecnica;
  camadas: { area: Area; url?: string; manter: boolean }[];
  tinta: string;
  fonte: string;
}) {
  const e = o.largura / 900;
  const transferir: Transferable[] = [];
  const camadas = await Promise.all(
    o.camadas.map(async ({ area, url, manter }) => {
      if (url && (await enviar(url))) return { area, url, manter };
      const m = (marcador(area[2] * 900 * e, area[3] * 1200 * e, o.tinta, o.fonte) as OffscreenCanvas).transferToImageBitmap();
      transferir.push(m);
      return { area, manter, marcador: m };
    })
  );
  const absoluta = (u: string) => new URL(u, location.href).href;
  const r = await pedir(
    { tipo: "compor", id: ++seq, largura: o.largura, altura: o.altura, peca: absoluta(o.peca), branco: absoluta(o.branco), tecnica: o.tecnica, camadas },
    transferir
  );
  return { bitmap: r.bitmap!, ms: r.ms ?? 0 };
}
