# Auditoria final do site: 19/11

Auditoria feita sem mudar código de produção, no build de produção do `main` em `9fcbbe2` (`npm run build` + `next start`). Os prints estão em [`prints/auditoria-19-11/`](prints/auditoria-19-11/).

**Como foi feita**

- **Regressão** com Playwright em 4 páginas: home, Monte sua peça (pedido inteiro, do passo 1 ao WhatsApp), `/privacidade` e 404.
  - Larguras: 360, 390, 430, 768, 1280, 1920 e 2560 px.
  - Navegadores: Chromium e WebKit (o motor do Safari).
  - Movimento normal e reduzido.
  - São **28 combinações e 1.028 checagens**.
  - Até 768 px a página roda como celular ou tablet, com toque e DPR 2 no celular.
- **Acessibilidade:** axe-core (WCAG 2.2 AA) nas 4 páginas, nas 7 larguras.
- **Revisão de design** com a skill impeccable:
  - `/critique`: duas avaliações isoladas. A é a revisão de design; B é o detector automático com marcações na página.
  - `/audit`: as 5 dimensões técnicas.
  - Os critérios da skill frontend-design: hierarquia, contenção, movimento com propósito, sinais de página genérica.
- **Lighthouse 13.6** local no celular e no PC, nas 3 páginas.
- **20 idas e voltas** Monte → home pelo logo, pelo menu e pelo Voltar, com e sem abertura, nos 2 navegadores (`scripts/idas-e-voltas.mjs`).

**O que não foi possível testar:** iPhone e Android de verdade (o WebKit do Playwright não tem os data detectors nem o teclado real do iOS) e o site publicado. O Lighthouse rodou local, numa máquina Windows: os números absolutos ficam abaixo dos do PageSpeed no servidor, mas servem para comparar as páginas e achar o que pesa.

## Resumo

| | Resultado |
|---|---|
| Regressão | 1.028 checagens: **894 ok**, 128 falhas e 6 falsos positivos do próprio teste (explicados em [Regressão](#regressão-o-que-passou)). As 128 falhas são repetições, em várias larguras e nos 2 navegadores, de 9 problemas: A1, A2, M1, M6, M7, M8, B4, B5 e B6. |
| Rolagem lateral | **Nenhuma**, nas 4 páginas × 7 larguras × 2 navegadores × 2 movimentos |
| Pedido do passo 1 ao WhatsApp | **28 de 28**: peça, posição e quantidade chegam na mensagem |
| Interações | Menu e seção atual, abas das técnicas, vídeo da Yamaha no Silk, capítulos da oficina, Processo com a rolagem, arrasto das fotos e faixa de marcas com a Yamaha: todas passaram (só a pílula do Safari em tela grande falhou, item M1) |
| Idas e voltas Monte → home | **240 de 240** sem a tela de erro, console limpo ([detalhes](#idas-e-voltas-monte--home)) |
| Lighthouse (local) | Acessibilidade, Práticas e SEO **100** nas 6 medições. Desempenho: celular 52 (home), 48 (Monte), 90 (privacidade); PC 68, 63 e 99 |
| impeccable `/audit` | **14/20 (Bom)**: acessibilidade 3, desempenho 2, responsivo 3, tema 3, integridade 3 |
| impeccable `/critique` | **29/40 (Bom)** nas heurísticas de Nielsen |
| Regras de marca | Logo intacto em todas as aparições, só Poppins, nenhuma cor de interface fora da paleta, exceto o vermelho de erro (B2). **Faltam selos** de "Imagem ilustrativa" (A1). Há um nome pessoal no Quem somos do PC (B1) |

## Lista por prioridade

Em cada item: página, largura, navegador, print e a sugestão de correção (com o comando da impeccable que cuida dele).

### Alta

**A1. Imagem gerada por IA sem o selo "Imagem ilustrativa"**
- **Onde:**
  - Home, foto da hero: as 7 larguras, nos 2 navegadores.
  - Home, foto da seção Dúvidas (`camiseta-whim-mesa.webp`): de 768 px para cima, nos 2 navegadores.
- **Prints:** [hero a 390, Chromium](prints/auditoria-19-11/a1-selo-hero-390-chromium.jpg) · [hero a 1280, WebKit](prints/auditoria-19-11/a1-selo-hero-1280-webkit.jpg) · [Dúvidas a 1280, Chromium](prints/auditoria-19-11/a1-selo-duvidas-1280-chromium.jpg)
- **O que acontece:** fere a regra de marca (toda imagem de IA leva o selo). O "imagem ilustrativa" da hero está só no `alt`, não aparece na tela. É a primeira imagem do site, numa empresa cuja promessa é "oficina própria".
- **Sugestão:**
  - Já: o mesmo selo dos cartões das técnicas no canto inferior esquerdo da hero e da foto das Dúvidas.
  - Depois: trocar a hero por material real. O vídeo da Yamaha (`yamaha-silk-loop.mp4`) ou o da mesa longa já estão no site.
  - Comandos: `/impeccable polish` (selo) e `/impeccable bolder` (hero real).

**A2. Botão flutuante do WhatsApp em cima dos controles do Monte sua peça no celular**
- **Onde:** Monte sua peça.
  - Passo Quantidade: os "+" e as caixas de M e G a 390; de P e M a 360; de GG e G1 a 430.
  - Passo Estampa: "Costas inteira" a 360.
  - Nos 2 navegadores, com movimento normal e reduzido.
- **Prints:** [Quantidade a 390, Chromium](prints/auditoria-19-11/a2-flutuante-quantidade-390-chromium.jpg) · [Estampa a 360, WebKit](prints/auditoria-19-11/a2-flutuante-estampa-360-webkit.jpg)
- **O que acontece:** no celular o botão sobe para cima da barra Voltar/Continuar e fica sobre a área do passo. Um toque errado no "+" leva ao WhatsApp sem a ficha, no meio do pedido.
- **Sugestão:**
  - Esconder o flutuante em todos os passos do Monte sua peça abaixo de 601 px; hoje ele só some no Resumo, que já termina no WhatsApp. É uma regra CSS ao lado da que já existe em `botao-whatsapp.tsx`.
  - Comando: `/impeccable adapt`.

**A3. O pedido vai para o WhatsApp com 0 peças e com a técnica que o cliente não escolheu**
- **Onde:** Monte sua peça, todas as larguras, nos 2 navegadores. Confirmado a 390 no Chromium: tocando só em "Continuar", os 4 passos ganham ✓.
- **Print:** [Resumo com 0 peças a 390, Chromium](prints/auditoria-19-11/a3-pedido-0-pecas-390-chromium.jpg)
- **O que acontece:** a mensagem sai assim: "Técnica: Silk · Estampas: a definir · Tamanhos: a definir · Total: 0 peças". O ✓ da Quantidade diz algo falso (o mínimo é 50). A técnica vem marcada como Silk sem o cliente escolher. A mensagem é o próprio lead: "0 peças" parece brincadeira e obriga a equipe a uma volta a mais.
- **Sugestão:**
  - Abaixo do mínimo, o passo Quantidade fica "a definir", sem ✓, e a mensagem diz "Quantidade: a definir (mínimo 50)". Não é preciso bloquear.
  - Na Técnica, a opção "Não sei, me indiquem" (como já existe no Tecido), sem nada marcado de início.
  - Comandos: `/impeccable harden` e `/impeccable clarify`.

**A4. Monte sua peça lento no celular: a foto que é o LCP carrega "preguiçosa"**
- **Onde:** Monte sua peça, celular (Lighthouse), passo Peça.
- **Print:** [passo Peça a 390, Chromium](prints/auditoria-19-11/a4-monte-passo-peca-390-chromium.jpg)
- **O que acontece:**
  - Desempenho 48 e LCP de 6,3 s. O maior elemento da primeira tela é uma peça da arara do passo Peça (`AraraGrade`, em `arara.tsx`), que tem `loading="lazy"`: o navegador só a pede depois de montar a página.
  - O Lighthouse também aponta 3,1 s de bloqueio da thread principal, a maior parte em `794-….js`, o pacote comum do React e do Next.
- **Sugestão:**
  - `loading="eager"` e `fetchPriority="high"` na 1ª fileira da arara do passo Peça (no PC a arara já usa `eager`).
  - Depois, medir o bloqueio no PageSpeed com o site publicado.
  - Comando: `/impeccable optimize`.

### Média

**M1. Pílula da seção atual deslocada no Safari em tela grande**
- **Onde:** home, barra, a 1920 e a 2560 px, no WebKit (no Chromium está certa). Com "Processo" marcado, a pílula fica 38 px (1920) e 70 px (2560) à esquerda, entre "Serviços" e "Processo".
- **Print:** [barra a 1920, WebKit](prints/auditoria-19-11/m1-pilula-1920-webkit.jpg)
- **Sugestão:**
  - A barra usa `zoom` a partir de 1800 px. O WebKit mede `offsetLeft` com o `zoom` de outro jeito.
  - Medir pela diferença dos `getBoundingClientRect()` (do `li` e da `ul`) dividida pelo zoom (largura na tela ÷ `offsetWidth`), em `site-header.tsx`.
  - Comando: `/impeccable adapt`.

**M2. Home lenta no celular**
- **Onde:** home, celular (Lighthouse local).
- **O que acontece:**
  - Desempenho 52: LCP de 4,5 s (a foto da hero) e 3,4 s de bloqueio da thread principal (5 s de "outros", fora o JavaScript).
  - O peso é bom: 1,26 MB, dos quais 0,93 MB são imagens.
  - A thread principal carrega ao mesmo tempo a abertura, a tinta em WebGL, os 3 cartões das técnicas montados, os capítulos e o Processo preso à rolagem.
- **Sugestão:**
  - Medir no PageSpeed com o site publicado. Em 18/11 a home deu 94 no celular, antes dos capítulos, das abas montadas e do vídeo.
  - Se cair, adiar o que fica abaixo da dobra (capítulos, vídeo e cartões montados) até a abertura acabar.
  - Comando: `/impeccable optimize`.

**M3. Home no PC pesa 5,4 MB por causa do vídeo da oficina**
- **Onde:** home, a 1280 (Lighthouse PC), nos 2 navegadores.
- **Print:** [home inteira a 1280, Chromium](prints/auditoria-19-11/m3-home-pagina-1280-chromium.jpg)
- **O que acontece:** o `oficina-silk-loop.mp4` (4,1 MB) baixa na carga do PC, no mosaico do Quem somos. O resto da página soma 1,3 MB.
- **Sugestão:**
  - Baixar o vídeo só quando o mosaico entra na tela (como o vídeo da Yamaha já faz).
  - E uma versão de 720p, que deve ficar abaixo de 1,5 MB.
  - Comando: `/impeccable optimize`.

**M4. Monte sua peça no PC: a mesma escolha em três lugares, e o pedido fica abaixo da dobra**
- **Onde:** Monte sua peça, 1280, Chromium e WebKit.
- **Print:** [topo a 1280, Chromium](prints/auditoria-19-11/m4-monte-topo-1280-chromium.jpg)
- **O que acontece:**
  - A arara grande ocupa a primeira tela e repete o passo 1, que tem os próprios botões; a prévia tem outro cano com cabide. "Seu pedido" só começa perto do pé da tela (y ≈ 683 de 800).
  - No passo Cor a escolha fica no cartão da esquerda, mas o texto do passo, à direita, manda "tocar nas camisas".
  - Também no PC: 2,4 MB, dos quais 1,4 MB são os quadros da arara (`quadros.bin` das 5 peças) e o resto é o mapa do Google.
- **Sugestão:**
  - Fazer da arara o próprio passo 1, como no celular. Ou encolhê-la e trazer "Seu pedido" para a primeira tela.
  - Pôr as cores dentro do passo Cor.
  - Comandos: `/impeccable distill` e depois `/impeccable layout`.

**M5. Cartões vazios com estrelas apagadas no Contato**
- **Onde:** Monte sua peça, seção Fale com a Whim, de 1024 px para cima.
- **Print:** [Contato a 1280, Chromium](prints/auditoria-19-11/m5-contato-esqueletos-1280-chromium.jpg)
- **O que acontece:** ao lado do único depoimento real, 2 cartões-esqueleto com ☆☆☆☆☆. Parecem um carregamento que não termina ou avaliações de zero estrelas, justo na hora de decidir.
- **Sugestão:**
  - Deixar o depoimento sozinho com "Mais depoimentos em breve" e "Ver no Google Maps", como já é no celular.
  - Comando: `/impeccable distill`.

**M6. Links do Contato menores que 24 px em tela grande (WCAG 2.2, 2.5.8)**
- **Onde:** Monte sua peça, Contato, links do WhatsApp e do e-mail, a 1920 e a 2560, Chromium (axe). A 1920 o do WhatsApp tem 110 × 23,8 px.
- **Print:** [Contato a 1920, Chromium](prints/auditoria-19-11/m6-contato-links-1920-chromium.jpg)
- **Sugestão:**
  - Tirar o `lg:min-h-0` desses links ou dar `min-h-7`. Com o zoom de 0,85 e 0,75 das telas grandes, ficam abaixo de 24 px.
  - Comando: `/impeccable adapt`.

**M7. Pontinhos das fotos com 32 px no tablet**
- **Onde:** home, técnicas, a 768 (toque), nos 2 navegadores. São 9 botões "Silk/DTF/Bordado: foto N de 3" com 32 × 32 px.
- **Print:** [técnicas a 768, Chromium](prints/auditoria-19-11/m7-pontinhos-768-chromium.jpg)
- **Sugestão:**
  - Área de toque de 44 px (o ponto continua pequeno, com padding ou `after:` invisível) até 1023 px.
  - O arrasto já resolve, mas o ponto continua sendo um alvo.
  - Comando: `/impeccable adapt`.

**M8. Foco do teclado quase invisível nos links da barra**
- **Onde:** home e demais páginas, barra, PC (1280, Chromium).
- **Print:** [foco em "Sobre" a 1280, Chromium](prints/auditoria-19-11/m8-foco-barra-1280-chromium.jpg)
- **O que acontece:** o anel é um contorno de 1 px turquesa a 50%, com cerca de 1,6:1 sobre a pílula branca (o mínimo é 3:1, WCAG 1.4.11 e 2.4.7). O anel do botão da hero está bom.
- **Sugestão:**
  - `focus-visible:ring-3 ring-ring/60` ou contorno azul-marinho de 2 px nos links da barra, igual aos botões.
  - Também: o carrossel de depoimentos do Contato rola de lado de 640 a 1023 px sem nada focável (axe `scrollable-region-focusable`, a 768). Dar a ele `tabIndex={0}`, `role="region"` e um `aria-label`.
  - Comando: `/impeccable polish`.

### Baixa

**B1. Nome pessoal no texto do Quem somos (PC)**
- **Onde:** home, Quem somos, de 601 px para cima: "A Whim nasceu em 2021, quando o **Wallan** juntou 15 anos de experiência…" (`src/app/page.tsx:289`).
- **Print:** [home inteira a 1280](prints/auditoria-19-11/m3-home-pagina-1280-chromium.jpg)
- **Sugestão:** é o fundador, não quem atende, mas a regra do CLAUDE.md diz para nunca citar nome pessoal. Confirmar com a Whim. Se for o caso, trocar por "quando o fundador juntou 15 anos de experiência…".

**B2. Uma cor fora da paleta: o vermelho das mensagens de erro**
- **Onde:** `--destructive` em `globals.css`, usado em 3 mensagens:
  - "Faltam X peças" (Quantidade);
  - o erro de arquivo da arte (Estampa);
  - o erro do aceite no formulário.
- **Sugestão:** decisão de marca. Ou manter o vermelho só para erro (é comum e ajuda), ou usar o azul-marinho com o ícone de alerta. Registrar a decisão no CLAUDE.md.

**B3. "Quique" na pílula das abas das técnicas (detector)**
- **Onde:** home, técnicas, celular: `cubic-bezier(.3, 1.25, .4, 1)` em `tecnicas-celular.tsx:47`.
- **Sugestão:** a regra `bounce-easing` do detector pede curvas sem passar do alvo (`cubic-bezier(.2, .8, .2, 1)`). O balão do WhatsApp já está liberado no `.impeccable/config.json`. Se o leve elástico foi escolhido, liberar também. Comando: `/impeccable animate`.

**B4. Erro de terceiros no console do Safari no PC: mapa do Google**
- **Onde:** home, Monte sua peça, `/privacidade` e 404, de 1280 para cima, WebKit: "Permission policy 'Fullscreen' check failed for document with origin 'https://www.google.com'", vindo de `maps.googleapis.com`.
- **Sugestão:** `allow="fullscreen"` (ou `allowFullScreen`) no `<iframe>` do mapa em `site-footer.tsx`. Se não resolver, é ruído do Google e pode ficar.

**B5. "ResizeObserver loop" no Safari a 2560**
- **Onde:** Monte sua peça, 2560, WebKit, como erro de página.
- **Sugestão:** benigno (o navegador adia a notificação), mas aparece como erro. Vem de um `ResizeObserver` que muda o tamanho medido (arara ou prévia com o zoom de telas grandes). Envolver o `setState` do observer num `requestAnimationFrame`.

**B6. Botão flutuante passa por cima de clicáveis enquanto se rola**
- **Onde e o que cobre:**
  - Home, celular: abas, fotos, perguntas das Dúvidas e "Falar no WhatsApp".
  - Home, PC: perguntas das Dúvidas.
  - Monte sua peça a 1280: o "Alterar" do passo Peça na primeira tela.
  - Nos 2 navegadores.
- **Print:** ["Alterar" a 1280, Chromium](prints/auditoria-19-11/b6-flutuante-alterar-1280-chromium.jpg)
- **O que acontece:** é transitório. Rolando um pouco, tudo aparece, e no fim de todas as páginas nada fica embaixo dele (28 de 28).
- **Sugestão:** no Monte sua peça do PC, subir o flutuante para fora da coluna da ficha. Na home, nada a fazer além do A2.

**B7. Conferir o logo da Electrochemical**
- **Onde:** home, faixa de marcas, todas as larguras.
- **Print:** [marcas a 1280](prints/auditoria-19-11/b7-marcas-1280-chromium.jpg)
- **O que acontece:** o fim da palavra aparece como "ELECTROCHEMICA" seguido de um bloco em degradê.
- **Sugestão:** comparar com o logo original da Electrochemical. Se o arquivo estiver cortado, refazer a partir do oficial.

**B8. A 404 não tem a cara do site**
- **Onde:** 404, PC (1280).
- **Print:** [404 a 1280](prints/auditoria-19-11/b8-404-1280-chromium.jpg)
- **O que acontece:** metade da tela vazia, "Erro 404" no texto e só 2 saídas.
- **Sugestão:** trazer o título com a gota e o grifo, uma frase da Whim e os atalhos (Monte sua peça, WhatsApp, Início). Comando: `/impeccable delight`.

**B9. A abertura toca em toda carga da home (~7 s até o "Vista" ficar pronto)**
- **Onde:** home, todas as larguras: 6,9 s a 390 e 7,1 s a 1280, no Chromium.
- **Print:** [abertura a 390](prints/auditoria-19-11/b9-abertura-390-chromium.jpg)
- **O que acontece:** foi pedida assim pelo Gabriel e dá para pular com um toque. Para quem volta pela terceira vez só para pegar o telefone, é uma espera.
- **Sugestão:** decisão do Gabriel. Uma opção é tocar só na primeira visita da sessão (`sessionStorage`).

**B10. Sem o link "Pular para o conteúdo"**
- **Onde:** todas as páginas: são 7 paradas de Tab até o botão da hero.
- **Sugestão:** um link escondido que aparece com o foco, antes da barra. As regiões (`header`, `nav`, `main`) já existem, então não é falha da WCAG, mas ajuda quem usa teclado.

**B11. Nomes que não batem e textos ambíguos**
- **Onde:** Monte sua peça e home.
- **Print:** [passo Cor a 390](prints/auditoria-19-11/b11-monte-cor-390-chromium.jpg)
- **O que acontece:**
  - "Marinho" na vitrine contra "Azul-marinho" no botão.
  - "Toque numa das camisas" no PC, no passo Cor.
  - "A cor da peça é de acordo com o seu pedido." é ambíguo.
  - "DTF" nunca é explicado.
  - "Tamanho máximo da estampa: A3" não diz a medida (29,7 × 42 cm).
- **Sugestão:** `/impeccable clarify`.

**B12. Rótulos em caixa alta com traço no rodapé do PC**
- **Onde:** rodapé, PC ("— NAVEGAÇÃO", "— ATENDIMENTO", "— ENDEREÇO").
- **Print:** [rodapé a 1280](prints/auditoria-19-11/b12-rodape-1280-chromium.jpg)
- **O que acontece:** é o padrão de rótulo que o site tirou dos títulos e que lê como modelo pronto.
- **Sugestão:** títulos em caixa normal e semibold, como no rodapé do celular. Comando: `/impeccable typeset`.

## Regressão (o que passou)

28 combinações: 4 páginas × 7 larguras (360, 390, 430, 768, 1280, 1920 e 2560) × Chromium e WebKit × movimento normal e reduzido. As contagens contam as combinações em que o item se aplica.

| Item | Resultado |
|---|---|
| Sem rolagem lateral (página toda, cada passo do Monte, `/privacidade`, 404) | ✓ em todas |
| Pedido inteiro: peça → cor → posição → 60 peças → Resumo → link do WhatsApp com peça, posição e quantidade | ✓ 28/28 ([Resumo a 390, WebKit](prints/auditoria-19-11/ok-monte-resumo-390-webkit.jpg) · [Resumo a 1920, WebKit](prints/auditoria-19-11/ok-monte-resumo-1920-webkit.jpg)) |
| Botão flutuante no fim das 4 páginas sem nada embaixo | ✓ 28/28 em cada página |
| Menu do celular marca a seção atual (Clientes, Sobre, Serviços, Processo) e leva à seção abaixo da barra | ✓ 12/12 |
| Barra do PC marca o link e a pílula da seção atual | ✓ no Chromium; ✗ WebKit a 1920 e 2560 (M1) |
| Abas das técnicas (DTF, Bordado, Silk) | ✓ 12/12 em cada aba |
| Vídeo da Yamaha no Silk: aparece, toca com movimento normal, fica parado com movimento reduzido, sem o selo (é real) | ✓ 28/28 ([técnicas a 390](prints/auditoria-19-11/ok-tecnicas-yamaha-390-chromium.jpg)) |
| Capítulos da oficina (celular): trocam sozinhos, ficam parados no reduzido, toque no Estampa toca o vídeo | ✓ 12/12 ([capítulos a 390, WebKit](prints/auditoria-19-11/ok-capitulos-390-webkit.jpg)) |
| Processo anda de 1 a 5 com a rolagem e aceita toque | ✓ 12/12 |
| Arrasto das fotos (passa e volta) | ✓ (a 768 só com toque de verdade, ver falsos positivos) |
| Faixa de marcas com a Yamaha, girando (parada e em grade no reduzido) | ✓ 28/28 |
| Rodapé: navegação, contatos, Política, "Desenvolvido por Tribus Labs"; no celular, sem o mapa embutido | ✓ 28/28 ([rodapé a 430, WebKit](prints/auditoria-19-11/ok-rodape-430-webkit.jpg)) |
| Alvos de toque ≥ 44 px (celular e tablet) | ✓ Monte, `/privacidade` e 404; home ✗ só a 768 (M7) |
| axe WCAG 2.2 AA | ✓ home, `/privacidade` e 404 nas 7 larguras; Monte ✗ a 768, 1920 e 2560 (M6, M8) |
| Console limpo | ✓ no Chromium; WebKit ✗ só com os erros de terceiros e do ResizeObserver (B4, B5) |
| Logo oficial sem deformação (barra, hero do PC, rodapé, 404) | ✓ a 390, 1280 e 2560 |
| Só Poppins; nenhuma cor de interface fora da paleta | ✓ (exceto B2) |
| "a equipe" no lugar de nome de quem atende | ✓ (ver B1) |

**Falsos positivos do próprio teste** (conferidos à mão):
- O selo do rodo no mosaico do PC existe: está na legenda ("· ilustrativa"), que o teste não reconhecia.
- Contraste de 1,23 no título do Quem somos a 768: o axe pegou o título no meio da animação de entrada (opacidade 0,12). Totalmente visível, passa.
- Arrasto a 768: o arrasto feito com o mouse num contexto de toque não chegava ao botão. Com toque de verdade (CDP), passa a 390, 768 e 1024.
- O Processo no WebKit a 430 parou no passo 4 numa rodada com a máquina carregada. Repetido sozinho, chega ao 5.

## Idas e voltas Monte → home

`scripts/idas-e-voltas.mjs` no mesmo build, com o iPhone 13 do Playwright, 20 voltas Monte → home em cada uma das 12 combinações:

| | Pelo logo | Pelo menu | Pelo Voltar do navegador |
|---|---|---|---|
| Chromium, com abertura | 20/20 | 20/20 | 20/20 |
| Chromium, sem abertura | 20/20 | 20/20 | 20/20 |
| WebKit, com abertura | 20/20 | 20/20 | 20/20 |
| WebKit, sem abertura | 20/20 | 20/20 | 20/20 |

São 240 voltas: nenhuma tela "Esta página não carregou", nenhum erro no console, e o "Vista" pronto em todas as chegadas à home.

## Desempenho e SEO (Lighthouse 13.6 local)

| Página | Forma | Desempenho | Acessib. | Práticas | SEO | LCP | Bloqueio (TBT) | CLS | Peso | Requisições | O que mais pesa |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | Celular | 52 | 100 | 100 | 100 | 4,5 s (foto da hero) | 3.440 ms | 0 | 1.262 KB | 57 | imagens 933 KB (Electrochemical 78 KB, pôster do silk 75 KB), JS 192 KB |
| Home | PC | 68 | 100 | 100 | 100 | 1,1 s | 790 ms | 0,003 | **5.440 KB** | 65 | `oficina-silk-loop.mp4` **4.131 KB**, imagens 921 KB |
| Monte sua peça | Celular | 48 | 100 | 100 | 100 | **6,3 s** (peça da arara, `lazy`) | 3.110 ms | 0 | 776 KB | 44 | quadros da arara 259 KB, JS 240 KB |
| Monte sua peça | PC | 63 | 100 | 100 | 100 | 1,5 s | 1.020 ms | 0 | 2.366 KB | 67 | quadros das 5 peças 1.420 KB, mapa do Google ~330 KB |
| `/privacidade` | Celular | 90 | 100 | 100 | 100 | 1,3 s | 420 ms | 0 | 330 KB | 28 | JS 194 KB |
| `/privacidade` | PC | 99 | 100 | 100 | 100 | 0,7 s | 50 ms | 0 | 871 KB | 50 | mapa do Google ~330 KB, JS |

- Os números estão em [`prints/auditoria-19-11/lighthouse-local.json`](prints/auditoria-19-11/lighthouse-local.json).
- Em todas as 6 medições, o Lighthouse aponta ~48 a 73 KB de JavaScript sem uso, 12 KB de JavaScript "legado" (polyfills) e imagens que poderiam ser 34 a 59 KB menores.
- O mapa do Google embutido no rodapé do PC pesa ~330 KB de JavaScript em toda página. Um "Ver no mapa" que só carrega o iframe ao clicar resolveria (no celular já é assim).
- SEO 100 nas 3 páginas: título, descrição, canônico, `robots`, links rastreáveis e `lang`.
- Conferido no build: `/robots.txt`, `/sitemap.xml` (as 3 páginas), `/llms.txt`, o manifesto e a imagem de compartilhamento respondem com 200. Os dados estruturados também estão lá:
  - na home: `LocalBusiness` com 5 serviços e oferta, e `FAQPage` com as 8 perguntas;
  - no Monte sua peça: `LocalBusiness` e `BreadcrumbList`.
- **Conferir no site publicado:** o sitemap e o canônico usam `NEXT_PUBLIC_SITE_URL`. No build local, sem a variável, saem com `http://localhost:3000`. Na Hostinger ela precisa estar definida no build como `https://whimconfeccao.com.br`.

## Revisão de design (impeccable `/critique`)

Método: duas avaliações isoladas em subagentes. A é a revisão de design, sem ver o detector; B é o detector da CLI e as marcações na página.

**Veredito de especificidade: a linguagem visual é da Whim; o esqueleto da home é de qualquer empresa.**

O que é só da Whim:
- o "Vista" pintado pela tinta;
- a abertura com o rodo;
- a gota e o marca-texto dos títulos;
- a onda de tinta do convite;
- sobretudo a arara com cabides e a vitrine presa do Monte sua peça.

Os textos falam a língua do cliente ("Bom para: logo no peito de polos", "Não sei, me indiquem").

O esqueleto é a sequência padrão de landing: hero sobre foto, faixa de logos, 3 cartões, mais 3 cartões, 5 passos, FAQ, faixa escura com chamada e rodapé de 4 colunas com rótulos em caixa alta. Toda seção repete a mesma fórmula (gota + título com grifo + painel que sobe + título que sobe ao entrar). A maior falha de especificidade é a primeira imagem ser uma oficina gerada por IA (A1).

O detector da CLI encontrou **1 achado real** em `src/`: `bounce-easing` (B3). Na página, as marcações deram de 15 a 47 elementos por página. Verificados um a um, quase todos são falsos positivos:
- painéis escondidos das outras larguras;
- quadros do carrossel contados como "imagem enterrada";
- a seção de fundo cinza lida como "cartão dentro de cartão";
- o turquesa sobre azul-marinho, que são as duas cores obrigatórias da marca.

Confirmados pelo detector, sem pedir correção:
- o texto em degradê do "Vista" (é o protótipo aprovado);
- a faixa de marcas em loop (pausa com o mouse e com o foco, e para no reduzido);
- 3 transições de largura: pílula, arara e prévia.

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | ✓ "feito" na Quantidade com 0 peças (A3); depois do WhatsApp, nada diz o que vem a seguir |
| 2 | Correspondência com o mundo real | 3 | "DTF" sem explicação; "A cor da peça é de acordo com o seu pedido." |
| 3 | Controle e liberdade | 3 | Voltar, Alterar, Cancelar e pedido guardado na sessão; a abertura trava a rolagem ~3,5 s em toda carga |
| 4 | Consistência e padrões | 3 | A ação principal alterna entre WhatsApp e Monte sua peça; "Marinho" e "Azul-marinho"; no celular, 2 das 3 caixas abrem texto e a 3ª sai para o WhatsApp com a mesma forma |
| 5 | Prevenção de erros | 2 | Dá para enviar "0 peças" e a técnica vai como Silk sem escolha (A3) |
| 6 | Reconhecer em vez de lembrar | 3 | O resumo da vitrine fica sempre à vista; no PC a cor se escolhe longe do passo |
| 7 | Flexibilidade e eficiência | 3 | WhatsApp direto, formulário e configurador; a arara pula o passo 1 |
| 8 | Estética e minimalismo | 3 | Limpo, mas com 3 jeitos de escolher a peça no PC, logo duas vezes na hero do PC e esqueletos no Contato |
| 9 | Recuperar-se de erros | 3 | Erros com `role=alert` e boa saída sem canvas; a 404 é seca (B8) |
| 10 | Ajuda e documentação | 3 | As 8 dúvidas vêm do WhatsApp; falta "Não sei" na técnica |
| **Total** | | **29/40** | **Bom** |

**Pontos fortes:**
- O configurador fala a língua da confecção: arara, cabide, vitrine presa no celular com o resumo e barra "Continuar · Quantidade".
- Os textos são concretos e honestos, sempre "a equipe".
- A disciplina de marca foi medida, não estimada: só Poppins, paleta respeitada e logo intacto.

**Alertas por persona:**
- **Quem abre no celular com pressa:**
  - ~7 s até a entrada acabar (B9);
  - o atalho "Monte sua peça" só existe dentro do Menu;
  - o flutuante sobre o "+" dos tamanhos (A2);
  - no fim, ainda é preciso baixar a ficha e anexá-la à mão.
- **Quem chega pela primeira vez e não conhece as técnicas:**
  - "DTF" sem explicação;
  - Silk já marcado, sem "Não sei";
  - "A3" sem medida;
  - no celular, nada diz que são 5 passos que terminam no WhatsApp (o título é só para leitor de tela).
- **Quem usa teclado ou leitor de tela:**
  - não há "Pular para o conteúdo" (B10);
  - o foco nos links da barra quase não aparece (M8);
  - a abertura diz "Toque para pular" no PC, embora qualquer tecla pule.

**Perguntas para o Gabriel:**
1. Se a promessa é "uma oficina, do fio à estampa", a primeira imagem não deveria ser o vídeo real da Yamaha, em vez de uma oficina gerada por IA?
2. Qual é a ação principal: "Pedir orçamento no WhatsApp" ou "Monte sua peça"? Hoje as duas disputam o mesmo lugar.
3. A abertura em toda carga serve a quem volta só para pegar o telefone?
4. E se o pedido chegasse à equipe pelo site (o Postgres já está planejado), com o WhatsApp levando só um código, em vez de "baixe a ficha e anexe"?

## Auditoria técnica (impeccable `/audit`)

| # | Dimensão | Nota | Achado principal |
|---|---|---|---|
| 1 | Acessibilidade | 3 | axe sem violações na home, em `/privacidade` e na 404; no Monte, alvos < 24 px em tela grande (M6) e região rolável sem foco a 768 (M8); foco fraco na barra (M8). Movimento reduzido respeitado em tudo (abertura, tinta, capítulos, vídeos, faixa, Processo). |
| 2 | Desempenho | 2 | Celular 52 (home) e 48 (Monte), com LCP da arara `lazy` (A4) e 3,1 a 3,4 s de bloqueio; home do PC com 5,4 MB (M3) |
| 3 | Responsivo | 3 | Nenhuma rolagem lateral em 28 combinações; alvos ≥ 44 px no celular; flutuante sobre controles no Monte (A2); pílula do Safari a 1920 e 2560 (M1); pontinhos de 32 px no tablet (M7) |
| 4 | Tema | 3 | Tokens em `globals.css` e classes do tema usadas no código; 1 cor fora da paleta (B2) |
| 5 | Integridade | 3 | 1 achado real do detector (B3); estrutura da home de modelo pronto (ver a crítica) |
| **Total** | | **14/20** | **Bom** (melhorar desempenho e as sobreposições do celular) |

**Ordem sugerida:** `/impeccable polish` (A1, M8) → `/impeccable adapt` (A2, M1, M6, M7) → `/impeccable harden` e `/impeccable clarify` (A3, B11) → `/impeccable optimize` (A4, M2, M3) → `/impeccable distill` e `/impeccable layout` (M4, M5) → `/impeccable typeset` (B12) → `/impeccable polish` no fim.

## Para rodar de novo

1. `npm i --no-save playwright-core axe-core lighthouse && npx playwright-core install chromium webkit` (não entra no `package.json`).
2. `npm run build && npx next start -p 3430`.
3. Rodar os scripts:
   - `scripts/auditoria.mjs <url> <pasta-de-saída> [Chromium,WebKit] [larguras] [normal,reduzido]`: a regressão desta auditoria. `SO=home,monte,privacidade,404` limita as páginas.
   - `scripts/lighthouse.mjs <url> <pasta-de-saída>`: as 6 medições.
   - `scripts/idas-e-voltas.mjs <url> 20`: as idas e voltas.


## Correções (19/11, branch `agente-correcoes/19-11`)

As decisões do Gabriel (19/11) foram aplicadas assim:
- o nome do fundador saiu do texto;
- o vermelho fica só nas mensagens de erro (exceção registrada no CLAUDE.md);
- a abertura toca só na 1ª visita da sessão;
- a estrutura do Monte sua peça no PC não mudou.

Conferido no build de produção com `scripts/auditoria.mjs` (Chromium e WebKit, 360 a 2560 px, movimento normal e reduzido, com o axe) e com uma checagem item por item. Os prints de antes e depois estão em [`../ponte/prints/agente-correcoes-19-11/`](../ponte/prints/agente-correcoes-19-11/).

| Item | O que foi feito | Conferido |
|---|---|---|
| A1 | Selo "Imagem ilustrativa" (o mesmo das técnicas, `seloIlustrativa` em `blocos.tsx`) no canto inferior esquerdo da hero (celular e PC) e da foto das Dúvidas | Selo à vista a 390 e 1280 nos 2 navegadores; a regressão não acha mais imagem de IA sem selo |
| A2 | Botão flutuante escondido em todos os passos do Monte abaixo de 601 px | Escondido nos 5 passos a 360, 390 e 430, nos 2 navegadores |
| A3 | Técnica sem nada marcado e com "Não sei, me indiquem"; sem escolha, "Técnica: a definir". Abaixo de 50 peças, a Quantidade fica sem ✓ ("A definir (mínimo 50)") e a mensagem diz "Quantidade: a definir (mínimo 50)" | Pedido só com "Continuar": Quantidade sem ✓ e mensagem certa; com 60 peças volta o ✓ e "Total: 60 peças" |
| A4 | 1ª fileira da arara do passo Peça (celular) com `loading="eager"` e `fetchPriority="high"`; a 2ª continua `lazy` | Atributos no HTML, nos 2 navegadores. Lighthouse local do Monte no celular: LCP de 6,3 s para 4,8 e 4,9 s (duas rodadas) |
| M1 | Pílula medida pela diferença dos `getBoundingClientRect` (do `li` e da `ul`) dividida pelo zoom | Desvio de 0 a 1 px a 1280, 1920 e 2560, no WebKit e no Chromium (antes, 38 e 70 px no WebKit) |
| M3 | O vídeo da oficina só baixa quando aparece (o `src` entra quando 10% dele está na tela); recodificado em 720 × 1280, com os mesmos quadros e o loop: 4,23 → 1,21 MB | Nenhum pedido do vídeo antes de rolar; depois ele toca, nos 2 navegadores. Lighthouse da home no PC: de 5.440 para 1.270 KB |
| M5 | O Contato do PC mostra só o depoimento real, com "Mais depoimentos em breve" e o link do Google Maps (sem os cartões vazios) | 768 a 2560, nos 2 navegadores |
| M6 | Links do WhatsApp e do e-mail do Contato com 32 px no PC: 27 px a 1920 e 24 px a 2560, com o zoom | Medido nas 4 larguras; axe `target-size` sem violação |
| M7 | Pontinhos das fotos com 44 px de toque até 1023 px (o ponto à vista continua pequeno) | 44 × 44 a 768 e 1023, 32 × 32 a 1280 |
| M8 | Foco de 2 px azul-marinho nos links da barra, no botão de ação, no botão do menu e nos itens do menu (com `outline-solid`, porque no Tailwind v4 o `outline-none` anulava o contorno; o mesmo valia para o botão flutuante, também corrigido). O carrossel de depoimentos ganhou `role="region"`, `tabIndex={0}` e `aria-label` | Contorno sólido de 2 px no Chromium e no WebKit; axe sem `scrollable-region-focusable` |
| B1 | "quando o fundador juntou 15 anos de experiência…" | Texto na home do PC |
| B2 | Vermelho só nas mensagens de erro, com a exceção nas Regras de marca do CLAUDE.md | — |
| B3 | O leve elástico da pílula das abas fica, liberado em `.impeccable/config.json` | O detector não aponta mais nada em `tecnicas-celular.tsx` |
| B4 | `allowFullScreen` no mapa do rodapé | Sem o erro do Google no console do WebKit |
| B5 | `setState` dos `ResizeObserver` (arara, trilho da arara, pílula) e o redimensionamento do canvas da prévia passam para o `requestAnimationFrame` | Sem "ResizeObserver loop" no WebKit a 2560, no pedido inteiro |
| B6 | No Monte sua peça do PC, o flutuante tem 48 px e fica a 12 px da borda, fora da coluna da ficha, a partir de 1276 px. Abaixo disso ele cobriria a ficha, então some. O balão não abre no Monte | Folga de 10 px a 1280 (280 px a 1920); escondido a 768 |
| B7 | Logo da Electrochemical refeito a partir do original (`electrochemical_logo_header_novo.png`): o "L" e a bateria "− +" tinham virado um bloco cinza-escuro. Mesmo cinza dos outros (#5D6178), 982 × 120 px, 78 → 37 KB | Lado a lado com o original |
| B8 | 404 com o título com a bolinha e o grifo, uma frase curta (sem "Erro 404") e 3 saídas (Voltar ao início, Monte sua peça, Falar no WhatsApp); no PC, a arara com o cabide do meio vazio | 390 e 1280, nos 2 navegadores |
| B9 | A abertura toca só na 1ª carga da home na sessão (`sessionStorage`). Nas seguintes a página entra direto na fase da tinta, sem trava de rolagem, e o "Vista" é pintado normalmente. Seção "Abertura do site" do CLAUDE.md atualizada | 1ª carga com abertura; recarga sem abertura, com a tinta, nos 2 navegadores |
| B10 | Link "Pular para o conteúdo" no layout (aparece com o foco, pílula de 44 px) e `<main id="conteudo">` em todas as páginas | Chromium com Tab; WebKit (o Safari só leva o Tab a links com Option+Tab) com foco por teclado |
| B11 | "Azul-marinho" também na vitrine do celular; no passo Cor, "Toque numa camisa…" (celular) ou "Escolha a cor nas camisas embaixo da prévia." (PC); "As cores da vitrine são exemplos. A peça é feita na cor que você pedir…"; DTF explicado ("impressa num filme e aplicada com calor") na home e no passo Estampa; "A3 (29,7 × 42 cm)" no passo Estampa e nas Dúvidas | Textos conferidos a 390 e 1280 |
| B12 | Títulos do rodapé do PC em caixa normal e semibold, sem o traço | `text-transform: none` e sem `::before` |

**Lighthouse local depois:** acessibilidade, práticas e SEO continuam 100 nas 6 medições. O tempo de bloqueio e a nota de desempenho variaram demais entre rodadas nesta máquina: a `/privacidade`, que não mudou, foi de 420 a 2.730 ms. Por isso só o LCP e o peso, que se repetem, estão nas linhas acima. Falta medir no PageSpeed com o site publicado.

**O que continua de propósito** (baixa, já aceito na auditoria):
- o botão flutuante passa por cima de abas, fotos e perguntas enquanto se rola a home (some ao rolar mais; no fim da página nada fica embaixo dele);
- os dois falsos positivos do próprio teste: o arrasto simulado com mouse a 768 (com toque passa) e o contraste do título do Quem somos no meio da animação.
