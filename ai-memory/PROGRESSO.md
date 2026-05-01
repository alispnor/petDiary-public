# 📊 PROGRESSO — petDiary

> **Arquivo vivo.** Atualize a cada sessão de trabalho.
> Última atualização: **2026-05-01 (sessão 3 — Fases 2 completa + 3.1 backend de acessos)**

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

| Camada | Antes (24/04) | Hoje (01/05) | Meta Fase 1 |
|---|---|---|---|
| Backend (Django) | 70% | 85% | 100% |
| Mobile (Expo) | 30% | 35% | 100% |
| Web (React) | 35% | **80%** ✨ | 100% |
| Infra/DX | 40% | 90% | 100% |
| **Cobertura E2E (backend)** | **0%** | **100%** ✨ | 100% |
| **Cobertura E2E (web ↔ back)** | **0%** | **100%** ✨ | 100% |

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
| 3 | Mobile chama endpoints inexistentes em `handleDocumentCapture` | 🔴 aberto |
| 4 | Botão "Gerar PIN" mobile usa `Math.random()` | 🔴 aberto |
| 5 | Sem CORS no backend | ✅ resolvido 01/05 |
| 6 | PIN pode colidir (sem unique constraint) | 🔴 aberto |
| 7 | `expires_at` obrigatório mas mobile não envia | ✅ resolvido 01/05 |
| 8 | Permissão retorna 404 em vez de 403 | 🟡 a decidir |
| 9 | URL base do mobile aponta `http://api:8000` (só Docker) | 🟡 mitigado via .env |
| 10 | `EXPO_PUBLIC_API_URL` não inclui `/api/v1` | 🔴 aberto |

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
- ✅ **Fase 2 — completa** (validação no browser delegada ao Ali — ele escolheu Opção A: pular validação manual e seguir pra Fase 3)
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

### Próxima sessão — TODO
- Fase 3.2: Web Tutor — seção "Vets com acesso" no card de pet + modal de revogação
- Fase 3.3: Web Vet — sidebar split com pets visitados + status badge
- Fases 4-7: login único vet, co-tutores, auditoria, uploads
- Fases 8-10 (specs salvas): assinaturas/suporte/deleção LGPD
- Etapa final: produção

---

## 🧭 Como usar este arquivo

1. **No início de cada sessão:** leia esta página inteira (3 min) para saber onde paramos
2. **Durante a sessão:** marque `[x]` nos itens que concluir
3. **No fim de cada sessão:** adicione uma entrada nova em "Histórico de sessões" e atualize a tabela "Status geral" + a data no topo
4. **Quando concluir uma Etapa inteira:** comemore e atualize "Fase atual"
5. **Quando finalizar a Fase 1:** mude o objetivo para "Fase 2 — Automação e Filtros de Segurança" e reescreva as etapas

> **Regra de ouro:** este arquivo é a **única fonte de verdade** sobre progresso. Se algo não está aqui, não foi feito.
