# Spec 15 — Auditoria de Performance + Resiliência (Frontend Web + Mobile)

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Engenheiro de Performance Frontend Sênior + Especialista em
> Qualidade (QA) de aplicações React e React Native.
> **Objetivo:** auditoria de performance, identificar vazamentos de memória
> e garantir resiliência do petDiary.

## Escopo

Analisar **componentes, store Zustand e navegação** focando em 3 frentes:

### 1. Otimização de Renderização e Memória
- **Re-renderizações desnecessárias**: onde a store Zustand é consumida,
  garantir que estamos usando **seletores específicos** para evitar re-render
  em cascata.
- **Listas longas (Timeline Clínica)**: garantir que estamos usando `FlatList`
  (mobile) ou virtualização (web) com props de otimização corretas:
  - `initialNumToRender`
  - `maxToRenderPerBatch`
  - `windowSize`
  - `keyExtractor`
- **Imagens pesadas**: cache + placeholders pra evitar layout shift.

### 2. Resiliência e Tratamento de Erros (QA)
- **`ErrorBoundary` global**: se o app crashar, usuário vê tela amigável
  (não tela branca da morte) com botão de reiniciar fluxo.
- **Interceptor do Axios**: avaliar se falhas de rede (timeout, offline) e
  erros 401 (token expirado) estão sendo tratados graciosamente — deslogando
  e mandando pra tela de login sem quebrar a UI.

### 3. Correções de Código
- Apontar funções anônimas dentro da renderização que causam problemas de
  performance.
- Reescrever com `useCallback` / `useMemo` **apenas onde o custo de computação
  justificar** (não over-memoizar).

## Entregável esperado

1. **Diagnóstico claro** do que está pesando na aplicação
2. **Trechos de código refatorados** garantindo 60 FPS na navegação
3. Cobrir **web E mobile** (são SPAs distintas com problemas distintos)

## Contexto petDiary (estado em 2026-05-01)

Já implementado que toca os pontos da auditoria:
- Web: Zustand com `persist` + `partialize` em authStore; LanguageDetector
  i18next configurado
- Web: `AuditTimeline` busca `?page_size=100` (não pagina lazy ainda)
- Web: `AttachmentsList` usa `fetch` + blob URL pra view/download
  (verificar cleanup de URLs criadas)
- Mobile: Zustand com `persist` + AsyncStorage; navegação Stack nativa
- Mobile: `HomeTutor` usa `FlatList` (verificar props de otimização)
- Mobile: `PetDashboard` lista `health-records` (verificar virtualização)
- Mobile: `SubscriptionDashboard` e `AccountSettings` recém-criadas
  (Fase D) — auditoria deve passar nelas

Não há `ErrorBoundary` em nenhum dos dois — confirmado, é um gap.

## Notas

- Web: React 19 + Vite + Tailwind 4
- Mobile: Expo SDK 54 + RN 0.81 + Zustand
- Foco principal mobile: scroll de timeline com 100+ records sem janking
- Web: dropdowns de admin/usuários podem ter listas grandes
- Quando rodar, fazer também um perfil real (Chrome DevTools Performance
  na web; Hermes profiler no mobile) — não confiar só em análise estática
