"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { linkWhatsApp } from "@/lib/whim";

const CHAVE = "whim-dica-whatsapp";
const LINK = linkWhatsApp("Olá, Whim! Quero um orçamento.");

/**
 * Botão flutuante do WhatsApp, em todas as páginas (layout.tsx).
 * Só o ícone do WhatsApp, 56 px (PC e celular), sem texto e parado (sem balanço).
 * Balão uma vez por sessão, 3 s depois de carregar (na home do celular, 3 s depois de rolar
 * para além da hero); some em 8 s, no × ou no clique.
 */
export function BotaoWhatsApp() {
  const [dica, setDica] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE)) return;
    } catch {}
    let abre = 0;
    let fecha = 0;
    const comecar = () => {
      abre = window.setTimeout(() => {
        try {
          sessionStorage.setItem(CHAVE, "1");
        } catch {}
        setDica(true);
        fecha = window.setTimeout(() => setDica(false), 8000);
      }, 3000);
    };
    // Home no celular (18/11): o botão de orçamento fica no pé da hero, onde o balão abre;
    // o balão espera a pessoa rolar para além dele.
    const aoRolar = () => {
      if (window.scrollY < window.innerHeight * 0.6) return;
      window.removeEventListener("scroll", aoRolar);
      comecar();
    };
    if (matchMedia("(width < 601px)").matches && document.getElementById("topo")) {
      window.addEventListener("scroll", aoRolar, { passive: true });
    } else comecar();
    return () => {
      window.removeEventListener("scroll", aoRolar);
      clearTimeout(abre);
      clearTimeout(fecha);
    };
  }, []);

  return (
    // Celular no Monte sua peça: sobe acima da barra de Voltar/Continuar presa no pé da tela.
    <div className="pointer-events-none fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex flex-col items-end gap-2.5 max-[600px]:[body:has([data-barra-acoes])_&]:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] max-[600px]:[body:has([data-barra-acoes][data-ultimo])_&]:hidden md:right-6 md:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {dica && (
        // Por cima do botão (absolute): se entrasse no fluxo, o bloco fixo cresceria e contaria como CLS.
        <div className="pointer-events-auto absolute right-0 bottom-[calc(100%+0.625rem)] flex w-max max-w-[210px] items-start rounded-[16px_16px_4px_16px] border border-primary/8 bg-background py-0.5 pr-0.5 pl-3.5 text-[13px] leading-snug text-foreground shadow-[0_14px_30px_-18px] shadow-primary/55 duration-500 ease-[cubic-bezier(.2,.9,.3,1.3)] animate-in fade-in zoom-in-90 slide-in-from-bottom-2 motion-reduce:animate-none md:max-w-[250px]">
          <p className="py-2">Oi! Quer um orçamento? A nossa equipe responde no WhatsApp.</p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => setDica(false)}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon aria-hidden className="size-4" />
          </button>
        </div>
      )}
      <a
        href={LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pedir orçamento no WhatsApp"
        onClick={() => setDica(false)}
        className="pointer-events-auto flex size-14 items-center justify-center gap-2.5 rounded-full bg-accent text-[15px] font-semibold text-primary shadow-[0_18px_36px_-16px] shadow-primary/60 transition-colors outline-none hover:bg-[color-mix(in_oklab,var(--accent),var(--background)_18%)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
      >
        {/* Ícone oficial do WhatsApp, numa cor só. */}
        <svg aria-hidden viewBox="0 0 24 24" className="size-7 shrink-0 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
