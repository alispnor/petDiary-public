# PetDiary Backend

API REST para o sistema **PetDiary** — um diário de saúde digital para pets, onde tutores registram vacinas, exames e consultas, e veterinarios acessam o historico via PIN temporario.

## Indice

- [Stack](#stack)
- [Pre-requisitos](#pre-requisitos)
- [Instalacao e execucao](#instalacao-e-execucao)
  - [Com Docker (recomendado)](#com-docker-recomendado)
  - [Sem Docker (local)](#sem-docker-local)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Modelagem de dados](#modelagem-de-dados)
- [Endpoints da API](#endpoints-da-api)
- [Autenticacao (JWT)](#autenticacao-jwt)
- [Permissoes](#permissoes)
- [Internacionalizacao (i18n)](#internacionalizacao-i18n)
- [Documentacao interativa](#documentacao-interativa)
- [Comandos uteis](#comandos-uteis)

---

## Stack

| Camada         | Tecnologia                          |
| -------------- | ----------------------------------- |
| Linguagem      | Python 3.11+                        |
| Framework      | Django 5+                           |
| API            | Django REST Framework               |
| Autenticacao   | JWT (SimpleJWT) via Bearer Token    |
| Banco de dados | PostgreSQL 15                       |
| Documentacao   | drf-spectacular (Swagger / ReDoc)   |
| Containers     | Docker / Docker Compose             |

---

## Pre-requisitos

### Com Docker

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.0

### Sem Docker

- Python 3.11+
- PostgreSQL 15
- pip

---

## Instalacao e execucao

### Com Docker (recomendado)

```bash
# 1. Clone o repositorio
git clone <url-do-repositorio>
cd petDiary-backend

# 2. Copie e ajuste as variaveis de ambiente
cp .env.example .env   # ou edite o .env existente

# 3. Suba os containers
docker compose up --build

# 4. Em outro terminal, rode as migracoes
docker compose exec api python manage.py migrate

# 5. Crie um superusuario (opcional, para acessar /admin)
docker compose exec api python manage.py createsuperuser

# 6. Acesse
#    API:     http://localhost:8000/api/v1/
#    Swagger: http://localhost:8000/api/docs/
#    ReDoc:   http://localhost:8000/api/redoc/
#    Admin:   http://localhost:8000/admin/
```

Para parar os containers:

```bash
docker compose down          # para os containers
docker compose down -v       # para e remove os volumes (apaga o banco)
```

### Sem Docker (local)

```bash
# 1. Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate    # Linux/macOS
# .venv\Scripts\activate     # Windows

# 2. Instale as dependencias
pip install -r backend/requirements.txt

# 3. Configure as variaveis de ambiente
#    Edite o .env na raiz com a DATABASE_URL apontando para seu PostgreSQL local
#    Exemplo: DATABASE_URL=postgres://usuario:senha@localhost:5432/petdiary

# 4. Rode as migracoes
cd backend
python manage.py migrate

# 5. Crie um superusuario (opcional)
python manage.py createsuperuser

# 6. Inicie o servidor de desenvolvimento
python manage.py runserver
```

---

## Variaveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variaveis:

| Variavel         | Descricao                              | Valor padrao (dev)                              |
| ---------------- | -------------------------------------- | ----------------------------------------------- |
| `SECRET_KEY`     | Chave secreta do Django                | `change-me-in-production-use-a-real-secret`     |
| `DEBUG`          | Modo debug                             | `True`                                          |
| `ALLOWED_HOSTS`  | Hosts permitidos (separados por `,`)   | `*`                                             |
| `DATABASE_URL`   | URL de conexao com o PostgreSQL        | `postgres://petdiary:petdiary@db:5432/petdiary` |

> **Importante:** Em producao, altere `SECRET_KEY` para um valor aleatorio seguro, defina `DEBUG=False` e restrinja `ALLOWED_HOSTS`.

---

## Estrutura do projeto

```
petDiary-backend/
├── .env                        # Variaveis de ambiente
├── docker-compose.yml          # Orquestracao dos containers (db + api)
├── README.md
└── backend/
    ├── Dockerfile              # Imagem Docker da API
    ├── requirements.txt        # Dependencias Python
    ├── manage.py               # CLI do Django
    ├── petdiary/               # Projeto Django (settings, urls, wsgi)
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── accounts/               # App: usuarios (User customizado)
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── admin.py
    │   └── urls.py
    ├── pets/                   # App: pets (CRUD + permissoes)
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── permissions.py      # IsTutorOrHasVetAccess
    │   ├── admin.py
    │   └── urls.py
    ├── health/                 # App: registros de saude
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── admin.py
    │   └── urls.py
    └── access/                 # App: tokens de acesso vet (PIN)
        ├── models.py
        ├── serializers.py
        ├── views.py
        ├── admin.py
        └── urls.py
```

---

## Modelagem de dados

### User (`accounts`)

| Campo       | Tipo          | Descricao                                    |
| ----------- | ------------- | -------------------------------------------- |
| `id`        | UUID (PK)     | Identificador unico                          |
| `username`  | CharField     | Nome de usuario (herdado do AbstractUser)    |
| `email`     | EmailField    | E-mail                                       |
| `full_name` | CharField     | Nome completo                                |
| `role`      | CharField     | Papel: `TUTOR` ou `VET`                      |
| `iam_uid`   | CharField     | UID externo de provedor de identidade        |
| `crmv`      | CharField     | Registro CRMV (apenas veterinarios)          |

### Pet (`pets`)

| Campo       | Tipo          | Descricao                                    |
| ----------- | ------------- | -------------------------------------------- |
| `id`        | UUID (PK)     | Identificador unico                          |
| `tutor`     | FK -> User    | Dono do pet                                  |
| `name`      | CharField     | Nome do pet                                  |
| `species`   | CharField     | Especie: `DOG`, `CAT`, `BIRD`, `OTHER`      |
| `breed`     | CharField     | Raca                                         |
| `weight_kg` | DecimalField  | Peso em kg                                   |

### HealthRecord (`health`)

| Campo                | Tipo          | Descricao                                    |
| -------------------- | ------------- | -------------------------------------------- |
| `id`                 | UUID (PK)     | Identificador unico                          |
| `pet`                | FK -> Pet     | Pet associado                                |
| `author`             | FK -> User    | Quem criou o registro                        |
| `record_type`        | CharField     | Tipo: `VACCINE`, `EXAM`, `PRESCRIPTION`, `SURGERY`, `NOTE` |
| `title`              | CharField     | Titulo do registro                           |
| `description`        | TextField     | Descricao detalhada                          |
| `date_occurred`      | DateField     | Data da ocorrencia                           |
| `raw_extracted_text` | TextField     | Texto bruto extraido via OCR                 |

### VetAccessToken (`access`)

| Campo          | Tipo           | Descricao                                   |
| -------------- | -------------- | ------------------------------------------- |
| `id`           | UUID (PK)      | Identificador unico                         |
| `pet`          | FK -> Pet      | Pet a ser acessado                          |
| `vet`          | FK -> User     | Veterinario que usou o PIN (null ate claim) |
| `access_code`  | CharField (6)  | PIN de 6 digitos gerado automaticamente     |
| `expires_at`   | DateTimeField  | Data/hora de expiracao                      |
| `is_active`    | BooleanField   | Se o token esta ativo                       |
| `is_used`      | BooleanField   | Se o token ja foi utilizado                 |
| `deleted_at`   | DateTimeField  | Soft delete (null = nao excluido)           |

---

## Endpoints da API

Todos os endpoints estao sob o prefixo `/api/v1/`.

### Autenticacao

| Metodo | Endpoint               | Descricao                   | Auth |
| ------ | ---------------------- | --------------------------- | ---- |
| POST   | `/auth/token/`         | Obter par de tokens JWT     | Nao  |
| POST   | `/auth/token/refresh/` | Renovar access token        | Nao  |
| POST   | `/auth/register/`      | Registrar novo usuario      | Nao  |
| GET    | `/users/me/`           | Ver perfil do usuario       | Sim  |
| PUT    | `/users/me/`           | Atualizar perfil            | Sim  |

### Pets

| Metodo | Endpoint       | Descricao                        | Auth |
| ------ | -------------- | -------------------------------- | ---- |
| GET    | `/pets/`       | Listar pets do usuario           | Sim  |
| POST   | `/pets/`       | Criar novo pet                   | Sim  |
| GET    | `/pets/{id}/`  | Detalhar um pet                  | Sim  |
| PUT    | `/pets/{id}/`  | Atualizar pet                    | Sim  |
| PATCH  | `/pets/{id}/`  | Atualizar parcialmente           | Sim  |
| DELETE | `/pets/{id}/`  | Remover pet                      | Sim  |

### Registros de saude

| Metodo | Endpoint                                        | Descricao                           | Auth |
| ------ | ----------------------------------------------- | ----------------------------------- | ---- |
| GET    | `/pets/{pet_id}/health-records/`                | Listar registros do pet             | Sim  |
| POST   | `/pets/{pet_id}/health-records/`                | Criar registro de saude             | Sim  |
| GET    | `/pets/{pet_id}/health-records/{id}/`           | Detalhar registro                   | Sim  |
| PUT    | `/pets/{pet_id}/health-records/{id}/`           | Atualizar registro                  | Sim  |
| PATCH  | `/pets/{pet_id}/health-records/{id}/`           | Atualizar parcialmente              | Sim  |
| DELETE | `/pets/{pet_id}/health-records/{id}/`           | Remover registro                    | Sim  |
| POST   | `/pets/{pet_id}/health-records/upload-url/`     | Gerar URL mock de upload (S3)       | Sim  |

### Acesso veterinario (PIN)

| Metodo | Endpoint                | Descricao                                          | Auth |
| ------ | ----------------------- | -------------------------------------------------- | ---- |
| POST   | `/access/generate-pin/` | Tutor gera um PIN de 6 digitos para um pet         | Sim  |
| POST   | `/access/claim/`        | Veterinario valida o PIN e obtem acesso ao pet     | Sim  |

---

## Autenticacao (JWT)

A API usa **Bearer Token** via [SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/).

### Obter tokens

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "seu_usuario", "password": "sua_senha"}'
```

Resposta:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

### Usar o token nas requisicoes

```bash
curl http://localhost:8000/api/v1/pets/ \
  -H "Authorization: Bearer <access_token>"
```

### Renovar o access token

```bash
curl -X POST http://localhost:8000/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

| Token   | Validade |
| ------- | -------- |
| Access  | 30 min   |
| Refresh | 7 dias   |

---

## Permissoes

A permissao central e a classe `IsTutorOrHasVetAccess` (`pets/permissions.py`):

- **Tutor (`TUTOR`)**: acessa apenas seus proprios pets e os registros de saude associados.
- **Veterinario (`VET`)**: so acessa um pet se possuir um `VetAccessToken` valido, ativo e nao expirado.

### Fluxo de acesso veterinario

```
1. Tutor cria um PIN  ->  POST /api/v1/access/generate-pin/
   (envia: pet, expires_at)
   (recebe: access_code de 6 digitos)

2. Tutor compartilha o PIN com o veterinario

3. Veterinario valida o PIN  ->  POST /api/v1/access/claim/
   (envia: access_code)
   (resultado: token e vinculado ao vet, is_used=true)

4. Veterinario agora pode acessar o pet e seus registros de saude
```

---

## Internacionalizacao (i18n)

O backend suporta tres idiomas:

| Codigo  | Idioma              |
| ------- | ------------------- |
| `pt-br` | Portugues (Brasil)  |
| `en`    | Ingles              |
| `es`    | Espanhol            |

O idioma padrao e `pt-br`. Para solicitar respostas em outro idioma, envie o header:

```
Accept-Language: en
```

Todos os labels dos models usam `gettext_lazy` para traducao. Para gerar/compilar os arquivos de traducao:

```bash
docker compose exec api python manage.py makemessages -l en -l es
docker compose exec api python manage.py compilemessages
```

---

## Documentacao interativa

Com o servidor rodando, acesse:

| Ferramenta | URL                                    |
| ---------- | -------------------------------------- |
| Swagger UI | http://localhost:8000/api/docs/        |
| ReDoc      | http://localhost:8000/api/redoc/       |
| Schema raw | http://localhost:8000/api/schema/      |

---

## Comandos uteis

```bash
# Subir os containers em modo detached
docker compose up -d --build

# Ver logs da API em tempo real
docker compose logs -f api

# Rodar migracoes
docker compose exec api python manage.py migrate

# Criar migracoes apos alterar models
docker compose exec api python manage.py makemigrations

# Criar superusuario
docker compose exec api python manage.py createsuperuser

# Abrir shell do Django
docker compose exec api python manage.py shell

# Abrir shell do banco de dados
docker compose exec db psql -U petdiary -d petdiary

# Rodar testes
docker compose exec api python manage.py test

# Gerar arquivos de traducao
docker compose exec api python manage.py makemessages -l en -l es
docker compose exec api python manage.py compilemessages
```

---

## Licenca

Este projeto e privado e de uso interno.
