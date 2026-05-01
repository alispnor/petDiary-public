"""Smoke tests E2E do core do petDiary (Spec 16).

Cinco fluxos críticos do produto, cada um isolado por fixtures:

1. test_user_authentication — login JWT
2. test_tutor_generates_pin — Tutor gera PIN de 6 dígitos
3. test_vet_claims_pin — Vet faz claim com o PIN
4. test_vet_access_revoked — Tutor revoga, próximo request do Vet → 403
5. test_create_health_record — Tutor cria registro na timeline

Todos marcados com @pytest.mark.smoke. Para rodar só smoke:
    docker compose exec api pytest -m smoke -v
"""
import pytest

from access.models import VetAccessToken


pytestmark = [pytest.mark.smoke, pytest.mark.django_db]


# =====================================================
# 1. Autenticação
# =====================================================
def test_user_authentication(api_client, tutor):
    """Login com username/password retorna JWT (access + refresh)."""
    response = api_client.post(
        "/api/v1/auth/token/",
        {"username": "tutor1", "password": "senha12345"},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["access"]
    assert data["refresh"]


# =====================================================
# 2. Tutor gera PIN
# =====================================================
def test_tutor_generates_pin(tutor_client, pet):
    """Tutor cria PIN de 6 dígitos para o seu pet. Default expires_at = now+1h."""
    response = tutor_client.post(
        "/api/v1/access/generate-pin/",
        {"pet": str(pet.id)},
        format="json",
    )

    assert response.status_code == 201
    data = response.json()
    assert "access_code" in data
    assert len(data["access_code"]) == 6
    assert data["access_code"].isdigit()
    assert data["is_active"] is True
    assert data["is_used"] is False
    assert data["expires_at"]  # default = now + 1h


# =====================================================
# 3. Vet faz claim do PIN
# =====================================================
def test_vet_claims_pin(api_client, tutor, vet, pet):
    """Vet usa o PIN para reivindicar acesso ao prontuário."""
    # Tutor cria PIN
    api_client.force_authenticate(user=tutor)
    pin_response = api_client.post(
        "/api/v1/access/generate-pin/", {"pet": str(pet.id)}, format="json"
    )
    assert pin_response.status_code == 201
    pin = pin_response.json()["access_code"]

    # Vet faz claim
    api_client.force_authenticate(user=vet)
    claim_response = api_client.post(
        "/api/v1/access/claim/", {"access_code": pin}, format="json"
    )

    assert claim_response.status_code == 200
    data = claim_response.json()
    assert data["pet"] == str(pet.id)
    assert data["vet"] == str(vet.id)
    assert data["is_used"] is True
    assert data["claimed_at"] is not None

    # Vet agora consegue ler o pet
    pet_response = api_client.get(f"/api/v1/pets/{pet.id}/")
    assert pet_response.status_code == 200
    assert pet_response.json()["name"] == "Rex"


# =====================================================
# 4. Tutor revoga → vet recebe 403
# =====================================================
def test_vet_access_revoked(api_client, tutor, vet, pet):
    """Tutor revoga o token; próximo request do vet retorna 403 Forbidden."""
    # Setup: tutor cria PIN, vet faz claim
    api_client.force_authenticate(user=tutor)
    pin_response = api_client.post(
        "/api/v1/access/generate-pin/", {"pet": str(pet.id)}, format="json"
    )
    token_id = pin_response.json()["id"]
    pin = pin_response.json()["access_code"]

    api_client.force_authenticate(user=vet)
    api_client.post(
        "/api/v1/access/claim/", {"access_code": pin}, format="json"
    )

    # Vet consegue ler o pet (acesso ativo)
    assert (
        api_client.get(f"/api/v1/pets/{pet.id}/").status_code == 200
    )

    # Tutor revoga (soft-delete: is_active=False, deleted_at=now)
    api_client.force_authenticate(user=tutor)
    revoke_response = api_client.post(
        f"/api/v1/access/tokens/{token_id}/revoke/"
    )
    assert revoke_response.status_code == 200

    # Confere soft-delete no banco
    token = VetAccessToken.objects.get(id=token_id)
    assert token.is_active is False
    assert token.deleted_at is not None

    # Vet tenta de novo → 403 (vet tem histórico mas sem acesso ativo)
    api_client.force_authenticate(user=vet)
    after_revoke = api_client.get(f"/api/v1/pets/{pet.id}/")
    assert after_revoke.status_code == 403


# =====================================================
# 5. Tutor cria HealthRecord
# =====================================================
def test_create_health_record(tutor_client, pet):
    """Tutor cria registro na timeline do pet."""
    payload = {
        "record_type": "NOTE",
        "title": "Primeira anotação",
        "description": "Pet ativo, peso normal.",
        "date_occurred": "2026-05-01",
    }
    response = tutor_client.post(
        f"/api/v1/pets/{pet.id}/health-records/",
        payload,
        format="json",
    )

    assert response.status_code == 201
    data = response.json()
    assert data["record_type"] == "NOTE"
    assert data["title"] == "Primeira anotação"
    assert data["pet"] == str(pet.id)

    # Confere que aparece no GET da lista
    list_response = tutor_client.get(f"/api/v1/pets/{pet.id}/health-records/")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["title"] == "Primeira anotação"
