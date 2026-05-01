# 📊 PROGRESSO — petDiary

> **Arquivo vivo.** Atualize a cada sessão de trabalho.
> Última atualização: **2026-05-01 (sessão 9 — B3.1: infra i18n mobile + 5 telas migradas + Spec 18 admin/suporte salva)**

---

## 🎯 Objetivo do Projeto

**petDiary** é uma plataforma unificada para resolver a fragmentação dos dados de saúde de animais de estimação.

Nasce como **Prontuário Médico Inteligente** (Fase 1) e evolui para **Rede Social Nichada e Segura** (Fase 3).

**Dois usuários:**
- **Tutor** (app mobile) — registra vacinas/exames, fotografa receitas, gera PIN para o vet
- **Veterinário** (portal web) — usa PIN temporário para ver prontuário completo, adiciona notas clínicas

**Mecanismo central:** PIN de 6 dígitos com prazo de validade, revogável a qualquer momento pelo tutor.

**Fase atual:** 🟡 Fase 1 — MVP Clínico

---

## 📈 Status geral (% estimada)

| Camada | Antes (24/04) | Sessão 3 (01/05) | Sessão 4 (01/05) | Meta Fase 1 |
|---|---|---|---|---|
| Backend (Django) | 70% | 85% | **100%** ✨ | 100% |
| Mobile (Expo) | 30% | 35% | **90%** ✨ | 100% |
| Web (React) | 35% | 80% | **100%** ✨ | 100% |
| Infra/DX | 40% | 90% | **100%** ✨ | 100% |
| **Cobertura E2E (backend)** | **0%** | **100%** | **100%** | 100% |
| **Cobertura E2E (web ↔ back)** | **0%** | **100%** | **100%** | 100% |
| **Async (Celery+Redis)** | — | — | **100%** ✨ | 100% |
| **Observabilidade (logs+health)** | — | parcial | **100%** ✨ | 100% |

---

## ✅ O QUE JÁ FOI FEITO

### Backend (Django + DRF + Postgres)
- [x] Estrutura Django com 4 apps: `accounts`, `pets`, `health`, `access`
- [x] Modelos: `User` (TUTOR/VET), `Pet`, `HealthRecord`, `VetAccessToken`
- [x] JWT (SimpleJWT) — login, refresh, register
- [x] CRUD `/pets/` com permissão `IsTutorOrHasVetAccess`
- [x] CRUD `/pets/<id>/health-records/`
- [x] Geração e claim de PIN
- [x] Endpoint mock S3 `upload-url/`
- [x] i18n configurado (pt-br, en, es)
- [x] Swagger UI + ReDoc
- [x] Migrações iniciais geradas
- [x] **`django-cors-headers` adicionado** ✨ _(01/05)_
- [x] **Validação E2E real do backend via curl** ✨ _(01/05)_ — login tutor → cria pet → gera PIN → vet faz claim → vet vê pet (todos OK)
- [x] **Usuários de seed criados** ✨ _(01/05)_ — `ana/ana123456` (TUTOR) e `dra-camila/vet123456` (VET com CRMV)
- [x] **Bug #7 resolvido:** `expires_at` default = now+1h se cliente não enviar ✨ _(01/05)_
- [x] **HealthRecord ViewSet:** `pet` agora vem da URL aninhada (não exige no body) ✨ _(01/05)_

### Mobile (React Native + Expo)
- [x] Expo SDK 54 + RN 0.81 + TypeScript
- [x] React Navigation (stack: HomeTutor → PetDashboard)
- [x] Zustand + AsyncStorage (persist)
- [x] Axios com interceptors (token + Accept-Language + 401→logout)
- [x] Bottom Sheet (`@gorhom/bottom-sheet`)
- [x] Mocks de Expo (image-picker, image-manipulator, av) para dev em container
- [x] Telas `HomeTutor` e `PetDashboard` com UI completa (porém com dados mockados)
- [x] Função `handleDocumentCapture` (fluxo de upload mockado)
- [x] **Assets gerados (icon, adaptive-icon, splash, favicon)** ✨ _(01/05)_
- [x] **Theme TS com paleta oficial (`src/theme/index.ts`)** ✨ _(01/05)_

### Web (React + Vite + Tailwind 4)
- [x] React 19 + Vite 6 + TypeScript + Tailwind 4
- [x] Zustand + React Router 7
- [x] Axios com interceptors (token + 403→revogação)
- [x] Telas `VetDashboard` (`/`) e `ClinicalView` (`/clinical/:pin`)
- [x] Componentes: `PinInput`, `Timeline`, `NoteForm`, `PetHeader`, `RecentAccessList`, `RevokedModal`
- [x] **Favicon, apple-touch-icon, manifest PWA** ✨ _(01/05)_
- [x] **`global.css` com paleta oficial (Nunito + tokens CSS + Tailwind v4)** ✨ _(01/05)_
- [x] **Tela `/login` universal (TUTOR + VET, descobre role via `/users/me/`)** ✨ _(01/05)_
- [x] **Tela `/register` (cadastro de tutor ou vet, com CRMV condicional)** ✨ _(01/05)_
- [x] **Tela `/tutor` (TutorDashboard):** lista pets, form criar pet, botão gerar PIN com modal de exibição + copiar ✨ _(01/05)_
- [x] **Tela `/vet` (VetEntry):** entrada de PIN com payload correto `{access_code}` ✨ _(01/05)_
- [x] **Tela `/clinical/:petId`:** prontuário real com timeline de `health-records` + form para adicionar registro ✨ _(01/05)_
- [x] **AuthStore com `persist` (localStorage) + role + redireciono inteligente** ✨ _(01/05)_
- [x] **Roteamento com `RequireAuth`** (token + role guard) ✨ _(01/05)_
- [x] **Bugs #1 e #2 resolvidos:** payload do claim corrigido, store-mock removido, simulate-revoke removido ✨ _(01/05)_
- [x] **Logo atualizado pelo Ali (2048×2048) — todos assets regerados** ✨ _(01/05)_

### Infra / DX
- [x] Dockerfiles para api, mobile, web
- [x] **Docker Compose UNIFICADO na raiz com perfis local/mobile/dev/hom/prod** ✨ _(01/05)_
- [x] **`.env.local` e `.env.dev` consolidados na raiz** ✨ _(01/05)_
- [x] **Pasta `ai-memory/` com 11 arquivos de contexto** ✨ _(01/05)_
- [x] **Script `generate-icons.py` para regenerar todos os assets** ✨ _(01/05)_
- [x] **Stack validada:** db (healthy) + api (Django check OK, 23 migrations OK) + web (Vite serve OK, assets servidos OK) ✨ _(01/05)_
- [x] **CORS testado via preflight OPTIONS** — `Access-Control-Allow-Origin: http://localhost:5173` retornado ✨ _(01/05)_

---

## ❌ O QUE FALTA FAZER

> Ordem: do mais bloqueante para o menos. **Faça em sequência.**

### 🚨 Etapa 0 — Estabilização (BLOQUEADORES — fazer antes de qualquer feature)

- [x] ~~Adicionar `django-cors-headers`~~ ✅ 01/05
- [x] ~~Criar usuários de seed~~ ✅ 01/05 (via shell)
- [x] ~~Testar `docker compose up` end-to-end~~ ✅ 01/05
- [x] ~~Corrigir payload do claim (bug #1)~~ ✅ 01/05
- [x] ~~Definir `expires_at` default (bug #7)~~ ✅ 01/05
- [ ] Padronizar `EXPO_PUBLIC_API_URL` para incluir `/api/v1` _(bug #10)_
- [ ] Transformar seed em **data migration** (idempotente, fica versionado no git)

### 🟡 Etapa 1 — Fluxo E2E mínimo (PROVAR O PRODUTO)

#### Backend
- [ ] Validar role no register (`crmv` obrigatório se `role=VET`)

#### Mobile (Tutor)
- [ ] Tela de **Login** (POST `/auth/token/`)
- [ ] Tela de **Cadastro** (POST `/auth/register/`)
- [ ] Substituir `MOCK_PETS` em `HomeTutor` por `GET /pets/`
- [ ] Form de **criar pet** (POST `/pets/`)
- [ ] Substituir `MOCK_TIMELINE` em `PetDashboard` por `GET /pets/<id>/health-records/`
- [ ] Substituir `Math.random()` do botão "Gerar PIN" por `POST /access/generate-pin/`
- [ ] Botão "Compartilhar PIN" (linkar `whatsapp://send?text=...`)

#### Web (Veterinário)
- [ ] Tela de **Login do Vet** (com guard nas rotas)
- [ ] Tela de **Cadastro do Vet** (com CRMV)
- [ ] Após `claim`, buscar pets via `GET /pets/` (vet recebe os autorizados)
- [ ] Substituir `MOCK_PET` no `clinicalStore` por busca real
- [ ] Substituir `MOCK_TIMELINE` por `GET /pets/<id>/health-records/`
- [ ] `addNote` deve fazer `POST /pets/<id>/health-records/` (record_type=NOTE)
- [ ] Refetch da timeline após criar nota

**🎯 Marco da Etapa 1:** demo funcional ponta-a-ponta. Tutor cria pet → gera PIN → vet acessa → vê dados → adiciona nota.

### 🟢 Etapa 2 — Polimento e robustez

#### Backend
- [ ] Estender `Pet`: `birth_date` (Date) + `avatar` (URL)
- [ ] Endpoint `POST /access/<id>/revoke/` (tutor revoga PIN)
- [ ] Endpoint `GET /access/active/` (tutor lista PINs ativos)
- [ ] Endpoint `GET /access/recent/` (vet lista acessos recentes)
- [ ] Validação de unicidade de `access_code` ativo (loop retry)
- [ ] Throttling em `/auth/token/` e `/access/claim/` (anti-bruteforce)

#### Mobile
- [ ] Tela "Acessos ativos" (lista PINs por pet, botão revogar)
- [ ] Form de adicionar registro manual (NOTE/VACCINE/etc)
- [ ] Atualizar form criar pet com `birth_date` + upload de avatar
- [ ] Estados de loading/erro consistentes (toast/banner)
- [ ] Logout no header

#### Web
- [ ] Substituir `MOCK_HISTORY` na sidebar por `GET /access/recent/`
- [ ] Decidir destino do botão "Simular Revogação de PIN" _(bug #2)_
- [ ] Adicionar `persist` no `authStore` (sessão sobrevive a F5)

#### Cross
- [ ] **Migrar UI antiga para tokens oficiais** (ver tabela em `10-identidade-visual.md`)
- [ ] Carregar fonte Nunito no mobile (`@expo-google-fonts/nunito`)

### 🔵 Etapa 3 — IA aplicada (Fase 1 do roadmap, parte IA)

- [ ] Bucket S3 + IAM minimal
- [ ] Backend: trocar mock por boto3 + presigned URL real
- [ ] Mobile: corrigir paths em `handleDocumentCapture` _(bug #3)_
- [ ] Endpoint `POST /pets/<id>/health-records/process/` (dispara Textract)
- [ ] Backend: pega arquivo do S3, chama AWS Textract, salva em `raw_extracted_text`
- [ ] Auto-preenche `title`/`description` do registro com OCR
- [ ] Tela mobile de gravação de áudio (expo-av)
- [ ] Endpoint de transcrição (AWS Transcribe ou Whisper)
- [ ] Cria HealthRecord automaticamente com transcrição

### 🟣 Etapa 4 — Pronto para usuário real

- [ ] Cobertura mínima de testes (pytest backend, smoke front)
- [ ] Erros amigáveis em pt-br
- [ ] Termos de uso + política de privacidade
- [ ] LGPD: endpoint para tutor exportar/excluir dados
- [ ] EAS Build do mobile
- [ ] Deploy backend (decidir: Fly.io / Railway / AWS ECS?)
- [ ] Deploy web (Vercel / Netlify)
- [ ] HTTPS em produção (Caddy já está no compose com profile)
- [ ] Sentry nas 3 camadas

---

## 🐛 Bugs conhecidos (ver `04-bugs-e-inconsistencias.md` para detalhes)

| # | Bug | Status |
|---|---|---|
| 1 | Web envia `{pin}`, backend espera `{access_code}` | ✅ resolvido 01/05 |
| 2 | Endpoint `/access/simulate-revoke/` não existe | ✅ resolvido 01/05 (removido) |
| 3 | Mobile chama endpoints inexistentes em `handleDocumentCapture` | ✅ resolvido 01/05 (mobile real) |
| 4 | Botão "Gerar PIN" mobile usa `Math.random()` | ✅ resolvido 01/05 (mobile real) |
| 5 | Sem CORS no backend | ✅ resolvido 01/05 |
| 6 | PIN pode colidir (sem unique constraint) | 🟡 mitigado (retry no model) |
| 7 | `expires_at` obrigatório mas mobile não envia | ✅ resolvido 01/05 |
| 8 | Permissão retorna 404 em vez de 403 | 🟡 a decidir |
| 9 | URL base do mobile aponta `http://api:8000` (só Docker) | ✅ resolvido (EXPO_PUBLIC_API_URL com HOST_IP) |
| 10 | `EXPO_PUBLIC_API_URL` não inclui `/api/v1` | ✅ resolvido 01/05 |
| 11 | Sem rate limit em endpoints sensíveis | ✅ resolvido 01/05 (Fase G — ScopedRateThrottle) |
| 12 | Sem healthcheck/observabilidade | ✅ resolvido 01/05 (Fase G — /livez, /healthz) |

---

## 📅 Histórico de sessões

### 2026-05-01 — Sessão fundadora (Ali + Claude)
- Análise completa de backend/mobile/web
- Criação da pasta `ai-memory/` com 11 arquivos de contexto
- Identificação de 10 bugs/inconsistências
- Plano de ação em 4 etapas
- **Docker Compose unificado** na raiz com perfis (local/mobile/dev/hom/prod)
- **Envs consolidados** (`.env.local`, `.env.dev`)
- **CORS resolvido** (django-cors-headers + settings)
- **Identidade visual:** script de geração de ícones, todos os assets de mobile/web/exports gerados a partir de `petDiaryLogo.png`
- **Design System base:** `global.css` (web) + `theme/index.ts` (mobile) com paleta oficial (Nunito, brand teal/orange, surfaces neumórficas, raios e sombras)

### 2026-05-01 — Sessão 1.1 (validação de estrutura)
- ✅ Build de API e Web OK (sem erros)
- ✅ `db` (postgres:15-alpine) sobe healthy em 13s
- ✅ `api` (Django 5.2.13) inicia, migrations OK (23 aplicadas), system check sem erros
- ✅ `web` (Vite 6.4.2) serve em 250ms; favicon + manifest + logos retornam HTTP 200
- ✅ CORS preflight responde com `Access-Control-Allow-Origin: http://localhost:5173`
- ✅ **Fluxo PIN E2E provado via curl:**
  1. Tutor login → access token
  2. `GET /pets/` → retorna pet "Thor"
  3. Vet login → access token
  4. `POST /access/claim/ {access_code: "218798"}` → retorna token vinculado, `is_used=true`
  5. Vet `GET /pets/` → retorna pet autorizado
- 🎯 **Marco:** backend está pronto pra integração com os clientes. Agora os bugs restantes são todos do lado dos frontends (claim payload, URLs, mocks).

### 2026-05-01 — Sessão 1.2 (web do tutor + PIN funcional)
- ✅ **Backend:**
  - `GeneratePinView` → default `expires_at = now + 1h` (bug #7 fechado)
  - `HealthRecordSerializer` → `pet` virou read-only, ViewSet injeta da URL aninhada
- ✅ **Web — reescrito do zero o fluxo de páginas:**
  - `/login` — universal (TUTOR/VET), descobre role via `/users/me/`
  - `/register` — cadastro com toggle TUTOR/VET (CRMV condicional)
  - `/tutor` — `TutorDashboard` (listar/criar pet + gerar PIN com modal)
  - `/vet` — `VetEntry` (entrada de PIN, payload correto)
  - `/clinical/:petId` — prontuário real (busca pet + records, adiciona record)
- ✅ **Auth:** `authStore` com persist + role; `RequireAuth` guard com filtro por role
- ✅ **Limpeza:** removidos `clinicalStore` mock, `NoteForm`, `Timeline`, `PetHeader`, `RecentAccessList`, `VetDashboard` antigos
- ✅ **Logo:** Ali subiu nova versão 2048×2048; rodei `generate-icons.py` → todos os assets regerados
- ✅ **Validação E2E completa via curl** simulando o flow do web:
  1. Tutor `joao` se cadastra → 2. login → 3. /me retorna role TUTOR → 4. cria pet "Bidu" → 5. gera PIN sem `expires_at` (default funciona) → 6. Vet `drvet` se cadastra → 7. login → 8. usa PIN com `{access_code}` → 9. vê pet → 10. adiciona nota → 11. tutor vê a nota
- 🎯 **Marco:** Web está pronto para testar manualmente no browser

### 2026-05-01 — Sessão 1.3 (commits + push para origin)
- ✅ `.gitignore` criado (cobre envs, deps, builds, exports gerados, IDE)
- ✅ `.env.local`/`.env.dev` removidos do tracking (continham secrets dev)
- ✅ `.ai-pickup.md` removido do staging (uso local)
- ✅ Logo dark adicionado pelo Ali (`logotipo/petDiaryLogoDark.png`)
- ✅ `generate-icons.py` estendido para suportar variante dark opcional → gera `icon-dark`, `splash-dark`, `logo-dark-{192,512}` quando arquivo dark existe
- ✅ TutorDashboard ganhou botão "📋 Ver prontuário" linkando para `/clinical/<petId>` — fecha o ciclo do tutor
- ✅ **9 commits separados por fase** organizados e pushed para `origin/master`:
  1. `chore: add .gitignore for monorepo`
  2. `docs(ai-memory): add project knowledge base`
  3. `feat(infra): unified docker compose at root with profiles`
  4. `fix(backend): CORS + alinhar contratos do PIN e health-records`
  5. `feat(web): tutor dashboard + login universal + fluxo PIN E2E`
  6. `feat(mobile): theme oficial + assets atualizados`
  7. `feat(web): tutor pode abrir prontuário do próprio pet`
  8. `chore(brand): logos source + script de geração com variante dark`
  9. `chore(mobile): regerar splash com bg da paleta oficial`
- ❌ **Não commitados** (ficaram untracked): `CLAUDE.md` e `frontend-guidelines.md` — são templates do projeto Guep CRM que o Ali deixou como referência, não fazem parte do petDiary

### 2026-05-01 — Sessão 2 (Fase 1: cadastro completo)
Plano consolidado de melhorias dividido em 6 fases (PROGRESSO atualizado).
Decisões do Ali registradas em memory: email+phone obrigatórios, CPF opcional, endereço estruturado (CEP+rua+nº+complemento+bairro+cidade+UF), ViaCEP permitido, revogação remove vet da lista mas preserva HealthRecords, auditoria só de mutações, caretakers não geram PIN.

- ✅ **Fase 1.1** — User model estendido (phone, whatsapp, document, clinic_name + 7 campos de endereço); admin com fieldsets; migration 0002 aplicada
- ✅ **Fase 1.2** — UserSerializer/UserCreateSerializer atualizados; email+phone required; validação por role (VET exige crmv + clinic_name); 5 testes E2E via curl OK
- ✅ **Fase 1.3** — Web: PasswordInput (toggle 👁), masks.ts (CPF/phone/CEP), viaCep.ts (auto-completa endereço), usernameCheck.ts (debounced), Register reescrito 2 colunas, Login com PasswordInput, Nunito via <link> (warning de @import resolvido)
- ✅ **Fase 1.4** — Validação E2E completa via curl (T1-T7 todos OK); 2 commits separados (backend / frontend) e push para origin/master

🎯 **Marco da Fase 1:** cadastro real funciona ponta-a-ponta com validação ao vivo, máscaras BR, integração ViaCEP, toggle de senha, endereço estruturado.

### Próxima sessão — TODO
**Continuar plano consolidado:**
- Fase 2: Login UX — checkbox "manter conectado" (mostrar senha já feito na 1.3)
- Fase 3: Acessos bidirecionais vet ↔ pet (claimed_at, endpoints revoke/active/history, sidebar de pets visitados pro vet, lista de vets pro tutor com botão revogar)
- Fase 4: Login único do veterinário (token blacklist)
- Fase 5: Co-tutores / família (PetMember CARETAKER, sem permissão de gerar PIN)
- Fase 6: Auditoria (AuditLog, só mutações)
- Fase 7: Uploads/download/print (adiada)
- **Etapa final** (após Fase 6): preparação para produção — domínio, hospedagem em nuvem, PRODUCAO.md com requisitos para iOS/Android e LGPD

### 2026-05-01 — Sessão 3 (em andamento) — Fase 2: Login UX
- ✅ **4 specs futuras** salvas em `ai-memory/specs/` e versionadas no git:
  - 01: Backend assinaturas + suporte + deleção LGPD (Asaas/MP, freemium)
  - 02: Mobile cobrança (CheckoutPix/Card) + deleção de conta (LGPD/Apple)
  - 03: Mobile central de ajuda (FAQ + form de contato)
  - 04: Integrações OpenAI (Whisper/GPT-4o-mini) + AWS S3 (presigned URLs)
- ✅ Limpeza: `CLAUDE.md` e `frontend-guidelines.md` (templates do Guep CRM) removidos do tracking + adicionados ao `.gitignore`
- ✅ **Fase 2.1** — `authStore` com storage dinâmico:
  - Novo `src/store/dynamicStorage.ts`: `dynamicAuthStorage` (StateStorage) que delega entre localStorage e sessionStorage
  - Flag `petdiary-keep-logged` em chave separada do localStorage (resolve circularidade: storage decide antes do estado existir)
  - `authStore` ganhou campo `keepLogged` + action `setKeepLogged(boolean)` que migra a sessão entre storages se o usuário trocar a preferência logado
  - `logout()` limpa de ambos storages; `partialize` evita persistir a flag no estado; listener `storage` sincroniza flag entre abas
  - Commit: `feat(web): authStore com storage dinâmico` + push
- ✅ **Fase 2.2** — Checkbox "Manter conectado" no Login:
  - Estado local `keepLogged` inicializa de `useAuthStore.getState().keepLogged` (preserva preferência entre sessões)
  - `setKeepLogged(checked)` chamado ANTES do login para que o storage decida onde escrever desde o primeiro byte
  - Hint discreto "ⓘ Sua sessão será encerrada ao fechar o navegador" quando desmarcado
  - Estilo neutro com checkbox accent-brand-teal
- ✅ **Fase 2 — completa**
- ✅ **Fase 5.6** — Web: seção Familiares + modal de convite:
  - Tipos novos em `types.ts`: MemberRole, MemberUser, PetMember, InviteMemberPayload
  - `<InviteMemberModal>`: form 2 colunas com nome/username (validação ao vivo)/email/phone (máscara)/CPF opcional/senha temp + endereço opcional via ViaCEP
  - `<MembersSection>`: collapse "👨‍👩‍👧 N familiares com acesso", lista CARETAKERs com badge "🤝 Familiar", botão remover (só OWNER), modal credenciais geradas com botão copiar, modal de confirmação de remoção
  - Integrado em TutorDashboard via `<MembersSection>` em cada card
- ✅ **Fase 5 — completa** (5.1+5.2+5.3+5.4 backend + 5.5+5.6 web)
- ✅ **Specs 12 (Cupons) e 13 (Admin Dashboard)** salvas em `ai-memory/specs/`
- ✅ **Fase 7.1 (backend)** — Modelo HealthRecordAttachment + storage abstrato + endpoints:
  - `health/services/storage.py`: classe abstrata `StorageBackend` (save, open, delete, get_url) + `LocalStorageBackend` (default) + `S3StorageBackend` (stub para Spec 04). `make_storage_key(pet_id, record_id, filename)` gera UUID-key evitando conflitos
  - Modelo `HealthRecordAttachment`: id UUID, record FK, storage_key, file_name, description, mime_type, file_size, uploaded_by FK SET_NULL, created_at
  - Settings: `MEDIA_URL`, `MEDIA_ROOT`, `ATTACHMENT_STORAGE_BACKEND` (default "local")
  - Migration 0002 aplicada
  - `attachment_views.py` com 3 views:
    - `RecordAttachmentListCreateView`: GET lista anexos do record / POST upload (multipart com file + file_name + description)
    - `AttachmentDetailView`: DELETE remove do storage + DB
    - `AttachmentServeView`: GET /<id>/<mode>/ com mode in {view, download} — `view` retorna inline (PDF/imagem no browser), `download` força Content-Disposition attachment
  - URLs aninhadas em `pets/<pet_pk>/health-records/<record_pk>/attachments/`; serve em `/attachments/<id>/<mode>/` (sem nesting porque attachment_id é UUID único)
  - Permissão: helper `_user_can_access_pet` reutilizando `pet.has_member` ou `vet_has_active_access`
  - Validação E2E (8 testes via curl, todos OK):
    - T1 POST upload retorna 201 com download_url/view_url · T2 GET list traz o anexo · T3 GET view inline retorna conteúdo · T4 GET download tem Content-Disposition: attachment · T5 outro tutor → 404 · T6 DELETE 204 · T7 GET após delete → 404 · T8 cleanup

- ✅ **Fase 6.2** — Web: aba "Histórico de alterações" no ClinicalView:
  - Tipos novos em `types.ts`: `AuditAction`, `AuditEntry`, `PaginatedResponse<T>`
  - Componente `<AuditTimeline>`: lê `/pets/<id>/audit/?page_size=100`, mostra cada entrada com:
    - Ícone por ação (✏️ CREATE, 📝 UPDATE, 🗑 DELETE, 🚫 REVOKE, 🔑 CLAIM)
    - Nome do ator + badge colorido por role (TUTOR azul-teal, VET laranja, SYSTEM cinza)
    - "Atualizou HealthRecord" / "Criou Pet" etc + descrição
    - Data relativa ("há 2 min", "há 3 dias", fallback data completa)
  - `ClinicalView` ganhou abas: `📋 Histórico Clínico` (default) e `📜 Histórico de alterações`
  - Tabs com border-bottom estilo Material; layout mantém o aside de "Adicionar registro"
  - Vet com acesso ativo TAMBÉM vê a aba (transparência clínica)
- ✅ **Fase 6 — completa** (6.1 backend + 6.2 web)

- ✅ **Fase 6.1** — Backend: app `audit/` + AuditLog + signals:
  - Novo app `audit/` com `models.py`, `helpers.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `signals.py`
  - Modelo `AuditLog`: actor (FK SET_NULL), actor_name_snapshot (preserva mesmo se conta excluída), actor_role_snapshot, action (CREATE/UPDATE/DELETE/REVOKE/CLAIM), entity_type, entity_id, pet (FK opcional), description, changes (JSON), ip_address, user_agent, created_at — com 3 índices
  - `helpers.log_action()`: função pública para qualquer parte do app criar entrada (com fallback para "Sistema" se não há ator); falha silenciosa
  - `signals.py`: receivers em HealthRecord, Pet, PetMember, VetAccessToken (post_save + post_delete)
    - **Bug corrigido durante validação**: cascade delete do Pet quebrava FK constraint. Solução: `pre_delete` de Pet seta thread-local `suppress_pet_ids`; signals filhos checam e pulam log; `post_delete` do Pet logra com `pet=None`
  - `views.PetAuditListView`: GET /pets/<id>/audit/ paginado (20/página, max 100); permissão = membros do pet OU vet com acesso ativo (transparência clínica)
  - Admin: registro read-only (logs imutáveis), só superuser pode purgar
  - Migration 0001 aplicada
  - Validação E2E (8 testes via curl):
    - Audit começa vazio (T1) · criar pet → 1 entrada · criar PetMember automatic OWNER → 2 entradas · criar HealthRecord → 3 entradas · GET /audit/ retorna 3 corretamente (T4) · vet sem acesso vê vazio (T5) · outro tutor vê vazio (T6) · DELETE do pet funciona (T7) · log final tem 4 entradas incluindo "Excluiu pet" (T8)
- ✅ **Fase 3.1** — Backend: ciclo de vida de acesso vet ↔ pet:
  - `VetAccessToken` ganhou `claimed_at` (DateTimeField). Migration 0003 aplicada.
  - `ClaimAccessView` agora seta `claimed_at = now()` no momento do claim
  - 3 endpoints novos:
    - `POST /access/tokens/<id>/revoke/` (tutor revoga; soft-delete: `is_active=False, deleted_at=now`)
    - `GET /access/active/` (tutor: lista vets ativos com info de clínica + último contato + last_visit)
    - `GET /access/history/` (vet: lista pets visitados com status computed: ACTIVE/EXPIRED/REVOKED)
  - `last_visit` = MAX(health_records.created_at WHERE author=vet AND pet=this) com fallback `claimed_at`
  - Validado E2E (12 testes via curl):
    1. ✅ pet criado · 2. ✅ PIN gerado · 3. ✅ claim seta claimed_at · 4. ✅ tutor vê vet ativo · 5. ✅ nota criada · 6. ✅ vet vê status ACTIVE · 7. ✅ tutor revoga · 8. ✅ active fica vazio · 9. ✅ history mostra REVOKED · 10. ✅ vet 404 no pet revogado · 11. ✅ nota do vet preservada (auditoria) · 12. ✅ vet não pode revogar (403)
- ✅ **Fase 3.2** — Web Tutor: vets com acesso + botão revogar:
  - Tipos novos em `types.ts`: `PetSummary`, `VetSummary`, `TutorSummary`, `AccessStatus`, `ActiveAccess`, `AccessHistory`
  - Componente `<VetAccessSection>` reutilizável: collapse com lista de vets ativos por pet, modal de confirmação de revogação com cores vermelhas, mensagem clara "registros já adicionados continuam no histórico"
  - `TutorDashboard` busca `/access/active/` em paralelo aos pets (Promise.all em `loadAll()`); filtra por petId no card; refetch após revogar
  - HMR sem erros, /tutor HTTP 200
- ✅ **Specs 05, 06 e 07** salvas em `ai-memory/specs/`:
  - 05: Captura de mídia (drag-drop + webcam web; câmera/galeria/áudio/vídeo/doc mobile)
  - 06: Fila de jobs (Celery+Redis recomendado, BullMQ alternativa) com **referência REAL** capturada do guep-portaria-backend (5 queues + workers + autoloader + Bull Board)
  - 07: WebSocket realtime com **referência REAL** capturada do guep-crm (`socket.io` + Redis adapter + auth JWT no handshake + presença multi-tab safe + emitters tipados)
- ✅ **Fase 3.3** — Web Vet: sidebar de pets visitados:
  - Componente `<AccessHistorySidebar>` reutilizável: lista cards do `/access/history/`, ícone por espécie, info do tutor, badge de status (verde ACTIVE / cinza EXPIRED / vermelho REVOKED), última visita formatada
  - Click em card ATIVO → navega pra `/clinical/<petId>`; status não-ativo mostra alerta explicando motivo
  - Layout split: sidebar 320px à esquerda + main centralizada com PinInput
  - Header agora mostra `clinic_name` do vet
  - Refresh do histórico após cada claim bem-sucedido
- ✅ **Fase 3 — completa** (3.1 backend + 3.2 web tutor + 3.3 web vet)
- ✅ **Decisão durável**: IA de mídia (Spec 04) será **gated 100% pelo plano PRO** (sem cota gratuita). FREE: upload/visualização/registros manuais. PRO: OCR/Whisper/sumarização. Permission class `IsActivePro` exposta pelo app `billing` (Spec 01).
- ✅ **Fase 4.1** — Login único do veterinário:
  - `rest_framework_simplejwt.token_blacklist` adicionado ao INSTALLED_APPS + 12 migrations aplicadas
  - SIMPLE_JWT settings: `ROTATE_REFRESH_TOKENS=True` + `BLACKLIST_AFTER_ROTATION=True` (defesa contra reuso)
  - `accounts/views.py:PetDiaryTokenObtainPairView` (custom subclass de TokenObtainPairView):
    - Tutor: comportamento padrão (múltiplas sessões coexistem)
    - **Vet**: ao logar, identifica todos os OutstandingTokens dele e adiciona ao BlacklistedToken (excluindo o jti recém-emitido)
  - URL `/api/v1/auth/token/` agora aponta para a view custom
  - Validado E2E (8 testes via curl):
    1. ✅ vet login A → access OK
    2. ✅ vet usa access A em /me/ → 200
    3. ✅ vet login B (segundo dispositivo) → access OK
    4. ✅ refresh A retorna `{"detail": "Token está na blacklist", "code": "token_not_valid"}` ✓✓
    5. ✅ refresh B funciona normalmente
    6-8. ✅ tutor luiza com sessões X e Y simultâneas — refresh X continua funcionando
- ✅ **Fase 5.1** — Backend: modelo PetMember + data migration:
  - Novo `pets.PetMember` (pet, user, role OWNER/CARETAKER, added_by, added_at, unique_together pet+user)
  - Pet helpers: `is_owner(user)`, `has_member(user)`
  - Migration 0002 (estrutural) + 0003 (data: cada Pet existente vira PetMember OWNER com user=tutor)
  - Admin: PetMemberInline em Pet + PetMemberAdmin standalone
  - Verificado: 4 Pets → 4 PetMembers role=OWNER criados pra tutores corretos
- ✅ **Fase 5.5** — Web: tela `/change-password` com auto-redirect:
  - `pages/ChangePassword.tsx` (novo): form com `current_password` (oculto se forced) + `new_password` + `confirm_password` (validação que bate)
  - Detecta `user.must_change_password` para alterar copy ("Defina sua senha" vs "Trocar senha")
  - Após sucesso: aguarda 1.5s mostrando confirmação verde → logout local + `navigate("/login", state: { notice })`
  - Mostra erros do backend campo a campo
- ✅ **Fase 5.5 — guards e redirecionamento**:
  - `App.tsx`: `RequireAuth` agora bloqueia acesso a qualquer rota (exceto `/change-password`) se `user.must_change_password=true` — força troca antes de qualquer outra coisa
  - `HomeRedirect` também redireciona para `/change-password` se flag for true
  - `Login.tsx`: após login bem-sucedido, se `must_change_password=true` → vai direto pra `/change-password`
  - `Login.tsx`: exibe `notice` flash (verde) se vier de `/change-password` ("Senha alterada com sucesso. Faça login novamente.")
- ✅ **`AuthUser`** estendido: `clinic_name?` e `must_change_password?` opcionais

- ✅ **Fase 5.4** — Backend: endpoints `/members/` + restrições OWNER:
  - `pets/serializers.py`: `_MemberUserSummary`, `PetMemberSerializer`, `InviteMemberSerializer` (cadastra User novo + cria PetMember(CARETAKER) atomicamente, gera senha temporária + must_change_password=True)
  - `pets/member_views.py` (novo):
    - `PetMemberListCreateView` → GET (qualquer membro lista) / POST (apenas OWNER)
    - `PetMemberDestroyView` → DELETE (apenas OWNER); bloqueia remover OWNER ou a si próprio
  - `pets/urls.py`: `/pets/<pid>/members/` e `/pets/<pid>/members/<mid>/`
  - `access/views.py`:
    - `GeneratePinView` agora checa `PetMember(role=OWNER)` em vez de `pet.tutor==user` → caretaker NÃO pode gerar PIN
    - `RevokeAccessView` mesmo: filtro `pet__members__role=OWNER`
    - `ActiveAccessListView` agora retorna pets de TODOS os membros (OWNER + CARETAKER) — caretaker enxerga vets ativos do pet também (read-only)
  - Validação E2E (11 testes via curl, todos OK):
    - T1 luiza GET /members/ retorna OWNER + CARETAKER · T2 luiza POST cria pedro com senha temp · T3 pedro login + must_change_password=true · T4 pedro tenta gerar PIN → 403 · T5 pedro tenta convidar → 403 · T6 pedro lista membros (OK, é membro) · T7 luiza DELETE pedro 204 · T8 pedro acessa pet → 404 · T9 tentar remover OWNER → 400 · T10 outro tutor (joao) tenta convidar → 403 · T11 cleanup

- ✅ **Fase 5.3** — Backend: IsPetMemberOrHasVetAccess + queryset Pet:
  - `pets/permissions.py`: novo `IsPetMemberOrHasVetAccess` substitui o antigo `IsTutorOrHasVetAccess` (alias de compat mantido)
  - Tutor agora é **OWNER ou CARETAKER**: `pet.has_member(user)` (filtra via PetMember)
  - Vet: helper `vet_has_active_access(user, pet)` extraído (reusado em outras fases)
  - `PetViewSet.get_queryset` agora `Pet.objects.filter(members__user=user).distinct()` em vez de `tutor=user`
  - `HealthRecordViewSet` usa nova permission
  - `PetSerializer.create` cria automaticamente PetMember(OWNER) ao criar pet (mantém pet.tutor por compat)
  - Validação E2E (8 testes via curl, todos OK):
    - T1 luiza vê Mel · T2 criar Pipoca cria PetMember(OWNER) automático · T3 carlos vira CARETAKER do Mel · T4 carlos vê Mel · T5 carlos GET health-records 200 · T6 carlos CRIA nota (CARETAKER pode adicionar) · T7 joao não vê Mel (isolamento) · T8 cleanup

- ✅ **Fase 5.2** — Backend: must_change_password + change-password endpoint:
  - User ganha `must_change_password` (BooleanField, default False) — caretakers convidados terão True até trocarem
  - `UserSerializer` expõe o campo (read-only — só muda via fluxo dedicado)
  - `POST /api/v1/auth/change-password/`:
    - Auth required
    - Body `{current_password, new_password}` — current opcional se must_change_password=True
    - Após sucesso: `set_password` + flag=False + **blacklist de TODOS os refresh tokens** anteriores deste user (defesa contra reuso)
    - Mensagem: "Senha alterada com sucesso. Faça login novamente."
  - Validação E2E (9 testes via curl, todos OK):
    - T1-T5: caretaker carlos_familiar → login → flag=True → troca sem current_password → senha antiga invalidada → flag=False
    - T6: luiza (flag=False) sem current_password → 400 "campo obrigatório"
    - T7: luiza com current_password errada → 400 "Senha atual incorreta"
    - T8: luiza com current_password correta → 200
    - T9: senha revertida para não quebrar testes futuros

### 2026-05-01 — Sessão "finalizar tarefas" (autônoma)
> Ali pediu pra "finalizar as tarefas". Implementei tudo que dá pra fazer
> sem credenciais externas (Asaas/Apple/Google).

Sequência (6 commits):
1. **Spec 11 — Logs técnicos**:
   - Backend: `structlog` instalado, `logging_config.py` com console
     (DEV) / JSON (PROD), `StructlogContextMiddleware` que adiciona
     `request_id` + `user_id` + `role` automaticamente; integra com
     `audit.signals.set_current_user`
   - Web: `services/logger.ts` com debug/info/warn/error estruturado;
     interceptor de api.ts loga `http_error` em qualquer falha HTTP
2. **Spec 08 — `INSTALACAO-MACBOOK.md`** na raiz: pré-requisitos
   (Homebrew, Docker, Node, Python, Expo Go), troubleshooting macOS
   específico (Apple Silicon, porta 5432, lentidão VirtioFS, Expo
   Wi-Fi), comandos cotidianos
3. **Spec 09 — `PUBLICACAO-APPS.md`** na raiz: custos resumidos
   (~R$1.500-3.000 ano 1), pré-requisitos LGPD/Apple/Google, app.json
   com permissões iOS/Android, eas.json com profiles, TestFlight +
   Internal Testing, submissão final, rejeições comuns Apple, ASO,
   checklist final
4. **Mobile real**:
   - Tipos alinhados com backend (UPPERCASE Species/RecordType, etc)
   - `useAppStore` com persist AsyncStorage (token+refreshToken+user)
   - `services/api.ts` com base URL /api/v1 + interceptors
   - `screens/Login.tsx` (NOVO) com toggle 👁/🙈 + KeyboardAvoidingView
   - `screens/HomeTutor.tsx` reescrito: GET /pets/, RefreshControl,
     empty/error/loading states, header com saudação + Sair
   - `screens/PetDashboard.tsx` reescrito: GET /health-records/, PIN
     real via POST /access/generate-pin/, Modal nativo com Clipboard
   - `AppNavigator.tsx`: roteamento condicional por isAuthenticated
   - **Bugs fechados**: #3 (mobile chamava endpoints inexistentes),
     #4 (Math.random()), #10 (URL sem /api/v1)
5. **Spec 10 — i18n web (parcial: pt-BR + es + en)**:
   - `react-i18next` + `i18next` + `i18next-browser-languagedetector`
   - `src/i18n/index.ts` com applyDir (preparado para árabe RTL)
   - 3 locales JSON com 14 categorias de chaves (pluralização +
     interpolação)
   - `<LanguageSwitcher>` no canto da tela `/login`
   - `Login.tsx` totalmente traduzido como referência; outras telas
     são incrementais
6. **Spec 05 — Captura mídia web (drag-drop + webcam)**:
   - `<WebcamCapture>`: getUserMedia com facingMode environment,
     canvas snapshot, JPEG 85%, cleanup obrigatório de tracks
   - `<AttachmentsList>` ganhou drag-drop com ring visual + botão
     "📷 Webcam" abrindo o modal
   - Pendente da Spec 05 (mobile camera/áudio/vídeo) virá com Specs
     mobile (expo-image-picker / expo-camera / expo-av)

### 2026-05-01 — Hora autônoma do Ali (almoço)
> Ali deu autorização explícita pra trabalhar autônomo por 1h sem confirmação a cada fase.
> **Resultado:** Fechei Fases 5, 6 e 7 nesta janela. Roadmap principal todo verde.

Sequência da hora autônoma:
1. Fechei **Fase 5.6** (web seção Familiares + modal de convite + credenciais)
2. **Fase 6.1** (backend): app `audit/` + AuditLog model + signals automáticos + endpoint `/pets/<id>/audit/` + bug-fix de cascade delete
3. **Fase 6.2** (web): aba "Histórico de alterações" no ClinicalView com `<AuditTimeline>` mostrando ator/ação/data relativa
4. **Fase 7.1** (backend): storage abstrato (`StorageBackend` interface, `LocalStorageBackend`, `S3StorageBackend` stub) + `HealthRecordAttachment` model + endpoints multipart upload/list/view/download/delete
5. **Fase 7.2** (web): `<AttachmentsList>` com upload, ícone por mime, view inline (blob URL), download, print, delete; integrado em cada record do `ClinicalView`

Total commits nesta hora: ~6 commits separados, todos com push.

### 2026-05-01 — Sessão 4 (Fases A-G — SaaS infra completa + mock-first)
> Ali pediu mock-first explicitamente: "olha tem com fazer tudo que precisa apis externar faça mockado eom um parametro pra trocar depois". Isso virou regra do projeto.

**Fase A — Gateway de pagamento mockado + Cupons** (Spec 12):
- `billing/services/gateway.py`: interface `PaymentGateway` + `MockPaymentGateway` (gera PIX copy-paste/QR base64/expiração realista) + stubs `AsaasGateway`/`MercadoPagoGateway` + factory por env `BILLING_GATEWAY_MODE`
- `billing/coupon_models.py`: `Coupon` (code, discount_percent, valid_until, max_uses, **max_per_user**, current_uses, can_be_used_by) + `CouponRedemption` com snapshot do user + price final
- `billing/views.py`: `SubscribeView` valida cupom → calcula preço final → cria checkout no gateway → registra redemption; `ApplyCouponView` valida sem consumir; `GatewayWebhookView` com verify_webhook por assinatura HMAC

**Fase B — IA mockada + IsActivePro com herança** (Spec 04 — mockada):
- `health/services/ai.py`: interface `AIService` + `MockAIService` (gera prescrição/transcrição realistas) + stub `OpenAIService` + factory `AI_PROVIDER`
- `billing/permissions.py`: `has_pro_access(user)` retorna True se user tem PRO próprio OU é membro (CARETAKER) de pet cujo OWNER tem PRO → caretakers herdam o PRO
- `IsActivePro` aplicada em endpoints de IA (Whisper/extract)

**Fase C — Role ADMIN + Admin Dashboard SaaS** (Spec 13):
- `accounts.User.Role` ganhou ADMIN
- App novo `admin_panel/`: `IsAdminRole` permission + 5 endpoints (KPIs, listar usuários, listar/criar cupons, deactivate cupom, listar redempções de um cupom, tickets stub)
- Web: 5 páginas em `pages/admin/` (AdminLayout sidebar + Dashboard com KPIs + Users + Coupons com modal de relatório de uso + Tickets stub)
- App.tsx: rota `/admin` com guard `role="ADMIN"` + redirecionamento HomeRedirect

**Fase D — Mobile: AccountSettings + SubscriptionDashboard + HelpCenter**:
- 3 telas novas no Stack autenticado, gear icon ⚙ no HomeTutor → AccountSettings
- AccountSettings: editar perfil (nome/email/phone), trocar senha (modal com revalidação), atalhos pra Assinatura/Ajuda, logout, **excluir conta com modal LGPD** (X-Confirm-Delete + revalidação de senha + anonimização)
- SubscriptionDashboard: status PRO/FREE, benefícios, checkout PIX via /billing/subscribe (com cupom validado em tempo real), exibe `pix_copy_paste`, cancelar (cancel_at_period_end)
- HelpCenter: FAQ accordion (7 perguntas) + email/WhatsApp via `Linking`

**Fase E — Recuperação de senha (esqueci/reset)**:
- Backend: `PasswordResetToken` (UUID, validade 30min, single-use, ip_address)
- `EmailService` abstraído: `console` (default DEV — loga no stdout) | `smtp` | `resend` (stub)
- `POST /auth/forgot-password/` sempre 200 (anti-enumeração); `POST /auth/reset-password/` valida token → troca senha → blacklist refresh tokens
- Web: páginas `/forgot-password` e `/reset-password/:token`; link "Esqueci minha senha" no /login; i18n pt-BR/en/es

**Fase F — Celery + Redis (Spec 06)**:
- Docker: `redis:7-alpine` (broker+backend, healthcheck) + `celery_worker` (concurrency=2) + `celery_beat` (DatabaseScheduler)
- `celery[redis]>=5.4` + `django-celery-beat>=2.7`
- `petdiary/celery.py` com autodiscover; `__init__.py` faz bootstrap; settings com `CELERY_TASK_ALWAYS_EAGER` toggle (testes/CI)
- Tasks reais:
  - `accounts.tasks.send_password_reset_email_task` — async com retry exponencial (até 3x); `ForgotPasswordView` chama `.delay()`
  - `accounts.tasks.cleanup_expired_password_reset_tokens_task` — periódica 1h via beat; apaga tokens usados há +24h ou expirados
- Validado E2E: worker descobriu 3 tasks; forgot-password POST → task no Redis → worker logou email console; cleanup `.get()` retornou 0; PeriodicTask registrado

**Fase G — Healthcheck + rate limit + pre-commit**:
- `petdiary/healthcheck.py`: `GET /livez/` (liveness), `GET /healthz/` (readiness — testa Postgres+Redis, 200/503 com detalhe). Sem auth.
- DRF `ScopedRateThrottle`: login 10/min, register 5/min, **forgot_password 5/hour**, reset_password 10/hour, check_username 30/min, apply_coupon 20/hour. Validado: 6º forgot-password → 429
- `.pre-commit-config.yaml`: pre-commit-hooks v5 + ruff v0.8.6 (lint+format só backend) + prettier v4 (web+mobile) + detect-secrets v1.5
- `pyproject.toml`: ruff config (line-length 100, py311, regras E/F/W/I/B/C4/PIE/UP, ignora migrations)
- `.secrets.baseline` pronta para incremental

**4 commits da sessão 4** (todos pushed):
- `75e8489` feat: Fase E
- `ea305d6` feat: Fase D
- `58ac9f4` feat: Fase F
- `e147781` feat: Fase G
- Fases A, B, C foram em commits anteriores da mesma data

🎯 **Marco da sessão 4:** stack agora é SaaS-grade (assinaturas + admin + IA gated + async + healthcheck + rate limit). Mock-first deixa tudo testável sem credenciais externas — flips de env quando vier o real.

### 2026-05-01 — Sessão 5 (paridade mobile ↔ web)
> Ali pediu paridade total entre mobile e web. Entregue tudo que o web
> oferecia e o mobile não tinha + corrigiu bugs do app mobile.

**Bugs corrigidos:**
- `petDiary-frontend-mobile/.env` esquecido com IP velho
  (192.168.10.203 sem `/api/v1`) sobrescrevia env do docker-compose.
  Apagado — Expo agora usa env correto via env_file. Bug do "ana não
  conseguia logar".
- LanguageSwitcher Login mobile estava atrás do notch — ajustado para
  usar `useSafeAreaInsets()`.
- AppNavigator não esperava hidratação do AsyncStorage → causava
  "esquecer sessão" ao reabrir app. Agora aguarda
  `useAppStore.persist.hasHydrated()`.
- Fallback do `api.ts` mobile estava com IP estático (192.168.10.203) —
  agora `localhost:8000/api/v1`.

**Mobile — paridade entregue:**
- Tela Register (TUTOR) com login automático
- Tela ForgotPassword (POST /auth/forgot-password/)
- LanguageSwitcher (sheet modal nativo) — Login/Register/Forgot/Conta
- Logotipo nas telas de Login/Register/Forgot
- PetFormModal — criar pet (espécie/nome/raça/peso)
- RecordFormModal — criar HealthRecord
- AttachmentsList — lista anexos por record + upload via câmera/galeria
  /documento (expo-image-picker + expo-document-picker)
- VetAccessModal — vets com acesso ativo + revogar (filtra por petId
  via /access/active/)
- MembersModal — listar PetMember + convidar caretaker (cria User+Member
  atomicamente) + remover + modal de credenciais

**Web — seletor de idioma nas telas autenticadas:**
- Adicionado em TutorDashboard, VetEntry, ClinicalView e AdminLayout
  (já existia em Login/Register/Forgot/Reset/Conta)

**Documentação criada:**
- `ai-memory/PARIDADE-MOBILE-WEB.md` — matriz autoritativa do que tem
  em cada plataforma. Atualizar sempre que entregar paridade.
- `ai-memory/specs/17-notificacoes-mobile-push-preferencias.md` — spec
  detalhada do sistema de notificações (mobile + web + backend).

**Memory salva (decisão durável):**
- "Paridade mobile ↔ web" — toda funcionalidade tem que existir nos dois
  clientes (regra do Ali, 2026-05-01)

**Commits desta sessão (em ordem):**
1. `438e0c5` feat(mobile): cadastro, esqueci senha, idioma, fix persist
2. `20b75fc` feat(ui): seletor idioma nas telas autenticadas + logo login
3. `a477bb1` fix(mobile): seletor idioma respeita safe area
4. `410273e` feat(mobile): adicionar registro clínico e anexar mídia
5. `b20ff6a` feat(mobile): criar pet, vets com acesso e familiares

🎯 **Marco da sessão 5:** mobile agora tem paridade essencial com o web.
Pendências restantes catalogadas em PARIDADE-MOBILE-WEB.md +
Spec 17 (notificações).

### 2026-05-01 — Sessão 6 (Spec 17 — notificações)
> Ali pediu sistema completo de notificações com push, preferências
> on/off por tipo, e disponível em web e mobile (paridade total). Plano
> dividido em 4 fases (Spec 17). Entregue Fase 5a (backend) e 5c (mobile).

**Fase 5a — Backend** (commit `926c836`):
- App `notifications/` com 3 modelos: Notification (in-app),
  NotificationPreference (toggles), DevicePushToken (suporta Expo
  iOS/Android e Web Push VAPID)
- 8 endpoints sob `/api/v1/notifications/`
- PushService abstrato + MockPushService (default DEV) + MultiPushService
  (produção — Expo HTTP API + pywebpush, lazy import)
- helpers.notify(user, type, title, body, data) — falha silenciosa
- Tasks Celery: send_push_async (fanout) + check_payment_due_task (beat
  diário)
- Hook automático em ClaimAccessView: vet usa PIN → tutor recebe notif
  "VET_ACCESS_CLAIMED" com deep-link
- Settings: PUSH_SERVICE_MODE=mock (toggle p/ multi em prod)
- Validado E2E via curl: list/prefs/register-device/vapid-key OK; hook
  automático funcionou (Dra. Camila usou PIN → Ana recebeu notif)

**Fase 5c — Mobile** (commit `c950e9a`):
- expo-notifications + expo-device instalados
- services/notifications.ts: registerForPushNotificationsAsync (pede
  permissão, registra token via API) + setupNotificationTapHandler
  (deep link)
- Tela `Notifications.tsx`: lista paginada, mark-read no tap, deep
  link, long-press para excluir, botões "Marcar todas lidas" + "Limpar
  tudo"
- Tela `NotificationPreferences.tsx`: 7 toggles Switch por tipo, salva
  no toggle, botão "Ativar no dispositivo" para re-pedir permissão
- HomeTutor: badge 🔔 com contador unread; tap navega
- AccountSettings: atalho "🔔 Notificações"
- AppNavigator: dispara registerForPushNotificationsAsync pós-login

**Backend extension** (no commit 5c): DELETE individual + clear-all
adicionados aos endpoints (Ali pediu durante a Fase 5c).

**Documentos atualizados:**
- `ai-memory/PARIDADE-MOBILE-WEB.md` — seção 12 (Notificações)
  atualizada com 11 novas linhas (lista, push expo, prefs, excluir,
  limpar, badge, etc.) marcando ✅ no mobile
- `IMAGENS-DO-PROJETO.md` (NOVO commit `0839052`) — mapa de todas as
  imagens do projeto (24 arquivos) com caminho/dimensão atual/ideal/
  uso para Ali substituir manualmente

**Falta para fechar Spec 17:**
- Fase 5b — modelo Reminder + tasks Celery (vacina/retorno-vet
  automáticos por data)
- Fase 5d — Web: sw.js + subscribe VAPID + telas Notifications/
  NotificationPreferences + badge no header
- VAPID keys (já em PENDENCIAS-HUMANAS item 14)

**Commits desta sessão (em ordem):**
1. `926c836` feat(backend): Spec 17 Fase 5a — app notifications
2. `0839052` docs: IMAGENS-DO-PROJETO.md
3. `c950e9a` feat: Spec 17 Fase 5c — mobile + delete/clear-all

🎯 **Marco da sessão 6:** mobile já recebe e gerencia notificações
in-app + preferências. Falta web (Fase 5d) e lembretes automáticos
(Fase 5b).

### 2026-05-01 — Sessão 7 (Spec 17 Fase 5d — web)
> Após mobile (sessão 6), agora paridade total mobile↔web para
> notificações.

**Web entregue** (commit `13bfbb9`):
- public/sw.js — handler push + notificationclick com deep link
- services/notifications.ts — registerWebPush (subscribe VAPID + POST
  device); unregisterWebPush; em DEV (sem VAPID) retorna false
  silencioso, in-app funciona normal
- pages/Notifications.tsx — lista + mark-read no click + delete
  individual + mark-all-read + clear-all + empty state
- AccountSettings ganhou aba "🔔 Notificações": 7 toggles + status
  permission do navegador + botão "Ativar"
- components/NotificationsBell.tsx — badge unread com polling 60s
- Plugado em TutorDashboard, VetEntry, AdminLayout
- App.tsx: pós-login, registerWebPush silencioso se permission já
  é "granted" (não molesta o user)
- i18n: chaves `notifications.*` e `account.tabs.notifications` em
  pt-BR/en/es
- Rota `/notifications` no App.tsx

**Decisões durables:**
- Em DEV não pedir permissão automática — só re-registrar se já
  estiver granted. User ativa explicitamente em /conta
- `<NotificationsBell />` faz polling 60s. Quando WebSocket (Spec 07)
  rodar, substituir por subscribe

**Documentos atualizados:**
- PARIDADE-MOBILE-WEB.md seção 12 — todas as 11 linhas com ✅ no web
- PENDENCIAS-ORDENADAS.md A1 marcado completo

**Pendências Spec 17 ainda abertas:**
- Fase 5b — modelo Reminder + tasks Celery (vacina/retorno
  automáticos por data) — pendência A2

🎯 **Marco da sessão 7:** notificações em paridade total mobile↔web.
Falta só lembretes automáticos (Reminder) para fechar a Spec 17 inteira.

### 2026-05-01 — Sessão 8 (Spec 17 Fase 5b — Reminders fecha a spec)
> Continuação direta da sessão 7. A2 do PENDENCIAS-ORDENADAS executada.

**Backend (commit `8f32860`):**
- App `health/`: modelo Reminder (pet, type VACCINE/VET_RETURN/CUSTOM,
  title, description, date_due, notified_at, dismissed_at, created_by)
  + 2 índices + migration 0003
- ReminderSerializer (read-only em pet/notified_at/dismissed_at)
- 3 views: ListCreate aninhada, Detail (DELETE), Dismiss (POST)
- Permissão: membros leem; só membros criam (vet com acesso ativo
  apenas lê)
- tasks.check_reminders_task: beat 1x/dia, varre date_due em até 7d,
  notifica todos OWNERs do pet, marca notified_at (idempotente)
- Beat schedule check-reminders-daily

**Web:** components/RemindersSection.tsx (collapsible no card do pet)
plugado no TutorDashboard

**Mobile:** components/RemindersModal.tsx (page-sheet) + 3º botão
"🔔 Lembretes" no PetDashboard

**Validação E2E (curl):**
- T1 criar reminder → 201 · T2 list → 1 · T3 task eager → notified=1
- T4 ana recebeu notif "V10 anual — em 2 dias" automaticamente
- T5 dismiss → dismissed_at preenchido
- T6 task de novo → notified=0 (idempotente)
- T7 DELETE → 204

**Nova regra durável** — `feedback_i18n_first.md`:
> Ali pediu: "usao i18n no frontend que sistema multi lingua garava
> este rega para refazer o trablho". Toda string nova precisa passar
> por `t("chave")` desde o primeiro commit. Componentes entregues
> recentemente com strings hardcoded estão listados em
> PARIDADE-MOBILE-WEB.md como débito técnico para migrar quando rodar
> B1/B3 (Spec 10 i18n).

**Documentos atualizados:**
- PARIDADE-MOBILE-WEB.md: linha "Lembretes automáticos" agora ✅ nas 3
  camadas; nota de débito técnico i18n adicionada na seção 15
- PENDENCIAS-ORDENADAS.md A2 marcado completo

**Spec 17 — 100% concluída** (commits `926c836` 5a · `c950e9a` 5c ·
`13bfbb9` 5d · `8f32860` 5b).

🎯 **Marco da sessão 8:** sistema completo de notificações + lembretes
(in-app + push expo + web push) em paridade total mobile↔web. Falta só
VAPID keys (PENDENCIAS-HUMANAS item 14) para push real em produção.

### 2026-05-01 — Sessão 9 (B3.1 — i18n mobile parcial + Spec 18)
> Continuação direta da sessão 8. B3.1 entregue, B3.2 aberta.

**Entregue (commit `6433d1c`):**
- Libs: `i18next`, `react-i18next`, `expo-localization`
- Infra `src/i18n/index.ts`: 6 locales registrados (pt-BR como fonte;
  pt-PT/en-US/es-ES/fr-FR/ar fallback até B4); `detectInitial()` via
  expo-localization; helper `isRTL()` pronto
- `pt-BR.json` completo: 14 namespaces (common, auth, home, pet,
  records, attachments, vets, members, reminders, notifications,
  account, subscription, help, preferences, username_check)
- App.tsx importa i18n no boot
- AppNavigator reaplica idioma persistido após hidratação
- Tipo Language expandido para 6 códigos
- Telas migradas (5/9): Login, Register, ForgotPassword, HomeTutor,
  PetDashboard
- LanguageSwitcher: 6 idiomas + chama i18n.changeLanguage

**Spec 18 salva** (commit `6433d1c`):
- Pedido do Ali: login admin + troca senha + páginas admin web E
  mobile + suporte real (tickets) com chat
- Decisão durável: admin no mobile **read-only** (KPIs + lista
  tickets); edição só no web
- Adicionada ao índice de specs

**Pendência aberta — B3.2:**
- AccountSettings, SubscriptionDashboard, HelpCenter, Notifications,
  NotificationPreferences + 7 modais (Pet/Record/Vet/Members/Reminders/
  Attachments)
- pt-BR.json **já tem todas as chaves** — trabalho mecânico de
  substituir strings

**Documentos atualizados:**
- PARIDADE-MOBILE-WEB.md: nota de débito técnico atualizada (B3.1
  entregue, B3.2 aberto)
- PENDENCIAS-ORDENADAS.md: B3 dividido em B3.1 (✅) e B3.2 (pendente)

🎯 **Marco da sessão 9:** infra i18n pronta + 5 telas em pt-BR via
`t()`. Para fechar B3 inteiro falta apenas migração mecânica das
telas restantes (B3.2). Depois B4 cria os 5 outros locales.

### Próxima sessão — TODO
**Roadmap principal + Fases A-G → 100% completo!** ✨

Próximas etapas candidatas:
- **Etapa final — produção** (Ali declarou em 2026-05-01 que esta começa só agora):
  - Comprar domínio (Ali quer recomendação)
  - Escolher hospedagem em nuvem (Fly.io, Railway, AWS ECS — definir)
  - Trocar mocks por integrações reais quando vierem credenciais (gateway, OpenAI, Resend, S3)
  - EAS Build mobile + submissão App Store/Google Play
  - Sentry, backups gerenciados, monitoring
  - Atualizar `INSTALACAO-MACBOOK.md` e `PUBLICACAO-APPS.md` (não cobrem Celery+Redis hoje)
- **Incrementais menores:**
  - i18n: aplicar em componentes web restantes (admin pages, audit timeline, attachments)
  - i18n mobile (não tem react-i18next instalado ainda)
  - Línguas pt-PT, fr, ar (RTL)
  - Tickets reais (admin_panel hoje é stub — falta SupportTicket model)

---

## 🧭 Como usar este arquivo

1. **No início de cada sessão:** leia esta página inteira (3 min) para saber onde paramos
2. **Durante a sessão:** marque `[x]` nos itens que concluir
3. **No fim de cada sessão:** adicione uma entrada nova em "Histórico de sessões" e atualize a tabela "Status geral" + a data no topo
4. **Quando concluir uma Etapa inteira:** comemore e atualize "Fase atual"
5. **Quando finalizar a Fase 1:** mude o objetivo para "Fase 2 — Automação e Filtros de Segurança" e reescreva as etapas

> **Regra de ouro:** este arquivo é a **única fonte de verdade** sobre progresso. Se algo não está aqui, não foi feito.
