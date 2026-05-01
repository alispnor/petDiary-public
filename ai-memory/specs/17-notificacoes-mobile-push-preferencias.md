# Spec 17 — Notificações push + Preferências (mobile **e web**)

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Engenheiro fullstack Django + React Native + React.
> **Objetivo:** sistema completo de notificações para mobile **e web**
> com tipos (vacinação, retorno ao vet, vencimento de pagamento, PIN,
> acesso vet, sistema) e tela de **preferências** que permite
> ativar/desativar cada tipo.
> **Decisão durável (Ali, 2026-05-01):** todas as funcionalidades devem
> existir em paridade entre mobile e web.

## Por que ainda não foi feito

Plano grande (3 sub-fases). Salvo aqui pra executar em sessão dedicada.

---

## Estado atual (2026-05-01)

- ❌ Backend NÃO tem app `notifications/`
- ❌ Mobile NÃO tem `expo-notifications` instalado
- ✅ Mobile tem `SubscriptionDashboard` completo (PIX/cancelamento/cupom)
- ✅ Backend tem Celery + Redis funcionando (Fase F)
- ✅ Backend tem `Subscription.current_period_end` (cobertura para "vencimento")

---

## Plano de execução (4 fases — commit cada fase)

### 🟦 Fase 5a — Backend: app `notifications/` + endpoints + PushService

**1. Novo app `notifications/`** com modelos:

```python
class Notification(models.Model):
    class Type(models.TextChoices):
        VACCINE = "VACCINE", "Vacina"
        VET_RETURN = "VET_RETURN", "Retorno ao vet"
        PAYMENT_DUE = "PAYMENT_DUE", "Vencimento de pagamento"
        PAYMENT_OK = "PAYMENT_OK", "Pagamento confirmado"
        PIN_GENERATED = "PIN_GENERATED", "PIN criado"
        VET_ACCESS_CLAIMED = "VET_ACCESS_CLAIMED", "Vet acessou prontuário"
        SYSTEM = "SYSTEM", "Sistema"

    id = UUIDField(primary_key=True, default=uuid4)
    user = ForeignKey(User, on_delete=CASCADE, related_name="notifications")
    type = CharField(choices=Type.choices, max_length=32)
    title = CharField(max_length=140)
    body = TextField()
    data = JSONField(default=dict)  # deep-link, ids, etc.
    read_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [Index(fields=["user", "-created_at"]),
                   Index(fields=["user", "read_at"])]


class NotificationPreference(models.Model):
    """Toggles por tipo. Default: tudo on. Tutor escolhe o que receber."""
    user = OneToOneField(User, on_delete=CASCADE, related_name="notif_prefs")
    push_vaccine = BooleanField(default=True)
    push_vet_return = BooleanField(default=True)
    push_payment_due = BooleanField(default=True)
    push_payment_ok = BooleanField(default=True)
    push_pin_generated = BooleanField(default=True)
    push_vet_access_claimed = BooleanField(default=True)
    push_system = BooleanField(default=True)
    # Email (opcional, futuro):
    email_enabled = BooleanField(default=False)


class DevicePushToken(models.Model):
    """Token Expo Push registrado pelo dispositivo no login."""
    id = UUIDField(primary_key=True, default=uuid4)
    user = ForeignKey(User, on_delete=CASCADE, related_name="push_tokens")
    expo_push_token = CharField(max_length=255, unique=True)
    platform = CharField(max_length=10, choices=[("ios","iOS"),("android","Android")])
    last_seen = DateTimeField(auto_now=True)
    created_at = DateTimeField(auto_now_add=True)
```

**2. Service de envio** (`notifications/services/push.py`):

```python
class PushService(ABC):
    @abstractmethod
    def send(self, tokens: list[str], title: str, body: str,
             data: dict | None = None) -> dict: ...

class MockPushService(PushService):
    def send(self, tokens, title, body, data=None):
        logger.info("MOCK push", tokens=tokens, title=title, body=body, data=data)
        return {"sent": len(tokens), "failed": 0, "mock": True}

class ExpoPushService(PushService):
    """POST https://exp.host/--/api/v2/push/send."""
    URL = "https://exp.host/--/api/v2/push/send"
    def send(self, tokens, title, body, data=None):
        payload = [{"to": t, "title": title, "body": body, "data": data or {}}
                   for t in tokens]
        r = httpx.post(self.URL, json=payload, timeout=10)
        r.raise_for_status()
        return {"sent": len(tokens), "response": r.json()}

# Factory por env PUSH_SERVICE_MODE = "mock" | "expo"
```

**3. Helper** (`notifications/helpers.py`):

```python
def notify(user, type: str, title: str, body: str, data: dict | None = None) -> Notification:
    pref = NotificationPreference.objects.get_or_create(user=user)[0]
    pref_field = f"push_{type.lower()}"
    push_allowed = getattr(pref, pref_field, True)

    notif = Notification.objects.create(
        user=user, type=type, title=title, body=body, data=data or {}
    )

    if push_allowed:
        from .tasks import send_push_async
        send_push_async.delay(str(user.id), title, body, data or {})

    return notif
```

**4. Tasks Celery** (`notifications/tasks.py`):

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_push_async(self, user_id: str, title: str, body: str, data: dict):
    tokens = list(DevicePushToken.objects.filter(user_id=user_id)
                  .values_list("expo_push_token", flat=True))
    if not tokens:
        return {"sent": 0, "reason": "no_tokens"}
    try:
        return get_push_service().send(tokens, title, body, data)
    except Exception as e:
        raise self.retry(exc=e)


@shared_task
def check_payment_due_task():
    """Beat: 1x/dia. Avisa subs com current_period_end em 3 dias."""
    from billing.models import Subscription
    soon = timezone.now() + timedelta(days=3)
    subs = Subscription.objects.filter(
        plan_type=Subscription.Plan.PRO,
        status=Subscription.Status.ACTIVE,
        cancel_at_period_end=False,
        current_period_end__date=soon.date(),
    ).select_related("user")
    for sub in subs:
        notify(
            sub.user, "PAYMENT_DUE",
            "Sua assinatura PRO renova em 3 dias",
            "Vamos cobrar via PIX. Toque para detalhes.",
            {"screen": "Subscription"},
        )
```

**5. Endpoints** (`notifications/urls.py`):

| Método | URL | Descrição |
|---|---|---|
| `GET` | `/notifications/` | Lista paginada do user (20/pág) |
| `GET` | `/notifications/unread-count/` | `{count: 7}` |
| `POST` | `/notifications/<id>/read/` | Marca uma como lida |
| `POST` | `/notifications/read-all/` | Marca todas como lidas |
| `GET` | `/notifications/preferences/` | Retorna preferências |
| `PUT` | `/notifications/preferences/` | Atualiza |
| `POST` | `/notifications/devices/register/` | Body: `{expo_push_token, platform}` |
| `POST` | `/notifications/devices/unregister/` | Body: `{expo_push_token}` |

**6. Web Push (VAPID)** — adicionar campos `web_push_endpoint`,
`web_push_p256dh`, `web_push_auth` ao `DevicePushToken` (ou tabela
separada `WebPushSubscription`). Service `WebPushService` usa
`pywebpush`:

```python
class WebPushService(PushService):
    def send(self, subscriptions: list[dict], title, body, data=None):
        from pywebpush import webpush, WebPushException
        sent, failed = 0, 0
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info=sub,
                    data=json.dumps({"title": title, "body": body, "data": data or {}}),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{settings.VAPID_CONTACT_EMAIL}"},
                )
                sent += 1
            except WebPushException as e:
                failed += 1
                if e.response and e.response.status_code in (404, 410):
                    # Subscription expirou — remover do DB
                    pass
        return {"sent": sent, "failed": failed}
```

Configs novas:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CONTACT_EMAIL=ops@petdiary.com.br
```

Endpoint extra:
- `GET /notifications/web-push/vapid-public-key/` — retorna chave pública
  para o front-end fazer subscribe (sem autenticação)

**7. `send_push_async`** vira fanout:
- pega `DevicePushToken.objects.filter(user_id=user_id)` agrupado por
  plataforma (`ios`, `android`, `web`)
- iOS/Android → `ExpoPushService`
- Web → `WebPushService`

**8. Beat schedule** em `petdiary/celery.py`:
```python
"check-payment-due-daily": {
    "task": "notifications.tasks.check_payment_due_task",
    "schedule": crontab(hour=9, minute=0),  # 9h da manhã
},
```

**7. Hooks de notificações automáticas**:
- `access.signals.post_save_VetAccessToken` → notifica tutor "PIN gerado"
- `access.views.ClaimAccessView` → notifica tutor "Vet X acessou prontuário"
- `billing.views.GatewayWebhookView` (status=PAID) → notifica "PAYMENT_OK"

**Settings**:
```
PUSH_SERVICE_MODE=mock      # local/CI
# PUSH_SERVICE_MODE=multi   # produção (Expo + WebPush)
```

---

### 🟦 Fase 5b — Backend: lembretes (Reminder)

**Por que separado:** lembretes de vacinação e retorno precisam de
metadado novo no HealthRecord (`next_due_date`) ou modelo `Reminder`
dedicado. Mais cleanup → fica em fase própria.

**Decisão durável:** modelo `Reminder` separado, criado pelo tutor ao
adicionar registro (campo opcional "lembrar em N dias").

```python
class Reminder(models.Model):
    class Type(models.TextChoices):
        VACCINE = "VACCINE", "Vacina"
        VET_RETURN = "VET_RETURN", "Retorno ao vet"
        CUSTOM = "CUSTOM", "Personalizado"

    id = UUIDField(primary_key=True, default=uuid4)
    pet = ForeignKey(Pet, on_delete=CASCADE, related_name="reminders")
    health_record = ForeignKey(HealthRecord, null=True, blank=True,
                               on_delete=SET_NULL)
    type = CharField(choices=Type.choices, max_length=20)
    title = CharField(max_length=140)
    description = TextField(blank=True)
    date_due = DateField()
    notified_at = DateTimeField(null=True, blank=True)
    dismissed_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

Tasks:
```python
@shared_task
def check_reminders_task():
    """Beat: 1x/dia 8h. Notifica reminders com date_due em 7 dias e ainda
    não notificados."""
    soon = date.today() + timedelta(days=7)
    qs = Reminder.objects.filter(
        date_due__lte=soon, notified_at__isnull=True, dismissed_at__isnull=True,
    ).select_related("pet")
    for r in qs:
        owners = User.objects.filter(petmember__pet=r.pet, petmember__role="OWNER")
        for owner in owners:
            notify(owner, r.type, r.title, r.description or "",
                   {"screen": "PetDashboard", "petId": str(r.pet.id),
                    "reminderId": str(r.id)})
        r.notified_at = timezone.now()
        r.save(update_fields=["notified_at"])
```

Endpoints:
- `GET /pets/<id>/reminders/`
- `POST /pets/<id>/reminders/`  body: `{type, title, description, date_due}`
- `POST /reminders/<id>/dismiss/`
- `DELETE /reminders/<id>/`

---

### 🟦 Fase 5c — Mobile: expo-notifications + telas

**1. Instalar:**
```bash
docker exec petdiary_mobile npm install expo-notifications expo-device --legacy-peer-deps
```

**2. `app.json`** — adicionar plugin:
```json
"plugins": [
  "expo-image-picker",
  "expo-asset",
  ["expo-notifications", {
    "icon": "./assets/notification-icon.png",
    "color": "#24b6d4"
  }]
]
```

**3. Service `services/notifications.ts`:**
- `registerForPushNotificationsAsync()` — pede permissão, pega token, POST `/notifications/devices/register/`
- `setupNotificationHandlers()` — handler de tap (deep link via `data.screen`)
- Chamado no `useEffect` do AppNavigator pós-login

**4. Tela `NotificationsScreen` (`screens/Notifications.tsx`):**
- Lista paginada (FlatList) com pull-to-refresh
- Item: ícone por type, title, body, "há X min", badge "novo" se unread
- Tap → marca como lida + navega usando `data.screen`
- Header: "Marcar todas como lidas"
- Empty state: "Você não tem notificações ainda"

**5. Tela `NotificationPreferencesScreen` (`screens/NotificationPreferences.tsx`):**
- Toggles `Switch` por tipo:
  - 💉 Vacinação
  - 🏥 Retorno ao vet
  - 💳 Vencimento de pagamento
  - ✅ Pagamento confirmado
  - 🔑 PIN gerado
  - 🩺 Vet acessou prontuário
  - 📢 Avisos do sistema
- Salva ao toggle (PUT `/notifications/preferences/`) com debounce
- Disclaimer: "iOS/Android pode bloquear push nas configurações do
  sistema. Esta tela controla os avisos enviados pelo PetDiary."

**6. Integração com header:**
- Badge no `HomeTutor` mostrando count de não lidas (`/notifications/unread-count/`)
- Tap → navega pra `Notifications`

**7. AccountSettings:**
- Adicionar atalho "🔔 Preferências de notificação" → `NotificationPreferences`

**8. AppNavigator:**
- 2 rotas novas: `Notifications`, `NotificationPreferences`
- No login bem-sucedido, dispara `registerForPushNotificationsAsync()`

---

### 🟦 Fase 5d — Web: notificações in-app + Web Push

**Por que existe:** decisão durável do Ali (2026-05-01) é manter
**paridade total mobile ↔ web**. Tudo que tem no mobile precisa ter no
web também.

**1. Lib:**
```bash
docker exec petdiary_web npm install
# Web Push browser-side: API nativa (PushManager + Notification),
# nada a instalar.
```

**2. Service worker** em `petDiary-frontend-web/public/sw.js`:

```js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo-192.png",
      badge: "/logo-192.png",
      data: data.data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const screen = event.notification.data?.screen;
  const url = screen === "Subscription" ? "/conta" : "/tutor";
  event.waitUntil(clients.openWindow(url));
});
```

**3. Service `services/notifications.ts`** (web):

```ts
export async function registerWebPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const reg = await navigator.serviceWorker.register("/sw.js");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  const { data: { vapid_public_key } } = await api.get("/notifications/web-push/vapid-public-key/");

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid_public_key),
  });

  await api.post("/notifications/devices/register/", {
    platform: "web",
    web_push_endpoint: subscription.endpoint,
    web_push_p256dh: btoa(...),
    web_push_auth: btoa(...),
  });
}
```

**4. Telas web novas:**

- **`/notifications`** (`pages/Notifications.tsx`):
  - Lista paginada com botão "Marcar todas como lidas"
  - Item: ícone por type, title, body, "há X min", badge "novo"
  - Click → marca lida + navega via `data.screen`/`data.petId`
  - Empty state amigável

- **`/conta` (já existe `AccountSettings.tsx`)** — adicionar seção:
  - **"Preferências de notificação"** com 7 toggles (mesmos do mobile)
  - PUT `/notifications/preferences/` ao toggle (debounce 400ms)
  - Botão "Ativar notificações no navegador" → chama
    `registerWebPush()` (só aparece se permission ainda for default)

- **Header de TutorDashboard/VetEntry:** badge 🔔 com count de unread:
  - GET `/notifications/unread-count/` em `setInterval(60_000)` ou via
    WebSocket (Spec 07) quando rodar
  - Click → `/notifications`

**5. Componente `<NotificationsBell>`** reutilizável (header tutor + vet
+ admin):

```tsx
<NotificationsBell />
// Renderiza ícone 🔔 + badge vermelho se unread > 0
// Click navega pra /notifications
```

**6. Integração no boot** (`main.tsx` ou `App.tsx`):
- Pós-login bem-sucedido, chama `registerWebPush()` (não bloqueia render)
- Se permission for "default", mostra banner discreto após 30s convidando
  o user a ativar

**7. i18n:** chaves `notifications.*` em pt-BR/en/es/pt-PT/fr/ar (Spec 10)

---

## Aceite (testes manuais)

### Backend
- [ ] T1: criar Notification via shell → aparece em `GET /notifications/`
- [ ] T2: marcar como lida → `read_at` preenchido + sumiu de unread-count
- [ ] T3: PUT `/preferences/` com `push_vaccine=false` → `notify(type=VACCINE)`
      cria DB record mas NÃO chama `send_push_async.delay()`
- [ ] T4: registrar 2 tokens → `send_push_async` chama Expo com 2 tokens
- [ ] T5: `check_payment_due_task` em modo eager dispara notificação para
      sub com vencimento em 3 dias
- [ ] T6: webhook PAID dispara notify("PAYMENT_OK")

### Mobile
- [ ] T7: novo login pede permissão de notif e registra token
- [ ] T8: tela Notifications lista 3 mocks, tap marca como lida
- [ ] T9: toggle off "Vacinação" → backend grava em prefs
- [ ] T10: tap em notif com `data.screen=PetDashboard` navega correto
- [ ] T11: receber push real em iOS via Expo Push Tool

### Web
- [ ] T12: novo login pede permissão e registra subscription (sw.js)
- [ ] T13: tela `/notifications` lista mocks, click marca como lida e
      navega
- [ ] T14: badge `<NotificationsBell />` mostra contador de unread
- [ ] T15: receber push real no Chrome (envio via backend usando
      `pywebpush`)
- [ ] T16: toggle off um tipo no `/conta` → backend NÃO envia mais aquele
      tipo

---

## Custos / dependências externas

- **Expo Push** é grátis, sem limite explícito (usado por milhões de apps)
- iOS exige conta Apple Developer ativa (US$ 99/ano — já listado como
  pendência humana)
- Android: grátis (Google FCM via Expo)
- Mobile precisa **build EAS** (não funciona em Expo Go pra push real,
  mas funciona em DEV via simulator/Expo Go com restrições)
- **Web Push** é grátis. Precisa gerar par VAPID uma vez:
  ```bash
  npx web-push generate-vapid-keys
  ```
  Salvar `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no `.env.prod` (já
  listado em PENDENCIAS-HUMANAS.md item 13 → adicionar como sub-item).
- iOS Safari: Web Push **só** funciona em Safari 16.4+ via PWA instalada
  (Add to Home Screen). Em browser comum é silencioso. Trade-off
  documentado mas aceitável — quem está em Safari mobile usa o app
  nativo.

---

## Notas de implementação

- **Padrão mock-first** mantido (regra do Ali): `PushService` abstrato +
  `MockPushService` default + `ExpoPushService` real, toggle via env
- **Idempotência**: se Expo retornar erro `DeviceNotRegistered`, deletar
  o `DevicePushToken` automaticamente (Expo recomenda)
- **Anti-flood**: `notify()` poderia ter dedup por (user, type, hash(data))
  com TTL 1h — pendente, fora do MVP
- **Internacionalização**: títulos/bodies devem usar `gettext` no backend
  para respeitar `Accept-Language` do user
- **i18n mobile**: telas de notificações entram nas mesmas chaves dos
  locales (Spec 10) — adicionar `notifications.*` quando rodar Spec 10
  no mobile
