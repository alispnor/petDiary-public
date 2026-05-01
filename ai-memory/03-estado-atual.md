# 03 — Estado Atual (snapshot 2026-05-01)

Legenda: ✅ pronto · 🟡 parcial · ❌ falta · 🐛 com bug

## Backend (`petDiary-backend/`)

### Infra & setup
- ✅ Docker Compose com db + api + mobile + web
- ✅ Dockerfile da API (python:3.11-slim)
- ✅ requirements.txt (Django, DRF, JWT, Spectacular, Postgres)
- ✅ `.env` com SECRET_KEY/DEBUG/ALLOWED_HOSTS/DATABASE_URL
- ❌ **`django-cors-headers` não está instalado** — web em :5173 vai falhar ao chamar :8000
- ❌ Sem `seed` / fixtures / dados de demonstração
- ❌ Sem testes (pasta `tests/` ausente em todos os apps)

### Apps Django
- ✅ `accounts` — User customizado (TUTOR/VET), register + me/
- ✅ `pets` — CRUD com permissão `IsTutorOrHasVetAccess`
- ✅ `health` — CRUD aninhado em pet + endpoint mock de upload-url
- ✅ `access` — generate-pin + claim
- ✅ Migrations geradas (vistas em `*/migrations/0001_initial.py`)
- ✅ i18n configurado (pt-br/en/es)
- ✅ Swagger e ReDoc

### Lacunas funcionais (Fase 1)
- ❌ `Pet` não tem `birth_date` nem `avatar/photo_url` (clientes esperam)
- ❌ Endpoint para tutor **revogar PIN** (existe soft-delete no model, sem view)
- ❌ Endpoint para listar **histórico de acessos do vet** (vet web tem sidebar mockada)
- ❌ Sem upload real S3 (apenas URL fake)
- ❌ Sem OCR (Textract) — `raw_extracted_text` está pronto pra receber
- ❌ Sem Speech-to-Text
- ❌ Sem rate-limit / throttling
- ❌ Sem validação de unicidade de `access_code` ativo (colisão de PIN possível)

---

## Mobile (`petDiary-frontend-mobile/`)

### Infra & setup
- ✅ Expo SDK 54 + RN 0.81 + TypeScript
- ✅ Dockerfile + integração com docker-compose
- ✅ React Navigation (Native Stack)
- ✅ Zustand + AsyncStorage (persist)
- ✅ Axios com interceptors (token + Accept-Language + 401→logout)
- ✅ `@gorhom/bottom-sheet` instalado
- ✅ Mocks de `expo-image-picker`, `expo-image-manipulator`, `expo-av` (necessários porque não existe câmera no container)
- ❌ Sem ESLint/Prettier configs (script `lint` aponta para eslint sem `.eslintrc`)

### Telas
- 🟡 `HomeTutor` — UI pronta, **dados 100% mockados** (`MOCK_PETS`)
- 🟡 `PetDashboard` — UI pronta com timeline + bottom sheet, **timeline mockada** (`MOCK_TIMELINE`)
- ❌ Tela de **Login**
- ❌ Tela de **Registro**
- ❌ Tela / form de **criar pet**
- ❌ Tela / form de **adicionar registro manual**
- ❌ Tela de **gravação de áudio** (Speech-to-Text)
- ❌ Tela de **lembretes / vacinas** (Fase 2)

### Integrações
- 🟡 `services/api.ts` está pronto para chamar a API
- ❌ Nenhuma tela usa de fato a API (todas leem mocks)
- 🐛 `handleDocumentCapture` chama endpoints **inexistentes** no backend (ver `04-bugs-e-inconsistencias.md`)
- 🐛 Botão "Gerar PIN" usa `Math.random()` no client (não chama API)

---

## Web (`petDiary-frontend-web/`)

### Infra & setup
- ✅ React 19 + Vite 6 + TypeScript
- ✅ Tailwind 4
- ✅ Zustand (sem persist)
- ✅ Axios com interceptors (token + 403→revogação)
- ✅ React Router 7
- ✅ Dockerfile

### Telas
- 🟡 `VetDashboard` (`/`) — UI pronta com PinInput + sidebar de acessos recentes (sidebar **mockada**)
- 🟡 `ClinicalView` (`/clinical/:pin`) — header de pet + timeline + form de nota + modal de revogação
- ❌ Tela de **Login do veterinário** (não há autenticação antes do dashboard)
- ❌ Tela de **registro/cadastro do vet**

### Estado e dados
- 🟡 `clinicalStore` retorna **MOCK_PET + MOCK_TIMELINE** (não busca da API)
- 🟡 `addNote` adiciona apenas no store local, **não envia para API**
- 🟡 `RecentAccessList` usa **MOCK_HISTORY** (sem endpoint backend pra suprir)

### Integrações
- 🟡 PinInput chama `/access/claim/` mas **com payload errado** (ver bugs)
- 🐛 Botão "Simular Revogação" chama endpoint inexistente `/access/simulate-revoke/`

---

## Resumo (% completude estimada)

| Camada | Pronto | Avaliação |
|---|---|---|
| Backend | ~70% | Models e endpoints OK, falta CORS, alinhamento de contratos, alguns endpoints da Fase 1 |
| Mobile | ~30% | UI bonita pronta, mas zero integração real com API |
| Web | ~35% | UI pronta, sem login, sem chamadas reais |
| Cobertura ponta-a-ponta | **0%** | nenhum fluxo flui do mobile → backend → web ainda |

**Conclusão:** o projeto tem fundações sólidas, mas é um **esqueleto desconectado**. Todo o "miolo" da Fase 1 — fazer o tutor gerar PIN real, vet usar o PIN real, ver dados reais — ainda não foi feito.
