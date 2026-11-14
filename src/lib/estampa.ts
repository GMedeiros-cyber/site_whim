/**
 * Arte na peça acompanhando dobras e sombras (referencia/previa-cor/README-estampa.md, 2.3).
 * Canvas 2D; roda só quando muda arte, posição, cor ou lado (nunca por quadro).
 */

export type Lado = "frente" | "costas";
/** [x, y, largura, altura] de 0 a 1 no quadro 900x1200 (manifest.pecas[].areasEstampa). */
export type Area = [number, number, number, number];

const K = 6; // deslocamento máximo nas dobras, em px do quadro de 900
const G_REF = 3; // gradiente de L (níveis por px, já desfocado) que dá o deslocamento máximo
const RAIO = 2; // desfoque do mapa de dobras
const OPACIDADE = 0.95; // tinta, não adesivo
const ESCURO = 0.4; // abaixo de 40% da mediana é cabide ou o vão do capuz: a arte não passa por cima

export function areaDe(modelo: { areasEstampa: object }, chave: string) {
  return (modelo.areasEstampa as Record<string, Area | undefined>)[chave];
}

const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function tela(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c.getContext("2d", { willReadFrequently: true })!;
}

/** Marcador "Sua arte" (tracejado) do tamanho da área, para quando ainda não há arte. */
function marcador(w: number, h: number, tinta: string, fonte: string) {
  const ctx = tela(w, h);
  const linha = Math.max(2, Math.min(w, h) * 0.025);
  ctx.strokeStyle = ctx.fillStyle = tinta;
  ctx.lineWidth = linha;
  ctx.setLineDash([linha * 3, linha * 2]);
  ctx.beginPath();
  ctx.roundRect(linha, linha, w - 2 * linha, h - 2 * linha, linha * 2);
  ctx.stroke();
  const tamanho = Math.min(h * 0.28, w * 0.16);
  if (tamanho >= 9) {
    ctx.font = `600 ${tamanho}px ${fonte}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sua arte", w / 2, h / 2);
  }
  return ctx.canvas;
}

/** Caixa média separável (raio r) de L numa região, com borda presa. */
function desfocar(L: Float32Array, W: number, x0: number, y0: number, w: number, h: number) {
  const H = L.length / W;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const n = 2 * RAIO + 1;
  for (let y = 0; y < h; y++) {
    const linha = limitar(y0 + y, 0, H - 1) * W;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let d = -RAIO; d <= RAIO; d++) s += L[linha + limitar(x0 + x + d, 0, W - 1)];
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let d = -RAIO; d <= RAIO; d++) s += tmp[limitar(y + d, 0, h - 1) * w + x];
      out[y * w + x] = s / n;
    }
  return out;
}

/**
 * Desenha a peça e, em cada área, a arte (ou o marcador) deformada pelas dobras do mapa
 * branco do mesmo lado, sombreada por ele e recortada pelo tecido.
 * `arte` null = marcador "Sua arte" na cor `tinta`.
 */
export function comporEstampa(
  ctx: CanvasRenderingContext2D,
  peca: HTMLImageElement,
  branco: HTMLImageElement,
  camadas: { area: Area; arte: HTMLImageElement | null }[],
  tinta: string,
  fonte: string
) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(peca, 0, 0, W, H);
  if (!camadas.length) return;

  // Mapa: luminância do branco e alfa do tecido; Lref = mediana de L no tecido.
  const mapa = tela(W, H);
  mapa.drawImage(branco, 0, 0, W, H);
  const px = mapa.getImageData(0, 0, W, H).data;
  const L = new Float32Array(W * H);
  const hist = new Uint32Array(256);
  let tecido = 0;
  for (let i = 0; i < W * H; i++) {
    L[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
    if (px[i * 4 + 3] > 127) {
      hist[Math.round(L[i])]++;
      tecido++;
    }
  }
  let lref = 255;
  for (let v = 0, soma = 0; v < 256; v++) if ((soma += hist[v]) >= tecido / 2) {
    lref = Math.max(1, v);
    break;
  }

  const M = K + RAIO + 2; // margem: a arte pode andar até K px para fora da área
  for (const { area, arte } of camadas) {
    const ax = area[0] * W, ay = area[1] * H, aw = area[2] * W, ah = area[3] * H;
    const x0 = Math.max(0, Math.floor(ax) - M), y0 = Math.max(0, Math.floor(ay) - M);
    const w = Math.min(W, Math.ceil(ax + aw) + M) - x0, h = Math.min(H, Math.ceil(ay + ah) + M) - y0;

    // 1. Arte encaixada sem distorcer: contain, centrada em x, alinhada em cima.
    const fonteArte = arte ?? marcador(Math.round(aw), Math.round(ah), tinta, fonte);
    const iw = (arte ? arte.naturalWidth : fonteArte.width) || 1;
    const ih = (arte ? arte.naturalHeight : fonteArte.height) || 1;
    const s = Math.min(aw / iw, ah / ih);
    const camada = tela(w, h);
    camada.drawImage(fonteArte, ax - x0 + (aw - iw * s) / 2, ay - y0, iw * s, ih * s);
    const A = camada.getImageData(0, 0, w, h).data;

    // 2. L desfocado e gradiente na região.
    const Lb = desfocar(L, W, x0, y0, w, h);
    const saida = camada.createImageData(w, h);
    const o = saida.data;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const g = (y0 + y) * W + x0 + x;
        // 5. Recorte: só tecido (alfa > 0,5) e nada sobre o cabide ou o vão escuro.
        if (px[g * 4 + 3] <= 127 || L[g] < ESCURO * lref) continue;
        const i = y * w + x;
        const gx = (Lb[y * w + Math.min(x + 1, w - 1)] - Lb[y * w + Math.max(x - 1, 0)]) / 2;
        const gy = (Lb[Math.min(y + 1, h - 1) * w + x] - Lb[Math.max(y - 1, 0) * w + x]) / 2;
        // 3. Desloca a amostra pelo gradiente (entorta a arte nas dobras), bilinear pré-multiplicado.
        const sx = x + K * limitar(gx / G_REF, -1, 1);
        const sy = y + K * limitar(gy / G_REF, -1, 1);
        const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
        let r = 0, gg = 0, b = 0, a = 0;
        for (let k = 0; k < 4; k++) {
          const cx = ix + (k & 1), cy = iy + (k >> 1);
          if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
          const p = (cy * w + cx) * 4;
          const peso = (k & 1 ? fx : 1 - fx) * (k >> 1 ? fy : 1 - fy) * A[p + 3];
          r += A[p] * peso;
          gg += A[p + 1] * peso;
          b += A[p + 2] * peso;
          a += peso;
        }
        if (a < 1) continue;
        // 4. Sombra das dobras; acima de 1 clareia de leve.
        const f = limitar(Lb[i] / lref, 0.55, 1.08) / a;
        o[i * 4] = r * f;
        o[i * 4 + 1] = gg * f;
        o[i * 4 + 2] = b * f;
        o[i * 4 + 3] = a * OPACIDADE; // 6. opacidade da tinta
      }
    camada.putImageData(saida, 0, 0);
    ctx.drawImage(camada.canvas, x0, y0);
  }
}
