# Spec 07 — WebSocket realtime (atualizações ao vivo)

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Referência real:** `/home/ali/projects/guep-crm/api/app/src/config/websocket.ts`

---

## Pedido do Ali

> "quero aplicar no frontend web e mobile quando tutor atualizar prontuário do pet ou veterinário atualizar prontuário do pet, e ao veterinário aceitar pin e ou tutor revogar pin — pega lógica e pena num plano de ação e tarefa salva no memória para fazer depois"

---

## Casos de uso (eventos que precisam de tempo real)

| Evento | Quem dispara | Quem recebe | Resultado |
|---|---|---|---|
| `health_record.created` | Tutor ou Vet | Outro lado da relação | Timeline atualiza sem reload |
| `health_record.updated` | Tutor ou Vet | Outro lado | Item da timeline atualiza in-place |
| `health_record.deleted` | Tutor ou Vet | Outro lado | Item some |
| `pin.claimed` | Vet (ao usar PIN) | Tutor | Notificação "Dr. X acessou o prontuário do Mel" + lista de vets ativos atualiza |
| `pin.revoked` | Tutor | Vet (sessão ativa) | Sessão do vet derrubada na hora; redireciona pra `/vet` com modal |
| `pin.expired` | Sistema (timer) | Tutor + Vet | Status atualiza em ambos os dashboards |
| `attachment.uploaded` | Qualquer | Outro lado | Anexo aparece imediatamente |
| `attachment.processed` | Backend (worker IA) | Quem fez upload | "OCR pronto" — texto extraído aparece |

---

## Stack recomendada (extraída do guep-crm)

- **socket.io 4.x** (server + client) — maduro, fallback HTTP, auth no handshake
- **@socket.io/redis-adapter** — opcional, para multi-instância em produção (fallback in-memory em dev)
- **ioredis** — driver Redis usado pelo adapter
- **Path `/ws` + namespace `/private`** — padrão do guep-crm (mantém)

### Por que socket.io e não WS puro

- Auth no handshake via `socket.handshake.auth.token` (JWT)
- Rooms (`socket.join('pet:<id>')`) — broadcast targeted
- Reconexão automática client-side
- Adapter pra escalar horizontalmente (cluster Node ou worker Django via Channels)

---

## 📚 Referência REAL: como guep-crm usa WebSocket

### Configuração principal (`api/app/src/config/websocket.ts`)

```ts
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';

let io: Server;

export async function initWebSocket(httpServer: HttpServer): Promise<Server> {
    io = new Server(httpServer, {
        cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
        path: '/ws',
    });

    // Redis Adapter (multi-instância)
    try {
        const pubClient = new Redis({ host, port, lazyConnect: true });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
    } catch (err) {
        console.warn('[WS] Redis adapter falhou, usando in-memory');
    }

    const ns = io.of('/private');

    // Auth Middleware
    ns.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Token nao informado.'));
        try {
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
            (socket as any).user = { sub: decoded.sub, name: decoded.name };
            next();
        } catch {
            next(new Error('Token invalido.'));
        }
    });

    ns.on('connection', (socket: Socket) => {
        const user = (socket as any).user;
        socket.join(workspaceId);

        // Eventos de presença, join/leave de rooms, etc.
        socket.on('join_board', async (data) => { /* validação + join */ });
        socket.on('disconnect', () => { /* cleanup */ });
    });
}

// Emitters chamados de controllers/services
export function emitToWorkspace(workspaceId: string, event: string, payload: any) {
    io.of('/private').to(workspaceId).emit(event, payload);
}

export function emitToCardRoom(cardId: string, event: string, payload: any) {
    io.of('/private').to(`card:${cardId}`).emit(event, payload);
}
```

### Padrões a copiar
1. **Path + namespace nomeado** — facilita coexistência com outras app no mesmo server
2. **Auth no handshake** — não confiar em conexão sem JWT válido
3. **Rooms hierárquicas** — `workspace:<id>`, `board:<id>`, `card:<id>`
4. **Multi-tab safe presence** — agrupa por userId com `Set<socketId>` (mesmo user em várias abas conta como 1 presence; só remove quando todas as tabs fecharem)
5. **Emitters tipados** — funções públicas que controllers chamam, não emit direto
6. **Cleanup no disconnect** — limpar de todos os mapas/rooms
7. **Redis adapter com fallback in-memory** — funciona em dev sem Redis e em prod com escalabilidade

---

## Plano de fases para o petDiary

### Cenário A — Django Channels (recomendado se manter Django)
- `pip install channels channels-redis`
- ASGI server (uvicorn ou daphne)
- Consumer `PetConsumer` que valida JWT no `connect()`, faz `await self.channel_layer.group_add('pet:<id>', self.channel_name)`
- Sinais Django (`post_save` em HealthRecord) chamam `async_to_sync(channel_layer.group_send)`
- Trade-off: Channels é menos popular que socket.io; UX mais difícil; bibliotecas client menos maduras

### Cenário B — Worker Node socket.io paralelo (referência guep-crm)
- Subir um **microserviço Node** (`petdiary-realtime/`) só para WebSocket
- Recebe **eventos do Django via HTTP webhook interno** (Django POSTa pra ele) ou via Redis pub/sub
- Servidor socket.io escuta esses eventos e broadcast para as rooms certas
- **Recomendado** porque permite copiar literalmente o código do guep-crm e mantém Django focado em API REST

### Sub-fases (Cenário B)

#### W.1 — Microserviço `petdiary-realtime` (Node + socket.io)
- Estrutura idêntica ao guep-crm:
  - `src/config/websocket.ts` — initWebSocket + emitters
  - `src/server.ts` — HTTP server + handler de eventos do Django
  - `src/auth.ts` — verify JWT (mesma SECRET_KEY do Django para HS256, ou public key se trocarmos pra RS256)
- Endpoint interno `POST /internal/emit` que recebe `{event, room, payload}` e faz emit
  - Protegido por SHARED_SECRET (header `X-Internal-Secret`)
- Docker: novo serviço `realtime` no docker-compose
- Variáveis: `REALTIME_PORT`, `REALTIME_INTERNAL_SECRET`, `REDIS_HOST`, `REDIS_PORT`

#### W.2 — Backend Django: signal → emit
- Helper `petdiary/realtime.py` com função `emit(room, event, payload)` que faz POST pro microserviço
- Sinais em models críticos:
  ```python
  @receiver(post_save, sender=HealthRecord)
  def on_health_record_save(sender, instance, created, **kwargs):
      emit(
          room=f"pet:{instance.pet_id}",
          event="health_record.created" if created else "health_record.updated",
          payload=HealthRecordSerializer(instance).data,
      )

  @receiver(post_save, sender=VetAccessToken)
  def on_token_save(sender, instance, **kwargs):
      if instance.deleted_at:
          emit(room=f"vet:{instance.vet_id}", event="pin.revoked", payload={...})
      elif instance.is_used and instance.claimed_at:
          emit(room=f"tutor:{instance.pet.tutor_id}", event="pin.claimed", payload={...})
  ```

#### W.3 — Rooms hierárquicas
- `tutor:<userId>` — tutor recebe eventos dos próprios pets
- `vet:<userId>` — vet recebe eventos dos pets que tem acesso
- `pet:<petId>` — todos com acesso ao pet recebem (auto-join no connect baseado em permissões)

#### W.4 — Web client (React)
- Hook `useRealtimeUpdates(petId)`:
  - `io(REALTIME_URL, { auth: { token: jwt }, path: '/ws' })`
  - `socket.emit('join_pet', { petId })`
  - `socket.on('health_record.created', (data) => { /* atualiza Zustand */ })`
- Reconnect automático
- Cleanup no unmount
- Service `src/services/realtime.ts` com singleton

#### W.5 — Mobile client (Expo)
- `expo install socket.io-client`
- Mesmo hook `useRealtimeUpdates`, adaptado para RN
- Reconnect agressivo em mobile (rede instável)
- Background notifications (futuro: integrar com `expo-notifications` para receber eventos quando app fechado)

#### W.6 — Tratamento de pin.revoked no Web Vet
- Vet logado recebe evento `pin.revoked` enquanto está em `/clinical/<id>`
- Mostra modal "Acesso revogado" (já existe! `<RevokedModal>` foi removido — recriar)
- Auto-redireciona pra `/vet` após confirmar

#### W.7 — Indicadores de "X está vendo agora"
- Reaproveitar lógica de presença do guep-crm
- Mostrar avatar do tutor/vet na timeline quando estão simultaneamente vendo o mesmo pet
- "Dr. X está visualizando o prontuário"

#### W.8 — Observabilidade
- Métricas: conexões ativas, eventos/segundo, latência de delivery
- Alerta se Redis adapter falhar
- Logs estruturados com userId + room

---

## Decisões pendentes

- [ ] Cenário A (Django Channels) ou B (microserviço Node)? — recomendo **B** (mais simples, copy-paste do guep-crm)
- [ ] JWT para socket.io: HS256 (mesma SECRET do Django) ou trocar pra RS256?
- [ ] Pet é privado: vet com acesso ativo entra em `pet:<id>` automaticamente quando faz claim? Como saber se a sessão socket é do vet ainda autorizado? (auth no connect + check de permissão a cada join)
- [ ] Notificações offline (push notifications nativas) entram em escopo? Recomendo deixar para fase posterior

---

## Encaixe no roadmap

- Pode rodar **a qualquer momento depois da Fase 3** (acessos bidirecionais)
- **Pré-requisito** para a **Spec 06** (filas) já estar instalada — Redis é compartilhado
- Faz sentido implementar **antes** da Spec 04 (IA assíncrona): worker IA termina → emit `attachment.processed` → cliente atualiza sozinho
- **Sugestão de posição:** Fase 7.7 do roadmap (junto com filas)
