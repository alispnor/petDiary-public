import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { Reminder, ReminderType } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const TYPE_META: { code: ReminderType; icon: string; key: string }[] = [
  { code: "VACCINE", icon: "💉", key: "reminders.type_vaccine" },
  { code: "VET_RETURN", icon: "🏥", key: "reminders.type_vet_return" },
  { code: "CUSTOM", icon: "📌", key: "reminders.type_custom" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDueLabelKey(dateISO: string): { key: string; count: number } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateISO + "T00:00:00");
  const diff = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return { key: "reminders.due_overdue", count: Math.abs(diff) };
  if (diff === 0) return { key: "reminders.due_today", count: 0 };
  if (diff === 1) return { key: "reminders.due_tomorrow", count: 0 };
  if (diff <= 7) return { key: "reminders.due_in_days", count: diff };
  return null; // formato data padrão
}

type Props = {
  visible: boolean;
  petId: string;
  petName: string;
  onClose: () => void;
};

export function RemindersModal({ visible, petId, petName, onClose }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Reminder[]>([]);

  const formatDue = (dateISO: string): string => {
    const info = getDueLabelKey(dateISO);
    if (!info) return new Date(dateISO).toLocaleDateString();
    return t(info.key, { count: info.count });
  };
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ReminderType>("VACCINE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateDue, setDateDue] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Reminder[]>(
        `/pets/${petId}/reminders/`
      );
      setItems(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const reset = () => {
    setType("VACCINE");
    setTitle("");
    setDescription("");
    setDateDue(todayISO());
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t("common.warning"), t("reminders.title_required"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDue)) {
      Alert.alert(t("common.warning"), t("reminders.date_invalid"));
      return;
    }
    setSaving(true);
    try {
      await api.post(`/pets/${petId}/reminders/`, {
        type,
        title: title.trim(),
        description: description.trim(),
        date_due: dateDue,
      });
      reset();
      await load();
    } catch {
      Alert.alert(t("common.error"), t("reminders.create_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = (r: Reminder) => {
    Alert.alert(t("reminders.dismiss_confirm_title"), r.title, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("reminders.dismiss_confirm_btn"),
        onPress: async () => {
          try {
            await api.post(`/reminders/${r.id}/dismiss/`);
            await load();
          } catch {
            Alert.alert(t("common.error"), t("reminders.dismiss_failed"));
          }
        },
      },
    ]);
  };

  const handleDelete = (r: Reminder) => {
    Alert.alert(t("reminders.delete_confirm_title"), r.title, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/reminders/${r.id}/`);
            setItems((prev) => prev.filter((it) => it.id !== r.id));
          } catch {
            Alert.alert(t("common.error"), t("reminders.delete_failed"));
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>{t("common.close")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("reminders.modal_title")}</Text>
          <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.actionText}>
              {showForm ? t("common.cancel") : t("reminders.new_btn")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t("reminders.form_title_section")}</Text>
              <View style={styles.typeRow}>
                {TYPE_META.map((meta) => {
                  const active = meta.code === type;
                  return (
                    <TouchableOpacity
                      key={meta.code}
                      style={[
                        styles.typeBtn,
                        active && styles.typeBtnActive,
                      ]}
                      onPress={() => setType(meta.code)}
                    >
                      <Text style={styles.typeIcon}>{meta.icon}</Text>
                      <Text
                        style={[
                          styles.typeLabel,
                          active && styles.typeLabelActive,
                        ]}
                      >
                        {t(meta.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>
                {t("reminders.form_title")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t("reminders.form_title_placeholder")}
                maxLength={140}
              />
              <Text style={styles.label}>
                {t("reminders.form_date")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={dateDue}
                onChangeText={setDateDue}
                placeholder="2026-06-01"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <Text style={styles.label}>{t("reminders.form_description")}</Text>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("reminders.form_description_placeholder")}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.btnPrimary, saving && styles.disabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>
                  {saving ? t("common.saving") : t("common.save")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.brand.teal}
              style={{ marginTop: 24 }}
            />
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Image
                source={require("../../assets/reminders-icon.png")}
                style={styles.emptyIcon}
                resizeMode="contain"
              />
              <Text style={styles.empty}>
                {t("reminders.empty", { name: petName })}
              </Text>
            </View>
          ) : (
            items.map((r) => {
              const meta = TYPE_META.find((m) => m.code === r.type);
              const dimmed = !r.is_active;
              return (
                <View
                  key={r.id}
                  style={[styles.card, dimmed && styles.cardDimmed]}
                >
                  <Text style={styles.cardIcon}>{meta?.icon ?? "📌"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.title}</Text>
                    <Text style={styles.cardMeta}>
                      {formatDue(r.date_due)} ·{" "}
                      {new Date(r.date_due).toLocaleDateString()}
                    </Text>
                    {r.description ? (
                      <Text style={styles.cardDesc}>{r.description}</Text>
                    ) : null}
                    {r.notified_at && (
                      <Text style={styles.cardOk}>{t("reminders.notif_sent")}</Text>
                    )}
                    {r.dismissed_at && (
                      <Text style={styles.cardDone}>{t("reminders.resolved")}</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    {r.is_active && (
                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => handleDismiss(r)}
                      >
                        <Text style={styles.dismissText}>✓</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(r)}
                    >
                      <Text style={styles.deleteText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg.surface,
  },
  cancelText: { color: colors.text.secondary, fontSize: fontSize.base },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  actionText: {
    color: colors.brand.teal,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  content: { padding: spacing[4], paddingBottom: spacing[10] },
  formCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  formTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  typeRow: { flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  typeBtnActive: {
    borderColor: colors.brand.teal,
    backgroundColor: "rgba(36,182,212,0.1)",
  },
  typeIcon: { fontSize: 16, marginRight: spacing[1] },
  typeLabel: { fontSize: fontSize.xs, color: colors.text.secondary },
  typeLabelActive: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
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
  btnPrimary: {
    backgroundColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
    marginTop: spacing[4],
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  disabled: { opacity: 0.5 },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing[6],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    marginBottom: spacing[3],
    opacity: 0.9,
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    alignItems: "flex-start",
  },
  cardDimmed: { backgroundColor: "#f4f4f4", borderColor: colors.border, opacity: 0.7 },
  cardIcon: { fontSize: 24, marginRight: spacing[2] },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  cardMeta: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  cardOk: { fontSize: fontSize.xs, color: "#15803d", marginTop: spacing[1] },
  cardDone: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: spacing[1] },
  actions: { flexDirection: "column", gap: spacing[1], marginLeft: spacing[2] },
  dismissBtn: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  dismissText: { color: "#15803d", fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  deleteBtn: {
    backgroundColor: "#fee",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  deleteText: { fontSize: fontSize.sm },
});
