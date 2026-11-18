"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, CheckIcon, DownloadIcon, InfoIcon, MinusIcon, PlusIcon, Share2Icon } from "lucide-react";

import { Arara, CORES, MODELOS, usePoucoMovimento, type Cor } from "@/components/arara";
import { Container, Destaque, Seta, Titulo } from "@/components/blocos";
import {
  conflitos,
  EscolhaPosicoes,
  juntar,
  ladoDe,
  LinhaPosicao,
  medidaDe,
  NOME,
  pecas,
  temPosicao,
  type Arte,
  type Posicao,
} from "@/components/posicoes";
import { CoresVitrine, PreviaPeca, tintaPara, type EstampaPrevia } from "@/components/previa-peca";
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
// Tecidos do briefing da Whim (16/11).
const TECIDOS = [
  "Não sei, me indiquem",
  "Meia malha penteada 100% algodão premium",
  "Malha fria PV antipilling",
  "Malha mescla PA",
  "Malha piquet PA",
  "Moletom 3 cabos",
  "Dry fit 100% poliéster",
  "Dry fit 100% poliamida",
];
// Grades do briefing; G1 a G3 e os pares do infantil a Whim ainda confirma.
const GRADES = {
  Adulto: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"],
  Infantil: ["2", "4", "6", "8", "10", "12", "14", "16"],
};
type Grupo = keyof typeof GRADES;

type Tamanho = { grupo: Grupo; nome: string; qtd: number; extra?: boolean };
/** "P", "Infantil 4": o nome que vai para a mensagem, a ficha e os rótulos de leitor de tela. */
const nomeTamanho = (t: Tamanho) => (t.grupo === "Infantil" ? `Infantil ${t.nome}` : t.nome);
type Pedido = {
  peca: string;
  tecido: string;
  cor: Cor; // a da vitrine (é a que aparece na prévia)
  usaOutra: boolean; // a cor do pedido é outra, escrita pelo cliente
  outraCor: string;
  posicoes: Posicao[]; // na ordem em que foram marcadas (= números do mapa)
  tecnica: Tecnica;
  tamanhos: Tamanho[];
};

const INICIAL: Pedido = {
  peca: PECAS[0],
  tecido: TECIDOS[0],
  cor: CORES[1],
  usaOutra: false,
  outraCor: "",
  posicoes: [],
  tecnica: TECNICAS[0],
  tamanhos: (Object.keys(GRADES) as Grupo[]).flatMap((grupo) => GRADES[grupo].map((nome) => ({ grupo, nome, qtd: 0 }))),
};

const modeloDe = (peca: string) => MODELOS.find((m) => m.nome === peca) ?? MODELOS[0];

const GUARDA = "whim-pedido";
/** O pedido guardado nesta aba (sem as artes); null se não houver ou não fizer sentido. */
function lerPedido(): { pedido: Pedido; passo: number; alcancado: number } | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(GUARDA) ?? "null");
    const p = s?.pedido;
    const cor = CORES.find((c) => c.pasta === p?.cor);
    if (!cor || !PECAS.includes(p.peca) || !Array.isArray(p.posicoes) || !Array.isArray(p.tamanhos)) return null;
    const passo = Math.min(4, Math.max(0, Number(s.passo) || 0));
    const alcancado = Math.min(4, Math.max(passo, Number(s.alcancado) || 0));
    return { pedido: { ...INICIAL, ...p, cor, posicoes: p.posicoes.map((x: Posicao) => ({ chave: x.chave, manterFundo: x.manterFundo })) }, passo, alcancado };
  } catch {
    return null;
  }
}
// Select nativo com a mesma cara do Input (16 px no celular para o iOS não dar zoom).
const campo =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";
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

  const { peca, tecido, cor, usaOutra, outraCor, posicoes, tecnica, tamanhos } = pedido;
  const mudar = (parcial: Partial<Pedido>) => setPedido((p) => ({ ...p, ...parcial }));
  const modelo = modeloDe(peca);
  const nomeCor = usaOutra ? outraCor.trim() || "outra, a combinar" : cor.nome;
  const numeros = new Map(posicoes.map((p, i) => [p.chave, i + 1]));
  const comQtd = tamanhos.filter((t) => t.qtd > 0);
  const total = comQtd.reduce((s, t) => s + t.qtd, 0);
  // "P 10, M 20, Infantil 4: 5" (os dois-pontos separam o tamanho infantil da quantidade).
  const listaTamanhos = comQtd.map((t) => (t.grupo === "Infantil" ? `${nomeTamanho(t)}: ${t.qtd}` : `${t.nome} ${t.qtd}`)).join(", ");
  const temArte = posicoes.some((p) => p.arte);

  // Libera as URLs das artes que saíram do pedido (trocar, remover) e do rascunho do "Cancelar";
  // ao sair da página, todas.
  // Recarregar a página (F5, puxar no celular) mantém o pedido e o passo, nesta aba; as artes não
  // (são arquivos do aparelho). O 1º efeito lê o que ficou guardado; os seguintes guardam.
  const lido = useRef(false);
  useEffect(() => {
    if (!lido.current) {
      lido.current = true;
      const salvo = lerPedido();
      if (salvo) {
        /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage só existe no navegador */
        setPedido(salvo.pedido);
        setPasso(salvo.passo);
        setAlcancado(salvo.alcancado);
        /* eslint-enable react-hooks/set-state-in-effect */
        return;
      }
    }
    try {
      const guardar = { ...pedido, cor: cor.pasta, posicoes: posicoes.map((p) => ({ chave: p.chave, manterFundo: p.manterFundo })) };
      sessionStorage.setItem(GUARDA, JSON.stringify({ pedido: guardar, passo, alcancado }));
    } catch {}
  }, [pedido, cor, posicoes, passo, alcancado]);

  const urls = useRef(new Set<string>());
  useEffect(() => {
    const usadas = new Set([pedido, antes].flatMap((p) => (p?.posicoes ?? []).flatMap((x) => (x.arte ? [x.arte.url] : []))));
    for (const u of urls.current) if (!usadas.has(u)) URL.revokeObjectURL(u);
    urls.current = usadas;
  }, [pedido, antes]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const resumo = [
    "Olá, Whim! Montei minha peça no site:",
    `• Peça: ${peca} · Cor: ${nomeCor}`,
    `• Tecido: ${tecido}`,
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
    if (!arte) return;
    // A prévia vai para o lado da posição e aproxima nela: a arte da Nuca (costas) não fica
    // escondida atrás da frente.
    setLado(ladoDe(chave));
    setFoco((f) => ({ chave, n: f.n + 1 }));
    if (!infos[arte.url]) analisarArte(arte.url).then((info) => setInfos((x) => ({ ...x, [arte.url]: info })), () => {});
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

  // Celular: a linha de passos desliza para o passo atual ficar no meio.
  const linhaRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = linhaRef.current;
    const li = ol?.querySelector<HTMLElement>(`[data-passo="${passo}"]`);
    if (!ol || !li || !ol.clientWidth) return;
    ol.scrollTo({ left: li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2, behavior: semGiro ? "auto" : "smooth" });
  }, [passo, semGiro]);

  // Ficha em PNG para a equipe da Whim, gerada ao chegar no Resumo (e a cada mudança).
  const chaveFicha =
    passo === 4
      ? JSON.stringify({
          peca,
          tecido,
          cor: cor.pasta,
          // Outra cor: a ficha diz a do pedido e em que cor está a foto.
          nomeCor: usaOutra ? `${nomeCor} (prévia em ${cor.nome})` : cor.nome,
          tecnica,
          t: listaTamanhos,
          total,
          p: posicoes.map((p) => [p.chave, p.arte?.url ?? "", p.arte?.arquivo.name ?? "", !!p.manterFundo]),
        })
      : "";
  const fichaUrl = useRef("");
  useEffect(() => {
    if (!chaveFicha) return;
    const d = JSON.parse(chaveFicha) as {
      peca: string;
      tecido: string;
      cor: string;
      nomeCor: string;
      tecnica: Tecnica;
      t: string;
      total: number;
      p: [string, string, string, boolean][];
    };
    const m = modeloDe(d.peca);
    const c = CORES.find((x) => x.pasta === d.cor) ?? CORES[0];
    let vivo = true;
    gerarFicha({
      modelo: m,
      cor: { nome: d.nomeCor, pasta: c.pasta },
      tecido: d.tecido,
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
    { nome: "Peça", pergunta: "Qual peça?", valor: `${peca} · ${tecido}`, depois: "Modelo e tecido" },
    { nome: "Cor", pergunta: "Qual cor?", valor: usaOutra ? `Outra: ${nomeCor}` : cor.nome, depois: "Na vitrine da prévia" },
    { nome: "Estampa", pergunta: "Onde vai a estampa?", valor: `${posicoes.length ? posicoes.map((p) => NOME[p.chave]).join(", ") : "A definir"} · ${tecnica}`, depois: "Posições, artes e técnica" },
    { nome: "Quantidade", pergunta: "Quantas peças?", valor: `${pecas(total)}${listaTamanhos ? ` · ${listaTamanhos}` : ""}`, depois: `A partir de ${MINIMO} peças` },
    { nome: "Resumo", pergunta: "Confira o pedido", valor: "", depois: "Ficha e WhatsApp" },
  ];
  const ultimo = passos.length - 1;
  // Resumo curto da vitrine do celular: o total de peças a partir do passo Quantidade; antes, as posições.
  const resumoDireita =
    passo >= 3 && total > 0 ? pecas(total) : posicoes.length ? `${posicoes.length} ${posicoes.length === 1 ? "posição" : "posições"}` : "";

  // Prévia com as artes: no passo Estampa (com zoom) e, depois dele, a prévia final.
  const final = alcancado > 2 && passo !== 2 && posicoes.length > 0;
  const estampa: EstampaPrevia | undefined =
    passo === 2 || final
      ? {
          lado,
          onLado: setLado,
          posicoes: posicoes.map((p) => ({ chave: p.chave, url: p.arte?.url, manterFundo: p.manterFundo })),
          tecnica,
          foco,
          final,
        }
      : undefined;

  function conteudo(i: number) {
    switch (i) {
      case 0:
        return (
          <>
            <p className="text-sm text-muted-foreground max-[600px]:hidden">Também dá para escolher direto na arara.</p>
            {/* Celular: a arara do topo vira este passo, para a vitrine ficar presa no alto (a
                margem de 4 px faz o trilho da arara ir de ponta a ponta da tela). */}
            <div className="mx-1 min-[601px]:hidden">
              <Arara selecionada={peca} cor={cor.hex} onEscolher={trocarPeca} />
            </div>
            <ToggleGroup aria-label="Peça" value={[peca]} onValueChange={escolha(trocarPeca)} className="mt-3.5 flex-wrap max-[600px]:hidden">
              {PECAS.map((p) => (
                <Opcao key={p} value={p}>{p}</Opcao>
              ))}
            </ToggleGroup>
            <label className="mt-5 grid gap-1.5">
              <span className="text-[13px] font-medium">Tecido</span>
              <select value={tecido} onChange={(e) => mudar({ tecido: e.target.value })} className={campo}>
                {TECIDOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </>
        );
      case 1:
        return (
          <>
            <p className="text-sm text-muted-foreground">As cores da vitrine são exemplos. Toque numa das camisas para ver na prévia.</p>
            <CoresVitrine modelo={modelo} cor={cor} onCor={(c) => mudar({ cor: c, usaOutra: false })} className="mt-3.5 min-[601px]:hidden" />
            <ToggleGroup
              aria-label="Cor"
              value={[usaOutra ? "outra" : "vitrine"]}
              onValueChange={escolha((v) => mudar({ usaOutra: v === "outra" }))}
              className="mt-3.5 flex-wrap"
            >
              <Opcao value="vitrine">
                {/* Cor do tecido (dado do manifesto), não cor da interface. */}
                <span aria-hidden className="size-4 rounded-full border border-primary/15" style={{ backgroundColor: cor.hex }} />
                {cor.nome}
              </Opcao>
              <Opcao value="outra">Outra cor</Opcao>
            </ToggleGroup>
            {usaOutra && (
              <label className="mt-3.5 grid gap-1.5">
                <span className="text-[13px] font-medium">Qual cor?</span>
                <Input
                  autoFocus
                  value={outraCor}
                  maxLength={40}
                  placeholder="Ex.: verde-bandeira"
                  onChange={(e) => mudar({ outraCor: e.target.value })}
                  className="h-11"
                />
                <span className="text-[13px] text-muted-foreground">A prévia continua em {cor.nome}.</span>
              </label>
            )}
            <p className="mt-3.5 flex gap-2.5 rounded-[14px] bg-muted p-3.5 text-[13px]">
              <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-accent" />
              A cor da peça é de acordo com o seu pedido.
            </p>
          </>
        );
      case 2:
        return (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="pointer-coarse:hidden">Clique onde vai a estampa.</span>
              <span className="hidden pointer-coarse:inline">Toque onde vai a estampa.</span> Dá para marcar mais de uma posição.
              Tamanho máximo da estampa: A3.
            </p>
            {aviso && (
              <p role="status" className="mt-3 rounded-[14px] bg-muted px-3.5 py-2.5 text-[13px]">
                {aviso}
              </p>
            )}
            <div className="mt-3.5">
              <EscolhaPosicoes modelo={modelo} cor={cor} numeros={numeros} onAlternar={alternar} />
            </div>
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
                  alt={`Ficha da estampa: ${peca}, ${nomeCor}, ${tecido}, ${tecnica}, ${posicoes.length} ${posicoes.length === 1 ? "posição" : "posições"}`}
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
              <li>
                <span className="pointer-coarse:hidden">Clique</span>
                <span className="hidden pointer-coarse:inline">Toque</span> em Pedir orçamento no WhatsApp.
              </li>
              <li>Na conversa, anexe a ficha{temArte ? " e as artes" : ""}.</li>
            </ol>
            <div className="mt-3.5 grid gap-1 rounded-[14px] bg-muted p-3.5 text-[13px]">
              <p>
                <span className="font-semibold">Prazo de produção:</span> 20 a 30 dias, conforme quantidade e modelo.
              </p>
              <p>Quem responde é a equipe da Whim.</p>
            </div>
            {/* Sem pedir dados: os dados ficam no formulário de Contato, embaixo. O clique conta como
                conversão (contato_whatsapp + orcamento_personalizador) pelo ouvinte do medicao.tsx. */}
            <a
              href={linkWhatsApp(resumo)}
              target="_blank"
              rel="noopener noreferrer"
              // No celular ocupa a largura do cartão e quebra a linha se não couber (telas de 320 px).
              className={cn(buttonVariants({ size: "xl" }), "mt-3.5 h-auto min-h-12 w-full gap-2 px-3.5 py-3 text-center tracking-normal whitespace-normal has-data-[icon=inline-end]:pr-3.5 max-[600px]:hidden min-[601px]:w-auto min-[601px]:gap-2.5 min-[601px]:px-6 min-[601px]:tracking-[0.02em] min-[601px]:has-data-[icon=inline-end]:pr-5")}
            >
              Pedir orçamento no WhatsApp <Seta />
            </a>
          </>
        );
    }
  }

  return (
    <section
      id="personalizar"
      // --vitrine: altura da vitrine presa do celular (270 px, menos em telas baixas).
      className="scroll-mt-24 pt-[132px] [--vitrine:clamp(170px,32svh,270px)] max-[600px]:pt-[calc(env(safe-area-inset-top)+82px)] sm:pt-[168px]"
    >
      <Container className={cn("pb-3 max-[600px]:p-0 sm:pb-8", LARGO)}>
        <Titulo as="h1" className="max-[600px]:sr-only">
          Escolha na arara <Destaque>e personalize.</Destaque>
        </Titulo>

        {/* Arara: um clique ou toque já escolhe a peça (no começo, leva ao passo da cor). No
            celular ela fica no passo Peça. */}
        <div className="mt-10 max-[600px]:hidden">
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

      <Container
        className={cn(
          "grid items-start gap-8 pt-3 pb-7 max-[600px]:block max-[600px]:p-0 sm:pt-8 sm:pb-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-[clamp(20px,4vw,48px)] min-[112.5rem]:grid-cols-2 min-[112.5rem]:gap-16",
          LARGO
        )}
      >
        {/* PC: a vitrine tem a altura da ficha (até a altura da tela; nunca menos que 4/5 da
            largura) e fica parada ao rolar os passos longos: não sobra vão embaixo dela, nem
            com zoom de 50% (pedido do Gabriel, 17/11 noite). */}
        {/* Celular: vitrine e linha de passos presas embaixo da barra; quando a barra some (rolando
            para baixo), sobem junto com ela. A faixa branca de cima cobre o que rola por trás da barra. */}
        <div className={cn("min-w-0 @container lg:self-stretch", PRESA)}>
          <div ref={previaRef} className={cn("lg:h-[min(100%,100svh-8rem)] lg:min-h-[max(30rem,min(125cqw,100svh-8rem))] max-[600px]:relative", FIXA)}>
            <PreviaPeca modelo={modelo} cor={cor} onCor={(c) => mudar({ cor: c, usaOutra: false })} estampa={estampa} />
            <p className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-3 rounded-[14px] bg-background/92 px-3 py-2 text-xs min-[601px]:hidden">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{peca}</span> · {nomeCor}
                {alcancado >= 2 || passo >= 2 ? ` · ${tecnica}` : ""}
              </span>
              {resumoDireita && <span className="shrink-0 tabular-nums">{resumoDireita}</span>}
            </p>
          </div>
          <nav aria-label="Passos" className="mt-2.5 min-[601px]:hidden">
            <ol ref={linhaRef} className="relative -mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {passos.map((p, i) => {
                const estado = i === passo ? "atual" : i < alcancado ? "feito" : "depois";
                const miolo = (
                  <>
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
                        estado === "feito" ? "bg-primary text-primary-foreground" : estado === "atual" ? "bg-accent text-primary" : "bg-muted text-foreground"
                      )}
                    >
                      {estado === "feito" ? <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    {p.nome}
                  </>
                );
                const chip = cn(
                  "flex h-11 shrink-0 items-center gap-1.5 rounded-full border pr-3.5 pl-2 text-[13px] whitespace-nowrap",
                  estado === "atual" ? "border-transparent bg-accent/16 font-semibold" : "border-primary/12 font-medium text-muted-foreground"
                );
                return (
                  <li key={p.nome} data-passo={i} aria-current={estado === "atual" ? "step" : undefined}>
                    {estado === "feito" ? (
                      // Tocar num passo feito volta para ele (como o "Alterar" do PC).
                      <button type="button" onClick={() => abrir(i)} aria-label={`${p.nome}, feito: voltar para este passo`} className={cn(chip, "outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}>
                        {miolo}
                      </button>
                    ) : (
                      <span className={chip}>
                        {miolo}
                        {estado === "depois" && <span className="sr-only">, ainda não</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Ficha do pedido: 5 passos numa linha vertical (feito, atual, depois). */}
        {/* No PC, os textos do pedido ficam 8% maiores (pedido do Gabriel, 17/11 à noite): o zoom
            aumenta tudo da coluna por igual e a largura dela continua a mesma. */}
        <div className="min-w-0 max-[600px]:px-4 max-[600px]:pt-4 lg:[zoom:1.08]">
          <h2 className="text-xl font-semibold max-[600px]:sr-only min-[601px]:text-2xl">Seu pedido</h2>
          <p className="mt-1 text-sm text-muted-foreground max-[600px]:sr-only">Monte em 5 passos e receba o orçamento pelo WhatsApp.</p>
          {/* Celular: só o passo atual aparece (os outros estão na linha de passos, lá em cima). */}
          <ol aria-label="Passos do pedido" className="mt-6 max-[600px]:mt-0">
            {passos.map((p, i) => {
              const estado = i === passo ? "atual" : i < alcancado ? "feito" : "depois";
              return (
                <li
                  key={p.nome}
                  aria-current={estado === "atual" ? "step" : undefined}
                  data-estado={estado}
                  className={cn("grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 max-[600px]:block min-[601px]:grid-cols-[30px_minmax(0,1fr)] min-[601px]:gap-x-4", estado !== "atual" && "max-[600px]:hidden")}
                >
                  <div className="flex flex-col items-center max-[600px]:hidden">
                    <span
                      className={cn(
                        "grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums min-[601px]:size-[30px] min-[601px]:text-[13px]",
                        estado === "feito" && "bg-primary text-primary-foreground",
                        estado === "atual" && "border-2 border-accent bg-background",
                        estado === "depois" && "border border-primary/18 text-muted-foreground"
                      )}
                    >
                      {estado === "feito" ? <CheckIcon role="img" aria-label="feito" className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    {i < ultimo && (
                      <span aria-hidden className={cn("min-h-4 w-0.5 flex-1", estado === "feito" ? "bg-primary" : "bg-primary/14")} />
                    )}
                  </div>

                  <div className={cn("min-w-0", i < ultimo && "pb-5 max-[600px]:pb-0")}>
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
                        {/* Celular: a pergunta do passo; a página rola até ela abaixo da vitrine presa. */}
                        <p
                          ref={tituloRef}
                          tabIndex={-1}
                          className="scroll-mt-28 pt-0.5 font-semibold outline-none max-[600px]:scroll-mt-[calc(env(safe-area-inset-top)+var(--vitrine)+158px)] max-[600px]:text-lg max-[600px]:font-bold min-[601px]:pt-1"
                        >
                          <span className="max-[600px]:hidden">{p.nome}</span>
                          <span className="hidden max-[600px]:inline">{p.pergunta}</span>
                        </p>
                        {/* Celular: sem o cartão; a altura mínima deixa a barra de ações no pé da tela. */}
                        <div className="mt-3 rounded-[18px] border border-primary/12 bg-background p-4 shadow-sm max-[600px]:mt-1 max-[600px]:flex max-[600px]:min-h-[calc(100svh-env(safe-area-inset-top)-var(--vitrine)-200px)] max-[600px]:flex-col max-[600px]:rounded-none max-[600px]:border-0 max-[600px]:p-0 max-[600px]:shadow-none min-[601px]:p-5">
                          {conteudo(i)}
                          {/* Celular: Voltar e Continuar presos no pé da tela, dizendo o próximo passo. */}
                          <div data-barra-acoes className={cn("mt-5 flex gap-2.5", BARRA)}>
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
                                  <Button variant="outline" size="xl" onClick={() => abrir(i - 1)} className="flex-none max-[600px]:px-5">
                                    {/* No último passo do celular, só a seta: o botão do WhatsApp precisa da largura. */}
                                    {i === ultimo && <ArrowLeftIcon aria-hidden className="hidden max-[600px]:block" />}
                                    <span className={cn(i === ultimo && "max-[600px]:sr-only")}>Voltar</span>
                                  </Button>
                                )}
                                {i < ultimo && (
                                  <Button size="xl" onClick={continuar} className="flex-1 min-[601px]:ml-auto min-[601px]:flex-none">
                                    <span>
                                      Continuar<span className="min-[601px]:hidden"> · {passos[i + 1].nome}</span>
                                    </span>{" "}
                                    <Seta />
                                  </Button>
                                )}
                                {i === ultimo && (
                                  <a
                                    href={linkWhatsApp(resumo)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(buttonVariants({ size: "xl" }), "h-auto min-h-12 flex-1 gap-2 px-3.5 py-3 text-center tracking-normal whitespace-normal has-data-[icon=inline-end]:pr-3.5 min-[601px]:hidden")}
                                  >
                                    Pedir orçamento no WhatsApp <Seta />
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {estado === "depois" && (
                      <p className="pt-0.5 min-[601px]:pt-1">
                        {/* Só o nome esmaece; o texto cinza fica cheio para o contraste de 4,5:1. */}
                        <span className="font-medium opacity-75">{p.nome}</span>
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
    </section>
  );
}

// Telas grandes (27" Full HD e 2K): a página abre mais em vez de ficar no meio com sobra dos lados.
const LARGO = "min-[112.5rem]:max-w-[1520px]"; // a partir de 1800 px; o Contato usa o mesmo
// Parada ao rolar só quando cabe inteira (a vitrine tem no mínimo 30rem e no máximo a tela − 8rem).
const FIXA = "lg:[@media(min-height:640px)]:sticky lg:top-24";
// Celular: o bloco da vitrine preso logo abaixo da barra (82 px) e, quando a barra some ao rolar
// para baixo, no topo; só em telas com altura para isso. A faixa de cima (::before) cobre o vão.
const PRESA = cn(
  "max-[600px]:relative max-[600px]:top-[calc(env(safe-area-inset-top)+82px)] max-[600px]:z-30 max-[600px]:bg-background max-[600px]:px-3 max-[600px]:pb-2.5",
  "max-[600px]:shadow-[0_14px_20px_-18px] max-[600px]:shadow-primary/50 max-[600px]:transition-[top] max-[600px]:duration-300 max-[600px]:ease-out motion-reduce:transition-none",
  "max-[600px]:[@media(min-height:560px)]:sticky max-[600px]:[body:has(header[data-oculta]:not(:focus-within))_&]:top-[env(safe-area-inset-top)]",
  "max-[600px]:before:absolute max-[600px]:before:inset-x-0 max-[600px]:before:bottom-full max-[600px]:before:h-[calc(env(safe-area-inset-top)+82px)] max-[600px]:before:bg-background"
);
// Celular: a barra de Voltar/Continuar presa no pé da tela (acima da área segura).
const BARRA = cn(
  "max-[600px]:sticky max-[600px]:bottom-0 max-[600px]:z-20 max-[600px]:-mx-4 max-[600px]:mt-auto max-[600px]:bg-background max-[600px]:px-4 max-[600px]:pt-3",
  "max-[600px]:pb-[calc(env(safe-area-inset-bottom)+0.75rem)] max-[600px]:shadow-[0_-12px_22px_-18px] max-[600px]:shadow-primary/55"
);

const QTD_DIGITOS = 5;

function Opcao(props: React.ComponentProps<typeof ToggleGroupItem>) {
  return (
    <ToggleGroupItem
      variant="outline"
      className="h-auto min-h-11 rounded-[14px] px-4 text-[13.5px] aria-pressed:border-primary"
      {...props}
    />
  );
}

/**
 * Tamanhos com quantidade: − número +, nos grupos Adulto e Infantil (as quantidades dos dois
 * somam no total), e "Adicionar outro tamanho" no grupo aberto (removível).
 */
function Tamanhos({ tamanhos, onTamanhos }: { tamanhos: Tamanho[]; onTamanhos: (t: Tamanho[]) => void }) {
  const [grupo, setGrupo] = useState<Grupo>("Adulto");
  const [novo, setNovo] = useState<string | null>(null);
  const nomeNovo = novo?.trim() ?? "";
  const repetido = tamanhos.some((t) => t.grupo === grupo && t.nome.toLowerCase() === nomeNovo.toLowerCase());
  const mudarQtd = (i: number, qtd: number) => onTamanhos(tamanhos.map((t, j) => (j === i ? { ...t, qtd: Math.max(0, Math.min(10 ** QTD_DIGITOS - 1, qtd)) } : t)));
  const soma = (g: Grupo) => tamanhos.reduce((s, t) => s + (t.grupo === g ? t.qtd : 0), 0);

  return (
    <div className="mt-3.5">
      <ToggleGroup
        aria-label="Grupo de tamanhos"
        value={[grupo]}
        onValueChange={(v: string[]) => {
          if (!v[0]) return;
          setGrupo(v[0] as Grupo);
          setNovo(null);
        }}
        className="flex-wrap"
      >
        {(Object.keys(GRADES) as Grupo[]).map((g) => (
          <Opcao key={g} value={g}>
            {g}
            {soma(g) > 0 && <span className="text-muted-foreground tabular-nums">· {soma(g)}</span>}
          </Opcao>
        ))}
      </ToggleGroup>
      <ul aria-label={`Tamanhos ${grupo.toLowerCase()}`} className="mt-3 grid gap-2">
        {tamanhos.map((t, i) =>
          t.grupo !== grupo ? null : (
            <li key={nomeTamanho(t)} className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.nome}</p>
                {t.extra && (
                  <Button variant="link" onClick={() => onTamanhos(tamanhos.filter((_, j) => j !== i))} aria-label={`Remover tamanho ${nomeTamanho(t)}`} className="-ml-2 h-auto min-h-11 px-2 text-[13px]">
                    Remover
                  </Button>
                )}
              </div>
              <Button variant="outline" size="icon-lg" aria-label={`Menos ${nomeTamanho(t)}`} disabled={t.qtd === 0} onClick={() => mudarQtd(i, t.qtd - 1)} className="size-11 rounded-full">
                <MinusIcon />
              </Button>
              <Input
                aria-label={`Quantidade ${nomeTamanho(t)}`}
                inputMode="numeric"
                value={String(t.qtd)}
                maxLength={QTD_DIGITOS}
                // Só dígitos, até 5 (99.999 peças): número longo virava "1e+25" e não cabia no campo.
                onChange={(e) => mudarQtd(i, Number(e.target.value.replace(/\D/g, "").slice(0, QTD_DIGITOS)) || 0)}
                className="h-11 w-16 px-1 text-center tabular-nums"
              />
              <Button variant="outline" size="icon-lg" aria-label={`Mais ${nomeTamanho(t)}`} onClick={() => mudarQtd(i, t.qtd + 1)} className="size-11 rounded-full">
                <PlusIcon />
              </Button>
            </li>
          )
        )}
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
            onTamanhos([...tamanhos, { grupo, nome: nomeNovo, qtd: 0, extra: true }]);
            setNovo(null);
          }}
        >
          <Input
            autoFocus
            aria-label={`Nome do tamanho ${grupo.toLowerCase()}`}
            placeholder={grupo === "Adulto" ? "Ex.: G4" : "Ex.: 1"}
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
