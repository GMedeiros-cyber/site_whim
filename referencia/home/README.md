# Home nova da Whim (agente 2)

Design aprovado para comparação em dois lugares:
- **Claude Design**: protótipo com fotos reais. O código está aqui: `prototipo-home.dc.html` (HTML + CSS, PC e celular pelo `@media (max-width:760px)`). Use como referência de layout, tamanhos e textos, não copie o arquivo.
- **Figma**: arquivo `R7ktItBlmotu5xei7SuZE5`, frames `5:3` (PC 1440) e `5:233` (celular 390). Print: `figma-home-pc.png` (as fotos aparecem cinzas porque o plano gratuito do Figma bloqueou o envio).
- Inspiração do topo: `inspiracao-hero.jpg` (palavra gigante atrás de um objeto recortado, cartão de vidro num canto, texto curto no outro).

A versão que vale é a do Claude Design (atualizada em 15/11 com os ajustes do Gabriel). O Figma ficou na versão anterior.

## Ritmo de fundo

| Seção | id | Fundo |
|---|---|---|
| Topo | `topo` | foto escura com tinta azul-marinho (cartão arredondado, 12 px da borda) |
| Quem somos | `sobre` | branco |
| O que fazemos | `servicos` | `bg-muted` (#F5F7FA) |
| Como funciona | `processo` | branco |
| Clientes | `clientes` | `bg-muted` |
| Dúvidas frequentes | `duvidas` | branco |
| Convite "Monte a sua peça" + rodapé | `fim` | `bg-primary` (azul-marinho) |

## Seções (versão de 15/11, revisada pelo Gabriel)

1. **Topo (hero)**: nada que lembre o Monte sua peça (sem camiseta, sem cano, sem cartão de cores).
   - Fundo: `public/images/hero-mesa.webp` em tons mais frios, com tinta azul-marinho radial (mais clara no centro).
   - No centro, de cima para baixo: o logo branco (`whim-logo-branco.svg`), a palavra gigante **"Vista"** (Poppins 800, ~330 px no PC, ~120 px no celular), o H1 "a sua marca, peça por peça." e a linha "Uniformes, camisetas e peças com a sua marca. Silk, DTF e bordado numa oficina própria em Guarulhos."
   - Botões: "Pedir orçamento no WhatsApp" (branco, abre o wa.me) e "Ver o que fazemos" (contorno, rola até `#servicos`). No celular, os dois em largura total.
   - Rodapé do topo: as 3 técnicas em pílulas à esquerda e "role para conhecer" à direita (some no celular).
   - **Abertura**: um shader de tinta turquesa pinta a palavra "Vista" da esquerda para a direita (~2,5 s); no fim a palavra fica branca com o começo em turquesa. Uma vez por sessão (`sessionStorage`), um toque pula. Com `prefers-reduced-motion`, a palavra aparece pronta. Pode ser WebGL leve (sem biblioteca nova sem pedir) ou, se ficar pesado, máscara SVG animada; o protótipo usa CSS só para mostrar a ideia.
2. **Quem somos** (refeito em 15/11): duas colunas no PC.
   - Esquerda: "Uma oficina, *do fio à estampa.*" e o texto "A Whim nasceu em 2021, quando o Wallan juntou 15 anos de experiência numa oficina própria em Guarulhos. Hoje a gente faz peças para empresas, escolas e eventos com todas as etapas no mesmo lugar." Embaixo, as etapas da oficina em 2 colunas, cada uma com um fio em cima: Gravação de telas ("A arte vira tela para o silk."), Corte e costura ("A peça nasce do tecido."), Estampa ("Silk, DTF ou bordado."), Acabamento ("Conferência e embalagem.").
   - Direita: mosaico de fotos (a `f41.webp` alta à esquerda; `hero.webp` e `f35.webp` empilhadas à direita), cantos de 24 px, legenda em pílula branca em cada uma, e o selo azul-marinho "Oficina própria · Guarulhos/SP" saindo da borda.
   - Celular: texto em cima, as 3 fotos num carrossel (scroll-snap, ~80% de largura cada, bolinhas de posição), e as etapas em 2 colunas.
   - O manifesto antigo com fotos em pílula sai.
3. **O que fazemos** (16/11: a Whim **não faz sublimação**): título "Três jeitos de *estampar sua marca.*" e a linha "Cada técnica deixa a arte de um jeito. Veja como fica cada uma e para o que ela é melhor."
   - 3 cartões com imagem 3:4 gerada por IA e o selo "Imagem ilustrativa" (obrigatório): `public/images/estilos/silk.webp`, `dtf.webp`, `bordado.webp`. Textos:
     - Silk: "Tinta grossa em cores chapadas, com o toque e a durabilidade da tinta na tela." Bom para: logos de poucas cores e tiragens maiores.
     - DTF: "Todas as cores, degradês e fotos, com acabamento fotográfico." Bom para: artes coloridas e pedidos menores.
     - Bordado: "A arte é costurada em linha, em relevo, e dura junto com a peça." Bom para: logo no peito de polos e uniformes.
   - Embaixo, 3 cartões só de texto: Confecção ("Camiseta, polo, regata, moletom e baby look, do tecido ao acabamento, do infantil 2 ao adulto G3."), Uniformes (texto de hoje) e o azul-marinho "Não sabe qual? Mande a arte: a equipe indica a técnica que fica melhor."
   - PC: 3 colunas. Celular: carrossel (~1,3 cartão visível); os 3 de texto empilhados.
4. **Como funciona**: 5 etapas com o traço por trás.
   - A etapa 1 já começa turquesa. Quando a seção entra na tela (IntersectionObserver, uma vez), **a linha turquesa avança e pinta cada bolinha no instante em que passa por ela**: ~1,5 s por trecho, com uma pausa curta em cada etapa, ~7 s até o 5. As bolinhas ainda não alcançadas ficam brancas com borda cinza.
   - Quando a linha chega no 5: **fogos discretos atrás da bolinha**, do tamanho dela (12 pontinhos turquesa e azul-marinho que saem do centro até ~46 px e somem, ~0,6 s). Uma vez só (no protótipo a animação repete só para dar para ver).
   - Celular: o traço é vertical e enche de cima para baixo. Movimento reduzido: tudo já aceso, sem fogos.
5. **Clientes**: "Marcas que *confiam na oficina.*" e o carrossel contínuo de ponta a ponta com os 10 clientes que a Whim autorizou (`referencia/briefing-whim.md`): Globo, Lollapalooza, Santander, SBT, Bauducco, Aurora, Eletrochemical, Lopes Kalil Engenharia, Indovinya e Colégio Progresso, em texto separado por pontos turquesa até chegarem os logos (aí logos em cinza). ~40 s por volta, pausa com mouse e foco, parado com movimento reduzido, cópia com `aria-hidden`.
5b. **Dúvidas frequentes** (`#duvidas`, fundo branco, entra antes do convite): à esquerda "Antes de *pedir o orçamento.*" e "As perguntas que mais chegam no WhatsApp, respondidas aqui."; à direita um acordeão (`<details>`, a primeira aberta) com as 8 perguntas e respostas do protótipo, todas tiradas do briefing (mínimo 50 peças; 20 a 30 dias; qual técnica; peças e tecidos; tamanhos e cores; posições e A3; região Guarulhos e Grande SP; preço só por orçamento, quem responde é a Caroline). Botão de +/- turquesa quando aberta. O agente 3 gera o schema `FAQPage` a partir desta lista.
6. **Convite** (centralizado, sem camisetas nem cano): "Monte a sua *peça.*", "Peça, cor, estampa e quantidade em 5 passos. O orçamento chega pronto no WhatsApp da Whim, e quem responde é a Caroline.", botões "Monte sua peça" e "Falar no WhatsApp".

## Transições entre as seções (15/11)

- Cada seção depois do Quem somos sobe por cima da anterior: cantos de cima arredondados (40 px no PC, 28 px no celular), `margin-top` negativo do mesmo tamanho e uma sombra suave azul-marinho para cima. Como os fundos alternam branco e claro, os cantos mostram a seção de baixo.
- Entrada no convite azul-marinho: uma **borda de tinta** (SVG com contorno ondulado e 3 respingos) no topo do bloco, como se a tinta escorresse da seção de clientes.
- Ao rolar, o cartão do topo recua de leve (escala 0,94, cantos maiores, um pouco mais escuro) enquanto sai da tela.
- Eyebrow, título e linha de apoio de cada seção sobem 28 px e aparecem quando entram na tela, uma vez. Só eles: nada de animar cada cartão.
- Use CSS de rolagem (`animation-timeline: view()`) com `@supports`; sem suporte, tudo aparece parado. Com `prefers-reduced-motion`, nada se move. Sem biblioteca nova.

## Rodapé: mapa (tarefa do agente 2, liberada pelo Gabriel)

- No `site-footer.tsx` (compartilhado, mas este ajuste fica com o agente 2), coluna Endereço: o **mapa do Google sempre visível**, embutido com `<iframe src="https://www.google.com/maps?q=Av.+Brigadeiro+Faria+Lima,+110,+Bom+Clima,+Guarulhos+-+SP,+07130-000&output=embed" title="Mapa com a localização da Whim" loading="lazy" referrerpolicy="no-referrer-when-downgrade">`, cantos de 18 px, ~190 px de altura, largura da coluna (4ª coluna mais larga no PC; largura total no celular). Embaixo, o link "Abrir no Google Maps" (`CONTATO.mapa`, nova aba).
- Escolha do Gabriel: mapa sempre visível. Isso carrega o Google Maps (que pode usar cookies), então **atualize a /privacidade**: na parte de cookies, dizer que o rodapé mostra um mapa do Google Maps, que o Google pode coletar dados de navegação conforme a política dele, e linkar a política de privacidade do Google. Atualize a data "Última atualização".
- Tire do rodapé qualquer imagem de camiseta ou cano (no site de hoje não há; só não acrescente).

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
| a782de32… | `public/images/estilos/silk.webp` |
| a17489e8… | `public/images/estilos/dtf.webp` |
| dcc5b0d9… | `public/images/estilos/bordado.webp` |
| fc911543… | `public/brand/whim-simbolo.webp` |

## Quem mexe em quê (para os agentes não se atrapalharem)

| Agente | Pode editar | Não pode editar |
|---|---|---|
| **Agente 1 · Monte sua peça** | `src/app/monte-sua-peca/`, `personalizador.tsx`, `previa-peca.tsx`, `arara.tsx`, `contato-avaliacoes.tsx`, `form-contato.tsx`, `src/lib/estampa.ts`, `public/arara/` | a home |
| **Agente 2 · Home** | `src/app/page.tsx`, componentes novos em `src/components/home/`, `public/images/`, e só o mapa em `site-footer.tsx` + o texto de cookies em `src/app/privacidade/page.tsx` | tudo do Monte sua peça |
| **Ninguém sem pedir** | `site-header.tsx`, `site-footer.tsx`, `link-nav.tsx`, `blocos.tsx`, `src/components/ui/`, `src/lib/whim.ts`, `src/lib/navegacao.ts`, `globals.css`, `layout.tsx`, `next.config.ts`, `package.json` | |

- Cada agente trabalha no próprio branch (`agente-1/...`, `agente-2/home`), faz `git pull --rebase origin main` antes de subir e só faz commit dos próprios arquivos.
- Precisa mudar algo compartilhado (um token no `globals.css`, um item do header)? Escreva em `docs/ponte/PEDIDOS.md` com "[Agente 2]" no começo e espere; não edite.
- No `RELATORIO.md`, cada bloco começa com o nome do agente.
