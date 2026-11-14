"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckIcon, InfoIcon, MinusIcon, PlusIcon, UploadIcon } from "lucide-react";

import { Arara, CORES, MODELOS, usePoucoMovimento, type Cor } from "@/components/arara";
import { Container, Destaque, Eyebrow, Seta, Titulo } from "@/components/blocos";
import { PreviaPeca, type EstampaPrevia, type LadoEstampa } from "@/components/previa-peca";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { areaDe, type Lado } from "@/lib/estampa";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const PECAS = MODELOS.map((m) => m.nome);
// As cores do tecido vêm do manifesto da arara (CORES), as mesmas dos quadros pintados.
const LOCAIS = ["Frente", "Costas", "Frente e costas"];
const TECNICAS = ["Silk", "DTF", "Bordado", "Ainda não sei"];
const MINIMO = 50;

// Posições do nicho (referencia/previa-cor/README-estampa.md, 2.1); as chaves são as de
// manifest.pecas[].areasEstampa. "Esquerdo" é o lado de quem veste (à direita de quem olha).
const POSICOES: Record<Lado, [string, string][]> = {
  frente: [
    ["peito-esquerdo", "Peito esquerdo"],
    ["peito-direito", "Peito direito"],
    ["centro-peito", "Centro do peito"],
    ["frente-inteira", "Frente inteira"],
  ],
  costas: [
    ["nuca", "Nuca"],
    ["costas-em-cima", "Costas em cima"],
    ["costas-inteira", "Costas inteira"],
  ],
};
const MANGAS: [string, string][] = [
  ["manga-esquerda", "Manga esquerda"],
  ["manga-direita", "Manga direita"],
];
const PADRAO: Record<Lado, string> = { frente: "peito-esquerdo", costas: "costas-inteira" };
const NOME = Object.fromEntries([...POSICOES.frente, ...POSICOES.costas, ...MANGAS]);

const ARTE_TIPOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ARTE_MAX = 10 * 1024 * 1024;

type Tamanho = { nome: string; qtd: number; extra?: boolean };
type Arte = { arquivo: File; url: string }; // URL local (blob:), só no navegador
type Pedido = {
  peca: string;
  cor: Cor;
  local: string;
  posicao: Record<Lado, string>;
  mangas: string[];
  artes: Partial<Record<Lado, Arte>>; // só para a prévia, nada vai para servidor
  tecnica: string;
  tamanhos: Tamanho[];
};

const INICIAL: Pedido = {
  peca: PECAS[0],
  cor: CORES[1],
  local: LOCAIS[0],
  posicao: PADRAO,
  mangas: [],
  artes: {},
  tecnica: TECNICAS[0],
  tamanhos: ["P", "M", "G", "GG"].map((nome) => ({ nome, qtd: 0 })),
};

const modeloDe = (peca: string) => MODELOS.find((m) => m.nome === peca) ?? MODELOS[0];
const temArea = (peca: string, chave: string) => areaDe(modeloDe(peca), chave) !== undefined;

export function Personalizador() {
  const [pedido, setPedido] = useState(INICIAL);
  const [passo, setPasso] = useState(0);
  const [alcancado, setAlcancado] = useState(0); // passo mais longe já atingido
  const [antes, setAntes] = useState<Pedido | null>(null); // para "Cancelar" a edição de um passo feito
  const [lado, setLado] = useState<Lado>("frente"); // lado na prévia do passo Estampa
  const [aviso, setAviso] = useState("");
  const tituloRef = useRef<HTMLParagraphElement>(null);
  const focar = useRef(false);
  const semGiro = usePoucoMovimento();

  const { peca, cor, local, posicao, mangas, artes, tecnica, tamanhos } = pedido;
  const mudar = (parcial: Partial<Pedido>) => setPedido((p) => ({ ...p, ...parcial }));
  const modelo = modeloDe(peca);
  const urlFrente = artes.frente?.url;
  const urlCostas = artes.costas?.url;

  // Libera as URLs das artes que saíram do pedido (trocar, remover) e do rascunho do "Cancelar";
  // ao sair da página, todas.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const usadas = new Set([pedido, antes].flatMap((p) => Object.values(p?.artes ?? {}).flatMap((a) => (a ? [a.url] : []))));
    for (const u of urls.current) if (!usadas.has(u)) URL.revokeObjectURL(u);
    urls.current = usadas;
  }, [pedido, antes]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const temFrente = local !== "Costas";
  const temCostas = local !== "Frente";
  const temMangas = MANGAS.some(([k]) => temArea(peca, k));
  const usaArteFrente = temFrente || mangas.length > 0; // as mangas usam a arte da frente
  const temArte = (usaArteFrente && !!artes.frente) || (temCostas && !!artes.costas);
  const comQtd = tamanhos.filter((t) => t.qtd > 0);
  const total = comQtd.reduce((s, t) => s + t.qtd, 0);
  const listaTamanhos = comQtd.map((t) => `${t.nome} ${t.qtd}`).join(", ");

  const ondeEstampa = [temFrente && `frente (${NOME[posicao.frente]})`, temCostas && `costas (${NOME[posicao.costas]})`]
    .filter(Boolean)
    .join(" e ");
  const estampaTexto = `${ondeEstampa.charAt(0).toUpperCase()}${ondeEstampa.slice(1)} · ${tecnica}`;
  const resumo = [
    "Olá, Whim! Montei minha peça no site:",
    `• Peça: ${peca}`,
    `• Cor: ${cor.nome}`,
    `• Estampa: ${estampaTexto}`,
    mangas.length > 0 && `• Mangas: ${mangas.map((k) => NOME[k]).join(", ")}`,
    temArte && "• Arte: vou anexar aqui na conversa",
    `• Tamanhos: ${listaTamanhos || "a definir"}`,
    `• Total: ${total} peças`,
    "Podem me passar o orçamento?",
  ]
    .filter(Boolean)
    .join("\n");

  // Trocar a peça mantém cor, estampa e tamanhos; posição que a peça nova não tem volta ao padrão.
  function trocarPeca(nova: string) {
    const notas: string[] = [];
    const pos = { ...posicao };
    for (const l of ["frente", "costas"] as const)
      if (!temArea(nova, pos[l])) {
        if (l === "frente" ? temFrente : temCostas)
          notas.push(`não tem ${NOME[pos[l]].toLowerCase()}: a posição ${l === "frente" ? "da frente" : "das costas"} voltou para ${NOME[PADRAO[l]]}`);
        pos[l] = PADRAO[l];
      }
    const mangasOk = mangas.filter((k) => temArea(nova, k));
    if (mangasOk.length < mangas.length) notas.push("não tem mangas: a estampa nas mangas saiu");
    setAviso(notas.length ? `${nova} ${notas.join("; ")}.` : "");
    mudar({ peca: nova, posicao: pos, mangas: mangasOk });
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

  // Foco no título do passo aberto; no celular a página rola até ele.
  useEffect(() => {
    const el = tituloRef.current;
    if (!focar.current || !el) return;
    focar.current = false;
    const celular = matchMedia("(max-width: 1023px)").matches;
    el.focus({ preventScroll: celular });
    if (celular) el.scrollIntoView({ block: "start", behavior: semGiro ? "auto" : "smooth" });
  }, [passo, semGiro]);

  // Ficha do pedido: nome do passo, o valor quando feito e o texto de quando ainda vem depois.
  const passos = [
    { nome: "Peça", valor: peca, depois: "Modelo da arara" },
    { nome: "Cor", valor: cor.nome, depois: "Na vitrine da prévia" },
    { nome: "Estampa", valor: `${estampaTexto}${mangas.length ? " + mangas" : ""}`, depois: "Local, posição e arte" },
    { nome: "Quantidade", valor: `${total} peças${listaTamanhos ? ` · ${listaTamanhos}` : ""}`, depois: `A partir de ${MINIMO} peças` },
    { nome: "Resumo", valor: "", depois: "Enviar pelo WhatsApp" },
  ];
  const ultimo = passos.length - 1;

  // Prévia no passo Estampa: o que cada lado mostra e onde o zoom aproxima.
  const ladoEstampa = (l: Lado): LadoEstampa => {
    const ativo = l === "frente" ? temFrente : temCostas;
    const areas = [...(ativo ? [posicao[l]] : []), ...(l === "frente" ? mangas : [])];
    return { areas, foco: areas[0] ?? (l === "frente" ? "frente-inteira" : "costas-inteira"), arte: l === "frente" ? urlFrente : urlCostas };
  };
  const estampa: EstampaPrevia | undefined =
    passo === 2 ? { lado, onLado: setLado, frente: ladoEstampa("frente"), costas: ladoEstampa("costas") } : undefined;

  const avisoArte = (
    <p className="mt-3.5 flex gap-2.5 rounded-[14px] bg-muted p-3.5 text-[13px]">
      <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-accent" />
      A arte aqui é só para a prévia. Na hora de enviar o pedido pelo WhatsApp, anexe o arquivo na conversa.
    </p>
  );

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
            <p className="text-sm text-muted-foreground">Onde e como vamos estampar.</p>
            {aviso && (
              <p role="status" className="mt-3 rounded-[14px] bg-muted px-3.5 py-2.5 text-[13px]">
                {aviso}
              </p>
            )}
            <Grupo rotulo="Lado">
              <ToggleGroup
                aria-label="Lado"
                value={[local]}
                onValueChange={escolha((v) => {
                  mudar({ local: v });
                  if (v !== "Frente e costas") setLado(v === "Frente" ? "frente" : "costas");
                })}
                className="flex-wrap"
              >
                {LOCAIS.map((l) => (
                  <Opcao key={l} value={l}>{l}</Opcao>
                ))}
              </ToggleGroup>
            </Grupo>
            {(["frente", "costas"] as const).map(
              (l) =>
                (l === "frente" ? temFrente : temCostas) && (
                  <Grupo key={l} rotulo={l === "frente" ? "Posição na frente" : "Posição nas costas"}>
                    <ToggleGroup
                      aria-label={l === "frente" ? "Posição na frente" : "Posição nas costas"}
                      value={[posicao[l]]}
                      onValueChange={escolha((v) => {
                        mudar({ posicao: { ...posicao, [l]: v } });
                        setLado(l);
                      })}
                      className="flex-wrap"
                    >
                      {POSICOES[l]
                        .filter(([k]) => temArea(peca, k))
                        .map(([k, nome]) => (
                          <Opcao key={k} value={k}>{nome}</Opcao>
                        ))}
                    </ToggleGroup>
                  </Grupo>
                )
            )}
            {temMangas && (
              <Grupo rotulo="Mangas (opcional)">
                <div className="flex flex-wrap gap-x-5">
                  {MANGAS.map(([k, nome]) => (
                    <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13.5px]">
                      <Checkbox
                        checked={mangas.includes(k)}
                        onCheckedChange={(marcada) => {
                          mudar({ mangas: marcada ? [...mangas, k] : mangas.filter((m) => m !== k) });
                          setLado("frente");
                        }}
                        className="size-5"
                      />
                      {nome}
                    </label>
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground">As mangas usam a arte da frente.</p>
              </Grupo>
            )}
            <Grupo rotulo="Técnica">
              <ToggleGroup aria-label="Técnica" value={[tecnica]} onValueChange={escolha((v) => mudar({ tecnica: v }))} className="flex-wrap">
                {TECNICAS.map((t) => (
                  <Opcao key={t} value={t}>{t}</Opcao>
                ))}
              </ToggleGroup>
            </Grupo>
            <div className="mt-5 grid gap-4">
              {usaArteFrente && (
                <CampoArte id="arte-frente" rotulo="Arte da frente" arte={artes.frente} onArte={(a) => mudar({ artes: { ...artes, frente: a } })} />
              )}
              {temCostas && (
                <CampoArte id="arte-costas" rotulo="Arte das costas" arte={artes.costas} onArte={(a) => mudar({ artes: { ...artes, costas: a } })} />
              )}
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">PNG com fundo transparente fica melhor.</p>
            {avisoArte}
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
                <span className="tabular-nums">{total} peças</span>
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
            <p className="rounded-2xl bg-muted p-[18px] text-sm whitespace-pre-wrap">{resumo}</p>
            {temArte && avisoArte}
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

          {/* Arara: atalho para a escolha da peça (no começo, leva direto ao passo da cor). */}
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
              }}
            />
          </div>
        </Container>
      </section>

      <Container className="grid items-start gap-8 pt-3 pb-7 sm:pt-8 sm:pb-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-[clamp(20px,4vw,48px)]">
        <PreviaPeca modelo={modelo} cor={cor} onCor={(c) => mudar({ cor: c })} estampa={estampa} />

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
                  className="grid grid-cols-[26px_1fr] gap-x-3.5 min-[601px]:grid-cols-[30px_1fr] min-[601px]:gap-x-4"
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

function Grupo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 grid gap-2">
      <p className="text-[13px] font-medium">{rotulo}</p>
      {children}
    </div>
  );
}

/** Campo da arte: arrastar e soltar no PC, tocar para escolher no celular. Só fica no navegador. */
function CampoArte({ id, rotulo, arte, onArte }: { id: string; rotulo: string; arte?: Arte; onArte: (a?: Arte) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");
  const [sobre, setSobre] = useState(false);

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
      id={id}
      type="file"
      accept={ARTE_TIPOS.join(",")}
      className="sr-only"
      onChange={(e) => {
        escolher(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  return (
    <div>
      {arte ? (
        <div className="rounded-[14px] border border-primary/12 p-2.5">
          <p className="mb-2 text-[13px] font-medium">{rotulo}</p>
          <div className="flex items-center gap-3">
            <Image src={arte.url} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-lg bg-muted object-contain" />
            <p className="min-w-0 flex-1 truncate text-sm">{arte.arquivo.name}</p>
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()} aria-label={`Trocar ${rotulo.toLowerCase()}`} className="min-h-11 flex-1">
              Trocar
            </Button>
            <Button variant="ghost" onClick={() => onArte(undefined)} aria-label={`Remover ${rotulo.toLowerCase()}`} className="min-h-11 flex-1">
              Remover
            </Button>
          </div>
          {input}
        </div>
      ) : (
        <label
          htmlFor={id}
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
            "flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-primary/25 p-4 text-center text-[13px] text-muted-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            sobre && "border-accent bg-accent/10"
          )}
        >
          <span className="font-medium text-foreground">{rotulo}</span>
          <UploadIcon aria-hidden className="my-0.5 size-5" />
          <span className="pointer-coarse:hidden">Arraste a arte aqui ou clique para escolher</span>
          <span className="hidden pointer-coarse:inline">Toque para escolher a arte</span>
          {input}
        </label>
      )}
      {erro && (
        <p role="alert" className="mt-1.5 text-[13px] text-destructive">
          {erro}
        </p>
      )}
    </div>
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
