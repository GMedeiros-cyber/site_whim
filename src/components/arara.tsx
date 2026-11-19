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

/** Peças cujas fotos giram para o lado contrário das outras (espelhadas só na arara). */
const ESPELHADAS = new Set(["camiseta"]);

/** Duração do giro de lado → de frente (a volta faz o mesmo caminho). */
const DURACAO_MS = 700; // igual à abertura da largura do botão (duration-700)

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

function useMidia(consulta: string) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => matchMedia(consulta).matches,
    () => false
  );
}

export const usePoucoMovimento = () => useMidia("(prefers-reduced-motion: reduce)");
/** O layout do celular do site (abaixo de 601 px). No servidor, falso (o HTML sai como o do PC). */
export const useCelular = () => useMidia("(max-width: 600px)");

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

  // Desenha o giro com fusão entre dois quadros vizinhos: com 26 quadros em 0,7 s, trocar
  // quadro a quadro dava "degraus" (cada quadro ficava ~2 frames de tela). A fusão deixa o
  // giro contínuo a 60 fps.
  const desenhar = useCallback(() => {
    pedido.current = 0;
    const atual = pastaRef.current;
    const f = progresso.current * (total - 1);
    const i = Math.floor(f);
    const t = Math.round((f - i) * 8) / 8; // 8 passos de fusão bastam e evitam redesenho à toa
    const quadros = bancos.current.get(atual)?.quadros;
    const a = quadros?.[i];
    const b = t > 0 ? quadros?.[i + 1] : undefined;
    const ctx = canvasRef.current?.getContext("2d");
    const chave = `${atual}#${i}#${b ? t : 0}`;
    // Só desenha quadro já decodificado; até lá fica o que está na tela (inclusive o da cor anterior).
    if (!a || !ctx || desenhado.current === chave) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(a, 0, 0, ctx.canvas.width, ctx.canvas.height);
    if (b) {
      ctx.globalAlpha = t;
      ctx.drawImage(b, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1;
    }
    ctx.canvas.dataset.quadro = String(Math.round(f) + 1);
    ctx.canvas.dataset.cor = atual;
    desenhado.current = chave;
    // A cor anterior saiu da tela: libera os quadros dela.
    for (const [k, bk] of bancos.current) {
      if (k === atual) continue;
      liberar(bk);
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
    <span
      className={cn(
        "pointer-events-none relative -mt-[calc(var(--cano)/2+var(--w)*0.0875)] aspect-[3/4] w-(--w) max-w-none shrink-0",
        // As fotos da camiseta giram para o lado contrário das outras peças: espelha para a
        // arara ficar toda virada para o mesmo lado (pedido do Gabriel, 18/11).
        ESPELHADAS.has(modelo.id) && "-scale-x-100"
      )}
    >
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
 * Arara do passo Peça no celular (pedido de 18/11 à noite): todas as peças à vista, de frente e
 * maiores, em fileiras de 3 (sem rolar de lado), cada fileira no seu cano. A escolhida fica com o
 * fundo turquesa claro e o nome em negrito. Só o quadro parado de frente (sem canvas nem giro).
 */
export function AraraGrade({ selecionada, cor, onEscolher }: { selecionada: string; cor: string; onEscolher: (nome: string) => void }) {
  const fileiras = [MODELOS.slice(0, 3), MODELOS.slice(3)];
  return (
    // --w: 1/3 da largura útil (16 px de cada lado e 8 px entre as peças); --cano como na arara.
    <div role="group" aria-label="Arara de modelos" className="[--cano:calc(var(--w)*0.1067)] [--w:calc((100vw-3rem)/3)]">
      {fileiras.map((fileira, f) => (
        <div
          key={f}
          className={cn("mx-auto", f > 0 && "mt-4")}
          style={{ width: `calc(var(--w) * ${fileira.length} + ${(fileira.length - 1) * 0.5}rem)` }}
        >
          <div aria-hidden className="h-(--cano) w-full bg-size-[100%_100%] mix-blend-multiply" style={{ backgroundImage: `url(${CANO.arquivo})` }} />
          <ul className="flex gap-2">
            {fileira.map((m) => {
              const escolhida = m.nome === selecionada;
              return (
                <li key={m.id} className="w-(--w)">
                  <button
                    type="button"
                    aria-pressed={escolhida}
                    onClick={() => onEscolher(m.nome)}
                    className={cn(
                      "flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl px-1 pb-2 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                      escolhida && "bg-accent/16"
                    )}
                  >
                    {/* O gancho cai no eixo do cano, como na arara (manifest.gancho). */}
                    <Image
                      src={`${m.coresPasta}${pastaDaCor(escolhida ? cor : corPropria(m))}/${String(m.coresQuadros).padStart(3, "0")}.webp`}
                      alt=""
                      width={m.largura}
                      height={m.altura}
                      unoptimized
                      className={cn("-mt-[calc(var(--cano)/2+var(--w)*0.0875)] aspect-[3/4] w-full max-w-none", ESPELHADAS.has(m.id) && "-scale-x-100")}
                    />
                    <span className={cn("text-[13px] leading-tight", escolhida ? "font-semibold" : "text-muted-foreground")}>{m.nome}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Arara de modelos: hover (ou foco pelo teclado) gira a peça para a frente; um clique ou
 * toque já escolhe. Só a peça escolhida usa `cor` (hex da vitrine); as outras ficam na
 * cor própria do manifesto.
 */
export function Arara({ selecionada, cor, onEscolher }: { selecionada: string; cor: string; onEscolher: (nome: string) => void }) {
  const [foco, setFoco] = useState<number | null>(null);
  const semGiro = usePoucoMovimento();
  // Quanto do trilho sobra para cada lado (só aparece no celular, quando as peças não cabem).
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [sobra, setSobra] = useState({ esq: false, dir: false });
  const medirTrilho = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const esq = el.scrollLeft > 4;
    const dir = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setSobra((s) => (s.esq === esq && s.dir === dir ? s : { esq, dir }));
  }, []);
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;
    medirTrilho();
    const ro = new ResizeObserver(medirTrilho);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [medirTrilho]);

  const corDe = (m: Modelo) => (m.nome === selecionada ? cor : corPropria(m));

  return (
    <>
      {/* --w: largura do quadro; --cano: altura do cano (proporção da prévia em referencia/arara). */}
      <div className="[--cano:calc(var(--w)*0.1067)] [--w:170px] min-[601px]:[--w:230px] min-[112.5rem]:[--w:280px]">
        {/* Celular: sem barra de rolagem; se as peças não couberem, um esmaecido discreto nas
            bordas mostra que dá para arrastar (some quando chega na ponta). */}
        <div
          ref={trilhoRef}
          onScroll={medirTrilho}
          data-mais-esq={sobra.esq || undefined}
          data-mais-dir={sobra.dir || undefined}
          className="-mx-5 snap-x snap-proximity overflow-x-auto px-5 pb-2 [scrollbar-width:none] data-mais-dir:mask-r-from-85% data-mais-esq:mask-l-from-85% min-[601px]:mx-0 min-[601px]:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {/* PC: o cano vai das peças até ~0,6 peça de cada lado (antes ia de ponta a ponta da página
              e ficava vazio dos lados a 1920). A largura conta duas peças abertas (a escolhida e a
              do mouse), para o cano não mudar de tamanho no hover. */}
          <div
            className="mx-auto w-max min-w-full min-[601px]:w-(--arara) min-[601px]:max-w-full min-[601px]:min-w-0"
            style={{ "--arara": `calc(var(--w) * ${(0.88 * 2 + 0.3 * (MODELOS.length - 2) + 1.2).toFixed(2)})` } as React.CSSProperties}
          >
            {/* Cano cromado esticado na largura da arara; o fundo branco some com multiply,
                por isso nenhum ancestral dele pode criar stacking context. É fundo CSS, não tag de
                imagem, porque o esticão é de propósito (o Lighthouse reprova imagem fora da proporção). */}
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
