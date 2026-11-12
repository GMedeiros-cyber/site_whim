import Image from "next/image";

import { Container } from "@/components/blocos";
import { CONTATO, WHATSAPP } from "@/lib/whim";

export function SiteFooter() {
  return (
    <footer className="bg-primary pt-12 pb-[calc(env(safe-area-inset-bottom)+3rem)] text-[13px] text-primary-foreground/75">
      <Container className="flex flex-col items-start gap-x-10 gap-y-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Image
          src="/brand/whim-logo-branco.svg"
          alt="Whim Confecção e Estamparia"
          width={444}
          height={138}
          className="h-10 w-auto"
        />
        <address className="flex flex-col gap-1 not-italic sm:items-end">
          <span>{CONTATO.endereco}</span>
          <span>
            <a href={`https://wa.me/${WHATSAPP}`} className="underline-offset-4 hover:underline">
              {CONTATO.whatsapp}
            </a>
            {" · "}
            <a href={`mailto:${CONTATO.email}`} className="underline-offset-4 hover:underline">
              {CONTATO.email}
            </a>
          </span>
        </address>
      </Container>
    </footer>
  );
}
