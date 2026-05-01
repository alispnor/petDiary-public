/**
 * Formatação de moeda por locale (i18n).
 *
 * O **preço real** cobrado pelo gateway é sempre em BRL (regra de negócio:
 * empresa brasileira, conta Nubank PJ). Esta utilidade apenas FORMATA o valor
 * usando os símbolos e separadores corretos do locale do usuário.
 *
 * Exemplos:
 *   formatBRL(14.90, "pt-BR") => "R$ 14,90"
 *   formatBRL(14.90, "en")    => "R$ 14.90"
 *   formatBRL(14.90, "es")    => "BRL 14,90"
 *   formatBRL(14.90, "fr")    => "14,90 R$"
 *
 * Para uma futura conversão real (USD, EUR), bastaria chamar a API de câmbio
 * antes e passar `currency` diferente — a estrutura suporta.
 */

const DEFAULT_CURRENCY = "BRL";

export function formatPrice(
  value: number | string,
  options: { locale?: string; currency?: string } = {}
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  const locale = options.locale || (typeof window !== "undefined" ? window.navigator.language : "pt-BR");
  const currency = options.currency || DEFAULT_CURRENCY;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(num);
  } catch {
    // Fallback básico se o locale ou currency forem inválidos
    return `${currency} ${num.toFixed(2)}`;
  }
}

/** Atalho para BRL com locale do i18n. */
export function formatBRL(value: number | string, locale?: string): string {
  return formatPrice(value, { currency: "BRL", locale });
}
