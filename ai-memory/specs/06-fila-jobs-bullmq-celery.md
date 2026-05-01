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

---

## 📚 Referência REAL: como BullMQ está organizado no `guep-portaria-backend`

> Adicionado em 2026-05-01 após Ali pedir pra capturar o padrão dele.

O projeto Node `guep-portaria-backend` usa BullMQ com uma arquitetura limpa que vale **copiar diretamente** se decidirmos pelo Cenário B (Node). Localização original:

```
api/app/src/
├── config/queue.ts             # connection Redis centralizada
├── queues/
│   ├── index.ts                # autoloader dinâmico (vê arquivos *Queue.ts)
│   ├── ConvidadoQueue.ts       # 1 arquivo por domínio
│   ├── EasyControlQueue.ts
│   ├── SmsQueue.ts
│   └── WhatsappQueue.ts
└── workers/
    ├── index.ts                # autoloader dinâmico (vê arquivos *Worker.ts)
    ├── ConvidadoWorker.ts
    ├── EasyControlWorker.ts
    ├── SmsWorker.ts
    └── WhatsappWorker.ts
```

### 1. Conexão Redis (config/queue.ts)
```ts
import { ConnectionOptions } from 'bullmq';
import { environments } from './environments';

export const connection: ConnectionOptions = {
    host: environments.redis_host,
    port: environments.redis_port,
    password: environments.redis_password,
};
```

### 2. Padrão de Queue (queues/ConvidadoQueue.ts)
```ts
import { Queue } from 'bullmq';
import { connection } from '../config/queue';
import { environments } from "../config/environments";

export const convidadoQueue = new Queue('ConvidadoQueue', { connection });

export const addConvidadoJob = async (
  name: 'liberarConvidado' | 'removerConvidado',  // jobs tipados!
  data: any
) => {
    await convidadoQueue.add(name, data, {
        attempts: environments.convidado_queue_attempts,         // tentar N vezes
        backoff: {
            type: environments.convidado_queue_backoff_type,     // 'exponential'
            delay: environments.convidado_queue_backoff_delay,   // delay base entre tentativas
        }
    });
};
```

### 3. Padrão de Worker (workers/ConvidadoWorker.ts)
```ts
import { Worker, Job } from 'bullmq';
import { connection } from '../config/queue';
import { environments } from '../config/environments';
import ConvidadoService from '../services/ConvidadoService';

const convidadoService = new ConvidadoService();

const worker = new Worker(
    'ConvidadoQueue',  // mesmo nome da Queue
    async (job: Job) => {
        switch (job.name) {
            case 'liberarConvidado':
                const result = await convidadoService.liberarConvidado(...);
                await job.log(JSON.stringify(result));   // log estruturado por job
                break;
            // ... outros casos
            default:
                throw new Error(`Job desconhecido: ${job.name}`);  // falha alta visibilidade
        }
    },
    {
        connection,
        limiter: {
            max: environments.convidado_worker_limiter_max,
            duration: environments.convidado_worker_limiter_duration,
        },
        concurrency: environments.convidado_worker_concurrency,
    }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completo!`));
worker.on('failed',    (job, err) => console.log(`Job ${job?.id} falhou: ${err.message}`));
```

### 4. Autoloader (queues/index.ts e workers/index.ts)

Padrão genial — basta criar `<Nome>Queue.ts` e `<Nome>Worker.ts` e o autoloader importa dinamicamente. Não precisa registrar em lugar nenhum:

```ts
// queues/index.ts (resumo)
const files = fs.readdirSync(__dirname);
files.forEach((file) => {
    if (file.endsWith('Queue.ts') || file.endsWith('Queue.js')) {
        const module = require(path.join(__dirname, file));
        Object.keys(module).forEach((exportName) => {
            if (exportName.endsWith('Queue')) {
                bullMqQueues.push(new BullMQAdapter(module[exportName]));  // pra Bull Board UI
                queues[exportName] = module[exportName];
            }
        });
    }
});
export { bullMqQueues };
```

### 5. Bull Board (UI de monitoramento)
- Cada Queue automaticamente registrada no `bullMqQueues` via adapter
- UI em rota tipo `/admin/queues` mostra jobs ativos, completados, falhados, com retry manual

---

## Como aplicar no petDiary

### Se manter Django (Cenário A — Celery)
- Replicar a **estrutura modular** do guep-portaria, mas em Python:
  - `petdiary/celery.py` (config principal — equivalente ao `config/queue.ts`)
  - `<app>/tasks.py` em cada Django app (equivalente aos arquivos `*Queue.ts`/`*Worker.ts` fundidos)
  - Decorators tipados: `@shared_task(bind=True, max_retries=3, default_retry_delay=60)`
  - Flower como UI (equivalente ao Bull Board)

### Se migrar pra Node (Cenário B — BullMQ)
- **Copiar literalmente** os 3 arquivos abaixo do guep-portaria como base:
  - `config/queue.ts` (10 linhas, zero mudanças)
  - `queues/index.ts` (autoloader, copy-paste)
  - `workers/index.ts` (autoloader, copy-paste)
- Padronizar nomes: `<Nome>Queue.ts` e `<Nome>Worker.ts`
- Variáveis de ambiente seguindo o padrão dele:
  ```
  REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
  <NOME>_QUEUE_ATTEMPTS, <NOME>_QUEUE_BACKOFF_TYPE, <NOME>_QUEUE_BACKOFF_DELAY
  <NOME>_WORKER_CONCURRENCY, <NOME>_WORKER_LIMITER_MAX, <NOME>_WORKER_LIMITER_DURATION
  ```

### Filas iniciais sugeridas para o petDiary
| Fila | Jobs | Trigger |
|---|---|---|
| `WebhookQueue` | `processPaymentEvent`, `processSubscriptionEvent` | POST /webhooks/gateway/ enfileira |
| `MediaQueue` | `extractTextFromImage`, `transcribeAudio`, `summarizeRecord` | Após upload pra S3 |
| `EmailQueue` | `sendWelcome`, `sendPasswordReset`, `sendTicketConfirmation` | Sinais Django/Express |
| `NotificationQueue` | `sendVaccineReminder`, `sendPinExpiringSoon` | Beat scheduler diário |
| `CleanupQueue` | `purgeExpiredPins`, `anonymizeDeletedUsers` | Beat scheduler diário/horário |
