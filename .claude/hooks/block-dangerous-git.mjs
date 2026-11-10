// Hook PreToolUse (Bash e PowerShell) que barra comandos git destrutivos.
// Origem: skill git-guardrails-claude-code (mattpocock/skills), reescrita em Node para ler
// os argumentos (pedido de 2026-11-10 em docs/ponte/PEDIDOS.md).
// Libera: push normal para o origin. Bloqueia: push forçado, que apaga ref ou vai para outro
// remoto; reset --hard; clean; branch -D; checkout .; restore .
// Teste: node .claude/hooks/block-dangerous-git.test.mjs
// ponytail: análise por tokens, não um parser de shell completo. Protege contra acidente,
// não contra quem quer burlar (alias do git, script que chama git por dentro).
import { readFileSync } from "node:fs";

function block(reason) {
  console.error(`BLOCKED: ${reason}. The user has prevented you from doing this.`);
  process.exit(2);
}

let command;
try {
  command = JSON.parse(readFileSync(0, "utf8")).tool_input?.command ?? "";
} catch {
  block("could not read the hook input");
}
// Tira redireções (`2>&1`, `> log`, `>$null`) para não virarem argumento nem quebrarem no `&`.
command = command.replace(/[\d*]*[<>]+&?\d*(?:\s*[^\s;&|<>]+)?/g, " ");

// Analisa o comando inteiro e também o conteúdo de cada string entre aspas
// (pega `bash -c "git push -f"`), quebrando nos separadores de comando.
const quoted = [...command.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
const segments = [command, ...quoted].flatMap((s) => s.split(/[;&|\n\r(){}`]/));

const GIT_OPTS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);

for (const segment of segments) {
  const t = (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((x) => x.replace(/^["']|["']$/g, ""));
  let i = t.findIndex((x) => /(^|[\\/])git(\.exe)?$/i.test(x));
  if (i < 0) continue;
  for (i++; t[i]?.startsWith("-"); ) i += GIT_OPTS_WITH_VALUE.has(t[i]) ? 2 : 1;
  const [sub, ...args] = t.slice(i);
  const short = (re) => args.some((a) => /^-[^-]/.test(a) && re.test(a));
  const has = (re) => args.some((a) => re.test(a));
  const what = segment.trim();

  if (sub === "push") {
    if (short(/[fd]/) || has(/^--(force|delete|mirror|prune|repo)/) || has(/^[+:]/))
      block(`'${what}' forces or deletes on the remote`);
    const remote = args.find((a) => !a.startsWith("-"));
    if (remote && remote !== "origin") block(`'${what}' pushes somewhere other than origin`);
  }
  if (sub === "reset" && args.includes("--hard")) block(`'${what}' discards work`);
  if (sub === "clean") block(`'${what}' deletes untracked files`);
  if (sub === "branch" && (short(/D/) || ((short(/d/) || args.includes("--delete")) && (short(/f/) || args.includes("--force")))))
    block(`'${what}' force-deletes a branch`);
  if ((sub === "checkout" || sub === "restore") && args.includes(".")) block(`'${what}' discards local changes`);
}
