import React, { useState } from "react";
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
import api from "../services/api";
import type { HealthRecord, RecordType } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const TYPES: { code: RecordType; label: string; icon: string }[] = [
  { code: "NOTE", label: "Nota", icon: "📝" },
  { code: "VACCINE", label: "Vacina", icon: "💉" },
  { code: "EXAM", label: "Exame", icon: "🔬" },
  { code: "PRESCRIPTION", label: "Receita", icon: "💊" },
  { code: "SURGERY", label: "Cirurgia", icon: "🏥" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  visible: boolean;
  petId: string;
  onClose: () => void;
  onCreated: (record: HealthRecord) => void;
};

export function RecordFormModal({ visible, petId, onClose, onCreated }: Props) {
  const [type, setType] = useState<RecordType>("NOTE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOccurred, setDateOccurred] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType("NOTE");
    setTitle("");
    setDescription("");
    setDateOccurred(todayISO());
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Atenção", "Informe um título para o registro.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOccurred)) {
      Alert.alert("Atenção", "Data deve estar no formato AAAA-MM-DD.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<HealthRecord>(
        `/pets/${petId}/health-records/`,
        {
          record_type: type,
          title: title.trim(),
          description: description.trim(),
          date_occurred: dateOccurred,
        }
      );
      onCreated(data);
      reset();
      onClose();
    } catch {
      Alert.alert("Erro", "Não foi possível criar o registro.");
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
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Novo registro</Text>
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
              {saving ? "Salvando…" : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = t.code === type;
              return (
                <TouchableOpacity
                  key={t.code}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setType(t.code)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      active && styles.typeLabelActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Vacina V10, Hemograma, Cirurgia castração…"
            maxLength={120}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalhes, observações, posologia…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dateOccurred}
            onChangeText={setDateOccurred}
            placeholder="2026-05-01"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.hint}>
            Após salvar, você poderá anexar fotos, documentos e laudos a este
            registro.
          </Text>
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
