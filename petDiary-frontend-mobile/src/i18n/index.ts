/**
 * Configuração i18n do petDiary mobile.
 *
 * Idiomas: pt-BR (default + fonte), pt-PT, en, es, fr, ar (RTL).
 * Hoje só pt-BR está completo. Outros locales serão adicionados na B4.
 *
 * - i18next: motor
 * - react-i18next: bindings React
 * - expo-localization: detecta idioma do dispositivo
 * - Persistência: useAppStore.language (AsyncStorage)
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import ptBR from "./locales/pt-BR.json";

const RTL_LANGS = ["ar", "he", "fa", "ur"];

export const SUPPORTED_LANGUAGES = [
  { code: "pt-BR", label: "🇧🇷 Português (Brasil)" },
  { code: "pt-PT", label: "🇵🇹 Português (Portugal)" },
  { code: "en-US", label: "🇺🇸 English" },
  { code: "es-ES", label: "🇪🇸 Español" },
  { code: "fr-FR", label: "🇫🇷 Français" },
  { code: "ar", label: "العربية" },
] as const;

function detectInitial(): string {
  try {
    const tag = Localization.getLocales?.()[0]?.languageTag ?? "pt-BR";
    if (tag.startsWith("pt")) {
      return tag.toLowerCase().includes("pt") ? "pt-BR" : "pt-BR";
    }
    if (tag.startsWith("ar")) return "ar";
    if (tag.startsWith("en")) return "en-US";
    if (tag.startsWith("es")) return "es-ES";
    if (tag.startsWith("fr")) return "fr-FR";
  } catch {
    // ignora — usa default
  }
  return "pt-BR";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      "pt-PT": { translation: ptBR }, // fallback até B4
      "en-US": { translation: ptBR },
      "es-ES": { translation: ptBR },
      "fr-FR": { translation: ptBR },
      ar: { translation: ptBR },
    },
    lng: detectInitial(),
    fallbackLng: "pt-BR",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });

// Sincroniza com `language` persistido no useAppStore quando hidratar.
// Não usar import dinâmico aqui — TS module config não permite. O store
// é importado pelo LanguageSwitcher que aplica i18n.changeLanguage no
// toggle. No boot inicial, expo-localization já cobre via detectInitial().
//
// Se precisar reaplicar idioma persistido após rehydrate, fazer em um
// useEffect no AppNavigator (já tem hidratação tracker lá).

export function isRTL(lang?: string): boolean {
  const l = lang ?? i18n.language;
  return RTL_LANGS.some((r) => l.startsWith(r));
}

export default i18n;
