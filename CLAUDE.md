# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Template base para futuros projetos (Portuguese/pt-BR locale, BRL currency). Monorepo com quatro serviços Docker: API (Node.js 22/Express), Frontend (Angular 19), MySQL 8.0 e Caddy (reverse proxy com TLS automático).

## antes de todo 
ler contudo de pasta ai-memory

## Development Commands

### Docker (from project root)
```bash
docker compose --env-file .env.local up --build                     # Local dev with hot reload
docker compose --env-file .env.dev --profile dev up --build          # Development
docker compose --env-file .env.hom --profile hom up --build          # Homologation
docker compose --env-file .env.prod --profile prod up --build -d     # Production (detached)

docker compose --env-file .env.local up api          # Single service
docker compose logs -f api                           # Follow logs
docker compose down                                  # Stop all
docker compose down -v                               # Stop + remove volumes (DB reset)
```

Local URLs: API http://localhost:3000, Frontend http://localhost:4200, MySQL localhost:3306

### API (from `api/app/`)
```bash
npm run local       # Dev server with nodemon + TypeScript (ts-node)
npm run build       # Babel transpile src/ → build/
npm start           # Build then run compiled output
npm test            # Jest tests (100s timeout, tests in src/test/)
```

### Frontend (from `frontend/app/`)
```bash
npm start           # Dev server on port 4200 (ng serve)
npm run build:dev   # Dev build
npm run build:hom   # Homologation build
npm run build:prod  # Production build
ng test             # Karma/Jasmine tests
```

## Architecture

### Backend (`api/app/src/`)

**Bootstrap flow** (`index.ts` → `config/app.ts`): Express init → JSON/URL parsers (50MB limit) → CORS/Helmet/Compression → Routes → Swagger (`/api-docs`) → Sequelize DB connect + sync → Create `./logs`, `./private`, `./public` dirs → LogsMiddleware (Winston, logs to `logs/http/http.log`) → Cron jobs (AutobemCron, MutualizoCron) → Listen on port 3000.

**Request pipeline**: All routes under `/api/private/` go through: `keycloakMiddleware` (JWT validation via public key signature verification, returns 412 on failure) → `restricaoAcessoSistemaMiddleware` (institution-level access, MASTER users bypass, returns 405 if denied) → Controller.

**Layer pattern**: Single centralized `routes/routes.ts` → Controllers → Services → Models (Sequelize). External integrations live in `providers/` (Autobem, Mutualizo, MotorBusca, GuepTech, InstituicaoRestricaoSistema). Scheduled jobs in `crons/`.

**Database**: Sequelize ORM with `sync({ alter: true })` auto-migration (no migration files). Custom timestamp columns: `data_cadastro` / `data_atualizacao`. Models use `freezeTableName: true`, UUID primary keys with UUIDV4 defaults. File uploads use memory storage via Multer (50MB max, allowed: pdf/jpg/jpeg/png/xml/xlsx/docx).

**Domain entities**: Chamado (tickets/cases with protocol numbers), ChamadoPrestador (service providers), ChamadoArquivo (file attachments), ManualAssistencia (assistance manuals), Instituicao (institutions).

**Domain enums** (in `enums/`): ChamadoStatus (ABERTO, AUTORIZADO, EM_ANALISE, EM_ANDAMENTO, RESOLVIDO, etc.), PrestadorStatus, ChamadoCategoria, ChamadoNaturezaEvento, ChamadoApoliceIntegracaoStatus (PENDENTE, SUCESSO, ERRO), FormaPagamento, TipoPagamento.

**API route conventions**: All protected endpoints follow `/api/private/{resource}/{action}`. Examples:
- `POST /private/chamado/filtro` — Filter/search tickets
- `GET /private/chamado/:cod_chamado` — Get single ticket
- `POST /private/chamados/:codChamado/arquivos` — Upload files (multipart)
- `GET /private/chamados/arquivos/download-url` — Get presigned S3 download URL
- `POST /private/manual-assistencia/filtro` — Filter manuals

**Key integrations**: AWS S3 for file storage (presigned URLs for downloads), Puppeteer for PDF generation, cron jobs (AutobemCron every 1 minute, MutualizoCron for data sync), Winston for structured logging.

### Frontend (`frontend/app/src/`)

**Module structure**: AppModule → lazy-loaded feature modules. Default route redirects to `/chamado`. All routes protected by `AuthGuard`.
- `modules/chamado/` — Main ticket/case management (list, create, view, details)
- `modules/manual-assistencia/` — Assistance manual management

**Core module** (`core/`): Keycloak init factory (check-sso strategy), AuthGuard (validates `tipoEntidadeEmpresa` + `tipoPerfilUsuario` from route `data.accessRules`), JwtInterceptor (attaches Bearer token for API domain requests), ErrorInterceptor (401 → logout, other errors → SweetAlert2 modal), AccessRulesService.

**Shared module** (`shared/`): Reusable form input components (CPF, CNPJ, email, date, UF, password, text-editor), MapaComponent (Leaflet), PaginatorComponent (Portuguese labels), MaterialAngularModule wrapper, input masking (ngx-mask), currency formatting (ng2-currency-mask for BRL).

**TypeScript path aliases**: `@modules/*`, `@shared/*`, `@core/*` (configured in `tsconfig.json`).

**Environment configs**: `environments/` directory with per-target files containing API URL and Keycloak realm/clientId. Build configs in `angular.json` handle file replacements.

### Docker

Multi-stage Dockerfiles: `local` target (hot reload with volume mounts) vs `deploy`/`production` target (optimized builds). API container uses Node 22-slim with Chromium for Puppeteer PDF generation. Frontend production uses nginx:alpine to serve built dist. `wait-for-it.sh` ensures MySQL is ready before API starts. All services on bridge network `rede`. Timezone: America/Sao_Paulo.

Caddy adds security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) and CSP policies. Access logs with 10MB rollover, 72h retention.

## Key Environment Variables

Environment config lives in `.env.local`, `.env.dev`, `.env.hom`, `.env.prod`. Each file contains both Docker Compose variables and API runtime variables (injected via `env_file` in docker-compose).

**Important distinctions**:
- `MYSQL_*` vars configure the MySQL container itself; `DB_*` vars configure Sequelize's connection to MySQL — they must match but serve different purposes
- `API_TARGET` (`local`/`deploy`) and `FRONTEND_TARGET` (`local`/`production`) control which Dockerfile stage is built
- `COMPOSE_PROFILES` activates Caddy for non-local environments
- `API_VOLUMES`/`FRONTEND_VOLUMES` toggle between source mounts (local hot reload) and `/dev/null` (deploy)

**External service vars**: Keycloak (auth), AWS S3 (file storage), GuepTech/Autobem/Mutualizo/MotorBusca (providers), `RESTRICAO_SISTEMA_CHAVE` (system access key). See `.env.local` for the full list.

## Auth & Access Control

Keycloak-based JWT authentication. Roles: ADMIN, OPERACIONAL, CS, GESTOR_OPERACIONAL. Institution entity types: MASTER, SEGURADORA, COOPERATIVA, ASSOCIACAO, CORRETORA, GERENCIADORA_DE_RISCO. Routes define `accessRules` as arrays of `{entity, role}` pairs checked by AuthGuard. The `restricaoAcessoSistemaMiddleware` enforces institution-level restrictions on all backend protected routes (MASTER bypasses).

## Testing

**API**: Jest with ts-jest preset, 100s timeout, test root at `api/app/src/test/`. Run with `npm test` from `api/app/`.

**Frontend**: Karma + Jasmine. Test files colocated with source (`.component.spec.ts`, `.service.spec.ts`). Run with `ng test` from `frontend/app/`.

## Linting

API uses ESLint with `@typescript-eslint` and Google style base (max line length 255, tab width 2, no JSDoc required). Config at `api/app/.eslintrc.json`. Frontend has no separate linting config — relies on TypeScript strict mode.

## final de cada tarfea
atualizar contudo de pasta ai-memory e salvar as pendencias