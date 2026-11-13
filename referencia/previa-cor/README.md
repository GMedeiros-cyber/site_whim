# Prévia da peça + ficha do pedido (aprovado pelo Gabriel em 13/11/2026)

Molde no Figma (quadro "C · Mistura" para PC e "C · Celular (390)"): https://www.figma.com/design/6LOApgyUdJHtgvdSLjW55a
No Figma a foto da camisa está comprimida (manchada); no site use os quadros reais de `public/arara/<peca>/cores/<cor>/`.

Regras de sempre: só as cores do tema (primary, accent, muted, muted-foreground, background), Poppins, sem hex solto, PC e celular no mesmo componente, `prefers-reduced-motion` respeitado.

## 1. Prévia da peça (substitui o quadro "Prévia 3D" com a camiseta em SVG)

Painel `bg-muted`, borda `primary/10`, raio 26 (22 no celular). Proporção ~662×640 no PC; no celular largura total e ~358×530.

- **Topo:** só o selo "Prévia" no canto superior direito (o mesmo `Badge` de hoje, sem caixa alta). Nada de título aqui.
- **Cano:** `public/arara/cano.webp` (`mix-blend-multiply`), centralizado, ~57% da largura do painel no PC e ~55% no celular, a ~10% da altura a partir do topo.
- **Camisa:** quadros da peça e da cor escolhidas (`{coresPasta}{cor.pasta}/NNN.webp`, 480×640, fundo transparente), num canvas centralizado, com altura ~59% do painel no PC e ~54% no celular. A curva do gancho (42/640 da altura do quadro, ver `manifest.gancho`) fica no eixo do cano. Sombra suave e elíptica embaixo da camisa (`primary` com ~14% de opacidade, borrada).
- **Cartão da peça** (embaixo, inset 24 no PC e 12 no celular, `bg-background`, raio 18 no PC e 16 no celular):
  - Cabeçalho numa linha: nome da peça (18px semibold no PC, 16 no celular) + nome da cor (14 e 13, `text-muted-foreground`).
  - Vitrine de cores: 5 botões, um por cor do `manifest.cores`, cada um com a miniatura da peça de frente naquela cor (último quadro `{coresPasta}{pasta}/NNN.webp`) e o nome embaixo (11px; no celular use `cores[].curto` quando existir, ex.: "Marinho"). A selecionada fica maior, com o nome em semibold e uma barrinha `bg-accent` de 22×3 embaixo; `aria-pressed` e foco visível. **A cor só se escolhe aqui** (as bolinhas saem do lado direito).

## 2. Movimento da camisa da prévia (opção A)

Um único estado `θ` de −1 a 1 (−1 = de lado virada para a esquerda, 0 = de frente, 1 = de lado virada para a direita):
- Quadro = `(N−1)·(1−|θ|)` (001 = de lado, NNN = de frente). Para `θ < 0`, desenha espelhado na horizontal (`ctx.scale(-1, 1)`). Para não "pular" entre quadros, desenha os dois quadros vizinhos com alfa proporcional (crossfade).
- **Mouse (`pointer: fine`):** com o mouse sobre o painel, `θ` segue a posição horizontal (`(x − centro) / (largura/2)`, limitado a ±1), com suavização (lerp ~0.15 por quadro). Ao sair, volta para 0 com mola.
- **Toque:** arrastar na horizontal gira (`touch-action: pan-y` para não travar a rolagem); ao soltar, volta para 0 com mola.
- **Troca de cor:** carrega os quadros da nova cor (mantém o quadro atual na tela até decodificar) e entra balançando: impulso inicial `θ ≈ ±0.35` e mola amortecida que assenta em ~1,2 s.
- **Balanço contínuo:** sem interação, `θ = 0.06·sin(2πt / 5 s)`. Pausa fora da tela (IntersectionObserver) e com a aba oculta.
- **Movimento reduzido:** tudo parado em `θ = 0`; trocar a cor só troca a imagem.

## 3. Ficha do pedido (substitui as abas do lado direito)

Título "Seu pedido" (24px semibold no PC, 20 no celular) e a linha "Monte em 5 passos e receba o orçamento pelo WhatsApp." (`text-muted-foreground`).

Os 5 passos numa linha vertical (bolinha de 30px no PC, 26 no celular, ligadas por um traço de 2px):
- **Feito:** bolinha `bg-primary` com ✓ branco, traço abaixo em `primary`; nome do passo em semibold, o valor escolhido embaixo (ex.: "Polo") e o botão-link "Alterar" à direita, que reabre o passo.
- **Atual:** bolinha branca com borda `accent` (2px) e o número; o conteúdo abre num cartão (`bg-background`, borda `primary/12`, raio 18, sombra leve) com os controles do passo e os botões Voltar e Continuar (no celular os dois ocupam a largura, Continuar maior).
  - Passo Cor: só o texto "Toque numa das camisas da vitrine para trocar a cor." e um chip com a cor escolhida (bolinha + nome).
  - Os outros passos usam os controles que já existem (peças, estampa, tamanhos/quantidade, resumo e envio pelo WhatsApp).
- **Depois:** bolinha com borda `primary/18` e número em `muted-foreground`, traço em `primary/14`, conteúdo com opacidade ~75%: "Estampa · Local e técnica", "Quantidade · A partir de 50 peças", "Resumo · Enviar pelo WhatsApp".

No PC a prévia fica à esquerda e a ficha à direita (como hoje). No celular a prévia vem em cima e a ficha embaixo.

## 4. Arara

A peça escolhida fica de frente e larga na arara (não volta para o lado ao tirar o mouse); as outras continuam girando no hover/toque como hoje.
