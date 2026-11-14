"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";

import { Arara, CORES, MODELOS } from "@/components/arara";
import { Container, Destaque, Eyebrow, Seta, Titulo } from "@/components/blocos";
import { PreviaPeca } from "@/components/previa-peca";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const PECAS = MODELOS.map((m) => m.nome);
// As cores do tecido vêm do manifesto da arara (CORES), as mesmas dos quadros pintados.
const LOCAIS = ["Frente", "Costas", "Frente e costas"];
const TECNICAS = ["Silk", "DTF", "Bordado", "Ainda não sei"];
const MINIMO = 50;

export function Personalizador() {
  const [peca, setPeca] = useState(PECAS[0]);
  const [cor, setCor] = useState(CORES[1]);
  const [local, setLocal] = useState(LOCAIS[0]);
  const [tecnica, setTecnica] = useState(TECNICAS[0]);
  const [tamanhos, setTamanhos] = useState("P, M, G, GG");
  const [quantidade, setQuantidade] = useState(String(MINIMO));
  const [passo, setPasso] = useState(0);

  const modelo = MODELOS.find((m) => m.nome === peca) ?? MODELOS[0];
  const abaixoDoMinimo = Number(quantidade) < MINIMO;
  const resumo = [
    "Olá, Whim! Montei minha peça no site:",
    `• Peça: ${peca}`,
    `• Cor: ${cor.nome}`,
    `• Estampa: ${local} · ${tecnica}`,
    `• Tamanhos: ${tamanhos}`,
    `• Quantidade: ${quantidade}`,
    "Podem me passar o orçamento?",
  ].join("\n");

  // ToggleGroup deixa desmarcar tudo; ignoramos o valor vazio para sempre ter uma escolha.
  const escolha = (set: (v: string) => void) => (v: string[]) => v[0] && set(v[0]);

  // Ficha do pedido: nome do passo, o valor quando feito e o texto de quando ainda vem depois.
  const passos = [
    { nome: "Peça", valor: peca, depois: "Modelo da arara" },
    { nome: "Cor", valor: cor.nome, depois: "Na vitrine da prévia" },
    { nome: "Estampa", valor: `${local} · ${tecnica}`, depois: "Local e técnica" },
    { nome: "Quantidade", valor: `${quantidade} peças · ${tamanhos}`, depois: `A partir de ${MINIMO} peças` },
    { nome: "Resumo", valor: "", depois: "Enviar pelo WhatsApp" },
  ];
  const ultimo = passos.length - 1;

  function conteudo(i: number) {
    switch (i) {
      case 0:
        return (
          <>
            <p className="text-sm text-muted-foreground">Também dá para escolher direto na arara.</p>
            <ToggleGroup aria-label="Peça" value={[peca]} onValueChange={escolha(setPeca)} className="mt-3.5 flex-wrap">
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
            <ToggleGroup aria-label="Local da estampa" value={[local]} onValueChange={escolha(setLocal)} className="mt-3.5 flex-wrap">
              {LOCAIS.map((l) => (
                <Opcao key={l} value={l}>{l}</Opcao>
              ))}
            </ToggleGroup>
            <ToggleGroup aria-label="Técnica" value={[tecnica]} onValueChange={escolha(setTecnica)} className="mt-2.5 flex-wrap">
              {TECNICAS.map((t) => (
                <Opcao key={t} value={t}>{t}</Opcao>
              ))}
            </ToggleGroup>
            <p className="mt-3.5 rounded-[14px] border border-dashed p-4 text-center text-[13px] text-muted-foreground">
              A arte (PNG, PDF ou AI) você manda pelo WhatsApp junto com o resumo.
            </p>
          </>
        );
      case 3:
        return (
          <>
            <p className="text-sm text-muted-foreground">
              Pedido mínimo de {MINIMO} peças. Prazo de produção de 20 a 30 dias, conforme quantidade e modelo.
            </p>
            <FieldGroup className="mt-3.5">
              <Field>
                <FieldLabel htmlFor="p-tamanhos">Tamanhos</FieldLabel>
                <Input id="p-tamanhos" value={tamanhos} onChange={(e) => setTamanhos(e.target.value)} className="h-11" />
              </Field>
              <Field data-invalid={abaixoDoMinimo || undefined}>
                <FieldLabel htmlFor="p-quantidade">Quantidade</FieldLabel>
                <Input
                  id="p-quantidade"
                  type="number"
                  inputMode="numeric"
                  min={MINIMO}
                  value={quantidade}
                  aria-invalid={abaixoDoMinimo || undefined}
                  aria-describedby="p-quantidade-ajuda"
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="h-11"
                />
                <FieldDescription id="p-quantidade-ajuda">
                  {abaixoDoMinimo ? `O mínimo é ${MINIMO} peças.` : `A partir de ${MINIMO} peças.`}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </>
        );
      default:
        return (
          <>
            <p className="rounded-2xl bg-muted p-[18px] text-sm whitespace-pre-wrap">{resumo}</p>
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

          {/* Arara: atalho para a escolha da peça (leva direto ao passo da cor). */}
          <div className="mt-10">
            <Arara
              selecionada={peca}
              cor={cor.hex}
              onEscolher={(p) => {
                setPeca(p);
                setPasso(1);
              }}
            />
          </div>
        </Container>
      </section>

      <Container className="grid items-start gap-8 pt-3 pb-7 sm:pt-8 sm:pb-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-[clamp(20px,4vw,48px)]">
        <PreviaPeca modelo={modelo} cor={cor} onCor={setCor} />

        {/* Ficha do pedido: 5 passos numa linha vertical (feito, atual, depois). */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold min-[601px]:text-2xl">Seu pedido</h2>
          <p className="mt-1 text-sm text-muted-foreground">Monte em 5 passos e receba o orçamento pelo WhatsApp.</p>
          <ol aria-label="Passos do pedido" className="mt-6">
            {passos.map((p, i) => {
              const estado = i < passo ? "feito" : i === passo ? "atual" : "depois";
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
                        <Button variant="link" onClick={() => setPasso(i)} aria-label={`Alterar ${p.nome.toLowerCase()}`} className="-mt-2 min-h-11 px-2">
                          Alterar
                        </Button>
                      </div>
                    )}
                    {estado === "atual" && (
                      <>
                        <p className="pt-0.5 font-semibold min-[601px]:pt-1">{p.nome}</p>
                        <div className="mt-3 rounded-[18px] border border-primary/12 bg-background p-4 shadow-sm min-[601px]:p-5">
                          {conteudo(i)}
                          <div className="mt-5 flex gap-2.5">
                            {i > 0 && (
                              <Button variant="outline" size="xl" onClick={() => setPasso(i - 1)} className="flex-1 min-[601px]:flex-none">
                                Voltar
                              </Button>
                            )}
                            {i < ultimo && (
                              <Button size="xl" onClick={() => setPasso(i + 1)} className="flex-[2] min-[601px]:ml-auto min-[601px]:flex-none">
                                Continuar <Seta />
                              </Button>
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
