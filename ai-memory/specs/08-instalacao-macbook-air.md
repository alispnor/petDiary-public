# Spec 08 — Documento de instalação no MacBook Air

> Pedido do Ali em 2026-05-01: "cria um documento detalhado para instalar e rodar o projeto completo in sucesso sem erro no macbook air".

---

## Objetivo

Documento `INSTALACAO-MACBOOK.md` na raiz do projeto que permita a um dev novo **clonar e rodar tudo no MacBook Air (Apple Silicon ou Intel)** em < 30 min, sem precisar pedir ajuda no chat. Cobre passos, comandos e troubleshooting comum.

---

## Estrutura sugerida do documento

### 1. Pré-requisitos (instalar uma vez)
- **Homebrew** — gerenciador de pacotes
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- **Docker Desktop** (Apple Silicon ou Intel)
  - Download: https://www.docker.com/products/docker-desktop
  - Liga "Use Rosetta for x86/amd64 emulation" se M1/M2/M3 (Settings → General)
  - Aloca RAM mín. 4GB e disk 20GB (Settings → Resources)
- **Git** — `brew install git`
- **Node.js 20 LTS** (para rodar mobile sem Docker, se quiser)
  ```bash
  brew install node@20
  ```
- **Python 3.11+** (opcional, só se quiser rodar API sem Docker)
  ```bash
  brew install python@3.11
  ```
- **Expo Go** no celular (App Store / Play Store)
- **Editor:** VS Code com extensões Python, Pylance, ESLint, Prettier

### 2. Clonar o projeto
```bash
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/alispnor/petDiary.git
cd petDiary
```

### 3. Configurar `.env`
```bash
# .env.local na raiz já vem com defaults — só ajustar HOST_IP se for usar mobile
# Descobrir IP local do MacBook na rede Wi-Fi:
ipconfig getifaddr en0
# Editar .env.local e setar HOST_IP=<seu IP>
```

### 4. Subir tudo via Docker
```bash
docker compose --env-file .env.local up --build
# Em outro terminal, primeira vez apenas:
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser  # opcional
```

### 5. Acessar
- **API:** http://localhost:8000/api/v1/
- **Swagger:** http://localhost:8000/api/docs/
- **Admin Django:** http://localhost:8000/admin/
- **Web (Vet/Tutor):** http://localhost:5173
- **Mobile:** abrir Expo Go e escanear QR (precisa profile `mobile`)

### 6. Para incluir mobile (Expo)
```bash
docker compose --env-file .env.local --profile mobile up --build
```
Garantir que celular e MacBook estão na **mesma rede Wi-Fi**.

### 7. Troubleshooting MacBook Air específico

**Erro: "Cannot connect to Docker daemon"**
- Docker Desktop não está aberto. Abrir o app antes do `docker compose`.

**Erro: porta 5432 já em uso**
- Outra instância do Postgres rodando localmente. Parar com `brew services stop postgresql` ou mudar `DB_PORT` no `.env.local`.

**Erro: Apple Silicon (M1/M2/M3) — "no matching manifest for linux/arm64"**
- Algumas imagens não têm build ARM. Adicionar `platform: linux/amd64` no docker-compose para o serviço problemático ou habilitar Rosetta.

**Erro: Expo Go não conecta no celular**
- Verificar firewall do macOS (System Settings → Network → Firewall — desativar temporariamente)
- Confirmar mesma rede Wi-Fi
- IP em `.env.local` (`HOST_IP`) bate com `ipconfig getifaddr en0`

**Erro: lentidão no Docker**
- Settings → Resources: aumentar CPU/RAM
- Settings → File Sharing: usar VirtioFS (mais rápido que gRPC FUSE)

### 8. Comandos úteis cotidianos
```bash
# Logs em tempo real
docker compose logs -f api
docker compose logs -f web

# Shell Django
docker compose exec api python manage.py shell

# Shell Postgres
docker compose exec db psql -U petdiary -d petdiary

# Rebuilds
docker compose build api      # após mudar requirements.txt
docker compose build web      # após mudar package.json

# Reset completo (apaga DB)
docker compose down -v && docker compose --env-file .env.local up --build
```

### 9. Workflow de desenvolvimento
- Backend: hot-reload automático (StatReloader do Django)
- Web: Vite HMR
- Mobile: Expo Fast Refresh

### 10. Antes de fazer push
```bash
# Backend: rodar testes (quando existirem)
docker compose exec api python manage.py test

# Validar migrations não quebram
docker compose exec api python manage.py migrate --check

# Web: verificar build de produção
docker compose exec web npm run build
```

---

## Decisões pendentes / a confirmar

- [ ] Versão exata do Python a recomendar (3.11 ou 3.12)?
- [ ] Como o doc lida com `make` / scripts wrapper? (criar `Makefile` simplifica)
- [ ] Incluir setup de pre-commit hooks?

## Encaixe no roadmap

- Pode rodar **a qualquer momento**, mas tem mais valor **antes da etapa final de produção** (quando outros devs entram)
- Sugestão: criar quando estabilizar o ambiente atual (após Fase 5/6)
