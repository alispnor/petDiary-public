# PetDiary Mobile - Frontend (Tutor)

Aplicativo mobile do PetDiary focado no **Tutor** (dono do pet). Desenvolvido com React Native + Expo, rodando em container Docker.

## Stack Tecnológica

- **React Native** com **Expo** (SDK 52)
- **TypeScript**
- **React Navigation** (Native Stack)
- **Zustand** + AsyncStorage (persistência de estado)
- **Axios** (HTTP client com interceptors)
- **@gorhom/bottom-sheet** (Bottom Sheet nativo)
- **Mocks** para expo-image-picker, expo-image-manipulator e expo-av

## Estrutura de Pastas

```
src/
├── mocks/                  # Mocks das libs Expo (câmera, manipulador, áudio)
│   ├── expoImagePicker.ts
│   ├── expoImageManipulator.ts
│   ├── expoAv.ts
│   └── index.ts
├── navigation/
│   └── AppNavigator.tsx    # Stack Navigator principal
├── screens/
│   ├── HomeTutor.tsx       # Lista de pets do tutor
│   └── PetDashboard.tsx    # Dashboard do pet (timeline + ações)
├── services/
│   └── api.ts              # Axios com interceptors (token + idioma)
├── store/
│   └── useAppStore.ts      # Zustand store (user, activePet, language)
├── types/
│   └── index.ts            # Interfaces TypeScript
└── utils/
    └── handleDocumentCapture.ts  # Fluxo de captura e upload de documentos
```

## Rodando com Docker Compose

### Pré-requisitos

- Docker e Docker Compose instalados
- Expo Go instalado no celular (iOS/Android)
- Celular e máquina host na mesma rede Wi-Fi

### 1. Configurar IP do host

Descubra o IP local da sua máquina:

```bash
# Linux
hostname -I | awk '{print $1}'

# macOS
ipconfig getifaddr en0
```

### 2. Definir variável de ambiente

Crie um arquivo `.env` na pasta do `docker-compose.yml` (backend):

```env
HOST_IP=192.168.1.XXX
```

Ou exporte antes de rodar:

```bash
export HOST_IP=$(hostname -I | awk '{print $1}')
```

### 3. Subir todos os serviços

```bash
cd petDiary-backend
docker compose up --build
```

Isso vai subir:
- **db** (PostgreSQL) na porta 5432
- **api** (Django) na porta 8000
- **mobile** (Expo) na porta 8081

### 4. Conectar o Expo Go

1. Abra o Expo Go no celular
2. Escaneie o QR code exibido no terminal do container `mobile`
3. O app vai carregar via LAN usando o IP configurado em `REACT_NATIVE_PACKAGER_HOSTNAME`

## Portas Mapeadas

| Porta | Serviço |
|-------|---------|
| 8081  | Metro Bundler (Expo) |
| 19000 | Expo DevTools |
| 19001 | Expo DevTools (packager) |
| 19002 | Expo DevTools (web UI) |

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `HOST_IP` | IP local da máquina host | `192.168.1.100` |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | IP que o Expo usa para expor o bundler | Usa `HOST_IP` |
| `EXPO_DEVTOOLS_LISTEN_ADDRESS` | Endereço de escuta do DevTools | `0.0.0.0` |
| `EXPO_PUBLIC_API_URL` | URL base da API backend | `http://api:8000` |

## Desenvolvimento Local (sem Docker)

```bash
npm install
npx expo start
```

## Zustand Store

A store `useAppStore` persiste automaticamente via AsyncStorage:

```typescript
const { user, activePet, language } = useAppStore();
```

**Estado gerenciado:**
- `user` — Dados do tutor autenticado (inclui token JWT)
- `activePet` — Pet atualmente selecionado
- `language` — Idioma ativo (`pt-BR`, `en-US`, `es-ES`)

## Interceptor Axios

O cliente HTTP (`src/services/api.ts`) injeta automaticamente:
- `Authorization: Bearer <token>` — lido do Zustand
- `Accept-Language: <idioma>` — lido do Zustand

Respostas 401 fazem logout automático.

## Fluxo de Captura de Documentos

A função `handleDocumentCapture` em `src/utils/` orquestra:

1. **Permissão + Captura** via `expo-image-picker` (mock)
2. **Compressão** via `expo-image-manipulator` (mock)
3. **Solicita URL pré-assinada** — `POST /api/v1/uploads/generate-presigned-url/`
4. **Upload direto** — `PUT` para a URL pré-assinada (S3/GCS)
5. **Notifica processamento IA** — `POST /api/v1/ai/process-document/`


------------------

 Wrote 145 lines to README.md
       1 # PetDiary Mobile - Frontend (Tutor)
       2
       3 Aplicativo mobile do PetDiary focado no **Tutor** (dono do pet). Desenvolvido com React Native + Expo, rodando em container
         Docker.
       4
       5 ## Stack Tecnológica
       6
       7 - **React Native** com **Expo** (SDK 52)
       8 - **TypeScript**
       9 - **React Navigation** (Native Stack)
      10 - **Zustand** + AsyncStorage (persistência de estado)
     … +135 lines (ctrl+o to expand)

● Vamos verificar que tudo foi criado corretamente.

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

● Tudo criado com sucesso. Aqui está o resumo do que foi entregue:

  Arquivos Criados (20 arquivos)

  Docker

  - Dockerfile — node:20-alpine com Expo CLI, expondo portas 8081/19000-19002
  - .dockerignore — Exclui node_modules, .expo, dist
  - docker-compose.yml (atualizado) — Serviço mobile com volume mount, portas, REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP} e depends_on: api

  Projeto Base

  - package.json — Expo 52, React Navigation, Zustand, Axios, Bottom Sheet, mocks
  - tsconfig.json, app.json, babel.config.js, App.tsx

  Arquitetura (src/)

  ┌────────┬────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────┐
  │ Camada │            Arquivo             │                               Responsabilidade                               │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Types  │ types/index.ts                 │ User, Pet, TimelineRecord, Language, AppState                                │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Store  │ store/useAppStore.ts           │ Zustand + AsyncStorage (user, activePet, language)                           │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ API    │ services/api.ts                │ Axios com interceptors (Bearer token + Accept-Language)                      │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Nav    │ navigation/AppNavigator.tsx    │ Native Stack (HomeTutor -> PetDashboard)                                     │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Telas  │ screens/HomeTutor.tsx          │ Lista de pets mock, seta activePet ao clicar                                 │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Telas  │ screens/PetDashboard.tsx       │ Info pet, timeline, botoes "Gerar PIN" e "Adicionar Registro" (Bottom Sheet) │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Mocks  │ mocks/expoImagePicker.ts       │ Mock de launchCameraAsync                                                    │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Mocks  │ mocks/expoImageManipulator.ts  │ Mock de manipulateAsync                                                      │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Mocks  │ mocks/expoAv.ts                │ Mock de Audio, Sound, Video                                                  │
  ├────────┼────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ Utils  │ utils/handleDocumentCapture.ts │ Fluxo: foto -> compress -> presigned URL -> upload -> process-document       │
  └────────┴────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────┘

  Para Rodar

  # Descubra seu IP local
  export HOST_IP=$(hostname -I | awk '{print $1}')                                                                                          
  
  # Suba tudo                                                                                                                               
  cd petDiary-backend                                       
  docker compose up --build
                                                                                                                                            
  Abra o Expo Go no celular (mesma rede Wi-Fi) e escaneie o QR code do terminal.          