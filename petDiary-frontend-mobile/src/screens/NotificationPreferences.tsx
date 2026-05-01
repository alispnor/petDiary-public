import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import api from "../services/api";
import { registerForPushNotificationsAsync } from "../services/notifications";
import type { NotificationPreferences } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type ToggleKey = keyof NotificationPreferences;

const ROWS: { key: ToggleKey; icon: string; label: string; hint: string }[] = [
  {
    key: "push_vaccine",
    icon: "💉",
    label: "Vacinação",
    hint: "Lembretes de vacinas próximas ou em atraso",
  },
  {
    key: "push_vet_return",
    icon: "🏥",
    label: "Retorno ao veterinário",
    hint: "Lembretes de consultas marcadas",
  },
  {
    key: "push_payment_due",
    icon: "💳",
    label: "Vencimento de pagamento",
    hint: "Aviso 3 dias antes da renovação PRO",
  },
  {
    key: "push_payment_ok",
    icon: "✅",
    label: "Pagamento confirmado",
    hint: "Recibo quando o PIX cair",
  },
  {
    key: "push_pin_generated",
    icon: "🔑",
    label: "PIN criado",
    hint: "Confirmação após gerar PIN para o vet",
  },
  {
    key: "push_vet_access_claimed",
    icon: "🩺",
    label: "Vet acessou prontuário",
    hint: "Quando o vet usa o PIN para abrir os dados",
  },
  {
    key: "push_system",
    icon: "📢",
    label: "Avisos do sistema",
    hint: "Manutenções, novidades e mudanças importantes",
  },
];

export function NotificationPreferencesScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<NotificationPreferences>(
        "/notifications/preferences/"
      );
      setPrefs(data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar suas preferências.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (key: ToggleKey, value: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await api.put("/notifications/preferences/", next);
    } catch {
      // reverte em caso de erro
      setPrefs(prefs);
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableSystemPush = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      Alert.alert("✓", "Notificações ativadas neste dispositivo.");
    } else {
      Alert.alert(
        "Permissão negada",
        "Você desativou notificações deste app no sistema. Vá em Ajustes do iPhone/Android para reativar."
      );
    }
  };

  if (loading || !prefs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.teal} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receber notificações sobre</Text>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowIcon}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowHint}>{row.hint}</Text>
            </View>
            <Switch
              value={!!prefs[row.key]}
              onValueChange={(v) => handleToggle(row.key, v)}
              trackColor={{ false: "#d1d5db", true: colors.brand.teal }}
              thumbColor="#fff"
              disabled={saving}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissão do dispositivo</Text>
        <Text style={styles.note}>
          O sistema operacional (iOS/Android) também precisa permitir push.
          Toque para ativar nesta instalação.
        </Text>
        <Text style={styles.btnGhost} onPress={handleEnableSystemPush}>
          Ativar notificações neste dispositivo
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg.app,
  },
  section: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "#f0eee9",
  },
  rowIcon: { fontSize: 24, marginRight: spacing[3] },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  rowHint: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  btnGhost: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
    paddingVertical: spacing[2],
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.brand.teal,
    borderRadius: radii.pill,
  },
});
