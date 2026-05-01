# Spec 06 — Fila de jobs assíncronos (BullMQ ou Celery)

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** infra com Redis disponível (já está no docker-compose template do Guep CRM)

---

## Pedido do Ali

> "depois quero implementar pullMQ para fila de requests"

Provavelmente o Ali quis dizer **BullMQ** (lib popular Node.js de queues sobre Redis). Como o backend do petDiary é **Django**, o equivalente direto é **Celery + Redis**.

---

## Por que precisamos de fila

Hoje requests síncronos no backend bloqueiam o usuário. Vai virar problema quando:
- **Webhook de pagamento** (Spec 01) — gateway pode reenviar se demoramos a responder; processar em background
- **OCR/Whisper** (Spec 04) — transcrição de áudio leva 5-30s; não pode bloquear request
- **Email transacional** — confirmar cadastro, recuperar senha, ticket de suporte
- **Notificações push** — lembrete de vacina, expiração de PIN
- **Reprocessamento em lote** — re-OCR de uma receita, recálculo de relatórios
- **Limpeza periódica** — purgar PINs expirados, anonimizar contas marcadas pra deleção (LGPD)

---

## Recomendação técnica

### Cenário A — Manter Django: usar **Celery + Redis** (recomendado)
- ✅ Integração nativa com Django (decorators `@shared_task`, signals, ORM)
- ✅ Já temos Postgres e iremos adicionar Redis (que faz parte do template Guep também)
- ✅ Maduro, comunidade BR ampla
- ✅ Beat scheduler (cron-like) integrado
- ✅ Flower (UI de monitoramento)

### Cenário B — Migrar parte da stack para Node + BullMQ
- Só faz sentido se o petDiary for evoluir para um worker Node separado
- BullMQ é melhor que Bull (sucessor moderno)
- Trade-off: dois runtimes (Python + Node) na mesma org

**Recomendação:** ir de **Celery** para manter coesão com Django. Se o Ali tem expertise em Node e prefere BullMQ, pode-se rodar Node em paralelo com endpoints HTTP que o Django chama via REST.

---

## Plano de fases (Cenário A — Celery)

### Fase Z.1 — Infra: adicionar Redis ao docker-compose
- Adicionar serviço `redis` (já existe template no docker-compose Guep)
- Volume nomeado `redis_data`
- Healthcheck

### Fase Z.2 — Celery worker container
- Novo serviço `worker` no docker-compose:
  - Mesma imagem da API
  - Comando: `celery -A petdiary worker --loglevel=info`
- Novo serviço `beat`:
  - Comando: `celery -A petdiary beat --loglevel=info` (scheduler)
- Settings do Django:
  - `CELERY_BROKER_URL = "redis://redis:6379/0"`
  - `CELERY_RESULT_BACKEND = "redis://redis:6379/1"`
  - `CELERY_TASK_TRACK_STARTED = True`
  - `CELERY_TASK_TIME_LIMIT = 300`  # 5 min

### Fase Z.3 — Estrutura de tasks
- Criar `petdiary/celery.py` com app Celery
- Cada Django app ganha `tasks.py`:
  - `accounts/tasks.py` → `send_welcome_email`, `cleanup_deleted_users`
  - `access/tasks.py` → `cleanup_expired_pins` (via beat, diário)
  - `health/tasks.py` → `process_attachment_ocr`, `transcribe_audio`
  - `billing/tasks.py` → `process_webhook_event`
- Decorator `@shared_task(bind=True, max_retries=3, default_retry_delay=60)`

### Fase Z.4 — Webhook do gateway → enfileirado
- View do webhook:
  1. Valida assinatura HMAC
  2. Persiste evento bruto em `WebhookEvent` (idempotência)
  3. Enfileira `process_webhook_event.delay(event_id)`
  4. Retorna 200 imediatamente
- Worker pega da fila e atualiza Subscription

### Fase Z.5 — IA assíncrona (Spec 04)
- Endpoint `POST /pets/<id>/health-records/<rid>/process-ai/` enfileira `process_attachment_ocr.delay(record_id)`
- Retorna 202 Accepted com `{job_id}`
- Frontend faz polling em `GET /pets/<id>/health-records/<rid>/` até `raw_extracted_text` existir, ou WebSocket

### Fase Z.6 — Beat scheduler (cron tasks)
- Periódicas:
  - Limpar PINs expirados (1x/dia, 03:00 UTC)
  - Anonimizar contas marcadas pra deleção há > 30 dias (LGPD)
  - Enviar lembretes de vacina pendentes (1x/dia, 09:00)
  - Expirar tokens não-usados (1x/hora)

### Fase Z.7 — Monitoramento
- Flower em `:5555` (apenas em dev/staging)
- Prod: integrar com Sentry para falhas de tasks
- Métricas custom: tasks por minuto, latência, erros

---

## Variáveis de ambiente novas

```env
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
REDIS_HOST=redis
REDIS_PORT=6379
```

## Decisões pendentes

- [ ] Celery (recomendado) ou BullMQ + worker Node separado?
- [ ] Mesma instância Redis para cache + queue, ou separadas?
- [ ] Flower em produção (com auth) ou só staging?
- [ ] Persistência de Redis (AOF, RDB, ou ephemeral)?
- [ ] Que prioridade tem cada fila? (default, emails, payments, ai-heavy)

---

## Encaixe no roadmap

- **Necessário** para rodar a Spec 01 (webhook de pagamento) e a Spec 04 (IA assíncrona) em produção
- Não bloqueia desenvolvimento das outras specs (pode usar tasks síncronas em dev)
- **Sugestão:** implementar logo antes da Spec 01 (Backend monetização) — Fase 7.5 do roadmap
