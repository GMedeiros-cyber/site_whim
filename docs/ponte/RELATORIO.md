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

### 2026-11-13 22:10 · Costas por cor, áreas de estampa e especificação (Claude, outra conta)
- Feito: 6 fotos de costas no Flow (Nano Banana), recorte do verde e pintura nas 5 cores, alinhadas à frente (`public/arara/<peca>/cores/<cor>/costas.webp`, 900x1200); `areasEstampa` e `costas` no manifesto; `referencia/previa-cor/README-estampa.md`.
- Comandos: `costas_cor.py` e `areas.py` (em `referencia/arara/scripts-cor/`); conferência em `referencia/arara/areas-estampa.jpg`.
- Build: não rodei (só imagens, JSON e documentação).
- Pendente: implementação pelo Antigravity; a Whim confirmar tamanhos máximos das áreas e a lista de tamanhos.
- Commit: `82e78a1`.

### 2026-11-13 22:50 · Estampa, tamanhos e ajustes da ficha (Claude Code)
- Feito: giro só arrastando (para onde soltar; setas ← →); passo Estampa com posições, mangas e arte só no navegador (aviso de anexar no WhatsApp), arte nas dobras (canvas 2D: deslocamento pelo gradiente do branco, sombra, recorte pelo alfa e sem passar no cabide); Frente/Costas e zoom vertical 1–3× sem cano/selo; tamanhos com quantidade e total; "Alterar" só naquele passo (Salvar/Cancelar); na arara só a escolhida muda de cor; vitrine ≥ 64 px no PC; "Toque/Clique numa peça".
- Decisões: no passo Estampa a camisa cresce no lugar do cartão, à esquerda da barra de zoom; "Voltar" também abre o passo anterior com Salvar/Cancelar; Figma não consultado (conector sem autorização), segui o README.
- Teste (Playwright, produção): 364 checagens em 360/390/768/1024/1280 + reduced-motion; matriz de 184 composições (6 peças × frente/costas × Branco/Preto × PNG/JPG) sem vazar do tecido.
- Comandos: `npm run lint` e `npm run build` (ok); `shadcn add slider checkbox` (Base UI, sem dependência nova).
- Commits: `1f62d06` arara, `b692935` prévia, `962723c` ficha.
- Pendente: a Whim confirmar tamanhos e áreas máximas; no celular a prévia fica acima da ficha (fora da tela enquanto se edita a Estampa).

### 2026-11-13 23:40 · Estampa 2: teste, áreas novas e especificação (Claude, outra conta)
- Teste no navegador (Playwright): espelho troca a cada ~2,5 s parado; troca de cor pula θ de −0,05 para −0,20; costas funcionam com "Frente e costas", mangas presas à arte da frente.
- Feito: `areas` por lado com ângulo das mangas e `medidasReferencia` (provisórias) no manifesto; `areas2.py`; conferência em `referencia/arara/areas-estampa.jpg`; `referencia/previa-cor/README-estampa-2.md`.
- Build: não rodei (só JSON, imagem e documentação).
- Pendente: implementação pelo Antigravity; a Whim confirmar as medidas de cada posição.
- Commit: `eb33b84`.

### 2026-11-14 00:15 · Estampa 2 (Claude Code)
- Feito: arara escolhe no 1º clique (sem Dialog; no celular rola até a prévia); θ só no arrasto + pêndulo 2D no gancho (±1,2°, ~4° na troca de cor), espelho com histerese, crossfade de 300 ms, pré-carga na vitrine; mapa clicável (alvo por ponto, 22 px de tolerância) + lista acessível, conflitos com aviso, um anexo por posição, "usar a mesma arte de", medidas, dicas da manga e das técnicas; arte com fundo liso removido, margens cortadas, deformação suave, trama, mangas giradas, 2×, Silk/DTF/Bordado simulados; ficha PNG 1600x1000 (baixar/compartilhar) e mensagem por posição; `areasEstampa` removido do manifesto.
- Decisões: composição, preparo e análise da arte num Worker (`src/lib/estampa.worker.ts`, OffscreenCanvas) porque passava de 50 ms (pior caso 275 ms, fora da thread principal); marcador "Sua arte" feito na thread principal (usa a Poppins); impulso da troca de cor vai para o lado em que a peça já está, para chegar a ~4°.
- Teste (Playwright, produção, 360/390/768/1024/1280 + reduced-motion): 234 checagens; 10 s parada → 0 trocas de espelho; troca de cor → salto de θ 0,000 e fade de ~298 ms; matriz de 1152 composições (6 peças × Branco/Preto × 4 técnicas × PNG/fundo branco/larga/foto JPG × frente/costas, todas as posições) sem vazar do tecido.
- Comandos: `npm run lint` e `npm run build` (ok).
- Commits: `38db844` arara, `464c7ef` estampa 2, `7171322` manifesto (rebase sobre `c2f69b0`, moletom).
- Pendente: a Whim confirmar medidas e áreas; Figma não consultado (conector sem autorização), segui o README.

### 2026-11-15 23:10 · Header universal, rodapé, /privacidade e Contato + Avaliações (Claude, outra conta, com 2 agentes em paralelo)
- Feito: header igual em todas as páginas (`src/lib/navegacao.ts`, `link-nav.tsx`); rodapé completo (navegação, atendimento, Instagram, endereço com Cocaia e CEP, mapa, razão social e CNPJ); página /privacidade (LGPD); seção única Contato + Avaliações na direção B (`contato-avaliacoes.tsx`), avaliações só como lugar reservado.
- Comandos: merge de `secao/header-rodape` e `secao/contato-avaliacoes`; `npm run lint`; `npx next typegen` + `npx tsc --noEmit`; Playwright em 390 e 1280 (sem erro no console, sem rolagem lateral).
- Build: `npm run build` não roda neste container (Google Fonts bloqueado); rodar aí.
- Pendente: revisão jurídica da /privacidade; avaliações reais do Google; `CONTATO` ganhou campos separados (logradouro, bairro, cidade, cep).
- Commit: `2d00d74` (merges `f419b03` e `d786972`).

### 2026-11-15 22:55 · Conferência do header, rodapé, /privacidade e Contato + Avaliações (Claude Code)
- Build: `npm run lint` e `npm run build` ok aqui (Google Fonts liberado); o `"use cache"` + `cacheLife("days")` do ano não quebra: /, /monte-sua-peca e /privacidade saem estáticas com revalidação de 1 dia.
- Conferido (Playwright, produção, 360/390/768/1024/1280, 132 checagens ok): header igual nas 3 páginas; "Monte sua peça" com `aria-current` só em /monte-sua-peca; "Sobre" e "Clientes" levam a /#sobre e /#clientes com a seção no topo; rodapé com endereço, Cocaia, CEP, razão social, CNPJ, ano e link da política abrindo /privacidade; formulário abre o WhatsApp com "Olá, Whim! Sou … da …. …" (e "Quero um orçamento." sem mensagem; não envia sem nome); WhatsApp e e-mail da seção; sem rolagem lateral; alvos de 44 px no celular.
- Corrigido: links "Início" e "Sobre" do rodapé tinham 37 e 41 px de largura no celular → `min-w-11` abaixo de 1024 px, sem mudar o visual.
- Observação: entre 601 e 820 px o header esconde Sobre/Serviços/Processo e não tem menu; nessa faixa eles ficam só no rodapé (como diz `navegacao.ts`).
- Commit: `6c857d6`.
- Pendente: revisão jurídica da /privacidade; avaliações reais do Google.

### 2026-11-16 01:00 · Logos, rótulo e WhatsApp (Claude, outra conta)
- Feito: logos oficiais dos 10 clientes em cinza em `public/clientes/` (fontes em `referencia/logos-clientes.md`); grafia corrigida para Electrochemical; eyebrow sai e o título ganha a gota turquesa; spec do botão flutuante do WhatsApp; protótipo atualizado.
- Comandos: download dos originais, conversão para uma cor em Python/rsvg, `git commit`.
- Build: não se aplica (só arquivos de referência e imagens).
- Commit: `74179e1`.
- Pendente: Whim confirmar Aurora (Coop?), unidade do Colégio Progresso e o OK para exibir os logos.

### Agente 1 · 2026-11-16 00:40 · Ajustes do briefing da Whim (Claude Code)
- Feito: Gola V fora da arara, do manifesto e do repositório (`public/arara/golav/`); Tecido no passo Peça (lista do briefing + "Não sei, me indiquem"), na mensagem e na ficha; passo Cor com as cores como exemplo, "Outra cor" com campo e a nota; tamanhos Adulto (PP a G3) e Infantil (2 a 16) somando no total, com "Adicionar outro tamanho" no grupo aberto; frente e costas inteiras "até A3 (29,7 × 42 cm)" e aviso "Tamanho máximo da estampa: A3."; Resumo com o prazo e "Quem responde é a Caroline."; técnicas seguem Silk, DTF, Bordado e "Ainda não sei".
- Mensagem: `• Tecido: …` numa linha própria; tamanhos como "P 30, Infantil 4: 25". Ficha: tecido no topo; total e tamanhos embaixo das fotos (até 3 linhas); outra cor sai como "Verde (prévia em Turquesa)".
- Conferido: `npm run lint` e `npm run build` ok; Playwright em produção, 360/390/768/1024/1280, 167 checagens ok (mensagem e link do WhatsApp, ficha, sem rolagem lateral, alvos de 44 px no celular, sem erro no console).
- Commits: `283d11e` e `9291fbe` no branch `agente-1/monte-sua-peca` (worktree separado; não mexi na home nem nos compartilhados).
- Pendente: a Whim confirmar G1 a G3, os pares do infantil e as medidas; o briefing cita "moletom gola careca", que não tem imagens na arara.

### Agente 1 · 2026-11-16 01:07 · Eyebrow fora do Monte sua peça e do Contato (Claude Code)
- Feito: `<Eyebrow>` tirado de `personalizador.tsx` e `contato-avaliacoes.tsx` (o `blocos.tsx` não foi tocado). Espaço acima dos títulos medido com e sem o `mt-4` atual do `Titulo`: h1 a 62 px ou mais abaixo do header e título do Contato a 56 px ou mais do topo da seção, então não mexi no espaçamento.
- Botão do WhatsApp: o branch do agente 2 ainda não tem o botão, então não deu para conferir. O personalizador não tem barra nem ficha fixa (nada `fixed`/`sticky`), mas vale olhar de novo a 390 px quando entrar.
- Branch: os trabalhos do agente 1 agora ficam em `agente-1/monte-sua-peca` (o `agente-1/briefing` ficou para trás, com os mesmos commits de antes do rebase).
- Conferido: `npm run lint` e `npm run build` ok; Playwright em produção, 360/390/768/1024/1280, sem rótulo, sem rolagem lateral e sem erro no console.
- Commit: `31337b7`.
- Pendente: a /privacidade ainda tem o `<Eyebrow>LGPD</Eyebrow>` (não é arquivo do agente 1).

### 2026-11-16 00:40 · Agente 2 · Home (Claude Code)
- Feito: home nova seção por seção (Vista pintada por shader WebGL de tinta, uma vez por sessão, toque pula; Quem somos com mosaico/carrossel; 3 técnicas; Como funciona preso à rolagem com fogos uma vez; 10 clientes em marquee; Dúvidas; convite com borda de tinta), transições entre seções, mapa do Google no rodapé, /privacidade citando o Google Maps, Bom Clima em `whim.ts`.
- Decisões: transições em CSS global com prefixo `home-` (a regra `"*.css"` do next.config transforma `.module.css` em global); `--home-p` registrada (começa em 4: sem suporte ou com movimento reduzido fica tudo aceso); lista das dúvidas exportada em `src/components/home/duvidas.ts` para o FAQPage.
- Conferido (Chrome, produção, 360/390/768/1024/1280 + movimento reduzido): sem rolagem lateral, alvos de 44 px, foco visível, console sem erro; canvas final x texto em CSS com diferença média < 1/255; linha avança e volta com a rolagem, fogos 1 vez.
- Comandos: `npm run lint` e `npm run build` (ok).
- Commits: `899820f` home, `8c2246e` mapa/privacidade, `90fa9b3` briefing/transições/rolagem.
- Pendente: logos dos clientes; texto de abertura do rodapé com os novos públicos (fora do que foi liberado no rodapé); Firefox sem `animation-timeline` mostra as etapas acesas e sem transições.

### 2026-11-16 01:20 · Agente 2 · Home: logos, gota e WhatsApp flutuante (Claude Code)
- Feito: logos dos 10 clientes com `next/image` (alturas da spec, × 0,72 no celular; cópias com `alt=""` e `aria-hidden`; Electrochemical); `Eyebrow` fora da home e gota turquesa no `Titulo` (`gota={false}` desliga; sem o `mt-4`); `src/components/botao-whatsapp.tsx` no `layout.tsx` (pílula no PC, 56 px no celular, balão 1×/sessão, balanço com `scroll(root)`); rodapé com `pb` maior para o botão não tapar links.
- Decisões: logos sem lazy e com `fetchPriority="low"` (no carrossel com overflow escondido o lazy só carregava ao entrar e o logo piscava); `unoptimized` porque os arquivos já vêm com 120 px; trabalho no worktree `C:/tmp/whim-agente2` porque o agente 3 usa a pasta principal; `merge` do main em vez de rebase (o branch já estava publicado e force push é bloqueado).
- Conferido (Chrome, produção, 390 e 1280 + movimento reduzido, 44 checagens ok): alturas e `alt` dos logos, gota de 0,56 em em todos os títulos, botão a 16/24 px das bordas, wa.me com a mensagem em nova aba, balão abre/fecha/não volta, × de 44 px, balanço ao rolar, rodapé livre no fim, botão em /monte-sua-peca e /privacidade, console sem erro.
- Comandos: `npm run lint` e `npm run build` (ok).
- Commit: `7f9a0f6` (antes: merge `ca122d2` com o main).
- Pendente: tirar o Eyebrow da /privacidade ("LGPD") e do Monte sua peça (agente 1), que agora ficam colados no título; o agente 3 tem mudanças não commitadas em `page.tsx`, `carrossel.tsx` e `duvidas.ts` que vão precisar juntar com estas.

### 2026-11-16 01:35 · Agente 3 · Qualidade, parte 1 (Claude Code)
- Feito (worktree `../site_whim-agente3`, branch `agente-3/qualidade` a partir do main): robots, sitemap, `/llms.txt` e URLs por `NEXT_PUBLIC_SITE_URL`; manifest e ícones do símbolo da Whim (sai o favicon do Next); 404; cabeçalhos de segurança e sem `X-Powered-By`; `.env.example`. Pixels (`src/components/medicao.tsx`: consentimento + 1ª interação, IDs por env) e LocalBusiness/Service (`src/lib/schema.tsx`, Bom Clima) prontos, ainda não montados.
- PageSpeed (Lighthouse 12.8 local, build de produção com os agentes 1 e 2 juntos; celular/PC): home 36/90, Monte sua peça 76/98, privacidade 94/100; Acessibilidade 97 a 100, Boas práticas 96 a 100, SEO 100, CLS 0 em tudo.
- Travamento da home: `PalavraTinta` (com a tinta TBT 380 a 950 ms, sem ela 60 a 110 ms) → pedido ao agente 2 em PEDIDOS.md. Monte sua peça: contraste de `text-muted-foreground`, proporção da imagem do cano e alvos dos links do contato no PC (para o agente 1 depois do merge).
- Comandos: `git worktree add`, `npm install`, `npm run lint` e `npm run build` (ok); rotas, cabeçalhos e 404 conferidos no `next start` (390 e 1280 px, sem rolagem lateral).
- Commit: `1ce02ef`.
- Pendente: aguarda merge dos agentes 1 e 2 (montar medição e schema no layout, link de cookies no rodapé, meta tags, Open Graph, breadcrumb/FAQ, imagens, CLS, responsividade, limpeza, PageSpeed final); da Whim: domínio, dias de funcionamento e IDs das contas.

### 2026-11-16 08:45 · Revisão e merge dos agentes 1, 2 e 3 (Claude, outra conta)
- Feito: conferi cada branch contra os pedidos e a tabela de donos (nenhum arquivo fora da área liberada); juntei no main na ordem 1 → 2 → 3, resolvendo só conflitos em PEDIDOS/RELATORIO (mantidos todos os status e blocos); tirei o Eyebrow "LGPD" da /privacidade e apaguei o `Eyebrow` do `blocos.tsx`.
- Conferido: `npm run lint` e `tsc` ok; `npm run build` ok com a Poppins trocada só localmente (Google Fonts bloqueado aqui, não commitado); Playwright 390 e 1280 em /, /monte-sua-peca, /privacidade e 404: sem rolagem lateral, sem erro no console, 10 logos carregados nas alturas da spec, gota em todos os títulos de seção, botão do WhatsApp a 16/24 px com wa.me certo, robots/sitemap/llms.txt/manifest 200, 404 com status 404.
- Commit: `df5d688` + merges no main.
- Pendente: travamento da tinta (agente 2); parte 2 do checklist (agente 3); `agente-1/briefing` velho no GitHub; títulos das colunas do rodapé ainda no estilo do rótulo antigo (decisão do Gabriel).

### 2026-11-16 09:55 · Abertura e WhatsApp só com ícone (Claude, outra conta)
- Feito: abertura do protótipo aprovado portada para o Next (símbolo pintado + escrita, 1× por sessão, toque pula, sem movimento reduzido, script em linha evita piscar); tinta do "Vista" espera a abertura; botão do WhatsApp só com o ícone (56 px); CLAUDE.md e README da home atualizados.
- Conferido: lint e tsc ok; build ok (Poppins trocada só localmente); Playwright 390 e 1280: abertura some aos ~3,9 s e a tinta começa logo depois, recarregar não repete, toque pula, movimento reduzido não mostra, console sem erro.
- Commit: `690b04c`.
- Pendente: agente 2 juntar o main no `agente-2/tinta` (aviso em PEDIDOS).

### 2026-11-16 · Agente 2 · Tinta sem travar (Claude Code)
- Feito (`agente-2/tinta`, main juntado por fast-forward em `1e5c579`): `palavra-tinta.tsx` mantém o `depoisDaAbertura` e, sem abertura, espera ociosidade; link do shader por `KHR_parallel_shader_compile`; DPR 1 e ~30 quadros/s; para ao sair da tela ou com a aba oculta; erro no WebGL mostra a palavra pronta.
- Medido em sessão nova com a abertura (CPU 4×, 412 px): maior tarefa na janela da tinta 97–127 → 54–60 ms, bloqueio 47–77 → 4–10 ms, quadros sem engasgo. Playwright: 12 checagens ok (toque pula, rolar/aba oculta param, sem abertura começa após o load, movimento reduzido, console limpo).
- Lighthouse 12.8 no celular, perfil limpo, 6 rodadas: Performance 80 a 83 (2 rodadas com a máquina ocupada deram 56 e 69), LCP 3,9–4,4 s, TBT 160–310 ms. A gravação acaba em ~2,9 s, antes da tinta (~4 s).
- O que segura os 90 é o LCP: bloqueando só os logos dos clientes nada muda; bloqueando as imagens da abertura deu 93 e 85 (o `whim-simbolo.svg`, 97 KB em prioridade alta, é só o fantasma a 7%).
- Comandos: `git merge origin/main`, `npm run lint`, `npm run build` (ok), `next start` + Lighthouse e Playwright.
- Commit: `b8ab11e`.
- Pendente: decidir o peso da abertura (fantasma mais leve ou com prioridade baixa) para chegar aos 90; não mexi nela.

### 2026-11-16 11:00 · Tinta do agente 2 no main e abertura mais leve (Claude, outra conta)
- Feito: revisei e juntei `agente-2/tinta` no main (fast-forward, só `palavra-tinta.tsx` + docs, espera da abertura mantida); abertura passa a usar cópias reduzidas dos arquivos oficiais em `public/brand/abertura/` (fantasma 240 px cinza 13 KB com `fetchPriority="low"` no lugar do SVG de 507 KB; contorno 480 px 53 KB no lugar de 94 KB). O logo não mudou, só a resolução.
- Conferido: lint, tsc e build ok; Playwright 1280: abertura igual à de antes, some e a tinta termina "pronta", console limpo.
- Commit: `6a6f455`.
- Pendente: o agente 3 medir de novo no celular (meta 90); LCP da foto do topo.

### 2026-11-16 16:20 · Agente 3 · Qualidade, parte 2 (Claude Code)
- Feito (`agente-3/qualidade-2`): `<Medicao />` e JSON-LD LocalBusiness/Service no layout; FAQPage (de `duvidas.ts`) e BreadcrumbList; title, description, canonical, Open Graph/Twitter e imagem 1200×630 (60–68 KB) por página; theme-color e verificação do Search Console por variável; "Preferências de cookies" no rodapé; eventos do formulário (`formulario`) e do WhatsApp flutuante (`flutuante`); /privacidade lista as ferramentas configuradas; `f35` 355 → 149 KB, `f17` e `f42` (sem uso) apagadas; Poppins sem o peso 300 (sem uso); balão do WhatsApp sem CLS; comentários sem nomes de pessoas ou agentes. Bug achado: `<Script id="clarity">` virava `window.clarity` e o Clarity nunca carregaria (ids com prefixo agora).
- Conferido: navegador com IDs fictícios e requisições externas bloqueadas: nada carrega antes do "Aceitar" nem em 4,5 s; os scripts entram depois; eventos com a origem certa (topo, flutuante, convite, rodapé, formulário); o aviso reabre pelo rodapé com foco; JSON-LD e meta nas 3 páginas; sem rolagem lateral em 360/390/414/768/834/1024/1194/1280/1440.
- PageSpeed (Lighthouse 12.8, perfil limpo, abertura tocando; celular 3 rodadas / computador 1): home 60–85 / 98; Monte sua peça 58–69 / 95; privacidade 91–93 / 99. Acessibilidade 100 (Monte 97/93), Boas práticas 100 (Monte 96), SEO 100, CLS 0 nas 3. Máquina ocupada por outros agentes: o main puro medido na mesma hora deu home 52–82 e Monte 61–64.
- LCP da foto do topo (`hero-mesa.webp`): 1600 px, servida a 750 px com 38 KB, já com `fetchPriority="high"` e preload no `<head>`; LCP real com rede e CPU lentas ≈ 1,6 s. Os ~4 s do Lighthouse são estimativa: a foto pinta num quadro depois de ~3 s de estilo, layout e pintura do documento. Não muda bloqueando as imagens da abertura, pulando a abertura, bloqueando os logos ou todo o JS, nem com `decoding="sync"` ou `content-visibility` (testados e desfeitos).
- npm audit (12: 2 baixos, 10 moderados), só ferramentas de desenvolvimento, nada vai para o site publicado: CLI `shadcn@4.23.0` → `deepmerge@4.3.1`, `@shadcn/registry`, `ts-morph`/`@ts-morph/common` → `minimatch@10.2.6` (o "fix" do npm é `shadcn@1.0.0`, um rebaixamento; esperar versão nova ou passar o `shadcn` para devDependencies); `eslint-config-next` → `typescript-eslint@8.72.2` (6 pacotes) → `minimatch@10.2.6` (atualização sem quebra).
- Comandos: `git merge --ff-only origin/main`, `npm install`, `npm run lint` (ok), `npm run build` (ok), `next start` + Lighthouse e Puppeteer.
- Commit: `9929b15`.
- Pendente: Performance 90 no celular (home e Monte); pedido ao agente 1 (contraste, cano, alvos de toque); domínio, dias de funcionamento e IDs da Whim; PR para o main.

### 2026-11-16 17:05 · Revisão e merge do agente 3, parte 2 (Claude, outra conta)
- Feito: conferi `agente-3/qualidade-2` (arquivos dentro do que o pedido liberou: metadata e JSON-LD nas páginas, eventos no formulário e no WhatsApp, balão do WhatsApp sem CLS) e juntei no main por fast-forward.
- Conferido: lint ok; build ok (Poppins trocada só localmente); Playwright 390 e 1280 em /, /monte-sua-peca, /privacidade e 404: sem rolagem lateral, console limpo, JSON-LD presente, botão do WhatsApp 56 px; robots/sitemap/llms.txt/manifest 200.
- Commit: `c1b22fe` (main).
- Pendente: nota 90 no celular (medir no site publicado antes de otimizar); pedido do agente 1 (contraste, cano, links do contato); `npm audit` só em ferramentas de desenvolvimento.

### Agente 1 · 2026-11-16 17:10 · Monte sua peça, 3 pontos do Lighthouse (Claude Code)
- Contraste: nos passos futuros da ficha só o nome esmaece; o texto cinza fica em `text-muted-foreground` cheio (#5D6178; antes #86899a, 3,46:1).
- Cano da arara (o esticado era esse; o da prévia já estava na proporção): virou fundo CSS `100% 100%`, visual igual pixel a pixel a 390 e 1350 px.
- Links de WhatsApp e e-mail do Contato: 28 px no PC (`lg:py-1`, como o rodapé); celular segue com 44 px.
- Teste: axe-core (`color-contrast`, `target-size`) e a regra `image-aspect-ratio` do Lighthouse a 390 e 1350 px: 6 falhas antes, 0 depois; teste do personalizador sem falhas; console limpo.
- Comandos: `npm run lint` (ok), `npm run build` (ok), `next start` + Playwright. Commit: `89d1571` no branch `agente-1/ajustes-lighthouse`.
- Pendente: o Lighthouse de verdade (agente 3) para confirmar as notas; PR para o main.

### 2026-11-16 17:35 · Build da Hostinger e merge do agente 1 (Claude, outra conta)
- Feito: build trocado para `next build --webpack` (a Hostinger tem glibc antiga: o SWC nativo do Next 16.4 pede GLIBC_2.30 e o Turbopack não roda), Tailwind via `@tailwindcss/postcss` + `postcss.config.mjs`, `next.config.ts` → `next.config.mjs` sem a regra do Turbopack; juntei `agente-1/ajustes-lighthouse` (sem conflito).
- Conferido: lint ok; build webpack ok; Playwright 390/1280 nas 4 páginas igual a antes (estilos, logos, gotas, WhatsApp, console limpo). Binários nativos que ficam: tailwind/lightningcss pedem GLIBC 2.14 e o sharp 2.28, compatíveis.
- Commit: `1b8cc56`.
- Pendente: implantar de novo na Hostinger e conferir o log; regra para todos: não voltar para `.ts` nem usar `turbopack` no config.

### 2026-11-17 01:20 · Ajustes rápidos, banco dos contatos e pedidos de 17/11 (Claude, outra conta)
- Feito: avaliações escondidas, sem nome pessoal, WhatsApp parado, favicon branco, logo Aurora (alimentos), hero e Quem somos sem "oficina própria"; fotos da hero preparadas; banco `u305516480_contatos` + variáveis DB_* na Hostinger; protótipo do resumo horizontal no canvas; pedidos para os agentes 1, 2 e 3.
- Conferido: lint, tsc e build webpack ok antes do push (`171a1bc`).
- Commit: `37dd59c`.
- Pendente: os três pedidos de 17/11; Search Console; cores e foto original com a Whim.

### 2026-11-17 01:40 · Agente 3 · Contatos no banco e tela de erro (Claude Code)
- Feito (`agente-3/contatos`): `POST /api/contatos` com `mysql2` (tabela `contatos` criada na 1ª chamada, sem IP, campo isca, limite por minuto, só envios do próprio site; sem `DB_*` responde 200 sem gravar); `src/lib/contatos.ts` (`enviarContato`, UTMs/gclid/fbclid da página de chegada, `generate_lead` e "Lead" na Meta ao gravar); `CampoIsca`; /privacidade com o que fica guardado, onde, 24 meses e como apagar; `.env.example` com as `DB_*`.
- Tela "This page couldn't load": não era deploy. O `el.remove()` da `abertura.tsx` quebra toda ida da home para outra página por link (100% das vezes, PC e celular). Entraram `error.tsx` e `global-error.tsx` com o visual da Whim, recarregando sozinhos uma vez por minuto no máximo (esse erro e o de JS de deploy antigo). A correção de raiz foi pedida ao agente 2.
- Conferido: rota contra um MySQL 9.7 de verdade (`mysql-memory-server`, sem Docker): 20 checagens ok (gravação com acento/emoji/UTMs, 9 inválidos recusados, isca, outro site 403, GET 405, limite 429, horário de Brasília). Navegador a 1280 e 390: home → Monte sua peça e JS sumido abrem depois do recarregamento; tela de erro sem laço; UTMs da chegada guardadas.
- Comandos: `git switch -c agente-3/contatos origin/main`, `npm install`, `npm install mysql2`, `npm run lint` (ok), `npm run build` (webpack, ok), `next start` + Puppeteer.
- Commit: `1f4daa8`.
- Pendente: agente 2 corrigir a abertura; agente 1 ligar os formulários (`enviarContato` + `CampoIsca`); a Whim confirmar os 24 meses; rótulo de conversão do Google Ads; texto da autorização se os dados forem usados em anúncios ou prospecção.

### Agente 1 · 2026-11-17 12:40 · Monte sua peça, ajustes de 17/11 (Claude Code)
- Feito: (1) giro da arara e da prévia com quadros em `ImageBitmap` no tamanho do canvas (tela × DPR), desenho só no rAF, peça em camada própria e o balanço sem redesenhar; CPU 4× a 1280 px: quadros longos 69–117 → 5–34, p95 34–45 → 22–28 ms; (2) Frente/Costas/Mangas com título e linha; (3) anexar a arte leva a prévia ao lado da posição (a Nuca ficava escondida atrás da frente); (4) prévia final com as artes, Frente/Costas e miniatura do outro lado; (5) resumo horizontal do protótipo, passo 5 "Seus dados"; (7) 1520 px a partir de 1800 px, colunas meio a meio e prévia + resumo parados ao rolar quando cabem.
- (6) `agente-3/contatos` juntado; nome, telefone (máscara) e e-mail obrigatórios + autorização e link da privacidade no passo 5 e no Contato; `enviarContato` + WhatsApp no mesmo clique; `CampoIsca` nos dois `<form>`.
- Conferido (Playwright, 390/1280/1920/2560, rota interceptada): 1 falha no axe a 1280 px, no cabeçalho (fora do meu escopo, pedido ao agente 2); o resto sem falha (fluxo, envio, WhatsApp, alvos de 44 px, sem rolagem lateral, console limpo). Teste do Lighthouse de 16/11 sem falha.
- Comandos: `git switch -c agente-1/ajustes-17-11 origin/main`, `git merge origin/main` (protótipo) e `origin/agente-3/contatos`, `npm install`, `npm run lint` (ok), `npm run build` (webpack, ok), trace do Chrome.
- Commits: `6a65b04` e `9ef57e0` no `agente-1/ajustes-17-11` (o `pull --rebase` reaplicou os 2 do agente 3 como `7e9ca83` e `8ab302e`, mesmas mudanças).
- Pendente: texto da autorização se os dados forem para anúncios/prospecção (Gabriel); agente 2: contraste do menu sobre blocos escuros e largura do rodapé em telas grandes.

### 2026-11-17 02:17 · Agente 2 · Ajustes da home de 17/11 (Claude Code)
- Feito: entrada em toda carga (abertura → tinta do "Vista" → barra com fade e descida), fase em `<html data-intro>`; logo recomeça a entrada; abertura parada até hidratar e decodificar; tinta a ~60 q/s; hero sem selos e com ícone de rolagem, fotos novas por `<picture>` e véu mais leve; onda do convite com `view()`; tinta entre páginas só de/para o Monte sua peça; telas grandes com `zoom` 1,2/1,5 (home, rodapé da home e barra).
- Decisões: transição pela View Transitions API direto (o `<ViewTransition>` do React esconde a raiz); a página anterior fica no DOM escondida pelo Next (`cacheComponents`), por isso o canvas da tinta é criado a cada pintura e a saída no meio da entrada é vista por `checkVisibility()`.
- Medido (CPU 4×, 412 px, sessão nova): abertura em movimento sem tarefa longa (84–104 q/s), tinta 115–132 q/s sem quadro perdido; ~200 ms de pausa parada na passagem.
- Conferido no Chrome: 56 checagens em 390/768/1280/1920/2560 e movimento reduzido (fases, barra, logo, transição, ícone, onda, alturas da hero, sem rolagem lateral, console limpo).
- Comandos: `npm run lint`, `npm run build` (webpack, ok), `next start` + Playwright.
- Commit: `5c958c1`. `package-lock.json` mudou só no `npm install` (`"peer": true`) e ficou fora.
- Pendente: com CPU 4× a abertura espera ~2,5 s parada pela hidratação; o botão do WhatsApp não cresce nas telas grandes (fica no layout de todas as páginas).

### 2026-11-17 13:00 · Revisão e merge de 17/11 dos agentes 1, 2 e 3 (Claude, outra conta)
- Feito: juntei `agente-1/ajustes-17-11`, `agente-3/contatos` e `agente-2/ajustes-17-11` (só conflitos de PEDIDOS/RELATORIO, mantidos todos os status e blocos); menu do cabeçalho mais opaco (`bg-background/90`) para o contraste pedido pelo agente 1. O `el.remove()` da abertura já não existe na versão do agente 2 (ela sai da árvore pelo React).
- Conferido: lint e tsc ok; build webpack ok (Poppins trocada só localmente, também no `global-error.tsx`); Playwright 390/1280: home → Monte sua peça → voltar, durante e depois da abertura, sem a tela de erro e com console limpo; 4 páginas sem rolagem lateral; capturas em 390/1280/2560.
- Commit: `7e245a2` (main, um deploy só).
- Pendente: texto da autorização para anúncios/prospecção; espera de ~2,5 s da abertura em celular lento (decisão do Gabriel); rodapé em 1180 px nas telas grandes.

### 2026-11-17 15:45 · Agente 3 · Ofertas e horário (Claude Code)
- Feito (`agente-3/ofertas-horario`): 2ª caixa, opcional e desmarcada, "Quero receber novidades e ofertas da Whim." no Contato e no passo 5 do Monte sua peça (`campos-contato.tsx`); `/api/contatos` grava `ofertas` e `ofertas_texto` (texto só quando marcada) e acrescenta as colunas por ALTER TABLE na tabela que já existe; /privacidade com as duas finalidades, públicos de anúncios do Google e da Meta só para quem marcou (dados codificados) e como sair pelo WhatsApp ou por e-mail.
- Horário: "Segunda a sexta, das 9h às 18h" no `CONTATO.horario` (rodapé, Contato, llms.txt) e `openingHoursSpecification` Mo–Fr 09:00–18:00 no schema; referências atualizadas, protótipos HTML não.
- Conferido: MySQL 9.7 de verdade com a tabela no formato antigo (colunas entram no lugar certo, contato antigo com `ofertas = 0`) e do zero; 9 checagens novas e as 20 de antes ok. Navegador 1280 e 390: caixa desmarcada, 201 com `ofertas` 0 e 1 conforme marcado, WhatsApp abre, horário novo e nada de "6h às 18h".
- Comandos: `git switch -c agente-3/ofertas-horario origin/main`, `npm install`, `npm run lint` (ok), `npm run build` (webpack, ok), `next start` + Puppeteer.
- Commit: `cfad075`.
- Pendente: a Whim confirmar os 24 meses; rótulo de conversão do Google Ads; quem for subir públicos de anúncios usa só as linhas com `ofertas = 1`.

### Agente 1 · 2026-11-17 15:55 · Monte sua peça, pedidos da tarde de 17/11 (Claude Code)
- Feito (`agente-1/ajustes-17-11-b`): resumo de volta ao passo 5 como antes de 17/11 (mensagem, ficha, passos, prazo), com "Seus dados" + validação e o botão "Enviar pelo WhatsApp" no fim; saiu o resumo horizontal. PC: prévia 4/5 até a altura da tela e parada ao rolar a ficha (sem vão embaixo da vitrine); eixo do cano preso à curva do gancho. Estampa: Frente | Costas embaixo de cada camiseta, linha vertical entre elas, Mangas embaixo nas duas colunas, sem linhas horizontais.
- Juntei `origin/agente-3/ofertas-horario` (conflito só no import do `form-contato.tsx`); a caixa de ofertas já vinha no `Autorizacao`. `focarErro` compartilhado pelos dois formulários; rótulo no campo de arquivo da arte (axe).
- Comandos: `git switch -c agente-1/ajustes-17-11-b origin/main`, `npm install`, `git merge origin/agente-3/ofertas-horario`, `npm run lint` (ok), `npm run build` (webpack, ok); Playwright no build de produção a 390, 1280, 1920 e 2560 px: 0 falhas (inclui axe, envio interceptado com `ofertas` false/true e os 3 pontos do Lighthouse).
- Commits: `82e0515` e merge `af26989`. `contato-avaliacoes.tsx` não foi tocado.
- Pendente: nada meu. O Gabriel decide se a prévia mais alta no PC fica (fácil voltar para a quase quadrada).

### 2026-11-17 15:56 · Agente 2 · Ajustes da home de 17/11 à tarde (Claude Code)
- Feito: "Vista" 30% menor; barra na hora, some descendo e volta subindo (todas as páginas, sempre no topo, movimento reduzido sem deslizar); abertura no 1º desenho só com transform/opacity (máscara fixa num "rodo" que desliza e imagem em contramovimento, mesmo visual); tinta entre páginas como faixa fixa do React animada por WAAPI + `depoisDaTransicao`; Dúvidas com foto `f35` e acordeão acessível (uma aberta, seta girando, abertura suave); rodapé e home em 1520 px a partir de 1800 px.
- Medido (CPU 4×, trace do Chrome): abertura começa 17–85 ms antes do 1º desenho e nenhuma animação dela sai do compositor; ainda caem quadros nos primeiros ~0,75 s (raster da GPU da página que carrega por baixo; uma página só com uma animação perde 0–4%). Tinta: faixa no compositor; a tela fica coberta ~1,3 s com CPU 4× (0,1–0,3 s sem) esperando o Monte sua peça renderizar.
- Conferido no Chrome: 77 checagens em 390/1280/1920/2560 e movimento reduzido (Vista, barra, abertura, tinta só de/para o Monte sua peça, dúvidas com aria-expanded e inert, larguras, sem rolagem lateral); home → Monte sua peça pelo menu sem erro.
- Comandos: `npm run lint`, `npm run build` (webpack, ok), `next start` + Playwright e traces.
- Commit: `0269a39`. `package-lock.json` com só `"peer": true` do `npm install` antigo ficou guardado num stash, não descartado.
- Pendente: o agente 1 ligar `depoisDaTransicao` na arara; o agente 3 ver o aviso de CSS pré-carregado do `global-error.tsx` (os dois em PEDIDOS).

### 2026-11-17 16:55 · Revisão e merge da tarde de 17/11 (Claude, outra conta)
- Feito: juntei `agente-1/ajustes-17-11-b` (com o agente 3 dentro), `agente-2/ajustes-17-11-b` e `claude/conteudo-17-11` (silk e rodo novos, "confiam na Whim", depoimentos "em breve"); fiz os dois pedidos do agente 2 que estavam abertos: arara só decodifica depois da transição (`depoisDaTransicao`) e Poppins do `global-error` com os pesos do layout; imagens novas renomeadas (`silk-close.webp`, `rodo-tela.webp`) para não pegar cache antigo do otimizador.
- Conferido: lint e tsc ok; build webpack ok (Poppins trocada só localmente); Playwright 390/1280: 4 páginas sem rolagem lateral e console limpo, home → Monte sua peça → voltar sem erro, barra visível na hora, some ao descer e volta ao subir; capturas das seções novas.
- Commit: `5e8aac1` (main, um deploy só).
- Pendente: medir PageSpeed no site publicado.

### 2026-11-17 19:35 · Agente 3 · Testes do Monte sua peça e espaços vazios (Claude Code)
- Feito (`agente-3/testes-monte`, a partir do main `7884efc`): checklist de UX/UI do Monte sua peça (`docs/qualidade/monte-sua-peca-checklist.md`: 61 itens, 51 ok e 10 com falha, mais a gola e a carcela vistas no olho, com print e passos para repetir) e espaços vazios (`docs/qualidade/espacos-vazios.md`). Falhas passadas ao agente 1, e a margem da home com zoom ao agente 2, em PEDIDOS.
- Scripts para rodar de novo, sem mudar código de produção: `scripts/testes-monte.mjs` (Playwright nas 6 telas, 800 combinações, artes geradas na hora, WhatsApp e contato interceptados, axe) e `scripts/espacos-vazios.mjs`. `playwright-core` e `axe-core` entram com `npm i --no-save`, porque o `package.json` é "ninguém sem pedir".
- Comandos: `npm i --no-save playwright-core axe-core`, `npm run build` + `npx next start -p 3417`, os dois scripts, `npm run lint` (ok), `npm run build` (webpack, ok).
- Commit: `e1c8b3f`.
- Pendente: as falhas com os agentes 1 e 2; a 404 a 1920 com a metade direita vazia (minha, baixa).
### 2026-11-17 20:35 · Agente 1 · Monte sua peça, pedidos da noite de 17/11 e checklist do agente 3 (Claude Code)
- Feito (`agente-1/ajustes-17-11-c`): passo 5 só com "Pedir orçamento no WhatsApp" (sem dados; conversão pelo ouvinte do wa.me); vitrine do PC com a altura da ficha (vão ≤ 32 px nos 5 passos a 1920/2560 × zoom 100/67/50%); quadro parado de cada peça no HTML (arara e vitrine) e quadros de cada cor num `quadros.bin` (`scripts/emendar-quadros.mjs`), baixado no load e decodificado depois da transição; áreas refeitas pela costura da gola (nuca 8 × 4 cm a 2,5 cm; frente sem encostar na gola; Polo abaixo da carcela); itens 1 a 9 do checklist do agente 3.
- Medido (celular 390, 4G rápido + CPU 4×, `next start` local, main e branch intercalados, mediana de 5, `getEntriesByType('resource')`): peças visíveis 3,5 s → 0,2 s (carga direta, antes do 1º desenho) e 7,1 s → 1,6 s (vindo da home); 171 → 12 pedidos e 1,70 → 1,48 MB; animação da arara pronta ~4,6 s nos dois.
- Lighthouse mobile (mediana de 3): nota 67 → 82, TBT 1,32 → 0,20 s, Speed Index 2,9 → 2,6 s, CLS 0 → 0, LCP 3,7 → 4,2 s (o maior elemento passou do título para a camiseta da vitrine; o atraso de render de ~3 s é da página toda). Com os pacotes no `<head>` o LCP estimado ia a 11 s, por isso baixam no load.
- Comandos: `git checkout main && git pull && git checkout -b agente-1/ajustes-17-11-c`, `node scripts/emendar-quadros.mjs`, `npm run lint` (ok), `npx tsc --noEmit` (ok), `npm run build` (webpack, ok); Playwright no build de produção a 390, 1280, 1920 e 2560: 93 + 22 checagens, 0 falhas (no dev, com ID de medição de teste, as 4 da conversão também passaram).
- Commit: `24043fe`. Não toquei em header, footer, abertura, home nem `contato-avaliacoes.tsx`.
- Pendente: espaço embaixo da ficha no passo Peça a ≥ 1920 (decisão do Gabriel); medir no site publicado depois do deploy.
### 2026-11-17 18:27 · Agente 2 · Ajustes da home de 17/11 à noite (Claude Code)
- Feito: logo da hero no canto de cima (PC, na grade, abaixo da barra; no celular sai e nem é baixado); telas grandes por `zoom` na página inteira (0,85 a partir de 1800 px, 0,75 a partir de 2400 px; hero e faixa de tinta dividem `vh` por `--zoom`; canvas do "Vista" converte as medidas); técnicas e clientes com `bg-muted/60` e sombra a 20%.
- Onda: gravei a tela quadro a quadro (1280/1920, CPU 1× e 4×) e medi a nitidez da borda. Causa: o `scaleY` no compositor rasterizava a onda pequena e só esticava a imagem (a 1920, 37 de 96 quadros borrados; só deslizar ficava nítido). Agora cresce pela altura do SVG e corre por transform: 0 borrados nas 4 combinações. O atalho `animation` com 2 animações sai do build com duração 0s; usei as propriedades separadas.
- Medido: 1920 = 0,85× e 2560 = 0,75× do de antes em barra, textos, títulos, larguras, "Vista" e rodapé; 1440 igual. Playwright no build de produção (390/1280/1440/1920/2560 e movimento reduzido): sticky, IntersectionObserver, canvas do "Vista" alinhado, arara (passar o mouse e clicar), tinta entre páginas cobrindo a tela, abertura, sem rolagem lateral, console limpo.
- Comandos: `npm run lint`, `npx tsc --noEmit`, `npm run build` (webpack, ok), `next start` + Playwright e screencast do CDP. Prints antes/depois guardados localmente.
- Commit: `557fa5f`.
- Pendente: aviso ao agente 1 sobre o arrasto da prévia com zoom (0,85×/0,75× da distância do mouse); texto do Monte sua peça fica com 11–13 px a 1920/2560, se ficar pequeno, decisão do Gabriel.
### 2026-11-17 17:45 · Claude · depoimento real e foto das dúvidas
- Depoimento da Patricia (Electrochemical) no "O que dizem de nós", texto exato, sem estrelas; 2 cartões vazios completam a linha.
- Foto das dúvidas: `camiseta-whim-mesa.webp` (IA + logo oficial `whim-logo-branco.svg` aplicado com textura do tecido); grade `lg:items-stretch`, foto com a altura das perguntas.
- Comandos: lint, tsc, `npm run build` (troca temporária da Poppins, desfeita); Playwright a 1280 e 390: sem rolagem lateral, console limpo.
- Pendente: merge com as branches dos agentes 1, 2 e 3 desta rodada.

### 2026-11-17 21:15 · Claude · revisão e publicação da noite de 17/11
- Juntei em `revisao-17-11-c`: `agente-3/testes-monte`, `agente-1/ajustes-17-11-c`, `agente-2/ajustes-17-11-c` e `claude/conteudo-17-11-c`; conflitos só em PEDIDOS e RELATORIO.
- Comandos: `npm ci`, lint, tsc, `npm run build` (troca temporária da Poppins, desfeita), `next start` + Playwright.
- Resultado: sem rolagem lateral em /, /monte-sua-peca, /privacidade e 404 a 390, 1280, 1920 e 2560; console limpo (só o 404 esperado); home ↔ Monte sua peça sem erro; robots, sitemap, llms e manifest com 200.
- Pendente (decisão do Gabriel): a 2560 o conteúdo ocupa ~45% da largura (zoom 0,75 × 1520 px); passo Peça a ≥ 1920 com espaço embaixo da ficha.

### 2026-11-18 16:38 · Agente 2 · Home nova no celular (Claude Code)
- Feito (`agente-2/celular-18-11`, com `origin/claude/ref-celular`), só abaixo de 601 px: hero com texto embaixo e um botão; Quem somos só com o vídeo e etapas 2 × 2; técnicas em abas (setas, Home, End) com um cartão e linhas curtas; processo numa linha com a frase do passo tocado; dúvidas com 4 + "Ver as 8 perguntas"; rodapé com Navegação em `<details>` e "Ver no mapa" (mapa embutido não baixa). Balão do WhatsApp na home do celular só depois de rolar (cobria o botão de orçamento).
- De 601 px para cima nada muda: páginas inteiras (movimento reduzido) iguais pixel a pixel antes e depois a 601, 768 e 1280; a 1920, só os 22 px de ruído do vídeo, que também aparecem entre duas rodadas do mesmo código.
- Comandos: `npm run lint`, `npx tsc --noEmit`, `npm run build` (webpack, ok), `next start` + Playwright: 68 checagens a 360/390/430, movimento reduzido, 601 e 1280, 0 falhas (alvos ≥ 44 px, sem rolagem lateral, fotos que saíram não baixam, console limpo).
- Prints a 390: `docs/ponte/prints/celular-18-11/` (`antes-390-pagina.webp` e `depois-390-pagina.webp`, página inteira; `antes-390-topo.webp` e `depois-390-topo.webp`, topo com a tinta). A página caiu de 7129 para 5179 px de altura.
- Commit: `81a9c6f`.
- Pendente: nada meu. Aviso ao agente 1 sobre o `botao-whatsapp.tsx` e o rodapé (PEDIDOS).

### 2026-11-18 16:59 · Agente 1 · Monte sua peça e Fale com a Whim no celular (Claude Code)
- Feito (`agente-1/celular-18-11`, com `origin/claude/ref-celular`), só abaixo de 601 px: vitrine presa de 270 px com Frente/Costas e resumo curto, linha dos 5 passos (rola de lado, centra o atual, passo feito volta), só o passo rola, Voltar e "Continuar · próximo" presos no pé e o WhatsApp do pedido no último passo; arara no passo Peça e cores no passo Cor; WhatsApp flutuante acima da barra. Fale com a Whim: depoimento num cartão azul-marinho, formulário e atalhos de WhatsApp, e-mail e mapa.
- Prints a 390, antes → depois: `docs/ponte/prints/agente-1-celular-18-11/390-1-peca-antes.jpg` → `-depois.jpg`, e o mesmo para `390-3-estampa`, `390-4-quantidade`, `390-5-resumo` e `390-contato`. PC sem mudança: `1280-1-peca`, `1280-3-estampa`, `1920-1-peca` e `1920-5-resumo` (antes e depois, iguais pixel a pixel nas 12 fotos de 1280/1920, fora o logo do rodapé que carrega com atraso).
- Comandos: `git checkout main && git pull && git checkout -b agente-1/celular-18-11 && git merge --no-edit origin/claude/ref-celular`, `npm run lint` (ok), `npx tsc --noEmit` (ok), `npm run build` (webpack, ok); Playwright no build de produção: celular a 360, 390 e 430 (101 checagens: vitrine presa, barra no pé, alvos ≥ 44 px, sem rolagem lateral, axe, teclado, recarregar, WhatsApp), checklist do agente 3 sem falhas; a bateria do PC passa a 1280 e dá 6 falhas a 1920/2560 que já vêm do `zoom` de telas grandes (ver Pendente), com as fotos do PC iguais às de antes.
- Commit: `96200f0`. Home e header não foram tocados (o botão flutuante só ganhou uma classe CSS).
- Pendente: no PC a 1920 e 2560 a vitrine fica 0,85×/0,75× da altura da ficha e o cano sai do eixo nas medidas da tela, por causa do `zoom` de telas grandes (`557fa5f`, aviso do agente 2 em PEDIDOS); a correção está pronta para quando o Gabriel liberar mexer no PC.

### 2026-11-18 18:25 · Agente 3 · Teste do celular de 18/11 (Claude Code)
- Feito (`agente-3/teste-celular-18-11`: main + `agente-1/celular-18-11` + `agente-2/celular-18-11`, merge `c2c0e48`; conflito só no PEDIDOS e no RELATORIO, resolvido mantendo os dois lados): comparação com `referencia/celular-18-11/` a 360, 390 e 430 px no Chromium e no WebKit do Playwright, e PC antes e depois.
- Resultado: 161 verificações, 149 ok e 12 com falha (`docs/qualidade/celular-18-11.md`, com a leitura ao lado da referência). A 1280 e a 1920, as 4 páginas iguais pixel a pixel ao main de antes (`c3c0cb6`). Falhas e diferenças passadas aos agentes 1 e 2 em PEDIDOS.
- Script para rodar de novo, sem mudar código de produção: `scripts/testes-celular.mjs` (o "antes" sai de um worktree separado; o teclado é simulado).
- Comandos: `git checkout main && git pull && git checkout -b agente-3/teste-celular-18-11 && git merge --no-edit origin/agente-1/celular-18-11 origin/agente-2/celular-18-11`, `npx playwright-core install chromium webkit`, `npm run build` (webpack, ok) + `next start` (3417 e 3418), o script, `npm run lint` (ok).
- Commit: `1baf7c0`.
- Pendente: teclado de verdade num iPhone; prévia e ficha no iOS abaixo do 16.4 (sem `OffscreenCanvas`).

### 2026-11-18 18:40 · Claude · Revisão e publicação do celular de 18/11
- Juntei `agente-3/teste-celular-18-11` (que já traz os agentes 1 e 2 e a referência) e corrigi na revisão: menu marcando a seção clicada (Processo marcava Clientes), botão flutuante escondido no Resumo do celular, barra encostando no pé nos passos curtos e aviso sem `OffscreenCanvas`.
- Checklist de lançamento: www → sem www (308) e cabeçalhos HSTS, X-Frame-Options e frame-ancestors.
- Comandos: `npm run lint`, `npx tsc --noEmit`, `npm run build` (webpack, ok), Playwright a 360/390/430 (menu nas 4 seções, barra no pé, flutuante no Resumo, sem rolagem lateral) e 1280/1920 (14 cliques na barra), verificador de links (internos ok).
- Commit: ver o `git log` do main deste push.
- Pendente: PageSpeed no celular; baixos do agente 3 (itens 4 e 2); IDs de medição; sitemap no Search Console; lead de teste.

### 2026-11-18 18:50 · Claude · Erro 500 visto pelo PageSpeed
- O PageSpeed recebia erro 500 na home e no Monte sua peça (sem título e sem descrição para o robô). Nos logs da Hostinger: `ENOENT src/assets/poppins-semibold.ttf`, lida no topo do `src/lib/og.tsx`, que as páginas importam pela imagem de compartilhamento.
- Correção: leitura da fonte e do logo dentro da função (um arquivo que falte só afeta a imagem) e `outputFileTracingIncludes` no `next.config.mjs` (a fonte entra no pacote do servidor).
- Comandos: lint, tsc, build (webpack, ok), `next start` com as 5 rotas em 200.
- Pendente: rodar o PageSpeed de novo depois do deploy.

### 2026-11-18 18:45 · Claude · PageSpeed no celular depois da correção
- Home no celular: Desempenho 94, Acessibilidade 100, Práticas recomendadas 100, SEO 100 (LCP 2,7 s, CLS 0). Logs da Hostinger sem erro depois do deploy `708258c`.
- Pendente: legenda (track) no vídeo, imagens mais leves (~77 KiB) e cache de arquivos estáticos (~400 KiB).

### 2026-11-18 23:59 · Agente celular · Ajustes do celular de 18/11 à noite (Claude Code)
- Feito (`agente-celular/ajustes-18-11` = main + `origin/claude/logo-home-18-11`), só abaixo de 601 px: passo Peça só com a arara (5 peças de frente em fileiras de 3, escolhida com `bg-accent/16` e o nome; vitrine a partir do Cor); Confecção | Uniformes | Não sabe qual? numa linha, texto embaixo, flutuante some sobre ela; texto no centro; respiro 80/28/24; Clientes logo depois da hero (a barra marca a seção pela posição); rodapé logo → redes → contatos → Navegação (2 colunas, à vista) → Ver no mapa; 4ª dúvida da região; sem balão no Monte do celular.
- Item 4, causa: DOM mexido fora do React, só no iPhone. Os data detectors do Safari viram telefone/CEP/CNPJ em links antes da hidratação (simulado no WebKit: erro #418 e página recriada, com a abertura recomeçando e o "Vista" recriado; nós trocados levam ao "not a child of this node" da tela de erro). Correções: `formatDetection` no layout, canvas da tinta do React, `getClientRects` no lugar de `checkVisibility` (TypeError no iOS < 17.4) e toque durante a transição de tinta guardado em vez de descartado.
- Testes: `scripts/idas-e-voltas.mjs` (logo/menu/Voltar × com/sem abertura × Chromium/WebKit, 20 voltas): 12 × 20 no antes e no `cf07120`, 11 × 20 + 13 no final, 0 telas de erro e console limpo; com pressa no WebKit pelo logo, de 3 para 20/20; checagens 360/390/430 × 2 navegadores × movimento normal/reduzido: 384 ok, 0 falhas; PC 1280/1920 (home e Monte) iguais pixel a pixel.
- Prints a 390 de antes e depois de cada item e o detalhe do item 4: `docs/ponte/prints/agente-celular-ajustes-18-11/` (README).
- Comandos: `git checkout main && git pull && git checkout -b agente-celular/ajustes-18-11 && git merge --no-edit origin/claude/logo-home-18-11`, `npm run lint` (ok), `npx tsc --noEmit` (ok), `npm run build` (webpack, ok), `next start` + Playwright.
- Commits: `cf07120`, `3667ea7` e o de docs. Pendente: confirmar num iPhone de verdade (data detectors só no aparelho); 12º cenário do build final parou em 13/20 (sem erro).

### 2026-11-19 00:10 · Claude · Revisão e publicação dos ajustes do celular (18/11 à noite)
- Revisei `agente-celular/ajustes-18-11` (`cf07120`, `3667ea7`, `98cc679`) e publiquei no main.
- Comandos: lint, tsc, build (webpack, ok); Playwright no Chromium a 360/390/430 (menu nas 4 seções, barra no pé, flutuante no Resumo, sem rolagem lateral, console limpo) e 1280/1920 (14 cliques na barra, sem rastro).
- Pendente: conferir num iPhone de verdade a tinta e as idas e voltas Monte → home.

### 2026-11-19 01:05 · Claude · Transição nas abas das técnicas (celular)
- Pílula turquesa desliza até a aba escolhida (380 ms, leve elástico) e o cartão novo entra com fade e deslize do lado da aba (420 ms); movimento reduzido sem animação. `src/components/home/tecnicas-celular.tsx`.
- Comandos: lint, tsc, build (webpack, ok), quadros a 60/140/450 ms a 390 px.
- Pendente: nada.

### 2026-11-19 12:35 · Claude · Abas sem travar e Processo andando com a rolagem (celular)
- Técnicas: os 3 cartões ficam montados um sobre o outro (fotos já carregadas, as escondidas não trocam sozinhas); trocar de aba só mexe em opacity/transform (30 quadros em 500 ms, maior intervalo 18 ms). Antes, cada troca recriava o cartão e baixava a foto.
- Processo: o passo anda de 1 a 5 enquanto o bloco sobe de 85% a 25% da tela (sem prender a página), volta ao rolar para cima; tocar num número continua valendo; frase com esmaecimento curto e número atual um pouco maior.
- Comandos: lint, tsc, build (webpack, ok), Playwright a 390 (rolagem 1→5, toque no 5, quadros da troca de aba, console limpo).
- Pendente: conferir no iPhone.

### 2026-11-19 12:45 · Claude · Arrastar as fotos das técnicas
- Arrastar para o lado (> 40 px, mais horizontal que vertical) passa ou volta a foto; o toque simples continua passando; a rolagem vertical não é afetada (`touch-pan-y`). `src/components/home/tecnica-fotos.tsx`.
- Comandos: lint, tsc, build (webpack, ok), Playwright a 390 (esq, esq, dir, toque: 0→1→2→1→2).
- Pendente: nada.
