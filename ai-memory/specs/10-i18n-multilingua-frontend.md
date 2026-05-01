# Spec 10 — Internacionalização (i18n) no Frontend Web + Mobile

> Pedido do Ali em 2026-05-01: "verificar se frontend está com multi linguagem e mensagens de sucesso e erro está adaptado para multi línguas se ainda não deixa para depois".

---

## Estado atual (verificado em 2026-05-01)

### ✅ Backend (Django) — i18n CONFIGURADO

**`settings.py`:**
```python
LANGUAGE_CODE = "pt-br"
USE_I18N = True
LANGUAGES = [("pt-br", "Português (Brasil)"), ("en", "English"), ("es", "Español")]
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
- Gerar `.po` para `en` e `es`:
  ```bash
  docker compose exec api python manage.py makemessages -l en -l es
  ```
- Traduzir strings em `locale/en/LC_MESSAGES/django.po` e `locale/es/...`
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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "pt-BR",
    interpolation: { escapeValue: false },
  });

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
- Header dropdown 🌐 com 3 opções (pt-BR, en, es)
- Persiste escolha em `localStorage` (i18next-browser-languagedetector já faz)
- Também envia no `Accept-Language` header (atualizar `services/api.ts`)

### Fase L.5 — Mobile: estrutura paralela
```bash
npx expo install expo-localization
npm install i18n-js  # ou usar mesmo react-i18next
```

Auto-detectar idioma do device:
```ts
import * as Localization from "expo-localization";
import i18n from "i18n-js";

i18n.locale = Localization.locale.startsWith("pt") ? "pt-BR" :
              Localization.locale.startsWith("es") ? "es" : "en";
```

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

## Encaixe no roadmap

- **Pode rodar a qualquer momento** — não bloqueia outras fases
- **Importante antes da etapa final** se for publicar nas lojas em mais de um idioma
- Se foco é só BR no MVP → **pode adiar** após produção
