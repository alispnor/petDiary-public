# 🍎 Instalação no MacBook Air — PetDiary

> Guia completo para clonar e rodar o **petDiary** completo num MacBook Air (Apple Silicon ou Intel) sem erro. Tempo estimado: ~30 min.

---

## ✅ Pré-requisitos (instalar uma vez)

### 1. Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Em Apple Silicon (M1/M2/M3): habilite **"Use Rosetta for x86/amd64 emulation"** em _Settings → General_
- Em _Settings → Resources_: aloque pelo menos **4 GB de RAM** e **20 GB de disco**
- Em _Settings → File Sharing_: prefira **VirtioFS** (mais rápido que gRPC FUSE)

### 3. Git e ferramentas
```bash
brew install git
brew install --cask visual-studio-code  # editor recomendado
```

### 4. Node.js 20 LTS (apenas se for rodar mobile sem Docker)
```bash
brew install node@20
```

### 5. Python 3.11 (apenas se for rodar API sem Docker)
```bash
brew install python@3.11
```

### 6. Expo Go no celular (para testar mobile)
- iOS: https://apps.apple.com/br/app/expo-go/id982107779
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent

---

## 📦 Clonar e configurar

### 1. Clonar
```bash
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/alispnor/petDiary.git
cd petDiary
```

### 2. Configurar `.env.local`
O arquivo `.env.local` na raiz já vem com defaults sensatos. Único ajuste necessário se for usar mobile:

```bash
# Descobrir IP local do MacBook na rede Wi-Fi
ipconfig getifaddr en0
# Exemplo: 192.168.1.42

# Editar .env.local e setar HOST_IP=<seu IP>
sed -i '' "s/^HOST_IP=.*/HOST_IP=$(ipconfig getifaddr en0)/" .env.local
```

> ⚠️ Em iMacs/MacBook com Ethernet, troque `en0` por `en1` ou descubra com `route get default | grep interface`.

---

## 🚀 Subir tudo via Docker

### Opção A — Sem mobile (mais rápido, ideal para dev backend/web)
```bash
docker compose --env-file .env.local up --build
```

### Opção B — Com mobile (para testar Expo Go)
```bash
docker compose --env-file .env.local --profile mobile up --build
```

> Primeira vez demora ~5 min (baixar imagens + instalar deps Python e Node).

### Em outro terminal (apenas na primeira vez)
```bash
# Aplicar migrações
docker compose exec api python manage.py migrate

# Criar superuser para acessar /admin
docker compose exec api python manage.py createsuperuser
```

---

## 🌐 Acessos

| Serviço | URL | Notas |
|---|---|---|
| **API** | http://localhost:8000/api/v1/ | JSON da API |
| **Swagger** | http://localhost:8000/api/docs/ | Documentação interativa |
| **ReDoc** | http://localhost:8000/api/redoc/ | Doc alternativa |
| **Django Admin** | http://localhost:8000/admin/ | Após `createsuperuser` |
| **Web (Vet/Tutor)** | http://localhost:5173 | App principal |
| **Mobile (Expo)** | escaneie o QR no terminal `petdiary_mobile` com Expo Go |

---

## 🩺 Troubleshooting (problemas comuns no macOS)

### "Cannot connect to Docker daemon"
- Docker Desktop não está aberto. Abra-o antes de qualquer `docker compose`.

### "Port 5432 is already allocated"
Outra instância do Postgres rodando localmente. Solução:
```bash
brew services stop postgresql
# OU mudar DB_PORT no .env.local
```

### Apple Silicon: "no matching manifest for linux/arm64"
Algumas imagens Postgres antigas não têm build ARM. O `docker-compose.yml` já usa `postgres:15-alpine` que suporta ARM, mas se ainda assim ocorrer:
```yaml
# docker-compose.yml — adicionar no serviço problemático:
platform: linux/amd64
```
Ou habilite Rosetta no Docker Desktop (Settings → General).

### Expo Go não conecta no celular
- ✅ Confirmar que MacBook e celular estão na **mesma rede Wi-Fi**
- ✅ `HOST_IP` em `.env.local` bate com `ipconfig getifaddr en0`
- ✅ Firewall do macOS desativado temporariamente: _System Settings → Network → Firewall_
- ✅ Rede Wi-Fi não tem isolamento de clientes (alguns roteadores bloqueiam por padrão)

### Lentidão geral (Apple Silicon)
- _Settings → Resources_: aumente CPU para 4-6 cores e RAM para 6-8 GB
- _Settings → File Sharing_: use **VirtioFS** (drasticamente mais rápido que gRPC FUSE em Apple Silicon)

### "Permission denied" em arquivos da pasta migrations/
Algumas migrations são criadas pelo container como root e o macOS reclama. Solução:
```bash
sudo chown -R $USER:staff petDiary-backend/backend/*/migrations/
```

### Erro de build npm/node em web ou mobile
```bash
docker compose down
docker volume rm petdiary_pgdata 2>/dev/null  # cuidado: apaga DB!
docker compose --env-file .env.local up --build --force-recreate
```

---

## 🔧 Comandos cotidianos

```bash
# Ver logs
docker compose logs -f api
docker compose logs -f web
docker compose logs -f mobile

# Shell Django
docker compose exec api python manage.py shell

# Shell Postgres
docker compose exec db psql -U petdiary -d petdiary

# Rebuilds (após mudar dependências)
docker compose build api      # após mudar requirements.txt
docker compose build web      # após mudar package.json

# Migrações
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate

# Reset COMPLETO (apaga banco — cuidado!)
docker compose down -v
docker compose --env-file .env.local up --build
```

---

## 🔐 Antes de fazer push de código

```bash
# Backend: validar
docker compose exec api python manage.py check
docker compose exec api python manage.py migrate --check

# Web: validar build de produção
docker compose exec web npm run build
```

---

## 🎓 Workflow recomendado

1. **Backend hot-reload:** Django StatReloader recarrega ao salvar `.py`
2. **Web HMR:** Vite atualiza o navegador ao salvar `.tsx`/`.css`
3. **Mobile Fast Refresh:** Expo recarrega a tela ao salvar
4. **Testar API:** abra http://localhost:8000/api/docs/ (Swagger) e use os endpoints diretamente

---

## 📚 Mais informações

- `README.md` — visão geral do projeto
- `ai-memory/PROGRESSO.md` — estado atual e roadmap
- `ai-memory/specs/` — specs detalhadas de features futuras
