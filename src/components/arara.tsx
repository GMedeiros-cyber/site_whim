"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import manifest from "../../public/arara/manifest.json";
import { depoisDaTransicao } from "@/components/transicao-pinta";
import { cn } from "@/lib/utils";

/** Modelos da arara, na ordem do manifesto (public/arara/manifest.json). */
export const MODELOS = manifest.pecas;
export type Modelo = (typeof MODELOS)[number];
/** Cores do tecido com quadros já pintados; o passo "Cor" usa esta mesma lista. */
export const CORES = manifest.cores;
export type Cor = (typeof CORES)[number];
export const CANO = manifest.cano;
/** Medidas de referência de cada posição, [largura, altura] em cm (provisórias; a Whim confirma). */
export const MEDIDAS: Record<string, number[]> = manifest.medidasReferencia;

/** Duração do giro de lado → de frente (a volta faz o mesmo caminho). */
const DURACAO_MS = 900;

/** Pasta da cor escolhida: casa o hex com manifest.cores (se não casar, a primeira cor). */
export function pastaDaCor(hex: string) {
  return (CORES.find((c) => c.hex.toLowerCase() === hex.toLowerCase()) ?? CORES[0]).pasta;
}

/** Cor própria de cada peça na arara (manifest.pecas[].cor casado com manifest.cores[].nome). */
const corPropria = (m: Modelo) => (CORES.find((c) => c.nome === m.cor) ?? CORES[0]).hex;

/** Todos os quadros de uma pasta de cor num arquivo só (gerado por scripts/emendar-quadros.mjs). */
export const pacoteDe = (pasta: string) => `${pasta}quadros.bin`;

// ponytail: guarda os pacotes já baixados na sessão (no máximo os 25, ~7 MB); a arara e a vitrine
// usam o mesmo download. Limitar por quantidade se a memória pesar no celular.
const pacotes = new Map<string, Promise<Blob[]>>();

/**
 * Resolve no `load` da página (na hora, se já passou, como vindo da home). Os pacotes somam
 * 1,4 MB: começando antes do primeiro desenho (no <head> ou ao montar), o Lighthouse mobile
 * conta esse download no LCP e estimou 11 s. A arara já aparece pelos quadros parados do HTML.
 */
const carregada = () =>
  new Promise<void>((pronto) => (document.readyState === "complete" ? pronto() : addEventListener("load", () => pronto(), { once: true })));

/** Baixa o pacote (uma vez, depois do load) e separa os .webp emendados ("RIFF" + tamanho de 4 bytes + dados). */
export function lerPacote(pasta: string) {
  let p = pacotes.get(pasta);
  if (!p) {
    p = carregada().then(async () => {
      const r = await fetch(pacoteDe(pasta));
      if (!r.ok) throw new Error(`pacote ${r.status}`);
      const dados = await r.arrayBuffer();
      const v = new DataView(dados);
      const quadros: Blob[] = [];
      for (let o = 0; o + 8 <= dados.byteLength; ) {
        const fim = o + 8 + v.getUint32(o + 4, true);
        quadros.push(new Blob([dados.slice(o, fim)], { type: "image/webp" }));
        o = fim;
      }
      return quadros;
    });
    pacotes.set(pasta, p);
    p.catch(() => pacotes.delete(pasta)); // falhou: tenta de novo na próxima vez
  }
  return p;
}

export function usePoucoMovimento() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

type Banco = { quadros: (ImageBitmap | undefined)[]; parar: AbortController };

/**
 * Uma peça pendurada: desenha no canvas o quadro que corresponde ao progresso
 * do giro (0 = de lado, quadro 001; 1 = de frente, último quadro), já pintado
 * na cor escolhida e com fundo transparente ({coresPasta}{cor}/NNN.webp).
 * Os quadros chegam como ImageBitmap já decodificado no tamanho do canvas (o tamanho na tela
 * × DPR), e o desenho só acontece no requestAnimationFrame: nada decodifica nem mede no giro.
 * Até o canvas desenhar, aparece o quadro parado (<img> do HTML do servidor), no mesmo lugar.
 */
function PecaGirando({
  modelo,
  cor,
  deFrente,
  parado,
  semGiro,
}: {
  modelo: Modelo;
  cor: string;
  deFrente: boolean; // escolhida ou com o mouse/foco em cima
  parado: "lado" | "frente"; // como fica sem o mouse (o quadro do HTML)
  semGiro: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Quadros por pasta de cor: a atual e, durante a troca, a que está saindo.
  const bancos = useRef(new Map<string, Banco>());
  const progresso = useRef(0);
  const desenhado = useRef("");
  const pedido = useRef(0);
  const [tamanho, setTamanho] = useState<[number, number] | null>(null);
  const pasta = `${modelo.coresPasta}${pastaDaCor(cor)}/`;
  const pastaRef = useRef(pasta);
  const total = modelo.coresQuadros;

  const desenhar = useCallback(() => {
    pedido.current = 0;
    const atual = pastaRef.current;
    const i = Math.round(progresso.current * (total - 1));
    const quadro = bancos.current.get(atual)?.quadros[i];
    const ctx = canvasRef.current?.getContext("2d");
    // Só desenha quadro já decodificado; até lá fica o que está na tela (inclusive o da cor anterior).
    if (!quadro || !ctx || desenhado.current === `${atual}#${i}`) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(quadro, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.canvas.dataset.quadro = String(i + 1);
    ctx.canvas.dataset.cor = atual;
    desenhado.current = `${atual}#${i}`;
    // A cor anterior saiu da tela: libera os quadros dela.
    for (const [k, b] of bancos.current) {
      if (k === atual) continue;
      liberar(b);
      bancos.current.delete(k);
    }
  }, [total]);
  // Quadro que acabou de decodificar: desenha no próximo frame (uma vez só, mesmo chegando vários).
  const agendar = useCallback(() => {
    if (!pedido.current) pedido.current = requestAnimationFrame(desenhar);
  }, [desenhar]);

  // Tamanho do canvas = tamanho na tela × DPR (até 2), medido uma vez (e se a tela mudar de largura).
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ro = new ResizeObserver(([e]) => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = Math.round(e.contentRect.width * dpr);
      if (!w) return;
      if (canvas.width !== w) {
        canvas.width = w;
        canvas.height = Math.round((w * modelo.altura) / modelo.largura);
        desenhado.current = "";
        agendar();
      }
      setTamanho((t) => t ?? [canvas.width, canvas.height]);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [modelo, agendar]);

  // Os quadros da cor atual (e a cada troca de cor) vêm num pacote só, baixado no load da página
  // (vindo da home, na hora, por baixo da tinta). Só a decodificação (fora da thread principal)
  // espera a transição de tinta acabar, para ela não engasgar (pedido do agente 2, 17/11):
  // primeiro o quadro parado de lado e o de frente, depois o resto.
  useEffect(() => {
    pastaRef.current = pasta;
    if (!tamanho) return;
    if (bancos.current.has(pasta)) {
      agendar();
      return;
    }
    const banco: Banco = { quadros: [], parar: new AbortController() };
    bancos.current.set(pasta, banco);
    const [resizeWidth, resizeHeight] = tamanho;
    const decodificar = (b: Blob, i: number) =>
      createImageBitmap(b, { resizeWidth, resizeHeight, resizeQuality: "high" }).then((bitmap) => {
        if (banco.parar.signal.aborted) return bitmap.close();
        banco.quadros[i] = bitmap;
        agendar();
      });
    lerPacote(pasta)
      .then((quadros) => {
        if (banco.parar.signal.aborted) return;
        const cancelar = depoisDaTransicao(() => {
          const pontas = [0, total - 1];
          Promise.allSettled(pontas.map((i) => decodificar(quadros[i], i))).then(() => {
            if (banco.parar.signal.aborted) return;
            quadros.forEach((q, i) => !pontas.includes(i) && decodificar(q, i).catch(() => {}));
          });
        });
        banco.parar.signal.addEventListener("abort", cancelar);
      })
      .catch(() => {});
  }, [pasta, total, tamanho, agendar]);

  useEffect(() => {
    const mapa = bancos.current;
    return () => {
      cancelAnimationFrame(pedido.current);
      mapa.forEach(liberar);
      mapa.clear();
    };
  }, []);

  // Gira até o alvo, quadro a quadro; com movimento reduzido, pula direto.
  useEffect(() => {
    const alvo = deFrente ? 1 : 0;
    if (semGiro) {
      progresso.current = alvo;
      agendar();
      return;
    }
    let raf = 0;
    let antes = performance.now();
    const passo = (agora: number) => {
      const delta = (agora - antes) / DURACAO_MS;
      antes = agora;
      const p = progresso.current;
      progresso.current = alvo > p ? Math.min(alvo, p + delta) : Math.max(alvo, p - delta);
      desenhar();
      if (progresso.current !== alvo) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [deFrente, semGiro, desenhar, agendar]);

  return (
    // A curva do gancho fica a 42/640 da altura do quadro (manifest.gancho): sobe a peça
    // para ela cair no eixo do cano (metade do cano + 42/640 × 4/3 da largura).
    <span className="pointer-events-none relative -mt-[calc(var(--cano)/2+var(--w)*0.0875)] aspect-[3/4] w-(--w) max-w-none shrink-0">
      <canvas ref={canvasRef} aria-hidden className="peer absolute inset-0 size-full" />
      {/* Quadro parado, no HTML: a peça aparece sem esperar o JS; some quando o canvas desenha.
          Prioridade alta nas cinco: todas aparecem juntas na primeira tela (~45 KB no total). */}
      <Image
        src={`${pasta}${String(parado === "frente" ? total : 1).padStart(3, "0")}.webp`}
        alt=""
        width={modelo.largura}
        height={modelo.altura}
        unoptimized
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full peer-data-quadro:invisible"
      />
    </span>
  );
}

function liberar(b: Banco) {
  b.parar.abort();
  b.quadros.forEach((q) => q?.close());
}

/**
 * Arara de modelos: hover (ou foco pelo teclado) gira a peça para a frente; um clique ou
 * toque já escolhe. Só a peça escolhida usa `cor` (hex da vitrine); as outras ficam na
 * cor própria do manifesto.
 */
export function Arara({ selecionada, cor, onEscolher }: { selecionada: string; cor: string; onEscolher: (nome: string) => void }) {
  const [foco, setFoco] = useState<number | null>(null);
  const semGiro = usePoucoMovimento();

  const corDe = (m: Modelo) => (m.nome === selecionada ? cor : corPropria(m));

  return (
    <>
      {/* --w: largura do quadro; --cano: altura do cano (proporção da prévia em referencia/arara). */}
      <div className="[--cano:calc(var(--w)*0.1067)] [--w:170px] min-[601px]:[--w:230px] min-[112.5rem]:[--w:280px]">
        <div className="-mx-5 snap-x snap-proximity overflow-x-auto px-5 pb-2 min-[601px]:mx-0 min-[601px]:px-0">
          {/* PC: o cano vai das peças até ~0,6 peça de cada lado (antes ia de ponta a ponta da página
              e ficava vazio dos lados a 1920). A largura conta duas peças abertas (a escolhida e a
              do mouse), para o cano não mudar de tamanho no hover. */}
          <div
            className="mx-auto w-max min-w-full min-[601px]:w-(--arara) min-[601px]:max-w-full min-[601px]:min-w-0"
            style={{ "--arara": `calc(var(--w) * ${(0.88 * 2 + 0.3 * (MODELOS.length - 2) + 1.2).toFixed(2)})` } as React.CSSProperties}
          >
            {/* Cano cromado esticado na largura da arara; o fundo branco some com multiply,
                por isso nenhum ancestral dele pode criar stacking context. É fundo CSS, não <img>,
                porque o esticão é de propósito (o Lighthouse reprova <img> fora da proporção). */}
            <div
              aria-hidden
              className="h-(--cano) w-full bg-size-[100%_100%] mix-blend-multiply"
              style={{ backgroundImage: `url(${CANO.arquivo})` }}
            />
            <ul aria-label="Arara de modelos" className="flex justify-center px-4">
              {MODELOS.map((m, i) => (
                // Cada peça na sua camada: a largura que anima não repinta as vizinhas.
                <li key={m.id} className="flex snap-center will-change-transform">
                  <button
                    type="button"
                    aria-label={m.nome}
                    aria-pressed={selecionada === m.nome}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setFoco(i)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setFoco((f) => (f === i ? null : f))}
                    // Teclado gira a peça em foco; o toque não (o próprio toque já escolhe).
                    onFocus={(e) => e.currentTarget.matches(":focus-visible") && setFoco(i)}
                    onBlur={() => setFoco((f) => (f === i ? null : f))}
                    onClick={() => onEscolher(m.nome)}
                    className={cn(
                      "relative flex min-h-11 justify-center rounded-xl ease-out motion-safe:transition-[width] motion-safe:duration-700",
                      foco === i || selecionada === m.nome ? "w-[calc(var(--w)*0.88)]" : "w-[calc(var(--w)*0.3)]"
                    )}
                  >
                    <PecaGirando
                      modelo={m}
                      cor={corDe(m)}
                      deFrente={foco === i || selecionada === m.nome}
                      parado={selecionada === m.nome ? "frente" : "lado"}
                      semGiro={semGiro}
                    />
                    {selecionada === m.nome && (
                      <span aria-hidden className="absolute bottom-0 left-1/2 -ml-3 h-1 w-6 rounded-full bg-accent" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p aria-hidden className="mt-3 min-h-6 text-center text-[15px] font-semibold">
          {foco === null ? (
            <span className="font-normal text-muted-foreground">
              <span className="pointer-coarse:hidden">Clique numa peça</span>
              <span className="hidden pointer-coarse:inline">Toque numa peça</span>
            </span>
          ) : (
            MODELOS[foco].nome
          )}
        </p>
      </div>
    </>
  );
}
