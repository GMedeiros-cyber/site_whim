# Qualidade, SEO e entrega (checklist antes de publicar)

Base: o "Checklist para entregar site" do Thiago Silva (Instagram @thiagosilvaseo, 10 itens), mais o que este projeto já pedia no `CLAUDE.md` (metadados, sitemap, dados estruturados e `llms.txt`) e o que faltava para LGPD e acessibilidade.

Vale para o site inteiro (home, /monte-sua-peca, /privacidade). Quem executa: **Agente 3 · Qualidade**, depois que os branches do agente 1 e do agente 2 estiverem no main (ver "Ordem" no fim).

## 1. Pixels e medição só depois da primeira interação (e com consentimento)

- Ferramentas previstas: Google Tag Manager, GA4, Google Ads, Pixel da Meta e Microsoft Clarity. As contas ainda não existem: os IDs vêm de variáveis de ambiente (`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_GADS_ID`). **Sem ID, nada carrega.**
- Componente único `src/components/medicao.tsx`, montado no `layout.tsx`:
  - não carrega nada no primeiro paint;
  - mostra um aviso de cookies discreto (rodapé da tela, "Aceitar" e "Só o necessário", link para /privacidade), só se houver algum ID configurado;
  - com "Aceitar" **e** depois da primeira interação (scroll, toque, clique ou tecla; ou 4 s ociosos com `requestIdleCallback` de reserva), injeta os scripts com `next/script` em `strategy="lazyOnload"`;
  - guarda a escolha em `localStorage` e permite mudar depois por um link "Preferências de cookies" no rodapé;
  - eventos já preparados (sem disparar sem ID): clique em qualquer link do WhatsApp (`contato_whatsapp`, com a origem: header, topo, convite, contato, personalizador) e envio do resumo do personalizador (`orcamento_personalizador`).
- Quando os IDs entrarem, a /privacidade precisa citar cada ferramenta (deixar o texto pronto num bloco comentado).

## 2. Imagens em WebP e com lazy load

- Todas as imagens em `public/` em WebP (os PNG e JPG viram WebP; o logo SVG fica SVG).
- Sempre `next/image` com `width`/`height` ou `fill` + `sizes` corretos; `priority`/`fetchPriority="high"` só na imagem do topo de cada página; o resto com lazy load (padrão).
- Nada acima de ~250 KB; o fundo do topo em ~1600 px de largura no máximo, com versão menor para celular via `sizes`.
- Os quadros da arara (`public/arara/...`) já são WebP: só conferir que não carregam todas as cores de uma vez.

## 3. CLS: nada pulando na tela

- Toda imagem, iframe (mapa) e canvas com tamanho ou `aspect-ratio` reservado.
- Fonte: Poppins pelo `next/font` (já está), com `display: swap` e sem troca de tamanho visível; conferir o `adjustFontFallback`.
- Carrosséis, contadores e animações não podem empurrar conteúdo; o aviso de cookies fica por cima (fixo), não empurra a página.
- Meta: CLS < 0,1 no PageSpeed (celular).

## 4. Meta tags em cada página

- `metadataBase` com a URL do site (variável `NEXT_PUBLIC_SITE_URL`; o domínio ainda precisa ser confirmado pelo Gabriel, provavelmente `https://whimconfeccao.com.br`).
- Cada página com `title`, `description` e `alternates.canonical` próprios:
  - Home: "Whim Confecção e Estamparia | Silk, DTF, bordado e uniformes em Guarulhos"
  - /monte-sua-peca: "Monte sua peça | Whim Confecção e Estamparia"
  - /privacidade: "Política de privacidade | Whim Confecção e Estamparia" (com `robots: { index: true }`)
- `lang="pt-BR"` (já está), `theme-color` azul-marinho.

## 5. Open Graph: o link aparece certinho no WhatsApp

- `openGraph` e `twitter` em cada página (título, descrição, URL, `locale: "pt_BR"`, `siteName`).
- Imagem 1200×630 por página, gerada com `opengraph-image.tsx` (ImageResponse do Next) usando o logo e as cores da Whim. Imagem leve (< 300 KB), porque o WhatsApp descarta as pesadas.
- Testar colando o link no WhatsApp e no depurador de compartilhamento da Meta.

## 6. Schema (dados estruturados)

- JSON-LD no `layout.tsx`: `LocalBusiness` com nome, razão social (Gallant Clothing Ltda), CNPJ em `taxID`, endereço completo (Av. Brigadeiro Faria Lima, 110, 2º andar, Bom Clima, Guarulhos/SP, 07130-000), telefone, e-mail, horário (seg. a sex.? **confirmar dias com a Whim**; hoje só temos "das 6h às 18h"), `sameAs` com o Instagram, `areaServed` Guarulhos e Grande São Paulo (confirmado no briefing).
- `Service` para silk, DTF, bordado, confecção e uniformes (sem sublimação).
- `FAQPage` com as perguntas da seção Dúvidas frequentes da home.
- `BreadcrumbList` nas páginas internas.
- Nada de `AggregateRating` até existirem avaliações reais.
- Validar no Teste de Pesquisa Aprimorada do Google.

## 7. Responsividade

- Conferir computador (1440 e 1280), notebook (1024), tablet (768 e 834 em pé e deitado) e celular (360, 390, 414), nas três páginas.
- Sem rolagem lateral, alvos de toque de 44 px, textos sem estourar, carrosséis funcionando com o dedo, menu do celular ok.

## 8. Tirar os rastros de código feito com IA

- Apagar comentários que falam de prompt, agente, pedido, "gerado por", e comentários óbvios; manter só os que explicam um porquê.
- Nada de `console.log`, código morto, componentes e arquivos sem uso (ex.: `ui/*` não usados), dependências sem uso no `package.json`.
- Sem textos de exemplo, `TODO`, "lorem", "logo do cliente" esquecido em produção sem decisão (este fica até a Whim mandar os logos).
- `referencia/`, `docs/`, `CLAUDE.md` e `AGENTS.md` ficam no repositório, mas fora do que é publicado (não vão para `public/`).
- Remover o `meta generator` se houver, e o favicon padrão do Next (usar o símbolo da Whim).

## 9. PageSpeed antes de entregar

- Lighthouse/PageSpeed no celular e no computador, nas três páginas. Meta: Performance ≥ 90 no celular, Acessibilidade, Boas práticas e SEO ≥ 95.
- LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
- Anotar os números no RELATORIO.md.

## 10. O que acrescentamos ao checklist dele

- `robots.ts` e `sitemap.ts` (App Router), com as três páginas.
- `public/llms.txt` com quem é a Whim, o que faz, endereço, contato e links das páginas (texto curto, sem nada inventado).
- `manifest.ts`, ícones (favicon, apple-touch-icon) a partir do símbolo da Whim.
- Página 404 com a cara do site e links para a home e o Monte sua peça.
- Acessibilidade: textos alternativos em todas as fotos, contraste ≥ 4,5:1, foco visível, `prefers-reduced-motion` em todas as animações (abertura, etapas, carrosséis, arara).
- Segurança básica em `next.config.ts`: cabeçalhos `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`; liberar só o que o mapa do Google precisa.
- Links externos com `rel="noopener noreferrer"`; links do WhatsApp com a mensagem certa em cada origem.
- Search Console: deixar pronto o arquivo ou a meta de verificação por variável de ambiente.

## Ordem

1. Agente 1 (Monte sua peça) e Agente 2 (home) terminam e seus branches entram no main.
2. Agente 3 cria o branch `agente-3/qualidade` a partir do main atualizado e faz este checklist. Ele pode editar os arquivos compartilhados (`layout.tsx`, `next.config.ts`, `site-footer.tsx` só para o link de preferências de cookies, `privacidade`, `public/`), mas não muda visual nem textos das seções.
3. PR para o main com o resultado do PageSpeed no corpo.

## O que falta da Whim (vira pergunta)

- Domínio oficial do site.
- Dias de funcionamento (seg. a sex.? sábado?).
- IDs das contas de anúncio e medição, quando forem criadas.
