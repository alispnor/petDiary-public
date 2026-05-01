# Spec 18 — Admin completo: login, troca de senha, suporte real, paridade mobile

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Engenheiro fullstack Django + React + React Native.
> **Origem:** pedido do Ali em 2026-05-01 ("lembra criar login admin com
> senha que pode trocar e páginas administrativas no web e mobile que
> suporte de dados e contatos com os usuários para responder").

---

## Contexto

Algumas peças já existem (parcialmente):
- ✅ `User.role = ADMIN` (Fase C, Spec 13)
- ✅ Login web universal — admin loga em `/login` e cai em `/admin`
- ✅ AdminLayout + 4 páginas web (Dashboard/Users/Coupons/Tickets)
- ✅ Trocar senha já funciona em /conta para qualquer role
- 🟡 Tickets web é **stub** — backend não tem modelo `SupportTicket`
- ❌ Admin **não existe no mobile**
- ❌ Não há fluxo de chat/resposta entre admin e tutor/vet

## O que entregar

### 1. Backend — app `support/`

```python
class SupportTicket(models.Model):
    class Type(TextChoices):
        QUESTION = "QUESTION", "Dúvida"
        COMPLAINT = "COMPLAINT", "Reclamação"
        IDEA = "IDEA", "Ideia"
        BUG = "BUG", "Bug"

    class Status(TextChoices):
        OPEN = "OPEN", "Aberto"
        WAITING_USER = "WAITING_USER", "Aguardando usuário"
        WAITING_ADMIN = "WAITING_ADMIN", "Aguardando suporte"
        RESOLVED = "RESOLVED", "Resolvido"
        CLOSED = "CLOSED", "Fechado"

    id = UUIDField(primary_key=True, default=uuid4)
    user = ForeignKey(User, related_name="tickets")
    type = CharField(choices=Type.choices, max_length=20)
    subject = CharField(max_length=140)
    body = TextField()
    status = CharField(choices=Status.choices, default="OPEN")
    assigned_to = ForeignKey(User, null=True, blank=True,
                             related_name="assigned_tickets",
                             limit_choices_to={"role": "ADMIN"})
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class TicketMessage(models.Model):
    ticket = ForeignKey(SupportTicket, related_name="messages")
    author = ForeignKey(User)
    body = TextField()
    is_admin_reply = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

**Endpoints:**
- `GET /support/tickets/` — usuários veem só os seus; admin vê todos
- `POST /support/tickets/` — qualquer user autenticado abre
- `GET /support/tickets/<id>/` (com mensagens aninhadas)
- `POST /support/tickets/<id>/messages/` (resposta — chat)
- `PATCH /support/tickets/<id>/` (admin muda status, atribui)
- `DELETE /support/tickets/<id>/` (só admin)

**Hooks de notify:**
- User abre ticket → notifica admins (`notify(SYSTEM)`)
- Admin responde → notifica owner (`notify(SYSTEM)`)
- Status muda para RESOLVED → notifica owner

**Permissões:**
- `IsTicketOwnerOrAdmin` — só dono ou admin acessam
- Admin pode atribuir a outro admin

### 2. Web — substituir stub

- `pages/admin/AdminTickets.tsx`: lista paginada com filtros (status,
  type), badge de count por status, click abre `AdminTicketDetail`
- `pages/admin/AdminTicketDetail.tsx`: tela split — info + chat de
  mensagens (similar ao ClinicalView)
- `pages/Help.tsx` (NOVO em /help): user comum abre tickets, lista os
  seus, vê respostas. Form de novo ticket com type + subject + body.
  FAQ no topo (mesmo conteúdo do mobile HelpCenter).

### 3. Mobile — admin no mobile

**Decisão durável a tomar (Ali):** admin no mobile faz sentido?
Argumentos pró:
- Admin pode responder ticket do celular durante a noite (suporte 24h)
- Notifs push de novos tickets entram naturalmente

Argumentos contra:
- Admin é poder/sensível — tela grande do desktop é mais segura
- Aumenta superfície de bugs

**Recomendação:** entregar admin **read-only** no mobile (consultar KPIs
+ tickets), com edição (responder ticket, atribuir, desativar cupom) só
no web. Push notif vem mas tap do mobile abre o web em
`https://app.petdiary.com.br/admin`.

### 4. Suporte do tutor/vet

- Mobile: HelpCenter ganha aba "💬 Meus tickets" — abre form, lista,
  detalha e mensageia
- Web: `/help` similar

### 5. Login admin

**Não criar URL separada** — o `/login` universal já discrimina por
role. Mas:
- Adicionar **2FA opcional** para `role=ADMIN` (Spec adicional ou
  extensão da Spec 14 — segurança)
- Throttling agressivo no login admin (já tem 10/min para todos —
  considerar baixar para 5/min para ADMIN especificamente)
- Audit log de toda ação de admin (já existe app `audit/`; adicionar
  hooks)

### 6. Troca de senha admin

Já existe — funciona em `/conta`. Garantir que admin no mobile
read-only também aponta para o `/conta` web.

---

## Aceite (testes manuais)

- [ ] T1: tutor abre ticket no /help → admin recebe notif `SYSTEM`
- [ ] T2: admin lista tickets em /admin/tickets, filtra OPEN
- [ ] T3: admin clica e responde — tutor recebe notif
- [ ] T4: admin marca RESOLVED → tutor recebe notif final
- [ ] T5: outro user (não dono) tenta GET ticket → 404
- [ ] T6: tutor abre ticket sem subject → 400
- [ ] T7: mobile read-only mostra KPIs + lista tickets
- [ ] T8: admin troca senha em /conta → blacklist refresh tokens (já
      existe via Fase 5.2)

---

## Dependências

- Backend: app `notifications/` (✅ Spec 17)
- Web: i18n (Spec 10 — chaves `support.*`)
- Mobile: react-i18next (B3) + WebView para abrir admin web (`/admin`)

## Notas

- Como já tem `app audit/` rodando, **toda ação admin deve gerar
  AuditLog** com detalhe do que mudou
- Admin **nunca acessa dados clínicos diretamente** — só metadados
  (count de pets, etc.). Para auditoria de uso individual, usar app
  `audit` que registra acessos
