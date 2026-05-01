# 06 — O que está faltando (checklist Fase 1)

> ⚠️ **Snapshot histórico (24/04 → 01/05).** A maior parte dos itens abaixo já foi
> entregue ao longo das sessões 1-4. **Para o estado atual atualizado, consulte
> [`PROGRESSO.md`](./PROGRESSO.md).**
>
> Itens ainda em aberto neste 2026-05-01 (após Fases A-G):
> - Tickets de suporte com modelo real (admin_panel hoje é stub — não tem `SupportTicket`)
> - Migrar mocks para integrações reais quando vierem credenciais (Asaas/MP, OpenAI, Resend, S3)
> - Cobertura de testes (pytest backend, jest/vitest web, RN testing-library mobile)
> - CI básico (GitHub Actions: install, migrate, test, ruff, prettier)
> - i18n web nas páginas restantes + i18n mobile (não tem react-i18next instalado)
> - Línguas pt-PT, fr, ar (RTL) — backend já tem LANGUAGES configurado
> - Etapa final de produção (domínio, hospedagem, EAS Build, deploy)

---

Lista crua. Use como checklist de PR.

## Backend

### Configuração
- [ ] `django-cors-headers` no requirements e settings
- [ ] Variável `CORS_ALLOWED_ORIGINS` por ambiente
- [ ] `.env.example` (hoje só tem `.env`)
- [ ] Logging configurado (hoje usa default)
- [ ] Health check endpoint (`/health/`)

### Models
- [ ] `Pet.birth_date` (Date, nullable)
- [ ] `Pet.avatar` (URLField ou ImageField)
- [ ] `Pet.notes` opcional para anotações genéricas do tutor
- [ ] Unique constraint em `VetAccessToken.access_code` ativo

### Endpoints faltando
- [ ] `POST /access/<id>/revoke/` — tutor revoga PIN
- [ ] `GET /access/active/` — tutor lista PINs ativos por pet
- [ ] `GET /access/recent/` — vet lista acessos recentes
- [ ] `POST /pets/<id>/health-records/process/` — dispara OCR/IA
- [ ] `POST /accounts/auth/logout/` — invalida refresh token (blacklist)

### Lógica
- [ ] `expires_at` default no `GeneratePinView` (1h se vazio)
- [ ] Validar role no register (`crmv` obrigatório se `role=VET`)
- [ ] Throttling em `/auth/token/` e `/access/claim/` (anti-bruteforce)

### Qualidade
- [ ] Testes unitários por app (pelo menos models + permissions)
- [ ] Testes de integração do fluxo PIN (generate → claim → access pet)
- [ ] Pre-commit (black, isort, flake8)
- [ ] CI básico (GitHub Actions: install, migrate, test)

---

## Mobile

### Telas faltando
- [ ] Login
- [ ] Cadastro (registrar tutor)
- [ ] Form criar pet
- [ ] Detalhe / edição de pet
- [ ] Form adicionar registro manual (NOTE/VACCINE/etc)
- [ ] Tela de gravar áudio (Speech-to-Text)
- [ ] Tela de PINs ativos (revogar)
- [ ] Tela de configurações (idioma, logout)

### Integrações
- [ ] Trocar `MOCK_PETS` por `GET /pets/`
- [ ] Trocar `MOCK_TIMELINE` por `GET /pets/<id>/health-records/`
- [ ] Trocar PIN fake por `POST /access/generate-pin/`
- [ ] Corrigir endpoints em `handleDocumentCapture`
- [ ] Tratar erros de rede (toast/banner)
- [ ] Loading states nas listas

### DX
- [ ] ESLint config (script existe, falta `.eslintrc`)
- [ ] Prettier
- [ ] `.env.example`
- [ ] React Query (ou SWR) para cache/refetch — atualmente cada tela faria fetch manual

### Produção
- [ ] EAS Build config (`eas.json`)
- [ ] Ícones e splash screen finais
- [ ] Tela de onboarding/intro

---

## Web

### Telas faltando
- [ ] Login do veterinário
- [ ] Cadastro do veterinário (com CRMV)
- [ ] Tela de "meus pets ativos" (alternativa ao PIN — vet já com acesso vê pets sem PIN)

### Integrações
- [ ] Corrigir `claim` (`access_code` em vez de `pin`) — bug #1
- [ ] Buscar pet real após claim (em vez de `MOCK_PET`)
- [ ] Buscar timeline real
- [ ] Persistir nota via API (em vez de só store local)
- [ ] `RecentAccessList` com dados reais (`/access/recent/`)
- [ ] Remover ou implementar de verdade `/access/simulate-revoke/` — bug #2

### Estado
- [ ] Adicionar `persist` no `authStore` (sessão sobrevive a F5)
- [ ] React Query para cache

### DX/Produção
- [ ] ESLint + Prettier
- [ ] `.env.example` já existe ✅
- [ ] Build de produção do Vite
- [ ] Deploy (decidir destino)

---

## Cross-cutting

### Documentação
- [ ] Diagrama de fluxo PIN no README
- [ ] Diagrama de arquitetura (containers, comunicação)
- [ ] Postman/Insomnia collection (ou usar Swagger mesmo)

### Privacidade & Segurança
- [ ] Termos de uso + política de privacidade
- [ ] LGPD: endpoint para tutor exportar/excluir dados do pet
- [ ] HTTPS em produção (Nginx/Caddy reverse proxy)
- [ ] Secrets fora de `.env` em produção (Vault, AWS Secrets Manager)

### Observabilidade
- [ ] Sentry (ou similar) nas 3 camadas
- [ ] Métricas básicas: nº pets, nº PINs gerados, nº claims
