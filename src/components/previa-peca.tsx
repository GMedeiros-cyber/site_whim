"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";

import { CANO, CORES, usePoucoMovimento, type Cor, type Modelo } from "@/components/arara";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Movimento (referencia/previa-cor/README.md, opção A). θ: −1 = de lado para a esquerda,
// 0 = de frente, 1 = de lado para a direita.
const SEGUE = 0.15; // lerp por quadro quando o mouse/dedo comanda
const MOLA_K = 39.5; // mola de ~1 Hz…
const MOLA_C = 6.7; // …amortecida: assenta em ~1,2 s
const IMPULSO = 0.35; // balanço ao trocar a cor
const BALANCO = 0.06; // balanço contínuo…
const PERIODO_MS = 5000; // …a cada 5 s

const limitar = (v: number) => Math.max(-1, Math.min(1, v));
const numero = (i: number) => String(i + 1).padStart(3, "0");

type Banco = { pasta: string; n: number; quadros: HTMLImageElement[] };

/**
 * Prévia da peça: a camisa da cor escolhida pendurada no cano, de frente, com o
 * cartão embaixo (nome da peça e da cor + vitrine das cores). A cor só se escolhe
 * na vitrine. O cano usa mix-blend-multiply: nenhum ancestral pode criar stacking context.
 */
export function PreviaPeca({ modelo, cor, onCor }: { modelo: Modelo; cor: Cor; onCor: (cor: Cor) => void }) {
  const painelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sombraRef = useRef<HTMLDivElement>(null);
  const banco = useRef<Banco | null>(null);
  const mov = useRef({ theta: 0, vel: 0, alvo: null as number | null, arrasto: null as { x: number; theta: number } | null, sinal: 1 });
  const semGiro = usePoucoMovimento();

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
  // aí troca e entra balançando. Com movimento reduzido só precisa do quadro de frente.
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
        s.theta = IMPULSO * s.sinal;
        s.vel = 0;
      }
      desenhar();
    };
    for (const i of indices) {
      const img = new window.Image(); // "Image" aqui é o do next/image
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

  // Laço do movimento: segue o mouse/dedo ou volta com mola para o balanço leve.
  // Pausa fora da tela e com a aba oculta; com movimento reduzido fica tudo parado em θ = 0.
  useEffect(() => {
    const s = mov.current;
    if (semGiro) {
      Object.assign(s, { theta: 0, vel: 0, alvo: null, arrasto: null });
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
        const repouso = BALANCO * Math.sin((2 * Math.PI * agora) / PERIODO_MS);
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
  }, [semGiro, desenhar]);

  // Mouse: θ segue a posição horizontal sobre o painel. Toque: arrastar na horizontal gira.
  // Sobre o cartão não gira, para a camisa ficar de frente enquanto se escolhe a cor.
  const noCartao = (e: React.PointerEvent) => (e.target as Element).closest("[data-cartao]") !== null;
  function mover(e: React.PointerEvent<HTMLDivElement>) {
    if (semGiro) return;
    const s = mov.current;
    if (e.pointerType === "mouse" && noCartao(e)) {
      s.alvo = null;
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const meio = r.width / 2;
    if (e.pointerType === "mouse") s.alvo = limitar((e.clientX - (r.left + meio)) / meio);
    else if (s.arrasto) s.alvo = limitar(s.arrasto.theta + (e.clientX - s.arrasto.x) / meio);
  }
  function soltar() {
    mov.current.arrasto = null;
    mov.current.alvo = null;
  }

  const ultimo = numero(n - 1);

  return (
    <div
      ref={painelRef}
      onPointerMove={mover}
      onPointerLeave={(e) => e.pointerType === "mouse" && soltar()}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" && !noCartao(e)) mov.current.arrasto = { x: e.clientX, theta: mov.current.theta };
      }}
      onPointerUp={(e) => e.pointerType !== "mouse" && soltar()}
      onPointerCancel={soltar}
      className="relative mx-auto aspect-[358/530] w-full touch-pan-y overflow-hidden rounded-[22px] border border-primary/10 bg-muted select-none min-[601px]:aspect-[662/640] min-[601px]:max-w-[662px] min-[601px]:rounded-[26px] lg:max-w-none"
    >
      <Badge variant="outline" className="absolute top-4 right-4 bg-background/60 backdrop-blur-sm">
        Prévia
      </Badge>

      {/* Cano a 10% do topo; a curva do gancho (42/640 do quadro) cai no eixo dele. */}
      <Image
        src={CANO.arquivo}
        alt=""
        width={CANO.largura}
        height={CANO.altura}
        sizes="(min-width: 601px) 380px, 55vw"
        className="absolute top-[10%] left-[22.5%] h-auto w-[55%] mix-blend-multiply min-[601px]:left-[21.5%] min-[601px]:w-[57%]"
      />
      <div
        ref={sombraRef}
        aria-hidden
        className="absolute top-[57%] left-[33%] h-[3%] w-[34%] rounded-[50%] bg-primary/14 blur-md min-[601px]:top-[62%] min-[601px]:left-[35%] min-[601px]:w-[30%]"
      />
      <canvas
        ref={canvasRef}
        width={modelo.largura}
        height={modelo.altura}
        role="img"
        aria-label={`${modelo.nome} na cor ${cor.nome}`}
        className="absolute top-[7.77%] left-1/2 h-[54%] w-auto -translate-x-1/2 min-[601px]:top-[8.21%] min-[601px]:h-[59%]"
      />

      <div data-cartao className="absolute inset-x-3 bottom-3 rounded-2xl bg-background p-3 min-[601px]:inset-x-6 min-[601px]:bottom-6 min-[601px]:rounded-[18px] min-[601px]:p-4">
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
                  sizes="64px"
                  className={cn(
                    "w-auto motion-safe:transition-[height] motion-safe:duration-300",
                    ativa ? "h-12 min-[601px]:h-16" : "h-10 min-[601px]:h-12"
                  )}
                />
                <span className={cn("text-[11px] leading-none whitespace-nowrap", ativa ? "font-semibold" : "text-muted-foreground")}>
                  <span className="min-[601px]:hidden">{c.curto ?? c.nome}</span>
                  <span className="hidden min-[601px]:inline">{c.nome}</span>
                </span>
                <span aria-hidden className={cn("h-[3px] w-[22px] rounded-full", ativa ? "bg-accent" : "bg-transparent")} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
