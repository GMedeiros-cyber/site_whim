/**
 * Arte na peça acompanhando dobras e sombras (referencia/previa-cor/README-estampa.md, 2.3, e
 * README-estampa-2.md, 4 e 5). Só OffscreenCanvas, sem DOM: roda no Worker (estampa.worker.ts).
 * Recalcula só quando muda arte, área, técnica, cor ou lado.
 */

export type Lado = "frente" | "costas";
/** [x, y, largura, altura] de 0 a 1 no quadro 900x1200; nas mangas, + ângulo em graus (horário na tela). */
export type Area = [number, number, number, number] | [number, number, number, number, number];
export const TECNICAS = ["Silk", "DTF", "Bordado", "Ainda não sei"] as const;
export type Tecnica = (typeof TECNICAS)[number];
export const FRASE_TECNICA: Record<Tecnica, string> = {
  Silk: "Cores chapadas, toque macio. Cada cor é uma tela.",
  DTF: "Todas as cores e degradês, com um leve brilho.",
  Bordado: "Linha costurada em relevo. Bom para logos simples.",
  "Ainda não sei": "A Whim indica a melhor técnica para a sua arte.",
};

const QUADRO = 900; // largura do quadro das fotos (1×)
const RAIO = 6; // desfoque do mapa de dobras, em px do quadro
const G_REF = 1.5; // gradiente (níveis de L por px do quadro) que dá o deslocamento máximo
const LADO_MAX = 1200; // a arte preparada fica com no máximo isso no lado maior
const MANGA_LARGURA = 0.85; // a curva do braço "come" 15% da largura

// Por técnica: textura do tecido na tinta, brilho de película, clareia acima de 1, opacidade.
const TINTA: Record<Tecnica, { trama: number; brilho: number; clareia: boolean; opacidade: number }> = {
  Silk: { trama: 0.9, brilho: 0, clareia: false, opacidade: 0.95 },
  DTF: { trama: 0.35, brilho: 0.6, clareia: true, opacidade: 0.95 },
  Bordado: { trama: 0.2, brilho: 0, clareia: true, opacidade: 1 },
  "Ainda não sei": { trama: 0.35, brilho: 0, clareia: true, opacidade: 0.95 },
};

export function areaDe(modelo: { areas: object }, lado: Lado, chave: string) {
  return (modelo.areas as Record<Lado, Record<string, Area | undefined>>)[lado][chave];
}

/** Zoom para a área ocupar boa parte da prévia: de 1× (frente inteira) a 3× (peito, nuca, manga). */
export function zoomPara(area: Area) {
  return Math.min(3, Math.max(1, Math.round((0.42 / Math.max(area[2], area[3])) * 10) / 10));
}

const limitar = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

export type Imagem = CanvasImageSource & { width: number; height: number };

export function tela(w: number, h: number) {
  return new OffscreenCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).getContext("2d", { willReadFrequently: true })!;
}

// ---------------------------------------------------------------------------------------------
// Preparo da arte: fundo liso fora, margens cortadas e cores da técnica. Fica em cache.

export type ArtePronta = { tela: Imagem; fundo: boolean; paleta: number[][] | null };

export function preparar(img: Imagem, manterFundo: boolean, tecnica: Tecnica): ArtePronta {
  const iw = img.width || 1024, ih = img.height || 1024; // SVG sem tamanho: 1024
  const s = Math.min(1, LADO_MAX / Math.max(iw, ih));
  let ctx = tela(iw * s, ih * s);
  ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
  const dados = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const fundo = detectarFundo(dados);
  if (fundo && !manterFundo) {
    tirarFundo(dados, fundo);
    ctx.putImageData(dados, 0, 0);
  }
  ctx = cortarMargens(ctx, dados);
  let paleta: number[][] | null = null;
  if (tecnica === "Bordado") {
    // linha costurada: um pouco macio antes de reduzir as cores
    const macio = tela(ctx.canvas.width, ctx.canvas.height);
    macio.filter = `blur(${0.6 * Math.max(1, ctx.canvas.width / 400)}px)`;
    macio.drawImage(ctx.canvas, 0, 0);
    ctx = macio;
  }
  if (tecnica === "Silk" || tecnica === "Bordado") {
    const d = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    paleta = quantizar(d.data, tecnica === "Silk" ? 6 : 5, tecnica === "Silk");
    ctx.putImageData(d, 0, 0);
  }
  return { tela: ctx.canvas, fundo: fundo !== null, paleta };
}

/** Cor do fundo liso: moldura de 2 px opaca e com 90% ou mais de uma cor só (tolerância ~12%). */
const TOL = 31;
function detectarFundo({ data: d, width: w, height: h }: ImageData) {
  if (w < 8 || h < 8) return null;
  const borda: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) borda.push((y * w + x) * 4);
  const hist = new Map<number, number>();
  for (const i of borda) {
    if (d[i + 3] < 250) return null; // já tem transparência
    const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  let top = 0, n = 0;
  for (const [k, v] of hist) if (v > n) [top, n] = [k, v];
  const cor = [((top >> 10) << 3) + 4, (((top >> 5) & 31) << 3) + 4, ((top & 31) << 3) + 4];
  const perto = (i: number) => Math.abs(d[i] - cor[0]) <= TOL && Math.abs(d[i + 1] - cor[1]) <= TOL && Math.abs(d[i + 2] - cor[2]) <= TOL;
  return borda.filter(perto).length >= 0.9 * borda.length ? cor : null;
}

/** Preenche a partir das bordas o que é da cor do fundo e deixa transparente; borda suave de 1 px. */
function tirarFundo({ data: d, width: w, height: h }: ImageData, cor: number[]) {
  const fora = new Uint8Array(w * h);
  const fila = new Int32Array(w * h);
  let ini = 0, fim = 0;
  const perto = (p: number) => Math.abs(d[p * 4] - cor[0]) <= TOL && Math.abs(d[p * 4 + 1] - cor[1]) <= TOL && Math.abs(d[p * 4 + 2] - cor[2]) <= TOL;
  const por = (p: number) => {
    if (!fora[p] && perto(p)) {
      fora[p] = 1;
      fila[fim++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    por(x);
    por((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    por(y * w);
    por(y * w + w - 1);
  }
  while (ini < fim) {
    const p = fila[ini++], x = p % w;
    if (x > 0) por(p - 1);
    if (x < w - 1) por(p + 1);
    if (p >= w) por(p - w);
    if (p < w * (h - 1)) por(p + w);
  }
  for (let p = 0; p < w * h; p++) {
    if (fora[p]) d[p * 4 + 3] = 0;
    else {
      const x = p % w;
      if ((x > 0 && fora[p - 1]) || (x < w - 1 && fora[p + 1]) || (p >= w && fora[p - w]) || (p < w * (h - 1) && fora[p + w])) d[p * 4 + 3] >>= 1;
    }
  }
}

function cortarMargens(ctx: OffscreenCanvasRenderingContext2D, { data: d, width: w, height: h }: ImageData) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return tela(1, 1);
  if (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1) return ctx;
  const c = tela(x1 - x0 + 1, y1 - y0 + 1);
  c.drawImage(ctx.canvas, -x0, -y0);
  return c;
}

/** k-means nos pixels opacos; troca cada pixel pela cor do grupo. `duro`: alfa cortado em 0,5. */
function quantizar(d: Uint8ClampedArray, k: number, duro: boolean) {
  const opacos: number[] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 127) opacos.push(i);
  if (!opacos.length) return [];
  const passo = Math.max(1, Math.floor(opacos.length / 20000));
  const amostra = opacos.filter((_, j) => j % passo === 0);
  const lum = (i: number) => d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
  const ordem = [...amostra].sort((a, b) => lum(a) - lum(b));
  let c = Array.from({ length: k }, (_, j) => {
    const i = ordem[Math.floor(((j + 0.5) / k) * ordem.length)];
    return [d[i], d[i + 1], d[i + 2]];
  });
  const maisPerto = (i: number) => {
    let m = 0, md = Infinity;
    for (let j = 0; j < c.length; j++) {
      const dr = d[i] - c[j][0], dg = d[i + 1] - c[j][1], db = d[i + 2] - c[j][2];
      const v = dr * dr + dg * dg + db * db;
      if (v < md) [m, md] = [j, v];
    }
    return m;
  };
  for (let it = 0; it < 8; it++) {
    const soma = c.map(() => [0, 0, 0, 0]);
    for (const i of amostra) {
      const s = soma[maisPerto(i)];
      s[0] += d[i];
      s[1] += d[i + 1];
      s[2] += d[i + 2];
      s[3]++;
    }
    c = c.map((v, j) => (soma[j][3] ? [soma[j][0] / soma[j][3], soma[j][1] / soma[j][3], soma[j][2] / soma[j][3]] : v));
  }
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const v = c[maisPerto(i)];
    d[i] = v[0];
    d[i + 1] = v[1];
    d[i + 2] = v[2];
    if (duro) d[i + 3] = d[i + 3] > 127 ? 255 : 0;
  }
  return c;
}

// ---------------------------------------------------------------------------------------------
// Análise da arte para as dicas (técnica e manga).

export type InfoArte = {
  fundo: boolean; // tinha fundo liso (removido na prévia)
  proporcao: number; // largura / altura, sem margens
  cores: number; // cores com mais de 1% dos pixels
  degrade: boolean; // muita cor espalhada (degradê ou foto)
  traco: number; // traço fino típico (20% mais finos), em fração da largura da arte
};

export function analisar(pronta: ArtePronta): InfoArte {
  const s = Math.min(1, 300 / Math.max(pronta.tela.width, pronta.tela.height));
  const ctx = tela(pronta.tela.width * s, pronta.tela.height * s);
  ctx.drawImage(pronta.tela, 0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data: d, width: w, height: h } = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const hist = new Map<number, number>();
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 127) {
      const k = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5);
      hist.set(k, (hist.get(k) ?? 0) + 1);
      n++;
    }
  let cores = 0, espalhado = 0;
  for (const v of hist.values()) if (v > 0.01 * n) cores++;
  else espalhado += v;
  // traço: menor corrida de pixels opacos (horizontal ou vertical) que passa por cada pixel
  const opaco = (x: number, y: number) => d[(y * w + x) * 4 + 3] > 127;
  const hor = new Uint16Array(w * h), ver = new Uint16Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; ) {
      if (!opaco(x, y)) { x++; continue; }
      let f = x;
      while (f < w && opaco(f, y)) f++;
      for (let i = x; i < f; i++) hor[y * w + i] = f - x;
      x = f;
    }
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; ) {
      if (!opaco(x, y)) { y++; continue; }
      let f = y;
      while (f < h && opaco(x, f)) f++;
      for (let i = y; i < f; i++) ver[i * w + x] = f - y;
      y = f;
    }
  const corridas: number[] = [];
  for (let p = 0; p < w * h; p++) if (hor[p]) corridas.push(Math.min(hor[p], ver[p]));
  corridas.sort((a, b) => a - b);
  return {
    fundo: pronta.fundo,
    proporcao: pronta.tela.width / pronta.tela.height,
    cores,
    degrade: n > 0 && espalhado > 0.3 * n,
    traco: corridas.length ? corridas[Math.floor(corridas.length * 0.2)] / w : 1,
  };
}

// ---------------------------------------------------------------------------------------------
// Composição na peça.

/** Marcador "Sua arte" (tracejado) do tamanho da área. Feito na thread principal (usa a Poppins). */
export function marcador(w: number, h: number, tinta: string, fonte: string) {
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

/** Caixa média separável de raio r (somas corridas), com borda presa. */
function desfocar(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let d = -r; d <= r; d++) s += src[o + limitar(d, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = s / n;
      s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let d = -r; d <= r; d++) s += tmp[limitar(d, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n;
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/** Mediana da luminância do tecido no mapa branco (Lref). */
export function referencia(branco: Imagem) {
  const ctx = tela(QUADRO, QUADRO * (4 / 3));
  ctx.drawImage(branco, 0, 0, ctx.canvas.width, ctx.canvas.height);
  const d = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
  const hist = new Uint32Array(256);
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 127) {
      hist[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++;
      n++;
    }
  for (let v = 0, s = 0; v < 256; v++) if ((s += hist[v]) >= n / 2) return Math.max(1, v);
  return 255;
}

/** `simula`: a técnica vale para a arte; o marcador "Sua arte" não simula técnica. */
export type Camada = { area: Area; arte: { tela: Imagem; paleta: number[][] | null; simula: boolean } };

/**
 * Desenha a peça e, em cada área, a arte (ou o marcador) com a técnica simulada, deformada
 * pelas dobras do mapa branco do mesmo lado, sombreada por ele, com a trama do tecido e
 * recortada pelo tecido (borda suave). A escala vem do canvas (900 = 1×, 1800 = 2×).
 */
export function comporEstampa(ctx: OffscreenCanvasRenderingContext2D, peca: Imagem, branco: Imagem, lref: number, camadas: Camada[], tecnica: Tecnica) {
  const { width: W, height: H } = ctx.canvas;
  const e = W / QUADRO;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(peca, 0, 0, W, H);
  const r = Math.round(RAIO * e);

  for (const { area, arte } of camadas) {
    const [x, y, w, h, ang = 0] = area;
    const manga = area.length === 5;
    const cx = (x + w / 2) * W, cy = (y + h / 2) * H, aw = w * W, ah = h * H, rad = (ang * Math.PI) / 180;
    const K = Math.min(4 * e, 0.02 * aw); // deformação suave: logo pequeno quase não entorta
    const bw = Math.abs(aw * Math.cos(rad)) + Math.abs(ah * Math.sin(rad));
    const bh = Math.abs(aw * Math.sin(rad)) + Math.abs(ah * Math.cos(rad));
    const M = Math.ceil(K + 2 * r + 4);
    const x0 = Math.max(0, Math.floor(cx - bw / 2) - M), y0 = Math.max(0, Math.floor(cy - bh / 2) - M);
    const rw = Math.min(W, Math.ceil(cx + bw / 2) + M) - x0, rh = Math.min(H, Math.ceil(cy + bh / 2) + M) - y0;
    const t = arte.simula ? tecnica : "Ainda não sei";
    const estilo = TINTA[t];

    // 1. Arte sem distorcer: contain, centrada, alinhada em cima; manga girada e mais estreita.
    const fonteArte = arte.tela;
    const s = Math.min(aw / fonteArte.width, ah / fonteArte.height);
    const camada = tela(rw, rh);
    camada.translate(cx - x0, cy - y0);
    camada.rotate(rad);
    if (manga) camada.scale(MANGA_LARGURA, 1);
    camada.drawImage(fonteArte, (-fonteArte.width * s) / 2, -ah / 2, fonteArte.width * s, fonteArte.height * s);
    const A = camada.getImageData(0, 0, rw, rh).data;

    // 2. Mapa branco na mesma escala: L, L desfocado e alfa do tecido.
    const mapa = tela(rw, rh);
    mapa.drawImage(branco, x0 / e, y0 / e, rw / e, rh / e, 0, 0, rw, rh);
    const B = mapa.getImageData(0, 0, rw, rh).data;
    const L = new Float32Array(rw * rh);
    for (let p = 0; p < rw * rh; p++) L[p] = 0.2126 * B[p * 4] + 0.7152 * B[p * 4 + 1] + 0.0722 * B[p * 4 + 2];
    const Lb = desfocar(L, rw, rh, r);

    const saida = camada.createImageData(rw, rh);
    const o = saida.data;
    const tecido = new Float32Array(rw * rh);
    const paleta = t === "Bordado" ? arte.paleta : null;
    const listra = 3 * e * Math.SQRT2; // listras de 3 px a 45°
    for (let yy = 1; yy < rh - 1; yy++)
      for (let xx = 1; xx < rw - 1; xx++) {
        const p = yy * rw + xx;
        // 5. Recorte só pelo alfa do tecido, com borda suave.
        const m = (tecido[p] = limitar((B[p * 4 + 3] / 255 - 0.35) / 0.3, 0, 1));
        if (m === 0) continue;
        // 3. Desloca a amostra pelo gradiente (por px do quadro), bilinear pré-multiplicado.
        const gx = ((Lb[p + 1] - Lb[p - 1]) / 2) * e, gy = ((Lb[p + rw] - Lb[p - rw]) / 2) * e;
        const sx = xx + K * limitar(gx / G_REF, -1, 1), sy = yy + K * limitar(gy / G_REF, -1, 1);
        const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
        let cr = 0, cg = 0, cb = 0, a = 0;
        for (let k = 0; k < 4; k++) {
          const qx = ix + (k & 1), qy = iy + (k >> 1);
          if (qx < 0 || qy < 0 || qx >= rw || qy >= rh) continue;
          const q = (qy * rw + qx) * 4;
          const peso = (k & 1 ? fx : 1 - fx) * (k >> 1 ? fy : 1 - fy) * A[q + 3];
          cr += A[q] * peso;
          cg += A[q + 1] * peso;
          cb += A[q + 2] * peso;
          a += peso;
        }
        if (a < 1) continue;
        cr /= a;
        cg /= a;
        cb /= a;
        if (t === "Silk") a = a > 127 ? 255 : 0; // alfa duro
        if (a === 0) continue;
        // Sombra das dobras + trama do tecido por dentro da tinta.
        const lb = Lb[p] / lref;
        let f = limitar(lb, 0.55, estilo.clareia ? 1.08 : 1) * (1 + (estilo.trama * (L[p] - Lb[p])) / lref);
        if (paleta) {
          // Bordado: pontos em listras diagonais, sentido alternado por cor.
          let j = 0, md = Infinity;
          for (let c = 0; c < paleta.length; c++) {
            const v = (cr - paleta[c][0]) ** 2 + (cg - paleta[c][1]) ** 2 + (cb - paleta[c][2]) ** 2;
            if (v < md) [j, md] = [c, v];
          }
          const u = (j % 2 ? xx + x0 + yy + y0 : xx + x0 - yy - y0 + 100000) / listra;
          f *= Math.floor(u) % 2 ? 1.12 : 0.88;
        }
        const luz = 255 * estilo.brilho * Math.max(0, lb - 1); // brilho de película (DTF)
        o[p * 4] = cr * f + luz;
        o[p * 4 + 1] = cg * f + luz;
        o[p * 4 + 2] = cb * f + luz;
        o[p * 4 + 3] = a * estilo.opacidade * m;
      }
    if (paleta) relevo(o, tecido, rw, rh, Math.max(1, Math.round(e)));
    camada.setTransform(1, 0, 0, 1, 0, 0);
    camada.putImageData(saida, 0, 0);
    ctx.drawImage(camada.canvas, x0, y0);
  }
}

/** Bordado: luz em cima/esquerda, sombra embaixo/direita (25% de preto) e contorno mais escuro. */
function relevo(o: Uint8ClampedArray, tecido: Float32Array, w: number, h: number, d: number) {
  const alfa = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) alfa[p] = o[p * 4 + 3];
  const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && alfa[y * w + x] > 127;
  const mudar = (p: number, f: number) => {
    o[p * 4] *= f;
    o[p * 4 + 1] *= f;
    o[p * 4 + 2] *= f;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (dentro(x, y)) {
        if (!dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1)) mudar(p, 0.82);
        else if (!dentro(x - d, y - d)) mudar(p, 1.18);
        else if (!dentro(x + d, y + d)) mudar(p, 0.9);
      } else if (dentro(x - d, y - d) && alfa[p] < 64 && tecido[p] > 0) {
        o[p * 4] = o[p * 4 + 1] = o[p * 4 + 2] = 0;
        o[p * 4 + 3] = 64 * tecido[p];
      }
    }
}
