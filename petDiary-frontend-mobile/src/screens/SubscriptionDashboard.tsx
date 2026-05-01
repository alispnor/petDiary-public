import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import api from "../services/api";
import { colors, radii, spacing, fontSize, fontWeight, shadows } from "../theme";

interface Subscription {
  id: string;
  plan_type: "FREE" | "PRO";
  status: string;
  is_pro_active: boolean;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}

interface CheckoutResult {
  method: string;
  status: string;
  pix_copy_paste: string | null;
  pix_qr_code_base64: string | null;
  pix_expires_at: string | null;
  transaction_token: string | null;
}

interface PricingInfo {
  base_price: number;
  discount_percent: number;
  final_price: number;
  currency: string;
}

const PRO_BENEFITS = [
  "Pets ilimitados",
  "IA para extração de prescrições e exames",
  "Transcrição de áudio (Whisper)",
  "Acesso compartilhado com co-tutores",
  "Histórico clínico ilimitado",
  "Suporte prioritário",
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SubscriptionDashboard() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [validating, setValidating] = useState(false);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pixModal, setPixModal] = useState<CheckoutResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Subscription>("/billing/subscription/");
      setSub(data);
    } catch {
      setError("Não foi possível carregar a assinatura.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) {
      setPricing(null);
      return;
    }
    setValidating(true);
    try {
      const { data } = await api.post<PricingInfo>("/billing/apply-coupon/", {
        code: coupon.trim().toUpperCase(),
      });
      setPricing(data);
    } catch {
      Alert.alert("Cupom inválido", "Esse cupom não existe ou já foi usado por você.");
      setCoupon("");
      setPricing(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post<{
        subscription: Subscription;
        checkout: CheckoutResult;
        pricing: PricingInfo;
      }>("/billing/subscribe/", {
        payment_method: "PIX",
        coupon_code: coupon.trim() ? coupon.trim().toUpperCase() : "",
      });
      setSub(data.subscription);
      setCheckoutOpen(false);
      setPixModal(data.checkout);
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar a assinatura.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar assinatura?",
      "Você manterá o PRO até o fim do período já pago.",
      [
        { text: "Manter PRO", style: "cancel" },
        {
          text: "Cancelar assinatura",
          style: "destructive",
          onPress: async () => {
            try {
              const { data } = await api.post<Subscription>("/billing/cancel/", {});
              setSub(data);
              Alert.alert("✓", "Assinatura será cancelada ao fim do período.");
            } catch {
              Alert.alert("Erro", "Não foi possível cancelar agora.");
            }
          },
        },
      ],
    );
  };

  const copyPix = (text: string) => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert("✓", "Código PIX copiado.");
    } else {
      Alert.alert(
        "Copiar PIX",
        "Pressione e segure no código abaixo para selecionar e copiar.",
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.brand.teal} />
      </View>
    );
  }

  if (error || !sub) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || "Erro ao carregar."}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={load}>
          <Text style={styles.btnPrimaryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPro = sub.is_pro_active;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing[10] }}>
      {/* Card status */}
      <View style={[styles.statusCard, isPro ? styles.statusPro : styles.statusFree]}>
        <Text style={styles.planBadge}>
          {isPro ? "PRO 🎉" : "FREE"}
        </Text>
        <Text style={styles.statusLabel}>Status: {sub.status}</Text>
        {sub.cancel_at_period_end && (
          <Text style={styles.cancelWarn}>
            ⚠ Cancelamento agendado para o fim do período.
          </Text>
        )}
        {sub.current_period_end && (
          <Text style={styles.periodInfo}>
            Próxima cobrança: {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
          </Text>
        )}
      </View>

      {!isPro ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que vem com o PRO</Text>
          {PRO_BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
              setCoupon("");
              setPricing(null);
              setCheckoutOpen(true);
            }}
          >
            <Text style={styles.btnPrimaryText}>Assinar PRO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciar assinatura</Text>
          {!sub.cancel_at_period_end ? (
            <TouchableOpacity style={styles.btnDanger} onPress={handleCancel}>
              <Text style={styles.btnDangerText}>Cancelar assinatura</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.note}>
              Sua assinatura será cancelada automaticamente. Para retomar, contate o suporte.
            </Text>
          )}
        </View>
      )}

      {/* Modal checkout */}
      <Modal visible={checkoutOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assinar PetDiary PRO</Text>
            <Text style={styles.modalText}>
              Pagamento via PIX. O QR Code aparece após confirmar.
            </Text>

            <Text style={styles.label}>Cupom (opcional)</Text>
            <View style={{ flexDirection: "row" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={coupon}
                onChangeText={(t) => {
                  setCoupon(t.toUpperCase());
                  setPricing(null);
                }}
                placeholder="Ex.: PRIMEIROMES"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.btnGhost, validating && styles.btnDisabled]}
                onPress={handleValidateCoupon}
                disabled={!coupon || validating}
              >
                <Text style={styles.btnGhostText}>
                  {validating ? "…" : "Aplicar"}
                </Text>
              </TouchableOpacity>
            </View>

            {pricing && (
              <View style={styles.pricingBox}>
                <Text style={styles.pricingLine}>
                  Preço base: {formatBRL(pricing.base_price)}
                </Text>
                {pricing.discount_percent > 0 && (
                  <Text style={[styles.pricingLine, { color: "#16a34a" }]}>
                    Desconto: -{pricing.discount_percent}%
                  </Text>
                )}
                <Text style={styles.pricingFinal}>
                  Total: {formatBRL(pricing.final_price)}
                </Text>
              </View>
            )}

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, marginRight: spacing[2] }]}
                onPress={() => setCheckoutOpen(false)}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  { flex: 1, marginLeft: spacing[2], marginTop: 0 },
                  submitting && styles.btnDisabled,
                ]}
                onPress={handleSubscribe}
                disabled={submitting}
              >
                <Text style={styles.btnPrimaryText}>
                  {submitting ? "Gerando…" : "Gerar PIX"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal PIX */}
      <Modal visible={!!pixModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>PIX gerado ✓</Text>
            <Text style={styles.modalText}>
              Copie o código abaixo no seu app do banco. A confirmação é automática.
            </Text>
            <View style={styles.pixBox}>
              <Text style={styles.pixText} selectable numberOfLines={3}>
                {pixModal?.pix_copy_paste}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => pixModal?.pix_copy_paste && copyPix(pixModal.pix_copy_paste)}
            >
              <Text style={styles.btnPrimaryText}>Copiar código PIX</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => {
                setPixModal(null);
                load();
              }}
            >
              <Text style={styles.btnSecondaryText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  center: { justifyContent: "center", alignItems: "center", padding: spacing[6] },
  errorText: {
    color: "#c00",
    textAlign: "center",
    marginBottom: spacing[4],
    fontSize: fontSize.base,
  },
  statusCard: {
    margin: spacing[4],
    padding: spacing[5],
    borderRadius: radii.lg,
    ...shadows.card,
  },
  statusPro: { backgroundColor: "#fff7ed" },
  statusFree: { backgroundColor: colors.bg.surface },
  planBadge: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extraBold,
    color: colors.brand.orange,
    marginBottom: spacing[2],
  },
  statusLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  cancelWarn: {
    marginTop: spacing[2],
    fontSize: fontSize.sm,
    color: "#dc2626",
  },
  periodInfo: {
    marginTop: spacing[2],
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  section: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radii.md,
    ...shadows.soft,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing[1],
  },
  checkIcon: {
    color: colors.brand.teal,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginRight: spacing[2],
  },
  benefitText: { flex: 1, fontSize: fontSize.sm, color: colors.text.primary },
  btnPrimary: {
    backgroundColor: colors.brand.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    marginTop: spacing[4],
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  btnSecondary: {
    backgroundColor: "#f4f4f4",
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    marginTop: spacing[3],
    alignItems: "center",
  },
  btnSecondaryText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  btnDanger: {
    backgroundColor: "#dc2626",
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  btnDangerText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  btnGhost: {
    paddingHorizontal: spacing[3],
    justifyContent: "center",
    marginLeft: spacing[2],
    borderRadius: radii.sm,
    backgroundColor: "#f0eee9",
  },
  btnGhostText: { color: colors.text.primary, fontWeight: fontWeight.semibold },
  btnDisabled: { opacity: 0.5 },
  note: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  pricingBox: {
    backgroundColor: "#f0fdf4",
    padding: spacing[3],
    borderRadius: radii.sm,
    marginTop: spacing[3],
  },
  pricingLine: { fontSize: fontSize.sm, color: colors.text.primary },
  pricingFinal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  pixBox: {
    backgroundColor: "#f4f4f4",
    padding: spacing[3],
    borderRadius: radii.sm,
    marginVertical: spacing[3],
  },
  pixText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: fontSize.xs,
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  modalCard: {
    backgroundColor: colors.bg.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing[5],
    ...shadows.modal,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  modalRow: { flexDirection: "row", marginTop: spacing[4] },
});
