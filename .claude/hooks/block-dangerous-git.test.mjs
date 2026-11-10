// Teste do hook: node .claude/hooks/block-dangerous-git.test.mjs
// Chama o hook como o Claude Code chama (JSON no stdin) e confere o código de saída.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const hook = fileURLToPath(new URL("./block-dangerous-git.mjs", import.meta.url));
const run = (input) => spawnSync(process.execPath, [hook], { input }).status;

const liberados = [
  "git push",
  "git push origin main",
  "git push -u origin main",
  "git push --set-upstream origin main",
  "git push origin HEAD:refs/heads/main",
  "git push --tags",
  "git -C . push origin main",
  "git push 2>&1 && git log --oneline -5",
  "git push origin main > /dev/null",
  "git push -u origin main 2>$null",
  "git status && git commit -m \"fix: push normal\"",
  "git branch -d feature-pronta",
  "git log --oneline",
  "npm run build",
];

const bloqueados = [
  "git push --force",
  "git push -f origin main",
  "git push --force 2>&1",
  "git push -f origin main >$null",
  "git push -uf origin main",
  "git push origin main --force-with-lease",
  "git push --force-if-includes origin main",
  "git push origin +main",
  "git push origin :main",
  "git push origin --delete main",
  "git push -d origin main",
  "git push --mirror",
  "git push --prune origin",
  "git push upstream main",
  "git push https://example.com/outro.git main",
  "git reset --hard HEAD~1",
  "git clean -fd",
  "git clean -n",
  "git branch -D velha",
  "git branch --delete --force velha",
  "git checkout .",
  "git checkout -- .",
  "git restore .",
  "git status; git push -f",
  "git add . && git push --force origin main",
  "bash -c \"git push --force\"",
  "& git.exe push -f",
  "& \"C:\\Program Files\\Git\\cmd\\git.exe\" push --force",
];

let falhas = 0;
for (const [lista, esperado, rotulo] of [[liberados, 0, "liberado "], [bloqueados, 2, "bloqueado"]]) {
  for (const command of lista) {
    const got = run(JSON.stringify({ tool_input: { command } }));
    if (got !== esperado) falhas++;
    console.log(`${got === esperado ? "ok    " : "FALHOU"} ${rotulo} ${command}`);
  }
}
if (run("isto não é json") !== 2) {
  falhas++;
  console.log("FALHOU entrada inválida devia bloquear");
} else console.log("ok     bloqueado entrada inválida");

const total = liberados.length + bloqueados.length + 1;
console.log(falhas ? `${falhas} de ${total} falharam` : `${total}/${total} ok`);
process.exit(falhas ? 1 : 0);
