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
