# Home nova da Whim (agente 2)

Design aprovado para comparação em dois lugares:
- **Claude Design**: protótipo com fotos reais. O código está aqui: `prototipo-home.dc.html` (HTML + CSS, PC e celular pelo `@media (max-width:760px)`). Use como referência de layout, tamanhos e textos, não copie o arquivo.
- **Figma**: arquivo `R7ktItBlmotu5xei7SuZE5`, frames `5:3` (PC 1440) e `5:233` (celular 390). Print: `figma-home-pc.png` (as fotos aparecem cinzas porque o plano gratuito do Figma bloqueou o envio).
- Inspiração do topo: `inspiracao-hero.jpg` (palavra gigante atrás de um objeto recortado, cartão de vidro num canto, texto curto no outro).

O Gabriel escolhe qual das duas versões vale; o que muda entre elas é detalhe. A estrutura abaixo vale para as duas.

## Ritmo de fundo (o motivo da mudança)

Hoje as faixas brancas e cinzas aparecem sem lógica. A home passa a alternar assim, de cima para baixo:

| Seção | id | Fundo |
|---|---|---|
| Topo | `topo` | foto escura com tinta azul-marinho (cartão arredondado, 12 px da borda) |
| Quem somos | `sobre` | branco |
| O que fazemos | `servicos` | `bg-muted` (#F5F7FA) |
| Como funciona | `processo` | branco |
| Clientes | `clientes` | `bg-muted` |
| Convite "Monte a sua peça" | `monte` | `bg-primary` (azul-marinho), colado no rodapé, que já é azul-marinho |

## Seções

1. **Topo (hero)**, em camadas, de trás para frente:
   - foto `public/images/hero-mesa.webp` (mesa longa de silk, recorte novo da f42) com gradiente azul-marinho de 62% em cima a 96% embaixo;
   - a palavra gigante **"estampa"** (Poppins 800, ~300 px no PC, ~96 px no celular, branca, letter-spacing −0,06em, `aria-hidden`);
   - o cano `public/arara/cano.webp` e a camiseta turquesa `public/arara/camiseta/cores/turquesa/frente.webp` pendurada nele, **na frente** da palavra (a camiseta cobre parte das letras: é o efeito de profundidade da inspiração), com sombra;
   - embaixo à direita: H1 "Cada peça passa pelas *nossas mãos.*" (o destaque em turquesa), uma linha de apoio e os botões "Monte sua peça" (branco) e "Falar no WhatsApp" (contorno);
   - embaixo à esquerda: cartão de vidro "Monte sua peça": "Escolha a peça, a cor e a estampa. O orçamento chega no WhatsApp.", as 5 bolinhas de cor (das cores do manifesto da arara) e "6 modelos · a partir de 50 peças".
   - Celular: palavra e camiseta no alto, H1 + botões e o cartão empilhados embaixo, tudo dentro do cartão escuro.
   - Movimento: a camiseta pode balançar de leve (como a prévia do Monte sua peça); parada com `prefers-reduced-motion`. Nada além disso.
2. **Quem somos**: o manifesto atual (com as fotos em pílula no meio do texto) e, embaixo, 3 fotos grandes com legenda: "Rodo na tela de silk" (`hero.webp`), "Peças na mesa de estampa" (`f35.webp`), "Estampa em série na mesa longa" (`f41.webp`).
3. **O que fazemos**: título "Quatro jeitos de *vestir sua marca.*" e um bento de 5 cartões: Silk (grande, com foto), DTF, Confecção, Uniformes (largo, com foto `f17.webp`) e um cartão azul-marinho "A gente indica." ("Monte a peça e mande a arte: a equipe diz qual técnica fica melhor."). Textos dos serviços: os de hoje (`SERVICOS` em `page.tsx`). Celular: um embaixo do outro.
4. **Como funciona**: "Do pedido *à entrega.*", 5 etapas numa linha com o traço por trás (no celular, vertical). A etapa 1 em turquesa com o link "Começar agora" para `/monte-sua-peca`.
5. **Clientes**: "Marcas que *confiam na oficina.*", Globo e Lollapalooza como texto, mais os espaços tracejados "logo do cliente" até a Whim mandar os logos.
6. **Convite**: "Monte a sua *peça.*", "Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim.", botões "Monte sua peça" e "Falar no WhatsApp", e à direita duas camisetas penduradas num pedaço de cano (branca e turquesa). Encosta no rodapé.

Regras de sempre: só as classes do tema (sem hex solto), Poppins, logo nunca redesenhado, nada inventado (avaliações, números, clientes), PC e celular em cada componente, alvos de toque de 44 px, foco visível.

## Fotos do protótipo (os `/_blob/...` do arquivo .dc.html)

| blob | arquivo no repo |
|---|---|
| 65fedce6… | `public/images/hero-mesa.webp` |
| 649a932f… | `public/arara/camiseta/cores/turquesa/frente.webp` |
| b10f6c1c… | `public/arara/camiseta/cores/branco/frente.webp` |
| 052321b6… | `public/arara/cano.webp` |
| bdb470a9… | `public/images/f17.webp` |
| cf78a384… | `public/images/f35.webp` |
| 0c1349c5… | `public/images/f41.webp` |
| e23cd7b4… | `public/images/hero.webp` |
| 6c13b2e1… | `public/brand/whim-logo-branco.svg` |
| fc911543… | `public/brand/whim-simbolo.webp` |

## Quem mexe em quê (para os agentes não se atrapalharem)

| Agente | Pode editar | Não pode editar |
|---|---|---|
| **Agente 1 · Monte sua peça** | `src/app/monte-sua-peca/`, `personalizador.tsx`, `previa-peca.tsx`, `arara.tsx`, `contato-avaliacoes.tsx`, `form-contato.tsx`, `src/lib/estampa.ts`, `public/arara/` | a home |
| **Agente 2 · Home** | `src/app/page.tsx`, componentes novos em `src/components/home/`, `public/images/` | tudo do Monte sua peça |
| **Ninguém sem pedir** | `site-header.tsx`, `site-footer.tsx`, `link-nav.tsx`, `blocos.tsx`, `src/components/ui/`, `src/lib/whim.ts`, `src/lib/navegacao.ts`, `globals.css`, `layout.tsx`, `next.config.ts`, `package.json` | |

- Cada agente trabalha no próprio branch (`agente-1/...`, `agente-2/home`), faz `git pull --rebase origin main` antes de subir e só faz commit dos próprios arquivos.
- Precisa mudar algo compartilhado (um token no `globals.css`, um item do header)? Escreva em `docs/ponte/PEDIDOS.md` com "[Agente 2]" no começo e espere; não edite.
- No `RELATORIO.md`, cada bloco começa com o nome do agente.
