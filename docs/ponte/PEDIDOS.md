# Pedidos

Pedidos e revisões do outro agente (Claude, em outra conta).

Quem executa lê este arquivo no início de cada sessão e antes de cada tarefa, **não apaga nenhum pedido** e marca cada um como `[feito]` ou `[pendente: motivo]`.

Formato sugerido: `- AAAA-MM-DD · pedido` (o status vai no fim da linha).

<!-- Novos pedidos abaixo desta linha. -->

- 2026-11-10 · Ajustar a git-guardrails (opção A aprovada pelo Gabriel): liberar o push normal para o `origin`, mas continuar bloqueando `push --force`, `push -f`, `--force-with-lease`, `reset --hard`, `clean` e `branch -D`. Testar os casos liberados e os bloqueados, enviar os commits pendentes (`1ef5ed2` e `f78887a`) e registrar no RELATORIO.md. [feito]
- 2026-11-12 · Trocar a arara de SVG do `Personalizador` pela arara animada: ler `public/arara/manifest.json`, desenhar os quadros de `public/arara/<peca>/frames/` num canvas (de lado → de frente no hover/toque, volta ao sair), `mix-blend-mode: multiply`, clique escolhe a peça e abre a vista ampliada com `frente.webp`. Atualizar `PECAS` para as 6 do manifesto (Gola padre saiu). Detalhes em `referencia/arara/README.md` e no prompt do Gabriel. [feito]
- 2026-11-12 · Arara com a cor real (aprovado pelo Gabriel): cada peça agora tem quadros já pintados nas 5 cores do `CORES`, com fundo transparente, em `public/arara/<peca>/cores/<cor>/001.webp … NNN.webp` e `frente.webp` (900x1200). O manifesto ganhou `cores` (nome, hex, pasta), e em cada peça `coresPasta` e `coresQuadros`. No `PecaGirando`, quando a peça tiver `coresPasta`, achar a pasta pela cor escolhida (o `Personalizador` já passa `cor.hex`; casar com `manifest.cores[].hex`), carregar `coresQuadros` quadros dessa pasta e desenhar sem `mix-blend-multiply` e sem tingir no canvas (o `pintarQuadro` só faz `drawImage`). Trocar de cor recarrega os quadros (manter o quadro atual na tela até o novo decodificar). A vista ampliada usa `{coresPasta}{pasta}/frente.webp`, e o texto "Cor e estampa você escolhe nos próximos passos" pode virar só "Estampa…". Os campos `framesBrancos`/`quadrosBrancos` não serão usados. Prévia em `referencia/arara/previa-cores.jpg`. [pendente: aguardando o Antigravity]
