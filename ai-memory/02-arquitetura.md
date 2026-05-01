# 02 — Arquitetura

## Repositórios (monorepo)

```
petDiary/
├── petDiary-backend/         # API Django REST + Postgres
├── petDiary-frontend-mobile/ # App Tutor (Expo / React Native)
└── petDiary-frontend-web/    # Portal Vet (React + Vite)
```

## Stack por camada

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Django + DRF + SimpleJWT | 5.2 / 3.17 / 5.5 |
| DB | PostgreSQL | 15 |
| Mobile | Expo + React Native + Zustand | SDK 54 / RN 0.81 |
| Web | React + Vite + Tailwind 4 + Zustand | React 19 / Vite 6 |
| Docs API | drf-spectacular (Swagger/ReDoc) | 0.29 |
| Infra dev | Docker Compose | — |
| Infra prod (planejado) | AWS S3 (uploads) + AWS Textract (OCR) | — |

## Modelo de dados (atual)

### `accounts.User` (extends AbstractUser)
- `id` UUID
- `username`, `email`, `password` (Django padrão)
- `full_name`
- `role` — `TUTOR` ou `VET`
- `crmv` — registro do conselho (apenas vets)
- `iam_uid` — identificador externo (ainda não usado)

### `pets.Pet`
- `id` UUID
- `tutor` FK → User
- `name`, `species` (DOG/CAT/BIRD/OTHER), `breed`, `weight_kg`
- `created_at`, `updated_at`
- ❌ **Faltam:** `birth_date`, `avatar`/`photo_url` (mobile/web já esperam)

### `health.HealthRecord`
- `id` UUID
- `pet` FK → Pet
- `author` FK → User (SET_NULL ao excluir autor)
- `record_type` — VACCINE / EXAM / PRESCRIPTION / SURGERY / NOTE
- `title`, `description`, `date_occurred`
- `raw_extracted_text` — campo já preparado para OCR

### `access.VetAccessToken`
- `id` UUID
- `pet` FK → Pet
- `vet` FK → User (null até o claim)
- `access_code` — 6 dígitos numéricos (default `random.randint(0, 999999)`)
- `expires_at` DateTime
- `is_active`, `is_used`, `deleted_at` — soft delete + ciclo de vida
- ❌ **Falta:** unique constraint em `access_code` ativo (colisão possível)

## Fluxo end-to-end (PIN)

```
[Tutor app]                        [Backend]                     [Vet web]
     │                                 │                              │
     │  POST /access/generate-pin/     │                              │
     │  { pet: <uuid>, expires_at }    │                              │
     │ ───────────────────────────────►│                              │
     │  ◄─── { access_code: "482910" } │                              │
     │                                 │                              │
     │  (compartilha PIN com vet)      │                              │
     │ ─────────── WhatsApp / SMS ─────────────────────────────────► │
     │                                 │                              │
     │                                 │  POST /access/claim/         │
     │                                 │  { access_code: "482910" }   │
     │                                 │◄──────────────────────────── │
     │                                 │  ──► token vinculado ao vet  │
     │                                 │  ──► is_used = true          │
     │                                 │                              │
     │                                 │  GET /pets/<id>/             │
     │                                 │  GET /pets/<id>/health-records/
     │                                 │◄──────────────────────────── │
     │                                 │  ──► dados do prontuário     │
```

## Endpoints expostos hoje

Prefixo: `/api/v1/`

| Método | Path | Auth | App |
|---|---|---|---|
| POST | `/auth/token/` | — | accounts |
| POST | `/auth/token/refresh/` | — | accounts |
| POST | `/auth/register/` | — | accounts |
| GET/PUT | `/users/me/` | JWT | accounts |
| CRUD | `/pets/` | JWT | pets |
| CRUD | `/pets/<pet_pk>/health-records/` | JWT | health |
| POST | `/pets/<pet_pk>/health-records/upload-url/` | JWT | health (mock S3) |
| POST | `/access/generate-pin/` | JWT (TUTOR) | access |
| POST | `/access/claim/` | JWT (VET) | access |
| GET | `/api/docs/` | — | drf-spectacular (Swagger) |
| GET | `/api/redoc/` | — | drf-spectacular (ReDoc) |

## Permissões

Classe central: `pets.permissions.IsTutorOrHasVetAccess`

- TUTOR: só vê seus próprios pets
- VET: só vê pets onde tem `VetAccessToken` ativo, usado, não expirado, não soft-deleted

## i18n

- `LANGUAGE_CODE = "pt-br"`, mas suporta `en` e `es`
- Cliente envia header `Accept-Language: en` para mudar idioma
- Mobile e Web já injetam o header automaticamente via interceptor Axios

## Persistência de estado (clientes)

- **Mobile:** Zustand + AsyncStorage (`persist` middleware) — chave `petdiary-storage`
- **Web:** Zustand puro (sem persist), sessão se perde ao recarregar

## Containers (docker-compose.yml em `petDiary-backend/`)

| Serviço | Porta | Imagem |
|---|---|---|
| `db` | 5432 | postgres:15 |
| `api` | 8000 | build local (python:3.11-slim) |
| `mobile` | 8081, 19000-19002 | build local (node:20-alpine) |
| `web` | 5173 | build local (node:20-alpine) |
