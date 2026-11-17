"use client";

import { useState } from "react";
import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Nome, telefone e e-mail de quem pede o orçamento (Monte sua peça e formulário de Contato). */
export type DadosContato = { nome: string; telefone: string; email: string; autoriza: boolean };
export const CONTATO_VAZIO: DadosContato = { nome: "", telefone: "", email: "", autoriza: false };
export const TEXTO_AUTORIZACAO = "Autorizo a Whim a usar estes dados para responder ao meu contato.";

/** "(11) 98765-4321" ou "(11) 3456-7890" enquanto digita; tira o +55 de número colado. */
export function mascararTelefone(v: string) {
  const d = v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 2) return d && `(${d}`;
  const meio = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? `-${d.slice(meio)}` : ""}`;
}

export function errosContato(c: DadosContato) {
  const tel = c.telefone.replace(/\D/g, "");
  return {
    nome: c.nome.trim().length >= 2 ? "" : "Escreva seu nome.",
    // DDD sem zero; celular com 9 na frente (11 dígitos) ou fixo de 2 a 8 (10 dígitos).
    telefone: /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(tel) ? "" : "Telefone com DDD, como (11) 98765-4321.",
    email: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(c.email.trim()) ? "" : "Confira o e-mail, como nome@empresa.com.br.",
    autoriza: c.autoriza ? "" : "Marque a autorização para enviar.",
  };
}
export const contatoValido = (c: DadosContato) => Object.values(errosContato(c)).every((e) => !e);
type Chave = keyof DadosContato;

/**
 * Os três campos obrigatórios. O erro de cada um aparece ao sair do campo ou, com
 * `mostrarErros`, todos de uma vez (depois de tentar enviar).
 */
export function CamposContato({
  id,
  valor,
  onValor,
  mostrarErros,
  campoClassName,
}: {
  id: string;
  valor: DadosContato;
  onValor: (v: DadosContato) => void;
  mostrarErros: boolean;
  campoClassName?: string;
}) {
  const [tocado, setTocado] = useState<Partial<Record<Chave, boolean>>>({});
  const erros = errosContato(valor);
  const campo = (k: "nome" | "telefone" | "email", rotulo: string, props: React.ComponentProps<typeof Input>) => {
    const erro = (mostrarErros || tocado[k]) && erros[k];
    return (
      <Field data-invalid={!!erro || undefined} className="gap-1.5">
        <FieldLabel htmlFor={`${id}-${k}`}>{rotulo}</FieldLabel>
        <Input
          id={`${id}-${k}`}
          name={k}
          required
          value={valor[k]}
          onChange={(e) => onValor({ ...valor, [k]: e.target.value })}
          onBlur={() => setTocado((t) => ({ ...t, [k]: true }))}
          aria-invalid={!!erro || undefined}
          aria-describedby={erro ? `${id}-${k}-erro` : undefined}
          className={cn("h-11", campoClassName)}
          {...props}
        />
        {erro && <FieldError id={`${id}-${k}-erro`} className="text-[13px]">{erro}</FieldError>}
      </Field>
    );
  };
  return (
    <>
      {/* Limites iguais aos da rota /api/contatos. */}
      {campo("nome", "Nome", { autoComplete: "name", placeholder: "Seu nome", maxLength: 120 })}
      {campo("telefone", "Telefone (WhatsApp)", {
        type: "tel",
        inputMode: "tel",
        autoComplete: "tel-national",
        placeholder: "(11) 98765-4321",
        onChange: (e) => onValor({ ...valor, telefone: mascararTelefone(e.target.value) }),
      })}
      {campo("email", "E-mail", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "nome@empresa.com.br", maxLength: 254 })}
    </>
  );
}

/** Caixa de autorização (obrigatória) e o link para a Política de privacidade. */
export function Autorizacao({
  id,
  valor,
  onValor,
  mostrarErros,
}: {
  id: string;
  valor: DadosContato;
  onValor: (v: DadosContato) => void;
  mostrarErros: boolean;
}) {
  const erro = mostrarErros && errosContato(valor).autoriza;
  return (
    <div className="grid gap-1">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[13px] leading-snug">
        <Checkbox
          checked={valor.autoriza}
          onCheckedChange={(v) => onValor({ ...valor, autoriza: !!v })}
          aria-invalid={!!erro || undefined}
          aria-describedby={erro ? `${id}-autoriza-erro` : undefined}
          className="size-5"
        />
        {TEXTO_AUTORIZACAO}
      </label>
      {erro && (
        <p id={`${id}-autoriza-erro`} role="alert" className="text-[13px] text-destructive">
          {erro}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Quais dados, por quanto tempo e como pedir para apagar:{" "}
        <Link href="/privacidade" className="font-medium text-foreground underline underline-offset-4">
          Política de privacidade
        </Link>
        .
      </p>
    </div>
  );
}
