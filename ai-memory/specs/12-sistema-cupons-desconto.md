# Spec 12 — Sistema de Cupons de Desconto

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** Spec 01 (assinaturas/billing) já implementada — cupom é aplicado no checkout.

---

## Prompt original

> Você é um Arquiteto de Software Full-Stack.
> Precisamos adicionar um "Sistema de Cupons de Desconto" ao fluxo de assinaturas do projeto "PetDiary".
>
> 1. **BACKEND (Django):**
>    - Crie o modelo `Coupon`: campos `code` (string única), `discount_percent` (inteiro 1 a 100), `valid_until` (datetime), `max_uses` (inteiro), `current_uses` (inteiro default 0), e `is_active` (boolean).
>    - Endpoint (POST `/api/v1/billing/apply-coupon/`): Recebe o `code`. Verifica se existe, se está ativo, se não expirou e se `current_uses < max_uses`. Retorna o novo valor do plano com o desconto aplicado.
>    - No momento de gerar a cobrança (integração com o Gateway), o backend deve aplicar o desconto no valor final e incrementar o `current_uses` do cupom.
>
> 2. **FRONTEND MOBILE (React Native):**
>    - Na tela de Checkout (onde o usuário escolhe PIX ou Cartão), adicione um input text discreto: "Possui um cupom de desconto?".
>    - Adicione um botão "Aplicar". Ao clicar, chame a API.
>    - Se válido: mostre uma mensagem de sucesso em verde ("Cupom Lançamento aplicado!") e risque o preço antigo, mostrando o novo preço com desconto em destaque.
>    - Se inválido: mostre um erro amigável.
>
> Escreva o código priorizando validações de segurança no backend para evitar abusos no uso dos cupons.

---

## Plano de fases sugerido

### Fase C.1 — Backend: modelo `Coupon` + admin
- App `billing/models.py` (já existe pela Spec 01) ganha:
  ```python
  class Coupon(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4)
      code = models.CharField(max_length=32, unique=True, db_index=True)
      # discount_percent: 1-100 (validators)
      discount_percent = models.PositiveSmallIntegerField(
          validators=[MinValueValidator(1), MaxValueValidator(100)]
      )
      valid_until = models.DateTimeField()
      max_uses = models.PositiveIntegerField()
      current_uses = models.PositiveIntegerField(default=0)
      is_active = models.BooleanField(default=True)
      created_at = models.DateTimeField(auto_now_add=True)
      created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

      def is_valid(self) -> bool:
          return (self.is_active
                  and self.valid_until > timezone.now()
                  and self.current_uses < self.max_uses)
  ```
- Admin com list_display, filter por `is_active`, search por `code`
- Action de admin: "Desativar selecionados"

### Fase C.2 — Endpoint POST /billing/apply-coupon/
```python
class ApplyCouponView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]  # anti-bruteforce

    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        if not code:
            return Response({"detail": "Código obrigatório."}, status=400)

        coupon = Coupon.objects.filter(code=code).first()
        if not coupon or not coupon.is_valid():
            return Response(
                {"detail": "Cupom inválido ou expirado."},
                status=404
            )

        base_price = settings.SUBSCRIPTION_PRO_PRICE_BRL
        discount = float(base_price) * (coupon.discount_percent / 100)
        final_price = float(base_price) - discount

        return Response({
            "code": coupon.code,
            "discount_percent": coupon.discount_percent,
            "base_price": str(base_price),
            "discount_amount": f"{discount:.2f}",
            "final_price": f"{final_price:.2f}",
        })
```

### Fase C.3 — Aplicação no checkout (race condition safe)
Ao gerar a cobrança em `/billing/subscribe/`:

```python
@transaction.atomic
def apply_coupon_in_checkout(coupon_code: str) -> Coupon | None:
    if not coupon_code:
        return None

    # SELECT FOR UPDATE — evita corrida quando 2 users aplicam o último uso
    coupon = (
        Coupon.objects
        .select_for_update()
        .filter(code=coupon_code.upper())
        .first()
    )
    if not coupon or not coupon.is_valid():
        raise ValidationError("Cupom inválido.")

    coupon.current_uses += 1
    coupon.save(update_fields=["current_uses"])
    return coupon
```

### Fase C.4 — Mobile: input no Checkout (Spec 02)
- `CheckoutPix.tsx` / `CheckoutCard.tsx` ganha bloco discreto:
  ```tsx
  <View>
    <TextInput
      placeholder="Cupom de desconto (opcional)"
      value={coupon}
      onChangeText={setCoupon}
      autoCapitalize="characters"
    />
    <TouchableOpacity onPress={applyCoupon}>
      <Text>Aplicar</Text>
    </TouchableOpacity>
  </View>
  ```
- Após sucesso:
  - Mostra `<Text style={styles.success}>✓ Cupom {code} aplicado!</Text>` em verde
  - Risca preço antigo (`<Text style={{textDecorationLine: 'line-through'}}>R$ X,XX</Text>`)
  - Mostra preço novo em destaque com cor brand-orange
- Estado `appliedCoupon` é enviado no payload do `/billing/subscribe/`

### Fase C.5 — Web (equivalente)
Mesma UX no checkout web (Spec 02 web):
- Campo `<input>` + botão "Aplicar"
- Toast de sucesso/erro
- Feedback visual (preço riscado)

### Fase C.6 — Validações de segurança (anti-abuso)
- Rate limit: 5 tentativas / minuto / user em `/apply-coupon/`
- Log estruturado de cada tentativa (Spec 11)
- Bloqueia user que tenta brute-force códigos (5 falhas = 1h cooldown)
- Cupom é case-insensitive na validação (`.upper()`) mas case-sensitive na criação
- Cupom de **uso único por user** (futuro): tabela `CouponRedemption(user, coupon)` com unique_together

---

## Decisões pendentes

- [ ] Cupom pode ser usado várias vezes pelo mesmo usuário? (recomendo NÃO)
- [ ] Existe cupom **first-time-only** (só primeira assinatura)?
- [ ] Cupom em valor fixo (R$ 10 off) além de % off?
- [ ] Trial estendido como tipo de cupom (em vez de % off, dá +14 dias trial)?
- [ ] Admin vai criar cupom via Django Admin ou via Spec 13 (Admin Dashboard)?

## Encaixe no roadmap

- Depende da **Spec 01 (billing)** estar implementada
- Pode rodar **logo após** a Spec 01 ou **junto com** ela na mesma fase
- Mobile: junto com a Spec 02 (Checkout)
- Web: junto com a Spec 13 (Admin Dashboard) que vai criar/gerenciar cupons
