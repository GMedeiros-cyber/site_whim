/**
 * Worker da estampa (README-estampa-2.md, 5: acima de ~50 ms, OffscreenCanvas num Worker).
 * Prepara as artes, analisa e compõe a peça fora da thread principal. Guarda as fotos (pelo
 * endereço) e as artes recebidas (pela URL local) em cache.
 */
import { analisar, comporEstampa, preparar, referencia, tela, type Area, type ArtePronta, type Tecnica } from "./estampa";

export type Pedido =
  | { tipo: "arte"; url: string; bitmap: ImageBitmap }
  | { tipo: "analisar"; id: number; url: string }
  | { tipo: "pronta"; id: number; url: string; manter: boolean; tecnica: Tecnica }
  | {
      tipo: "compor";
      id: number;
      largura: number;
      altura: number;
      peca: string;
      branco: string;
      tecnica: Tecnica;
      camadas: { area: Area; url?: string; manter: boolean; marcador?: ImageBitmap }[];
    };

const LIMITE = 24;
const lembrar = <T,>(m: Map<string, T>, k: string, v: T) => {
  m.set(k, v);
  // ponytail: descarta pela ordem de chegada; LRU se a troca de artes ficar lenta
  if (m.size > LIMITE) m.delete(m.keys().next().value!);
  return v;
};
const artes = new Map<string, ImageBitmap>();
const prontas = new Map<string, ArtePronta>();
const fotos = new Map<string, Promise<ImageBitmap>>();
const referencias = new Map<string, number>();

const foto = (url: string) => fotos.get(url) ?? lembrar(fotos, url, fetch(url).then((r) => r.blob()).then((b) => createImageBitmap(b)));
function pronta(url: string, manter: boolean, tecnica: Tecnica) {
  const chave = `${url}|${manter}|${tecnica}`;
  const arte = artes.get(url);
  if (!arte) return null;
  return prontas.get(chave) ?? lembrar(prontas, chave, preparar(arte, manter, tecnica));
}

const responder = (m: unknown, transferir: Transferable[] = []) => (self as unknown as { postMessage(m: unknown, t: Transferable[]): void }).postMessage(m, transferir);

self.addEventListener("message", async (e: MessageEvent<Pedido>) => {
  const d = e.data;
  if (d.tipo === "arte") {
    lembrar(artes, d.url, d.bitmap);
    for (const k of prontas.keys()) if (k.startsWith(`${d.url}|`)) prontas.delete(k);
    return;
  }
  try {
    if (d.tipo === "analisar") {
      const p = pronta(d.url, false, "DTF");
      return responder({ id: d.id, info: p && analisar(p) });
    }
    if (d.tipo === "pronta") {
      const p = pronta(d.url, d.manter, d.tecnica);
      const bitmap = p && (await createImageBitmap(p.tela));
      return responder({ id: d.id, bitmap }, bitmap ? [bitmap] : []);
    }
    const t0 = performance.now();
    const [peca, branco] = await Promise.all([foto(d.peca), foto(d.branco)]);
    const lref = referencias.get(d.branco) ?? lembrar(referencias, d.branco, referencia(branco));
    const camadas = d.camadas.map(({ area, url, manter, marcador }) => {
      const p = url ? pronta(url, manter, d.tecnica) : null;
      return { area, arte: p ? { tela: p.tela, paleta: p.paleta, simula: true } : { tela: marcador!, paleta: null, simula: false } };
    });
    const ctx = tela(d.largura, d.altura);
    comporEstampa(ctx, peca, branco, lref, camadas, d.tecnica);
    const bitmap = (ctx.canvas as OffscreenCanvas).transferToImageBitmap();
    responder({ id: d.id, bitmap, ms: Math.round(performance.now() - t0) }, [bitmap]);
  } catch (erro) {
    responder({ id: d.id, erro: String(erro) });
  }
});
