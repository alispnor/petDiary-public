# Spec 11 — Logs estruturados de histórico e erros

> Pedido do Ali em 2026-05-01: "quero sempre ter logs de salvar histórias e erros".

---

## Escopo

Dois tipos de log distintos:

1. **Logs de auditoria/histórico** (negócio) — quem fez o quê e quando, persistido em DB para visualização pelo usuário (ex: histórico de alterações no prontuário do pet).
2. **Logs técnicos** (operacional) — erros do sistema, requests, performance, persistido em arquivos/serviço externo para o time técnico.

A Spec 06 (filas) e Spec 07 (websocket) já mencionam logs estruturados. Esta spec consolida e detalha.

---

## Tipo 1: Auditoria de negócio (Spec 06 do plano original = Fase 6)

### Modelo `AuditLog` (Django)
- Já planejado na Fase 6 do plano consolidado (memory `feedback_planejamento`)
- Decisão durável: **só mutações** (CREATE/UPDATE/DELETE), nunca GET
- Decisão durável: preservar nome do ator mesmo se conta for excluída (`actor_name_snapshot`)

```python
# audit/models.py
class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "CREATE"
        UPDATE = "UPDATE"
        DELETE = "DELETE"
        LOGIN = "LOGIN"
        LOGOUT = "LOGOUT"
        REVOKE = "REVOKE"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    actor_name_snapshot = models.CharField(max_length=255)  # preserva mesmo se actor excluído
    actor_role_snapshot = models.CharField(max_length=10)
    action = models.CharField(max_length=20, choices=Action.choices)
    entity_type = models.CharField(max_length=50)  # "HealthRecord", "Pet", "PetMember"
    entity_id = models.UUIDField()
    pet = models.ForeignKey("pets.Pet", null=True, on_delete=models.SET_NULL)  # facilita filtro
    changes = models.JSONField(default=dict)  # {field: {before: x, after: y}}
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["pet", "-created_at"]),
            models.Index(fields=["actor", "-created_at"]),
            models.Index(fields=["entity_type", "entity_id"]),
        ]
```

### Hooks via Django signals
```python
# audit/signals.py
from django.db.models.signals import post_save, post_delete
from .helpers import log_action

@receiver(post_save, sender=HealthRecord)
def log_health_record(sender, instance, created, **kwargs):
    log_action(
        actor=instance.author,
        action="CREATE" if created else "UPDATE",
        entity=instance,
        pet=instance.pet,
        changes=...  # capturar antes/depois via tracker
    )
```

### Endpoints de leitura
- `GET /pets/<id>/audit/` — vê histórico do pet (quem fez o quê e quando)
- Filtros: `?actor=<id>`, `?action=UPDATE`, `?since=<date>`
- Paginação obrigatória (default 20, max 100)

### UI de visualização (Web)
- Aba "📜 Histórico" no `ClinicalView`
- Item: ícone da ação, ator (nome + role badge), descrição, data/hora
  - "📝 Dra. Camila adicionou nota 'Consulta retorno' há 2 horas"
  - "🚫 Luiza Silva revogou acesso de Dr. Carlos há 5 minutos"
- Filtros por usuário e por tipo de ação

---

## Tipo 2: Logs técnicos / operacionais

### Backend (Django)

#### Configuração structlog (recomendado)
```python
# settings.py
import structlog

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.processors.JSONRenderer(),
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json"},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/petdiary/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 10,
            "formatter": "json",
        },
    },
    "loggers": {
        "django.request": {"handlers": ["console", "file"], "level": "WARNING"},
        "petdiary": {"handlers": ["console", "file"], "level": "INFO"},
    },
}

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
)
```

#### Uso nas views
```python
import structlog
log = structlog.get_logger("petdiary")

class GeneratePinView(generics.CreateAPIView):
    def create(self, request, *args, **kwargs):
        log.info(
            "pin_generation_attempt",
            user_id=str(request.user.id),
            pet_id=request.data.get("pet"),
        )
        try:
            response = super().create(request, *args, **kwargs)
            log.info("pin_generated", user_id=str(request.user.id))
            return response
        except Exception as exc:
            log.error("pin_generation_failed", user_id=str(request.user.id), error=str(exc))
            raise
```

#### Sentry para erros não-tratados
```bash
pip install sentry-sdk[django]
```
```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn=config("SENTRY_DSN"),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,  # LGPD: não enviar dados pessoais
        environment=config("ENV"),
    )
```

### Frontend Web

#### Sentry browser
```bash
npm install @sentry/react
```
```ts
// main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}
```

#### Logger estruturado próprio
```ts
// services/logger.ts
type Level = "info" | "warn" | "error";

export const logger = {
  log(level: Level, event: string, context: Record<string, any> = {}) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      event,
      ...context,
    };
    if (level === "error" || level === "warn") {
      console[level](JSON.stringify(entry));
      // opcional: sentry.captureMessage(event, { level, extra: context });
    } else if (import.meta.env.DEV) {
      console.log(JSON.stringify(entry));
    }
  },
  info(event: string, ctx?: Record<string, any>) { this.log("info", event, ctx); },
  warn(event: string, ctx?: Record<string, any>) { this.log("warn", event, ctx); },
  error(event: string, ctx?: Record<string, any>) { this.log("error", event, ctx); },
};
```

#### Interceptor de erros HTTP
```ts
// services/api.ts (atualizar)
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (axios.isAxiosError(error)) {
      logger.error("http_error", {
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  }
);
```

### Frontend Mobile

```bash
npx expo install sentry-expo
```
```ts
// App.tsx
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn,
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

Mesmo logger estruturado do web (compartilhar código se possível).

---

## Plano em fases

### Fase Q.1 — Backend: structlog + sink em arquivo + console
- Configurar `LOGGING` no Django
- Trocar `print` e `logger.info` espalhados por structlog
- Volume Docker `petdiary_logs:/var/log/petdiary`

### Fase Q.2 — Backend: AuditLog + signals + endpoints
- Já é a Fase 6 do plano consolidado — esta spec apenas detalha

### Fase Q.3 — Backend: Sentry em production
- Variável `SENTRY_DSN` no `.env.dev` / `.env.prod`
- `send_default_pii=False` (LGPD)

### Fase Q.4 — Frontend Web: Sentry + logger
- Lib instalada, init em `main.tsx`
- `services/logger.ts` criado
- Interceptor de api.ts loga erros HTTP
- ErrorBoundary global captura crashes de render

### Fase Q.5 — Frontend Mobile: idem com sentry-expo

### Fase Q.6 — Dashboard de monitoramento
- Sentry web UI já mostra erros (free tier 5k events/mês)
- Logs de arquivo: opcional CloudWatch/Datadog/Logtail

### Fase Q.7 — Métricas de negócio
- Eventos importantes: pin_generated, pin_claimed, pin_revoked, member_invited, account_deleted
- Posthog (free tier) ou Mixpanel
- Dashboards: DAU, retenção D7/D30, conversão FREE→PRO

---

## Decisões pendentes

- [ ] Sentry self-hosted ou SaaS? (SaaS free tier resolve até 1000 usuários)
- [ ] Logs em arquivo local OU stream pra serviço externo?
- [ ] Granularidade: logar **toda** request HTTP (verboso) ou só erros + eventos de negócio?
- [ ] AuditLog faz parte do core (sempre on) ou é PRO-only?

## Encaixe no roadmap

- **Tipo 1 (auditoria)** = Fase 6 do plano consolidado, já programado
- **Tipo 2 (logs técnicos)** = pode entrar a qualquer momento, mas obrigatório **antes da produção**
- Esta spec serve como detalhamento técnico e checklist
