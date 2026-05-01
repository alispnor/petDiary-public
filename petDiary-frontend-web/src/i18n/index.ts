/**
 * Configuração de internacionalização do PetDiary web.
 *
 * Idiomas atuais (decisão durável Ali, ordem de prioridade):
 * 1º pt-BR (default + idioma fonte)
 * 2º es
 * 3º en
 *
 * Pendentes (Spec 10): pt-PT, fr, ar (RTL)
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import ptPT from "./locales/pt-PT.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

const RTL_LANGS = ["ar", "he", "fa", "ur"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      "pt": { translation: ptBR },
      "pt-PT": { translation: ptPT },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: "pt-BR",
    supportedLngs: ["pt-BR", "pt", "pt-PT", "en", "es", "fr", "ar"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "petdiary-language",
    },
  });

function applyDir(lang: string) {
  const isRtl = RTL_LANGS.some((l) => lang.startsWith(l));
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;

/** Lista para o dropdown de seleção de idioma. */
export const LANGUAGES = [
  { code: "pt-BR", label: "🇧🇷 Português (Brasil)" },
  { code: "pt-PT", label: "🇵🇹 Português (Portugal)" },
  { code: "en", label: "🇺🇸 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "ar", label: "🇸🇦 العربية" },
] as const;
