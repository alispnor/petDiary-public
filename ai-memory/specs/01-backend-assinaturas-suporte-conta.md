# Spec 01 — Backend: Assinaturas + Webhook + Deleção LGPD + Suporte

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.

---

## Prompt original

> Você é um Arquiteto de Software Backend (Python/Django).
> Nossa aplicação "PetDiary" agora precisa de um módulo de Assinaturas (Freemium/PRO), deleção de conta e suporte. Vamos integrar um Gateway de Pagamento (ex: Mercado Pago ou Asaas) que fará o repasse final para uma conta Nubank PJ.
>
> Sua tarefa é criar a estrutura do Backend para suportar isso:
>
> 1. **Modelos de Assinatura (models.py):**
>    - Crie o model `Subscription`: Relacionado ao `User`, contendo os campos `plan_type` (FREE, PRO), `status` (ACTIVE, CANCELED, PAST_DUE), `gateway_subscription_id`, `current_period_end`.
>
> 2. **Endpoints de Checkout (views.py):**
>    - POST `/api/v1/billing/subscribe/`: Recebe a intenção de compra e o método de pagamento (PIX ou CREDIT_CARD). Retorna o 'Copy-Paste' do PIX ou o token de transação do cartão para o frontend.
>    - POST `/api/v1/billing/cancel/`: Cancela a renovação automática da assinatura.
>
> 3. **Webhooks do Gateway:**
>    - Crie uma view (POST `/api/v1/webhooks/gateway/`) que receberá eventos assíncronos do gateway (ex: 'payment.created', 'subscription.canceled') para atualizar o status no nosso banco de dados. Lembre-se de ignorar a autenticação JWT nesta rota, mas valide a assinatura criptográfica do webhook.
>
> 4. **Gestão de Conta e Suporte:**
>    - DELETE `/api/v1/users/me/`: Endpoint para deleção da conta. Para conformidade com LGPD/Apple Store, aplique "Soft Delete" (anomização de dados pessoais e alteração de is_active=False).
>    - POST `/api/v1/support/tickets/`: Endpoint para o usuário enviar mensagens de Ajuda, Ideia ou Reclamação.
>
> Escreva o código limpo, documentado e com type hints.

---

## Plano de fases sugerido (a confirmar quando rodar)

### Fase 8.1 — App `billing` (Subscription model + admin)
- `python manage.py startapp billing`
- Model `Subscription` com FK 1:1 → User
- Choices: `plan_type` (FREE, PRO), `status` (ACTIVE, CANCELED, PAST_DUE, TRIALING)
- Campos: `gateway_subscription_id`, `current_period_end`, `cancel_at_period_end`
- Migration + signal pra criar Subscription FREE no `post_save` do User
- Admin com list_display, filters, search

### Fase 8.2 — Integração com gateway (Mercado Pago **ou** Asaas)
> Decidir antes: Mercado Pago ou Asaas. Recomendo **Asaas** se a conta principal for Nubank PJ (integração mais direta com PIX BR e tarifas competitivas). Mercado Pago é mais conhecido mas tarifas e UX de cobrança são menos amigáveis.

- Criar `billing/services/gateway.py` com classe abstrata `PaymentGateway`
- Implementação `AsaasGateway` (ou `MercadoPagoGateway`)
- Métodos: `create_subscription()`, `cancel_subscription()`, `verify_webhook(signature, body)`
- Vars de ambiente: `GATEWAY_API_KEY`, `GATEWAY_WEBHOOK_SECRET`, `GATEWAY_BASE_URL`

### Fase 8.3 — Endpoints de checkout
- `POST /api/v1/billing/subscribe/`:
  - Body: `{ payment_method: "PIX" | "CREDIT_CARD", card_token? }`
  - Cria assinatura no gateway, salva `gateway_subscription_id`
  - Se PIX: retorna `{ pix_copy_paste, qr_code_base64, expires_at }`
  - Se CREDIT_CARD: retorna `{ transaction_token, status }`
- `POST /api/v1/billing/cancel/`:
  - Marca `cancel_at_period_end=true` no gateway e local
  - Usuário continua PRO até o fim do período pago

### Fase 8.4 — Webhook
- `POST /api/v1/webhooks/gateway/`:
  - Permission `AllowAny` (sem JWT)
  - **Valida assinatura HMAC-SHA256** do header (rejeita 401 se inválida)
  - Switch por `event.type`:
    - `payment.confirmed` → status=ACTIVE, atualiza `current_period_end`
    - `payment.overdue` → status=PAST_DUE
    - `subscription.canceled` → status=CANCELED
  - Idempotência: tabela `WebhookEvent` com `event_id` UNIQUE para evitar duplo-processamento
  - Logging estruturado (Sentry-friendly)

### Fase 8.5 — Deleção LGPD-compliant (`DELETE /users/me/`)
- Não apaga linha do banco
- Anonimiza:
  - `username = f"deleted_{uuid4().hex[:8]}"`
  - `email = ""`
  - `full_name = "Usuário excluído"`
  - `phone = ""`, `document = ""`, `address_* = ""`
  - `is_active = False`
- Cancela assinatura ativa no gateway
- HealthRecords e Pets ficam preservados (auditoria)
- Loga em `AuditLog` com ator = self
- Retorna 204 + cliente faz logout

### Fase 8.6 — App `support` (Tickets)
- Model `SupportTicket`: `user` FK, `category` (HELP, IDEA, COMPLAINT), `subject`, `message`, `status` (OPEN, IN_PROGRESS, RESOLVED), `created_at`
- `POST /api/v1/support/tickets/`: cria ticket
- `GET /api/v1/support/tickets/`: lista os do próprio usuário
- (Futuro: enviar email pro admin via Resend/Postmark)

### Fase 8.7 — Throttling e segurança
- DRF throttle em `/billing/subscribe/` (anti-flood)
- Rate limit no webhook por IP do gateway
- Logs de tentativas de webhook inválido (alertar)

### Fase 8.8 — Testes
- pytest para Subscription model
- Mock do gateway nos testes de checkout
- Smoke test do webhook com payload real (anonimizado)

---

## Dependências

- Adicionar `requests` (HTTP client) ao requirements
- Adicionar `cryptography` (HMAC validation)
- Considerar `celery` + `redis` para webhooks assíncronos no futuro (não no MVP)

## Variáveis de ambiente novas

```env
GATEWAY_PROVIDER=asaas              # ou mercadopago
GATEWAY_API_KEY=__SET__
GATEWAY_WEBHOOK_SECRET=__SET__
GATEWAY_BASE_URL=https://api.asaas.com/v3
SUBSCRIPTION_PRO_PRICE_BRL=14.90
SUBSCRIPTION_TRIAL_DAYS=7
```

## Decisões pendentes

- [ ] Asaas ou Mercado Pago? (recomendo Asaas)
- [ ] Preço do plano PRO?
- [ ] Tem trial? Quantos dias?
- [x] ~~Quais features são gated (FREE vs PRO)?~~ → **PARCIAL 2026-05-01:** toda IA de mídia (OCR receitas, Whisper áudio, sumarização) é PRO-only. Upload/download/visualização ficam no FREE. Resto a definir.
- [ ] Tickets de suporte só recebem (write-only) ou usuário vê histórico/respostas?

## Cruzamento com Spec 04 (IA + S3)

A IA de mídia (Spec 04) é **gated 100% pelo plano PRO**. Implementação concreta:
- Permission class `IsActivePro` exposta por este app `billing`
- Spec 04 importa e aplica em todos os endpoints `process-ai/`, `transcribe/`, etc.
- Frontend lê `subscription.plan_type` do `/users/me/` e mostra paywall antes de chamar IA
