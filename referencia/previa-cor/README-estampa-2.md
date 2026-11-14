# Estampa 2: mapa de posições, arte melhor na peça, técnica, ficha para a Whim e correções do movimento

Pedido de 2026-11-13, aprovado pelo Gabriel (escolhas: **mapa clicável**, **ficha em imagem + texto**, **técnica simulada na arte**).
Complementa `README.md` e `README-estampa.md`. Vale para **PC e celular** em todos os itens (alvos de 44 px, nada estoura em 360 px).
Sem back end: nada sai do navegador.

## 1. Arara: clique escolhe direto

- Tirar a janela de confirmação (Dialog "Escolher esta peça"). **Um clique ou toque na peça já escolhe**: a peça fica de frente, o passo Peça atualiza e a prévia troca.
- No celular, depois de escolher, rolar suave até a prévia (só se ela estiver fora da tela; sem rolagem com movimento reduzido).
- Remover o código e os textos da vista ampliada que ficarem sem uso.

## 2. Movimento da prévia (bug confirmado no teste)

Teste no navegador (Playwright, 1280 px): parada, a peça troca de espelho a cada ~2,5 s (`data-espelho` 0 ↔ 1), porque o balanço contínuo passa por θ = 0 e θ < 0 desenha espelhado. O gancho do cabide é assimétrico, então peça e cabide "trocam de direção". Na troca de cor, θ pula de −0,05 para −0,20 num quadro (sem transição) e depois cruza o zero de novo.

Correção:
- **θ só muda arrastando.** O balanço contínuo e o balanço da troca de cor viram um **pêndulo 2D**: `rotate()` do palco (peça + sombra) em torno do ponto do gancho (eixo do cano). Contínuo ±1,2° a cada 5 s; troca de cor: impulso de **velocidade** (não de posição) que chega a ~4° e assenta em ~1,2 s com a mola atual.
- **Espelho com histerese:** só liga quando θ < −0,04 e só desliga quando θ > +0,04. Parada de frente nunca espelha.
- **Troca de cor com crossfade de 300 ms** no mesmo θ: desenha a cor anterior e a nova por cima com alfa de 0 a 1. Nada de pular quadro.
- Para a troca ser imediata: ao passar o mouse, focar ou tocar num botão da vitrine, pré-carregar daquela cor o quadro atual e os vizinhos; o resto carrega em segundo plano.
- Movimento reduzido: sem pêndulo, troca de cor sem fade.
- Conferir com o mesmo teste: 10 s parada → 0 trocas de espelho; troca de cor → θ sem saltos acima de 0,03 por quadro.

## 3. Seletor de posições: mapa clicável

Sai o "Lado" (Frente / Costas / Frente e costas) + chips. Entra o **mapa**:

- Dois desenhos lado a lado, **Frente** e **Costas**, com a foto da peça na cor escolhida (`frente.webp` / `costas.webp`), uns 160 px de largura no celular e 200 px no PC.
- Sobre cada foto, as **áreas** de `manifest.pecas[].areas[lado]` (formato novo, ver 3.3) como retângulos tracejados finos (girados nas mangas). Tocar marca/desmarca. Marcada: contorno sólido turquesa e um **número** (1, 2, 3…) na ordem em que foi marcada.
- As mangas aparecem nos dois desenhos (na frente e nas costas é a mesma manga; marcar numa marca na outra).
- Alvo de toque de 44 px no mínimo, mesmo nas mangas (área clicável invisível maior que o desenho).
- Embaixo do mapa, a **mesma lista em caixas de marcar** (acessível por teclado e leitor de tela), agrupada em Frente / Costas / Mangas. Mapa e lista são o mesmo estado.
- **Várias posições ao mesmo tempo**, com conflitos resolvidos sozinhos (marcar uma tira as que se sobrepõem, com aviso de uma linha):
  - Frente: peito esquerdo e peito direito podem juntos; centro do peito e frente inteira não combinam com nenhuma outra da frente.
  - Costas: costas em cima e costas inteira não combinam entre si; a nuca combina com as duas.
  - Mangas: independentes.
  - Regata não tem mangas; moletom não tem nuca (as áreas não vêm no manifesto).
- Marcar uma posição leva a prévia para o lado dela e aproxima o zoom no centro da área.
- Padrão ao entrar no passo: nada marcado e o texto "Toque onde vai a estampa".

### 3.1 Uma linha por posição marcada (com o próprio anexo)

Cada posição marcada vira uma linha, na ordem dos números:

```
[1]  Peito esquerdo                         até ≈ 10 × 10 cm
     [miniatura] logo-empresa.png           Trocar · Remover
     Usar a mesma arte de: [ 2. Manga direita ▾ ]   (só aparece se já houver outra arte)
```

- **Um anexo por posição** (`accept="image/png,image/jpeg,image/webp,image/svg+xml"`, até 10 MB, arrastar e soltar no PC).
- "Usar a mesma arte de…" copia a arte de outra linha (atalho para não anexar o mesmo arquivo 3 vezes).
- **Nome do arquivo cortado no meio** com "…", mantendo o começo e a extensão (`Garment_hang…f5f.jpg`). O container precisa de `min-w-0`, e a linha é um grid, para os botões nunca estourarem a borda (o print do Gabriel mostra o "Remover" saindo do cartão).
- **Tamanho de referência** em cada linha: `manifest.medidasReferencia[chave]` como "até ≈ L × A cm". As medidas são **provisórias** (referência de mercado). Rodapé do bloco: "Medidas de referência. A Whim confirma no orçamento."
- **Manga**: além da medida, a dica "Na manga cabe um símbolo ou logo pequeno. Texto longo fica ilegível." Se a arte anexada for bem mais larga que alta (proporção > 2,5), mostrar o aviso "Essa arte é larga para a manga. Se tiver, anexe só o símbolo."
- O aviso de anexar no WhatsApp continua uma vez, abaixo das linhas.

### 3.2 Técnica

Continua uma escolha para o pedido todo (Silk, DTF, Bordado, Ainda não sei), logo abaixo das linhas, agora com a frase do que esperar:
- Silk: "Cores chapadas, toque macio. Cada cor é uma tela."
- DTF: "Todas as cores e degradês, com um leve brilho."
- Bordado: "Linha costurada em relevo. Bom para logos simples."

### 3.3 Formato novo das áreas no manifesto

`manifest.pecas[].areas[lado][chave] = [x, y, largura, altura]` de 0 a 1 no quadro 900x1200; nas mangas vem um 5º número, o **ângulo em graus** (positivo = horário na tela). Lado de quem veste: na frente, peito esquerdo e manga esquerda ficam à direita de quem olha; nas costas, a manga esquerda fica à esquerda de quem olha. O peito desceu um pouco para não encostar na gola.
Migrar o código para `areas` e depois **remover `areasEstampa`** do manifesto. Conferência visual: `referencia/arara/areas-estampa.jpg` (linha amarela = topo da arte).

## 4. A arte na peça (a sobreposição que ficou ruim)

No print, o fundo branco do arquivo virou um retângulo, a deformação embolou o logo pequeno da manga e a manga não seguia o ângulo da peça. Ajustes em `src/lib/estampa.ts`:

1. **Tirar o fundo liso automaticamente.** Se a borda da arte (moldura de 2 px) for ≥ 90% de uma cor só, essa cor vira transparente por preenchimento a partir das bordas (tolerância ~12%, borda suavizada em 1 px). Na linha: "Fundo removido na prévia" e a opção "Manter o fundo" (para quando o fundo faz parte da arte).
2. **Cortar margens transparentes** da arte antes de encaixar, para ela ocupar a área de verdade.
3. **Deformação suave e proporcional:** desfoque do mapa com raio de ~6 px (não 2), K = mín(4 px, 2% da largura da área), sem corte duro dentro da área (o recorte é só pelo alfa do tecido, com borda suave). Logo pequeno quase não entorta; frente inteira acompanha as dobras.
4. **Textura do tecido na tinta:** multiplicar a arte por `1 + 0,6 × (L − L_desfocado) / Lref` (a trama aparece por dentro da tinta).
5. **Mangas:** girar a arte pelo ângulo da área e comprimir 15% na largura (curva do braço).
6. **Resolução:** desenhar a camada da arte em 2× (1800x2400) ou no `devicePixelRatio × zoom`, para não pixelar no zoom 3×. A foto da peça continua 900x1200.
7. Mangas e nuca aparecem também na vista de Costas.

## 5. Técnica simulada na arte (depois da deformação, antes do recorte)

- **Silk:** reduzir a até 6 cores (k-means nos pixels opacos), alfa duro (corte em 0,5), mais textura do tecido (tinta dentro da trama), fosco (sem clarear acima de 1).
- **DTF:** cores e alfa como vieram, menos textura, e um leve brilho de película: `+0,6 × max(0, Lb/Lref − 1)` nas dobras claras.
- **Bordado:** desfocar 0,6 px e reduzir a 5 cores; textura de pontos (listras diagonais de 3 px a 45°, ±12% de luminância, alternando o sentido por cor); relevo (sombra de 1 px para baixo e à direita a 25% de preto, luz de 1 px para cima e à esquerda); contorno 1 px mais escuro.
- **Ainda não sei:** como o DTF, sem o brilho.
- **Dica automática** pela arte anexada (sem bloquear nada):
  - Silk com mais de 6 cores relevantes (> 1% dos pixels) ou degradê/foto: "Sua arte tem muitas cores ou degradê. No silk cada cor é uma tela; o DTF reproduz melhor." + botão "Ver em DTF".
  - Bordado em área pequena (manga, nuca, peito) com detalhes finos (traços < 2 px na escala da área): "Detalhes finos podem não aparecer no bordado."
- Legenda de uma linha no rodapé da prévia com o nome da técnica e a frase do item 3.2.
- Recalcular só quando mudar arte, área, técnica, cor ou lado (nunca por quadro). Se passar de ~50 ms, usar `OffscreenCanvas` num Worker.

## 6. Ficha da estampa para a equipe da Whim (imagem + texto)

No passo **Resumo**:

1. **Ficha em PNG**, gerada no navegador num canvas de 1600x1000:
   - topo: logo da Whim (`public/brand/`), peça, cor, técnica, total de peças e tamanhos;
   - centro: frente e costas da peça na cor, com as artes já compostas (técnica simulada) e um **círculo numerado** em cada posição (mesmos números do mapa);
   - lateral: tabela nº · posição · até L × A cm · nome do arquivo · miniatura;
   - rodapé: "Prévia ilustrativa. Medidas finais confirmadas pela Whim." e a data.
   - nome do arquivo: `ficha-whim-<peca>-<aaaa-mm-dd>.png`.
2. Botões: **"Baixar ficha"** (PC e celular) e, no celular com `navigator.canShare({ files })`, **"Compartilhar ficha"** (abre o compartilhar do sistema, onde está o WhatsApp). Sem suporte, só baixar.
3. Checklist curto antes do botão do WhatsApp:
   1. Baixe ou compartilhe a ficha.
   2. Envie a mensagem pelo WhatsApp.
   3. Na conversa, anexe a ficha e os arquivos das artes.
4. **Texto da mensagem** com uma linha por posição, na ordem dos números:

```
Olá, Whim! Montei minha peça no site:
• Peça: Camiseta · Cor: Azul-marinho
• Técnica: Silk
• Estampas:
  1. Peito esquerdo (até ≈ 10 × 10 cm): logo-empresa.png
  2. Manga direita (até ≈ 8 × 8 cm): simbolo.png
  3. Costas inteira (até ≈ 30 × 40 cm): arte-costas.jpg
• Tamanhos: P 10, M 20, G 20, GG 10 · Total: 60 peças
Vou mandar a ficha e os arquivos aqui na conversa.
Podem me passar o orçamento?
```

(Nome do arquivo só quando houver arte anexada; sem arte, "arte a enviar".)

## Conferir antes de entregar

- 360, 390, 768, 1024 e 1280 px; teclado; leitor de tela no mapa (cada área é botão com nome e `aria-pressed`); movimento reduzido.
- Teste do item 2 (espelho e troca de cor) com números.
- Arte PNG transparente, JPG com fundo branco, arte larga e foto, em todas as posições das 6 peças, frente e costas, em Branco e Preto, nas 4 técnicas.
- Nome de arquivo com 80 caracteres em 360 px.
- Ficha baixada abre certa (números batem com o mapa e com o texto).
- `npm run lint` e `npm run build`.
