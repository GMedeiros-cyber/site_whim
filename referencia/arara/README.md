# Arara de modelos (Monte sua peça)

Peças geradas com IA (Nano Banana no Google Flow) e giro animado com Veo 3.1, só para mostrar os **modelos** que a Whim personaliza. Não são fotos de produtos reais.

## Arquivos prontos para o site (`public/arara/`)
- `manifest.json`: lista das peças (id, nome, cor, nº de quadros, caminhos).
- `<peca>/frames/001.webp … NNN.webp`: giro de lado (001) para frente (último), 480×640, fundo branco puro.
- `<peca>/frente.webp`: foto de frente 900×1200 para a vista ampliada.
- Peças: camiseta, polo, golav, regata, babylook, moletom. (Gola padre foi descartada.)

## Como exibir
- Desenhar os quadros num `<canvas>` (não usar seek de vídeo): para frente no hover/toque, para trás ao sair, ~0,9 s.
- Tirar o branco com `mix-blend-mode: multiply`. Nenhum ancestral do canvas pode criar stacking context (z-index, transform, opacity < 1, filter, perspective); anime o próprio canvas.
- Todas as peças estão na mesma escala e com o gancho na mesma altura.

## Fontes
- `fontes-916/`: quadros de lado e de frente em 9:16 usados no Veo (formato igual ao do vídeo, para não cortar).
- `videos/`: giros originais (720×1280, 8 s). `scripts/`: recorte (`manual.json` = quadro inicial e final de cada giro).
