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
- Commits (após rebase sobre `59ffcc4`): `a77b983` dialog, `dcfe6b2` arara, `ac6be7e` exceção do impeccable removida, `c9fd8c0` gancho no centro da barra (medida 42/640 do manifesto) + este registro.
- Pendente: o `cano.webp` cromado não foi usado, porque o prompt do Gabriel pede a barra nas cores do tema; trocar só se ele preferir o cano.

### 2026-11-12 21:15 · Arara: cano cromado e canvas pronto para o modo cor (ajuste do Gabriel)
- Feito: a barra virou o `cano.webp` (multiply, esticado na largura da arara); cada canvas sobe até a curva do gancho (42/640) cair no eixo do cano. Resolve o pendente acima.
- Modo cor: `pintarQuadro` aceita os dois modos; com `framesBrancos` no manifesto, desenha o quadro branco transparente, `multiply` + `fillRect` com a cor do passo Cor e `destination-in` com o próprio quadro, sem multiply no elemento. Sem o campo, segue o modo atual. Suposição: `framesBrancos` é uma pasta com `001.webp…`, igual a `pasta`; a cor vale para todas as peças com quadros brancos.
- Teste (Playwright, produção, 360/390/1280 + reduced-motion): 139 checagens ok; ganchos no eixo do cano com 0 px de desvio, margem branca do cano invisível, todas no modo atual; receita do modo cor conferida num quadro sintético (peça tingida, fora transparente, gancho escuro).
- Comandos: `npm run lint`, `npm run build` (ok, páginas estáticas).
- Commit: `b1432b8` + este registro.
- Pendente: os quadros brancos de cada peça (quando chegarem, é só pôr `framesBrancos` e `quadrosBrancos` no manifesto).

### 2026-11-12 22:30 · Arara com a cor real (quadros por cor)
- Gerei 12 fotos das peças brancas no verde (Nano Banana) e 6 giros no Veo 3.1 Fast (140 créditos; a gola V foi refeita porque saiu uma mão no vídeo).
- Recorte do verde, gancho prateado recuperado, cabide protegido do tingimento; pintura com as dobras preservadas nas 5 cores do `CORES`.
- Saída: `public/arara/<peca>/cores/<cor>/` (quadros 480x640 transparentes + `frente.webp`), manifesto com `cores`, `coresPasta` e `coresQuadros`.
- Scripts em `referencia/arara/scripts-cor/`, vídeos em `referencia/arara/videos-verde/`.
- Build: não rodei (só assets e JSON; o componente ainda não lê os campos novos).
- Commit: ver o log (`feat: arara com a cor real`). Pendente: o Antigravity ligar o `PecaGirando` aos quadros por cor (pedido em PEDIDOS.md).

### 2026-11-12 22:17 · Arara com a cor real (pedido de 2026-11-12)
- Feito: `PecaGirando` acha a pasta pela cor do passo Cor (hex casando com `manifest.cores`) e desenha `{coresPasta}{cor}/001…NNN.webp` (`coresQuadros`), só com `drawImage`; saíram o `mix-blend-multiply` do canvas e o tingimento (o cano segue com multiply). Ao trocar de cor, o quadro atual fica na tela até o novo decodificar; depois os quadros da cor anterior são liberados. Vista ampliada com `{coresPasta}{pasta}/frente.webp` e texto "A estampa você escolhe…".
- Também: o `CORES` do `Personalizador` agora vem do manifesto (some o hex solto do componente e o hex sempre casa com a pasta).
- Teste (Playwright, produção, 360/390/1280 + reduced-motion): 142 checagens ok; canvas sem multiply, sem caixa branca, troca para Preto sem a peça sumir, vista com o frente da cor.
- Comandos: `npm run lint` e `npm run build` (ok, páginas estáticas).
- Commit: `8185a48` + este registro.
- Pendente: nada deste pedido. Os quadros antigos (`frames/`, `frente.webp` de fundo branco) não são mais lidos pelo site.

### 2026-11-13 20:45 · Molde da prévia da peça e da ficha do pedido
- Molde no Figma (PC e celular) aprovado pelo Gabriel: camisa no cano + cartão com título e vitrine de cores; ficha vertical de passos à direita.
- Especificação escrita em `referencia/previa-cor/README.md` (layout, movimentos e acessibilidade); `manifest.cores` ganhou `curto` ("Marinho").
- Pedido novo em PEDIDOS.md para o Antigravity implementar.
- Build: não rodei (só documentação e JSON).
- Pendente: implementação pelo Antigravity.

### 2026-11-13 21:02 · Nova prévia da peça e ficha do pedido (pedido de 2026-11-13)
- Feito: `previa-peca.tsx` (painel muted, selo "Prévia", cano a 10%, camisa de frente no eixo do cano, sombra, cartão com peça + cor e vitrine das 5 cores; "Marinho" no celular); θ de −1 a 1 com espelho e crossfade, mouse/arrasto (pan-y), mola, balanço ao trocar a cor e balanço contínuo que pausa fora da tela/aba oculta; reduced-motion parado em θ = 0. Ficha vertical de 5 passos (feito/atual/depois) no lugar das abas; peça escolhida de frente na arara.
- Decisões: o mouse/arrasto sobre o cartão não gira a camisa (senão ela ficava de lado enquanto se escolhe a cor); ao lado só a partir de 1024 px (abaixo empilha); a escolhida abre a vista no 1º toque; Figma não consultado (conector sem autorização), segui o README.
- Teste (Playwright, produção, 360/390/768/1280 + reduced-motion): 150 checagens da prévia/ficha e 136 da arara, todas ok.
- Comandos: `npm run lint` e `npm run build` (ok, páginas estáticas).
- Commits: `2768000` arara, `90497f7` prévia (levou junto a remoção do `ui/tabs.tsx`), `2126945` ficha + este registro.
- Pendente: nada deste pedido.
