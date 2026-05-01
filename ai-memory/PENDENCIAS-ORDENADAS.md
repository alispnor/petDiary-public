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

### A1. Spec 17 Fase 5d — Notificações no WEB ✅ (commit `13bfbb9`)
- [x] Service worker `petDiary-frontend-web/public/sw.js`
- [x] `services/notifications.ts` web com `registerWebPush()`
- [x] Página `/notifications`
- [x] Aba "🔔 Notificações" em /conta (7 toggles + ativar push)
- [x] Componente `<NotificationsBell />`
- [x] Plugado em TutorDashboard, VetEntry, AdminLayout
- [x] App.tsx: registerWebPush silencioso pós-login se já granted
- [x] i18n pt-BR/en/es
- [x] PARIDADE-MOBILE-WEB seção 12 atualizada

---

### A2. Spec 17 Fase 5b — Lembretes (Reminder) automáticos ✅ (commit `8f32860`)
- [x] Modelo Reminder + migrations
- [x] Endpoints CRUD + dismiss
- [x] Task Celery `check_reminders_task` (beat 1x/dia)
- [x] Web: `<RemindersSection />` no TutorDashboard
- [x] Mobile: `<RemindersModal />` no PetDashboard
- [x] Validação E2E (criar → task eager → notif gerada → dismiss →
      task de novo não re-notifica → delete)

🎯 **Spec 17 inteira fechada** (Fases 5a + 5b + 5c + 5d).

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

### B3.1. Infra i18n mobile + auth + telas principais ✅ (entregue)
- [x] `npm install i18next react-i18next expo-localization`
- [x] `src/i18n/index.ts` (init + 6 locales registrados — todos
      apontando para pt-BR.json até B4)
- [x] `src/i18n/locales/pt-BR.json` com namespaces completos: common,
      auth, home, pet, records, attachments, vets, members, reminders,
      notifications, account, subscription, help, preferences,
      username_check
- [x] `App.tsx` importa `./src/i18n` no boot
- [x] LanguageSwitcher: 6 idiomas + chama `i18n.changeLanguage`
- [x] `AppNavigator` reaplica idioma persistido após hidratação
- [x] Migrados: Login, Register, ForgotPassword, HomeTutor, PetDashboard
- [x] Tipo `Language` expandido para 6 códigos

### B3.2. Migrar componentes restantes mobile ✅ (commit `92da306`)
- [x] AccountSettings, SubscriptionDashboard, HelpCenter
- [x] Notifications, NotificationPreferences
- [x] 7 modais/componentes (Pet, Record, Vet, Members, Reminders,
      Attachments, LanguageSwitcher)
- [x] pt-BR.json estendido com `subscription.benefit_*`,
      `help.faq_q1..q7` + `help.faq_a1..a7`, e demais chaves
- [x] Pluralização de "em X dias" via `{{count}}` (pronto pra outras
      línguas usarem regras nativas)

🎯 **B3 inteiro concluído** (B3.1 commit `6433d1c` + B3.2 commit
`92da306`). Mobile 100% i18n-ready em pt-BR.

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

### C6. Spec 18 — Admin completo + Suporte real (pedido Ali 2026-05-01)
- [ ] Backend: app `support/` com SupportTicket + TicketMessage
- [ ] Endpoints CRUD + chat + filtros + assignment
- [ ] Hooks notify: abre/responde/resolve dispara notif
- [ ] Web `/admin/tickets` real (substitui stub) + `/admin/tickets/<id>`
      com chat split
- [ ] Web `/help` com FAQ + abrir ticket + meus tickets + chat
- [ ] Mobile: admin read-only (KPIs + lista tickets); edit redireciona
      para web
- [ ] Mobile HelpCenter ganha aba "💬 Meus tickets" + form + chat
- [ ] Auditoria: toda ação admin gera AuditLog
- [ ] Throttling reforçado em login para role=ADMIN (5/min)
- [ ] (Opcional) 2FA para admin

**Spec:** `ai-memory/specs/18-admin-completo-suporte-real.md`
**Inclui:** decisão durável de "login admin é o mesmo /login universal"
(não criar URL dedicada). Troca de senha já funciona em /conta.

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
