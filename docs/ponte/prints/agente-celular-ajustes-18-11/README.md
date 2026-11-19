# Celular, ajustes de 18/11 à noite: prints e item 4

Celular a 390 px (Chromium com o iPhone 13 do Playwright, DPR 2). **Antes** = main com o merge do logo (`3cd69db`); **depois** = branch `agente-celular/ajustes-18-11`. No PC, páginas inteiras com movimento reduzido comparadas em PNG: as 4 iguais pixel a pixel (aqui em JPG reduzido a 50%).

| Item | Arquivos (`-antes` e `-depois`) |
| --- | --- |
| 1 · Passo Peça só com a arara; vitrine a partir do Cor | `390-monte-1-peca`, `390-monte-2-cor` |
| 2 · Confecção, Uniformes e "Não sabe qual?" numa linha | `390-tecnicas` |
| 3 · Texto no centro | `390-hero`, `390-sobre`, `390-convite`, `390-monte-3-estampa` (a pergunta do passo) |
| 4 · Tinta do "Vista" no WebKit | `390-tinta-webkit` (quadros a 0,15, 0,6, 1,1, 1,6 e 2,1 s da tinta) |
| 5 · Respiro | `390-processo`, `390-home-pagina` (página inteira) |
| 6 · "Marcas que confiam" logo depois da hero | `390-home-pagina`, `390-clientes` |
| 7 · Rodapé, 4ª dúvida e balão fora do passo Estampa | `390-rodape`, `390-duvidas`, `390-balao-estampa` |
| 8 · Navegação sempre à vista, em duas colunas | `390-rodape` |
| PC (1280 e 1920) | `pc-1280-home`, `pc-1280-monte`, `pc-1920-home`, `pc-1920-monte` |

## Item 4: tela de erro e tinta do "Vista"

**O que foi testado** (`scripts/idas-e-voltas.mjs`): 20 idas e voltas Monte → home pelo logo, pelo menu e pelo Voltar do navegador, com e sem a abertura, no Chromium e no WebKit (iPhone 13). Rodou 12 cenários × 20 voltas no build de antes e no de depois (`cf07120`). No build final (`3667ea7`, só muda a transição de tinta) foram 11 × 20, e o 12º (WebKit, sem abertura, pelo Voltar) parou em 13 voltas quando a sessão caiu. Em todos: nenhuma tela de erro e console limpo. Também sem erro: as checagens finais (360, 390 e 430 × Chromium e WebKit × movimento normal e reduzido: 384 ok, 0 falhas; sem rolagem lateral, alvos ≥ 44 px, ordem do rodapé, linha das técnicas e flutuante, passo Peça, balão, seção marcada no menu), idas e voltas com pressa (no meio da abertura e da tinta), a troca de versão do site com a aba aberta (deploy) e a tinta com a CPU 6× mais lenta (145 quadros em 2,8 s). No WebKit a tinta pinta do início ao fim.

**Causa: o DOM era mexido fora do React, e só no iPhone.** Simulado no WebKit:

1. **Data detectors do Safari.** O iPhone transforma o telefone, o CEP e o CNPJ do rodapé em links, mexendo no HTML antes de o React hidratar. Resultado em toda carga: erro #418 (hidratação) e o React recria a página aos ~0,8 s. A abertura some e recomeça do zero e o "Vista" é recriado: é a tinta que "falha". Daí em diante o DOM não é o que o React espera, e mexer nesses nós pode dar "not a child of this node" (no Safari, `NotFoundError`), que é o erro que a tela "Esta página não carregou" pega. **Correção:** `formatDetection` no `layout.tsx` (`<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">`); os contatos já são links. Depois da correção, na simulação: sem #418 e sem recriar a abertura.
2. **iOS anterior ao 17.4 sem `checkVisibility`.** Sair da home no meio da tinta dava `TypeError` (reproduzido no WebKit sem a função). Trocado por `getClientRects()`.
3. **Canvas da tinta posto e tirado à mão** (`document.createElement`, `texto.after`, `canvas.remove`) dentro de um `<span>` do React, a suspeita do pedido. Agora o `<canvas>` é do React (vem vazio no HTML) e o efeito só desenha nele. O site não insere nem remove mais nenhum nó fora do React.

**Também corrigido (nos dois navegadores): toque engolido durante a transição de tinta** (`transicao-pinta.tsx`). Um toque num link nos ~0,8 s da transição Monte ↔ home era cancelado e descartado: "toquei no logo e nada". Se uma animação falhasse no meio, a transição ficava presa e nenhum link entre Monte e home funcionava mais até recarregar. No build de antes do merge do logo (`72adba4`) era pior: o toque engolido ainda marcava a abertura no Monte (o merge já tirou isso). **Correção:** o toque guarda o destino e vai para lá assim que a transição acaba, e um `finally` garante que ela nunca fica presa. No teste com pressa do WebKit pelo logo (mesma sequência), passou de 3 para 20 de 20 voltas.

**Pendente:** conferir num iPhone de verdade, porque os data detectors só existem no Safari do aparelho.
