// Imagem de compartilhamento (WhatsApp, redes): 1200x630, logo branco no azul-marinho.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// next/og não lê woff2; a Poppins vai em TTF. Leitura síncrona: com Cache Components,
// ler arquivo de forma assíncrona tira a imagem do build estático.
const poppins = readFileSync(join(process.cwd(), "src/assets/poppins-semibold.ttf"));
const logo = readFileSync(join(process.cwd(), "public/brand/whim-logo-branco.svg"), "base64");

export function imagemOg(titulo: string, linha: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#373857",
          color: "#FFFFFF",
          fontFamily: "Poppins",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
        <img src={`data:image/svg+xml;base64,${logo}`} width={283} height={88} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 72, height: 6, borderRadius: 3, background: "#31C4EA", marginBottom: 28 }} />
          <div style={{ fontSize: 68, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{titulo}</div>
          <div style={{ marginTop: 22, fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.78)", maxWidth: 920 }}>
            {linha}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Poppins", data: poppins, weight: 600, style: "normal" }] }
  );
}
