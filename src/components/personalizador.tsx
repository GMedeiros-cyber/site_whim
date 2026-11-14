"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckIcon, DownloadIcon, InfoIcon, MinusIcon, PlusIcon, Share2Icon } from "lucide-react";

import { Arara, CORES, MODELOS, usePoucoMovimento, type Cor } from "@/components/arara";
import { Container, Destaque, Eyebrow, Seta, Titulo } from "@/components/blocos";
import {
  conflitos,
  juntar,
  LinhaPosicao,
  ListaPosicoes,
  MapaPosicoes,
  medidaDe,
  NOME,
  pecas,
  temPosicao,
  type Arte,
  type Posicao,
} from "@/components/posicoes";
import { PreviaPeca, tintaPara, type EstampaPrevia } from "@/components/previa-peca";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { areaDe, FRASE_TECNICA, TECNICAS, type InfoArte, type Lado, type Tecnica } from "@/lib/estampa";
import { analisarArte } from "@/lib/estampa-cliente";
import { gerarFicha, nomeFicha } from "@/lib/ficha";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const PECAS = MODELOS.map((m) => m.nome);
// As cores do tecido vêm do manifesto da arara (CORES), as mesmas dos quadros pintados.
const MINIMO = 50;

type Tamanho = { nome: string; qtd: number; extra?: boolean };
type Pedido = {
  peca: string;
  cor: Cor;
  posicoes: Posicao[]; // na ordem em que foram marcadas (= números do mapa)
  tecnica: Tecnica;
  tamanhos: Tamanho[];
};

const INICIAL: Pedido = {
  peca: PECAS[0],
  cor: CORES[1],
  posicoes: [],
  tecnica: TECNICAS[0],
  tamanhos: ["P", "M", "G", "GG"].map((nome) => ({ nome, qtd: 0 })),
};

const modeloDe = (peca: string) => MODELOS.find((m) => m.nome === peca) ?? MODELOS[0];
type Ficha = { chave: string; url: string; arquivo: File; compartilhavel: boolean };

export function Personalizador() {
  const [pedido, setPedido] = useState(INICIAL);
  const [passo, setPasso] = useState(0);
  const [alcancado, setAlcancado] = useState(0); // passo mais longe já atingido
  const [antes, setAntes] = useState<Pedido | null>(null); // para "Cancelar" a edição de um passo feito
  const [lado, setLado] = useState<Lado>("frente"); // lado na prévia do passo Estampa
  const [foco, setFoco] = useState({ chave: "", n: 0 }); // última posição marcada (zoom da prévia)
  const [aviso, setAviso] = useState("");
  const [infos, setInfos] = useState<Record<string, InfoArte>>({}); // análise de cada arte, por URL
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const tituloRef = useRef<HTMLParagraphElement>(null);
  const previaRef = useRef<HTMLDivElement>(null);
  const focar = useRef(false);
  const semGiro = usePoucoMovimento();

  const { peca, cor, posicoes, tecnica, tamanhos } = pedido;
  const mudar = (parcial: Partial<Pedido>) => setPedido((p) => ({ ...p, ...parcial }));
  const modelo = modeloDe(peca);
  const numeros = new Map(posicoes.map((p, i) => [p.chave, i + 1]));
  const comQtd = tamanhos.filter((t) => t.qtd > 0);
  const total = comQtd.reduce((s, t) => s + t.qtd, 0);
  const listaTamanhos = comQtd.map((t) => `${t.nome} ${t.qtd}`).join(", ");
  const temArte = posicoes.some((p) => p.arte);

  // Libera as URLs das artes que saíram do pedido (trocar, remover) e do rascunho do "Cancelar";
  // ao sair da página, todas.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const usadas = new Set([pedido, antes].flatMap((p) => (p?.posicoes ?? []).flatMap((x) => (x.arte ? [x.arte.url] : []))));
    for (const u of urls.current) if (!usadas.has(u)) URL.revokeObjectURL(u);
    urls.current = usadas;
  }, [pedido, antes]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const resumo = [
    "Olá, Whim! Montei minha peça no site:",
    `• Peça: ${peca} · Cor: ${cor.nome}`,
    `• Técnica: ${tecnica}`,
    posicoes.length
      ? ["• Estampas:", ...posicoes.map((p, i) => `  ${i + 1}. ${NOME[p.chave]} (${medidaDe(p.chave)}): ${p.arte?.arquivo.name ?? "arte a enviar"}`)].join("\n")
      : "• Estampas: a definir",
    `• Tamanhos: ${listaTamanhos || "a definir"} · Total: ${pecas(total)}`,
    "Vou mandar a ficha e os arquivos aqui na conversa.",
    "Podem me passar o orçamento?",
  ].join("\n");

  // Trocar a peça mantém cor, estampa e tamanhos; posição que a peça nova não tem sai, com aviso.
  function trocarPeca(nova: string) {
    const m = modeloDe(nova);
    const saem = posicoes.filter((p) => !temPosicao(m, p.chave));
    setAviso(saem.length ? `${nova} não tem ${juntar(saem.map((p) => NOME[p.chave].toLowerCase()))}: ${saem.length > 1 ? "essas posições saíram" : "essa posição saiu"}.` : "");
    mudar({ peca: nova, posicoes: posicoes.filter((p) => temPosicao(m, p.chave)) });
  }

  // Mapa e lista: marcar tira o que se sobrepõe (com aviso), leva a prévia para o lado e aproxima.
  function alternar(chave: string, l: Lado) {
    if (numeros.has(chave)) {
      mudar({ posicoes: posicoes.filter((p) => p.chave !== chave) });
      setAviso("");
      return;
    }
    const saem = conflitos(chave).filter((k) => numeros.has(k));
    mudar({ posicoes: [...posicoes.filter((p) => !saem.includes(p.chave)), { chave }] });
    setAviso(saem.length ? `${NOME[chave]} não combina com ${juntar(saem.map((k) => NOME[k]))}, que ${saem.length > 1 ? "saíram" : "saiu"}.` : "");
    setLado(l);
    setFoco((f) => ({ chave, n: f.n + 1 }));
  }
  function mudarPosicao(chave: string, parcial: Partial<Posicao>) {
    mudar({ posicoes: posicoes.map((p) => (p.chave === chave ? { ...p, ...parcial } : p)) });
  }
  function anexar(chave: string, arte?: Arte, manterFundo?: boolean) {
    mudarPosicao(chave, { arte, manterFundo });
    if (arte && !infos[arte.url]) analisarArte(arte.url).then((info) => setInfos((x) => ({ ...x, [arte.url]: info })), () => {});
  }

  // ToggleGroup deixa desmarcar tudo; ignoramos o valor vazio para sempre ter uma escolha.
  const escolha = (set: (v: string) => void) => (v: string[]) => v[0] && set(v[0]);

  // Navegação da ficha. "Alterar" (e "Voltar") abre só aquele passo; os outros continuam feitos.
  function ir(i: number) {
    focar.current = true;
    setPasso(i);
  }
  function abrir(i: number) {
    setAntes(pedido);
    ir(i);
  }
  function continuar() {
    setAlcancado((a) => Math.max(a, passo + 1));
    ir(passo + 1);
  }
  function salvar() {
    setAntes(null);
    ir(alcancado);
  }
  function cancelar() {
    if (antes) setPedido(antes);
    setAntes(null);
    ir(alcancado);
  }
  const editando = passo < alcancado;
  const celular = () => matchMedia("(max-width: 1023px)").matches;

  // Foco no título do passo aberto; no celular a página rola até ele.
  useEffect(() => {
    const el = tituloRef.current;
    if (!focar.current || !el) return;
    focar.current = false;
    el.focus({ preventScroll: celular() });
    if (celular()) el.scrollIntoView({ block: "start", behavior: semGiro ? "auto" : "smooth" });
  }, [passo, semGiro]);

  // Ficha em PNG para a equipe da Whim, gerada ao chegar no Resumo (e a cada mudança).
  const chaveFicha =
    passo === 4
      ? JSON.stringify({ peca, cor: cor.pasta, tecnica, t: listaTamanhos, total, p: posicoes.map((p) => [p.chave, p.arte?.url ?? "", p.arte?.arquivo.name ?? "", !!p.manterFundo]) })
      : "";
  const fichaUrl = useRef("");
  useEffect(() => {
    if (!chaveFicha) return;
    const d = JSON.parse(chaveFicha) as { peca: string; cor: string; tecnica: Tecnica; t: string; total: number; p: [string, string, string, boolean][] };
    const m = modeloDe(d.peca);
    const c = CORES.find((x) => x.pasta === d.cor) ?? CORES[0];
    let vivo = true;
    gerarFicha({
      modelo: m,
      cor: c,
      tecnica: d.tecnica,
      tamanhos: d.t || "a definir",
      total: d.total,
      tinta: tintaPara(c.hex),
      linhas: d.p.map(([chave, url, arquivo, manterFundo], i) => ({
        numero: i + 1,
        chave,
        nome: NOME[chave],
        medida: medidaDe(chave),
        url: url || undefined,
        arquivo: arquivo || undefined,
        manterFundo,
      })),
    }).then((blob) => {
      if (!vivo) return;
      const arquivo = new File([blob], nomeFicha(m.id), { type: "image/png" });
      const url = URL.createObjectURL(blob);
      if (fichaUrl.current) URL.revokeObjectURL(fichaUrl.current);
      fichaUrl.current = url;
      const compartilhavel = matchMedia("(pointer: coarse)").matches && !!navigator.canShare?.({ files: [arquivo] });
      setFicha({ chave: chaveFicha, url, arquivo, compartilhavel });
    }, () => {});
    return () => {
      vivo = false;
    };
  }, [chaveFicha]);
  useEffect(() => () => URL.revokeObjectURL(fichaUrl.current), []);
  const fichaPronta = ficha !== null && ficha.chave === chaveFicha;
  function baixarFicha() {
    if (!ficha) return;
    const a = document.createElement("a");
    a.href = ficha.url;
    a.download = ficha.arquivo.name;
    a.click();
  }

  // Ficha do pedido: nome do passo, o valor quando feito e o texto de quando ainda vem depois.
  const passos = [
    { nome: "Peça", valor: peca, depois: "Modelo da arara" },
    { nome: "Cor", valor: cor.nome, depois: "Na vitrine da prévia" },
    { nome: "Estampa", valor: `${posicoes.length ? posicoes.map((p) => NOME[p.chave]).join(", ") : "A definir"} · ${tecnica}`, depois: "Posições, artes e técnica" },
    { nome: "Quantidade", valor: `${pecas(total)}${listaTamanhos ? ` · ${listaTamanhos}` : ""}`, depois: `A partir de ${MINIMO} peças` },
    { nome: "Resumo", valor: "", depois: "Ficha e WhatsApp" },
  ];
  const ultimo = passos.length - 1;

  const estampa: EstampaPrevia | undefined =
    passo === 2
      ? { lado, onLado: setLado, posicoes: posicoes.map((p) => ({ chave: p.chave, url: p.arte?.url, manterFundo: p.manterFundo })), tecnica, foco }
      : undefined;

  function conteudo(i: number) {
    switch (i) {
      case 0:
        return (
          <>
            <p className="text-sm text-muted-foreground">Também dá para escolher direto na arara.</p>
            <ToggleGroup aria-label="Peça" value={[peca]} onValueChange={escolha(trocarPeca)} className="mt-3.5 flex-wrap">
              {PECAS.map((p) => (
                <Opcao key={p} value={p}>{p}</Opcao>
              ))}
            </ToggleGroup>
          </>
        );
      case 1:
        return (
          <>
            <p className="text-sm text-muted-foreground">Toque numa das camisas da vitrine para trocar a cor.</p>
            <span className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-primary/12 px-3 py-1.5 text-sm font-medium">
              {/* Cor do tecido (dado do manifesto), não cor da interface. */}
              <span aria-hidden className="size-4 rounded-full border border-primary/15" style={{ backgroundColor: cor.hex }} />
              {cor.nome}
            </span>
          </>
        );
      case 2:
        return (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="pointer-coarse:hidden">Clique onde vai a estampa.</span>
              <span className="hidden pointer-coarse:inline">Toque onde vai a estampa.</span> Dá para marcar mais de uma posição.
            </p>
            {aviso && (
              <p role="status" className="mt-3 rounded-[14px] bg-muted px-3.5 py-2.5 text-[13px]">
                {aviso}
              </p>
            )}
            <div className="mt-3.5">
              <MapaPosicoes modelo={modelo} cor={cor} numeros={numeros} onAlternar={alternar} />
            </div>
            <ListaPosicoes modelo={modelo} numeros={numeros} onAlternar={alternar} />
            {posicoes.length > 0 && (
              <>
                <ol aria-label="Posições marcadas" className="mt-5 grid gap-4 border-t border-primary/10 pt-4">
                  {posicoes.map((p, j) => (
                    <LinhaPosicao
                      key={p.chave}
                      numero={j + 1}
                      posicao={p}
                      area={areaDe(modelo, "frente", p.chave) ?? areaDe(modelo, "costas", p.chave)}
                      info={p.arte && infos[p.arte.url]}
                      tecnica={tecnica}
                      outras={posicoes.flatMap((o, k) => (k !== j && o.arte ? [{ numero: k + 1, posicao: o }] : []))}
                      onArte={(arte, manterFundo) => anexar(p.chave, arte, manterFundo)}
                      onManterFundo={(manterFundo) => mudarPosicao(p.chave, { manterFundo })}
                      onVerDTF={() => mudar({ tecnica: "DTF" })}
                    />
                  ))}
                </ol>
                <p className="mt-3 text-[13px] text-muted-foreground">Medidas de referência. A Whim confirma no orçamento.</p>
                <p className="mt-3.5 flex gap-2.5 rounded-[14px] bg-muted p-3.5 text-[13px]">
                  <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-accent" />
                  A arte aqui é só para a prévia. Na hora de enviar o pedido pelo WhatsApp, anexe o arquivo na conversa.
                </p>
              </>
            )}
            <div className="mt-5 grid gap-2">
              <p className="text-[13px] font-medium">Técnica</p>
              <ToggleGroup aria-label="Técnica" value={[tecnica]} onValueChange={escolha((v) => mudar({ tecnica: v as Tecnica }))} className="flex-wrap">
                {TECNICAS.map((t) => (
                  <Opcao key={t} value={t}>{t}</Opcao>
                ))}
              </ToggleGroup>
              <p className="text-[13px] text-muted-foreground">{FRASE_TECNICA[tecnica]}</p>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <p className="text-sm text-muted-foreground">
              Pedido mínimo de {MINIMO} peças. Prazo de produção de 20 a 30 dias, conforme quantidade e modelo.
            </p>
            <Tamanhos tamanhos={tamanhos} onTamanhos={(t) => mudar({ tamanhos: t })} />
            <div aria-live="polite" className="mt-4 border-t border-primary/10 pt-3.5">
              <p className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{pecas(total)}</span>
              </p>
              {total < MINIMO && (
                <p className="mt-1 text-sm text-destructive">
                  Faltam {MINIMO - total} peças para o mínimo de {MINIMO}.
                </p>
              )}
            </div>
          </>
        );
      default:
        return (
          <>
            <p className="rounded-2xl bg-muted p-[18px] text-sm wrap-anywhere whitespace-pre-wrap">{resumo}</p>
            <div className="mt-3.5 rounded-2xl border border-primary/12 p-3">
              <p className="text-[13px] font-medium">Ficha da estampa para a equipe da Whim</p>
              {fichaPronta ? (
                <Image
                  src={ficha.url}
                  alt={`Ficha da estampa: ${peca}, ${cor.nome}, ${tecnica}, ${posicoes.length} ${posicoes.length === 1 ? "posição" : "posições"}`}
                  width={1600}
                  height={1000}
                  unoptimized
                  className="mt-2 h-auto w-full rounded-lg border border-primary/10"
                />
              ) : (
                <Skeleton className="mt-2 aspect-[16/10] w-full rounded-lg" />
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="xl" disabled={!fichaPronta} onClick={baixarFicha} className="flex-1">
                  <DownloadIcon data-icon="inline-start" /> Baixar ficha
                </Button>
                {fichaPronta && ficha.compartilhavel && (
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => navigator.share({ files: [ficha.arquivo], title: "Ficha da estampa" }).catch(() => {})}
                    className="flex-1"
                  >
                    <Share2Icon data-icon="inline-start" /> Compartilhar ficha
                  </Button>
                )}
              </div>
            </div>
            <ol className="mt-3.5 grid list-inside list-decimal gap-1 text-sm marker:font-semibold marker:text-accent">
              <li>Baixe ou compartilhe a ficha.</li>
              <li>Envie a mensagem pelo WhatsApp.</li>
              <li>Na conversa, anexe a ficha{temArte ? " e os arquivos das artes" : ""}.</li>
            </ol>
            <a
              href={linkWhatsApp(resumo)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "xl" }), "mt-3.5")}
            >
              Enviar pelo WhatsApp <Seta />
            </a>
          </>
        );
    }
  }

  return (
    <>
      <section id="personalizar" className="scroll-mt-24 pt-[132px] pb-3 sm:pt-[168px] sm:pb-8">
        <Container>
          <Eyebrow>Monte sua peça</Eyebrow>
          <Titulo as="h1">
            Escolha na arara <Destaque>e personalize.</Destaque>
          </Titulo>

          {/* Arara: um clique ou toque já escolhe a peça (no começo, leva ao passo da cor). */}
          <div className="mt-10">
            <Arara
              selecionada={peca}
              cor={cor.hex}
              onEscolher={(p) => {
                trocarPeca(p);
                if (alcancado <= 1) {
                  setPasso(1);
                  setAlcancado(1);
                  setAntes(null);
                }
                // No celular, rola suave até a prévia se ela não estiver inteira na tela.
                const el = previaRef.current;
                if (el && !semGiro && celular()) {
                  const r = el.getBoundingClientRect();
                  if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            />
          </div>
        </Container>
      </section>

      <Container className="grid items-start gap-8 pt-3 pb-7 sm:pt-8 sm:pb-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-[clamp(20px,4vw,48px)]">
        <div ref={previaRef} className="min-w-0">
          <PreviaPeca modelo={modelo} cor={cor} onCor={(c) => mudar({ cor: c })} estampa={estampa} />
        </div>

        {/* Ficha do pedido: 5 passos numa linha vertical (feito, atual, depois). */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold min-[601px]:text-2xl">Seu pedido</h2>
          <p className="mt-1 text-sm text-muted-foreground">Monte em 5 passos e receba o orçamento pelo WhatsApp.</p>
          <ol aria-label="Passos do pedido" className="mt-6">
            {passos.map((p, i) => {
              const estado = i === passo ? "atual" : i < alcancado ? "feito" : "depois";
              return (
                <li
                  key={p.nome}
                  aria-current={estado === "atual" ? "step" : undefined}
                  data-estado={estado}
                  className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 min-[601px]:grid-cols-[30px_minmax(0,1fr)] min-[601px]:gap-x-4"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums min-[601px]:size-[30px] min-[601px]:text-[13px]",
                        estado === "feito" && "bg-primary text-primary-foreground",
                        estado === "atual" && "border-2 border-accent bg-background",
                        estado === "depois" && "border border-primary/18 text-muted-foreground"
                      )}
                    >
                      {estado === "feito" ? <CheckIcon aria-label="feito" className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    {i < ultimo && (
                      <span aria-hidden className={cn("min-h-4 w-0.5 flex-1", estado === "feito" ? "bg-primary" : "bg-primary/14")} />
                    )}
                  </div>

                  <div className={cn("min-w-0", i < ultimo && "pb-5")}>
                    {estado === "feito" && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 pt-0.5 min-[601px]:pt-1">
                          <p className="font-semibold">{p.nome}</p>
                          <p className="truncate text-sm text-muted-foreground">{p.valor}</p>
                        </div>
                        <Button variant="link" onClick={() => abrir(i)} aria-label={`Alterar ${p.nome.toLowerCase()}`} className="-mt-2 min-h-11 px-2">
                          Alterar
                        </Button>
                      </div>
                    )}
                    {estado === "atual" && (
                      <>
                        <p ref={tituloRef} tabIndex={-1} className="scroll-mt-28 pt-0.5 font-semibold outline-none min-[601px]:pt-1">
                          {p.nome}
                        </p>
                        <div className="mt-3 rounded-[18px] border border-primary/12 bg-background p-4 shadow-sm min-[601px]:p-5">
                          {conteudo(i)}
                          <div className="mt-5 flex gap-2.5">
                            {editando ? (
                              <>
                                <Button variant="outline" size="xl" onClick={cancelar} className="flex-1 min-[601px]:flex-none">
                                  Cancelar
                                </Button>
                                <Button size="xl" onClick={salvar} className="flex-[2] min-[601px]:ml-auto min-[601px]:flex-none">
                                  Salvar
                                </Button>
                              </>
                            ) : (
                              <>
                                {i > 0 && (
                                  <Button variant="outline" size="xl" onClick={() => abrir(i - 1)} className="flex-1 min-[601px]:flex-none">
                                    Voltar
                                  </Button>
                                )}
                                {i < ultimo && (
                                  <Button size="xl" onClick={continuar} className="flex-[2] min-[601px]:ml-auto min-[601px]:flex-none">
                                    Continuar <Seta />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {estado === "depois" && (
                      <p className="pt-0.5 opacity-75 min-[601px]:pt-1">
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-muted-foreground"> · {p.depois}</span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </>
  );
}

function Opcao(props: React.ComponentProps<typeof ToggleGroupItem>) {
  return (
    <ToggleGroupItem
      variant="outline"
      className="h-auto min-h-11 rounded-[14px] px-4 text-[13.5px] aria-pressed:border-primary"
      {...props}
    />
  );
}

/** Tamanhos com quantidade: − número +, e "Adicionar outro tamanho" (removível). */
function Tamanhos({ tamanhos, onTamanhos }: { tamanhos: Tamanho[]; onTamanhos: (t: Tamanho[]) => void }) {
  const [novo, setNovo] = useState<string | null>(null);
  const nomeNovo = novo?.trim() ?? "";
  const repetido = tamanhos.some((t) => t.nome.toLowerCase() === nomeNovo.toLowerCase());
  const mudarQtd = (i: number, qtd: number) => onTamanhos(tamanhos.map((t, j) => (j === i ? { ...t, qtd: Math.max(0, qtd) } : t)));

  return (
    <div className="mt-3.5">
      <ul aria-label="Tamanhos" className="grid gap-2">
        {tamanhos.map((t, i) => (
          <li key={t.nome} className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.nome}</p>
              {t.extra && (
                <Button variant="link" onClick={() => onTamanhos(tamanhos.filter((_, j) => j !== i))} aria-label={`Remover tamanho ${t.nome}`} className="-ml-2 h-auto min-h-11 px-2 text-[13px]">
                  Remover
                </Button>
              )}
            </div>
            <Button variant="outline" size="icon-lg" aria-label={`Menos ${t.nome}`} disabled={t.qtd === 0} onClick={() => mudarQtd(i, t.qtd - 1)} className="size-11 rounded-full">
              <MinusIcon />
            </Button>
            <Input
              aria-label={`Quantidade ${t.nome}`}
              inputMode="numeric"
              value={String(t.qtd)}
              onChange={(e) => mudarQtd(i, Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="h-11 w-14 text-center tabular-nums"
            />
            <Button variant="outline" size="icon-lg" aria-label={`Mais ${t.nome}`} onClick={() => mudarQtd(i, t.qtd + 1)} className="size-11 rounded-full">
              <PlusIcon />
            </Button>
          </li>
        ))}
      </ul>
      {novo === null ? (
        <Button variant="outline" onClick={() => setNovo("")} className="mt-3 min-h-11">
          <PlusIcon data-icon="inline-start" /> Adicionar outro tamanho
        </Button>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nomeNovo || repetido) return;
            onTamanhos([...tamanhos, { nome: nomeNovo, qtd: 0, extra: true }]);
            setNovo(null);
          }}
        >
          <Input
            autoFocus
            aria-label="Nome do tamanho"
            placeholder="Ex.: XG ou Infantil 10"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setNovo(null)}
            className="h-11 min-w-0 flex-1"
          />
          <Button type="submit" disabled={!nomeNovo || repetido} className="min-h-11">
            Adicionar
          </Button>
        </form>
      )}
    </div>
  );
}
