/**
 * Máscaras de input (BR). Aplicar no onChange (não no estado, no display).
 * As funções recebem string crua e retornam string formatada.
 */

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function maskCPF(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    // (00) 0000-0000
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  // (00) 00000-0000
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCEP(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export const unmask = onlyDigits;
