"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { MEDICAO, TEM_MEDICAO } from "@/lib/site";

type Escolha = "aceito" | "necessario";
type Fila = (...args: unknown[]) => void;
type Globais = { dataLayer?: object[]; gtag?: Fila; fbq?: Fila; clarity?: Fila };

const CHAVE = "whim-cookies";
const ABRIR = "whim:preferencias-cookies";
const COOKIES_DE_MEDICAO = /^(_ga|_gid|_gat|_gcl|_fbp|_fbc|_clck|_clsk|_uet)/;

/** Envia um evento às ferramentas carregadas. Sem consentimento (ou sem ID), não faz nada. */
export function medir(evento: string, dados: Record<string, string> = {}) {
  const w = window as unknown as Globais;
  if (MEDICAO.gtm) w.dataLayer?.push({ event: evento, ...dados });
  w.gtag?.("event", evento, dados);
  w.fbq?.("trackCustom", evento, dados);
  w.clarity?.("event", evento);
}

/** De onde veio o clique no WhatsApp, pela seção da página. */
function origem(el: Element) {
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "rodape";
  const secao = el.closest("section[id]")?.id ?? "";
  const nomes: Record<string, string> = { topo: "topo", fim: "convite", contato: "contato", personalizar: "personalizador" };
  return nomes[secao] ?? (secao || "outra");
}

function ler(): Escolha | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "aceito" || v === "necessario" ? v : null;
  } catch {
    return null;
  }
}

/** Apaga os cookies que as ferramentas gravaram no domínio do site. */
function apagarCookiesDeMedicao() {
  const partes = location.hostname.split(".");
  const dominios = ["", ...partes.map((_, i) => partes.slice(i).join("."))];
  for (const nome of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
    if (!COOKIES_DE_MEDICAO.test(nome)) continue;
    for (const d of dominios) document.cookie = `${nome}=; max-age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

/**
 * Aviso de cookies e ferramentas de medição. Só existe se houver algum ID configurado.
 * Os scripts entram depois do "Aceitar" e da primeira interação (ou de 4 s ociosos),
 * nunca no primeiro paint.
 */
export function Medicao() {
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [aviso, setAviso] = useState(false);
  const [interagiu, setInteragiu] = useState(false);
  const avisoRef = useRef<HTMLElement>(null);
  const focar = useRef(false);

  useEffect(() => {
    if (!TEM_MEDICAO) return;
    const salva = ler();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
    setEscolha(salva);
    setAviso(salva === null);

    const eventos = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
    let ocioso = 0;
    const pronto = () => {
      eventos.forEach((e) => removeEventListener(e, pronto));
      clearTimeout(tempo);
      if (ocioso && "cancelIdleCallback" in window) cancelIdleCallback(ocioso);
      setInteragiu(true);
    };
    eventos.forEach((e) => addEventListener(e, pronto, { once: true, passive: true }));
    const tempo = setTimeout(() => {
      ocioso = "requestIdleCallback" in window ? requestIdleCallback(pronto) : (pronto(), 0);
    }, 4000);

    // Reaberto pelo rodapé: o foco vai para o aviso (na primeira visita, não rouba o foco).
    const abrir = () => {
      focar.current = true;
      setAviso(true);
    };
    addEventListener(ABRIR, abrir);

    const clique = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest('a[href^="https://wa.me/"]') : null;
      if (!link) return;
      const de = origem(link);
      medir("contato_whatsapp", { origem: de });
      if (de === "personalizador") medir("orcamento_personalizador");
    };
    document.addEventListener("click", clique, true);

    return () => {
      eventos.forEach((e) => removeEventListener(e, pronto));
      clearTimeout(tempo);
      removeEventListener(ABRIR, abrir);
      document.removeEventListener("click", clique, true);
    };
  }, []);

  useEffect(() => {
    if (!aviso || !focar.current) return;
    focar.current = false;
    avisoRef.current?.focus();
  }, [aviso]);

  if (!TEM_MEDICAO) return null;

  function escolher(nova: Escolha) {
    try {
      localStorage.setItem(CHAVE, nova);
    } catch {
      // Sem localStorage (modo privado): a escolha vale só para esta visita.
    }
    setAviso(false);
    // Scripts já carregados não saem da página: apaga os cookies e recarrega sem eles.
    if (escolha === "aceito" && nova === "necessario") {
      apagarCookiesDeMedicao();
      location.reload();
      return;
    }
    setEscolha(nova);
  }

  const { gtm, ga4, gads, meta, clarity } = MEDICAO;
  const gtag = ga4 ?? gads;

  return (
    <>
      {escolha === "aceito" && interagiu && (
        <>
          {gtm && (
            <Script id="gtm" strategy="lazyOnload">
              {`(function(w,d,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+i;d.head.appendChild(s);})(window,document,'dataLayer','${gtm}');`}
            </Script>
          )}
          {gtag && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtag}`} strategy="lazyOnload" />
              <Script id="gtag" strategy="lazyOnload">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${ga4 ? `gtag('config','${ga4}');` : ""}${gads ? `gtag('config','${gads}');` : ""}`}
              </Script>
            </>
          )}
          {meta && (
            <Script id="meta-pixel" strategy="lazyOnload">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`}
            </Script>
          )}
          {clarity && (
            <Script id="clarity" strategy="lazyOnload">
              {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${clarity}');`}
            </Script>
          )}
        </>
      )}

      {aviso && (
        <section
          ref={avisoRef}
          tabIndex={-1}
          aria-label="Aviso de cookies"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 rounded-3xl border bg-background p-4 text-sm text-foreground shadow-[0_18px_50px_-20px] shadow-primary/45 outline-none sm:right-auto sm:left-4 sm:max-w-md sm:p-5"
        >
          <p className="leading-relaxed text-pretty text-muted-foreground">
            Usamos cookies de medição para entender como o site é usado e melhorar os nossos anúncios,
            só se você permitir.{" "}
            <Link
              href="/privacidade"
              className="font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4"
            >
              Política de privacidade
            </Link>
          </p>
          <div className="mt-3.5 flex gap-2">
            <Button size="xl" className="flex-1 px-4" onClick={() => escolher("aceito")}>
              Aceitar
            </Button>
            <Button size="xl" variant="outline" className="flex-1 px-4" onClick={() => escolher("necessario")}>
              Só o necessário
            </Button>
          </div>
        </section>
      )}
    </>
  );
}

/** Link do rodapé que reabre o aviso. Sem ID configurado, não aparece. */
export function PreferenciasCookies({ className }: { className?: string }) {
  if (!TEM_MEDICAO) return null;
  return (
    <button type="button" className={className} onClick={() => dispatchEvent(new Event(ABRIR))}>
      Preferências de cookies
    </button>
  );
}
