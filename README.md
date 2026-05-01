# PetDiary

O **PetDiary** e uma plataforma unificada que resolve a fragmentacao dos dados de saude dos animais de estimacao. Ele nasce como um **Prontuario Medico Inteligente**, utilizando Inteligencia Artificial para facilitar a entrada de dados, e evolui estrategicamente para se tornar uma **Rede Social Nichada e Segura**, estritamente focada em pets.

---

## Os Dois Usuarios Principais

A plataforma possui duas jornadas distintas e complementares:

### Tutor (Mobile)
Busca conveniencia e organizacao. Usa o aplicativo no celular para fotografar receitas, gravar sintomas em audio, ser lembrado de vacinas e ter o historico do pet sempre no bolso.

### Veterinario (Web)
Busca densidade de dados e tomada de decisao rapida. Usa um portal em tela grande (desktop) para inserir um **PIN temporario** fornecido pelo tutor, acessando a linha do tempo clinica completa do paciente de forma estruturada.

---

## Roadmap Estrategico (As 3 Fases)

A divisao em fases existe para mitigar riscos tecnicos (custos de IA e servidores) e validar o engajamento do usuario antes de escalar.

### Fase 1: O MVP Clinico (Foco Atual)

- **Objetivo:** Criar o habito de uso no tutor resolvendo uma dor real (perda de historico medico).
- **Entregaveis:** App Mobile para o tutor, Portal Web para o veterinario, e geracao do "PIN de Acesso Unico".
- **IA Aplicada:** Focada em utilidade — OCR para ler receitas antigas e Speech-to-Text para diario de sintomas falado.

### Fase 2: Automacao e Filtros de Seguranca

- **Objetivo:** Tornar o sistema proativo e preparar o terreno para a rede social.
- **Entregaveis:** Alertas automatizados de vacinas/vermifugos baseados na idade/raca.
- **IA Aplicada:** Visao Computacional. A IA analisa todas as fotos enviadas e bloqueia imagens onde humanos sao o foco principal.

### Fase 3: Expansao Social (A Virada de Chave)

- **Objetivo:** Transformar a base de tutores engajados em uma comunidade ativa.
- **Entregaveis:** Perfis publicos dos pets, feed de fotos/videos curtos, likes e sistema de comentarios (com traducao automatica).
- **IA Aplicada:** Moderacao rigorosa e invisivel atuando em tempo real no feed.

---

## Estrutura do Repositorio

```
petDiary/
├── docker-compose.yml          # Orquestra db + redis + api + worker + beat + web (+mobile via perfil)
├── .pre-commit-config.yaml     # Hooks: ruff (backend), prettier (front), detect-secrets
├── ai-memory/                  # Memoria viva do projeto (PROGRESSO.md, decisoes, specs)
│
├── petDiary-backend/backend/   # API REST (Python/Django)
│   ├── petdiary/               # settings, urls, celery, healthcheck, middleware
│   ├── accounts/               # User (TUTOR/VET/ADMIN), JWT custom (login unico vet),
│   │                             reset-password, change-password, tasks Celery
│   ├── pets/                   # CRUD de pets + PetMember (OWNER/CARETAKER co-tutores)
│   ├── health/                 # Registros de saude + anexos (storage abstrato local/S3)
│   ├── access/                 # PIN temporario + revogacao + historico
│   ├── audit/                  # AuditLog automatico via signals
│   ├── billing/                # Subscription, Coupon, gateway abstrato (mock/Asaas/MP)
│   ├── admin_panel/            # Endpoints SaaS admin (KPIs, users, coupons, tickets)
│   └── locale/                 # i18n backend (6 linguas configuradas)
│
├── petDiary-frontend-mobile/   # App do Tutor (React Native/Expo SDK 54)
│   └── src/
│       ├── screens/            # Login, HomeTutor, PetDashboard, AccountSettings,
│       │                         SubscriptionDashboard, HelpCenter
│       ├── navigation/         # Stack autenticado
│       ├── store/              # Zustand + AsyncStorage
│       ├── services/api.ts     # Axios + interceptors
│       ├── theme/              # Design system (paleta, raios, sombras, fontes)
│       └── types/
│
└── petDiary-frontend-web/      # Portal universal Tutor + Vet + Admin (React 19 + Vite + Tailwind 4)
    └── src/
        ├── pages/              # Login, Register, ForgotPassword, ResetPassword,
        │                         TutorDashboard, VetEntry, ClinicalView,
        │                         AccountSettings, ChangePassword, admin/*
        ├── components/         # PinInput, AttachmentsList (drag-drop+webcam),
        │                         AuditTimeline, MembersSection, VetAccessSection,
        │                         InviteMemberModal, LanguageSwitcher, etc
        ├── i18n/locales/       # pt-BR, en, es (estrutura para pt-PT, fr, ar/RTL)
        ├── store/              # authStore com storage dinamico (local/session)
        └── services/           # Axios + logger estruturado
```

---

## Stack Tecnologica

| Camada | Tecnologia | Papel |
|---|---|---|
| **Backend** | Python 3.11 + Django 5 + DRF + SimpleJWT (token blacklist) | Regras de negocio, autenticacao JWT (rotacao + blacklist), API REST |
| **Banco de Dados** | PostgreSQL 15 | Integridade dos dados de saude, historico de permissoes |
| **Async** | Celery 5 + Redis 7 + django-celery-beat | Worker (concurrency=2) + beat com DatabaseScheduler para tasks periodicas |
| **Observabilidade** | structlog + Sentry-ready + `/livez` `/healthz` | Logs JSON em PROD, healthcheck k8s-style |
| **Seguranca** | DRF ScopedRateThrottle + JWT rotation + blacklist | Rate limit por escopo em endpoints sensiveis |
| **Mobile (Tutor)** | React Native (Expo SDK 54) + Zustand + AsyncStorage | App com captura, assinatura PRO, central de ajuda |
| **Web (Universal)** | React 19 (Vite) + Tailwind 4 + Zustand + react-i18next | Portal Tutor + Vet + Admin (3 roles, mesma SPA) |
| **Documentacao API** | drf-spectacular (OpenAPI) | Geracao automatica de schema da API |
| **Infraestrutura** | Docker Compose unificado (perfis local/dev/hom/prod/mobile) | Orquestracao de todos os servicos |
| **Integracoes** | Mock-first toggleable (`*_MODE`/`*_PROVIDER`) | Gateway pagamento, IA (OpenAI/Whisper), email, S3 — flips de env quando vier credencial |
| **DX** | pre-commit (ruff + prettier + detect-secrets) + ai-memory/ | Hooks padronizam codigo; memoria viva guia novas sessoes |

---

## Como Rodar o Projeto

### Pre-requisitos

- Docker e Docker Compose instalados

### Subindo todos os servicos

```bash
docker compose --env-file .env.local up --build

# Com mobile (Expo Go no celular):
docker compose --env-file .env.local --profile mobile up
```

Isso inicia:
- **PostgreSQL** na porta `5432`
- **Redis** na porta `6379`
- **API Django** na porta `8000`
- **Celery worker + beat** (sem porta exposta — fala com Redis interno)
- **Portal Web (Vite)** na porta `5173`
- **App Mobile (Expo)** na porta `8081` (apenas com `--profile mobile`)

### Endpoints de saude

- `GET /livez/`  — liveness (200 se o processo responde)
- `GET /healthz/` — readiness (testa Postgres + Redis; 200/503 com detalhe)

### Hooks de qualidade

```bash
pip install pre-commit && pre-commit install
pre-commit run --all-files
```

---

## Licenca

Projeto privado. Todos os direitos reservados.
