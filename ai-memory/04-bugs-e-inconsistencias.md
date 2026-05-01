# 04 — Bugs e Inconsistências (achados na análise)

Cada item é um bloqueador real para o fluxo end-to-end funcionar.

## 🐛 1. Web envia `{pin}` mas backend espera `{access_code}`

**Onde:** `petDiary-frontend-web/src/pages/VetDashboard.tsx:18`

```ts
const { data } = await api.post("/access/claim/", { pin });
```

**Backend (`access/serializers.py`):**
```python
class ClaimAccessSerializer(serializers.Serializer):
    access_code = serializers.CharField(max_length=6, min_length=6)
```

**Fix:** trocar `{ pin }` por `{ access_code: pin }` no web.

---

## 🐛 2. Endpoint `/access/simulate-revoke/` não existe

**Onde:** `petDiary-frontend-web/src/components/NoteForm.tsx:50`

Botão "Simular Revogação" faz `api.get("/access/simulate-revoke/")` esperando 403.

**Hoje:** vai cair em 404, e o interceptor só dispara `revokeAccess()` em **403**, não em 404. Logo, o modal de revogação **nunca aparece**.

**Fix possível:**
- Criar endpoint real `POST /access/revoke/` (apenas tutor) e separadamente uma simulação
- Ou apenas chamar `revokeAccess()` direto no botão (é simulação mesmo)

---

## 🐛 3. Mobile chama endpoints inexistentes

**Onde:** `petDiary-frontend-mobile/src/utils/handleDocumentCapture.ts`

```ts
await api.post('/api/v1/uploads/generate-presigned-url/', {...})  // ❌ não existe
await api.post('/api/v1/ai/process-document/', {...})              // ❌ não existe
```

**Backend só expõe:**
- `POST /api/v1/pets/<pet_pk>/health-records/upload-url/`
- (sem endpoint de processamento IA ainda)

**Fix:** alinhar URLs no mobile com o backend (ou criar endpoints novos no backend, decidir).

---

## 🐛 4. Botão "Gerar PIN" no mobile usa Math.random()

**Onde:** `petDiary-frontend-mobile/src/screens/PetDashboard.tsx:69`

```ts
const pin = Math.random().toString(36).substring(2, 8).toUpperCase();
```

Não chama `/access/generate-pin/`. Mostra um PIN aleatório local que **não vale nada**.

**Fix:** chamar `POST /access/generate-pin/` com `{ pet, expires_at }` e mostrar o `access_code` retornado.

---

## 🐛 5. Sem CORS no backend

**Onde:** `petDiary-backend/backend/petdiary/settings.py`

`django-cors-headers` não está em `INSTALLED_APPS` nem em `requirements.txt`.

**Sintoma:** Web em `http://localhost:5173` chama API em `http://localhost:8000` → CORS error no browser.

**Fix:**
```python
# requirements.txt
django-cors-headers>=4.4

# settings.py
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # dev
```

---

## 🐛 6. PIN pode colidir (sem unique constraint em access_code ativo)

**Onde:** `petDiary-backend/backend/access/models.py:9`

```python
def generate_access_code():
    return f"{random.randint(0, 999999):06d}"
```

Não há índice/constraint impedindo dois PINs ativos com o mesmo código. Em escala, dois tutores poderiam gerar o mesmo PIN.

**Fix:** loop de retry no `generate_access_code` checando duplicação ativa, ou unique partial index.

---

## 🐛 7. `expires_at` é obrigatório no serializer mas tutor não envia

**Onde:** `petDiary-backend/backend/access/serializers.py` + `views.py`

`VetAccessTokenSerializer` exige `expires_at` (não é read-only). O tutor precisa enviar manualmente.

**Esperado:** mobile não tem UI pra escolher data; padrão deveria ser ex. "1 hora a partir de agora" no backend.

**Fix:** definir `expires_at` no `perform_create` se não vier do client.

---

## 🐛 8. Permissão de PetViewSet pode permitir 403 em vez de 404

`PetViewSet.get_queryset` filtra; quando o vet acessa um pet sem token, a queryset é vazia → **404**. Mas se o token expira **durante** uma sessão ativa, o web espera **403** para disparar `revokeAccess`. Hoje seria 404.

**Fix:** decidir contrato — ou interceptor reage a 404, ou backend retorna 403 explícito quando vet perde acesso.

---

## 🐛 9. URL base do mobile aponta pra `http://api:8000` por default

**Onde:** `petDiary-frontend-mobile/src/services/api.ts:4`

```ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://api:8000';
```

`http://api:8000` só resolve **dentro do container Docker**. No celular físico (Expo Go), `api` não é nada.

**Mitigação atual:** `.env` define `EXPO_PUBLIC_API_URL=http://192.168.10.203:8000` (IP do dev). Funciona pra Ali, mas é frágil — qualquer outro dev tem IP diferente.

**Fix sugerido:** documentar no README que o `.env` precisa ser ajustado por dev, ou usar `expo-constants` + descoberta automática.

---

## 🐛 10. `EXPO_PUBLIC_API_URL` no mobile não inclui `/api/v1`

Mobile usa `http://192.168.10.203:8000` como base, mas chama `/api/v1/uploads/...` direto. Se padronizar com web (`VITE_API_URL=http://localhost:8000/api/v1`), as chamadas ficariam `api.post('/uploads/...')`.

**Fix:** padronizar para `EXPO_PUBLIC_API_URL=http://<ip>:8000/api/v1` e remover `/api/v1/` dos paths.
