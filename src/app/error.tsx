"use client";

import { TelaErro } from "@/components/tela-erro";

export default function Erro({ error }: { error: unknown }) {
  return <TelaErro error={error} />;
}
