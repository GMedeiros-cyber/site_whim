"use client";

import { useLayoutEffect, useRef } from "react";

import { avisarVistaPronta, depoisDaAbertura, faseIntro } from "@/lib/abertura";

const ATRASO = 250; // ms antes de a tinta entrar
const DURACAO = 2500; // ms da pintura inteira

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// A frente da tinta anda da esquerda para a direita com a borda ondulada.
// Atrás dela a tinta "seca" até o degradê final, o mesmo do texto em CSS:
// turquesa até 8% da palavra e branco a partir de 42%.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_mascara;
uniform float u_t;
uniform vec2 u_tam;
uniform vec2 u_caixa;
uniform vec3 u_tinta;
uniform vec3 u_branco;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * ruido(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  float m = texture2D(u_mascara, v_uv).a;
  if (m < 0.004) discard;
  float x = (v_uv.x - u_caixa.x) / u_caixa.y;
  vec2 p = v_uv * u_tam / u_tam.y;
  float borda = (fbm(vec2(p.y * 3.0, u_t * 1.6)) - 0.5) * 0.36
              + (ruido(p * 26.0 + vec2(u_t * 5.0, 0.0)) - 0.5) * 0.05;
  float d = mix(-0.3, 1.6, u_t) - x + borda;
  float tinta = smoothstep(0.0, 0.012, d);
  float seca = smoothstep(0.03, 0.32, d);
  float repouso = clamp((x - 0.08) / 0.34, 0.0, 1.0);
  vec3 cor = mix(u_tinta, u_branco, repouso * seca);
  cor = mix(cor, u_branco, 0.35 * (1.0 - smoothstep(0.0, 0.035, d)));
  float a = m * tinta;
  gl_FragColor = vec4(cor * a, a);
}`;

const suave = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const rgb = (cor: string) =>
  (cor.match(/[\d.]+/g) ?? []).slice(0, 3).map((n) => Number(n) / 255);

/**
 * Palavra gigante do topo. Depois da abertura, um shader de tinta turquesa pinta a
 * palavra da esquerda para a direita (~60 quadros/s); um toque ou uma tecla pula.
 * No fim o texto em CSS (mesmo degradê) assume, o canvas some e a barra de navegação entra.
 * Sem a entrada (chegou por outro link), movimento reduzido ou sem WebGL: aparece pronta.
 * O canvas é do React (vem no HTML, vazio): o efeito só desenha nele, nunca põe nem tira nós
 * do DOM à mão (DOM mexido fora do React derruba a página com "not a child of this node").
 */
export function PalavraTinta({ children }: { children: string }) {
  const textoRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const texto = textoRef.current;
    const canvas = canvasRef.current;
    if (!texto?.parentElement || !canvas) return;
    const pronta = () => {
      texto.dataset.estado = "pronta";
      avisarVistaPronta();
    };

    if (!faseIntro() || matchMedia("(prefers-reduced-motion: reduce)").matches) return pronta();
    delete texto.dataset.estado;

    let cancelado = false;
    let raf = 0;
    let timer = 0;
    let inicio = 0;
    let gl: WebGLRenderingContext | null = null;
    // Pular = o próximo quadro já é o último. Toque, tecla, resize, aba oculta
    // ou o topo saindo da tela.
    const pular = () => {
      inicio = -Infinity;
    };
    const fora = new IntersectionObserver(([e]) => e.isIntersecting || pular());
    const ouvir = (liga: boolean) => {
      for (const ev of ["pointerdown", "keydown", "resize", "visibilitychange"]) {
        if (liga) window.addEventListener(ev, pular);
        else window.removeEventListener(ev, pular);
      }
      if (liga) fora.observe(texto);
      else fora.disconnect();
    };
    // Libera o WebGL e a memória do canvas (ele fica vazio, invisível, na árvore).
    const soltarGl = () => {
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      gl = null;
      delete canvas.dataset.ativo;
      canvas.width = canvas.height = 0;
    };

    const comecar = () => {
      if (cancelado) return;
      const r = texto.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return pronta(); // já rolou para longe
      const cs = getComputedStyle(texto);
      document.fonts
        .load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, children)
        .catch(() => {})
        .then(() => (cancelado ? null : prepararTinta(texto, canvas)))
        .then((tinta) => {
          gl = tinta?.gl ?? null;
          if (cancelado) return soltarGl();
          if (!tinta) {
            soltarGl();
            return pronta();
          }
          canvas.dataset.ativo = "";
          ouvir(true);
          inicio = performance.now() + ATRASO;
          const quadro = (agora: number) => {
            const t = Math.min(1, Math.max(0, (agora - inicio) / DURACAO));
            tinta.pintar(suave(t));
            if (t < 1) {
              raf = requestAnimationFrame(quadro);
              return;
            }
            ouvir(false);
            pronta();
            delete canvas.dataset.ativo; // some em 300 ms por cima do texto igual
            timer = window.setTimeout(soltarGl, 400);
          };
          raf = requestAnimationFrame(quadro);
        })
        .catch(() => {
          // se o WebGL falhar no meio, a palavra não pode ficar invisível
          soltarGl();
          pronta();
        });
    };
    // A abertura só anda depois da hidratação, então a tinta já começa com a página ociosa.
    const cancelarEspera = depoisDaAbertura(comecar);

    return () => {
      cancelarEspera();
      cancelado = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ouvir(false);
      soltarGl();
      // Saiu da home no meio da entrada (a página fica escondida pelo Next, ainda no DOM): a
      // entrada acaba. getClientRects e não checkVisibility (que falta no iOS anterior ao 17.4).
      queueMicrotask(() => texto.getClientRects().length > 0 || avisarVistaPronta());
    };
  }, [children]);

  return (
    <span className="relative mx-auto block w-fit text-primary-foreground">
      <span
        ref={textoRef}
        // O padding (desfeito pela margem) deixa o pingo do "i" e o fim do "a"
        // dentro da caixa: o bg-clip-text não pinta o que passa dela.
        className="-mx-[0.08em] -my-[0.1em] block bg-linear-to-r/srgb from-accent from-8% to-primary-foreground to-42% bg-clip-text px-[0.08em] py-[0.1em] text-[clamp(5.25rem,18.2vw,14.4375rem)] leading-[0.82] min-[1800px]:text-[18.2rem] min-[2400px]:text-[22.4rem] font-extrabold tracking-[-0.065em] whitespace-nowrap text-transparent motion-safe:opacity-0 data-[estado=pronta]:opacity-100"
      >
        {children}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden
        width={0}
        height={0}
        className="pointer-events-none absolute text-accent opacity-0 transition-opacity duration-300 data-ativo:opacity-100"
      />
    </span>
  );
}

const proximoQuadro = () => new Promise((r) => requestAnimationFrame(r));

/**
 * Mede a palavra, desenha a máscara das letras e monta o WebGL.
 * Canvas e máscara em 1 pixel por pixel CSS (DPR 1): menos trabalho por quadro;
 * no fim o texto nítido em CSS assume.
 */
async function prepararTinta(texto: HTMLElement, canvas: HTMLCanvasElement) {
  const no = texto.firstChild;
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl || !(no instanceof Text)) return null;

  const caixa = texto.getBoundingClientRect();
  const cs = getComputedStyle(texto);
  // Medidas em pixels da tela; com o zoom das telas grandes (globals.css), o CSS do
  // canvas e o corpo da fonte ficam em px do CSS = pixels da tela ÷ zoom.
  const zoom = caixa.width / texto.offsetWidth || 1;
  const corpo = parseFloat(cs.fontSize) * zoom;
  const pad = Math.ceil(corpo * 0.1); // folga para o antisserrilhado
  // Canvas em pixel inteiro da tela, para o navegador não arredondar a posição.
  const x0 = Math.floor(caixa.left) - pad;
  const y0 = Math.floor(caixa.top) - pad;
  const w = Math.ceil(caixa.right) + pad - x0;
  const h = Math.ceil(caixa.bottom) + pad - y0;
  const pai = (canvas.offsetParent ?? texto).getBoundingClientRect();
  Object.assign(canvas.style, {
    left: `${(x0 - pai.left) / zoom}px`,
    top: `${(y0 - pai.top) / zoom}px`,
    width: `${w / zoom}px`,
    height: `${h / zoom}px`,
  });
  canvas.width = w;
  canvas.height = h;

  // Cada letra vai para onde o navegador a pôs (respeita kerning e tracking).
  const mascara = document.createElement("canvas");
  mascara.width = w;
  mascara.height = h;
  const ctx = mascara.getContext("2d");
  if (!ctx) return null;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${corpo}px ${cs.fontFamily}`;
  const faixa = document.createRange();
  for (let i = 0; i < no.length; i++) {
    faixa.setStart(no, i);
    faixa.setEnd(no, i + 1);
    const r = faixa.getBoundingClientRect();
    const letra = no.data[i];
    const subida = ctx.measureText(letra).fontBoundingBoxAscent;
    ctx.fillText(letra, r.left - x0, r.top - y0 + subida);
  }

  const shader = (tipo: number, fonte: string) => {
    const s = gl.createShader(tipo);
    if (!s) return null;
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    return s;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  // Ler o LINK_STATUS logo após o link trava a thread até a GPU terminar.
  // Com KHR_parallel_shader_compile, pergunta a cada quadro se já acabou;
  // sem ela, ao menos dá um quadro para a GPU compilar antes de perguntar.
  const paralelo = gl.getExtension("KHR_parallel_shader_compile");
  do {
    await proximoQuadro();
  } while (paralelo && !gl.getProgramParameter(prog, paralelo.COMPLETION_STATUS_KHR));
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mascara);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Cores do tema: o canvas tem text-accent; o pai, text-primary-foreground.
  const u = (nome: string) => gl.getUniformLocation(prog, nome);
  gl.uniform2f(u("u_tam"), w, h);
  gl.uniform2f(u("u_caixa"), (caixa.left - x0) / w, caixa.width / w);
  gl.uniform3fv(u("u_tinta"), rgb(getComputedStyle(canvas).color));
  gl.uniform3fv(u("u_branco"), rgb(getComputedStyle(texto.parentElement ?? texto).color));
  const uT = u("u_t");
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    pintar(t: number) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
