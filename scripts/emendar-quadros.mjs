// Junta os quadros de cada peça/cor (001.webp … NNN.webp) num arquivo só, quadros.bin, para a
// arara e a prévia baixarem uma vez em vez de 20 a 44 requisições. Os .webp vão emendados como
// estão (sem recomprimir); cada um começa com "RIFF" + tamanho, e é assim que o site os separa
// (lerPacote em src/components/arara.tsx). Rodar de novo sempre que os quadros mudarem:
//   node scripts/emendar-quadros.mjs
import fs from "node:fs";

const manifesto = JSON.parse(fs.readFileSync("public/arara/manifest.json", "utf8"));
let total = 0;
for (const peca of manifesto.pecas) {
  for (const cor of manifesto.cores) {
    const pasta = `public${peca.coresPasta}${cor.pasta}/`;
    const quadros = Array.from({ length: peca.coresQuadros }, (_, i) => {
      const arquivo = `${pasta}${String(i + 1).padStart(3, "0")}.webp`;
      const b = fs.readFileSync(arquivo);
      if (b.toString("latin1", 0, 4) !== "RIFF" || b.readUInt32LE(4) + 8 !== b.length) throw new Error(`${arquivo} não é um WebP inteiro`);
      return b;
    });
    const pacote = Buffer.concat(quadros);
    fs.writeFileSync(`${pasta}quadros.bin`, pacote);
    total += pacote.length;
  }
}
console.log(`${manifesto.pecas.length * manifesto.cores.length} pacotes, ${(total / 1024 / 1024).toFixed(1)} MB`);
