# Relatório

Uma entrada por tarefa, sempre acrescentada no fim (nunca reescrever as anteriores). No máximo 8 linhas por bloco.

### 2026-11-10 16:28 · Setup inicial + verificação
- Feito: Next.js 16.4.6 (App Router, TS, Tailwind v4, ESLint, `src/`, `@/*`, npm), shadcn base-nova com a paleta Whim, Montserrat + `pt-BR`, assets em `public/brand/`, home "Site em construção", CLAUDE.md, atalho na Área de Trabalho, git.
- Verificação: os 9 itens estavam ok, nada precisou ser corrigido.
- Comandos: `npm run build`, `npm run lint`, `git remote add origin …`, `git push -u origin main`.
- Build: ok (`/` e `/_not-found` estáticas); lint sem erros.
- Commit: `c36b74c` (no GitHub, `origin/main`).
- Pendente: nada.

### 2026-11-10 16:30 · Ponte e skills do projeto
- Feito: `docs/ponte/` + regra no CLAUDE.md; 9 skills no projeto (`.claude/skills`); git-guardrails ativa (hook em `.claude/settings.json`, cobre Bash e PowerShell); setup-matt-pocock-skills com GitHub Issues (`docs/agents/`); `.gitattributes` para o hook manter LF.
- Ajuste: o script do guardrails dependia de `jq` (não instalado) e liberava tudo; agora casa os padrões no JSON bruto. Teste do hook: 10/10.
- Comandos: `npx skills add <repo> -s <skills> -a claude-code -y`, `npm run build`, `npm run lint`.
- Build: ok; lint sem erros.
- Commits: `1ef5ed2` (ponte e skills) + `docs: relatório da ponte` (este registro).
- Pendente: o push destes commits é bloqueado pelo próprio guardrail; o usuário precisa enviar.

### 2026-11-10 17:02 · Guardrails libera push normal (pedido de 2026-11-10, opção A)
- Feito: hook reescrito em Node (`.claude/hooks/block-dangerous-git.mjs`), lendo os argumentos. Libera push normal para o `origin`. Bloqueia push com `--force`/`-f`/`--force-with-lease`/`--force-if-includes`/`+ref`, apagando ref (`:ref`, `--delete`), `--mirror`, `--prune` ou para outro remoto, além de `reset --hard`, `clean`, `branch -D`, `checkout .` e `restore .`. Saíram o `.sh` e o `.gitattributes`.
- Teste: `node .claude/hooks/block-dangerous-git.test.mjs` → 43/43 (38 + 5 de redireção, após o push real revelar que `2>&1` virava "remoto"); ao vivo, push forçado barrado e push normal liberado.
- Obs.: a primeira tentativa de trocar o hook foi barrada pelo controle de permissões do Claude Code; seguiu após confirmação direta do Gabriel.
- Build: ok; lint sem erros.
- Commits: `bf63018` (hook) + `ae600be` (redireções) + `docs: relatório da ponte`; enviados ao `origin/main` junto com `1ef5ed2` e `f78887a`.
- Pendente: nada.

### 2026-11-12 19:35 · Protótipo aprovado entra no repositório
- Feito: `referencia/prototipo/` com o HTML aprovado pela Whim, imagens, SVGs do logo e um README com o que foi aprovado, o que não foi avaliado e os dados reais.
- Decisão do cliente: fonte **Poppins** no lugar da Montserrat (atualizar `layout.tsx` e o `CLAUDE.md` na próxima tarefa).
- Comandos: só cópia de arquivos; sem mudança no código do Next, sem build.
- Commit: `docs: protótipo aprovado como referência`.
- Pendente: portar o protótipo para o Next; trocar a fonte.

### 2026-11-12 20:00 · Protótipo portado para o Next
- Feito: Poppins 300–800 (+ CLAUDE.md); fotos em `public/images/`, escrita e logo branco em `public/brand/`; header flutuante (menu do celular em popover nativo: fecha ao escolher, tocar fora e Esc); home na ordem aprovada; `/monte-sua-peca` com arara, prévia SVG no lugar do 3D, 5 passos até o WhatsApp, contato e avaliações reservadas.
- Teste (Playwright + Chrome, build de produção): 360, 390 e 1280px sem rolagem lateral nem erros, alvos ≥44px, menu, fluxo do pedido, formulário, imagens e reduced-motion; tudo ok.
- Comandos: `npx shadcn add input textarea field toggle-group skeleton badge separator tabs`, `npm run lint`, `npm run build`.
- Build: ok (`/` e `/monte-sua-peca` estáticas); lint sem erros.
- Commits: `bb78853` fonte, `c462fa7` assets, `a448661` shadcn, `a62f768` header, `c8cc293` home, `6a87913` monte sua peça + este registro.
- Pendente: abertura animada, 3D real, mapa, avaliações e logos de clientes reais, envio de arte pelo site, página de privacidade, botão flutuante do WhatsApp, link ativo ao rolar, tema escuro. Cores do tecido (Mescla, Preto) ficam em hex como dado do produto.

### 2026-11-12 20:50 · Assets da arara animada
- Feito: 6 peças (camiseta, polo, gola V, regata, baby look, moletom) geradas no Flow (Nano Banana + Veo 3.1); giros recortados no trecho de lado → frente, normalizados na mesma escala, fundo branco puro, 480×640 WebP em `public/arara/<peca>/frames/` + `frente.webp` 900×1200 + `manifest.json`. Fontes, vídeos e scripts em `referencia/arara/`.
- Correção no caminho: primeiros giros saíram cortados (entrada 3:4 em vídeo 9:16); refeitos com entradas 9:16 e prompt com linha do tempo (giro único em 2 s). Gola padre descartada pelo Gabriel.
- Conferência: tira de 9 quadros por peça revisada; sem cortes de borda, sem fio na margem, gancho alinhado.
- Comandos: ffmpeg + Pillow (`referencia/arara/scripts/`). Sem mudança de código, sem build.
- Commit: `feat: assets da arara animada`.
- Pendente: componente da arara no `Personalizador` (pedido de 2026-11-12).

### 2026-11-12 21:06 · Arara animada no Personalizador (pedido de 2026-11-12)
- Feito: `src/components/arara.tsx` lê o `manifest.json`; 6 peças num canvas (multiply, sem stacking context nos ancestrais), giro quadro a quadro ~0,9 s com pré-carga ao entrar na tela; hover/1º toque gira e alarga a vaga; clique/2º toque escolhe, vai para Cor e abre a vista (`frente.webp`, setas, ← →, 01 / 06, Esc, fundo desfocado). `PECAS` vem do manifesto. Dialog do shadcn adicionado nas cores do tema.
- Decisões: movimento reduzido troca direto de lado ↔ frente (sem giro, vaga sem transição); tocar fora da arara desvira a peça; ao abrir pelo toque o foco zera, para o próximo toque voltar a só girar.
- Teste (Playwright, build de produção, 360/390/1280 + reduced-motion): 121 checagens ok — todas as peças giram até o último quadro e voltam ao 001, sem caixa branca (fundo pintado de cinza e pixels lidos), alvos ≥44px, snap no celular, vista ampliada completa.
- Comandos: `shadcn add dialog` (sem sobrescrever o `button.tsx`), `npm run lint`, `npm run build` (ok, páginas estáticas).
- Commits: `73ee8f4` dialog, `0a25491` arara, `b767521` exceção do impeccable removida + este registro.
- Pendente: nada deste pedido.
