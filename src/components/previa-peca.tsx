"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";

import { CANO, CORES, usePoucoMovimento, type Cor, type Modelo } from "@/components/arara";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { areaDe, FRASE_TECNICA, zoomPara, type Lado, type Tecnica } from "@/lib/estampa";
import { comporEstampa } from "@/lib/estampa-cliente";
import { cn } from "@/lib/utils";

// Movimento (README.md, README-estampa.md 1 e README-estampa-2.md 2). θ: −1 = de lado para a
// esquerda, 0 = de frente, 1 = de lado para a direita. θ só muda arrastando (ou pelas setas).
const SEGUE = 0.15; // lerp por quadro até o destino do arrasto
const HISTERESE = 0.04; // espelho liga abaixo de −0,04 e desliga acima de +0,04
const MOLA_K = 39.5; // pêndulo no gancho: mola de ~1 Hz…
const MOLA_C = 6.7; // …amortecida, assenta em ~1,2 s
const PICO = 4; // ° que o pêndulo alcança na troca de cor…
const RESPOSTA = 0.0843; // …pico por °/s de impulso, com essa mola (k = 39,5, c = 6,7)
const BALANCO = 1.2; // ° de balanço contínuo…
const PERIODO_MS = 5000; // …a cada 5 s
const FADE_MS = 300; // troca de cor no mesmo θ
const PASSO_TECLA = 0.1;
const ZOOM_MAX = 3;

const limitar = (v: number) => Math.max(-1, Math.min(1, v));
const numero = (i: number) => String(i + 1).padStart(3, "0");

/**
 * O giro e o pêndulo, fora do React: bancos de quadros por pasta de cor (carregados aos poucos),
 * espelho com histerese, crossfade na troca de cor e o laço de animação (pausa fora da tela).
 */
function criarMotor(painel: HTMLElement, canvas: HTMLCanvasElement, pendulo: HTMLElement, sombra: HTMLElement) {
  const ctx = canvas.getContext("2d")!;
  const s = { theta: 0, destino: 0, espelho: false, ang: 0, vel: 0, arrasto: null as { x: number; theta: number } | null };
  type Quadros = { pasta: string; n: number };
  const bancos = new Map<string, (HTMLImageElement | undefined)[]>();
  const pedidos = new Map<string, Set<number>>();
  let atual: Quadros | null = null;
  let anterior: (Quadros & { desde: number }) | null = null;
  let alvo: Quadros = { pasta: "", n: 0 };
  let semGiro = false, parado = false, naTela = true, raf = 0, antes = 0;

  const indice = (n: number) => (n - 1) * (1 - Math.abs(s.theta));
  const perto = (n: number) => {
    const i = Math.floor(indice(n));
    return [i, i + 1, i - 1, i + 2];
  };
  const todos = (n: number) => Array.from({ length: n }, (_, i) => i);

  function pedir(pasta: string, n: number, indices: number[], alta: boolean) {
    let banco = bancos.get(pasta);
    if (!banco) bancos.set(pasta, (banco = []));
    let feitos = pedidos.get(pasta);
    if (!feitos) pedidos.set(pasta, (feitos = new Set()));
    const b = banco;
    for (const i of indices) {
      if (i < 0 || i >= n || feitos.has(i)) continue;
      feitos.add(i);
      const img = new window.Image(); // "Image" aqui é o do next/image
      img.fetchPriority = alta ? "high" : "low";
      img.src = `${pasta}${numero(i)}.webp`;
      img.decode().then(() => {
        b[i] = img;
        trocar();
        if (!raf) desenhar();
      }, () => {});
    }
  }

  // Troca para a cor pedida assim que os quadros do θ atual dela estiverem prontos.
  function trocar() {
    if (atual?.pasta === alvo.pasta) return;
    const b = bancos.get(alvo.pasta);
    const i = Math.floor(indice(alvo.n));
    if (!b?.[i] || !b[Math.min(i + 1, alvo.n - 1)]) return;
    if (atual && !semGiro && !parado) {
      anterior = { ...atual, desde: performance.now() };
      // Impulso de velocidade (não de posição) para o lado em que a peça já está, até ~4°.
      const lado = Math.sign(s.ang) || 1;
      s.vel = (lado * Math.max(1, PICO - Math.abs(s.ang))) / RESPOSTA;
    } else if (atual) {
      bancos.delete(atual.pasta);
      pedidos.delete(atual.pasta);
    }
    atual = { ...alvo };
    if (!semGiro) pedir(alvo.pasta, alvo.n, todos(alvo.n), false); // o resto em segundo plano
  }

  function maisPerto(b: (HTMLImageElement | undefined)[], i: number, n: number) {
    for (let d = 0; d < n; d++) {
      const img = b[i - d] ?? b[i + d];
      if (img) return img;
    }
  }

  // Quadro = (N−1)·(1−|θ|); os dois quadros vizinhos se misturam para não pular.
  function pintar(q: Quadros, alfa: number) {
    const b = bancos.get(q.pasta);
    if (!b) return;
    const f = indice(q.n);
    const i0 = Math.floor(f);
    const base = maisPerto(b, i0, q.n);
    const cima = maisPerto(b, Math.min(i0 + 1, q.n - 1), q.n);
    if (!base) return;
    ctx.globalAlpha = alfa;
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    if (f - i0 > 0.01 && cima && cima !== base) {
      ctx.globalAlpha = alfa * (f - i0);
      ctx.drawImage(cima, 0, 0, canvas.width, canvas.height);
    }
    ctx.globalAlpha = 1;
  }

  function desenhar(agora = performance.now()) {
    if (!atual) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (s.espelho) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    let alfa = 1;
    if (anterior) {
      alfa = Math.min(1, (agora - anterior.desde) / FADE_MS);
      if (alfa < 1) pintar(anterior, 1);
      else {
        bancos.delete(anterior.pasta);
        pedidos.delete(anterior.pasta);
        anterior = null;
      }
    }
    pintar(atual, alfa);
    ctx.restore();
    const d = canvas.dataset;
    d.theta = s.theta.toFixed(3);
    d.quadro = String(Math.round(indice(atual.n)) + 1);
    d.espelho = s.espelho ? "1" : "0";
    d.cor = atual.pasta;
    d.fade = anterior ? "1" : "0";
    pendulo.style.transform = s.ang ? `rotate(${s.ang.toFixed(3)}deg)` : "";
    pendulo.dataset.angulo = s.ang.toFixed(2);
    // A sombra estreita quando a peça fica de lado.
    sombra.style.transform = `scaleX(${1 - 0.4 * Math.abs(s.theta)})`;
  }

  function passo(agora: number) {
    const dt = antes ? Math.min(0.05, (agora - antes) / 1000) : 1 / 60;
    antes = agora;
    s.theta += (s.destino - s.theta) * SEGUE;
    if (Math.abs(s.destino - s.theta) < 1e-4) s.theta = s.destino;
    if (s.theta < -HISTERESE) s.espelho = true;
    else if (s.theta > HISTERESE) s.espelho = false;
    const repouso = BALANCO * Math.sin((2 * Math.PI * agora) / PERIODO_MS);
    s.vel += (-MOLA_K * (s.ang - repouso) - MOLA_C * s.vel) * dt;
    s.ang += s.vel * dt;
    trocar();
    desenhar(agora);
    raf = requestAnimationFrame(passo);
  }
  function ligar() {
    if (raf || semGiro || parado || !naTela || document.hidden) return;
    antes = 0;
    raf = requestAnimationFrame(passo);
  }
  function desligar() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  const io = new IntersectionObserver(([e]) => {
    naTela = e.isIntersecting;
    if (naTela) ligar();
    else desligar();
  });
  io.observe(painel);
  const aba = () => (document.hidden ? desligar() : ligar());
  document.addEventListener("visibilitychange", aba);

  return {
    /** Movimento reduzido (sem giro, pêndulo e fade) e passo Estampa (parada de frente). */
    configurar(sem: boolean, paradaDeFrente: boolean) {
      semGiro = sem;
      parado = paradaDeFrente;
      if (sem || paradaDeFrente) {
        desligar();
        Object.assign(s, { theta: 0, destino: 0, espelho: false, ang: 0, vel: 0, arrasto: null });
        desenhar();
      } else {
        if (atual) pedir(atual.pasta, atual.n, todos(atual.n), false);
        ligar();
      }
    },
    escolher(pasta: string, n: number) {
      alvo = { pasta, n };
      pedir(pasta, n, semGiro ? [n - 1] : perto(n), true);
      trocar();
      desenhar();
    },
    /** Mouse em cima, foco ou toque num botão da vitrine: o quadro atual e os vizinhos daquela cor. */
    preCarregar(pasta: string, n: number) {
      pedir(pasta, n, semGiro ? [n - 1] : perto(n), true);
    },
    pegar(x: number) {
      s.arrasto = { x, theta: s.theta };
    },
    arrastar(x: number, meio: number) {
      if (s.arrasto) s.destino = limitar(s.arrasto.theta + (x - s.arrasto.x) / meio);
    },
    /** Soltou: a peça para onde está. */
    soltar() {
      if (s.arrasto) s.destino = s.theta;
      s.arrasto = null;
    },
    tecla(passo: number) {
      s.destino = limitar(s.destino + passo);
    },
    parar() {
      desligar();
      io.disconnect();
      document.removeEventListener("visibilitychange", aba);
    },
  };
}
type Motor = ReturnType<typeof criarMotor>;

/** O que o passo Estampa mostra: posições marcadas (na ordem dos números), técnica e foco do zoom. */
export type PosicaoPrevia = { chave: string; url?: string; manterFundo?: boolean };
export type EstampaPrevia = {
  lado: Lado;
  onLado: (lado: Lado) => void;
  posicoes: PosicaoPrevia[];
  tecnica: Tecnica;
  foco: { chave: string; n: number }; // a cada posição marcada, n muda e o zoom aproxima nela
};

/** Cor da marca para o marcador: azul-marinho em tecido claro, branco em tecido escuro. */
export function tintaPara(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const raiz = getComputedStyle(document.documentElement);
  return raiz.getPropertyValue(0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "--primary" : "--primary-foreground");
}

/**
 * Prévia da peça: a camisa da cor escolhida pendurada no cano, com o cartão embaixo
 * (nome da peça e da cor + vitrine das cores). Gira só arrastando e para onde soltar; balança
 * como pêndulo no gancho. Com `estampa` (passo Estampa) vira a foto parada do lado escolhido
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
  const penduloRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const estampaRef = useRef<HTMLCanvasElement>(null);
  const sombraRef = useRef<HTMLDivElement>(null);
  const motor = useRef<Motor | null>(null);
  const pan = useRef({ x: 0, y: 0, limite: { x: 0, y: 0 }, arrasto: null as { x: number; y: number } | null });
  const aplicar = useRef(() => {});
  const semGiro = usePoucoMovimento();

  const comEstampa = estampa !== undefined;
  const lado = estampa?.lado ?? "frente";
  const [zoom, setZoom] = useState(1);
  // Ao entrar ou sair do passo Estampa o zoom volta para 1×; a cada posição marcada, aproxima nela.
  const [estavaComEstampa, setEstavaComEstampa] = useState(comEstampa);
  const focoN = estampa?.foco.n ?? 0;
  const [ultimoFoco, setUltimoFoco] = useState(focoN);
  if (estavaComEstampa !== comEstampa) {
    setEstavaComEstampa(comEstampa);
    setZoom(1);
  }
  if (ultimoFoco !== focoN) {
    setUltimoFoco(focoN);
    const a = estampa && areaDe(modelo, lado, estampa.foco.chave);
    if (a) setZoom(zoomPara(a));
  }
  const z = comEstampa ? zoom : 1;

  // Posições que aparecem no lado da tela e a área onde o zoom aproxima.
  const naTela = estampa?.posicoes.filter((p) => areaDe(modelo, lado, p.chave)) ?? [];
  const foco =
    estampa && areaDe(modelo, lado, estampa.foco.chave)
      ? estampa.foco.chave
      : (naTela.at(-1)?.chave ?? (lado === "frente" ? "frente-inteira" : "costas-inteira"));
  const tecnica = estampa?.tecnica ?? "DTF";
  // Tudo o que muda a composição, numa chave estável (o objeto `estampa` muda a cada render).
  const assinatura = comEstampa ? JSON.stringify({ lado, tecnica, p: naTela.map((p) => [p.chave, p.url ?? "", !!p.manterFundo]) }) : "";

  const pasta = `${modelo.coresPasta}${cor.pasta}/`;
  const n = modelo.coresQuadros;

  useEffect(() => {
    const m = criarMotor(painelRef.current!, canvasRef.current!, penduloRef.current!, sombraRef.current!);
    motor.current = m;
    return () => m.parar();
  }, []);
  useEffect(() => motor.current?.configurar(semGiro, comEstampa), [semGiro, comEstampa]);
  useEffect(() => motor.current?.escolher(pasta, n), [pasta, n]);

  // Passo Estampa: foto parada do lado escolhido com as artes (ou marcadores) nas dobras, em 2×,
  // composta no Worker. Só recalcula quando muda a assinatura, a peça ou a cor; a foto anterior
  // fica até a nova sair.
  useEffect(() => {
    const ctx = estampaRef.current?.getContext("2d");
    const giro = canvasRef.current;
    if (!ctx || !giro) return;
    if (!assinatura) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      delete ctx.canvas.dataset.pronto;
      giro.style.visibility = "";
      return;
    }
    const { lado: l, tecnica: t, p } = JSON.parse(assinatura) as { lado: Lado; tecnica: Tecnica; p: [string, string, boolean][] };
    let vivo = true;
    comporEstampa({
      largura: ctx.canvas.width,
      altura: ctx.canvas.height,
      peca: `${modelo.coresPasta}${cor.pasta}/${l}.webp`,
      branco: `${modelo.coresPasta}branco/${l}.webp`,
      tecnica: t,
      camadas: p.map(([chave, url, manter]) => ({ area: areaDe(modelo, l, chave)!, url: url || undefined, manter })),
      tinta: tintaPara(cor.hex),
      fonte: getComputedStyle(document.body).fontFamily,
    }).then(({ bitmap, ms }) => {
      if (!vivo) return bitmap.close();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      giro.style.visibility = "hidden";
      ctx.canvas.dataset.ms = String(ms);
      ctx.canvas.dataset.pronto = `${cor.pasta}|${assinatura}`;
    }, () => {});
    return () => {
      vivo = false;
    };
  }, [assinatura, modelo, cor]);

  // Enquadramento do palco. No passo Estampa a peça cresce para ocupar o lugar do cartão, à
  // esquerda da barra de zoom; o zoom leva o centro da área em foco para o meio, e o arrasto move.
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
      // Espaço livre: de 8 px da borda esquerda até 8 px antes da barra de zoom (16 + 44 px), e
      // acima da legenda da técnica. As peças vão até 95% da largura do quadro e 93,7% da altura.
      const cx = (W - 60) / 2;
      const b = Math.min((H - 56) / (ct + 0.937 * ch), (W - 76) / 2 / (0.47 * cw));
      const a = areaDe(modelo, lado, foco) ?? [0.3, 0.27, 0.4, 0.4];
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
  }, [comEstampa, z, foco, lado, modelo]);

  // Arrastar (botão apertado ou dedo) gira; com zoom no passo Estampa, move a imagem.
  // Os controles do painel (cartão, Frente/Costas, zoom) ficam fora disso.
  function apertar(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as Element).closest("[data-controle]")) return;
    if (comEstampa) {
      if (z === 1) return;
      pan.current.arrasto = { x: e.clientX - pan.current.x, y: e.clientY - pan.current.y };
    } else {
      if (semGiro) return;
      motor.current?.pegar(e.clientX);
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
    motor.current?.arrastar(e.clientX, e.currentTarget.clientWidth / 2);
  }
  function soltar(e: React.PointerEvent<HTMLDivElement>) {
    motor.current?.soltar();
    pan.current.arrasto = null;
    delete e.currentTarget.dataset.arrastando;
  }
  function teclar(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || comEstampa || semGiro) return;
    const passo = e.key === "ArrowLeft" ? -PASSO_TECLA : e.key === "ArrowRight" ? PASSO_TECLA : 0;
    if (!passo) return;
    e.preventDefault();
    motor.current?.tecla(passo);
  }
  const preCarregar = (c: Cor) => motor.current?.preCarregar(`${modelo.coresPasta}${c.pasta}/`, n);

  const gira = !comEstampa && !semGiro;
  const limpo = z > 1; // com zoom: sem cano, sem sombra e sem o selo "Prévia"
  const ultimo = numero(n - 1);
  const posicaoCanvas = "absolute top-[7.77%] left-1/2 h-[54%] w-auto -translate-x-1/2 min-[601px]:top-[8.21%] min-[601px]:h-[59%]";

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
        {/* Pêndulo: peça e sombra giram em torno do gancho (no eixo do cano). */}
        <div ref={penduloRef} className="absolute inset-0 origin-[50%_11.31%] min-[601px]:origin-[50%_12.08%]">
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
            className={posicaoCanvas}
          />
        </div>
        <canvas
          ref={estampaRef}
          width={1800}
          height={2400}
          role="img"
          aria-label={`${modelo.nome} na cor ${cor.nome}, ${lado === "frente" ? "frente" : "costas"}${naTela.length ? `, com ${naTela.length} ${naTela.length > 1 ? "estampas" : "estampa"}` : ""}`}
          aria-hidden={!comEstampa || undefined}
          className={posicaoCanvas}
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

          {/* Legenda da técnica no rodapé da prévia. */}
          <p data-controle className="absolute inset-x-3 bottom-3 rounded-xl bg-background/85 px-3 py-1.5 text-center text-xs text-muted-foreground backdrop-blur-sm">
            <span className="font-semibold text-foreground">{estampa.tecnica}</span> · {FRASE_TECNICA[estampa.tecnica]}
          </p>
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
                  onPointerEnter={() => preCarregar(c)}
                  onPointerDown={() => preCarregar(c)}
                  onFocus={() => preCarregar(c)}
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
