"use client";

import { Seta } from "@/components/blocos";
import { medir } from "@/components/medicao";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whim";

const estiloCampo = "rounded-xl bg-background px-3.5";

/** Monta a mensagem e abre a conversa com a Whim no WhatsApp. */
export function FormContato({ className }: { className?: string }) {
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const campo = (nome: string) => String(dados.get(nome) ?? "").trim();
    const empresa = campo("empresa");
    const texto = `Olá, Whim! Sou ${campo("nome")}${empresa ? ` da ${empresa}` : ""}. ${campo("mensagem") || "Quero um orçamento."}`;
    medir("contato_whatsapp", { origem: "formulario" });
    window.open(linkWhatsApp(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={enviar} className={className}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="c-nome">Nome</FieldLabel>
          <Input id="c-nome" name="nome" autoComplete="name" placeholder="Seu nome" required className={cn(estiloCampo, "h-12")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="c-empresa">Empresa ou escola</FieldLabel>
          <Input id="c-empresa" name="empresa" autoComplete="organization" placeholder="Opcional" className={cn(estiloCampo, "h-12")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="c-mensagem">O que você precisa?</FieldLabel>
          <Textarea
            id="c-mensagem"
            name="mensagem"
            rows={3}
            placeholder="Ex.: 80 camisetas para um evento em março"
            className={cn(estiloCampo, "min-h-24 py-3")}
          />
        </Field>
        <Button type="submit" size="xl" className="mt-1 w-full">
          Enviar pelo WhatsApp <Seta />
        </Button>
      </FieldGroup>
    </form>
  );
}
