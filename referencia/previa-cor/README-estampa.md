# Estampa, tamanhos e ajustes da ficha (pedido de 2026-11-13, aprovado pelo Gabriel)

Complementa `README.md` desta pasta. Mexe em `previa-peca.tsx`, `personalizador.tsx` e `arara.tsx`.
Tudo vale para **PC e celular** em cada componente (alvos de toque com 44 px ou mais, sem rolagem lateral em 360 px).
Sem back end: nada é enviado para servidor.

Molde no Figma (arquivo `6LOApgyUdJHtgvdSLjW55a`): Estampa PC `20:2`, Estampa celular `20:172`, Quantidade PC `20:341`, Quantidade celular `20:507`. Se o conector do Figma não abrir, este README basta.

## 1. Giro da camisa: clicar, segurar e arrastar

- Sai o giro por hover. A camisa só gira com o **botão apertado (ou o dedo) arrastando** na horizontal sobre a camisa.
- Ao soltar, ela **para onde está** (não volta sozinha para a frente). Hoje `soltar()` zera `alvo` e a mola puxa para θ = 0; trocar por "fica no θ atual" (`alvo = theta`).
- Usar `setPointerCapture` no `pointerdown` para o arrasto seguir mesmo saindo do painel. Mouse e toque com o mesmo código.
- Cursor `grab` / `grabbing` no PC. No celular manter `touch-pan-y` (rolagem vertical da página continua).
- O balanço leve contínuo e o balanço ao trocar a cor somam ao θ parado (não forçam a volta para a frente).
- Teclado: setas ← → giram em passos de 0,1 quando o painel tem foco (`tabIndex=0`, `aria-label="Prévia da peça. Use as setas para girar"`).
- Movimento reduzido: sem giro, sem balanço (como hoje).

## 2. Passo Estampa

### 2.1 Onde estampar (padrão do nicho)

`Local` continua: Frente / Costas / Frente e costas. Para cada lado escolhido aparece a posição (uma escolha por lado, chips):

| Lado | Posições (chave no manifesto) | Padrão |
|---|---|---|
| Frente | Peito esquerdo (`peito-esquerdo`), Peito direito (`peito-direito`), Centro do peito (`centro-peito`), Frente inteira (`frente-inteira`) | Peito esquerdo |
| Costas | Nuca (`nuca`), Costas em cima (`costas-em-cima`), Costas inteira (`costas-inteira`) | Costas inteira |
| Mangas (opcional, caixas de marcar) | Manga esquerda (`manga-esquerda`), Manga direita (`manga-direita`) | nenhuma |

- **Lado de quem veste.** "Peito esquerdo" e "Manga esquerda" aparecem à **direita de quem olha** a camisa. Os retângulos do manifesto já estão assim; não espelhar de novo.
- Regata não tem mangas (o manifesto não traz `manga-*` para ela): esconder as caixas. Moletom não tem `nuca` (o capuz cobre): esconder.
- Mangas usam a arte da frente (mesmo arquivo), em tamanho de manga.
- Cada chip pode ter um mini desenho da camisa com o retângulo marcado (SVG simples nas cores da marca), opcional.

### 2.2 Anexar a arte

- Um campo por lado escolhido: "Arte da frente" e/ou "Arte das costas". Arrastar e soltar no PC, tocar para escolher no celular (`<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">`, até 10 MB).
- Depois de escolher: miniatura, nome do arquivo, "Trocar" e "Remover".
- O arquivo fica só no navegador (`URL.createObjectURL`, liberar com `revokeObjectURL` ao trocar/remover/sair). Nada vai para servidor.
- Aviso fixo abaixo dos campos, com ícone de info:
  **"A arte aqui é só para a prévia. Na hora de enviar o pedido pelo WhatsApp, anexe o arquivo na conversa."**
- Sem arte, a prévia mostra um marcador tracejado "Sua arte" no retângulo da posição (esse marcador também segue as dobras, ver 2.3).
- Dica curta: "PNG com fundo transparente fica melhor." Para JPG/fundo branco, não tentar recortar.

### 2.3 A arte segue as dobras da camisa (efeito "mockup")

Referência: o recurso de mockup do Photoshop mostrado no Adobe MAX, em que a arte entra na peça e acompanha dobras e sombras. Aqui fazemos uma versão leve no navegador, com as fotos que já temos:

Arquivos (no quadro de 900x1200, mesmo enquadramento):
- peça na cor: `{coresPasta}{pasta}/frente.webp` e `{coresPasta}{pasta}/costas.webp`;
- mapa de dobras: a versão **branca** do mesmo lado, `{coresPasta}branco/frente.webp` / `costas.webp`;
- retângulo da posição: `manifest.pecas[i].areasEstampa[chave]` = `[x, y, largura, altura]` de 0 a 1.

Passos (WebGL de preferência; canvas 2D serve, só recalcula quando muda arte, posição, cor ou lado, nunca por quadro):
1. Encaixar a arte no retângulo **sem distorcer** (contain, centrada em x, alinhada em cima).
2. Do branco, tirar a luminância L (desfoque de uns 2 px) e o gradiente (∂L/∂x, ∂L/∂y).
3. **Deslocar** a arte pelo gradiente: amostrar a arte em `(x + k·∂L/∂x, y + k·∂L/∂y)`, k ≈ 6 px no quadro de 900. Isso entorta a arte nas dobras.
4. **Sombra**: multiplicar a cor da arte por `clamp(L / Lref, 0.55, 1.08)` (Lref = mediana de L no tecido). Brilho acima de 1 clareia de leve.
5. **Recortar** pelo alfa da peça (alfa > 0,5) para a arte nunca passar do tecido, do cabide ou do fundo.
6. Opacidade 0,95 (tinta, não adesivo). A arte mantém as cores dela em qualquer cor de camisa.

A prévia com arte é estática (frente ou costas parados, sem os quadros do giro). Ao sair do passo Estampa, volta a camisa girando, com a arte só no resumo.

### 2.4 Prévia no passo Estampa: Frente/Costas e zoom

Só aparecem **neste passo**:
- **Frente | Costas** (segmentado, canto superior esquerdo do painel). Começa no lado da posição escolhida por último. Com "Frente" só, o botão Costas fica visível mas mostra a costa lisa (sem arte), e vice-versa.
- **Zoom**: barra **vertical** na lateral direita do painel, centralizada na altura, de 1× a 3×, com "+" em cima e "−" embaixo (44 px cada). No celular a mesma barra, com 50% da altura do painel.
- A barra **não pode ficar atrás** do Frente/Costas nem do cartão: o Frente/Costas fica em cima à esquerda, a barra à direita com margem de 16 px, e o cartão de cor some neste passo (a cor já foi escolhida no passo anterior).
- O zoom aproxima **no centro do retângulo da posição** escolhida (no "Frente e costas", no lado que está na tela). Arrastar com zoom > 1 move a imagem (pan), sem girar.
- **Prévia mais limpa**: com zoom > 1, **sem o cano e sem o selo "Prévia"**; em 1× eles voltam. Trocar a pílula "Prévia" por um texto pequeno discreto no rodapé do painel ("Prévia ilustrativa") também serve.
- Pinça no celular é opcional (a barra já resolve).
- Teclado: a barra é um `Slider` acessível (`aria-label="Zoom"`, `aria-orientation="vertical"`).

## 3. Passo Quantidade: tamanhos com quantidade

- Lista de tamanhos: **P, M, G, GG** (a Whim ainda vai revisar a lista) + botão **"Adicionar outro tamanho"**, que abre um campo para o nome (ex.: "XG", "Infantil 10") e adiciona a linha, com "Remover" só nas linhas adicionadas.
- Cada linha: nome do tamanho · botão − · número (editável, só inteiros ≥ 0) · botão +. Botões de 44 px. No celular a linha cabe em 360 px.
- Começa tudo em 0. Embaixo: **Total: N peças**. Se N < 50: "Faltam X peças para o mínimo de 50." (mesmo estilo do aviso atual). Manter o comportamento atual do mínimo (avisa, não bloqueia).
- O passo na ficha mostra o valor como "60 peças · P 10, M 20, G 20, GG 10" (só tamanhos com quantidade > 0).
- Mensagem do WhatsApp: uma linha por tamanho com quantidade, mais o total.

## 4. Mensagem do WhatsApp

```
Olá, Whim! Montei minha peça no site:
• Peça: Polo
• Cor: Azul-marinho
• Estampa: Frente (Peito esquerdo) e costas (Costas inteira) · Silk
• Mangas: Manga direita            ← só se marcada
• Arte: vou anexar aqui na conversa  ← só se anexou alguma arte na prévia
• Tamanhos: P 10, M 20, G 20, GG 10
• Total: 60 peças
Podem me passar o orçamento?
```

No passo Resumo, repetir o aviso de anexar a arte antes do botão do WhatsApp quando houver arte.

## 5. "Alterar" muda só aquele passo

Hoje "Alterar" faz `setPasso(i)` e todos os passos seguintes voltam a "depois", obrigando a refazer tudo.

Novo comportamento:
- Guardar `alcancado` (o passo mais longe já atingido). Estado de cada passo: `atual` se `i === passo`; `feito` se `i < alcancado` (ou já preenchido) e `i !== passo`; senão `depois`.
- Ao clicar "Alterar" num passo feito, só ele abre; os outros continuam feitos, com os valores e o próprio "Alterar".
- Enquanto edita um passo já feito, o botão principal vira **"Salvar"** e leva de volta ao passo onde a pessoa estava (`alcancado`), ou ao Resumo se ela já tinha chegado lá. "Voltar" vira **"Cancelar"** e desfaz a edição daquele passo.
- Trocar a peça mantém cor, estampa e tamanhos; se a posição escolhida não existir na peça nova (ex.: manga na regata, nuca no moletom), voltar para o padrão do lado e avisar em uma linha no passo Estampa.
- Foco vai para o título do passo aberto (acessibilidade), e a página rola até ele no celular.

## 6. Arara: só a peça escolhida muda de cor

- Só a peça selecionada usa a cor escolhida. As outras ficam na cor própria do manifesto (`pecas[i].cor`): Camiseta Branco, Polo Azul-marinho, Gola V Turquesa, Regata Azul-marinho, Babylook Turquesa, Moletom Mescla.
- Em `Arara`, passar para cada `PecaGirando` `cor = m.nome === selecionada ? cor : hexDe(m.cor)` (casar `m.cor` com `manifest.cores[].nome`).
- A vista ampliada (dialog) da peça escolhida usa a cor escolhida; a de outra peça, a cor dela.

## 7. Ajustes encontrados na conferência

- **Vitrine no PC**: as mini camisas do cartão estão pequenas demais. No PC (≥ 1024 px) cada miniatura com pelo menos 64 px de largura e a fileira ocupando a largura do cartão; no celular manter 44 px de alvo.
- **Texto da arara no celular**: "Passe o mouse ou toque numa peça" → no celular (`pointer: coarse`) **"Toque numa peça"**; no PC **"Clique numa peça"**. Nada de "passe o mouse".

## Conferir antes de entregar

- 360, 390, 768, 1024 e 1280 px; movimento reduzido; teclado.
- Arte PNG transparente e JPG em todas as posições das 6 peças, frente e costas, em Branco e Preto (arte não pode vazar do tecido).
- "Alterar" em cada passo sem perder os outros.
- `npm run lint` e `npm run build`.
