"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import manifest from "../../public/arara/manifest.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Modelos da arara, na ordem do manifesto (public/arara/manifest.json). */
export const MODELOS = manifest.pecas;
export type Modelo = (typeof MODELOS)[number];
/** Cores do tecido com quadros já pintados; o passo "Cor" usa esta mesma lista. */
export const CORES = manifest.cores;
export type Cor = (typeof CORES)[number];
export const CANO = manifest.cano;

/** Duração do giro de lado → de frente (a volta faz o mesmo caminho). */
const DURACAO_MS = 900;

/** Pasta da cor escolhida: casa o hex com manifest.cores (se não casar, a primeira cor). */
export function pastaDaCor(hex: string) {
  return (CORES.find((c) => c.hex.toLowerCase() === hex.toLowerCase()) ?? CORES[0]).pasta;
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

/**
 * Uma peça pendurada: desenha no canvas o quadro que corresponde ao progresso
 * do giro (0 = de lado, quadro 001; 1 = de frente, último quadro), já pintado
 * na cor escolhida e com fundo transparente ({coresPasta}{cor}/NNN.webp).
 */
function PecaGirando({ modelo, cor, deFrente, carregar, semGiro }: { modelo: Modelo; cor: string; deFrente: boolean; carregar: boolean; semGiro: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Quadros decodificados por pasta de cor: a atual e, durante a troca, a que está saindo.
  const bancos = useRef(new Map<string, HTMLImageElement[]>());
  const progresso = useRef(0);
  const desenhado = useRef("");
  const pasta = `${modelo.coresPasta}${pastaDaCor(cor)}/`;
  const pastaRef = useRef(pasta);
  const total = modelo.coresQuadros;

  const desenhar = useCallback(() => {
    const atual = pastaRef.current;
    const i = Math.round(progresso.current * (total - 1));
    const img = bancos.current.get(atual)?.[i];
    const ctx = canvasRef.current?.getContext("2d");
    // Só desenha quadro já decodificado; até lá fica o que está na tela (inclusive o da cor anterior).
    if (!img || !ctx || desenhado.current === `${atual}#${i}`) return;
    ctx.clearRect(0, 0, modelo.largura, modelo.altura);
    ctx.drawImage(img, 0, 0, modelo.largura, modelo.altura);
    ctx.canvas.dataset.quadro = String(i + 1);
    ctx.canvas.dataset.cor = atual;
    desenhado.current = `${atual}#${i}`;
    // A cor anterior saiu da tela: libera os quadros dela.
    for (const k of bancos.current.keys()) if (k !== atual) bancos.current.delete(k);
  }, [modelo, total]);

  // Carrega os quadros da cor atual quando a arara entra na tela e a cada troca de cor.
  // Primeiro e último quadros vão na frente da fila.
  useEffect(() => {
    pastaRef.current = pasta;
    if (!carregar) return;
    if (bancos.current.has(pasta)) {
      desenhar();
      return;
    }
    const banco: HTMLImageElement[] = [];
    bancos.current.set(pasta, banco);
    for (let i = 0; i < total; i++) {
      const img = new window.Image(); // "Image" aqui é o do next/image
      img.fetchPriority = i === 0 || i === total - 1 ? "high" : "low";
      img.src = `${pasta}${String(i + 1).padStart(3, "0")}.webp`;
      img.decode().then(
        () => {
          banco[i] = img;
          desenhar();
        },
        () => {}
      );
    }
  }, [carregar, pasta, total, desenhar]);

  // Gira até o alvo, quadro a quadro; com movimento reduzido, pula direto.
  useEffect(() => {
    const alvo = deFrente ? 1 : 0;
    if (semGiro) {
      progresso.current = alvo;
      desenhar();
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
  }, [deFrente, semGiro, desenhar]);

  return (
    <canvas
      ref={canvasRef}
      width={modelo.largura}
      height={modelo.altura}
      aria-hidden
      // A curva do gancho fica a 42/640 da altura do quadro (manifest.gancho): sobe o
      // canvas para ela cair no eixo do cano (metade do cano + 42/640 × 4/3 da largura).
      className="pointer-events-none -mt-[calc(var(--cano)/2+var(--w)*0.0875)] w-(--w) max-w-none shrink-0"
    />
  );
}

/**
 * Arara de modelos: hover (ou 1º toque) gira a peça para a frente; clique
 * (ou 2º toque) escolhe e abre a vista ampliada. `cor` (hex do passo "Cor")
 * escolhe a pasta dos quadros pintados.
 */
export function Arara({ selecionada, cor, onEscolher }: { selecionada: string; cor: string; onEscolher: (nome: string) => void }) {
  const araraRef = useRef<HTMLDivElement>(null);
  const tipoPonteiro = useRef("");
  const [carregar, setCarregar] = useState(false);
  const [foco, setFoco] = useState<number | null>(null);
  const [aberta, setAberta] = useState<number | null>(null);
  const semGiro = usePoucoMovimento();

  useEffect(() => {
    const el = araraRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCarregar(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // No toque, tocar fora da arara devolve a peça para o lado.
  useEffect(() => {
    if (foco === null) return;
    const fora = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !araraRef.current?.contains(e.target as Node)) setFoco(null);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [foco]);

  function clicar(e: React.MouseEvent, i: number) {
    // No toque não há hover: o 1º toque gira, o 2º escolhe. Teclado (detail 0) escolhe direto.
    const toque = e.detail > 0 && tipoPonteiro.current !== "mouse";
    // A peça escolhida já está de frente: o 1º toque nela já escolhe.
    if (toque && foco !== i && selecionada !== MODELOS[i].nome) {
      setFoco(i);
      return;
    }
    // Ao abrir pelo toque, zera o foco: depois de fechar, o próximo toque volta a só girar.
    if (toque) setFoco(null);
    onEscolher(MODELOS[i].nome);
    setAberta(i);
  }

  const total = MODELOS.length;
  const vista = aberta === null ? null : MODELOS[aberta];
  const andar = (passo: number) => setAberta((a) => (a === null ? a : (a + passo + total) % total));
  const doisDigitos = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      {/* --w: largura do quadro; --cano: altura do cano (proporção da prévia em referencia/arara). */}
      <div ref={araraRef} className="[--cano:calc(var(--w)*0.1067)] [--w:170px] min-[601px]:[--w:230px]">
        <div className="-mx-5 snap-x snap-proximity overflow-x-auto px-5 pb-2 min-[601px]:mx-0 min-[601px]:px-0">
          <div className="mx-auto w-max min-w-full">
            {/* Cano cromado esticado na largura da arara; o fundo branco some com multiply,
                por isso nenhum ancestral dele pode criar stacking context. */}
            <Image
              src={CANO.arquivo}
              alt=""
              width={CANO.largura}
              height={CANO.altura}
              sizes="100vw"
              className="block h-(--cano) w-full mix-blend-multiply"
            />
            <ul aria-label="Arara de modelos" className="flex justify-center px-4">
              {MODELOS.map((m, i) => (
                <li key={m.id} className="flex snap-center">
                  <button
                    type="button"
                    aria-label={m.nome}
                    aria-pressed={selecionada === m.nome}
                    onPointerDown={(e) => (tipoPonteiro.current = e.pointerType)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setFoco(i)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setFoco((f) => (f === i ? null : f))}
                    // Teclado gira a peça; no toque, quem gira é o próprio toque (ignora o foco devolvido pelo modal).
                    onFocus={(e) => tipoPonteiro.current !== "touch" && e.currentTarget.matches(":focus-visible") && setFoco(i)}
                    onBlur={() => setFoco((f) => (f === i ? null : f))}
                    onClick={(e) => clicar(e, i)}
                    className={cn(
                      "relative flex min-h-11 justify-center rounded-xl ease-out motion-safe:transition-[width] motion-safe:duration-700",
                      foco === i || selecionada === m.nome ? "w-[calc(var(--w)*0.88)]" : "w-[calc(var(--w)*0.3)]"
                    )}
                  >
                    <PecaGirando modelo={m} cor={cor} deFrente={foco === i || selecionada === m.nome} carregar={carregar} semGiro={semGiro} />
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
            <span className="font-normal text-muted-foreground">Passe o mouse ou toque numa peça</span>
          ) : (
            MODELOS[foco].nome
          )}
        </p>
      </div>

      <Dialog open={vista !== null} onOpenChange={(aberto) => !aberto && setAberta(null)}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") andar(-1);
            if (e.key === "ArrowRight") andar(1);
          }}
          className="gap-5 p-5 motion-reduce:animate-none sm:max-w-md"
        >
          {vista && aberta !== null && (
            <>
              <DialogHeader className="flex-row items-baseline justify-between">
                <DialogTitle className="text-xl font-semibold">{vista.nome}</DialogTitle>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {doisDigitos(aberta + 1)} / {doisDigitos(total)}
                </span>
              </DialogHeader>
              <div className="relative">
                <Image
                  key={`${vista.id}-${cor}`}
                  src={`${vista.coresPasta}${pastaDaCor(cor)}/frente.webp`}
                  alt={`${vista.nome} de frente, na cor escolhida`}
                  width={900}
                  height={1200}
                  sizes="(min-width: 640px) 26rem, 90vw"
                  className="mx-auto h-auto max-h-[58svh] w-auto"
                />
                <Button variant="outline" size="icon-lg" aria-label="Peça anterior" onClick={() => andar(-1)} className="absolute top-1/2 left-0 size-11 -translate-y-1/2 rounded-full bg-background/80">
                  <ChevronLeftIcon />
                </Button>
                <Button variant="outline" size="icon-lg" aria-label="Próxima peça" onClick={() => andar(1)} className="absolute top-1/2 right-0 size-11 -translate-y-1/2 rounded-full bg-background/80">
                  <ChevronRightIcon />
                </Button>
              </div>
              <DialogDescription>
                Imagem ilustrativa do modelo na cor escolhida. A estampa você escolhe nos próximos passos.
              </DialogDescription>
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <DialogClose render={<Button variant="outline" size="xl" />}>Fechar</DialogClose>
                <Button
                  size="xl"
                  onClick={() => {
                    onEscolher(vista.nome);
                    setAberta(null);
                  }}
                >
                  Escolher esta peça
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
