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
type Modelo = (typeof MODELOS)[number];

/** Duração do giro de lado → de frente (a volta faz o mesmo caminho). */
const DURACAO_MS = 900;

function usePoucoMovimento() {
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

const urlQuadro = (m: Modelo, i: number) => `${m.pasta}${String(i + 1).padStart(3, "0")}.webp`;

/**
 * Uma peça pendurada: desenha no canvas o quadro que corresponde ao progresso
 * do giro (0 = de lado, quadro 001; 1 = de frente, último quadro).
 * O fundo branco dos quadros some com mix-blend-mode: multiply, por isso
 * nenhum ancestral do canvas pode criar stacking context.
 */
function PecaGirando({ modelo, deFrente, carregar, semGiro }: { modelo: Modelo; deFrente: boolean; carregar: boolean; semGiro: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quadros = useRef<HTMLImageElement[]>([]);
  const progresso = useRef(0);
  const desenhado = useRef(-1);

  const desenhar = useCallback(() => {
    const i = Math.round(progresso.current * (modelo.quadros - 1));
    const img = quadros.current[i];
    const canvas = canvasRef.current;
    // Só desenha quadro que já terminou de carregar; senão fica o anterior.
    if (!img || !canvas || i === desenhado.current) return;
    canvas.getContext("2d")?.drawImage(img, 0, 0, modelo.largura, modelo.altura);
    canvas.dataset.quadro = String(i + 1);
    desenhado.current = i;
  }, [modelo]);

  // Pré-carrega quando a arara entra na tela: primeiro e último quadros na frente da fila.
  useEffect(() => {
    if (!carregar) return;
    let vivo = true;
    for (let i = 0; i < modelo.quadros; i++) {
      const img = new window.Image(); // "Image" aqui é o do next/image
      img.fetchPriority = i === 0 || i === modelo.quadros - 1 ? "high" : "low";
      img.src = urlQuadro(modelo, i);
      img.decode().then(
        () => {
          if (!vivo) return;
          quadros.current[i] = img;
          desenhar();
        },
        () => {}
      );
    }
    return () => {
      vivo = false;
    };
  }, [carregar, modelo, desenhar]);

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
      // A curva do gancho fica a 42/640 da altura do quadro (manifest.gancho); sobe o
      // canvas para ela cair no centro da barra de 6px: 42/640 × 4/3 da largura = 0,0875.
      className="pointer-events-none -mt-[calc(var(--w)*0.0875+3px)] w-(--w) max-w-none shrink-0 mix-blend-multiply"
    />
  );
}

/**
 * Arara de modelos: hover (ou 1º toque) gira a peça para a frente; clique
 * (ou 2º toque) escolhe e abre a vista ampliada.
 */
export function Arara({ selecionada, onEscolher }: { selecionada: string; onEscolher: (nome: string) => void }) {
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
    if (toque && foco !== i) {
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
      <div ref={araraRef} className="[--w:170px] min-[601px]:[--w:230px]">
        <div className="-mx-5 snap-x snap-proximity overflow-x-auto px-5 pb-2 min-[601px]:mx-0 min-[601px]:px-0">
          <div className="mx-auto w-max min-w-full">
            <div aria-hidden className="h-1.5 rounded-full bg-primary" />
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
                      foco === i ? "w-[calc(var(--w)*0.88)]" : "w-[calc(var(--w)*0.3)]"
                    )}
                  >
                    <PecaGirando modelo={m} deFrente={foco === i} carregar={carregar} semGiro={semGiro} />
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
                  key={vista.id}
                  src={vista.frente}
                  alt={`${vista.nome} de frente`}
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
                Imagem ilustrativa do modelo. Cor e estampa você escolhe nos próximos passos.
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
