import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  // Normaliza para o código primário (pt → pt-BR)
  const current =
    LANGUAGES.find((l) => i18n.language.startsWith(l.code))?.code ?? "pt-BR";

  return (
    <select
      value={current}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
      aria-label="Selecionar idioma"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
