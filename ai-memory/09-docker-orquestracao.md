# 09 — Docker Compose Unificado

> Atualizado em 2026-05-01. Docker Compose agora vive na **raiz do monorepo**, com perfis e env files separados.

## Estrutura

```
petDiary/
├── docker-compose.yml        # ⭐ orquestra db + api + web + mobile + caddy
├── .env.local                # vars para dev local (sem reverse proxy)
├── .env.dev                  # vars para deploy de desenvolvimento (com Caddy)
├── petDiary-backend/         # Django (sub-projeto)
├── petDiary-frontend-mobile/ # Expo (sub-projeto)
└── petDiary-frontend-web/    # React/Vite (sub-projeto)
```

> ⚠️ Há um `docker-compose.yml` antigo em `petDiary-backend/`. Considere remover quando o novo estiver validado.

## Perfis

| Perfil | Quando | Inclui |
|---|---|---|
| (default) | dev local sem Expo | db + api + web |
| `mobile` | dev local com app mobile | + mobile (Expo Go) |
| `local` | mesmo que `mobile` (alias) | + mobile |
| `dev` | deploy de desenvolvimento | + caddy (reverse proxy) |
| `hom` | homologação | + caddy |
| `prod` | produção | + caddy |

## Comandos

### Local (sem mobile)

```bash
docker compose --env-file .env.local up --build
```

Acessos:
- API:     http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Admin:   http://localhost:8000/admin/
- Web:     http://localhost:5173

### Local com mobile (Expo)

```bash
# 1. Definir IP local (necessário pro celular se conectar via Wi-Fi)
export HOST_IP=$(hostname -I | awk '{print $1}')

# 2. Substituir no .env.local (ou exportar via shell)
sed -i "s/^HOST_IP=.*/HOST_IP=$HOST_IP/" .env.local

# 3. Subir com perfil mobile
docker compose --env-file .env.local --profile mobile up --build
```

Acessos:
- API/Web: como acima
- Mobile: abra Expo Go no celular e escaneie o QR do terminal do `petdiary_mobile`

### Apenas um serviço

```bash
docker compose --env-file .env.local up api
docker compose --env-file .env.local up web
```

### Migrações Django

```bash
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser
```

### Logs

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mobile
```

### Parar

```bash
docker compose down              # para tudo
docker compose down -v           # para + apaga banco
```

## Variáveis de ambiente — onde tudo vive

Todas as vars usadas pelos containers vêm do `.env.{ambiente}` na raiz, injetadas via `env_file` no docker-compose.

**Não edite os `.env` dentro dos sub-projetos** quando rodar via Docker — eles são para dev local sem Docker.

## Variáveis principais

| Var | Quem usa | Default local |
|---|---|---|
| `HOST_IP` | mobile (REACT_NATIVE_PACKAGER_HOSTNAME) | 192.168.10.203 |
| `DATABASE_URL` | api | `postgres://petdiary:petdiary@petdiary_db:5432/petdiary` |
| `SECRET_KEY` | api | `local-dev-only-change-in-deploy` |
| `DEBUG` | api | `True` |
| `CORS_ALLOWED_ORIGINS` | api | `http://localhost:5173,http://127.0.0.1:5173` |
| `VITE_API_URL` | web | `http://localhost:8000/api/v1` |
| `EXPO_PUBLIC_API_URL` | mobile | `http://${HOST_IP}:8000/api/v1` |

## Caddy (perfil dev/hom/prod)

Para subir com reverse proxy:

```bash
docker compose --env-file .env.dev --profile dev up -d
```

Vai expor:
- HTTPS na 443 (Caddy gera certificado automaticamente)
- HTTP na 80 (redireciona pra HTTPS)

Antes de usar, criar `caddy/Caddyfile` na raiz (ainda não existe — TODO).

## Mudanças vs. setup antigo

| Antes | Depois |
|---|---|
| docker-compose dentro de `petDiary-backend/` | na raiz `petDiary/` |
| `.env` em cada sub-projeto, duplicação | `.env.local` / `.env.dev` na raiz, fonte única |
| Sem CORS, web não chamava API | `django-cors-headers` adicionado |
| Sem profiles | profiles `mobile`, `local`, `dev`, `hom`, `prod` |
| Container names genéricos | `petdiary_db`, `petdiary_api`, etc. |
| Network anônima | network nomeada `petdiary_net` |
| Sem reverse proxy | Caddy opcional via profile |
| Mobile sempre subia | mobile só no profile `mobile`/`local` |
