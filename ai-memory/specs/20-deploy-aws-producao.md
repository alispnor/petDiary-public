# Spec 20 — Deploy AWS Produção (DevOps + CI/CD + Mobile Release)

> **Pedido do Ali (2026-05-02):** salvar 6 tarefas de DevOps (AWS ECS, Terraform,
> Git Flow, GitHub Actions backend, hosting web, CI/CD mobile) para fazer depois,
> com avaliação de "vale a pena?" e ordenação por importância.
>
> Status: **Pendente — aguardando decisão humana sobre Railway vs AWS** (ver §Análise).

---

## ⚠️ Mismatch crítico nas tarefas

As 6 prompts originais foram escritas assumindo **Node.js + BullMQ** como backend.
**O petDiary é Django 5 + DRF + Celery + Redis + Postgres** (confirmado em
`backend/requirements.txt`). Toda referência a:

- `Dockerfile Node.js` → trocar por Python 3.12-slim + gunicorn/uvicorn
- `BullMQ Worker` → trocar por **Celery worker** + **Celery beat**
- `npm run migrate` → trocar por **`python manage.py migrate`**
- `package.json scripts` → trocar por **`manage.py` commands**

O `Dockerfile` em `petDiary-backend/backend/Dockerfile` já existe com base Python
e é ponto de partida. Spec 06 (`06-fila-jobs-bullmq-celery.md`) já documenta a
escolha de Celery sobre BullMQ.

**Resto do stack bate com o prompt:**
- ✅ React (web), React Native + Expo (mobile)
- ✅ PostgreSQL (RDS-compatible)
- ✅ Redis (ElastiCache-compatible)
- ✅ S3 para anexos (já há stub em `health/services/storage.py:S3StorageBackend`)

---

## 🧭 Análise: vale a pena ir direto pra AWS ECS Fargate?

### Estado atual (PENDENCIAS-HUMANAS item 2)
A recomendação durável já era **Railway** (~US$ 30/mês) como ponto de partida e
**AWS ECS** apenas "quando passar de 10k usuários" (US$ 100+/mês).

### Trade-offs

| Critério | Railway/Fly | AWS ECS Fargate + Terraform |
|---|---|---|
| Tempo até 1º deploy | 1-2h | 2-4 dias (incluindo IAM/VPC/SG) |
| Custo mensal MVP | US$ 25-50 | US$ 100-250 |
| Curva de aprendizado | Quase zero | Alta (VPC, SG, IAM, ECR, OIDC) |
| Manutenção | Zero | Você mantém Terraform state |
| Profissional p/ investidor | Médio | Alto |
| Escala 10k+ usuários | Trava | Trabalha bem |
| Vendor lock-in | Alto (precisaria refazer) | Baixo (Terraform = portável) |

### Recomendação honesta
**Para MVP/validação de produto:** Railway. Vai live em horas, código já está
docker-ready, integra bem com `docker-compose.yml` existente.

**Para "saúde + dados clínicos sérios + ambição multi-país":** AWS ECS faz sentido
desde cedo porque:
1. RDS Multi-AZ é exigência de fato pra LGPD/HIPAA-style
2. Backup/PITR managed
3. Você ganha argumento de "infra séria" ao falar com clínicas
4. Spec 19 (landing pública multi-idioma) sugere ambição internacional

**Decisão sugerida:** começar Railway por 1-3 meses (até validar produto + ter os
itens 5-9 da PENDENCIAS-HUMANAS resolvidos: Asaas, OpenAI, Resend, S3, Sentry).
Migrar para AWS quando tiver tração comprovada OU quando entrar uma clínica B2B
com requisitos de compliance.

---

## 📋 As 6 tarefas — reordenadas por valor/esforço

### 🟢 ALTÍSSIMO valor / baixo esforço — fazer ANTES de qualquer infra

#### T3. Git Flow + Branch Protection + Conventional Commits
**Por que primeiro:** zero dependência externa, custo R$ 0, beneficia o projeto
em qualquer host. Toda PR seguinte fica padronizada.

**Escopo:**
- Modelo híbrido: `master` (prod) + `dev` (staging) p/ backend e web; tags
  `release/v1.x.x` p/ mobile (React Native segue release branch porque cada
  release vira um build assinado pra Play/App Store)
- Branch Protection no GitHub:
  - `master`: 1 aprovação, status checks obrigatórios (smoke tests CI já
    existe em `.github/workflows/smoke-tests.yml`), proibir push direto,
    proibir force-push, exigir branch atualizada
  - `dev`: 1 aprovação, status checks
- Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`
  + `BREAKING CHANGE` no footer. Hoje o projeto **já segue isso de fato** (ver
  `git log` recente). Formalizar em CONTRIBUTING.md + commitlint hook.
- Changelog automático: `release-please-action` ou `semantic-release` no GitHub
  Actions gera CHANGELOG.md + tags semver a cada merge em master

**Esforço:** 2-3h. **Bloqueia nada.**

---

### 🟢 ALTO valor / médio esforço

#### T6. CI/CD Mobile (React Native + Expo EAS)
**Por que cedo:** mobile já tem `eas.json` faltando — sem isso não dá pra
publicar. App stores (PENDENCIAS-HUMANAS itens 11-12) precisam disso.

**Escopo:**
- Secrets no GitHub:
  - `EXPO_TOKEN` (gerar em expo.dev/settings/access-tokens)
  - `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_ID` + `ASC_APP_ID`
  - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (JSON do service account)
- `eas.json` com perfis:
  - `preview`: `.apk` interno via TestFlight/Internal Testing
  - `production`: `.aab` (Android App Bundle) + `.ipa` assinado
- `.github/workflows/mobile-release.yml`:
  - Trigger: tag `mobile-v*` ou release manual
  - `eas build --non-interactive --platform all --profile production`
  - `eas submit --platform all --non-interactive` (após build)
- `versionCode`/`buildNumber` automáticos: usar `expo-build-properties` +
  `appVersionSource: "remote"` no `eas.json` — EAS Cloud incrementa sozinho

**Pré-requisito humano:** PENDENCIAS-HUMANAS itens 11-12 (Apple Developer
US$ 99/ano + Google Play US$ 25 vitalício)

**Esforço:** 4-6h código + 2-7 dias úteis (aprovação Apple D-U-N-S).

---

#### T5. Frontend Web — S3 + CloudFront (apenas se for AWS)
**Vale para AWS.** Se for Railway, este passo não existe (Railway/Vercel servem
o `dist/` SPA direto).

**Escopo (se AWS):**
- Terraform: bucket S3 estático + CloudFront com OAC + ACM (cert grátis em
  `us-east-1` — exigência CloudFront)
- `.github/workflows/deploy-web.yml`: build com `VITE_API_URL` injetado por env
  → `aws s3 sync dist/ s3://...` → `aws cloudfront create-invalidation
  --paths "/*"`
- Custo: ~US$ 1-5/mês (S3 + CloudFront para tráfego MVP)

**Esforço:** 4-6h. **Pode esperar:** Railway/Vercel resolve igual em 30 min.

---

### 🟡 MÉDIO valor / alto esforço — só após decisão Railway↔AWS

#### T1. Dockerfile produção multi-stage (API + Worker)
**ADAPTAR para Django/Celery** — não Node/BullMQ.

**Escopo (versão Python correta):**
- Multi-stage: `builder` (instala deps + compila) → `runtime` (slim + apenas
  artefatos)
- Mesmo image, `CMD` diferente:
  - API: `gunicorn petdiary.wsgi --workers 4 --bind 0.0.0.0:8000`
  - Worker: `celery -A petdiary worker -l info`
  - Beat: `celery -A petdiary beat -l info`
- `entrypoint.sh` que roda `python manage.py migrate --noinput` antes de
  iniciar (apenas no container API; worker/beat skipam)
- Healthcheck endpoint: `/healthz/` já existe no Django
- Usuário não-root + `WORKDIR /app` + `COPY --chown=app:app`
- `docker-compose.prod.yml`: declarar **api**, **worker**, **beat** (Celery
  Beat é serviço separado — Spec 17 usa beat para Reminders)

**Esforço:** 3-4h. **Não bloqueia Railway** (Railway lê `docker-compose.yml`
direto, mas vai querer essa otimização eventualmente).

---

#### T4. GitHub Actions backend deploy (ECS)
**Faz sentido apenas se T2 (Terraform/AWS) já estiver feito.**

**Escopo:**
- OIDC com AWS (sem chave estática) — IAM role assumida pelo workflow
- Build → push para ECR (tag = SHA do commit)
- **Standalone ECS task** para `python manage.py migrate --noinput`
- Atualizar Task Definition (API + Worker + Beat) → ECS update-service com
  rolling deploy
- Secrets Manager para `.env.prod` (sem manualmente colar no painel)

**Esforço:** 6-8h. **Bloqueado por T2.**

---

### 🔴 ALTO esforço / decisão estratégica primeiro

#### T2. Terraform AWS (VPC + RDS + ElastiCache + S3 + ECS + IAM)
**Esta é a decisão grande.** Não fazer sem antes:
1. Decidir definitivamente Railway vs AWS (§Análise acima)
2. Resolver PENDENCIAS-HUMANAS item 8 (conta AWS criada)
3. Ter ~3 dias dedicados (Terraform certo demora; errado custa caro)

**Escopo (se decisão = AWS):**
- `network.tf`: VPC + 2 subnets públicas + 2 privadas + NAT + IGW
- `data.tf`: RDS Postgres 16 (Multi-AZ em prod, single em hom) + ElastiCache
  Redis (cluster mode disabled p/ Celery)
- `storage.tf`: bucket S3 + lifecycle rules + CORS
- `compute.tf`: ECS cluster Fargate + ALB + target groups + service definitions
- `security.tf`: SGs em camadas (ALB → ECS → RDS/Redis)
- `iam.tf`: OIDC provider + role para GitHub Actions
- `terraform.tfvars` por ambiente (dev/hom/prod)

**Custo mensal estimado (prod, baixa carga):**
- RDS db.t4g.small Multi-AZ: ~US$ 50
- ElastiCache cache.t4g.micro: ~US$ 15
- ECS Fargate (1 API + 1 worker + 1 beat, 0.5 vCPU/1GB cada): ~US$ 35
- ALB: ~US$ 18
- NAT Gateway: ~US$ 35
- S3 + CloudWatch + data transfer: ~US$ 10
- **Total: ~US$ 165/mês** (vs Railway US$ 30)

**Esforço:** 16-24h. **Maior bloqueador.**

---

## 🎯 Sequência sugerida pelo Claude

| Ordem | Tarefa | Por quê | Bloqueia? |
|---|---|---|---|
| **1** | T3 — Git Flow + Branch Protection + Conventional Commits | Custo zero, beneficia tudo depois | Não |
| **2** | T6 — CI/CD Mobile EAS | Pré-req p/ stores; independente de host | Apple/Google enrollment |
| **3** | **DECISÃO HUMANA: Railway ou AWS?** | Define todo o resto | Sim |
| **4a** | (Se Railway) Fazer 1º deploy homolog (PENDENCIAS-HUMANAS item 4) | MVP em 1-2h | — |
| **4b** | (Se AWS) T1 — Dockerfile prod adaptado p/ Django | Pré-req T2 e T4 | — |
| **5** | (Se AWS) T2 — Terraform infra | Maior peça | — |
| **6** | (Se AWS) T4 — GitHub Actions ECS deploy | Automação | T2 |
| **7** | (Se AWS) T5 — Web S3+CloudFront | Bônus performance | T2 |

---

## 🧑‍💼 Pendências humanas a adicionar em PENDENCIAS-HUMANAS.md

1. **Decisão estratégica:** Railway/Fly (MVP) vs AWS ECS (B2B/escala) — ver
   trade-offs nesta spec
2. **Apple Developer Program** — já consta como item 11
3. **Google Play Console** — já consta como item 12
4. **GitHub Actions:** habilitar OIDC provider (1x clicar) e configurar secrets
   (após decisão de host)
5. **Se AWS:** criar conta + billing alarm (US$ 50/100/200) + MFA root + IAM admin
6. **Se Railway:** já tem template em PENDENCIAS-HUMANAS §2; nada novo

---

## 📌 Material original (preservado)

As 6 prompts originais do Ali, sem edição, ficam em
`ai-memory/specs/20-prompts-originais.md` para referência caso queira reaproveitar
em outro projeto Node.js futuro.

---

## ✅ Definição de pronto

Esta spec está fechada quando:
- [ ] Ali bater martelo: Railway agora vs AWS direto
- [ ] T3 (Git Flow) executado e CONTRIBUTING.md commitado
- [ ] T6 (mobile CI/CD) com primeiro build de produção saindo
- [ ] Caminho Railway OU AWS escolhido tem 1º deploy de homologação verde
- [ ] PENDENCIAS-HUMANAS atualizado com decisão tomada
- [ ] PENDENCIAS-ORDENADAS aponta esta spec como concluída
