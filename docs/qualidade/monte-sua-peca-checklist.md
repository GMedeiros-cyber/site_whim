# Monte sua peça · checklist de UX/UI

Gerado por `scripts/testes-monte.mjs` em 17/11/2026, 19:18:33, contra http://localhost:3417 (commit `7884efc`).
Para rodar de novo: `npm i --no-save playwright-core axe-core`, `npm run build`, `npx next start -p 3417` e `node scripts/testes-monte.mjs --url http://localhost:3417` (o cabeçalho do script explica as opções).

Telas: 390 × 844 (celular, toque), 768 × 1024 (tablet, toque), 1280 × 800, 1920 × 1080, 2560 × 1440 e 1920 × 1080 com zoom de 67% (2866 × 1612 px de CSS).
As artes de teste são geradas pelo script (círculo vermelho para medir a arte na prévia). O WhatsApp e o envio do contato são interceptados: nada sai do navegador.

**51 itens ok e 10 com falha.**

## Falhas

- **C4 · SVG (com e sem largura/altura)** (1280): com tamanho: aceito; prévia com a arte dentro da área; só viewBox: aceito; prévia SEM a arte (mostra o marcador "Sua arte") [print](prints/monte/c4-svg.jpg)
- **C8 · Imagem quadrada** (1280): aceito; prévia SEM a arte (área vazia); a linha diz "Fundo removido na prévia" [print](prints/monte/c8-quadrada.jpg)
- **C9 · Imagem muito pequena (< 200 px)** (1280): aceito; prévia com a arte dentro da área; nenhum aviso de que 120 px é pouco para imprimir (a prévia aceita sem dizer nada) [print](prints/monte/c9-pequena.jpg)
- **C12 · Arquivo com extensão de imagem que não abre** (1280): aceito sem aviso: a linha mostra "logo-corrompido.png" como anexada e a prévia volta ao marcador "Sua arte" [print](prints/monte/c12-corrompida.jpg)
- **E4 · Quantidade muito alta** (390, 1280): 1000000 não cabe no campo; sem rolagem lateral [print](prints/monte/e4-muito-alta-390.jpg)
- **F3 · Recarregar a página no meio do pedido** (390, 1280): tudo volta ao começo: passo "Peça", prévia "Camiseta Azul-marinho" (peça, cor, posições, técnica e tamanhos se perdem) [print](prints/monte/f3-recarregar-390.jpg)
- **G4 · Nomes e estados para o leitor de tela** (1280): o "✓ feito" dos passos é um <svg aria-label> sem role="img" (alguns leitores não leem); texto alternativo da ficha sem espaço: "Ficha da estampa: Camiseta, Azul-marinho, Não sei, me indiquem, Silk,0 posições" (4 alertas ao enviar vazio). Árvore completa: [g4-arvore-acessibilidade.txt](prints/monte/g4-arvore-acessibilidade.txt) [print](prints/monte/g4-passos-e-erros.jpg)
- **G5 · Rótulos, ARIA e contraste (axe) em cada passo** (390, 1280): label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Peito esquerdo"]; label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Costas inteira"] [print](prints/monte/g5-g6-estampa-390.jpg)
- **G6 · Alvos de toque com 44 px ou mais** (390, 768, 1280): Zoom (14 × 14) [print](prints/monte/g5-g6-estampa-390.jpg)
- **L4 · Sem vão grande embaixo da vitrine** (2560, 67%): passo 3: 455 px (32% da altura da tela) [print](prints/monte/l-2560-vao-passo3.jpg); passo 5: 459 px (32% da altura da tela) [print](prints/monte/l-2560-vao-passo5.jpg) [print](prints/monte/l-2560-passo3.jpg)

<!-- revisão visual: o script mantém o que estiver entre esta linha e a de fim -->
## Revisão visual

Conferida no olho em 17/11/2026, nos recortes do D1 ampliados (o tracejado verde é a área do `manifest.json`). O script mede a arte contra essa área; quando a própria área pega a gola ou a carcela, só o olho vê. Para repetir: Camiseta azul-marinho → peça indicada → passo Estampa → marque a posição e anexe um PNG transparente.

- **falha · D2 · Polo, Centro do peito e Frente inteira:** a arte cobre a carcela (a tira dos botões) e o botão, e encosta na ponta da gola. As áreas `centro-peito` e `frente-inteira` do Polo começam em y = 0,2884, em cima da carcela. Na peça de verdade não se estampa sobre a carcela. [print centro](prints/monte/revisao-polo-centro-peito.png) · [print frente inteira](prints/monte/revisao-polo-frente-inteira.png)
- **falha · D2 · Regata, Centro do peito:** o topo da arte passa por cima da ribana do decote (a área começa na gola). [print](prints/monte/revisao-regata-centro-peito.png)
- **falha leve · D1 · bordas serrilhadas:** na Regata (Peito esquerdo) e no Moletom (Peito esquerdo, do lado do cordão) a borda da arte fica com "dentes" onde a dobra do tecido é forte; vem da deformação pelas dobras. [Regata](prints/monte/revisao-regata-peito-esquerdo.png) · [Moletom](prints/monte/revisao-moletom-peito-esquerdo.png)
- **observação · Moletom, Centro do peito:** os cordões do capuz passam por dentro da área ([recortes do Moletom](prints/monte/d1-moletom.jpg)). Na peça real a estampa fica embaixo dos cordões; vale a Whim confirmar se oferece essa posição no moletom.
- **ok · resto das posições:** Camiseta, Baby look e Moletom (fora o Centro do peito) com a arte longe da gola; mangas dentro da manga nas duas vistas.
<!-- fim da revisão visual -->

## A · Peças, cores, tecidos e técnicas

### A1 · Cada peça em cada cor: arara, prévia, cartão e vitrine — ok

**Passos para repetir:** Clique em cada peça da arara e, para cada uma, em cada cor da vitrine embaixo da prévia.

- ok · 390: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-390.jpg)
- ok · 768: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-768.jpg)
- ok · 1280: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-1280.jpg)
- ok · 1920: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-1920.jpg)
- ok · 2560: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-2560.jpg)
- ok · 67%: 25 combinações certas (peça, cor, cartão, vitrine e arara) · [print](prints/monte/a1-pecas-cores-67.jpg)

### A2 · Todas as combinações de peça × cor × tecido × técnica no resumo e na ficha — ok

**Passos para repetir:** Vá até o Resumo. Para cada combinação: Alterar peça (peça e tecido) → Salvar; Alterar estampa (técnica) → Salvar; cor na vitrine. Leia o resumo e o topo da ficha.

- ok · 1280: 800 combinações certas no resumo, no topo da ficha e na cor da foto da ficha (1036 s) · [print](prints/monte/a2-resumo-ficha.jpg)

### A3 · Outra cor, escrita pelo cliente — ok

**Passos para repetir:** No passo Cor, escolha "Outra cor" e escreva "verde-bandeira"; siga até o Resumo. Depois apague o texto; depois clique numa cor da vitrine.

- ok · 1280: resumo "Cor: verde-bandeira", ficha "verde-bandeira (prévia em Azul-marinho)", vazia = "outra, a combinar", vitrine volta para a cor dela · [print](prints/monte/a3-outra-cor.jpg)

### A4 · Trocar a peça tira as posições que ela não tem, com aviso — ok

**Passos para repetir:** Marque Nuca e as duas mangas na Camiseta; no passo Estampa, clique na Regata da arara; volte à Camiseta, marque Nuca e clique no Moletom.

- ok · 1280: "Regata não tem manga esquerda e manga direita: essas posições saíram." / "Moletom canguru não tem nuca: essa posição saiu." · [print](prints/monte/a4-troca-peca.jpg)

## B · Posições (Frente, Costas e Mangas)

### B1 · Cada posição sozinha, em cada peça — ok

**Passos para repetir:** No passo Estampa, marque uma posição por vez (caixa) e olhe o número no mapa, a linha da lista e o marcador "Sua arte" na prévia.

- ok · 1280: Camiseta: 9 posições com número, linha, rótulo e marcador dentro da área · [print](prints/monte/b1-camiseta.jpg)
- ok · 1280: Polo: 9 posições com número, linha, rótulo e marcador dentro da área · [print](prints/monte/b1-polo.jpg)
- ok · 1280: Regata: 7 posições com número, linha, rótulo e marcador dentro da área · [print](prints/monte/b1-regata.jpg)
- ok · 1280: Baby look: 9 posições com número, linha, rótulo e marcador dentro da área · [print](prints/monte/b1-babylook.jpg)
- ok · 1280: Moletom canguru: 8 posições com número, linha, rótulo e marcador dentro da área · [print](prints/monte/b1-moletom.jpg)

### B2 · Posições combinadas — ok

**Passos para repetir:** Marque combinações de Frente, Costas e Mangas (todas as válidas da Camiseta e a combinação máxima das outras peças).

- ok · 1280: 147 combinações (143 da Camiseta, todas as válidas + a máxima de cada outra peça): lista na ordem marcada, prévia com as posições do lado e sem aviso · [print](prints/monte/b2-combinacao-maxima.jpg)

### B3 · Posições que se sobrepõem saem com aviso — ok

**Passos para repetir:** Marque os dois peitos e depois Centro do peito; Centro do peito e depois Peito esquerdo; Frente inteira e depois Centro; Costas em cima e Costas inteira.

- ok · 1280: 8 casos: saem as que se sobrepõem, com o aviso certo; Nuca + Costas inteira e as duas mangas convivem · [print](prints/monte/b3-sobreposicao.jpg)

### B4 · Mapa: clicar ou tocar na área marca e desmarca (com folga nas áreas pequenas) — ok

**Passos para repetir:** No mapa da frente, clique no meio da manga esquerda, de novo para desmarcar, a ~15 px da borda da manga e na barra da camiseta.

- ok · 390: marca e desmarca no meio, marca a ~15 px fora da manga (que tem 7 × 7 px no mapa) e ignora a barra · [print](prints/monte/b4-mapa-390.jpg)
- ok · 1280: marca e desmarca no meio, marca a ~15 px fora da manga (que tem 9 × 9 px no mapa) e ignora a barra · [print](prints/monte/b4-mapa-1280.jpg)

### B5 · Mangas aparecem nas duas vistas — ok

**Passos para repetir:** Marque Manga esquerda e Manga direita e troque Frente/Costas na prévia.

- ok · 1280: Manga esquerda e direita aparecem na frente e nas costas em Camiseta, Polo, Baby look e Moletom · [print](prints/monte/b5-manga-nas-costas.jpg)

## C · Anexos

### C1 · PNG com fundo transparente — ok

**Passos para repetir:** Marque Centro do peito e anexe um PNG transparente (círculo vermelho).

- ok · 390: PDF recusado com "Use PNG, JPG, WebP ou SVG."; PNG anexado; sem rolagem lateral · [print](prints/monte/c-anexo-390.jpg)
- ok · 1280: aceito; prévia com a arte dentro da área · [print](prints/monte/c1-png-transparente.jpg)

### C2 · PNG com fundo (fundo removido; "Manter o fundo") — ok

**Passos para repetir:** Anexe um PNG com fundo branco; marque e desmarque "Manter o fundo".

- ok · 1280: aceito; prévia com a arte dentro da área; a linha diz "Fundo removido na prévia"; "Manter o fundo" mostra o fundo na prévia · [print](prints/monte/c2-png-com-fundo.jpg)

### C3 · JPG de foto (aviso do silk e "Ver em DTF") — ok

**Passos para repetir:** Com a técnica Silk, anexe uma foto JPG colorida; clique em "Ver em DTF".

- ok · 1280: aceito; prévia com a arte dentro da área; aviso do silk aparece; "Ver em DTF" troca a técnica · [print](prints/monte/c3-jpg-foto.jpg)

### C4 · SVG (com e sem largura/altura) — falha

**Passos para repetir:** Anexe um SVG com width/height e um só com viewBox.

- **falha** · 1280: com tamanho: aceito; prévia com a arte dentro da área; só viewBox: aceito; prévia SEM a arte (mostra o marcador "Sua arte") · [print](prints/monte/c4-svg.jpg)

### C5 · PDF é recusado com mensagem clara — ok

**Passos para repetir:** Anexe um PDF.

- ok · 1280: recusado: "Use PNG, JPG, WebP ou SVG." · [print](prints/monte/c5-pdf.jpg)

### C6 · Imagem deitada (e aviso de arte larga na manga) — ok

**Passos para repetir:** Anexe uma imagem 1200 × 300 no Centro do peito e na Manga esquerda.

- ok · 1280: centro: aceito; prévia com a arte dentro da área; manga: aceito; prévia com a arte dentro da área, aviso de arte larga aparece · [print](prints/monte/c6-deitada-manga.jpg)

### C7 · Imagem em pé — ok

**Passos para repetir:** Anexe uma imagem 300 × 1200 no Centro do peito.

- ok · 1280: aceito; prévia com a arte dentro da área · [print](prints/monte/c7-em-pe.jpg)

### C8 · Imagem quadrada — falha

**Passos para repetir:** Anexe uma imagem 800 × 800 (quadrado cheio) no Centro do peito.

- **falha** · 1280: aceito; prévia SEM a arte (área vazia); a linha diz "Fundo removido na prévia" · [print](prints/monte/c8-quadrada.jpg)

### C9 · Imagem muito pequena (< 200 px) — falha

**Passos para repetir:** Anexe uma imagem de 120 × 120 px.

- **falha** · 1280: aceito; prévia com a arte dentro da área; nenhum aviso de que 120 px é pouco para imprimir (a prévia aceita sem dizer nada) · [print](prints/monte/c9-pequena.jpg)

### C10 · Arquivo grande (> 10 MB) é recusado com mensagem — ok

**Passos para repetir:** Anexe um PNG de mais de 10 MB.

- ok · 1280: 13.8 MB: recusado: "A arte passa de 10 MB. Mande o arquivo direto pelo WhatsApp." · [print](prints/monte/c10-grande.jpg)

### C11 · Formato não aceito (GIF, HEIC) é recusado com mensagem — ok

**Passos para repetir:** Anexe um GIF e uma foto HEIC do iPhone.

- ok · 1280: GIF: recusado: "Use PNG, JPG, WebP ou SVG."; HEIC: recusado: "Use PNG, JPG, WebP ou SVG." · [print](prints/monte/c11-formato.jpg)

### C12 · Arquivo com extensão de imagem que não abre — falha

**Passos para repetir:** Anexe um .png que não é imagem (arquivo corrompido).

- **falha** · 1280: aceito sem aviso: a linha mostra "logo-corrompido.png" como anexada e a prévia volta ao marcador "Sua arte" · [print](prints/monte/c12-corrompida.jpg)

### C13 · Trocar o anexo — ok

**Passos para repetir:** Com uma arte anexada, clique em Trocar e escolha outra (verde).

- ok · 1280: linha mostra "logo-verde.png"; prévia com a arte verde e sem a vermelha · [print](prints/monte/c13-trocar.jpg)

### C14 · Remover o anexo — ok

**Passos para repetir:** Com uma arte anexada, clique em Remover.

- ok · 1280: linha volta para "Arraste a arte…"; prévia volta ao marcador · [print](prints/monte/c14-remover.jpg)

### C15 · O mesmo anexo em várias posições — ok

**Passos para repetir:** Anexe no Centro do peito; em Costas inteira use "Usar a mesma arte de: 1. Centro do peito"; anexe o mesmo arquivo de novo na Nuca.

- ok · 1280: "Usar a mesma arte de" e anexar de novo: linhas com logo-transparente.png e logo-transparente.png; prévia das costas com arte em Costas inteira (sim) e Nuca (sim) · [print](prints/monte/c15-mesma-arte.jpg)

### C16 · Arrastar e soltar a arte — ok

**Passos para repetir:** Arraste um PNG para a caixa "Arraste a arte ou clique para escolher".

- ok · 1280: a arte solta na caixa fica anexada · [print](prints/monte/c16-arrastar.jpg)

### C17 · Prévia de cada anexo aceito (folha de contato) — ok

**Passos para repetir:** Anexe cada arquivo dos itens C1 a C13 no Centro do peito da Camiseta azul-marinho.

- ok · 1280: folha com a prévia de cada anexo aceito: [c-anexos-previa.jpg](prints/monte/c-anexos-previa.jpg) · [print](prints/monte/c-anexos-previa.jpg)

## D · Arte na prévia e na ficha

### D1 · A arte fica dentro da área em cada posição de cada peça — ok

**Passos para repetir:** Em cada peça, marque uma posição por vez e anexe um PNG transparente (círculo vermelho). Compare a prévia com a peça lisa.

- ok · 1280: todas as posições das 5 peças com a arte dentro da área (folga de 0,8% para as dobras). Recortes: [Camiseta](prints/monte/d1-camiseta.jpg) · [Polo](prints/monte/d1-polo.jpg) · [Regata](prints/monte/d1-regata.jpg) · [Baby look](prints/monte/d1-babylook.jpg) · [Moletom canguru](prints/monte/d1-moletom.jpg) · [print](prints/monte/d1-camiseta.jpg)

### D2 · A arte não encosta na gola — ok

**Passos para repetir:** Mesmo passo do D1: olhe o recorte de cada posição perto da gola (peitos, centro, frente inteira, nuca e costas em cima).

- ok · 1280: automático: a arte não sobe acima da área em nenhuma posição. Se a própria área pega a gola, só o olho vê: ver a revisão visual e os recortes do D1 · [print](prints/monte/d1-camiseta.jpg)

### D3 · Sem a arte de exemplo ("Sua arte") junto da arte anexada — ok

**Passos para repetir:** Mesmo passo do D1: depois de anexar, o marcador "Sua arte" tem que sumir da área.

- ok · 1280: nenhum resto do marcador "Sua arte" junto da arte, em nenhuma posição · [print](prints/monte/d1-camiseta.jpg)

### D4 · Várias posições com arte ao mesmo tempo, todas aparecem — ok

**Passos para repetir:** Marque Peito esquerdo, Peito direito, Nuca, Costas em cima e as duas mangas, anexe uma arte em cada e olhe Frente e Costas.

- ok · 1280: todas as artes aparecem juntas, na frente e nas costas, nas 5 peças · [print](prints/monte/d4-varias-artes.jpg)

### D5 · Prévia final (depois do passo Estampa) com as artes e a miniatura do outro lado — ok

**Passos para repetir:** Com as artes do D4, siga até a Quantidade e olhe a prévia e a miniatura.

- ok · 1280: depois do passo Estampa a prévia segue com as artes, a vitrine e a miniatura do outro lado · [print](prints/monte/d5-previa-final.jpg)

### D6 · A arte aparece na ficha em cada posição (foto e miniatura) — ok

**Passos para repetir:** Com as artes do D4, siga até o Resumo e olhe a ficha. Repita com Centro do peito + Costas inteira e com Frente inteira.

- ok · 1280: a arte aparece na foto da ficha (frente e costas) e na miniatura de cada linha, nas 3 combinações das 5 peças · [print](prints/monte/d6-ficha-com-artes.jpg)

## E · Quantidades

### E1 · Quantidade zero — ok

**Passos para repetir:** No passo Quantidade, não preencha nada e clique em Continuar.

- ok · 1280: mostra "Total 0 peças Faltam 50 peças para o mínimo de 50."; deixa continuar e o resumo diz "Tamanhos: a definir · Total: 0 peças" (a ficha também) · [print](prints/monte/e1-zero.jpg)

### E2 · Abaixo do mínimo (30 peças) — ok

**Passos para repetir:** Coloque M = 30.

- ok · 1280: Total 30 peças Faltam 20 peças para o mínimo de 50. · [print](prints/monte/e2-abaixo.jpg)

### E3 · No mínimo (50 peças), com os botões + e − — ok

**Passos para repetir:** Clique 3 vezes em + no P e 1 vez em −; escreva 48 no M.

- ok · 1280: +3 −1 deu P = 2; Total 50 peças; "−" fica desligado no zero: sim · [print](prints/monte/e3-minimo.jpg)

### E4 · Quantidade muito alta — falha

**Passos para repetir:** Escreva 1000000 no G; depois cole um número de 25 dígitos.

- **falha** · 390: 1000000 não cabe no campo; sem rolagem lateral · [print](prints/monte/e4-muito-alta-390.jpg)
- **falha** · 1280: 1000000 não cabe no campo (34 px); 25 dígitos viram "1e+25" e total "Total 1e+25 peças" · [print](prints/monte/e4-muito-alta.jpg)

### E5 · Tamanhos infantis e adultos juntos — ok

**Passos para repetir:** P 10 e M 20 no Adulto; 4 = 15 e 10 = 5 no Infantil.

- ok · 1280: grupos "Adulto · 30 | Infantil · 20"; resumo "• Tamanhos: P 10, M 20, Infantil 4: 15, Infantil 10: 5 · Total: 50 peças"; ficha "Tamanhos: P 10, M 20, Infantil 4: 15, Infantil 10: 5" · [print](prints/monte/e5-adulto-infantil.jpg)

### E6 · Outro tamanho: adicionar, repetido e remover — ok

**Passos para repetir:** Adulto → Adicionar outro tamanho → G4 → Adicionar; tente g4 de novo; quantidade 5; Remover.

- ok · 1280: G4 entra no resumo ("• Tamanhos: P 10, M 20, Infantil 4: 15, Infantil 10: 5, G4 5 · Total: 55 peças"); "g4" repetido fica desligado; Esc fecha; Remover tira do resumo · [print](prints/monte/e6-outro-tamanho.jpg)

### E7 · Letras e sinais no campo de quantidade — ok

**Passos para repetir:** Escreva abc, -5 e 1.5 no campo do GG.

- ok · 1280: abc → 0; -5 → 5; 1.5 → 15 (o campo só guarda dígitos) · [print](prints/monte/e7-letras.jpg)

## F · Navegação

### F1 · Continuar e Voltar entre os passos sem perder escolhas — ok

**Passos para repetir:** Faça o pedido inteiro (Polo, tecido, Turquesa, 2 posições com arte, DTF, tamanhos) e volte passo a passo com Voltar/Alterar.

- ok · 1280: cada passo reabre com o que foi escolhido (peça, tecido, cor, posições com os arquivos, técnica e tamanhos) e o resumo fica igual · [print](prints/monte/f1-ida-e-volta.jpg)

### F2 · Alterar + Cancelar desfaz; Alterar + Salvar guarda — ok

**Passos para repetir:** No Resumo, Alterar peça → Regata → Cancelar; de novo → Regata → Salvar.

- ok · 1280: Cancelar volta tudo como estava; Salvar guarda a Regata · [print](prints/monte/f2-cancelar-salvar.jpg)

### F3 · Recarregar a página no meio do pedido — falha

**Passos para repetir:** Com o pedido no passo Quantidade, aperte F5 (no celular, puxe a página para baixo).

- **falha** · 390: tudo volta ao começo: passo "Peça", prévia "Camiseta Azul-marinho" (peça, cor, posições, técnica e tamanhos se perdem) · [print](prints/monte/f3-recarregar-390.jpg)
- **falha** · 1280: tudo volta ao começo: passo "Peça", prévia "Camiseta Azul-marinho" (peça, cor, posições, técnica e tamanhos se perdem) · [print](prints/monte/f3-recarregar-1280.jpg)

### F4 · Voltar e avançar do navegador — ok

**Passos para repetir:** Vindo da home, monte parte do pedido, aperte Voltar do navegador e depois Avançar.

- ok · 390: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-390.jpg)
- ok · 768: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-768.jpg)
- ok · 1280: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-1280.jpg)
- ok · 1920: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-1920.jpg)
- ok · 2560: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-2560.jpg)
- ok · 67%: Voltar e Avançar mantêm a peça e a cor · [print](prints/monte/f4-voltar-avancar-67.jpg)

### F5 · Vir da home pela transição de tinta — ok

**Passos para repetir:** Na home, pule a abertura e clique em "Monte sua peça" na barra (no celular, Menu → Monte sua peça).

- ok · 390: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-390.jpg)) · [print](prints/monte/f5-chegou-390.jpg)
- ok · 768: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-768.jpg)) · [print](prints/monte/f5-chegou-768.jpg)
- ok · 1280: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-1280.jpg)) · [print](prints/monte/f5-chegou-1280.jpg)
- ok · 1920: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-1920.jpg)) · [print](prints/monte/f5-chegou-1920.jpg)
- ok · 2560: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-2560.jpg)) · [print](prints/monte/f5-chegou-2560.jpg)
- ok · 67%: chega pela tinta, a arara e a prévia desenham, sem erro ([meio da transição](prints/monte/f5-transicao-meio-67.jpg)) · [print](prints/monte/f5-chegou-67.jpg)

### F6 · Escolher outra peça na arara no meio do pedido — ok

**Passos para repetir:** No passo Quantidade, clique no Baby look da arara.

- ok · 1280: continua no passo "Quantidade" e o passo Peça mostra "Baby look · Não sei, me indiquem" · [print](prints/monte/f6-arara-no-meio.jpg)

## G · Teclado, leitor de tela, contraste e alvos de toque

### G1 · O pedido inteiro só com o teclado — ok

**Passos para repetir:** Do título da página, só Tab, Shift+Tab, Enter, Espaço e setas: Polo, tecido, Turquesa, Peito esquerdo no mapa, Costas inteira, anexo, DTF, quantidade, ficha, dados e envio.

- ok · 1280: pedido completo e enviado só com o teclado (81 paradas do Tab) · [print](prints/monte/g1-teclado.jpg)

### G2 · Foco visível em todos os controles — ok

**Passos para repetir:** Mesmo caminho do G1: cada parada do Tab tem que mostrar o anel de foco.

- ok · 1280: todas as 81 paradas com anel de foco · [print](prints/monte/g1-teclado.jpg)

### G3 · Ao avançar, o foco vai para o título do passo — ok

**Passos para repetir:** Clique em Continuar e veja onde fica o foco (o leitor de tela lê o nome do passo).

- ok · 1280: 4 de 4 avanços levam o foco ao título do passo · [print](prints/monte/g3-foco-no-titulo.jpg)

### G4 · Nomes e estados para o leitor de tela — falha

**Passos para repetir:** Com o leitor de tela (NVDA/VoiceOver), percorra a arara, a prévia, a ficha e os campos.

- **falha** · 1280: o "✓ feito" dos passos é um <svg aria-label> sem role="img" (alguns leitores não leem); texto alternativo da ficha sem espaço: "Ficha da estampa: Camiseta, Azul-marinho, Não sei, me indiquem, Silk,0 posições" (4 alertas ao enviar vazio). Árvore completa: [g4-arvore-acessibilidade.txt](prints/monte/g4-arvore-acessibilidade.txt) · [print](prints/monte/g4-passos-e-erros.jpg)

### G5 · Rótulos, ARIA e contraste (axe) em cada passo — falha

**Passos para repetir:** Rode o axe (extensão axe DevTools) em cada passo, a 390 e a 1280.

- **falha** · 390: label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Peito esquerdo"]; label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Costas inteira"] · [print](prints/monte/g5-g6-estampa-390.jpg)
- **falha** · 1280: label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Peito esquerdo"]; label-content-name-mismatch (Elements must have their visible text as part of their accessible name): button[aria-label="Costas inteira"] · [print](prints/monte/g5-g6-estampa-1280.jpg)

### G6 · Alvos de toque com 44 px ou mais — falha

**Passos para repetir:** Em cada passo, meça os botões, caixas e campos (DevTools).

- **falha** · 390: Zoom (14 × 14) · [print](prints/monte/g5-g6-estampa-390.jpg)
- **falha** · 768: Zoom (14 × 14) · [print](prints/monte/g5-g6-estampa-768.jpg)
- **falha** · 1280: Zoom (14 × 14) · [print](prints/monte/g5-g6-estampa-1280.jpg)

## H · Ficha baixada e WhatsApp

### H1 · A ficha baixada (PNG) é a mesma da tela — ok

**Passos para repetir:** No Resumo, clique em Baixar ficha.

- ok · 390: "ficha-whim-polo-2026-11-17.png", PNG 1600 × 1000, 370 KB, igual à da tela · [print](prints/monte/h1-ficha-baixada-390.jpg)
- ok · 1280: "ficha-whim-polo-2026-11-17.png", PNG 1600 × 1000, 370 KB, igual à da tela · [print](prints/monte/h1-ficha-baixada-1280.jpg)

### H2 · A ficha confere com o que foi escolhido — ok

**Passos para repetir:** Compare a ficha com o pedido (peça, cor, técnica, tecido, posições, arquivos, medidas, total e tamanhos).

- ok · 390: ficha com peça, cor, técnica, tecido, as 2 posições com medida e arquivo, total e tamanhos · [print](prints/monte/h1-ficha-baixada-390.jpg)
- ok · 1280: ficha com peça, cor, técnica, tecido, as 2 posições com medida e arquivo, total e tamanhos · [print](prints/monte/h1-ficha-baixada-1280.jpg)

### H3 · O texto do WhatsApp confere com o resumo — ok

**Passos para repetir:** Preencha os dados e clique em Enviar pelo WhatsApp; compare a mensagem com o resumo.

- ok · 390: mensagem igual ao resumo da tela, com contato, peça, cor, tecido, técnica, posições com medida e arquivo e tamanhos (https://wa.me/5511945448802) · [print](prints/monte/h3-resumo-390.jpg)
- ok · 1280: mensagem igual ao resumo da tela, com contato, peça, cor, tecido, técnica, posições com medida e arquivo e tamanhos (https://wa.me/5511945448802) · [print](prints/monte/h3-resumo-1280.jpg)

### H4 · Seus dados: erros e foco — ok

**Passos para repetir:** Clique em Enviar com tudo vazio; depois telefone 123 e e-mail a@b.

- ok · 390: vazio: 4 erros e foco em #pedido-nome; telefone 123 e e-mail a@b: "Telefone com DDD, como (11) 98765-4321. / Confira o e-mail, como nome@empresa.com.br. / Marque a autorização para enviar."; não abre o WhatsApp · [print](prints/monte/h4-erros-390.jpg)
- ok · 1280: vazio: 4 erros e foco em #pedido-nome; telefone 123 e e-mail a@b: "Telefone com DDD, como (11) 98765-4321. / Confira o e-mail, como nome@empresa.com.br. / Marque a autorização para enviar."; não abre o WhatsApp · [print](prints/monte/h4-erros-1280.jpg)

### H5 · O contato gravado leva o mesmo pedido do resumo — ok

**Passos para repetir:** Envie e veja o corpo do POST /api/contatos (DevTools → Rede).

- ok · 390: POST /api/contatos: origem "monte-sua-peca", pedido igual ao resumo, consentimento true, ofertas true · [print](prints/monte/h5-enviado-390.jpg)
- ok · 1280: POST /api/contatos: origem "monte-sua-peca", pedido igual ao resumo, consentimento true, ofertas true · [print](prints/monte/h5-enviado-1280.jpg)

## L · Telas (390, 768, 1280, 1920, 2560 e zoom de 67%)

### L1 · Fluxo completo, com print de cada passo — ok

**Passos para repetir:** Faça o pedido do F1 na tela indicada.

- ok · 390: pedido completo nos 5 passos; prints: [1](prints/monte/l-390-passo1.jpg) [2](prints/monte/l-390-passo2.jpg) [3](prints/monte/l-390-passo3.jpg) [4](prints/monte/l-390-passo4.jpg) [5](prints/monte/l-390-passo5.jpg) · [print](prints/monte/l-390-passo3.jpg)
- ok · 768: pedido completo nos 5 passos; prints: [1](prints/monte/l-768-passo1.jpg) [2](prints/monte/l-768-passo2.jpg) [3](prints/monte/l-768-passo3.jpg) [4](prints/monte/l-768-passo4.jpg) [5](prints/monte/l-768-passo5.jpg) · [print](prints/monte/l-768-passo3.jpg)
- ok · 1280: pedido completo nos 5 passos; prints: [1](prints/monte/l-1280-passo1.jpg) [2](prints/monte/l-1280-passo2.jpg) [3](prints/monte/l-1280-passo3.jpg) [4](prints/monte/l-1280-passo4.jpg) [5](prints/monte/l-1280-passo5.jpg) · [print](prints/monte/l-1280-passo3.jpg)
- ok · 1920: pedido completo nos 5 passos; prints: [1](prints/monte/l-1920-passo1.jpg) [2](prints/monte/l-1920-passo2.jpg) [3](prints/monte/l-1920-passo3.jpg) [4](prints/monte/l-1920-passo4.jpg) [5](prints/monte/l-1920-passo5.jpg) · [print](prints/monte/l-1920-passo3.jpg)
- ok · 2560: pedido completo nos 5 passos; prints: [1](prints/monte/l-2560-passo1.jpg) [2](prints/monte/l-2560-passo2.jpg) [3](prints/monte/l-2560-passo3.jpg) [4](prints/monte/l-2560-passo4.jpg) [5](prints/monte/l-2560-passo5.jpg) · [print](prints/monte/l-2560-passo3.jpg)
- ok · 67%: pedido completo nos 5 passos; prints: [1](prints/monte/l-67-passo1.jpg) [2](prints/monte/l-67-passo2.jpg) [3](prints/monte/l-67-passo3.jpg) [4](prints/monte/l-67-passo4.jpg) [5](prints/monte/l-67-passo5.jpg) · [print](prints/monte/l-67-passo3.jpg)

### L2 · Sem rolagem lateral e nada cortado — ok

**Passos para repetir:** Em cada passo, role para os lados e confira as bordas dos cartões.

- ok · 390: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-390-passo3.jpg)
- ok · 768: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-768-passo3.jpg)
- ok · 1280: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-1280-passo3.jpg)
- ok · 1920: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-1920-passo3.jpg)
- ok · 2560: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-2560-passo3.jpg)
- ok · 67%: sem rolagem lateral e nada passa da borda · [print](prints/monte/l-67-passo3.jpg)

### L3 · A prévia cabe inteira na tela (PC) — ok

**Passos para repetir:** Em cada passo, role a ficha e veja se a prévia fica inteira na tela.

- ok · 390: no celular a prévia fica em cima da ficha (não se aplica) · [print](prints/monte/l-390-passo3.jpg)
- ok · 768: no celular a prévia fica em cima da ficha (não se aplica) · [print](prints/monte/l-768-passo3.jpg)
- ok · 1280: a prévia fica inteira na tela enquanto a ficha rola · [print](prints/monte/l-1280-passo3.jpg)
- ok · 1920: a prévia fica inteira na tela enquanto a ficha rola · [print](prints/monte/l-1920-passo3.jpg)
- ok · 2560: a prévia fica inteira na tela enquanto a ficha rola · [print](prints/monte/l-2560-passo3.jpg)
- ok · 67%: a prévia fica inteira na tela enquanto a ficha rola · [print](prints/monte/l-67-passo3.jpg)

### L4 · Sem vão grande embaixo da vitrine — falha

**Passos para repetir:** Em cada passo, role a ficha até o fim e veja o espaço vazio embaixo da prévia.

- ok · 390: no celular a ficha fica embaixo da prévia (não se aplica) · [print](prints/monte/l-390-passo3.jpg)
- ok · 768: no celular a ficha fica embaixo da prévia (não se aplica) · [print](prints/monte/l-768-passo3.jpg)
- ok · 1280: sem vão grande embaixo da prévia · [print](prints/monte/l-1280-passo3.jpg)
- ok · 1920: sem vão grande embaixo da prévia · [print](prints/monte/l-1920-passo3.jpg)
- **falha** · 2560: passo 3: 455 px (32% da altura da tela) [print](prints/monte/l-2560-vao-passo3.jpg); passo 5: 459 px (32% da altura da tela) [print](prints/monte/l-2560-vao-passo5.jpg) · [print](prints/monte/l-2560-passo3.jpg)
- **falha** · 67%: passo 3: 627 px (39% da altura da tela) [print](prints/monte/l-67-vao-passo3.jpg); passo 5: 627 px (39% da altura da tela) [print](prints/monte/l-67-vao-passo5.jpg) · [print](prints/monte/l-67-passo3.jpg)

### L5 · Sem erros no console — ok

**Passos para repetir:** Abra o DevTools → Console durante o fluxo.

- ok · 390: nenhum erro no console durante os 5 passos · [print](prints/monte/l-390-passo5.jpg)
- ok · 768: nenhum erro no console durante os 5 passos · [print](prints/monte/l-768-passo5.jpg)
- ok · 1280: nenhum erro no console durante os 5 passos · [print](prints/monte/l-1280-passo5.jpg)
- ok · 1920: nenhum erro no console durante os 5 passos · [print](prints/monte/l-1920-passo5.jpg)
- ok · 2560: nenhum erro no console durante os 5 passos · [print](prints/monte/l-2560-passo5.jpg)
- ok · 67%: nenhum erro no console durante os 5 passos · [print](prints/monte/l-67-passo5.jpg)

