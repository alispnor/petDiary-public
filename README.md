# PetDiary

O **PetDiary** e uma plataforma unificada que resolve a fragmentacao dos dados de saude dos animais de estimacao. Ele nasce como um **Prontuario Medico Inteligente**, utilizando Inteligencia Artificial para facilitar a entrada de dados, e evolui estrategicamente para se tornar uma **Rede Social Nichada e Segura**, estritamente focada em pets.

---

## Os Dois Usuarios Principais

A plataforma possui duas jornadas distintas e complementares:

### Tutor (Mobile)
Busca conveniencia e organizacao. Usa o aplicativo no celular para fotografar receitas, gravar sintomas em audio, ser lembrado de vacinas e ter o historico do pet sempre no bolso.

### Veterinario (Web)
Busca densidade de dados e tomada de decisao rapida. Usa um portal em tela grande (desktop) para inserir um **PIN temporario** fornecido pelo tutor, acessando a linha do tempo clinica completa do paciente de forma estruturada.

---

## Roadmap Estrategico (As 3 Fases)

A divisao em fases existe para mitigar riscos tecnicos (custos de IA e servidores) e validar o engajamento do usuario antes de escalar.

### Fase 1: O MVP Clinico (Foco Atual)

- **Objetivo:** Criar o habito de uso no tutor resolvendo uma dor real (perda de historico medico).
- **Entregaveis:** App Mobile para o tutor, Portal Web para o veterinario, e geracao do "PIN de Acesso Unico".
- **IA Aplicada:** Focada em utilidade — OCR para ler receitas antigas e Speech-to-Text para diario de sintomas falado.

### Fase 2: Automacao e Filtros de Seguranca

- **Objetivo:** Tornar o sistema proativo e preparar o terreno para a rede social.
- **Entregaveis:** Alertas automatizados de vacinas/vermifugos baseados na idade/raca.
- **IA Aplicada:** Visao Computacional. A IA analisa todas as fotos enviadas e bloqueia imagens onde humanos sao o foco principal.

### Fase 3: Expansao Social (A Virada de Chave)

- **Objetivo:** Transformar a base de tutores engajados em uma comunidade ativa.
- **Entregaveis:** Perfis publicos dos pets, feed de fotos/videos curtos, likes e sistema de comentarios (com traducao automatica).
- **IA Aplicada:** Moderacao rigorosa e invisivel atuando em tempo real no feed.

---

## Estrutura do Repositorio

```
petDiary/
├── petDiary-backend/           # API REST (Python/Django)
│   ├── docker-compose.yml      # Orquestra todos os servicos (db, api, mobile, web)
│   └── backend/
│       ├── petdiary/           # Configuracoes do projeto Django (settings, urls, wsgi)
│       ├── accounts/           # Autenticacao e gestao de usuarios (JWT)
│       ├── pets/               # CRUD de pets, perfis e permissoes
│       ├── health/             # Registros de saude (vacinas, consultas, exames)
│       ├── access/             # Sistema de PIN temporario para veterinarios
│       └── locale/             # Internacionalizacao (pt_BR, en, es)
│
├── petDiary-frontend-mobile/   # App do Tutor (React Native/Expo)
│   └── src/
│       ├── screens/            # Telas (HomeTutor, PetDashboard)
│       ├── navigation/         # Navegacao entre telas (React Navigation)
│       ├── store/              # Estado global (Zustand)
│       ├── services/           # Comunicacao com a API (Axios)
│       ├── utils/              # Utilitarios (captura de documentos)
│       └── types/              # Tipagem TypeScript
│
└── petDiary-frontend-web/      # Portal do Veterinario (React/Vite)
    └── src/
        ├── pages/              # Paginas (VetDashboard, ClinicalView)
        ├── components/         # Componentes (PinInput, Timeline, PetHeader, NoteForm)
        ├── store/              # Estado global (Zustand — authStore, clinicalStore)
        └── services/           # Comunicacao com a API (Axios)
```

---

## Stack Tecnologica

| Camada | Tecnologia | Papel |
|---|---|---|
| **Backend** | Python 3 + Django REST Framework | Regras de negocio, autenticacao JWT, API REST |
| **Banco de Dados** | PostgreSQL 15 | Integridade dos dados de saude, historico de permissoes |
| **Mobile (Tutor)** | React Native (Expo 52) + Zustand | App do tutor com captura de fotos/audio |
| **Web (Veterinario)** | React 19 (Vite) + Tailwind CSS + Zustand | Portal clinico denso para leitura de exames |
| **Documentacao API** | drf-spectacular (OpenAPI) | Geracao automatica de schema da API |
| **Infraestrutura** | Docker Compose | Orquestracao de todos os servicos em containers |
| **Cloud (Planejado)** | AWS S3 + URLs pre-assinadas / AWS Textract | Upload direto de arquivos e OCR de documentos |

---

## Como Rodar o Projeto

### Pre-requisitos

- Docker e Docker Compose instalados

### Subindo todos os servicos

```bash
cd petDiary-backend
docker-compose up --build
```

Isso inicia:
- **PostgreSQL** na porta `5432`
- **API Django** na porta `8000`
- **App Mobile (Expo)** na porta `8081`
- **Portal Web (Vite)** na porta `5173`

---

## Licenca

Projeto privado. Todos os direitos reservados.
