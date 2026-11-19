# Site da Whim Confecção e Estamparia

@AGENTS.md

## Ponte com outro agente

Outro agente (Claude, em outra conta) acompanha o projeto pela pasta `docs/ponte/`.

- **No início de cada sessão e antes de cada tarefa**, leia `docs/ponte/PEDIDOS.md`. Não apague pedidos; marque cada um como `[feito]` ou `[pendente: motivo]`.
- **Ao terminar cada tarefa**, acrescente no fim de `docs/ponte/RELATORIO.md` (nunca reescreva o que já existe) um bloco de **no máximo 8 linhas** com: data e hora, o que foi feito, comandos principais, resultado do build, hash do commit e o que ficou pendente.

## Cliente

Whim Confecção e Estamparia, de Guarulhos/SP. Faz silk, DTF e confecção para empresas, escolas e confecções. Já atendeu Globo e Lollapalooza.

## Objetivo do site

Apresentar a empresa, mostrar o catálogo e gerar pedidos de orçamento. **Não tem venda online.**

## Stack

- Next.js (App Router, TypeScript, `src/`), Tailwind CSS v4, shadcn/ui (preset `base-nova`, componentes em `src/components/ui`).
- Gerenciador de pacotes: **npm**.
- Fonte: Poppins (pesos 300 a 800, aprovada pela Whim em 12/11/2026) via `next/font/google` (`src/app/layout.tsx`), exposta como `--font-sans`.
- Planejados para depois (não instalar antes da hora): Motion, GSAP + ScrollTrigger + Lenis, react-three-fiber + drei (personalizador 3D da camiseta), `@lucasmarkes/hairline` (ilustrações em linha) e Postgres próprio para os orçamentos.
- Referência de estrutura aprovada pelo cliente: `referencia/prototipo/` (ler o README antes de mexer no layout).
- Hospedagem: Hostinger, plano Unlimited (Node.js com deploy pelo GitHub a cada push no `main`). O build é `next build --webpack`: o servidor de build da Hostinger tem glibc antiga e não roda o Turbopack nem o SWC nativo. Tailwind entra pelo `postcss.config.mjs`; o config do Next é `next.config.mjs` (não usar `.ts` nem opções `turbopack`). O `npm run dev` continua com Turbopack.

Comandos: `npm run dev` · `npm run build` · `npm run lint`.

## Textos

- Nunca citar nome pessoal de quem atende: sempre "a equipe" ou "a equipe da Whim" (pedido do Gabriel em 17/11).

## Regras de marca

- Usar **só** estas cores, sem cor de destaque extra:
  - azul-marinho `#373857` (letras e camiseta do logo)
  - turquesa `#31C4EA` (contorno do logo)
  - branco `#FFFFFF`
  - fundo claro `#F5F7FA`
  - cinza-azulado `#5D6178` (texto secundário)
- Exceção (decisão do Gabriel, 19/11): o vermelho de erro (`--destructive`, `text-destructive`) só nas mensagens de erro; em nenhum outro lugar.
- As cores já estão mapeadas nas variáveis do tema em `src/app/globals.css` (primary = azul-marinho, accent = turquesa, background = branco, muted = fundo claro; o tema dark usa o azul-marinho como fundo). Use as classes do tema (`bg-primary`, `text-muted-foreground`, …), não hex soltos.
- O logo **nunca** é redesenhado nem tem a tipografia trocada. Arquivos oficiais em `public/brand/`.

## Abertura do site

Entrou em 16/11 (pedido do Gabriel para a reunião com a Whim): `src/components/home/abertura.tsx`, a mesma do protótipo aprovado (símbolo pintado pela tinta e a escrita entrando), toca só na 1ª carga da home na sessão (`sessionStorage`, decisão do Gabriel em 19/11); nas cargas seguintes a home vem pronta e só a tinta do "Vista" toca. O logo da barra só leva à home, sem repetir a abertura (pedido de 18/11), toque pula, sem movimento reduzido. A tinta da palavra "Vista" só começa quando a abertura acaba (`src/lib/abertura.ts`).

## SEO

O site precisa de metadados, sitemap, dados estruturados (LocalBusiness e produtos) e um `llms.txt`.

## Checklist do projeto

1. Setup
2. Escopo
3. Design
4. Conteúdo
5. Home
6. Páginas (Produtos, Personalizador, Sobre, Contato)
7. Personalizador e orçamento
8. SEO/AEO/GEO e pixels
9. Qualidade
10. Deploy Hostinger
11. Entrega

## Agent skills

### Issue tracker

Tarefas e specs ficam no GitHub Issues de `GMedeiros-cyber/site_whim` (via `gh`). Ver `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: um `GLOSSARY.md` e `docs/adr/` na raiz, criados só quando precisar. Ver `docs/agents/domain.md`.
