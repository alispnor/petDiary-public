# Spec 02 — Mobile: Cobrança + Gestão de Conta

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** Spec 01 (endpoints `/billing/*`, `DELETE /users/me/`).

---

## Prompt original

> Você é um Desenvolvedor Mobile Sênior (React Native / Expo).
> Precisamos criar as interfaces de Cobrança e Gestão de Conta para o aplicativo "PetDiary", conectando com os endpoints que criamos no Django.
>
> Estruture os seguintes componentes e telas:
>
> 1. **Tela "Meu Plano / Assinatura" (SubscriptionDashboard):**
>    - Deve mostrar o plano atual do usuário (FREE ou PRO lido do Zustand).
>    - Se for FREE: Mostre os benefícios do PRO e botões para assinar ("Pagar com PIX" ou "Cartão de Crédito").
>    - Se for PRO: Mostre a data da próxima cobrança, opção de alterar o cartão de crédito e a opção "Cancelar Assinatura" (com um modal de confirmação tentando reter o usuário).
>
> 2. **Fluxo de Pagamento (Checkout):**
>    - Implemente um mock do fluxo de pagamento.
>    - Se PIX: Exiba o código "Copia e Cola" e o QRCode gerado pelo backend, com um botão nativo para copiar para a área de transferência. Mostre um estado de "Aguardando pagamento...".
>    - Se Cartão: Crie um formulário limpo para inserir os dados.
>
> 3. **Deleção de Conta (Exigência Apple/Google):**
>    - Na tela de "Configurações da Conta", crie a opção "Excluir minha conta permanentemente".
>    - Adicione um duplo aviso (modal de confirmação vermelho) explicando que os dados clínicos dos pets serão arquivados/excluídos. Se confirmado, chame a API de deleção, limpe o Zustand e deslogue o usuário.
>
> Foque na UX (fácil de ler, botões grandes e claros) e na estrutura dos componentes.

---

## Plano de fases sugerido (a confirmar quando rodar)

### Fase 9.1 — Tipos e Zustand
- Adicionar ao Zustand `useAppStore`:
  - `subscription: { plan_type, status, current_period_end } | null`
  - Action `setSubscription()` chamada após login (ler do `/users/me/` ou endpoint dedicado)
- Tipos em `src/types`: `SubscriptionPlan`, `PaymentMethod`, `CheckoutResult`

### Fase 9.2 — Tela `SubscriptionDashboard`
- Path: `src/screens/SubscriptionDashboard.tsx`
- Header: "Meu Plano"
- **Estado FREE:**
  - Card grande "PetDiary PRO — R$ X,XX/mês"
  - Lista de benefícios com ícones (✅ Vacinas ilimitadas, ✅ OCR de receitas, etc)
  - 2 botões grandes: "💳 Cartão de Crédito" e "📱 PIX"
- **Estado PRO:**
  - Card "Você é PRO 🎉"
  - "Próxima cobrança em <data>"
  - Botão secundário "Alterar cartão"
  - Botão destrutivo (vermelho discreto) "Cancelar assinatura"
  - Modal de retenção (50% off, esperar mais um mês, "tem certeza?")

### Fase 9.3 — Tela `CheckoutPix`
- Path: `src/screens/CheckoutPix.tsx`
- Após `POST /billing/subscribe/ {payment_method: "PIX"}`, recebe `pix_copy_paste`, `qr_code_base64`, `expires_at`
- Componente:
  - QR code em destaque (`<Image source={{uri: 'data:image/png;base64,'+qr}}/>`)
  - Box copy-paste com botão "Copiar" usando `expo-clipboard`
  - Timer "Expira em 14:32"
  - Estado "Aguardando pagamento…" com `setInterval` ou WebSocket polling no backend
  - Quando `subscription.status === ACTIVE`: tela de sucesso → volta pro Home

### Fase 9.4 — Tela `CheckoutCard`
- Path: `src/screens/CheckoutCard.tsx`
- Form: número, validade, CVV, nome impresso
- **NÃO armazenar dados do cartão no client** — usar SDK do gateway que tokeniza no front
- Para Asaas: `@asaas/react-native` ou direto via fetch para o endpoint de tokenização
- Submit envia apenas o `card_token` pro backend

### Fase 9.5 — Tela `AccountSettings`
- Path: `src/screens/AccountSettings.tsx`
- Listas de opções (estilo iOS): Editar perfil, Alterar senha, Notificações, Idioma, Privacidade, **Excluir minha conta**
- "Excluir minha conta" no fim, em texto vermelho discreto

### Fase 9.6 — Modal de deleção LGPD-compliant
- Componente `<DeleteAccountModal>`:
  - **Primeiro aviso:** título "Você tem certeza?" + bullets do que vai acontecer:
    - "Seu acesso será encerrado"
    - "Seus dados pessoais serão anonimizados"
    - "Os prontuários dos seus pets serão arquivados"
    - "Esta ação não pode ser desfeita"
  - Botão "Cancelar" (primário) e "Continuar" (texto vermelho discreto)
  - **Segundo aviso:** input "Digite EXCLUIR para confirmar"
  - Só libera o botão final quando o input bater
- Ao confirmar:
  - `DELETE /users/me/`
  - Limpa Zustand (`logout()`)
  - Navega pra tela de Login

### Fase 9.7 — Navegação
- Adicionar rotas no `AppNavigator`:
  - SubscriptionDashboard, CheckoutPix, CheckoutCard, AccountSettings
- Drawer/Tab Bar com acesso a "Conta" e "Plano"

### Fase 9.8 — Polimento UX
- Botões grandes (mín. 56pt height — toque amigável)
- Feedback haptic em ações importantes (`expo-haptics`)
- Loading states com Skeleton
- Erros com Toast (não Alert)
- Cores: usar tokens de `src/theme` (brand-orange para CTA premium, brand-teal para neutro)

---

## Dependências novas (estimativa)

```json
{
  "expo-clipboard": "para copiar PIX",
  "expo-haptics": "feedback tátil",
  "react-native-qrcode-svg": "alternativa se backend retornar string em vez de base64",
  "@asaas/react-native": "se for Asaas (ou SDK do MP)"
}
```

## Web equivalente

O **web** também precisa das mesmas telas (assinatura, checkout, deletar conta) por exigência LGPD. Considerar criar uma Spec 02b para web em paralelo, ou adaptar essa.

## Decisões pendentes

- [ ] Tela de checkout é nativa do app ou via WebView (mais simples mas menos fluido)?
- [ ] Que features do app são gated por PRO?
- [ ] No primeiro login após pagar, refetch `/users/me/` ou aguardar webhook chegar?
