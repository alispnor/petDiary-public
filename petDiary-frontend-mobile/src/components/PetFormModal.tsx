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
import type { Pet, Species } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const SPECIES: { code: Species; label: string; icon: string }[] = [
  { code: "DOG", label: "Cachorro", icon: "🐕" },
  { code: "CAT", label: "Gato", icon: "🐱" },
  { code: "BIRD", label: "Ave", icon: "🐦" },
  { code: "OTHER", label: "Outro", icon: "🐾" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (pet: Pet) => void;
};

export function PetFormModal({ visible, onClose, onCreated }: Props) {
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
      Alert.alert("Atenção", "Informe o nome do pet.");
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
          Alert.alert("Atenção", "Peso inválido (use ponto, ex.: 12.5).");
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
      Alert.alert("Erro", "Não foi possível criar o pet.");
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
          <Text style={styles.title}>Novo pet</Text>
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
              {saving ? "Salvando…" : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Espécie</Text>
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
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Thor, Mel, Pipoca…"
            maxLength={60}
          />

          <Text style={styles.label}>Raça</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="Labrador, SRD…"
            maxLength={60}
          />

          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Ex.: 12.5"
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
