# 🔄 Matriz de Paridade — Mobile ↔ Web

> **Regra durável (Ali, 2026-05-01):** TODA funcionalidade do petDiary
> deve existir nos dois clientes. Esta tabela é o mapa autoritativo.
>
> **Como manter este arquivo:** sempre que entregar uma feature nova ou
> commitar paridade, atualize a célula correspondente. Última auditoria:
> **2026-05-01** (após paridade mobile entregue).

## Legenda

- ✅ Implementado e funcional
- 🟡 Parcial (faltam pequenos ajustes — descrever na coluna "Notas")
- ❌ Não implementado
- ➖ Não se aplica àquela plataforma

---

## 1. Autenticação

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Login universal (TUTOR/VET) | ✅ | ✅ | ✅ | Login mobile só TUTOR; VET pode fazer login mas fluxo principal é web |
| Cadastro (TUTOR ou VET) | ✅ | 🟡 | ✅ | Mobile só cadastra TUTOR (form simplificado, sem ViaCEP) |
| Esqueci minha senha | ✅ | ✅ | ✅ | |
| Reset por link de email | ✅ | ❌ | ✅ | Mobile precisa deep linking — pendente |
| Trocar senha (autenticado) | ✅ | ✅ | ✅ | |
| Sessão persistida (F5/restart) | ✅ | ✅ | — | Mobile aguarda hidratação do AsyncStorage |
| Manter conectado (toggle) | ✅ | ➖ | — | Mobile sempre persiste |
| Logout | ✅ | ✅ | — | |

## 2. Pets

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Listar meus pets | ✅ | ✅ | ✅ | |
| Criar pet (form) | ✅ | ✅ | ✅ | |
| Editar pet | ✅ | ❌ | ✅ | Mobile precisa adicionar |
| Excluir pet | ✅ | ❌ | ✅ | Mobile precisa adicionar |
| Avatar do pet | ❌ | ❌ | ❌ | Modelo Pet ainda não tem avatar |

## 3. Histórico Clínico (HealthRecord)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Ver timeline de records | ✅ | ✅ | ✅ | |
| Criar record (NOTE/VACCINE/EXAM/PRESCRIPTION/SURGERY) | ✅ | ✅ | ✅ | |
| Editar record | ✅ | ❌ | ✅ | Mobile precisa adicionar |
| Excluir record | ✅ | ❌ | ✅ | Mobile precisa adicionar |

## 4. Anexos (HealthRecordAttachment)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Listar anexos por record | ✅ | ✅ | ✅ | |
| Upload via input file | ✅ | ➖ | ✅ | |
| Upload via drag-drop | ✅ | ➖ | ✅ | |
| Upload via webcam | ✅ | ➖ | ✅ | |
| Upload via câmera nativa | ➖ | ✅ | ✅ | expo-image-picker |
| Upload via galeria | ➖ | ✅ | ✅ | |
| Upload via document picker | ➖ | ✅ | ✅ | expo-document-picker |
| Upload de áudio (gravação) | ❌ | ❌ | ✅ | Spec 04/05 — mobile expo-av |
| Visualizar inline | ✅ | 🟡 | ✅ | Mobile abre via Linking (browser) |
| Download | ✅ | ✅ | ✅ | |
| Imprimir | ✅ | ❌ | ✅ | Não aplicável a maioria mobile |
| Excluir | ✅ | ✅ | ✅ | |

## 5. PIN — Acesso veterinário

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Gerar PIN (tutor) | ✅ | ✅ | ✅ | |
| Modal "PIN gerado" + copiar | ✅ | ✅ | ✅ | |
| Compartilhar via WhatsApp | ❌ | ❌ | — | Linking nativo em ambos — pendente UX |
| Vet usa PIN (claim) | ✅ | ➖ | ✅ | Vet usa web |
| Tutor lista vets com acesso ativo | ✅ | ✅ | ✅ | |
| Tutor revoga acesso | ✅ | ✅ | ✅ | |
| Vet vê histórico de pets visitados | ✅ | ➖ | ✅ | |

## 6. Familiares (PetMember)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Listar membros do pet | ✅ | ✅ | ✅ | |
| Convidar familiar (cria User+Member) | ✅ | ✅ | ✅ | |
| Modal de credenciais geradas | ✅ | ✅ | — | |
| Remover familiar | ✅ | ✅ | ✅ | |
| Caretaker troca senha no 1º login | ✅ | ✅ | ✅ | `must_change_password` |

## 7. Conta de usuário

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Editar perfil (nome/email/phone) | ✅ | ✅ | ✅ | |
| Trocar senha | ✅ | ✅ | ✅ | |
| Excluir conta (LGPD) | ✅ | ✅ | ✅ | |
| Idioma (pt-BR/en/es) | ✅ | ✅ | ✅ | Mobile só muda Accept-Language; UI não traduz ainda (pendente Spec 10 mobile) |

## 8. Assinatura PRO

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Status FREE/PRO | ✅ | ✅ | ✅ | |
| Lista de benefícios | ✅ | ✅ | — | |
| Checkout PIX (mock) | ✅ | ✅ | ✅ | |
| Aplicar cupom em tempo real | ✅ | ✅ | ✅ | |
| Cancelar assinatura | ✅ | ✅ | ✅ | |

## 9. Central de ajuda / Suporte

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| FAQ | ❌ | ✅ | — | Mobile tem accordion. Web precisa adicionar |
| Tickets de suporte | 🟡 | ❌ | 🟡 | Backend hoje é stub no admin_panel |
| Email/WhatsApp do suporte | ❌ | ✅ | — | Web precisa adicionar |

## 10. Auditoria

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Histórico de alterações do pet | ✅ | ❌ | ✅ | Mobile precisa adicionar aba/tela |

## 11. Admin (role ADMIN)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Dashboard KPIs | ✅ | ❌ | ✅ | Decidir se admin precisa de mobile (provavelmente não) |
| Lista de usuários | ✅ | ❌ | ✅ | |
| Cupons CRUD + relatório | ✅ | ❌ | ✅ | |
| Tickets stub | ✅ | ❌ | 🟡 | |

## 12. Notificações (Spec 17 — em progresso)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| Lista de notificações in-app | ❌ | ✅ | ✅ | Web pendente Fase 5d |
| Push Expo (iOS/Android) | ➖ | ✅ | ✅ | Mock ativo; real exige EAS Build |
| Push Web (VAPID) | ❌ | ➖ | 🟡 | Service criado; Falta sw.js + subscribe + VAPID keys |
| Preferências por tipo (toggle) | ❌ | ✅ | ✅ | Tela `NotificationPreferences` no mobile |
| Tipos: vacina/retorno-vet/pagamento/PIN/sistema | ❌ | ✅ | ✅ | 7 tipos, hook automático em ClaimAccess |
| Excluir notificação individual | ❌ | ✅ | ✅ | DELETE /notifications/&lt;id&gt;/ |
| Limpar todas | ❌ | ✅ | ✅ | DELETE /notifications/clear-all/ |
| Marcar como lida | ❌ | ✅ | ✅ | |
| Marcar todas como lidas | ❌ | ✅ | ✅ | |
| Badge de unread no header | ❌ | ✅ | ✅ | `/notifications/unread-count/` |
| Lembretes (vacina/retorno) automáticos | ➖ | ➖ | ❌ | Spec 17 Fase 5b — modelo Reminder + tasks |

## 13. IA aplicada (Spec 04 — gated PRO)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| OCR de receita/exame | ❌ | ❌ | 🟡 | Mock; OpenAIService stub |
| Transcrição de áudio (Whisper) | ❌ | ❌ | 🟡 | Mock |
| Permission `IsActivePro` | ➖ | ➖ | ✅ | |

## 14. Realtime (Spec 07 — pendente)

| Funcionalidade | Web | Mobile | Backend | Notas |
|---|---|---|---|---|
| WebSocket para atualizações ao vivo | ❌ | ❌ | ❌ | |

## 15. Internacionalização (Spec 10 — parcial)

> **Decisão durável (Ali, 2026-05-01):** 6 idiomas oficiais.
> Ver memory `project_idiomas_petdiary.md` para diretrizes.
> Pendências detalhadas em `PENDENCIAS-ORDENADAS.md` seção B.

| Idioma | Código | Web | Mobile | Backend | Notas |
|---|---|---|---|---|---|
| Português (Brasil) | `pt-BR` | ✅ | 🟡 | ✅ | Mobile UI hardcoded; só Accept-Language muda |
| Português (Portugal) | `pt-PT` | ❌ | ❌ | ✅ | Pendência B1 |
| English (US) | `en` | ✅ | ❌ | ✅ | Web pronto; mobile pendência B3+B4 |
| Español | `es` | ✅ | ❌ | ✅ | Web pronto; mobile pendência B3+B4 |
| Français | `fr` | ❌ | ❌ | ✅ | Pendência B1 |
| العربية (Árabe) | `ar` | ❌ | ❌ | ✅ | **RTL** — pendência B2 (web) + B4 (mobile). Exige inverter layout |

---

## Onde priorizar próximas paridades (ordenado por valor)

1. **Notificações** (Spec 17) — alto valor de engajamento, alto impacto
2. **Editar pet/record** no mobile — funcionalidade básica esperada
3. **Histórico de auditoria** no mobile — transparência
4. **i18n mobile completo** (Spec 10) — paridade idioma real
5. **FAQ + suporte no web** — equilibra com mobile
6. **Áudio (gravação)** mobile — diferenciador clínico
