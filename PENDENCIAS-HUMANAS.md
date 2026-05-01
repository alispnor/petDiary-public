# 🧑‍💼 Pendências Humanas — petDiary

> Documento prático: o que **só você (Ali)** consegue fazer porque envolve
> contas externas, dinheiro, decisões de negócio ou acesso físico.
> Atualizado: **2026-05-01**, após Fases A–G + bugs #6/#8/#11 fechados.

O código está pronto para produção do lado técnico. O que falta agora é
**configurar o mundo externo** para o sistema funcionar de verdade.

---

## Sumário (ordem sugerida de execução)

| # | Pendência | Tempo estimado | Custo |
|---|---|---|---|
| 1 | Comprar domínio `petdiary.com.br` | 30 min | R$ 40/ano |
| 2 | Escolher e contratar hospedagem (servidor/cloud) | 1h | R$ 50–200/mês |
| 3 | Apontar DNS para o servidor | 15 min (+ até 24h propagação) | grátis |
| 4 | Configurar `.env.homolog` e fazer 1º deploy de homologação | 2h | — |
| 5 | Criar conta de pagamento (Asaas ou Mercado Pago) | 1–3 dias úteis | R$ 0 (cobra % por transação) |
| 6 | Criar conta OpenAI + cartão | 30 min | pré-pago, ~R$ 50 inicial |
| 7 | Criar conta Resend (ou SMTP corporativo) para emails | 30 min | grátis até 3k emails/mês |
| 8 | Criar bucket AWS S3 + IAM user | 1h | ~R$ 5/mês inicial |
| 9 | Criar conta Sentry (observabilidade) | 30 min | grátis até 5k erros/mês |
| 10 | Substituir mocks por integrações reais (env flags) | 1h por integração | — |
| 11 | Apple Developer Program + Google Play Console | 2–7 dias úteis | US$ 99/ano + US$ 25 vitalício |
| 12 | EAS Build + submissão das lojas | 1 semana com revisões | — |
| 13 | Política de privacidade + termos de uso (LGPD) | 4–8h ou advogado | R$ 0 ou R$ 1k–5k |

**Custo total estimado ano 1:** ~R$ 1.500 a R$ 3.000 (depende de hosting e volume).

---

## 1. Domínio

### O que fazer
1. Acesse [registro.br](https://registro.br) (registrador oficial `.com.br`) ou [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (`.com` mais barato).
2. Pesquise `petdiary.com.br` (ou alternativa).
3. Compre — geralmente R$ 40/ano no .br, US$ 9–12/ano no .com.
4. Anote: domínio comprado + credenciais de acesso ao painel DNS.

### Decisões a tomar
- `.com.br` (mais nacional) ou `.com` (global)?
- Subdomínios planejados:
  - `petdiary.com.br` → site institucional (futuro)
  - `app.petdiary.com.br` → web SPA (tutor/vet/admin)
  - `api.petdiary.com.br` → backend Django
  - `hom.petdiary.com.br` + `api.hom.petdiary.com.br` → homologação

### Onde isso aparece no código
- `.env.prod`: `API_DOMAIN`, `WEB_DOMAIN`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `VITE_API_URL`, `EXPO_PUBLIC_API_URL`, `FRONTEND_BASE_URL`, `EMAIL_FROM`
- `caddy/Caddyfile` lê `{$API_DOMAIN}` e `{$WEB_DOMAIN}` automaticamente

---

## 2. Hospedagem

### Opções recomendadas (do mais simples ao mais profissional)

| Opção | Vantagem | Custo (estimado) | Quando escolher |
|---|---|---|---|
| **Railway.app** | Zero config, deploy via Git push, banco gerenciado | ~US$ 20–50/mês | MVP + primeiros usuários |
| **Fly.io** | Multi-região, Docker nativo, postgres gerenciado | ~US$ 25–60/mês | quer escalabilidade fácil |
| **DigitalOcean Droplet + Managed Postgres** | Controle total + Postgres gerenciado | ~US$ 30/mês | quer aprender devops |
| **AWS ECS + RDS** | Mais robusto, mais caro, mais complexo | US$ 100+/mês | quando passar de 10k usuários |

### Recomendação para começar
**Railway** com Postgres + Redis gerenciados (cliques no painel) e o repo apontando para esta pasta. Custa ~US$ 30/mês, sobe em 1h.

### O que precisa configurar no provedor
1. Servidor com Docker + Docker Compose (ou plataforma que suporte os 6 serviços)
2. **Postgres gerenciado** (NÃO usar o container `db` do compose em prod — perde dados se restartar)
3. **Redis gerenciado** ou container com persistência AOF habilitada
4. Volumes persistentes para `/var/log/caddy` e `/data` (Caddy certs)
5. Variáveis de ambiente do `.env.prod` (não sobir o arquivo — colar no painel do provedor)
6. **Backup automático diário** do Postgres (todo provedor gerenciado oferece)

### Como subir no servidor (após domínio + DNS apontado)
```bash
# Na máquina local, push pro git remoto
git push origin master

# No servidor (após clonar o repo)
cd petDiary
# Cole o .env.prod com valores reais (ou use secrets manager)
docker compose --env-file .env.prod --profile prod up --build -d

# Verificar healthcheck
curl https://api.petdiary.com.br/healthz/
```

---

## 3. DNS

Após comprar domínio e ter o IP do servidor:

### Registros para criar no painel de DNS
```
Tipo  Nome                    Valor (IP do servidor)   TTL
A     petdiary.com.br         123.45.67.89             3600
A     app.petdiary.com.br     123.45.67.89             3600
A     api.petdiary.com.br     123.45.67.89             3600
A     hom.petdiary.com.br     123.45.67.89             3600
A     api.hom.petdiary.com.br 123.45.67.89             3600
```

### Verificação
```bash
dig +short api.petdiary.com.br
# Deve retornar o IP do servidor
```

A propagação pode levar até 24h. Caddy vai emitir certificados Let's Encrypt
automaticamente assim que o DNS estiver apontando.

### Portas
Abra **80** e **443** no firewall do servidor (Caddy precisa).
Postgres (5432), Redis (6379), API (8000), Web (5173) NÃO devem ser expostas externamente — Caddy faz o proxy interno.

---

## 4. Primeiro deploy de homologação

### Pré-requisitos
- Domínio comprado (item 1)
- Servidor contratado (item 2)
- DNS apontando para `hom.petdiary.com.br` e `api.hom.petdiary.com.br` (item 3)

### Passo a passo
1. SSH no servidor
2. Clone o repo: `git clone <seu-fork> petDiary`
3. `cd petDiary && cp .env.homolog .env.homolog.real`
4. Edite `.env.homolog.real`:
   - Gere `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
   - Defina senha do Postgres
5. `docker compose --env-file .env.homolog.real --profile hom up --build -d`
6. Aplique migrations: `docker compose exec api python manage.py migrate`
7. Crie superuser ADMIN: `docker compose exec api python manage.py createsuperuser`
8. Acesse `https://hom.petdiary.com.br` no browser
9. Teste login + cadastro + criar pet + gerar PIN

**Em homolog os mocks estão ativos** — não precisa de credenciais externas para testar fluxos.

---

## 5. Pagamento (Asaas ou Mercado Pago)

### Decisão: Asaas vs Mercado Pago

| Critério | Asaas | Mercado Pago |
|---|---|---|
| Taxa PIX | 0,99% | 0,99% |
| Taxa cartão | 4,99% + R$ 0,49 | 4,98% + R$ 0,49 |
| Onboarding | Documentos PJ + dados bancários | Mesmo |
| API | REST simples, doc PT-BR | REST, ecossistema maior |
| **Recomendação** | **Asaas** (mais simples para SaaS pequeno) | MP se já tem conta |

### O que fazer
1. Crie conta PJ em [asaas.com](https://www.asaas.com) (precisa CNPJ — Ali já tem Guep PJ)
2. Documentos: contrato social + CPF dos sócios + comprovante endereço
3. Aprovação leva 1-3 dias úteis
4. No painel:
   - Pegue API Key de produção (`Configurações > Integrações > API Key`)
   - Configure webhook URL: `https://api.petdiary.com.br/api/v1/webhooks/gateway/`
   - Gere o Webhook Secret (HMAC) — Asaas chama de "Token de autenticação"
5. Substitua no `.env.prod`:
   - `BILLING_GATEWAY_MODE=asaas`
   - `GATEWAY_API_KEY=<sua-api-key>`
   - `GATEWAY_WEBHOOK_SECRET=<seu-webhook-secret>`

### O que falta no código
- `billing/services/gateway.py:AsaasGateway` é stub (`raise NotImplementedError`).
  Precisa implementar `create_subscription`, `cancel_subscription`, `verify_webhook`
  com chamadas REST reais para Asaas. Mas a estrutura está pronta — só preencher os métodos.

---

## 6. OpenAI (IA)

### O que fazer
1. Crie conta em [platform.openai.com](https://platform.openai.com)
2. Adicione cartão de crédito (pré-pago, US$ 50 inicial é seguro)
3. Crie API Key (`API keys > Create new`)
4. Anote a key (mostrada só uma vez)

### Custos estimados
- GPT-4o-mini: US$ 0.15 / 1M tokens entrada (extração de receita ~500 tokens = R$ 0.0004 por receita)
- Whisper: US$ 0.006 / minuto de áudio
- Para 1000 usuários ativos enviando 10 docs/mês cada → ~R$ 50/mês

### Configuração no `.env.prod`
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### O que falta no código
- `health/services/ai.py:OpenAIService` é stub. Implementar com `openai` SDK
  para chamar `client.chat.completions.create` e `client.audio.transcriptions.create`.

---

## 7. Email transacional (Resend)

### O que fazer
1. Crie conta em [resend.com](https://resend.com) (grátis até 3.000 emails/mês)
2. Verifique o domínio `petdiary.com.br` (cole DNS records SPF/DKIM no painel do registrador)
3. Crie API Key (`API Keys > Create`)

### Configuração no `.env.prod`
```
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@petdiary.com.br
```

### O que falta no código
- `accounts/services/email.py:ResendEmailService` é stub. Implementar `send()`
  com chamada HTTP para `https://api.resend.com/emails` (POST com Bearer token).
  Hoje cai em `NotImplementedError`.

### Alternativa: SMTP genérico
Se preferir SMTP corporativo (ex.: Locaweb, Hotmart, Google Workspace), use
`EMAIL_PROVIDER=smtp` e configure as variáveis SMTP comentadas no `.env.prod`.
Esse caminho **já funciona no código** (usa `django.core.mail`).

---

## 8. AWS S3 (uploads de anexos)

### O que fazer
1. Crie conta AWS (cartão de crédito; primeiro ano tem free tier)
2. Crie bucket: `petdiary-prod-attachments` (região `sa-east-1` São Paulo)
3. Configure CORS do bucket para o domínio do app:
   ```json
   [{
     "AllowedOrigins": ["https://app.petdiary.com.br"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }]
   ```
4. Crie IAM User com permissão mínima:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::petdiary-prod-attachments/*"
     }]
   }
   ```
5. Pegue Access Key + Secret Key

### Custos
- ~US$ 0.023/GB/mês armazenado + US$ 0.005/1000 requests
- 100 usuários com 50MB cada → 5GB → US$ 0.12/mês. Praticamente grátis no início.

### Configuração no `.env.prod`
Já está mapeado nas vars `AWS_*`.

### O que falta no código
- `health/services/storage.py:S3StorageBackend` é stub. Implementar com `boto3`:
  - `save()` → `s3.upload_fileobj()`
  - `open()` → `s3.get_object()`
  - `get_url()` → `s3.generate_presigned_url('get_object', ExpiresIn=300)`
  - `delete()` → `s3.delete_object()`

---

## 9. Sentry (observabilidade — opcional mas recomendado)

### O que fazer
1. Crie conta em [sentry.io](https://sentry.io) (grátis até 5k erros/mês)
2. Crie projeto "petdiary-backend" (Python/Django) → copie DSN
3. Crie projeto "petdiary-web" (React) → copie DSN
4. Crie projeto "petdiary-mobile" (React Native) → copie DSN

### Configuração no `.env.prod`
```
SENTRY_DSN=https://xxxxxxxxx@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
```

### O que falta no código
- Instalar `sentry-sdk[django]>=2.0` no `requirements.txt`
- Adicionar em `petdiary/settings.py`:
  ```python
  if SENTRY_DSN := config("SENTRY_DSN", default=""):
      import sentry_sdk
      sentry_sdk.init(
          dsn=SENTRY_DSN,
          environment=config("SENTRY_ENVIRONMENT", default="dev"),
          traces_sample_rate=config("SENTRY_TRACES_SAMPLE_RATE", default=0.1, cast=float),
      )
  ```
- Web/Mobile: instalar `@sentry/react` e `@sentry/react-native`, init no `main.tsx`/`App.tsx`

---

## 10. Substituir mocks por integrações reais

Depois de ter as credenciais (itens 5–9), o trabalho de código é apenas
preencher os métodos `raise NotImplementedError` nos arquivos:

| Arquivo | O que implementar | Tempo estimado |
|---|---|---|
| `billing/services/gateway.py` | `AsaasGateway.create_subscription/cancel_subscription/verify_webhook` | 4–8h |
| `health/services/ai.py` | `OpenAIService.extract_prescription/transcribe_audio` | 2–4h |
| `health/services/storage.py` | `S3StorageBackend.save/open/get_url/delete` | 2–3h |
| `accounts/services/email.py` | `ResendEmailService.send` | 1h |

A interface já está pronta (mock-first toggleable) — basta trocar `_MODE`/`_PROVIDER`
no `.env.prod` para o nome correto e os métodos passarão a ser chamados.

---

## 11. App Stores (mobile)

### Apple App Store
1. Inscreva-se no [Apple Developer Program](https://developer.apple.com/programs/) — **US$ 99/ano**
2. Aprovação: 1-7 dias úteis (Apple verifica D-U-N-S Number da empresa)
3. Crie App ID + Bundle Identifier `com.petdiary.app` em `developer.apple.com`
4. Crie app no App Store Connect (`appstoreconnect.apple.com`)
5. Forneça:
   - Política de privacidade (item 13) — URL pública
   - Screenshots (5 tamanhos: iPhone 6.7", 6.5", 5.5", iPad 12.9", 11")
   - Descrição em pt-BR + en
   - Categoria: Saúde e Forma Física + Estilo de Vida
6. **TestFlight** primeiro (testes internos) — depois submissão oficial
7. Apple revisa em 1–3 dias úteis. Rejeições comuns:
   - Falta política de privacidade
   - Funcionalidade quebrada
   - "Sign in with Apple" obrigatório se tiver outros logins sociais

### Google Play Store
1. Crie conta em [Google Play Console](https://play.google.com/console) — **US$ 25 vitalício**
2. Aprovação imediata após pagamento
3. Crie aplicativo + ficha + screenshots (similares ao iOS)
4. **Internal Testing** primeiro → depois Closed/Open Testing → Produção
5. Google revisa em 1–7 dias úteis (mais rigoroso desde 2023)

### Build do mobile (Expo)
```bash
cd petDiary-frontend-mobile
npm install -g eas-cli
eas login
eas build:configure
# Build iOS (precisa Apple Developer ativo)
eas build --platform ios --profile production
# Build Android
eas build --platform android --profile production
# Submissão automática
eas submit --platform ios
eas submit --platform android
```

`eas.json` precisa ser configurado com profiles `production` apontando pro `.env.prod`.

---

## 12. Política de privacidade + Termos de uso (LGPD)

### Por que é obrigatório
- LGPD (Lei Geral de Proteção de Dados, Brasil): exige política de privacidade
  para qualquer app que colete dados pessoais (nome, email, telefone). Multa até R$ 50M ou 2% do faturamento.
- Apple e Google **rejeitam** apps sem política de privacidade publicada em URL pública.

### Conteúdo mínimo da política
1. Quem é o controlador (PJ + CNPJ + endereço + email DPO)
2. Que dados são coletados (nome, email, phone, endereço, foto pet, dados clínicos)
3. Para que são usados (operação do serviço, comunicação, suporte)
4. Com quem são compartilhados (Asaas, OpenAI, Resend, AWS — nominalmente)
5. Por quanto tempo são armazenados (regra de retenção)
6. Direitos do titular (acesso, correção, exclusão — código já implementa exclusão)
7. Como exercer direitos (email DPO)
8. Cookies e tecnologias de rastreamento
9. Atualizações da política (versionamento + data)

### Como gerar
- **DIY**: usar [iubenda](https://www.iubenda.com/pt-br) (R$ 30–80/mês) ou
  [TermsFeed](https://www.termsfeed.com) (US$ 50 uma vez)
- **Advogado**: R$ 1.000–5.000 para política + termos sob medida
  (recomendado se entrar em saúde séria)

### Onde publicar
- URL pública: `https://petdiary.com.br/privacidade` e `/termos`
- Linkar no rodapé do app web e em "Conta > Sobre" do mobile

---

## ✅ Checklist final antes de "ir live"

Antes de anunciar pra usuários reais:

- [ ] Domínio comprado e DNS propagado
- [ ] Servidor com Postgres + Redis gerenciados, backup diário ativo
- [ ] `.env.prod` com TODOS os `__PLACEHOLDER__` substituídos
- [ ] `SECRET_KEY` gerada com `secrets.token_urlsafe(64)`
- [ ] HTTPS funcionando (Caddy emitiu certificado Let's Encrypt)
- [ ] Healthcheck retornando 200: `curl https://api.petdiary.com.br/healthz/`
- [ ] Conta admin Django criada (createsuperuser)
- [ ] Pelo menos 1 cupom de teste criado pelo admin
- [ ] Asaas (ou MP) configurado com webhook secret
- [ ] OpenAI key ativa com saldo
- [ ] Resend domain verified + SPF/DKIM publicados
- [ ] Bucket S3 com CORS configurado
- [ ] Sentry capturando uma exception de teste
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] App iOS aprovado pela Apple
- [ ] App Android aprovado pelo Google
- [ ] **Teste end-to-end real**: cadastro → login → criar pet → gerar PIN → vet faz claim → upload anexo (real S3) → assinar PRO (real Asaas com PIX) → email de boas-vindas chega (Resend)

---

## 🆘 Em caso de dúvida

Cada item acima tem um link oficial. Se travar:
- Domínio/DNS: [registro.br](https://registro.br/dominio/duvidas-frequentes/)
- Hospedagem: começar pelo Railway é o caminho mais simples
- Apple: [developer.apple.com/help/account/](https://developer.apple.com/help/account/)
- Asaas: [docs.asaas.com](https://docs.asaas.com)
- LGPD: cartilha gratuita da [ANPD](https://www.gov.br/anpd)
