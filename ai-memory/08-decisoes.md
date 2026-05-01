# 08 — Decisões já tomadas (e por quê)

Decisões arquiteturais visíveis no código. Importante saber pra não desfazer sem motivo.

## Monorepo com 3 sub-projetos
- **Decisão:** uma pasta única `petDiary/` contém backend, mobile e web como sub-projetos independentes
- **Por quê:** facilita orquestração (um único `docker-compose.yml`), facilita reuso de tipos no futuro (TS shared)
- **Trade-off:** cada projeto ainda tem `package.json` / `requirements.txt` próprios — sem workspace ainda

## Django + DRF (não FastAPI / não Node)
- **Decisão:** Python + Django REST Framework
- **Por quê:** Django Admin é grátis (útil pra debugar dados em dev/MVP); DRF é maduro pra CRUD aninhado; ORM forte pra modelagem clínica
- **Implicação:** se for adicionar IA pesada, Django pode chamar workers (Celery) ou serverless externo

## JWT (SimpleJWT) com access curto + refresh longo
- **Decisão:** access 30 min, refresh 7 dias
- **Por quê:** balance entre segurança e UX (usuário não loga toda hora, mas roubo de access tem janela curta)

## UUID em todos os PKs
- **Decisão:** todos os models usam `UUIDField` como PK
- **Por quê:** evita enumeração de URLs (privacidade), facilita merges entre ambientes, futuro shard

## PIN de 6 dígitos numéricos
- **Decisão:** PIN é número de 0-999999 com padding zero
- **Por quê:** UX de digitação fácil em mobile/desktop; tradeoff de espaço (1M PINs simultâneos máximos)
- **Risco conhecido:** colisão sem unique constraint (ver bug #6)

## Soft delete em VetAccessToken
- **Decisão:** `deleted_at` em vez de `DELETE` real
- **Por quê:** auditoria clínica precisa rastrear quem teve acesso e quando, mesmo após revogação

## Acesso ao prontuário só com PIN (não permanente)
- **Decisão:** vet **não tem** lista de pets permanente — sempre precisa do PIN
- **Por quê:** privacidade. Tutor é dono do dado, vet é convidado.
- **A reavaliar:** clínicas regulares pediam acesso fixo? Roadmap futuro pode adicionar "vet preferido" sem PIN

## i18n nativo desde dia 1
- **Decisão:** todos os labels usam `gettext_lazy`, settings com 3 idiomas
- **Por quê:** Brasil/Latam tem mistura linguística; expansão internacional sem refazer

## Mocks de Expo dentro do mobile
- **Decisão:** `src/mocks/expoImagePicker.ts`, `expoAv.ts` etc.
- **Por quê:** dev acontece em **container Linux** (sem câmera/microfone). Sem mocks, o app não roda fora do dispositivo.
- **A reavaliar:** Para Build de produção (EAS), trocar imports dos mocks pelos pacotes reais. Há padrões: `babel-plugin-module-resolver` ou flag de ambiente.

## Tailwind 4 (web)
- **Decisão:** Tailwind 4 (versão recente)
- **Por quê:** v4 tem melhor DX (sem config file obrigatório, JIT direto)

## Zustand sobre Redux
- **Decisão:** Zustand em ambos clientes
- **Por quê:** API mínima, suporte a middleware (persist), zero boilerplate
- **No web:** sem persist (sessão se perde no F5) — provavelmente intencional pelo modelo de PIN
- **No mobile:** com persist + AsyncStorage — sessão dura

## Mobile: AsyncStorage para token JWT
- **Decisão:** token guardado em AsyncStorage (não SecureStore)
- **Por quê:** simplicidade
- **A reavaliar antes de produção:** dados clínicos pedem `expo-secure-store` (Keychain/Keystore)

## Arquitetura de upload: presigned URL direto pro S3
- **Decisão:** backend só gera URL, cliente faz upload direto ao S3 (não passa pelo Django)
- **Por quê:** evita backend virar gargalo de banda; é o padrão recomendado AWS
- **Status:** apenas MOCK no backend ainda
