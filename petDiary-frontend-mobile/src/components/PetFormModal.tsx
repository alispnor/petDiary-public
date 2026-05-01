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
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { Pet, Species } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const SPECIES: { code: Species; key: string; icon: string }[] = [
  { code: "DOG", key: "pet.species_dog", icon: "🐕" },
  { code: "CAT", key: "pet.species_cat", icon: "🐱" },
  { code: "BIRD", key: "pet.species_bird", icon: "🐦" },
  { code: "OTHER", key: "pet.species_other", icon: "🐾" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (pet: Pet) => void;
};

export function PetFormModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("DOG");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setSpecies("DOG");
    setBreed("");
    setWeight("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.warning"), t("pet.name_required"));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        species,
        breed: breed.trim(),
      };
      if (weight.trim()) {
        const w = weight.replace(",", ".");
        if (!/^\d+(\.\d{1,2})?$/.test(w)) {
          Alert.alert(t("common.warning"), t("pet.weight_invalid"));
          setSaving(false);
          return;
        }
        payload.weight_kg = w;
      }
      const { data } = await api.post<Pet>("/pets/", payload);
      onCreated(data);
      reset();
      onClose();
    } catch {
      Alert.alert(t("common.error"), t("pet.create_failed"));
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
          <Text style={styles.title}>{t("pet.form_title")}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || !name.trim()}
          >
            <Text
              style={[
                styles.saveText,
                (saving || !name.trim()) && styles.disabled,
              ]}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>{t("pet.species")}</Text>
          <View style={styles.row}>
            {SPECIES.map((s) => {
              const active = s.code === species;
              return (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSpecies(s.code)}
                >
                  <Text style={styles.chipIcon}>{s.icon}</Text>
                  <Text
                    style={[
                      styles.chipLabel,
                      active && styles.chipLabelActive,
                    ]}
                  >
                    {t(s.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>
            {t("pet.name")} {t("common.required")}
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("pet.name_placeholder")}
            maxLength={60}
          />

          <Text style={styles.label}>{t("pet.breed")}</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder={t("pet.breed_placeholder")}
            maxLength={60}
          />

          <Text style={styles.label}>{t("pet.weight")}</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder={t("pet.weight_placeholder")}
            keyboardType="decimal-pad"
            maxLength={6}
          />
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: colors.brand.teal,
    backgroundColor: "rgba(36,182,212,0.1)",
  },
  chipIcon: { fontSize: 18, marginRight: spacing[1] },
  chipLabel: { fontSize: fontSize.sm, color: colors.text.secondary },
  chipLabelActive: {
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
});
