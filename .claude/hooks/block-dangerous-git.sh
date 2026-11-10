#!/bin/bash
# Origem: skill git-guardrails-claude-code (mattpocock/skills).
# ponytail: casa os padrões no JSON bruto do hook em vez de extrair o comando com jq
# (jq não está instalado aqui; sem ele o original liberava tudo). Um falso positivo
# (ex.: o padrão aparecer na descrição) só bloqueia, nunca libera.

INPUT=$(cat)

DANGEROUS_PATTERNS=(
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$INPUT" | grep -qE "$pattern"; then
    echo "BLOCKED: command matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
