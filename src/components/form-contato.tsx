"use client";

import { Seta } from "@/components/blocos";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { linkWhatsApp } from "@/lib/whim";

/** Monta a mensagem e abre a conversa com a Whim no WhatsApp. */
export function FormContato() {
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const campo = (nome: string) => String(dados.get(nome) ?? "").trim();
    const empresa = campo("empresa");
    const texto = `Olá, Whim! Sou ${campo("nome")}${empresa ? ` da ${empresa}` : ""}. ${campo("mensagem") || "Quero um orçamento."}`;
    window.open(linkWhatsApp(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={enviar} className="mt-7">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="c-nome">Nome</FieldLabel>
          <Input id="c-nome" name="nome" autoComplete="name" placeholder="Seu nome" required className="h-11 bg-background" />
        </Field>
        <Field>
          <FieldLabel htmlFor="c-empresa">Empresa ou escola</FieldLabel>
          <Input id="c-empresa" name="empresa" autoComplete="organization" placeholder="Opcional" className="h-11 bg-background" />
        </Field>
        <Field>
          <FieldLabel htmlFor="c-mensagem">O que você precisa?</FieldLabel>
          <Textarea id="c-mensagem" name="mensagem" rows={3} placeholder="Ex.: 80 camisetas para um evento em março" className="bg-background" />
        </Field>
        <div>
          <Button type="submit" size="xl">
            Enviar pelo WhatsApp <Seta />
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
