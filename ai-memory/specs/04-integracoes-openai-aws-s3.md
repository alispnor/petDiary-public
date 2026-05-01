# Spec 04 — Integrações: OpenAI (texto/áudio) + AWS S3

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** Fase 7 (uploads) já implementada — usa storage abstrato preparado para S3.

---

## Pedido do Ali (palavra por palavra)

> "salva este tarefa para rodar depois quero que colocar anexar media [...]"

E anexou um exemplo de `.env` esperado:

```env
# Configurações de Segurança
SECRET_KEY=sua_chave_secreta_do_django
DEBUG=False

# Configurações do Banco de Dados (Docker)
DB_NAME=petdiary_db
DB_USER=petdiary_user
DB_PASSWORD=petdiary_pass
DB_HOST=db
DB_PORT=5432

# Integração com Inteligência Artificial
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL_TEXT=gpt-4o-mini
OPENAI_MODEL_AUDIO=whisper-1

# Cloud Storage (AWS S3)
AWS_ACCESS_KEY_ID=sua_chave_aws
AWS_SECRET_ACCESS_KEY=seu_segredo_aws
AWS_STORAGE_BUCKET_NAME=petdiary-uploads
```

E pediu pra "pega o que esta faltando e colocar no .env" — ou seja, preparar terreno mas sem executar agora.

---

## O que está faltando vs o que já temos

### Já no `.env.local` / `.env.dev` atuais
- `SECRET_KEY` ✅
- `DEBUG` ✅
- `DATABASE_URL` ✅ (formato Postgres composto, equivalente a DB_*)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` ✅ (variáveis do container Postgres)
- `CORS_ALLOWED_ORIGINS` ✅
- `VITE_API_URL`, `EXPO_PUBLIC_API_URL` ✅

### Faltando — adicionar quando rodar essa spec
- `OPENAI_API_KEY` — chave da OpenAI Platform
- `OPENAI_MODEL_TEXT` — default `gpt-4o-mini` (econômico para OCR pós-processamento)
- `OPENAI_MODEL_AUDIO` — default `whisper-1` (transcrição de áudio)
- `AWS_ACCESS_KEY_ID` — chave IAM com permissão s3:PutObject + GetObject no bucket
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME` — default sugerido `petdiary-uploads`
- `AWS_S3_REGION_NAME` — recomendo `sa-east-1` (São Paulo) para latência BR
- `AWS_S3_CUSTOM_DOMAIN` (opcional) — para servir via CloudFront

> Não dá pra usar nomenclatura `DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT` separadas como o exemplo do Ali — o petDiary já usa `dj-database-url` que aceita `DATABASE_URL=postgres://user:pass@host:port/dbname`. Podemos manter o `DATABASE_URL` (mais idiomático) e adicionar as variáveis OpenAI + S3 separadas.

---

## Plano de fases sugerido (a confirmar quando rodar)

### Fase X.1 — Preparar `.env` e `.env.example`
- Adicionar variáveis OpenAI + AWS aos arquivos `.env.local` e `.env.dev`
- Criar `.env.example` na raiz com todas as variáveis (sem valores reais), versionado no git
- **NUNCA commitar valores reais** — `.env*` continua no `.gitignore`

### Fase X.2 — Backend: integração com OpenAI
- `pip install openai` no requirements
- Criar `health/services/ai.py`:
  - `transcribe_audio(file_url) -> str` usando Whisper-1
  - `extract_text_from_image(file_url) -> str` (Vision API com gpt-4o-mini)
  - `summarize_record(text) -> str` (gera título + descrição automaticamente a partir de OCR)
- Endpoint `POST /pets/<id>/health-records/<rid>/process-ai/` que enfileira processamento
- Usar **Celery + Redis** para não bloquear request HTTP (Whisper pode demorar)

### Fase X.3 — Backend: trocar storage local por AWS S3
- `pip install django-storages[boto3]`
- `health/services/storage.py` (criado na Fase 7) ganha implementação `S3StorageBackend`
- Usar **Presigned URLs** (cliente faz upload direto pro S3, backend só assina)
- Configurar bucket: política IAM minimal, CORS para domínios do petDiary, lifecycle (30 dias para arquivos não-confirmados)
- Settings: `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'`
- Migrar arquivos existentes (script one-shot)

### Fase X.4 — Mobile: captura de foto + áudio
- Trocar mocks de `expo-image-picker`/`expo-av` pelos pacotes reais quando build EAS
- Pipeline: foto → presigned URL → upload S3 → POST /process-ai → polling do resultado
- Indicador "Processando…" enquanto IA roda

### Fase X.5 — Web: visualização do resultado da IA
- Mostrar `raw_extracted_text` no ClinicalView com formatação
- Botão "Aplicar texto" que preenche título/descrição do record automaticamente
- Permitir ao vet editar antes de salvar (IA não é fonte da verdade)

### Fase X.6 — Custos e observabilidade
- Limite de uso por usuário (gating FREE vs PRO da Spec 01)
- Sentry com tags de custo OpenAI
- Dashboard de custos AWS + OpenAI

---

## Decisões pendentes

- [ ] OpenAI direta ou via gateway (Anthropic, Replicate)? — recomendo OpenAI direto para começar (Whisper é state-of-art)
- [ ] Bucket S3 público ou todas as URLs presigned? — recomendo **tudo presigned** (privacidade médica)
- [ ] Região AWS: `sa-east-1` (São Paulo) ou `us-east-1` (mais barato)? — recomendo `sa-east-1` para LGPD
- [x] ~~Quem paga pelo processamento de IA: tudo no plano PRO, ou freemium com cota mensal?~~ → **DECIDIDO 2026-05-01: gated 100% pelo plano PRO** (sem cota free). FREE consegue só fazer upload e visualizar; PRO ganha OCR de receitas, Whisper, sumarização automática.
- [ ] Onde rodar Celery worker? Mesmo container ou serviço separado?

## ⚠️ Gating de IA por plano (decisão durável do Ali — 2026-05-01)

**Toda chamada de IA de mídia exige plano PRO ativo.** Implementação:

```python
# health/views.py (decorator de proteção)
from billing.permissions import IsActivePro

class ProcessAIView(APIView):
    permission_classes = [IsAuthenticated, IsActivePro]
    # ...
```

```python
# billing/permissions.py
class IsActivePro(BasePermission):
    message = "Recurso disponível apenas no plano PRO."

    def has_permission(self, request, view):
        sub = getattr(request.user, "subscription", None)
        return bool(sub and sub.plan_type == "PRO" and sub.status == "ACTIVE")
```

**No frontend:** ao tentar acionar IA, se status != PRO ATIVO, mostrar paywall ("Atualize para PRO" → leva para `/billing/subscribe`). Nunca chamar o endpoint sem checar plano antes (UX evita 403 surpresa).

**Endpoints afetados** (todos exigirão `IsActivePro`):
- `POST /pets/<id>/health-records/<rid>/process-ai/` — OCR + sumarização de imagens/PDFs
- `POST /pets/<id>/audio/transcribe/` — Whisper de áudio gravado
- Qualquer endpoint futuro de IA (resumo de exames, alerta de medicamentos, etc.)

**Endpoints NÃO afetados** (ficam livres no FREE):
- Upload puro pra S3 (`upload-url/`)
- Visualização e download de attachments
- CRUD de health records sem IA

---

## Variáveis a adicionar quando começar essa spec

```env
# === OpenAI ===
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL_TEXT=gpt-4o-mini
OPENAI_MODEL_AUDIO=whisper-1

# === AWS S3 ===
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_STORAGE_BUCKET_NAME=petdiary-uploads
AWS_S3_REGION_NAME=sa-east-1
# AWS_S3_CUSTOM_DOMAIN=cdn.petdiary.com.br  # opcional, via CloudFront
```

## Encaixe no roadmap

- Vem **depois da Fase 7** (uploads/storage abstrato local) — usa a mesma interface
- Pode rodar **antes da Spec 01** (assinaturas) se queremos diferenciar PRO por features de IA, ou **depois** se não há gating
- A produção (etapa final) precisa dessas integrações funcionando se o app vai prometer "IA pra extrair receitas"
