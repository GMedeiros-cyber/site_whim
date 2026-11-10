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
