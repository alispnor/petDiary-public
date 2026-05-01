# 📋 Pendências Ordenadas — petDiary

> **Objetivo:** lista única e ordenada de tudo que falta fazer, dividida
> em fases atômicas. Cada item tem escopo curto, definição de pronto
> ("DoD") e dependências. Executar **uma por vez, em ordem**, commit
> ao fim de cada uma.
>
> **Como usar:** abra a próxima fase pendente, leia os arquivos
> referenciados, execute, marque `[x]`, commit, atualize PROGRESSO.md,
> próximo item.
>
> Última atualização: **2026-05-01** (após Spec 17 Fase 5a + 5c).

---

## 🟢 PRIORIDADE A — Fechar features iniciadas

### A1. Spec 17 Fase 5d — Notificações no WEB
- [ ] Service worker `petDiary-frontend-web/public/sw.js` (push handler
      + notificationclick com deep link)
- [ ] `services/notifications.ts` web: `registerWebPush()` que pede
      permissão, faz subscribe via PushManager, POST devices/register
      com platform=web
- [ ] Página `/notifications` (lista + mark-read + delete + clear-all)
- [ ] Página `/conta` ganha seção "Preferências de notificação" (7
      toggles) + botão "Ativar no navegador"
- [ ] Componente `<NotificationsBell />` reusável com badge unread
- [ ] Header de TutorDashboard, VetEntry e AdminLayout exibem
      `<NotificationsBell />`
- [ ] Pós-login (App.tsx): chama `registerWebPush()` (não bloqueante)

**DoD:** abrir `/notifications` no Chrome, ver lista, marcar lida,
excluir, limpar tudo. Toggle on/off em /conta persiste. Badge atualiza.

**Dependência:** Backend já pronto (Fase 5a). VAPID keys: usa string
vazia em DEV (mock service no backend); chaves reais ficam em
PENDENCIAS-HUMANAS.md item 14 (produção).

**Spec:** `ai-memory/specs/17-notificacoes-mobile-push-preferencias.md`
seção "Fase 5d — Web"

---

### A2. Spec 17 Fase 5b — Lembretes (Reminder) automáticos
- [ ] Modelo `Reminder` (pet, type, title, description, date_due,
      notified_at, dismissed_at) + migrations
- [ ] Endpoints CRUD: GET/POST `/pets/<id>/reminders/`,
      POST `/reminders/<id>/dismiss/`, DELETE
- [ ] Task Celery `check_reminders_task` (beat 1x/dia) que dispara
      notify() para reminders com `date_due <= now+7 dias` e
      `notified_at IS NULL`
- [ ] Web: form de criar reminder em ClinicalView (campo opcional ao
      criar HealthRecord ou seção própria)
- [ ] Mobile: form de criar reminder em PetDashboard ou no
      RecordFormModal (toggle "Lembrar em N dias")

**DoD:** criar reminder com date_due = hoje+5d, rodar task em modo
eager → notif "VACCINE" cai no /notifications/ do tutor.

---

## 🟢 PRIORIDADE B — Internacionalização (i18n)

### B1. Adicionar pt-PT e fr ao web (locale JSON novos)
- [ ] `frontend-web/src/i18n/locales/pt-PT.json` (cópia de pt-BR
      revisada com particularidades de Portugal: "telemóvel" vs
      "celular", "ecrã" vs "tela", "registar" vs "registrar")
- [ ] `frontend-web/src/i18n/locales/fr.json`
- [ ] Atualizar `i18n/index.ts` resources + supportedLngs + LANGUAGES
- [ ] Adicionar dropdown options no LanguageSwitcher

**DoD:** trocar idioma → telas Login/Register/TutorDashboard mostram
strings traduzidas. Testar via curl na backend (Accept-Language) e
visualmente no browser.

---

### B2. Adicionar ar (árabe + RTL) ao web
- [ ] `frontend-web/src/i18n/locales/ar.json`
- [ ] Atualizar `i18n/index.ts` (`applyDir()` já tem suporte RTL)
- [ ] **Auditoria visual em RTL:**
  - [ ] Login, Register, ForgotPassword, ResetPassword,
        ChangePassword
  - [ ] TutorDashboard (header invertido, cards de pets, modais)
  - [ ] VetEntry + AccessHistorySidebar (sidebar deve ficar à
        direita)
  - [ ] ClinicalView (timeline + aside)
  - [ ] AdminLayout (sidebar deve ficar à direita)
  - [ ] AccountSettings
  - [ ] Notifications (Fase 5d)
- [ ] Setas de "voltar" → invertem para "avançar visualmente" (não
      é necessário — manter ←)
- [ ] Testar paddings/margens com classes Tailwind logical
      properties (ms-/me- em vez de ml-/mr-)

**DoD:** trocar idioma para árabe → todo layout flippa. Sem
sobreposições nem cortes.

---

### B3. Instalar react-i18next no mobile + locales pt-BR
- [ ] `npm install i18next react-i18next i18next-browser-languagedetector`
      (ou expo-localization para detection)
- [ ] `mobile/src/i18n/index.ts` configurado
- [ ] Criar `locales/pt-BR.json` com TODAS as chaves dos textos
      hardcoded das telas atuais (Login, Register, HomeTutor,
      PetDashboard, AccountSettings, etc.)
- [ ] Substituir todos `<Text>"texto"</Text>` por
      `<Text>{t("chave")}</Text>`
- [ ] LanguageSwitcher passa a mudar `i18n.language` E `Accept-Language`

**DoD:** trocar idioma no LanguageSwitcher mobile → nada muda
visualmente AINDA (só pt-BR existe), mas a infraestrutura está pronta.

---

### B4. Adicionar pt-PT, en, es, fr, ar locales no mobile
- [ ] Criar 5 locales JSON (cópias de pt-BR revisadas)
- [ ] Atualizar `i18n/index.ts` resources
- [ ] Para árabe: usar `I18nManager.forceRTL(true)` ao trocar idioma
      e mostrar prompt de "reiniciar app" (RN exige reload pra RTL)
- [ ] Testar layout em árabe (`I18nManager.isRTL` flippa flexbox)

**DoD:** trocar idioma no LanguageSwitcher mobile → labels mudam.
Trocar para árabe → app pede pra reiniciar e abre em RTL.

---

## 🟢 PRIORIDADE C — Paridade restante mobile↔web

### C1. Editar pet (mobile)
- [ ] Botão "Editar" no PetDashboard mobile
- [ ] PetFormModal aceita `mode = "create" | "edit"` + pet existente
- [ ] PUT `/pets/<id>/`

### C2. Editar HealthRecord (mobile)
- [ ] Botão "Editar" no expandable do record
- [ ] RecordFormModal aceita modo edit
- [ ] PUT `/pets/<id>/health-records/<rid>/`

### C3. Excluir pet/record (mobile)
- [ ] Long-press ou botão dedicado com confirmação
- [ ] DELETE endpoints

### C4. Audit timeline (mobile)
- [ ] Tela `PetAudit` (lista de `/pets/<id>/audit/`)
- [ ] Tab no PetDashboard ("📋 Histórico" / "📜 Alterações")

### C5. FAQ web + tickets de suporte real (paridade com mobile)
- [ ] Página `/help` no web com mesmo FAQ accordion do mobile
- [ ] Backend: app `support/` com modelo SupportTicket + endpoints
      (admin_panel hoje é stub)
- [ ] Form de contato no web/mobile usa `POST /support/tickets/`

---

## 🟡 PRIORIDADE D — Qualidade & Testes

### D1. Spec 16 — Smoke tests pytest E2E
Já salva em `ai-memory/specs/16-suite-smoke-tests-core-pytest.md`.

- [ ] `pytest` + `pytest-django` no requirements-dev
- [ ] `tests/test_smoke_core.py` com 5 fluxos:
  - [ ] test_user_authentication
  - [ ] test_tutor_generates_pin
  - [ ] test_vet_claims_pin
  - [ ] test_vet_access_revoked
  - [ ] test_create_health_record
- [ ] CI GitHub Actions rodando o pytest

---

### D2. Spec 14 — Audit segurança + performance backend
Já salva em `ai-memory/specs/14-auditoria-seguranca-performance-backend.md`.

- [ ] JWT lifetime + rotation review
- [ ] File upload validation (MIME real, magic bytes)
- [ ] IDOR review em todos endpoints com `<id>`
- [ ] N+1 audit (select_related/prefetch) no PetViewSet,
      HealthRecordViewSet, NotificationListView
- [ ] db_index em pet_id, date_occurred, etc.

---

### D3. Spec 15 — Audit performance frontend
Já salva em `ai-memory/specs/15-auditoria-performance-frontend.md`.

- [ ] Lighthouse no web (TutorDashboard, ClinicalView)
- [ ] Bundle size analysis Vite
- [ ] React Native: lista virtualizada (FlatList já OK), evitar re-render
      do header

---

## 🔵 PRIORIDADE E — Integrações reais (depois de credenciais)

> Todos esperam credenciais externas. Mock-first ativo até lá.

### E1. AsaasGateway real (Spec 01)
Depende de PENDENCIAS-HUMANAS item 5.

### E2. OpenAIService real (Spec 04)
Depende de PENDENCIAS-HUMANAS item 6.

### E3. ResendEmailService real (Spec 04)
Depende de PENDENCIAS-HUMANAS item 7.

### E4. S3StorageBackend real (Spec 04)
Depende de PENDENCIAS-HUMANAS item 8.

### E5. Sentry SDK (web + mobile + backend)
Depende de PENDENCIAS-HUMANAS item 9.

### E6. Web Push real (Spec 17)
Depende de PENDENCIAS-HUMANAS item 14 (VAPID keys).

---

## ⚪ PRIORIDADE F — Pré-produção (decisão humana)

Tudo em `PENDENCIAS-HUMANAS.md`:
- Domínio (item 1)
- Hospedagem (item 2)
- DNS (item 3)
- Deploy homolog (item 4)
- LGPD: política privacidade + termos (item 13)
- App stores (item 11-12)

---

## 📊 Como decidir o que fazer agora

**Pergunta:** quer terminar o que começou, ou abrir uma frente nova?

| Cenário | Próxima fase |
|---|---|
| Terminar Spec 17 (notificações) | A1 (web) → A2 (lembretes) |
| Validar produto antes de tudo | D1 (smoke tests) |
| Internacionalizar | B1 → B2 → B3 → B4 |
| Polir mobile | C1 → C2 → C3 → C4 |
| Polir web | C5 |

**Recomendação atual:** A1 (Spec 17 Fase 5d — web) para fechar a feature
de notificações em ambos clientes. Depois A2 (lembretes) finaliza Spec 17
inteira. Em seguida, decidir entre i18n (B) ou paridade mobile (C).

---

## 🔁 Ritual ao completar uma fase

1. Marcar `[x]` aqui no PENDENCIAS-ORDENADAS.md
2. Atualizar `ai-memory/PROGRESSO.md` (entrada nova + status)
3. Atualizar `ai-memory/PARIDADE-MOBILE-WEB.md` se mudou paridade
4. Commitar com mensagem descritiva
5. `git push origin master`
6. Reportar ao Ali e perguntar próximo passo
