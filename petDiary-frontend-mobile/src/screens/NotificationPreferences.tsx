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
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { registerForPushNotificationsAsync } from "../services/notifications";
import type { NotificationPreferences } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type ToggleKey = keyof NotificationPreferences;

const ROWS: { key: ToggleKey; icon: string; labelKey: string; hintKey: string }[] = [
  { key: "push_vaccine", icon: "💉", labelKey: "notifications.type_vaccine_label", hintKey: "notifications.type_vaccine_hint" },
  { key: "push_vet_return", icon: "🏥", labelKey: "notifications.type_vet_return_label", hintKey: "notifications.type_vet_return_hint" },
  { key: "push_payment_due", icon: "💳", labelKey: "notifications.type_payment_due_label", hintKey: "notifications.type_payment_due_hint" },
  { key: "push_payment_ok", icon: "✅", labelKey: "notifications.type_payment_ok_label", hintKey: "notifications.type_payment_ok_hint" },
  { key: "push_pin_generated", icon: "🔑", labelKey: "notifications.type_pin_label", hintKey: "notifications.type_pin_hint" },
  { key: "push_vet_access_claimed", icon: "🩺", labelKey: "notifications.type_vet_access_label", hintKey: "notifications.type_vet_access_hint" },
  { key: "push_system", icon: "📢", labelKey: "notifications.type_system_label", hintKey: "notifications.type_system_hint" },
];

export function NotificationPreferencesScreen() {
  const { t } = useTranslation();
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
      Alert.alert(t("common.error"), t("notifications.prefs_load_failed"));
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
      setPrefs(prefs);
      Alert.alert(t("common.error"), t("notifications.prefs_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleEnableSystemPush = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      Alert.alert("✓", t("notifications.prefs_permission_ok"));
    } else {
      Alert.alert(
        t("notifications.prefs_permission_denied_title"),
        t("notifications.prefs_permission_denied_text")
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
        <Text style={styles.sectionTitle}>{t("notifications.prefs_section")}</Text>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.rowIcon}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t(row.labelKey)}</Text>
              <Text style={styles.rowHint}>{t(row.hintKey)}</Text>
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
        <Text style={styles.sectionTitle}>{t("notifications.prefs_permission_section")}</Text>
        <Text style={styles.note}>{t("notifications.prefs_permission_text")}</Text>
        <Text style={styles.btnGhost} onPress={handleEnableSystemPush}>
          {t("notifications.prefs_permission_btn")}
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
