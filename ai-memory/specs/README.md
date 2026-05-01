# 📦 Specs — Implementações futuras

Pasta com **specs/prompts versionadas** para módulos grandes que serão implementados em fases futuras. Cada arquivo é independente e pode ser copiado direto na conversa quando for hora de implementar.

## Índice

| # | Spec | Camada | Depende de |
|---|---|---|---|
| 01 | [Backend — Assinaturas + Webhook + Deleção LGPD + Suporte](./01-backend-assinaturas-suporte-conta.md) | Django REST | Fases 1-2 (cadastro pronto) |
| 02 | [Mobile — Cobrança + Gestão de Conta](./02-mobile-cobranca-conta.md) | Expo / RN | Spec 01 implementada |
| 03 | [Mobile — Central de Ajuda](./03-mobile-central-ajuda.md) | Expo / RN | Endpoint `/support/tickets/` da Spec 01 |
| 04 | [Integrações OpenAI + AWS S3](./04-integracoes-openai-aws-s3.md) | Backend + Mobile + Web | Fase 7 (uploads) implementada |
| 05 | [Captura de mídia (drag-drop, webcam, câmera, áudio, vídeo)](./05-captura-midia-web-mobile.md) | Web + Mobile | Fase 7 (infra de upload) — pode rodar junto |
| 06 | [Fila de jobs assíncronos (Celery + Redis ou BullMQ)](./06-fila-jobs-bullmq-celery.md) | Backend + Infra | Pré-requisito para Specs 01 (webhook) e 04 (IA) em produção |
| 07 | [WebSocket realtime (atualizações ao vivo)](./07-websocket-realtime.md) | Backend + Web + Mobile | Pode rodar junto com Spec 06 (compartilha Redis) |
| 08 | [Documento de instalação MacBook Air](./08-instalacao-macbook-air.md) | Doc | Estável após Fase 5/6 |
| 09 | [Publicação Apple Store + Google Play](./09-publicacao-app-store-google-play.md) | Doc + Mobile | Etapa final |
| 10 | [i18n web + mobile (6 idiomas + RTL para árabe)](./10-i18n-multilingua-frontend.md) | Web + Mobile | Backend pronto; pode rodar a qualquer momento |
| 11 | [Logs estruturados (auditoria + erros técnicos)](./11-logs-historicos-e-erros.md) | Backend + Web + Mobile | Tipo 1 = Fase 6; Tipo 2 antes da produção |
| 12 | [Sistema de Cupons de Desconto](./12-sistema-cupons-desconto.md) | Backend + Mobile + Web | Depende da Spec 01 (billing) |
| 13 | [Admin Dashboard SaaS (Painel Super Admin)](./13-admin-dashboard-saas.md) | Web + Backend | Depende de Specs 01, 12 + role ADMIN |
| 14 | [Auditoria SecOps + Performance + Testes (Backend)](./14-auditoria-seguranca-performance-backend.md) | Backend | Backend funcional (qualquer ponto após Fase 7) |
| 15 | [Auditoria Performance + Resiliência (Frontend Web + Mobile)](./15-auditoria-performance-frontend.md) | Web + Mobile | Frontend funcional |
| 16 | [Suíte de Smoke Tests (pytest E2E core)](./16-suite-smoke-tests-core-pytest.md) | Backend (testes) | Backend funcional |
| 17 | [Notificações push + Preferências (mobile **e web**)](./17-notificacoes-mobile-push-preferencias.md) | Backend + Mobile + Web | Spec 06 (Celery, já feita); requer EAS para iOS push real |
| 18 | [Admin completo + Suporte real (login, troca senha, tickets, paridade mobile)](./18-admin-completo-suporte-real.md) | Backend + Web + Mobile | Spec 17 (notify); modelo SupportTicket novo; admin read-only no mobile |
| 19 | [Landing page pública (`/`) com cadastro/login + planos + app mobile](./19-landing-page-publica.md) | Web (puro frontend) | Não bloqueia — pode rodar a qualquer momento; depende de termos/privacidade só pra footer |

## Ordem de execução recomendada

```
Spec 01 (Backend)
   ├──▶ Spec 02 (Mobile Cobrança)
   └──▶ Spec 03 (Mobile Ajuda)
```

A Spec 01 é fundação para as duas mobile. Depois que estiver pronta, as duas mobile podem rodar em paralelo (mas como dependem do mesmo Zustand de auth, recomendo serial).

## Encaixe no roadmap principal

Essas specs são **etapas grandes** que entram **DEPOIS** das fases já planejadas:

1. ✅ Fase 1 — cadastro completo (concluída)
2. ⏳ Fase 2 — login UX (manter conectado)
3. ⏳ Fase 3 — acessos bidirecionais vet ↔ pet
4. ⏳ Fase 4 — login único do veterinário
5. ⏳ Fase 5 — co-tutores
6. ⏳ Fase 6 — auditoria
7. ⏳ Fase 7 — uploads/download/print
8. ⏳ **Fase 8 — Spec 01 (Backend monetização + suporte + LGPD)** ← novo
9. ⏳ **Fase 9 — Spec 02 (Mobile cobrança + deleção)** ← novo
10. ⏳ **Fase 10 — Spec 03 (Mobile ajuda)** ← novo
11. ⏳ Etapa final — Produção (domínio, hospedagem, PRODUCAO.md, EAS Build)

## Considerações antes de iniciar

**Web equivalente:** as Specs 02 e 03 são para **mobile**, mas o web atual também precisa das mesmas telas (assinatura, deletar conta, ajuda) por exigência da Apple/Google + LGPD. Considerar criar specs equivalentes para web ou adaptar essas no contexto.

**Gateway de pagamento:** Ali mencionou Mercado Pago **ou** Asaas, com repasse final para Nubank PJ. Decidir antes de iniciar a Spec 01 (afeta integração).

**Plano FREE vs PRO:** os benefícios e o preço do PRO ainda não foram definidos — definir antes da Spec 02.
