"use client";

import { useState } from "react";

import { Seta } from "@/components/blocos";
import { CampoIsca } from "@/components/campo-isca";
import { Autorizacao, CamposContato, CONTATO_VAZIO, contatoValido, focarErro, TEXTO_AUTORIZACAO, TEXTO_OFERTAS } from "@/components/campos-contato";
import { medir } from "@/components/medicao";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { enviarContato } from "@/lib/contatos";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const estiloCampo = "rounded-xl bg-background px-3.5";

/** Guarda o contato no banco (sem esperar) e abre a conversa com a Whim no WhatsApp. */
export function FormContato({ className }: { className?: string }) {
  const [contato, setContato] = useState(CONTATO_VAZIO);
  const [tentou, setTentou] = useState(false);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!contatoValido(contato)) {
      setTentou(true);
      focarErro(form, "c", contato);
      return;
    }
    const dados = new FormData(form);
    const campo = (nome: string) => String(dados.get(nome) ?? "").trim();
    const empresa = campo("empresa");
    const mensagem = campo("mensagem");
    const nome = contato.nome.trim();
    enviarContato({
      origem: "formulario",
      nome,
      email: contato.email.trim(),
      telefone: contato.telefone,
      mensagem: [empresa && `Empresa ou escola: ${empresa}`, mensagem].filter(Boolean).join("\n") || undefined,
      consentimento: true,
      consentimento_texto: TEXTO_AUTORIZACAO,
      ofertas: contato.ofertas,
      ofertas_texto: TEXTO_OFERTAS,
      site: campo("site"),
    });
    const texto = `Olá, Whim! Sou ${nome}${empresa ? ` da ${empresa}` : ""}. ${mensagem || "Quero um orçamento."}`;
    medir("contato_whatsapp", { origem: "formulario" });
    window.open(linkWhatsApp(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={enviar} noValidate className={cn("relative", className)}>
      <CampoIsca />
      <FieldGroup className="gap-5">
        <CamposContato id="c" valor={contato} onValor={setContato} mostrarErros={tentou} campoClassName={cn(estiloCampo, "h-12")} />
        <Field>
          <FieldLabel htmlFor="c-empresa">Empresa ou escola</FieldLabel>
          <Input id="c-empresa" name="empresa" autoComplete="organization" placeholder="Opcional" maxLength={120} className={cn(estiloCampo, "h-12")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="c-mensagem">O que você precisa?</FieldLabel>
          <Textarea
            id="c-mensagem"
            name="mensagem"
            rows={3}
            maxLength={1800}
            placeholder="Ex.: 80 camisetas para um evento em março"
            className={cn(estiloCampo, "min-h-24 py-3")}
          />
        </Field>
        <Autorizacao id="c" valor={contato} onValor={setContato} mostrarErros={tentou} />
        <Button type="submit" size="xl" className="mt-1 w-full">
          Enviar pelo WhatsApp <Seta />
        </Button>
      </FieldGroup>
    </form>
  );
}
