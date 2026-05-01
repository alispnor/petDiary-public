"""Fixtures globais para a suíte de testes do petDiary.

- `api_client`: APIClient cru (sem auth)
- `tutor` / `vet`: Users prontos
- `pet`: Pet do tutor com PetMember(OWNER) já criado
- `tutor_client` / `vet_client`: APIClient autenticado via force_authenticate
"""
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
        username="tutor1",
        password="senha12345",
        email="tutor@test.com",
        phone="11999990001",
        full_name="Tutor Test",
        role=User.Role.TUTOR,
    )


@pytest.fixture
def vet(db):
    return User.objects.create_user(
        username="vet1",
        password="senha12345",
        email="vet@test.com",
        phone="11999990002",
        full_name="Vet Test",
        role=User.Role.VET,
        crmv="SP-99999",
        clinic_name="Clínica Test",
    )


@pytest.fixture
def pet(tutor):
    p = Pet.objects.create(
        tutor=tutor,
        name="Rex",
        species="DOG",
        breed="SRD",
    )
    PetMember.objects.create(
        pet=p, user=tutor, role=PetMember.Role.OWNER
    )
    return p


@pytest.fixture
def tutor_client(api_client, tutor):
    api_client.force_authenticate(user=tutor)
    return api_client


@pytest.fixture
def vet_client(api_client, vet):
    api_client.force_authenticate(user=vet)
    return api_client
