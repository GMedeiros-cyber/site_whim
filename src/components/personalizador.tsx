"use client";

import { useState } from "react";

import { Arara, MODELOS } from "@/components/arara";
import { Container, Destaque, Eyebrow, Seta, Titulo } from "@/components/blocos";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const PECAS = MODELOS.map((m) => m.nome);
// Cores do TECIDO oferecidas pela Whim: são dados do produto (pintam a peça na
// prévia), não cores da interface; por isso ficam em hex aqui.
const CORES = [
  { nome: "Branco", hex: "#FFFFFF" },
  { nome: "Azul-marinho", hex: "#373857" },
  { nome: "Turquesa", hex: "#31C4EA" },
  { nome: "Mescla", hex: "#B9BFCB" },
  { nome: "Preto", hex: "#1E1F2B" },
];
const LOCAIS = ["Frente", "Costas", "Frente e costas"];
const TECNICAS = ["Silk", "DTF", "Bordado", "Ainda não sei"];
const PASSOS = ["Peça", "Cor", "Estampa", "Quantidade", "Resumo"];
const MINIMO = 50;

/** Silhueta da camiseta (viewBox 0 0 200 200). Contorno na cor do texto. */
function Camiseta({ cor }: { cor: string }) {
  return (
    <path
      d="M70 30 L48 40 L30 70 L48 80 L52 74 L52 170 Q52 174 56 174 L144 174 Q148 174 148 170 L148 74 L152 80 L170 70 L152 40 L130 30 C126 44 116 50 100 50 C84 50 74 44 70 30 Z"
      fill={cor}
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinejoin="round"
      className="motion-safe:transition-[fill] motion-safe:duration-300"
    />
  );
}

export function Personalizador() {
  const [peca, setPeca] = useState(PECAS[0]);
  const [cor, setCor] = useState(CORES[1]);
  const [local, setLocal] = useState(LOCAIS[0]);
  const [tecnica, setTecnica] = useState(TECNICAS[0]);
  const [tamanhos, setTamanhos] = useState("P, M, G, GG");
  const [quantidade, setQuantidade] = useState(String(MINIMO));
  const [passo, setPasso] = useState(0);

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
              onEscolher={(p) => {
                setPeca(p);
                setPasso(1);
              }}
            />
          </div>
        </Container>
      </section>

      <Container className="grid gap-5 pt-3 pb-7 sm:gap-[clamp(20px,4vw,48px)] sm:pt-8 sm:pb-10 md:grid-cols-[1.2fr_0.8fr]">
        {/* Espaço reservado da prévia 3D (o 3D com react-three-fiber é outra tarefa). */}
        <div className="relative aspect-square max-h-[640px] w-full overflow-hidden rounded-[22px] border bg-radial-[at_50%_20%] from-background to-muted to-70% sm:rounded-[26px]">
          <Badge variant="outline" className="absolute top-4 right-4 bg-background/60 tracking-[0.16em] uppercase backdrop-blur-sm">
            Prévia 3D
          </Badge>
          <svg viewBox="0 0 200 200" role="img" aria-label={`${peca} na cor ${cor.nome}`} className="absolute inset-0 m-auto w-3/5 text-primary">
            <Camiseta cor={cor.hex} />
          </svg>
          <p className="absolute bottom-4 left-[18px] text-xs tracking-[0.04em] text-muted-foreground">
            Prévia ilustrativa da cor escolhida
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Tabs value={passo} onValueChange={(v) => setPasso(v as number)} className="gap-5">
            <TabsList variant="line" aria-label="Passos do pedido" className="w-full flex-wrap justify-start gap-y-2 group-data-horizontal/tabs:h-auto">
              {PASSOS.map((p, i) => (
                <TabsTrigger key={p} value={i} className="h-auto min-h-10 flex-none px-3">
                  {i + 1} · {p}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={0}>
              <Passo titulo="Qual peça?" sub="Também dá para escolher direto na arara.">
                <ToggleGroup aria-label="Peça" value={[peca]} onValueChange={escolha(setPeca)} className="mt-[18px] flex-wrap">
                  {PECAS.map((p) => (
                    <Opcao key={p} value={p}>{p}</Opcao>
                  ))}
                </ToggleGroup>
              </Passo>
            </TabsContent>

            <TabsContent value={1}>
              <Passo titulo="Cor do tecido" sub={cor.nome}>
                <ToggleGroup
                  aria-label="Cor do tecido"
                  value={[cor.nome]}
                  onValueChange={escolha((n) => setCor(CORES.find((c) => c.nome === n)!))}
                  spacing={3}
                  className="mt-[18px] flex-wrap"
                >
                  {CORES.map((c) => (
                    <ToggleGroupItem
                      key={c.nome}
                      value={c.nome}
                      aria-label={c.nome}
                      title={c.nome}
                      style={{ backgroundColor: c.hex }}
                      className="size-11 rounded-full border border-primary/15 p-0 ring-offset-2 ring-offset-background aria-pressed:ring-2 aria-pressed:ring-primary"
                    />
                  ))}
                </ToggleGroup>
              </Passo>
            </TabsContent>

            <TabsContent value={2}>
              <Passo titulo="Estampa" sub="Onde e como vamos estampar.">
                <ToggleGroup aria-label="Local da estampa" value={[local]} onValueChange={escolha(setLocal)} className="mt-[18px] flex-wrap">
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
              </Passo>
            </TabsContent>

            <TabsContent value={3}>
              <Passo
                titulo="Tamanhos e quantidade"
                sub={`Pedido mínimo de ${MINIMO} peças. Prazo de produção de 20 a 30 dias, conforme quantidade e modelo.`}
              >
                <FieldGroup className="mt-[18px]">
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
              </Passo>
            </TabsContent>

            <TabsContent value={4}>
              <Passo titulo="Tudo certo?">
                <p className="mt-4 rounded-2xl bg-muted p-[18px] text-sm whitespace-pre-wrap">{resumo}</p>
                <a
                  href={linkWhatsApp(resumo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ size: "xl" }), "mt-[18px]")}
                >
                  Enviar pelo WhatsApp <Seta />
                </a>
              </Passo>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-2.5">
            {passo > 0 ? (
              <Button variant="outline" size="xl" onClick={() => setPasso(passo - 1)} className="flex-1 sm:flex-none">
                Voltar
              </Button>
            ) : (
              <span />
            )}
            {passo < PASSOS.length - 1 && (
              <Button size="xl" onClick={() => setPasso(passo + 1)} className="flex-1 sm:flex-none">
                Continuar <Seta />
              </Button>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

function Passo({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="text-[26px] leading-[1.1] font-semibold">{titulo}</h2>
      {sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}
      {children}
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
