# Espaços vazios grandes

Gerado por `scripts/espacos-vazios.mjs` em 17/11/2026, 18:53:35, contra http://localhost:3417.
Telas: 1280 × 800, 1920 × 1080, 2560 × 1440 e 1920 × 1080 com zoom de 67% (2866 × 1612 px de CSS) e de 50% (3840 × 2160 px de CSS).
Entra aqui o vão (só fundo liso) com pelo menos 30% da altura da tela e 30% da largura do conteúdo, medido com a barra e o botão do WhatsApp escondidos: **coluna** quando ao lado há conteúdo em pelo menos metade da altura (uma coluna acabou e a outra continua, como embaixo da vitrine do Monte sua peça), **faixa** quando ocupa quase a largura toda e pelo menos metade da altura da tela. Respiro em volta de títulos e margens de bloco centralizado não contam. O retângulo vermelho tracejado no print é o vão.

<!-- leitura manual: o script mantém o que estiver entre esta linha e a de fim -->
## Leitura

Conferido em cada print em 17/11/2026. O que é vão de verdade e de quem é:

1. **Monte sua peça · vão embaixo da vitrine (prévia), passos Estampa e Resumo** · 2560 (456 px, 32% da altura da tela), zoom 67% (627 px, 39%) e zoom 50% (704 a 1064 px). A prévia fica parada no alto da tela enquanto a ficha rola; a altura dela é presa pela largura da coluna (proporção 4:5), então em tela alta sobra fundo embaixo até o fim da ficha. A 1280 e a 1920 não aparece. É o mesmo vão do item L4 do checklist do Monte sua peça. → **agente 1**. Prints: [v07](prints/vazios/v07-2560-montesuapeca-estampa.jpg), [v08](prints/vazios/v08-2560-montesuapeca-resumo.jpg), [v13](prints/vazios/v13-67-montesuapeca-estampa.jpg), [v14](prints/vazios/v14-67-montesuapeca-resumo.jpg), [v16](prints/vazios/v16-50-montesuapeca-estampa.jpg), [v17](prints/vazios/v17-50-montesuapeca-resumo.jpg).
2. **Monte sua peça · vão embaixo da ficha no passo Peça (quem acabou de chegar)** · 1920 (544 × 768 px, 50% da altura da tela), 2560 e zoom 67%. A ficha do passo 1 é curta e a prévia é alta: à direita sobra fundo até o "Fale com a Whim". É o espelho do item 1: a coluna que acaba antes muda conforme o passo. → **agente 1**. Prints: [v02](prints/vazios/v02-1920-montesuapeca.jpg), [v06](prints/vazios/v06-2560-montesuapeca.jpg), [v12](prints/vazios/v12-67-montesuapeca.jpg).
3. **Monte sua peça · arara a 1920** · as 5 peças ficam no meio de um cano de 1520 px e sobra cano vazio dos dois lados (400 × 448 px à direita). Baixo. → **agente 1**. Print: [v01](prints/vazios/v01-1920-montesuapeca.jpg).
4. **404 a 1920** · o texto fica à esquerda e a metade direita da área clara fica vazia (432 × 800 px, 40% da altura da tela). A 1280 não chega ao limite. Baixo. → **agente 3** (fica pendente: este pedido não muda código de produção). Print: [v05](prints/vazios/v05-1920-paginaquenaoexiste.jpg).
5. **Home com zoom de 67% e 50%** · os achados em Processo e Dúvidas são a margem dos lados, não vão dentro do conteúdo: a home fica em ~1470 px no meio de 2866 e 3840 px de CSS, e a faixa de logos, que vai de borda a borda, faz o script ver a margem como coluna vazia. Com zoom de 50% o conteúdo ocupa ~40% da largura. Baixo, decisão de desenho. → **agente 2**. Prints: [v10](prints/vazios/v10-67-home.jpg), [v11](prints/vazios/v11-67-home.jpg), [v15](prints/vazios/v15-50-home.jpg).
6. **Sem vão grande:** home a 1280, 1920 e 2560; /privacidade em todas as telas; rodapé (a coluna de links acaba antes do mapa, mas fica abaixo do limite).
<!-- fim da leitura manual -->

## Vãos encontrados (automático)

| Página | Tela | Onde | Tipo | Tamanho | Print | Dono |
|---|---|---|---|---|---|---|
| /monte-sua-peca (passo Peça) | 1920 | #personalizar ("Escolha na arara e personalize.") | coluna | 400 × 448 px (37% da altura da tela), a 368 px do topo | [print](prints/vazios/v01-1920-montesuapeca.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Peça) | 1920 | #personalizar ("Escolha na arara e personalize.") | coluna | 544 × 768 px (50% da altura da tela), a 1328 px do topo | [print](prints/vazios/v02-1920-montesuapeca.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Estampa) | 1920 | #personalizar ("Escolha na arara e personalize.") | coluna | 400 × 448 px (37% da altura da tela), a 368 px do topo | [print](prints/vazios/v03-1920-montesuapeca-estampa.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Resumo) | 1920 | #personalizar ("Escolha na arara e personalize.") | coluna | 400 × 448 px (37% da altura da tela), a 368 px do topo | [print](prints/vazios/v04-1920-montesuapeca-resumo.jpg) | agente 1 (Monte sua peça) |
| 404 | 1920 | main ("Esta página não existe.") | coluna | 432 × 800 px (40% da altura da tela), a 91 px do topo | [print](prints/vazios/v05-1920-paginaquenaoexiste.jpg) | agente 3 (qualidade: /privacidade e 404) |
| /monte-sua-peca (passo Peça) | 2560 | #personalizar ("Escolha na arara e personalize.") | coluna | 544 × 768 px (38% da altura da tela), a 1328 px do topo | [print](prints/vazios/v06-2560-montesuapeca.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Estampa) | 2560 | #personalizar ("Escolha na arara e personalize.") | coluna | 456 × 768 px (32% da altura da tela), a 1704 px do topo | [print](prints/vazios/v07-2560-montesuapeca-estampa.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Resumo) | 2560 | #personalizar ("Escolha na arara e personalize.") | coluna | 456 × 792 px (32% da altura da tela), a 1704 px do topo | [print](prints/vazios/v08-2560-montesuapeca-resumo.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Resumo) | 2560 | #personalizar ("Escolha na arara e personalize.") | coluna | 456 × 792 px (32% da altura da tela), a 2228 px do topo | [print](prints/vazios/v09-2560-montesuapeca-resumo.jpg) | agente 1 (Monte sua peça) |
| / | zoom 67% | #processo ("Do pedido à entrega.") | coluna | 507 × 694 px (31% da altura da tela), a 4231 px do topo | [print](prints/vazios/v10-67-home.jpg) | agente 2 (home) |
| / | zoom 67% | #duvidas ("Antes de pedir o orçamento.") | coluna | 1075 × 694 px (67% da altura da tela), a 5373 px do topo | [print](prints/vazios/v11-67-home.jpg) | agente 2 (home) |
| /monte-sua-peca (passo Peça) | zoom 67% | #personalizar ("Escolha na arara e personalize.") | coluna | 545 × 769 px (34% da altura da tela), a 1328 px do topo | [print](prints/vazios/v12-67-montesuapeca.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Estampa) | zoom 67% | #personalizar ("Escolha na arara e personalize.") | coluna | 627 × 761 px (39% da altura da tela), a 1696 px do topo | [print](prints/vazios/v13-67-montesuapeca-estampa.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Resumo) | zoom 67% | #personalizar ("Escolha na arara e personalize.") | coluna | 627 × 791 px (39% da altura da tela), a 1791 px do topo | [print](prints/vazios/v14-67-montesuapeca-resumo.jpg) | agente 1 (Monte sua peça) |
| / | zoom 50% | #duvidas ("Antes de pedir o orçamento.") | coluna | 1248 × 1184 px (58% da altura da tela), a 5920 px do topo | [print](prints/vazios/v15-50-home.jpg) | agente 2 (home) |
| /monte-sua-peca (passo Estampa) | zoom 50% | #personalizar ("Escolha na arara e personalize.") | coluna | 704 × 768 px (33% da altura da tela), a 1619 px do topo | [print](prints/vazios/v16-50-montesuapeca-estampa.jpg) | agente 1 (Monte sua peça) |
| /monte-sua-peca (passo Resumo) | zoom 50% | #personalizar ("Escolha na arara e personalize.") | coluna | 1064 × 800 px (49% da altura da tela), a 1620 px do topo | [print](prints/vazios/v17-50-montesuapeca-resumo.jpg) | agente 1 (Monte sua peça) |

## Quanto da largura o conteúdo ocupa

Da borda esquerda à direita dos textos e imagens, na tela mais larga de cada página (na home, a faixa de logos vai de borda a borda e puxa o número para cima).

| Página | 1280 | 1920 | 2560 | zoom 67% | zoom 50% |
|---|---|---|---|---|---|
| / | 95% | 88% | 79% | 76% | 69% |
| /monte-sua-peca (passo Peça) | 89% | 77% | 58% | 52% | 39% |
| /monte-sua-peca (passo Estampa) | 89% | 77% | 58% | 52% | 39% |
| /monte-sua-peca (passo Resumo) | 89% | 77% | 58% | 52% | 39% |
| /privacidade | 89% | 77% | 58% | 52% | 39% |
| 404 | 89% | 77% | 58% | 52% | 39% |
