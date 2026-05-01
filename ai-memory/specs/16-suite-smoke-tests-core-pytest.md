# Spec 16 — Suíte inicial de Smoke Tests (pytest E2E da API core)

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Engenheiro de Qualidade (QA) especialista em Python e
> `pytest-django`.
> **Objetivo:** criar a suíte inicial de smoke tests E2E para os 5 fluxos
> mais críticos do core business do petDiary.

## Escopo

Criar o arquivo `tests/test_smoke_core.py` (caminho exato: a definir entre
`petDiary-backend/backend/tests/` ou cada app ter seus próprios — ver
"Notas de implementação" abaixo).

Foco APENAS nos 5 fluxos mais críticos. Use fixtures do pytest para gerar
usuários (Tutor e Vet) e o Pet.

## 5 testes obrigatórios

Implementar E2E chamando diretamente as URLs da API com `APIClient` do DRF:

1. **`test_user_authentication`** — login e geração do JWT.
2. **`test_tutor_generates_pin`** — Tutor gera PIN de 6 dígitos para seu Pet.
3. **`test_vet_claims_pin`** — Vet usa o endpoint de claim passando o PIN
   gerado no teste anterior.
4. **`test_vet_access_revoked`** — regra de negócio do Soft Delete. Tutor
   revoga o PIN, próximo request do Vet retorna **HTTP 403 Forbidden**.
5. **`test_create_health_record`** — Tutor (ou Vet com acesso ativo) cria
   novo registro médico na timeline do Pet.

## Restrições

- **NÃO** mockar o banco de dados — usar o banco de testes nativo do Django
  (`@pytest.mark.django_db`).
- Código limpo, nomes de funções descritivos.
- Cada teste isolado (fixture-driven) — não depender de ordem de execução
  do pytest. Se o teste 3 precisa de PIN do teste 2, criar um helper
  reutilizável ou fixture.

## Dependências a instalar

Adicionar em `requirements.txt` (ou `requirements-dev.txt` se preferir
separar):

```
pytest>=8.0
pytest-django>=4.8
```

Configurar `pyproject.toml` ou `pytest.ini`:

```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "petdiary.settings"
python_files = ["tests.py", "test_*.py", "*_tests.py"]
```

## Como rodar

```bash
docker compose exec api pytest tests/test_smoke_core.py -v
```

## Contexto petDiary (estado em 2026-05-01)

### Endpoints relevantes (já implementados)
- `POST /api/v1/auth/token/` → login JWT (PetDiaryTokenObtainPairView)
- `POST /api/v1/auth/register/` → cadastro
- `GET  /api/v1/users/me/` → perfil
- `POST /api/v1/pets/` → criar pet (cria PetMember(OWNER) automático)
- `POST /api/v1/access/generate-pin/` → tutor gera PIN
  - Body: `{"pet": "<uuid>"}` (expires_at default = +1h)
  - Resposta: `{"id", "access_code", "expires_at", ...}`
- `POST /api/v1/access/claim/` → vet faz claim
  - Body: `{"access_code": "123456"}`
  - Resposta: `{"id", "pet", "vet", "claimed_at", ...}`
- `POST /api/v1/access/tokens/<id>/revoke/` → tutor revoga
- `GET  /api/v1/pets/<pet_id>/` → 200/403/404 com semântica do bug #8
- `POST /api/v1/pets/<pet_id>/health-records/` → criar record
  - Body: `{"record_type": "NOTE", "title": "...", "description": "...", "date_occurred": "2026-05-01"}`

### Modelos
- `accounts.User` com `Role.TUTOR | VET | ADMIN`, campos de cadastro
  estendidos (phone, document, crmv, clinic_name, address_*, etc)
- `pets.Pet` (id UUID, tutor FK, name, species, breed, weight_kg)
- `pets.PetMember` (pet, user, role OWNER/CARETAKER) — criado automaticamente
  pelo `PetSerializer.create()` quando tutor cria pet
- `access.VetAccessToken` (access_code 6 dígitos único entre ativos,
  is_active, is_used, deleted_at, expires_at, claimed_at)
- `health.HealthRecord` (pet, author, record_type, title, description,
  date_occurred, raw_extracted_text)

### Permissões críticas para testar
- `IsPetMemberOrHasVetAccess` — ver `pets/permissions.py`
  - `has_permission`: valida `pet_pk` da URL em rotas aninhadas
  - `has_object_permission`: valida acesso ao objeto
- Bug #8 fix: vet com histórico mas sem acesso ativo → 403; vet sem
  histórico → 404
- Bug #11 fix: list/create de health-records exige acesso ao pet pai

### Pontos de atenção
- `User.create_user()` aceita `role=` mas não as flags do superuser
- `Pet` requer um tutor; `PetMember(OWNER)` é criado pelo serializer
  (se for usar `Pet.objects.create()` direto, criar o member manualmente
  no fixture)
- Caretaker (CARETAKER) pode CRIAR health-record mas NÃO gerar PIN
- Vet sem token ativo → 403 em /pets/<id>/health-records/ (list/create)
- Token revogado: `is_active=False, deleted_at != null`
- O teste de geração de PIN deve checar `len(access_code) == 6`,
  `access_code.isdigit() == True` e `is_active == True`

### Helpers / fixtures sugeridos

```python
import pytest
from rest_framework.test import APIClient
from accounts.models import User
from pets.models import Pet, PetMember

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def tutor(db):
    return User.objects.create_user(
        username="tutor1", password="senha12345",
        email="tutor@test.com", phone="11999990001",
        full_name="Tutor Test", role=User.Role.TUTOR,
    )

@pytest.fixture
def vet(db):
    return User.objects.create_user(
        username="vet1", password="senha12345",
        email="vet@test.com", phone="11999990002",
        full_name="Vet Test", role=User.Role.VET,
        crmv="SP-99999", clinic_name="Clínica Test",
    )

@pytest.fixture
def pet(tutor):
    p = Pet.objects.create(
        tutor=tutor, name="Rex", species="DOG", breed="SRD",
    )
    PetMember.objects.create(pet=p, user=tutor, role=PetMember.Role.OWNER)
    return p

@pytest.fixture
def authed_client(api_client, tutor):
    """APIClient autenticado como tutor — usar para testes que precisam
    de sessão. Para login real (test 1), instanciar APIClient na hora."""
    api_client.force_authenticate(user=tutor)
    return api_client
```

## Entregável esperado

1. **`tests/test_smoke_core.py`** com os 5 testes implementados
2. **`pytest.ini`** ou seção em `pyproject.toml` configurando
   `DJANGO_SETTINGS_MODULE`
3. **`requirements.txt`** (ou dev) com pytest + pytest-django
4. **README curto** ou seção em `07-comandos.md` mostrando como rodar
5. Todos os 5 testes **passando** quando rodados via
   `docker compose exec api pytest`

## Bonus (se sobrar tempo)

- Configurar `--cov=petDiary-backend/backend --cov-report=term-missing`
  para ver cobertura
- Marker `@pytest.mark.smoke` aplicado aos 5 testes — permite rodar só
  smoke em CI rápido
- Adicionar workflow GitHub Actions rodando `pytest -m smoke` em todo PR
