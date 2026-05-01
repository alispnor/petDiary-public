# 05 — Plano de Ação

> **Onde começar e onde finalizar.** Ordem pensada para fechar a Fase 1 (MVP Clínico).

## Princípio guia

Hoje temos 3 esqueletos bonitos mas **desconectados**. A próxima virada de chave é **fazer um único fluxo end-to-end funcionar**: tutor cria pet → gera PIN → vet usa PIN → vê dados reais. Tudo o resto sai daí.

## A pergunta certa: por onde começar?

**Comece pelo backend** — é a fundação. Quase todos os bugs achados são contratos quebrados entre cliente↔servidor. Estabilizar o backend primeiro evita refazer integração 3 vezes.

---

## Etapa 0 — Estabilização (1 dia)

Bloqueia tudo o resto. Tem que ser feito antes.

| # | Tarefa | Onde | Critério de pronto |
|---|---|---|---|
| 0.1 | ~~Adicionar `django-cors-headers`~~ ✅ FEITO em 2026-05-01 | backend | Web chama API sem CORS error |
| 0.2 | Padronizar `EXPO_PUBLIC_API_URL` para incluir `/api/v1` | mobile | api.post('/pets/') funciona |
| 0.3 | Corrigir payload do claim no web (`{access_code}` em vez de `{pin}`) | web | PIN válido autentica vet |
| 0.4 | Definir `expires_at` default (1h) se vier vazio | backend | Tutor consegue gerar PIN sem precisar mandar data |
| 0.5 | Criar superuser + 2 usuários de seed (1 TUTOR, 1 VET) | backend | `docker compose exec api python manage.py shell` cria fixtures |

---

## Etapa 1 — Fluxo E2E mínimo: Tutor → PIN → Vet (2-3 dias)

**Objetivo:** Provar a tese técnica do produto. Um único pet, um PIN real, vet vendo dados reais.

### 1.1 Login no Tutor (mobile)
- Tela `Login` com username/password
- POST `/auth/token/` → guardar `access` + `refresh` no Zustand persistido
- Redirecionar para `HomeTutor`

### 1.2 Listar pets reais
- Substituir `MOCK_PETS` em `HomeTutor` por `GET /pets/`
- Estado de loading + erro
- Tela vazia se não houver pets (com CTA "Criar pet")

### 1.3 Criar pet (mobile)
- Form simples: nome, espécie, raça
- `POST /pets/` → invalidar lista
- (deixar `birth_date` e `avatar` para depois — primeiro o models precisa ser estendido)

### 1.4 Gerar PIN real (mobile)
- Trocar `Math.random()` por `POST /access/generate-pin/` com `{ pet: <id> }`
- Mostrar o `access_code` retornado em modal
- Botão "Compartilhar via WhatsApp" (linkar `whatsapp://send?text=...`)

### 1.5 Login no Vet (web)
- Tela `/login` antes do dashboard
- POST `/auth/token/` → guardar `access` no `authStore`
- Proteger `/` e `/clinical/:pin` com guard

### 1.6 Vet usa PIN real
- Corrigir `claim` (já feito na 0.3)
- Após claim, **buscar pets disponíveis**: `GET /pets/` (vet recebe os que tem acesso, vide `PetViewSet.get_queryset`)
- Substituir `MOCK_PET` em `clinicalStore` por busca real

### 1.7 Vet vê timeline real
- `GET /pets/<id>/health-records/` em `ClinicalView`
- Substituir `MOCK_TIMELINE` por dados reais

### 1.8 Vet adiciona nota real
- `addNote` deve fazer `POST /pets/<id>/health-records/` com `record_type=NOTE`
- Após sucesso, dar refetch da timeline

**🎯 Marco:** ao final da Etapa 1, o sistema está vivo. Demo funciona.

---

## Etapa 2 — Polimento e robustez (2 dias)

Tudo o que o usuário precisa pra não ficar irritado.

### 2.1 Estender `Pet` model
- Adicionar `birth_date` (Date, nullable) e `avatar` (URLField, nullable)
- Migration + atualizar serializer
- Atualizar form de criar pet no mobile

### 2.2 Revogação de PIN
- Endpoint `POST /access/<id>/revoke/` (apenas tutor dono)
- Tela "Acessos ativos" no mobile (lista PINs ativos por pet)
- Botão revogar em cada item
- Web: garantir que ao receber 403/404 no `ClinicalView`, exibe `RevokedModal`

### 2.3 Histórico de acessos do vet
- Endpoint `GET /access/recent/` (lista últimos `VetAccessToken` onde `vet=request.user, is_used=true`)
- Substituir `MOCK_HISTORY` na sidebar do `VetDashboard`

### 2.4 Validação de PIN único ativo
- Loop no `generate_access_code` checando duplicação

### 2.5 Estado de loading/erro consistente
- Skeletons ou spinners em listas
- Toasts/banners de erro em forms

### 2.6 Logout em ambos clientes
- Botão "Sair" no mobile (HomeTutor header)
- Já existe no web

---

## Etapa 3 — IA aplicada (Fase 1 do roadmap, parte "IA")

Pode ser paralelizado com Etapa 2.

### 3.1 Upload real S3
- Bucket S3 + IAM com permissão minimal
- Backend: trocar mock por boto3 + presigned URL real
- Mobile: já chama `upload-url/`, basta corrigir path (bug #3)

### 3.2 OCR com AWS Textract
- Após upload bem-sucedido, mobile dispara `POST /pets/<id>/health-records/process/` com a `key` do S3
- Backend pega o arquivo, chama Textract, salva resultado em `raw_extracted_text`
- Sugere preencher `title` e `description` automaticamente

### 3.3 Speech-to-Text (diário falado)
- Mobile: tela com botão de gravar (expo-av)
- Upload do audio + endpoint para transcrição (AWS Transcribe ou Whisper)
- Cria HealthRecord com `record_type=NOTE`

---

## Etapa 4 — Pronto pra usuário real (1-2 dias)

- [ ] Cobertura mínima de testes (pytest no backend, smoke tests no front)
- [ ] Rate limiting (DRF throttling)
- [ ] Erros amigáveis em pt-br
- [ ] Privacidade: termos de uso e política
- [ ] Build de produção do mobile (EAS Build)
- [ ] Deploy backend (decidir: Fly.io, Railway, AWS ECS?)
- [ ] Deploy web (Vercel/Netlify)

---

## Resumo do "onde finalizar"

A Fase 1 está **pronta** quando:

1. ✅ Tutor instala app, faz cadastro/login, cria um pet, faz upload de uma foto de receita
2. ✅ A IA extrai o texto e cria um `HealthRecord` automaticamente
3. ✅ Tutor gera PIN, compartilha
4. ✅ Vet acessa portal, faz login, digita PIN, vê o histórico
5. ✅ Vet adiciona uma nota clínica que aparece na timeline
6. ✅ Tutor revoga PIN; vet é deslogado da sessão imediatamente

Isso é o **MVP Clínico**. Sem isso pronto, não faz sentido começar Fase 2 (alertas) ou Fase 3 (rede social).
