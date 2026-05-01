# Spec 14 — Auditoria de Segurança + Performance + Testes (Backend)

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Engenheiro de Segurança de Software (SecOps) + Especialista em
> Performance Backend (Python/Django).
> **Objetivo:** auditar, encontrar vulnerabilidades, otimizar e propor testes
> para o backend do petDiary.

## Escopo

Analisar arquivos de **Models, Views e Serializers** e executar 3 tarefas:

### 1. Auditoria de Segurança (Vulnerabilidades)
- **JWT**: verificar se tempo de expiração do access token é curto e se
  refresh está sendo rotacionado adequadamente.
- **Uploads**: garantir que usuários não podem enviar scripts maliciosos
  disfarçados de imagens (File Upload Vulnerability).
- **Permissões (IsTutorOrHasVetAccess / IsPetMemberOrHasVetAccess)**:
  assegurar que é impossível um tutor visualizar pet de outro tutor por
  manipulação de ID na URL (IDOR — Insecure Direct Object Reference).

### 2. Otimização de Performance (Gargalos de DB)
- Buscar problemas **N+1 Queries** nos endpoints de listagem (ex.: timeline
  do pet). Reescrever com `select_related` / `prefetch_related`.
- Verificar se campos de busca comuns (`pet_id`, `date_occurred`, etc) têm
  indexação (`db_index=True`) ou índices compostos.

### 3. Testes Automatizados (QA)
- Suíte `pytest` + `pytest-django` para o endpoint de Geração e Validação
  do PIN de Acesso do Veterinário.
- Validar regra de negócio do **Soft Delete**: PIN revogado retorna
  HTTP 403 Forbidden.

## Entregável esperado

1. **Lista de problemas encontrados com gravidade** (Critical/High/Medium/Low)
2. **Código refatorado** corrigindo as falhas
3. **Testes pytest** rodáveis via `docker compose exec api pytest`

## Contexto petDiary (estado em 2026-05-01)

Já implementado que toca os pontos da auditoria:
- `SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True` + `BLACKLIST_AFTER_ROTATION=True`
  (settings.py)
- ACCESS=30min, REFRESH=7 dias
- Login único de vet (PetDiaryTokenObtainPairView blacklista refresh anterior)
- `IsPetMemberOrHasVetAccess` com `has_permission` (rotas aninhadas) e
  `has_object_permission` (objetos), distingue 404/403 (Bug #8 fechado)
- `UniqueConstraint` parcial em `access_code` ativo (Bug #6 fechado)
- Rate limit por escopo em endpoints sensíveis (Fase G)

A auditoria DEVE ainda assim revisar os pontos acima — pode encontrar
gaps que escaparam.

## Notas

- Backend usa `select_related` em algumas queries (ver `access/views.py`)
  mas não foi auditado N+1 sistematicamente
- `HealthRecord` tem timeline pesada — alvo principal pra otimização
- Anexos (`HealthRecordAttachment`) usam storage abstrato; auditoria de
  upload deve cobrir o `LocalStorageBackend` E o stub `S3StorageBackend`
- Sem suite pytest hoje — esta spec instala/configura também
