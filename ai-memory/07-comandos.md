# 07 — Comandos úteis

Cole e use. Tudo a partir da raiz do monorepo (`~/projects/petDiary`).

## Subir o ambiente todo

```bash
# Definir IP local (necessário pro Expo Go conectar do celular)
export HOST_IP=$(hostname -I | awk '{print $1}')

# Subir tudo (db + api + mobile + web)
cd petDiary-backend
docker compose up --build

# Ou em background
docker compose up -d --build
```

Acessos:
- API:     http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Web:     http://localhost:5173
- Mobile:  abra Expo Go no celular e escaneie o QR do terminal

## Comandos do Django

```bash
# Migrações
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate

# Superusuário
docker compose exec api python manage.py createsuperuser

# Shell Django
docker compose exec api python manage.py shell

# Shell Postgres
docker compose exec db psql -U petdiary -d petdiary

# Logs em tempo real
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mobile

# Rodar testes (quando existirem)
docker compose exec api python manage.py test
```

## Snippets de seed (cole no shell Django)

```python
from accounts.models import User
from pets.models import Pet
from datetime import datetime, timedelta
from django.utils import timezone

# Criar tutor
tutor = User.objects.create_user(
    username="ana",
    email="ana@petdiary.com",
    password="ana123456",
    full_name="Ana Silva",
    role=User.Role.TUTOR,
)

# Criar vet
vet = User.objects.create_user(
    username="dra-camila",
    email="camila@vetclin.com",
    password="vet123456",
    full_name="Dra. Camila Souza",
    role=User.Role.VET,
    crmv="SP-12345",
)

# Criar pet
pet = Pet.objects.create(
    tutor=tutor,
    name="Thor",
    species=Pet.Species.DOG,
    breed="Golden Retriever",
    weight_kg=32,
)

# Gerar PIN (válido por 1 hora)
from access.models import VetAccessToken
token = VetAccessToken.objects.create(
    pet=pet,
    expires_at=timezone.now() + timedelta(hours=1),
)
print(f"PIN: {token.access_code}")
```

## Testar fluxo via curl

```bash
# Login (tutor)
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ana","password":"ana123456"}' | jq -r .access)

# Listar pets
curl http://localhost:8000/api/v1/pets/ \
  -H "Authorization: Bearer $TOKEN"

# Gerar PIN para o pet
PET_ID="..."
EXPIRES="2026-12-31T23:59:59Z"
curl -X POST http://localhost:8000/api/v1/access/generate-pin/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"pet\":\"$PET_ID\",\"expires_at\":\"$EXPIRES\"}"
```

## Parar e limpar

```bash
docker compose down            # para containers
docker compose down -v         # para + apaga volumes (banco zerado)
docker compose down --rmi all  # + apaga imagens
```

## Git

```bash
# Status do monorepo (3 sub-projetos no mesmo repo)
git status
git log --oneline -10
```
