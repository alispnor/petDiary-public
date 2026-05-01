# Spec 13 — Admin Dashboard (Painel do Super Administrador)

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** Specs 01 (billing/tickets), 12 (cupons), expansão de roles.

---

## Prompt original

> Você é um Desenvolvedor Front-End Sênior especialista em React.js (Vite) e Tailwind CSS.
> Sua tarefa é criar o "Admin Dashboard" (Painel do Super Administrador) do projeto "PetDiary".
>
> # ARQUITETURA E SEGURANÇA
> - Rotas Privadas: Apenas usuários com `role === 'ADMIN'` podem acessar este portal.
> - Layout: Crie uma navegação lateral (Sidebar) com os menus: Resumo, Usuários, Financeiro/Cupons, e Suporte (Tickets).
>
> # ESTRUTURA DAS TELAS
> 1. **Dashboard (Resumo):**
>    - Exiba cartões com KPIs mockados: MRR (Receita Mensal), Total de Usuários, Churn (Cancelamentos), e Tickets Pendentes.
>
> 2. **Gestão de Cupons (Financeiro):**
>    - Crie um formulário para o Admin gerar novos cupons (Inputs: Nome do Código, % de Desconto, Data de Expiração, Limite de Usos).
>    - Abaixo, uma tabela listando os cupons ativos e um botão para "Desativar" um cupom instantaneamente.
>
> 3. **Help Desk (Suporte):**
>    - Crie uma interface dividida em duas áreas funcionais.
>    - Área 1: Lista de tickets abertos pelos usuários (revelando o motivo: 'Reclamação', 'Dúvida', etc).
>    - Área 2: Ao clicar num ticket, abre uma visualização de "Chat" para o Admin digitar a resposta. A resposta será enviada para a API (Mock do POST `/api/v1/admin/tickets/{id}/reply/`) que posteriormente enviará um push/email ao usuário.
>
> Forneça a estrutura dos componentes usando Tailwind para um visual de SaaS moderno, limpo e focado em produtividade para o administrador.

---

## Pré-requisito: expandir roles do User

Atualmente `User.Role` tem apenas `TUTOR` e `VET`. Para o admin, precisamos:

```python
# accounts/models.py
class User(AbstractUser):
    class Role(models.TextChoices):
        TUTOR = "TUTOR", _("Tutor")
        VET = "VET", _("Veterinário")
        ADMIN = "ADMIN", _("Administrador")  # ← novo
```

ADMIN é diferente de Django superuser:
- Superuser = acesso total ao Django Admin
- ADMIN no app = acesso ao painel SaaS de gestão (este painel)
- Pode coexistir: admin pode ser superuser ou não

## Plano de fases

### Fase D.1 — Backend: roles ADMIN + endpoints `/admin/*`
- Migration para adicionar `ADMIN` no enum
- Endpoints novos (todos com `IsAdminRole` permission):
  - `GET /admin/kpis/` — métricas (MRR, total users, churn 30d, tickets pendentes)
  - `GET /admin/users/` — listar/buscar/paginar
  - `GET /admin/coupons/` + `POST /admin/coupons/` + `PATCH .../deactivate/`
  - `GET /admin/tickets/` (filtros: status, category)
  - `POST /admin/tickets/<id>/reply/` (enviar resposta ao user)

### Fase D.2 — Web: estrutura do admin
```
src/pages/admin/
├── AdminLayout.tsx       # sidebar + outlet
├── AdminDashboard.tsx    # /admin → KPIs
├── AdminUsers.tsx        # /admin/users
├── AdminCoupons.tsx      # /admin/coupons
└── AdminTickets.tsx      # /admin/tickets
```

`App.tsx` adiciona:
```tsx
<Route path="/admin" element={<RequireAuth role="ADMIN"><AdminLayout /></RequireAuth>}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="coupons" element={<AdminCoupons />} />
  <Route path="tickets" element={<AdminTickets />} />
</Route>
```

### Fase D.3 — `<AdminLayout>` (sidebar persistente)
```tsx
// Estrutura visual:
// ┌──────────┬─────────────────────────────┐
// │ PetDiary │ Header (busca, profile)     │
// │ Admin    ├─────────────────────────────┤
// │          │                             │
// │ 📊 Resumo│  <Outlet />                 │
// │ 👥 Users │                             │
// │ 💰 Cupons│                             │
// │ 💬 Tickets                             │
// │          │                             │
// │ Sair     │                             │
// └──────────┴─────────────────────────────┘
```

Tailwind classes:
- Sidebar: `w-60 bg-gray-900 text-white p-4 flex flex-col gap-2`
- NavLink ativo: `bg-brand-teal text-white`
- Conteúdo: `flex-1 bg-gray-50 p-8 overflow-y-auto`

### Fase D.4 — `<AdminDashboard>` com KPIs
4 cards no grid 2×2 (mobile) / 4×1 (desktop):
- MRR — `R$ 12.450 / mês` + sparkline (últimos 30 dias)
- Total Usuários — `1.234` + variação 30d (`+8%`)
- Churn — `2.3%` (cor vermelha se > 5%)
- Tickets Pendentes — `7` (links pra /admin/tickets)

Cards reutilizam componente `<KpiCard>` (label, value, trend, icon).

### Fase D.5 — `<AdminCoupons>` (Spec 12)
Layout:
```
┌─────────────────────────────────────┐
│ + Criar Cupom                       │
│ ┌─────────────────────────────────┐ │
│ │ [Código] [% Desc] [Validade]    │ │
│ │ [Limite Usos] [Criar]           │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Cupons ativos                       │
│ ┌──────┬──────┬──────┬──────┬─────┐ │
│ │Code  │Desc% │Usos  │Validade│Ação│ │
│ ├──────┼──────┼──────┼──────┼─────┤ │
│ │LANCO │ 50%  │12/100│30/06 │ 🚫 │ │
│ └──────┴──────┴──────┴──────┴─────┘ │
└─────────────────────────────────────┘
```

Form usa o endpoint da Spec 12. Botão "Desativar" faz PATCH `is_active=False`.

### Fase D.6 — `<AdminTickets>` (Help Desk dividido)
Layout split (à esquerda lista, à direita conversa):

```
┌────────────────┬──────────────────────────┐
│ Tickets (7)    │ <Chat>                   │
│                │                          │
│ ⚠ Reclamação   │ Maria Silva              │
│ Maria Silva    │ "Não consigo gerar PIN…" │
│ há 2 horas     │                          │
│ ────────────── │ ─── Suas respostas ───   │
│ ❓ Dúvida       │                          │
│ João Costa     │ [textarea grande]        │
│ ontem          │                          │
│ ────────────── │ [Enviar resposta]        │
│ 💡 Ideia        │                          │
│ ...            │                          │
└────────────────┴──────────────────────────┘
```

**Lista (Área 1):** filtra por status/category, badge colorido por categoria:
- ⚠ HELP / DUVIDA — azul
- 💡 IDEA — amarelo
- 🚨 COMPLAINT — vermelho

**Chat (Área 2):**
- Mensagem original do user (cinza claro à esquerda)
- Respostas do admin (azul à direita, alinhamento iMessage-style)
- Input de resposta no rodapé com `<textarea>` + botão enviar
- POST `/admin/tickets/<id>/reply/` envia + marca ticket como `IN_PROGRESS` ou `RESOLVED`
- Backend depois envia push/email pro user

### Fase D.7 — Auditoria
Toda ação admin (criar cupom, desativar, responder ticket) é registrada no `AuditLog` (Fase 6 do plano consolidado).

---

## Princípios de design SaaS

- **Densidade alta** — admin é power-user, mais info por tela
- **Tabelas com sort/filter/paginate** — usar `tanstack/react-table` ou similar
- **Atalhos de teclado** — `cmd+k` busca global (futuro)
- **Modo escuro** opcional (admin SaaS típico)
- **Cores neutras** — cinza/branco, brand color só para CTAs

---

## Decisões pendentes

- [ ] Login admin é o mesmo `/login` ou `/admin/login` separado?
- [ ] ADMIN sofre da regra de "login único" (Fase 4) ou multi-sessão como tutor?
- [ ] Web atual (`/tutor`, `/vet`) e admin compartilham mesmo bundle ou são apps separados?
- [ ] Filtros default de tickets (só `OPEN`, ou `OPEN+IN_PROGRESS`)?
- [ ] Admin pode impersonar usuário pra debugar? (cuidado com LGPD)
- [ ] Self-hosted ou usar Retool/Forest Admin pra começar?

## Encaixe no roadmap

- Pode rodar **a qualquer momento** após Spec 01 (billing) e Spec 12 (cupons)
- Útil **antes da abertura ao público** (precisa de canal para resolver tickets)
- Não bloqueia outras features
- Sugestão: implementar **junto com** ou **logo depois** das Specs 01-03 (monetização e suporte)
