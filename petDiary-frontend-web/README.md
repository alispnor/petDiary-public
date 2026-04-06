# PetDiary — Frontend Web (Veterinário)

Frontend web do **PetDiary** focado no fluxo do veterinário: acesso ao prontuário do pet via PIN de 6 dígitos gerado pelo tutor.

## Stack

| Camada             | Tecnologia          |
| ------------------ | ------------------- |
| Framework          | React 19 + Vite 6   |
| Linguagem          | TypeScript 5.7      |
| Estilização        | Tailwind CSS 4       |
| Estado             | Zustand 5            |
| HTTP               | Axios 1.x            |
| Roteamento         | React Router DOM 7   |

## Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── NoteForm.tsx     # Formulário de nota clínica
│   ├── PetHeader.tsx    # Cabeçalho com dados vitais e alergias
│   ├── PinInput.tsx     # Input de 6 dígitos para PIN
│   ├── RecentAccessList.tsx  # Lista de acessos recentes (mock)
│   ├── RevokedModal.tsx # Modal de acesso revogado (403)
│   └── Timeline.tsx     # Timeline de registros clínicos
├── pages/
│   ├── VetDashboard.tsx # Tela inicial — PIN + histórico
│   └── ClinicalView.tsx # Prontuário aberto do pet
├── services/
│   └── api.ts           # Axios instance + interceptors
├── store/
│   ├── authStore.ts     # Zustand — sessão e revogação
│   └── clinicalStore.ts # Zustand — dados clínicos (mock)
├── types.ts             # Interfaces TypeScript
├── App.tsx
├── main.tsx
└── index.css
```

## Telas

### VetDashboard (`/`)

- **Sidebar esquerda**: histórico mockado de acessos recentes.
- **Centro**: formulário de PIN de 6 dígitos. Ao validar, redireciona para `/clinical/:pin`.

### ClinicalView (`/clinical/:pin`)

- **Cabeçalho**: avatar do pet, espécie, raça, peso e tags de alergias.
- **Timeline central**: registros clínicos com diferenciação visual entre notas humanas (indigo) e transcrições de IA (amber).
- **Sidebar direita**: formulário fixo para adicionar nova nota clínica.
- **Simulação de segurança**: botão "Simular Revogação de PIN" dispara uma requisição que retorna 403. O interceptor do Axios detecta, aciona `revokeAccess()` no Zustand, e um modal "Acesso Revogado" é exibido, expulsando o vet para a tela inicial.

## Rodando Localmente (sem Docker)

```bash
npm install
npm run dev
# http://localhost:5173
```

## Docker

### Dockerfile

O `Dockerfile` na raiz deste projeto usa `node:20-alpine` e é focado em desenvolvimento local (hot-reload habilitado).

### Docker Compose

Adicione o seguinte bloco ao `docker-compose.yml` existente no projeto backend:

```yaml
  web:
    build:
      context: ../petDiary-frontend-web
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ../petDiary-frontend-web:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://api:8000/api/v1
    depends_on:
      - api
```

> Os volumes garantem hot-reload — qualquer alteração local reflete no container instantaneamente.
> O volume anônimo `/app/node_modules` preserva os `node_modules` instalados no build da imagem.

### Subindo tudo

```bash
cd petDiary-backend
docker compose up --build
# API:  http://localhost:8000/api/docs/
# Web:  http://localhost:5173
```

## Variáveis de Ambiente

| Variável        | Padrão                              | Descrição                  |
| --------------- | ----------------------------------- | -------------------------- |
| `VITE_API_URL`  | `http://localhost:8000/api/v1`      | Base URL da API backend    |

Crie um `.env` a partir do `.env.example`:

```bash
cp .env.example .env
```
