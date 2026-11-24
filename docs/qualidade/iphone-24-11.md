# Site publicado no iPhone (WebKit) · 24/11/2026

Teste do site **publicado** (https://whimconfeccao.com.br, `main` em `05c1c34`) como iPhone, com o Playwright 1.65.1 no motor **WebKit** (o do Safari), em retrato. Só teste: nenhum código de produção foi alterado.

- **Perfis do Playwright:** iPhone SE (320 × 568, escala 2), iPhone 15 (393 × 659, escala 3) e iPhone 15 Pro Max (430 × 739, escala 3). O "iPhone SE" do Playwright é o da **1ª geração** (2016, tela de 320 px). O SE atual (2ª e 3ª geração) tem 375 px; os erros do SE foram conferidos também a 375 px.
- **Páginas:** `/`, `/monte-sua-peca`, `/privacidade` e uma 404 (`/pagina-que-nao-existe-24-11`).
- **Segurança:** `page.route` bloqueou wa.me, api.whatsapp.com e `/api/contatos` em todas as abas. O link do resumo só foi lido, nunca aberto, e o formulário de contato não foi tocado. Nenhum pedido chegou a esses endereços: o bloqueio registrou 0 tentativas.
- **Rodadas:** duas completas. A 1ª teve páginas e idas e voltas (217 ok, 11 falhas). A 2ª repetiu só as páginas, com um PNG de teste mais visível e a checagem de texto que passa da largura do botão ou link (190 ok, 23 falhas). Dessas 23, 11 eram o "Pular para o conteúdo", que tem 1 px até ganhar foco: era falso positivo e a checagem já foi corrigida.
- **Prints:** `docs/qualidade/prints/iphone-24-11/`, com o nome `perfil-página-item.jpg` (`se-`, `15-`, `15promax-`).

> **O WebKit do Playwright não é um iPhone real.** É o motor do Safari rodando no Windows, com o tamanho, o toque e o user agent do iPhone. Ele não cobre:
> - os números de telefone, endereços e datas que o Safari transforma em link sozinho (data detectors);
> - o teclado na tela;
> - as barras do Safari que aparecem e somem ao rolar, e a área segura de verdade;
> - os gestos reais do dedo;
> - recursos que esse build não tem, como o OffscreenCanvas (ver abaixo).
>
> Para isso, só num iPhone de verdade.

## Erro de verdade

Os dois só acontecem a **320 px** (iPhone SE da 1ª geração e outros celulares de 320 px). A 375 px (SE atual), a 393 e a 430 px, nada disso acontece.

| # | Página · perfil | O que acontece | Causa achada | Print |
|---|---|---|---|---|
| E1 | Monte sua peça · iPhone SE | A página rola de lado 21 px em todos os passos e no fim da página. | No Contato, os cartões do WhatsApp e do e-mail ficam com 341 px de largura numa tela de 320 px. O endereço `vendas@whimconfeccao.com.br` não quebra a linha e alarga o cartão. | `se-monte-1-peca.jpg`, `se-monte-inteira.jpg` |
| E2 | Monte sua peça · iPhone SE | Nos passos Cor, Estampa e Quantidade, o botão "Continuar · Estampa" ou "Continuar · Quantidade" não cabe ao lado do Voltar e passa da borda direita. A seta some, e no passo Estampa a página chega a rolar 39 px de lado. | O texto do botão é mais largo que o espaço que sobra ao lado do Voltar. O botão vai até 336 px no passo Cor e até 343 px no passo Estampa. | `se-monte-2-cor.jpg`, `se-monte-3-estampa.jpg`, `se-monte-4-quantidade.jpg`; a 375 px, certo: `se375-monte-2-cor.jpg` |

## Diferença pequena

| # | Página · perfil | O que acontece | Print |
|---|---|---|---|
| D1 | Home · iPhone SE | No botão do 4º capítulo da oficina, a palavra "Acabamento" tem 71 px e o botão tem 66 px, então ela passa um pouco das bordas. A 375 px cabe (79 px). | `se-home-capitulos.jpg` (o recorte da seção mostra a barra do topo no meio; isso é do print, não do site) |
| D2 | 404 · iPhone SE e 15 Pro Max; /privacidade · iPhone 15 (uma rodada) | Erro no console depois de aceitar os cookies: `…clarity.ms/collect due to access control checks`. Vem do script do Microsoft Clarity, não do código do site, e só aparece com a medição aceita. Vale conferir no painel do Clarity se as sessões do Safari estão chegando. | (não há print: só aparece no console) |
| D3 | Monte · todos | Voltar do passo Cor para o Peça abre o passo para edição, com **Cancelar** e **Salvar** no lugar do Continuar. A camiseta continua na cor própria (branca) até a pessoa passar do passo Cor. É o que foi pedido em 23/11. Fica registrado porque, logo depois de escolher Azul-marinho, ver a peça branca pode confundir. | `15-monte-1-peca-voltar.jpg` |
| D4 | Home · iPhone 15 (só na 1ª tentativa) | Uma vez, depois de recarregar, a tinta do "Vista" não terminou em 20 s: `<html data-intro="tinta">` ficou preso, com a palavra pintada na tela. Não se repetiu em nenhuma das 12 recargas seguintes (7 do teste nos 3 perfis e 5 de depuração), que terminaram em cerca de 3,5 s. Provavelmente veio da espera do próprio teste (`waitForFunction` do Playwright no WebKit), que depois foi trocada. | (não guardado) |

## Limitação do WebKit do Playwright (não é erro do site)

- **A prévia da estampa fica vazia no WebKit do Playwright.** Ela não mostra nem a arte anexada nem o marcador "Sua arte" (`15-monte-3-estampa.jpg`, e também no print do WebKit da auditoria de 19/11). A causa é que esse WebKit para Windows **não tem `OffscreenCanvas`**, e a prévia é desenhada num Worker com ele. No Chromium, com o mesmo PNG, a arte aparece no peito esquerdo (`15-monte-3-estampa-chromium-comparacao.jpg`). O Safari do iPhone tem OffscreenCanvas desde o **iOS 16.4**.
  - **Risco a confirmar:** num iPhone com iOS anterior ao 16.4 (por exemplo, o SE da 1ª geração, que para no iOS 15), a prévia ficaria sem a estampa e sem nenhum aviso, porque a falha é ignorada em silêncio (`previa-peca.tsx`, `useComposicao`: `.then(…, () => {})`). O pedido e a mensagem não são afetados.
- **Vídeo da Yamaha: sem problema de codec.** O WebKit respondeu "probably" para H.264 (`avc1.42E01E` e `avc1.640028`) e o vídeo tocou nos 3 perfis, com `readyState` 4 e o tempo andando.

## O que passou

✔ = passou nos 3 perfis. As falhas estão nas seções de cima.

| Item | Resultado | Print (iPhone 15; existe também `se-` e `15promax-`) |
|---|---|---|
| Aviso de cookies | ✔ Apareceu na primeira página de cada perfil e foi aceito. Os IDs de medição **já estão preenchidos em produção**. | `15-home-abertura.jpg` |
| Print da 1ª tela e da página inteira (4 páginas) | ✔ | `15-home-topo.jpg`, `15-home-inteira.jpg`, `15-monte-topo.jpg`, `15-monte-inteira.jpg`, `15-privacidade-*.jpg`, `15-404-*.jpg` |
| Sem rolagem lateral | ✔ Home, /privacidade e 404 nos 3 perfis; Monte no 15 e no Pro Max (o SE é o E1) | — |
| Abertura na 1ª carga da sessão nova | ✔ `data-intro="abertura"` | `15-home-abertura.jpg` |
| Abertura ao recarregar na mesma sessão | ✔ Não toca: entra direto a tinta do "Vista", que termina em cerca de 3,5 s | — |
| Menu marca a seção atual (Sobre, Serviços, Processo, Clientes) e Menu → Processo rola até a seção | ✔ | `15-home-menu.jpg` |
| Abas das técnicas (DTF, Bordado, Silk) | ✔ | `15-home-silk-yamaha.jpg` |
| Vídeo da Yamaha no Silk | ✔ Mudo, `playsinline`, sem controles, sem tela cheia e tocando. É o 1º slide; depois de 8 s o carrossel passa para as fotos. | `15-home-silk-yamaha.jpg` |
| Capítulos da oficina | ✔ Trocam sozinhos e com o toque | `15-home-capitulos.jpg` |
| "Do pedido à entrega" | ✔ 5 passos na vertical. Acendem com a rolagem (0 → 4), apagam ao subir (4 → 0), e o toque marca o passo. | `15-home-passos.jpg` |
| Faixa de marcas | ✔ Andando, todos os logos carregados, com a Yamaha | `15-home-marcas.jpg` |
| Console | ✔ Home e Monte limpos nos 3 perfis (fora o D2) | — |
| Monte, passo Peça: a peça não muda de cor antes do passo Cor | ✔ A camiseta fica com o mesmo arquivo (`branco/026.webp`) ao tocar nela | `15-monte-1-peca.jpg` |
| Monte: botão flutuante escondido nos 5 passos | ✔ | `15-monte-1-peca.jpg` … `15-monte-5-resumo.jpg` |
| Monte: Voltar e Continuar visíveis e livres | ✔ no 15 e no Pro Max; no SE só no passo Peça (E2) | `15-monte-2-cor.jpg` … |
| Monte: PNG no peito esquerdo | ✔ Anexado (aparece "Trocar arte"); a prévia é a limitação acima | `15-monte-3-estampa.jpg` |
| Monte: 50 peças M | ✔ Total "50 peças" | `15-monte-4-quantidade.jpg` |
| Monte: resumo e mensagem (só lido o link) | ✔ Igual nos 3 perfis (abaixo) | `15-monte-5-resumo.jpg` |
| 20 idas e voltas Monte ↔ home pelo logo, pelo menu e pelo Voltar do navegador | ✔ 180 idas e voltas (20 × 3 jeitos × 3 perfis): nenhuma tela "Esta página não carregou", a barra do topo visível ao voltar à home em todas, console limpo | — |

Mensagem do resumo (link `https://wa.me/5511945448802?text=…`, decodificado):

```
Olá, Whim! Montei minha peça no site:
• Peça: Camiseta · Cor: Azul-marinho
• Tecido: Não sei, me indiquem
• Técnica: a definir
• Estampas:
  1. Peito esquerdo (até ≈ 10 × 10 cm): estampa-teste.png
• Tamanhos: M 50 · Total: 50 peças
Vou mandar a ficha e os arquivos aqui na conversa.
Podem me passar o orçamento?
```

## Como rodar de novo

Na pasta `tests/iphone/`, que tem o próprio `package.json` (o do site não muda):

```
npm i && npx playwright-core install webkit
node iphone.mjs tudo                      # páginas + idas e voltas, nos 3 perfis (~25 min)
node iphone.mjs paginas "iPhone 15"       # só as páginas, num perfil
node iphone.mjs idas "iPhone SE" 20       # só as idas e voltas
node ver.mjs "iPhone SE,iPhone 15,iPhone 15 Pro Max"   # abre o site numa moldura de iPhone para olhar à mão
```

Os resultados ficam em `tests/iphone/saida/` (fora do git) e os prints vão direto para `docs/qualidade/prints/iphone-24-11/`. As idas e voltas usam a mesma lógica de `scripts/idas-e-voltas.mjs`, com os bloqueios e a checagem da barra.
