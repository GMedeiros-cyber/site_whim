"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadIcon } from "lucide-react";

import { MEDIDAS, type Cor, type Modelo } from "@/components/arara";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { areaDe, type Area, type InfoArte, type Lado, type Tecnica } from "@/lib/estampa";
import { cn } from "@/lib/utils";

// Posições do nicho (README-estampa-2.md, 3); as chaves são as de manifest.pecas[].areas[lado].
// "Esquerdo" é o lado de quem veste.
export const NOME: Record<string, string> = {
  "peito-esquerdo": "Peito esquerdo",
  "peito-direito": "Peito direito",
  "centro-peito": "Centro do peito",
  "frente-inteira": "Frente inteira",
  nuca: "Nuca",
  "costas-em-cima": "Costas em cima",
  "costas-inteira": "Costas inteira",
  "manga-esquerda": "Manga esquerda",
  "manga-direita": "Manga direita",
};
export const GRUPOS: [string, string[]][] = [
  ["Frente", ["peito-esquerdo", "peito-direito", "centro-peito", "frente-inteira"]],
  ["Costas", ["nuca", "costas-em-cima", "costas-inteira"]],
  ["Mangas", ["manga-esquerda", "manga-direita"]],
];

export type Arte = { arquivo: File; url: string }; // URL local (blob:), só no navegador
export type Posicao = { chave: string; arte?: Arte; manterFundo?: boolean };

export const medidaDe = (chave: string) => {
  const m = MEDIDAS[chave];
  return m ? `até ≈ ${m[0]} × ${m[1]} cm` : "";
};
export const temPosicao = (modelo: Modelo, chave: string) => !!(areaDe(modelo, "frente", chave) ?? areaDe(modelo, "costas", chave));
export const ladoDe = (chave: string): Lado => (GRUPOS[1][1].includes(chave) ? "costas" : "frente");
export const pecas = (n: number) => `${n} ${n === 1 ? "peça" : "peças"}`;
export const juntar = (itens: string[]) => (itens.length > 1 ? `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}` : (itens[0] ?? ""));

/** Posições que saem ao marcar `chave` (as que se sobrepõem a ela). Mangas são independentes. */
export function conflitos(chave: string) {
  const frente = GRUPOS[0][1];
  if (chave === "centro-peito" || chave === "frente-inteira") return frente.filter((k) => k !== chave);
  if (chave.startsWith("peito")) return ["centro-peito", "frente-inteira"];
  if (chave === "costas-em-cima") return ["costas-inteira"];
  if (chave === "costas-inteira") return ["costas-em-cima"];
  return [];
}

const areasDoLado = (modelo: Modelo, lado: Lado) => Object.entries((modelo.areas as object as Record<Lado, Record<string, Area>>)[lado]);

/**
 * Área tocada no ponto (px, py) do quadro 900x1200: a menor que contém o ponto ou, perto
 * das bordas, a mais próxima até `tol` (é o que dá 44 px de alvo às áreas pequenas).
 */
function areaNoPonto(areas: [string, Area][], px: number, py: number, tol: number) {
  let melhor: string | null = null, md = Infinity, ma = Infinity;
  for (const [k, [x, y, w, h, ang = 0]] of areas) {
    const t = (ang * Math.PI) / 180, hw = (w * 900) / 2, hh = (h * 1200) / 2;
    const dx = px - (x * 900 + hw), dy = py - (y * 1200 + hh);
    const lx = dx * Math.cos(t) + dy * Math.sin(t), ly = -dx * Math.sin(t) + dy * Math.cos(t);
    const d = Math.hypot(Math.max(0, Math.abs(lx) - hw), Math.max(0, Math.abs(ly) - hh));
    if (d < md - 0.5 || (d <= md + 0.5 && hw * hh < ma)) [melhor, md, ma] = [k, d, hw * hh];
  }
  return md <= tol ? melhor : null;
}

const escura = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3;
};

/**
 * Mapa clicável: frente e costas da peça na cor escolhida com as áreas tracejadas por cima.
 * Tocar marca/desmarca; marcada fica com contorno turquesa e o número. Cada área é um botão
 * (teclado e leitor de tela); o toque passa pelo mapa, que acha a área pelo ponto.
 */
export function MapaPosicoes({
  modelo,
  cor,
  numeros,
  onAlternar,
}: {
  modelo: Modelo;
  cor: Cor;
  numeros: Map<string, number>;
  onAlternar: (chave: string, lado: Lado) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["frente", "costas"] as const).map((lado) => {
        // Maiores primeiro: as pequenas ficam por cima.
        const areas = areasDoLado(modelo, lado).sort(([, a], [, b]) => b[2] * b[3] - a[2] * a[3]);
        return (
          <figure key={lado} className="mx-auto w-full max-w-[200px]">
            <div
              data-mapa={lado}
              className="relative cursor-pointer touch-manipulation overflow-hidden rounded-xl bg-muted"
              onClick={(e) => {
                if (e.detail === 0) return; // teclado: o próprio botão trata
                const r = e.currentTarget.getBoundingClientRect();
                const k = areaNoPonto(areas, ((e.clientX - r.left) / r.width) * 900, ((e.clientY - r.top) / r.height) * 1200, (22 * 900) / r.width);
                if (k) onAlternar(k, lado);
              }}
            >
              <Image
                src={`${modelo.coresPasta}${cor.pasta}/${lado}.webp`}
                alt=""
                width={900}
                height={1200}
                sizes="200px"
                draggable={false}
                className="h-auto w-full select-none"
              />
              {areas.map(([k, a]) => {
                const n = numeros.get(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={n !== undefined}
                    aria-label={k.startsWith("manga") ? `${NOME[k]}, vista ${lado === "frente" ? "de frente" : "das costas"}` : NOME[k]}
                    onClick={() => onAlternar(k, lado)}
                    className={cn(
                      "pointer-events-none absolute rounded-[3px] outline-none focus-visible:ring-3 focus-visible:ring-ring",
                      n !== undefined
                        ? "border-2 border-accent"
                        : cn("border border-dashed", escura(cor.hex) ? "border-primary-foreground/75" : "border-primary/55")
                    )}
                    // Geometria vem do manifesto (posição e ângulo da área), não é estilo.
                    style={{ left: `${a[0] * 100}%`, top: `${a[1] * 100}%`, width: `${a[2] * 100}%`, height: `${a[3] * 100}%`, rotate: a[4] ? `${a[4]}deg` : undefined }}
                  >
                    {n !== undefined && (
                      <span
                        aria-hidden
                        className="absolute top-1/2 left-1/2 grid size-[18px] -translate-1/2 place-items-center rounded-full bg-accent text-[10px] font-bold text-primary"
                        style={{ rotate: a[4] ? `${-a[4]}deg` : undefined }}
                      >
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <figcaption className="mt-1.5 text-center text-xs font-medium text-muted-foreground">{lado === "frente" ? "Frente" : "Costas"}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** A mesma escolha em caixas de marcar, agrupada em Frente / Costas / Mangas. */
export function ListaPosicoes({
  modelo,
  numeros,
  onAlternar,
}: {
  modelo: Modelo;
  numeros: Map<string, number>;
  onAlternar: (chave: string, lado: Lado) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
      {GRUPOS.map(([grupo, chaves]) => {
        const existem = chaves.filter((k) => temPosicao(modelo, k));
        if (!existem.length) return null;
        return (
          <fieldset key={grupo} className={cn("min-w-0", grupo === "Mangas" && "col-span-2")}>
            <legend className="text-[13px] font-medium">{grupo}</legend>
            <div className={cn(grupo === "Mangas" && "flex flex-wrap gap-x-5")}>
              {existem.map((k) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] leading-tight">
                  <Checkbox checked={numeros.has(k)} onCheckedChange={() => onAlternar(k, ladoDe(k))} className="size-5 shrink-0" />
                  {NOME[k]}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** Nome do arquivo cortado no meio: o começo some com "…" e o fim (com a extensão) fica. */
export function NomeArquivo({ nome, className }: { nome: string; className?: string }) {
  const ponto = nome.lastIndexOf(".");
  const corte = Math.max(0, (ponto > 0 ? ponto : nome.length) - 3);
  return (
    <span title={nome} className={cn("flex min-w-0", className)}>
      <span className="truncate">{nome.slice(0, corte)}</span>
      <span className="shrink-0">{nome.slice(corte)}</span>
    </span>
  );
}

const ARTE_TIPOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ARTE_MAX = 10 * 1024 * 1024;
const PEQUENAS = ["peito-esquerdo", "peito-direito", "nuca", "manga-esquerda", "manga-direita"];

/** Uma posição marcada: número, nome, medida, anexo próprio, "usar a mesma arte de" e dicas. */
export function LinhaPosicao({
  numero,
  posicao,
  area,
  info,
  tecnica,
  outras,
  onArte,
  onManterFundo,
  onVerDTF,
}: {
  numero: number;
  posicao: Posicao;
  area?: Area;
  info?: InfoArte;
  tecnica: Tecnica;
  outras: { numero: number; posicao: Posicao }[]; // linhas com arte, para copiar
  onArte: (arte?: Arte, manterFundo?: boolean) => void;
  onManterFundo: (manter: boolean) => void;
  onVerDTF: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const [sobre, setSobre] = useState(false);
  const { chave, arte } = posicao;
  const nome = NOME[chave];
  const manga = chave.startsWith("manga");

  function escolher(f?: File) {
    if (!f) return;
    if (!ARTE_TIPOS.includes(f.type)) return setErro("Use PNG, JPG, WebP ou SVG.");
    if (f.size > ARTE_MAX) return setErro("A arte passa de 10 MB. Mande o arquivo direto pelo WhatsApp.");
    setErro("");
    onArte({ arquivo: f, url: URL.createObjectURL(f) });
  }
  const input = (
    <input
      ref={inputRef}
      id={`arte-${chave}`}
      type="file"
      accept={ARTE_TIPOS.join(",")}
      className="sr-only"
      onChange={(e) => {
        escolher(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  // Traço fino na escala da área (px do quadro de 900): arte encaixada em contain.
  const largura = area && info ? Math.min(area[2] * 900, area[3] * 1200 * info.proporcao) * (manga ? 0.85 : 1) : 0;
  const fino = info !== undefined && info.traco * largura < 2;

  return (
    <li data-posicao={chave} className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3">
      <span aria-hidden className="grid size-[26px] place-items-center rounded-full bg-accent text-xs font-bold text-primary">
        {numero}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <p className="font-medium">
            <span className="sr-only">{numero}. </span>
            {nome}
          </p>
          <p className="text-xs text-muted-foreground">{medidaDe(chave)}</p>
        </div>

        {arte ? (
          <>
            <div className="mt-2 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2.5">
              <Image src={arte.url} alt="" width={44} height={44} unoptimized className="size-11 rounded-lg bg-muted object-contain" />
              <NomeArquivo nome={arte.arquivo.name} className="text-sm" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()} aria-label={`Trocar arte de ${nome.toLowerCase()}`} className="min-h-11">
                Trocar
              </Button>
              <Button variant="ghost" onClick={() => onArte(undefined)} aria-label={`Remover arte de ${nome.toLowerCase()}`} className="min-h-11">
                Remover
              </Button>
            </div>
            {input}
          </>
        ) : (
          <label
            htmlFor={`arte-${chave}`}
            onDragOver={(e) => {
              e.preventDefault();
              setSobre(true);
            }}
            onDragLeave={() => setSobre(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSobre(false);
              escolher(e.dataTransfer.files[0]);
            }}
            className={cn(
              "mt-2 flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-primary/25 px-3 py-2.5 text-center text-[13px] text-muted-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              sobre && "border-accent bg-accent/10"
            )}
          >
            <UploadIcon aria-hidden className="size-4 shrink-0" />
            <span className="pointer-coarse:hidden">Arraste a arte ou clique para escolher</span>
            <span className="hidden pointer-coarse:inline">Toque para escolher a arte</span>
            <span className="sr-only">de {nome.toLowerCase()}</span>
            {input}
          </label>
        )}
        {erro && (
          <p role="alert" className="mt-1.5 text-[13px] text-destructive">
            {erro}
          </p>
        )}

        {outras.length > 0 && (
          <label className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            Usar a mesma arte de:
            <select
              value=""
              onChange={(e) => {
                const o = outras.find((x) => String(x.numero) === e.target.value);
                if (o?.posicao.arte) onArte(o.posicao.arte, o.posicao.manterFundo);
              }}
              className="h-11 max-w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Escolher…</option>
              {outras.map((o) => (
                <option key={o.numero} value={o.numero}>
                  {o.numero}. {NOME[o.posicao.chave]}
                </option>
              ))}
            </select>
          </label>
        )}

        {arte && info?.fundo && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-[13px] text-muted-foreground">
            <span>{posicao.manterFundo ? "Fundo mantido na prévia" : "Fundo removido na prévia"}</span>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={!!posicao.manterFundo} onCheckedChange={(v) => onManterFundo(!!v)} className="size-5" />
              Manter o fundo
            </label>
          </div>
        )}

        {manga && <p className="mt-2 text-[13px] text-muted-foreground">Na manga cabe um símbolo ou logo pequeno. Texto longo fica ilegível.</p>}
        {manga && arte && info && info.proporcao > 2.5 && (
          <p role="status" className="mt-1 text-[13px] font-medium">
            Essa arte é larga para a manga. Se tiver, anexe só o símbolo.
          </p>
        )}
        {tecnica === "Silk" && arte && info && (info.cores > 6 || info.degrade) && (
          <div role="status" className="mt-2 rounded-[12px] bg-muted px-3 pt-2.5 text-[13px]">
            Sua arte tem muitas cores ou degradê. No silk cada cor é uma tela; o DTF reproduz melhor.
            <Button variant="link" onClick={onVerDTF} className="h-auto min-h-11 px-0">
              Ver em DTF
            </Button>
          </div>
        )}
        {tecnica === "Bordado" && arte && PEQUENAS.includes(chave) && fino && (
          <p role="status" className="mt-2 rounded-[12px] bg-muted px-3 py-2.5 text-[13px]">
            Detalhes finos podem não aparecer no bordado.
          </p>
        )}
      </div>
    </li>
  );
}
