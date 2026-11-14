"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";

import { CANO, CORES, usePoucoMovimento, type Cor, type Modelo } from "@/components/arara";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { areaDe, comporEstampa, type Area, type Lado } from "@/lib/estampa";
import { cn } from "@/lib/utils";

// Movimento (referencia/previa-cor/README.md, opção A; README-estampa.md, 1). θ: −1 = de lado
// para a esquerda, 0 = de frente, 1 = de lado para a direita.
const SEGUE = 0.15; // lerp por quadro enquanto o mouse/dedo arrasta
const MOLA_K = 39.5; // mola de ~1 Hz…
const MOLA_C = 6.7; // …amortecida: assenta em ~1,2 s
const IMPULSO = 0.35; // balanço ao trocar a cor
const BALANCO = 0.06; // balanço contínuo…
const PERIODO_MS = 5000; // …a cada 5 s
const PASSO_TECLA = 0.1; // setas ← →
const ZOOM_MAX = 3;

const limitar = (v: number) => Math.max(-1, Math.min(1, v));
const numero = (i: number) => String(i + 1).padStart(3, "0");

type Banco = { pasta: string; n: number; quadros: HTMLImageElement[] };

/** O que a prévia mostra de um lado no passo Estampa. */
export type LadoEstampa = {
  areas: string[]; // chaves de manifest.pecas[].areasEstampa com arte (ou o marcador)
  foco: string; // área onde o zoom aproxima
  arte?: string; // URL local (blob:) da arte; sem ela, marcador "Sua arte"
};
export type EstampaPrevia = { lado: Lado; onLado: (lado: Lado) => void } & Record<Lado, LadoEstampa>;

/** Cor da marca para o marcador: azul-marinho em tecido claro, branco em tecido escuro. */
function tintaPara(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const raiz = getComputedStyle(document.documentElement);
  return raiz.getPropertyValue(0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "--primary" : "--primary-foreground");
}

function carregar(src: string) {
  const img = new window.Image(); // "Image" aqui é o do next/image
  img.src = src;
  return img.decode().then(() => img);
}

/**
 * Prévia da peça: a camisa da cor escolhida pendurada no cano, com o cartão embaixo
 * (nome da peça e da cor + vitrine das cores). Gira só arrastando (mouse ou dedo) e
 * para onde soltar. Com `estampa` (passo Estampa) vira a foto parada do lado escolhido
 * com a arte nas dobras, Frente/Costas e zoom; o cartão some.
 * O cano usa mix-blend-multiply: o palco tem o mesmo fundo do painel para o multiply
 * continuar funcionando quando ele ganha transform.
 */
export function PreviaPeca({
  modelo,
  cor,
  onCor,
  estampa,
}: {
  modelo: Modelo;
  cor: Cor;
  onCor: (cor: Cor) => void;
  estampa?: EstampaPrevia;
}) {
  const painelRef = useRef<HTMLDivElement>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const estampaRef = useRef<HTMLCanvasElement>(null);
  const sombraRef = useRef<HTMLDivElement>(null);
  const banco = useRef<Banco | null>(null);
  const mov = useRef({ theta: 0, vel: 0, base: 0, alvo: null as number | null, arrasto: null as { x: number; theta: number } | null, sinal: 1 });
  const pan = useRef({ x: 0, y: 0, limite: { x: 0, y: 0 }, arrasto: null as { x: number; y: number } | null });
  const aplicar = useRef(() => {});
  const semGiro = usePoucoMovimento();

  const comEstampa = estampa !== undefined;
  const [zoom, setZoom] = useState(1);
  // Ao entrar ou sair do passo Estampa, o zoom volta para 1×.
  const [estavaComEstampa, setEstavaComEstampa] = useState(comEstampa);
  if (estavaComEstampa !== comEstampa) {
    setEstavaComEstampa(comEstampa);
    setZoom(1);
  }
  const z = comEstampa ? zoom : 1;
  const lado = estampa?.lado ?? "frente";
  const ladoAtual = estampa?.[lado];
  const foco = ladoAtual?.foco ?? "";
  const areas = ladoAtual?.areas.join(",") ?? "";
  const arte = ladoAtual?.arte;

  const pasta = `${modelo.coresPasta}${cor.pasta}/`;
  const n = modelo.coresQuadros;

  // Quadro = (N−1)·(1−|θ|); θ < 0 desenha espelhado. Os dois quadros vizinhos se misturam
  // (o de cima com alfa proporcional) para não pular.
  const desenhar = useCallback(() => {
    const b = banco.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!b || !ctx) return;
    const t = mov.current.theta;
    const f = (b.n - 1) * (1 - Math.abs(t));
    const i0 = Math.floor(f);
    const a = f - i0;
    const base = b.quadros[i0] ?? b.quadros[b.n - 1];
    const cima = b.quadros[Math.min(i0 + 1, b.n - 1)];
    if (!base) return;
    const { width: w, height: h } = ctx.canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (t < 0) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(base, 0, 0, w, h);
    if (a > 0.01 && cima) {
      ctx.globalAlpha = a;
      ctx.drawImage(cima, 0, 0, w, h);
    }
    ctx.restore();
    const d = ctx.canvas.dataset;
    d.theta = t.toFixed(3);
    d.quadro = String(Math.round(f) + 1);
    d.espelho = t < 0 ? "1" : "0";
    d.cor = b.pasta;
    // A sombra estreita quando a peça fica de lado.
    if (sombraRef.current) sombraRef.current.style.transform = `scaleX(${1 - 0.4 * Math.abs(t)})`;
  }, []);

  // Carrega os quadros da peça/cor. O quadro atual fica na tela até todos decodificarem;
  // aí troca e entra balançando a partir de onde estava. Com movimento reduzido só o de frente.
  useEffect(() => {
    let vivo = true;
    const quadros: HTMLImageElement[] = [];
    const indices = semGiro ? [n - 1] : Array.from({ length: n }, (_, i) => i);
    let faltam = indices.length;
    const pronto = () => {
      if (!vivo || --faltam > 0) return;
      const primeiro = banco.current === null;
      banco.current = { pasta, n, quadros };
      if (!primeiro && !semGiro) {
        const s = mov.current;
        s.sinal *= -1;
        s.theta = limitar(s.base + IMPULSO * s.sinal);
        s.vel = 0;
      }
      desenhar();
    };
    for (const i of indices) {
      const img = new window.Image();
      img.fetchPriority = i === n - 1 ? "high" : "low";
      img.src = `${pasta}${numero(i)}.webp`;
      img.decode().then(() => {
        quadros[i] = img;
        pronto();
      }, pronto);
    }
    return () => {
      vivo = false;
    };
  }, [pasta, n, semGiro, desenhar]);

  // Laço do movimento: segue o arrasto ou fica com mola no θ onde a peça parou (+ balanço leve).
  // Pausa fora da tela e com a aba oculta. Movimento reduzido e passo Estampa: parada de frente.
  useEffect(() => {
    const s = mov.current;
    if (semGiro || comEstampa) {
      Object.assign(s, { theta: 0, vel: 0, base: 0, alvo: null, arrasto: null });
      desenhar();
      return;
    }
    let raf = 0;
    let antes = 0;
    let naTela = true;
    const passo = (agora: number) => {
      const dt = antes ? Math.min(0.05, (agora - antes) / 1000) : 1 / 60;
      antes = agora;
      if (s.alvo !== null) {
        s.theta += (s.alvo - s.theta) * SEGUE;
        s.vel = 0;
      } else {
        const repouso = s.base + BALANCO * Math.sin((2 * Math.PI * agora) / PERIODO_MS);
        s.vel += (-MOLA_K * (s.theta - repouso) - MOLA_C * s.vel) * dt;
        s.theta += s.vel * dt;
      }
      s.theta = limitar(s.theta);
      desenhar();
      raf = requestAnimationFrame(passo);
    };
    const ligar = () => {
      if (raf || !naTela || document.hidden) return;
      antes = 0;
      raf = requestAnimationFrame(passo);
    };
    const desligar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      naTela = e.isIntersecting;
      if (naTela) ligar();
      else desligar();
    });
    if (painelRef.current) io.observe(painelRef.current);
    const aba = () => (document.hidden ? desligar() : ligar());
    document.addEventListener("visibilitychange", aba);
    ligar();
    return () => {
      desligar();
      io.disconnect();
      document.removeEventListener("visibilitychange", aba);
    };
  }, [semGiro, comEstampa, desenhar]);

  // Passo Estampa: foto parada do lado escolhido com a arte (ou o marcador) nas dobras.
  // Só recalcula quando muda arte, áreas, cor ou lado; a foto anterior fica até a nova sair.
  useEffect(() => {
    const ctx = estampaRef.current?.getContext("2d");
    const giro = canvasRef.current;
    if (!ctx || !giro) return;
    if (!comEstampa) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      delete ctx.canvas.dataset.pronto;
      giro.style.visibility = "";
      return;
    }
    let vivo = true;
    const chave = `${cor.pasta}/${lado}/${areas}/${arte ? "arte" : "marcador"}`;
    Promise.all([
      carregar(`${modelo.coresPasta}${cor.pasta}/${lado}.webp`),
      carregar(`${modelo.coresPasta}branco/${lado}.webp`),
      arte ? carregar(arte).catch(() => null) : null,
    ]).then(([peca, branco, imagemArte]) => {
      if (!vivo) return;
      const camadas = areas
        .split(",")
        .map((k) => areaDe(modelo, k))
        .filter((a): a is Area => a !== undefined)
        .map((area) => ({ area, arte: imagemArte }));
      comporEstampa(ctx, peca, branco, camadas, tintaPara(cor.hex), getComputedStyle(document.body).fontFamily);
      giro.style.visibility = "hidden";
      ctx.canvas.dataset.pronto = chave;
    }, () => {});
    return () => {
      vivo = false;
    };
  }, [comEstampa, modelo, cor, lado, areas, arte]);

  // Enquadramento do palco. No passo Estampa a peça cresce para ocupar o lugar do cartão;
  // o zoom aproxima no centro da área em foco, levando-a para o meio do painel, e o arrasto move.
  useEffect(() => {
    pan.current.x = pan.current.y = 0;
  }, [foco, lado, comEstampa]);
  useEffect(() => {
    const painel = painelRef.current, palco = palcoRef.current, tela = canvasRef.current;
    if (!painel || !palco || !tela) return;
    if (z === 1) pan.current.x = pan.current.y = 0;
    aplicar.current = () => {
      if (!comEstampa) {
        palco.style.transform = "";
        return;
      }
      const W = painel.clientWidth, H = painel.clientHeight;
      const cw = tela.offsetWidth, ch = tela.offsetHeight, cl = (W - cw) / 2, ct = tela.offsetTop;
      // Espaço livre: de 8 px da borda esquerda até 8 px antes da barra de zoom (16 + 44 px).
      // As peças ocupam até 90% da largura do quadro e terminam a 93,7% da altura.
      const cx = (W - 60) / 2;
      const b = Math.min((0.95 * H) / (ct + 0.937 * ch), (W - 76) / 2 / (0.45 * cw));
      const a = areaDe(modelo, foco) ?? [0.3, 0.27, 0.4, 0.4];
      const R = { x: cl + (a[0] + a[2] / 2) * cw, y: ct + (a[1] + a[3] / 2) * ch };
      const R1 = { x: cx + (R.x - W / 2) * b, y: R.y * b };
      const S = b * z;
      const k = Math.min(1, z - 1);
      const p = pan.current;
      p.limite = { x: (cw * S) / 2, y: (ch * S) / 2 };
      const x = R1.x + (cx - R1.x) * k + p.x - S * R.x;
      const y = R1.y + (H / 2 - R1.y) * k + p.y - S * R.y;
      palco.style.transform = `translate(${x}px, ${y}px) scale(${S})`;
    };
    aplicar.current();
    const ro = new ResizeObserver(() => aplicar.current());
    ro.observe(painel);
    return () => ro.disconnect();
  }, [comEstampa, z, foco, modelo]);

  // Arrastar (botão apertado ou dedo) gira; com zoom no passo Estampa, move a imagem.
  // Os controles do painel (cartão, Frente/Costas, zoom) ficam fora disso.
  function apertar(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as Element).closest("[data-controle]")) return;
    if (comEstampa) {
      if (z === 1) return;
      pan.current.arrasto = { x: e.clientX - pan.current.x, y: e.clientY - pan.current.y };
    } else {
      if (semGiro) return;
      mov.current.arrasto = { x: e.clientX, theta: mov.current.theta };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.arrastando = "";
  }
  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const p = pan.current;
    if (p.arrasto) {
      const lim = (v: number, l: number) => Math.max(-l, Math.min(l, v));
      p.x = lim(e.clientX - p.arrasto.x, p.limite.x);
      p.y = lim(e.clientY - p.arrasto.y, p.limite.y);
      aplicar.current();
      return;
    }
    const s = mov.current;
    if (s.arrasto) s.alvo = limitar(s.arrasto.theta + (e.clientX - s.arrasto.x) / (e.currentTarget.clientWidth / 2));
  }
  // Soltou: a peça para onde está (o balanço leve continua em volta desse ponto).
  function soltar(e: React.PointerEvent<HTMLDivElement>) {
    const s = mov.current;
    if (s.arrasto) {
      s.base = s.theta;
      s.vel = 0;
    }
    s.arrasto = null;
    s.alvo = null;
    pan.current.arrasto = null;
    delete e.currentTarget.dataset.arrastando;
  }
  function teclar(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || comEstampa || semGiro) return;
    const passo = e.key === "ArrowLeft" ? -PASSO_TECLA : e.key === "ArrowRight" ? PASSO_TECLA : 0;
    if (!passo) return;
    e.preventDefault();
    mov.current.base = limitar(mov.current.base + passo);
  }

  const gira = !comEstampa && !semGiro;
  const limpo = z > 1; // com zoom: sem cano, sem sombra e sem o selo "Prévia"
  const ultimo = numero(n - 1);

  return (
    <div
      ref={painelRef}
      role="group"
      aria-label={gira ? "Prévia da peça. Use as setas para girar" : "Prévia da peça"}
      tabIndex={gira ? 0 : undefined}
      onKeyDown={teclar}
      onPointerDown={apertar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      className={cn(
        "group/painel relative mx-auto aspect-[358/530] w-full overflow-hidden rounded-[22px] border border-primary/10 bg-muted outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 min-[601px]:aspect-[662/640] min-[601px]:max-w-[662px] min-[601px]:rounded-[26px] lg:max-w-none",
        comEstampa && limpo ? "cursor-grab touch-none data-arrastando:cursor-grabbing" : "touch-pan-y",
        gira && "cursor-grab data-arrastando:cursor-grabbing"
      )}
    >
      <div
        ref={palcoRef}
        className="absolute inset-0 origin-top-left bg-muted group-data-arrastando/painel:transition-none motion-safe:transition-transform motion-safe:duration-300"
      >
        {/* Cano a 10% do topo; a curva do gancho (42/640 do quadro) cai no eixo dele. */}
        <Image
          src={CANO.arquivo}
          alt=""
          width={CANO.largura}
          height={CANO.altura}
          sizes="(min-width: 601px) 380px, 55vw"
          className={cn(
            "absolute top-[10%] left-[22.5%] h-auto w-[55%] mix-blend-multiply transition-opacity min-[601px]:left-[21.5%] min-[601px]:w-[57%]",
            limpo && "opacity-0"
          )}
        />
        <div
          ref={sombraRef}
          aria-hidden
          className={cn(
            "absolute top-[57%] left-[33%] h-[3%] w-[34%] rounded-[50%] bg-primary/14 blur-md transition-opacity min-[601px]:top-[62%] min-[601px]:left-[35%] min-[601px]:w-[30%]",
            limpo && "opacity-0"
          )}
        />
        <canvas
          ref={canvasRef}
          width={modelo.largura}
          height={modelo.altura}
          role="img"
          aria-label={`${modelo.nome} na cor ${cor.nome}`}
          aria-hidden={comEstampa || undefined}
          className="absolute top-[7.77%] left-1/2 h-[54%] w-auto -translate-x-1/2 min-[601px]:top-[8.21%] min-[601px]:h-[59%]"
        />
        <canvas
          ref={estampaRef}
          width={900}
          height={1200}
          role="img"
          aria-label={`${modelo.nome} na cor ${cor.nome}, ${lado === "frente" ? "frente" : "costas"}${areas ? (arte ? ", com a sua arte" : ", com o lugar da arte marcado") : ""}`}
          aria-hidden={!comEstampa || undefined}
          className="absolute top-[7.77%] left-1/2 h-[54%] w-auto -translate-x-1/2 min-[601px]:top-[8.21%] min-[601px]:h-[59%]"
        />
      </div>

      <Badge variant="outline" className={cn("absolute top-4 right-4 bg-background/60 backdrop-blur-sm transition-opacity", limpo && "opacity-0")}>
        Prévia
      </Badge>

      {estampa && (
        <>
          <ToggleGroup
            data-controle
            aria-label="Lado da prévia"
            value={[estampa.lado]}
            onValueChange={(v: string[]) => v[0] && estampa.onLado(v[0] as Lado)}
            spacing={0}
            variant="outline"
            className="absolute top-4 left-4 rounded-full bg-background/85 backdrop-blur-sm"
          >
            {(["frente", "costas"] as const).map((l) => (
              <ToggleGroupItem
                key={l}
                value={l}
                className="h-11 px-4 text-[13.5px] first:rounded-l-full! last:rounded-r-full! aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {l === "frente" ? "Frente" : "Costas"}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Zoom: barra vertical à direita, centralizada na altura (+ em cima, − embaixo). */}
          <div
            data-controle
            className="absolute top-1/2 right-4 flex h-1/2 w-11 -translate-y-1/2 flex-col items-center rounded-full border border-primary/10 bg-background/85 backdrop-blur-sm"
          >
            <Button variant="ghost" size="icon-lg" aria-label="Aproximar" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((v) => Math.min(ZOOM_MAX, Math.round(v * 2 + 1) / 2))} className="size-11 shrink-0 rounded-full">
              <PlusIcon />
            </Button>
            <Slider
              orientation="vertical"
              aria-label="Zoom"
              min={1}
              max={ZOOM_MAX}
              step={0.1}
              value={[zoom]}
              onValueChange={(v) => setZoom(Array.isArray(v) ? v[0] : v)}
              className="min-h-0 flex-1 py-1 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-track]]:bg-primary/12 [&>div]:min-h-0"
            />
            <Button variant="ghost" size="icon-lg" aria-label="Afastar" disabled={zoom <= 1} onClick={() => setZoom((v) => Math.max(1, Math.round(v * 2 - 1) / 2))} className="size-11 shrink-0 rounded-full">
              <MinusIcon />
            </Button>
          </div>
        </>
      )}

      {!estampa && (
        <div data-controle className="absolute inset-x-3 bottom-3 cursor-auto rounded-2xl bg-background p-3 min-[601px]:inset-x-6 min-[601px]:bottom-6 min-[601px]:rounded-[18px] min-[601px]:p-4">
          <p className="flex items-baseline gap-2">
            <span className="text-base font-semibold min-[601px]:text-lg">{modelo.nome}</span>
            <span className="text-[13px] text-muted-foreground min-[601px]:text-sm">{cor.nome}</span>
          </p>
          <div role="group" aria-label="Cor do tecido" className="mt-2.5 grid grid-cols-5 gap-1 min-[601px]:mt-3 min-[601px]:gap-2">
            {CORES.map((c) => {
              const ativa = c.pasta === cor.pasta;
              return (
                <button
                  key={c.pasta}
                  type="button"
                  aria-pressed={ativa}
                  aria-label={c.nome}
                  onClick={() => onCor(c)}
                  className="flex min-h-11 flex-col items-center justify-end gap-1 rounded-xl pb-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Image
                    src={`${modelo.coresPasta}${c.pasta}/${ultimo}.webp`}
                    alt=""
                    width={modelo.largura}
                    height={modelo.altura}
                    sizes="(min-width: 1024px) 80px, 64px"
                    className={cn(
                      "w-auto motion-safe:transition-[height,width] motion-safe:duration-300",
                      // PC: miniaturas com 64 px de largura ou mais.
                      ativa ? "h-12 min-[601px]:h-16 lg:h-auto lg:w-20" : "h-10 min-[601px]:h-12 lg:h-auto lg:w-16"
                    )}
                  />
                  <span className={cn("text-[11px] leading-none whitespace-nowrap lg:text-xs", ativa ? "font-semibold" : "text-muted-foreground")}>
                    <span className="min-[601px]:hidden">{c.curto ?? c.nome}</span>
                    <span className="hidden min-[601px]:inline">{c.nome}</span>
                  </span>
                  <span aria-hidden className={cn("h-[3px] w-[22px] rounded-full", ativa ? "bg-accent" : "bg-transparent")} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
