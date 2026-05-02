import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { HealthRecord, RecordType } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const TYPES: { code: RecordType; key: string; icon: string }[] = [
  { code: "NOTE", key: "records.type_note", icon: "📝" },
  { code: "VACCINE", key: "records.type_vaccine", icon: "💉" },
  { code: "EXAM", key: "records.type_exam", icon: "🔬" },
  { code: "PRESCRIPTION", key: "records.type_prescription", icon: "💊" },
  { code: "SURGERY", key: "records.type_surgery", icon: "🏥" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  visible: boolean;
  petId: string;
  onClose: () => void;
  onSaved: (record: HealthRecord) => void;
  record?: HealthRecord | null;
};

export function RecordFormModal({
  visible,
  petId,
  onClose,
  onSaved,
  record,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!record;
  const [type, setType] = useState<RecordType>("NOTE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOccurred, setDateOccurred] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setType(record.record_type);
      setTitle(record.title);
      setDescription(record.description || "");
      setDateOccurred(record.date_occurred);
    } else {
      setType("NOTE");
      setTitle("");
      setDescription("");
      setDateOccurred(todayISO());
    }
  }, [record, visible]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t("common.warning"), t("records.title_required"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOccurred)) {
      Alert.alert(t("common.warning"), t("records.date_invalid"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        record_type: type,
        title: title.trim(),
        description: description.trim(),
        date_occurred: dateOccurred,
      };
      const { data } = isEdit
        ? await api.patch<HealthRecord>(
            `/pets/${petId}/health-records/${record!.id}/`,
            payload
          )
        : await api.post<HealthRecord>(
            `/pets/${petId}/health-records/`,
            payload
          );
      onSaved(data);
      onClose();
    } catch {
      Alert.alert(
        t("common.error"),
        isEdit ? t("records.update_failed") : t("records.create_failed")
      );
    } finally {
      setSaving(false);
    }
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
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t(isEdit ? "records.form_title_edit" : "records.form_title")}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || !title.trim()}
          >
            <Text
              style={[
                styles.saveText,
                (saving || !title.trim()) && styles.disabled,
              ]}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>{t("records.type_label")}</Text>
          <View style={styles.typeRow}>
            {TYPES.map((it) => {
              const active = it.code === type;
              return (
                <TouchableOpacity
                  key={it.code}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setType(it.code)}
                >
                  <Text style={styles.typeIcon}>{it.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      active && styles.typeLabelActive,
                    ]}
                  >
                    {t(it.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>
            {t("records.title_label")} {t("common.required")}
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("records.title_placeholder")}
            maxLength={120}
          />

          <Text style={styles.label}>{t("records.description_label")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t("records.description_placeholder")}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>{t("records.date_label")}</Text>
          <TextInput
            style={styles.input}
            value={dateOccurred}
            onChangeText={setDateOccurred}
            placeholder="2026-05-01"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.hint}>{t("records.after_save_hint")}</Text>
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
  saveText: {
    color: colors.brand.teal,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  disabled: { opacity: 0.4 },
  content: { padding: spacing[4], paddingBottom: spacing[10] },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing[3],
    marginBottom: spacing[2],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
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
  typeIcon: { fontSize: 18, marginRight: spacing[1] },
  typeLabel: { fontSize: fontSize.sm, color: colors.text.secondary },
  typeLabelActive: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  textArea: { minHeight: 100 },
  hint: {
    marginTop: spacing[4],
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontStyle: "italic",
  },
});
