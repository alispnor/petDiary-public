# Spec 10 — Internacionalização (i18n) no Frontend Web + Mobile

> Pedido do Ali em 2026-05-01: "verificar se frontend está com multi linguagem e mensagens de sucesso e erro está adaptado para multi línguas se ainda não deixa para depois".

---

## Idiomas suportados (decisão durável 2026-05-01)

Ordem de prioridade definida pelo Ali — implementar **na ordem listada**, parando se não der pra fazer todos:

| Prio | Código | Idioma | Direção | Notas |
|:---:|---|---|---|---|
| **1º** | `pt-br` | Português (Brasil) | LTR | **Default** + base de tradução |
| **2º** | `es` | Español | LTR | Latam — segundo mercado mais provável |
| **3º** | `pt-pt` | Português (Portugal) | LTR | Mesma língua, leve ajuste de termos (ex: cachorro→cão, geladeira→frigorífico) |
| **4º** | `en` | English | LTR | Internacionalização padrão |
| **5º** | `fr` | Français | LTR | Quando possível |
| **6º** | `ar` | العربية (Árabe) | **RTL** | **Idioma nativo do Ali** — exige tratamento especial |

### Princípios

- pt-BR é o **idioma fonte** (escrever primeiro nele, depois traduzir)
- Implementar **um idioma por vez** — pode parar em qualquer ponto se priorizar outras coisas
- pt-pt vs pt-br: usar arquivo separado `pt-PT.json` mas reaproveitar 80%+ das chaves; ajustar só termos divergentes
- Árabe (RTL) exige refatoração de **layout** (não só strings) — ver seção dedicada abaixo

> ⚠️ **Árabe é RTL (right-to-left)** — exige tratamento especial em CSS/layout (espelhamento de margins, padding, ícones, dropdowns). Ver seção "RTL" abaixo.

## Estado atual (verificado em 2026-05-01)

### ✅ Backend (Django) — i18n CONFIGURADO

**`settings.py`:**
```python
LANGUAGE_CODE = "pt-br"
USE_I18N = True
LANGUAGES = [
    ("pt-br", "Português (Brasil)"),
    ("es", "Español"),
    ("pt-pt", "Português (Portugal)"),
    ("en", "English"),
    ("fr", "Français"),
    ("ar", "العربية"),  # RTL
]
LOCALE_PATHS = [BASE_DIR / "locale"]
MIDDLEWARE = [..., "django.middleware.locale.LocaleMiddleware", ...]
```

- 29 ocorrências de `gettext_lazy` apenas em `accounts/models.py`
- Todos os models, serializers e views usam `_("...")` consistentemente
- ❌ **Faltam:** arquivos `.po` traduzidos para `en` e `es` + `.mo` compilados

### ❌ Web (React) — SEM i18n

- `package.json` não tem `i18next`/`react-i18next`/`react-intl`
- Strings hardcoded em pt-br espalhadas em todos os componentes
- Erros, sucessos, labels, placeholders, tudo em pt-br

### ❌ Mobile (Expo) — SEM i18n

- `package.json` não tem `i18n-js`/`expo-localization`/`react-i18next`
- Strings hardcoded em pt-br

---

## Plano em fases

### Fase L.1 — Backend: completar traduções existentes
- Gerar `.po` para todos os idiomas:
  ```bash
  docker compose exec api python manage.py makemessages -l es -l pt_PT -l en -l fr -l ar
  ```
- Traduzir strings em `locale/{en,es,ar}/LC_MESSAGES/django.po`
- Para árabe: tradutor humano nativo recomendado (Ali pode revisar pessoalmente — é nativo)
- Compilar:
  ```bash
  docker compose exec api python manage.py compilemessages
  ```
- Web/Mobile já enviam `Accept-Language: <lang>` — backend retorna mensagens traduzidas automaticamente

### Fase L.2 — Web: instalar i18next + estrutura de chaves
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

Estrutura:
```
src/i18n/
├── index.ts                   # init i18n
├── locales/
│   ├── pt-BR.json
│   ├── en.json
│   └── es.json
```

**`src/i18n/index.ts`:**
```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";

const RTL_LANGS = ["ar", "he", "fa", "ur"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
      ar: { translation: ar },
    },
    fallbackLng: "pt-BR",
    supportedLngs: ["pt-BR", "en", "es", "ar"],
    interpolation: { escapeValue: false },
  });

// Aplica direção RTL/LTR no <html dir="..."> sempre que idioma muda
function applyDir(lang: string) {
  const isRtl = RTL_LANGS.some((l) => lang.startsWith(l));
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}
applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;
```

**Chaves sugeridas (estrutura nesting):**
```json
{
  "common": { "save": "Salvar", "cancel": "Cancelar", "delete": "Excluir" },
  "auth": {
    "login": { "title": "PetDiary", "subtitle": "...", "submit": "Entrar" },
    "errors": {
      "invalid_credentials": "Usuário ou senha inválidos.",
      "generic": "Erro ao fazer login. Tente novamente."
    }
  },
  "tutor": { "dashboard": { "my_pets": "Meus Pets", "new_pet": "+ Novo Pet" } },
  "vet": { ... },
  "validation": {
    "required": "Campo obrigatório",
    "email_invalid": "E-mail inválido",
    "min_chars": "Mínimo {{count}} caracteres"
  },
  "success": {
    "pin_generated": "PIN gerado com sucesso",
    "password_changed": "Senha alterada com sucesso",
    "pet_created": "Pet cadastrado",
    "vet_revoked": "Acesso revogado"
  },
  "errors": {
    "load_pets": "Não foi possível carregar seus pets",
    "create_pet": "Erro ao criar pet",
    "generate_pin": "Erro ao gerar PIN",
    "revoke_access": "Erro ao revogar acesso"
  }
}
```

### Fase L.3 — Web: refatorar componentes para usar `useTranslation`
```tsx
import { useTranslation } from "react-i18next";

function Login() {
  const { t } = useTranslation();
  // ...
  setError(t("auth.errors.invalid_credentials"));
  // ...
  return <button>{t("auth.login.submit")}</button>;
}
```

Trocar **TODAS** as strings hardcoded:
- `Login.tsx`, `Register.tsx`, `ChangePassword.tsx`
- `TutorDashboard.tsx`, `VetEntry.tsx`, `ClinicalView.tsx`
- `VetAccessSection.tsx`, `AccessHistorySidebar.tsx`, `PinInput.tsx`, `RevokedModal.tsx`
- Validation messages, loading states, alerts, modal content

### Fase L.4 — Web: seletor de idioma na UI
- Header dropdown 🌐 com 6 opções (na ordem de prioridade):
  - 🇧🇷 Português (Brasil) — default
  - 🇪🇸 Español
  - 🇵🇹 Português (Portugal)
  - 🇺🇸 English
  - 🇫🇷 Français
  - 🇸🇦 العربية (Árabe — RTL)
- Persiste escolha em `localStorage` (i18next-browser-languagedetector já faz)
- Também envia no `Accept-Language` header (atualizar `services/api.ts`)
- Ao escolher árabe, layout vira RTL automaticamente (via `applyDir`)

### Fase L.4.1 — Web: suporte RTL (árabe)
> ⚠️ Crítico para o Ali (idioma nativo). Layout precisa ser espelhado.

- Tailwind v4: já oferece variantes `rtl:` e `ltr:` nativas
- Trocar classes posicionais:
  ```tsx
  // ANTES (LTR-only):
  <div className="ml-4 pl-2">
  // DEPOIS (RTL-aware):
  <div className="ms-4 ps-2">  // ms = margin-start, ps = padding-start
  ```
- Ícones direcionais: setas voltadas pra direita devem espelhar
  ```tsx
  <span className="rtl:scale-x-[-1]">→</span>
  ```
- Componente `<PinInput>`: ordem dos dígitos NÃO inverte (números são LTR mesmo em árabe)
- Datas e horários: usar `Intl.DateTimeFormat(locale)` que já formata correto
- Testar em todas as telas:
  - Login / Register / ChangePassword
  - TutorDashboard (cards, modais, sidebar)
  - VetEntry (sidebar de histórico)
  - ClinicalView (timeline, form de nota)
  - VetAccessSection (collapse + modais)

### Fase L.5 — Mobile: estrutura paralela (incluindo RTL)
```bash
npx expo install expo-localization
npm install i18n-js  # ou usar mesmo react-i18next
```

Auto-detectar idioma do device:
```ts
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import i18n from "i18n-js";

const locale = Localization.locale.toLowerCase();
const lang = locale.startsWith("pt") ? "pt-BR" :
             locale.startsWith("es") ? "es" :
             locale.startsWith("ar") ? "ar" : "en";

i18n.locale = lang;

// RTL: precisa de RELOAD do app pra aplicar (limitação do React Native)
const isRtl = lang === "ar";
if (I18nManager.isRTL !== isRtl) {
  I18nManager.forceRTL(isRtl);
  // Em mudança manual via UI, mostrar modal "Reiniciando app..." e Updates.reloadAsync()
}
```

> Atenção mobile RTL: `react-native` precisa de **restart do app** quando idioma vira RTL pela primeira vez. Lib `expo-updates` ajuda (Updates.reloadAsync). Documentar essa UX peculiar.

### Fase L.6 — Mobile: refatorar componentes
- Mesmo processo do web; chaves em `src/i18n/locales/*.json`
- Idealmente **compartilhar** os JSONs entre web e mobile (pasta `shared/i18n/` no monorepo)

### Fase L.7 — Garantir mensagens de sucesso/erro padronizadas
- Criar wrapper `showSuccess(key)` / `showError(key)` que aceita chaves i18n
- Toast lib (mobile: `react-native-toast-message`; web: `sonner` ou similar)
- Todas as chamadas API gerenciam mensagens via essas helpers

### Fase L.8 — Validar consistência
- Script `i18n:lint` que detecta:
  - Chaves em pt-BR.json não usadas no código
  - Chaves usadas no código não traduzidas
  - Diferenças entre os 3 idiomas
- Pre-commit hook opcional

---

## Decisões pendentes

- [ ] Usar `react-i18next` em ambos (web + mobile) ou específicos de cada (i18n-js)?
- [ ] **Pluralização** (singular vs plural) será necessária? — i18next suporta `count`
- [ ] Compartilhar arquivos JSON entre web e mobile via symlink ou copy?
- [ ] Idioma default vem do device, do backend, ou do header?
- [ ] **Tradução automática** com IA (ChatGPT) para o pt-BR servir como fonte? Ou tradutor humano profissional?
- [x] ~~Idiomas suportados?~~ → **DECIDIDO 2026-05-01 com ordem de prioridade:** pt-BR (default) → es → pt-PT → en → fr → ar (RTL)
- [ ] Para árabe: Ali revisa pessoalmente as traduções? (recomendado — é nativo)
- [ ] Mobile RTL: forçar reload do app na primeira vez (UX peculiar do React Native)?

## Considerações adicionais para árabe

- **Fonte:** Nunito não tem glifos árabes ideais. Considerar:
  - **Cairo** (Google Fonts) — ótima legibilidade árabe
  - **Tajawal** (Google Fonts) — alternativa
  - Manter Nunito para pt-BR/en/es; carregar Cairo só quando `lang === "ar"`
- **Numerais:** decidir entre algarismos arábicos ocidentais (1234) ou indo-arábicos (١٢٣٤). Recomendo manter ocidentais (mais universais; é o padrão até em apps em árabe modernos)
- **Datas:** `Intl.DateTimeFormat("ar-SA")` retorna calendário islâmico por default — usar `calendar: "gregory"` para gregoriano
- **Pluralização árabe:** tem 6 formas (zero, um, dois, poucos, muitos, outro) — i18next lida automaticamente

## Encaixe no roadmap

- **Pode rodar a qualquer momento** — não bloqueia outras fases
- **Importante antes da etapa final** se for publicar nas lojas em mais de um idioma
- Se foco é só BR no MVP → **pode adiar** após produção
