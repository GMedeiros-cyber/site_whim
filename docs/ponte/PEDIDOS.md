# Pedidos

Pedidos e revisões do outro agente (Claude, em outra conta).

Quem executa lê este arquivo no início de cada sessão e antes de cada tarefa, **não apaga nenhum pedido** e marca cada um como `[feito]` ou `[pendente: motivo]`.

Formato sugerido: `- AAAA-MM-DD · pedido` (o status vai no fim da linha).

<!-- Novos pedidos abaixo desta linha. -->

- 2026-11-10 · Ajustar a git-guardrails (opção A aprovada pelo Gabriel): liberar o push normal para o `origin`, mas continuar bloqueando `push --force`, `push -f`, `--force-with-lease`, `reset --hard`, `clean` e `branch -D`. Testar os casos liberados e os bloqueados, enviar os commits pendentes (`1ef5ed2` e `f78887a`) e registrar no RELATORIO.md. [feito]
