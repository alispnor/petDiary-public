import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import type { Language } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "pt-BR", label: "🇧🇷 Português (Brasil)" },
  { code: "es-ES", label: "🇪🇸 Español" },
  { code: "en-US", label: "🇺🇸 English" },
];

type Props = {
  variant?: "compact" | "row";
};

export function LanguageSwitcher({ variant = "compact" }: Props) {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <>
      <TouchableOpacity
        style={variant === "compact" ? styles.compactBtn : styles.rowBtn}
        onPress={() => setOpen(true)}
      >
        <Text style={variant === "compact" ? styles.compactLabel : styles.rowLabel}>
          {current.label}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Idioma do app</Text>
            {LANGUAGES.map((l) => {
              const active = l.code === language;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      active && styles.optionLabelActive,
                    ]}
                  >
                    {l.label}
                  </Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-end",
  },
  rowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginRight: spacing[1],
  },
  rowLabel: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  caret: { fontSize: fontSize.xs, color: colors.text.secondary },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  sheetTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.brand.teal,
    backgroundColor: "rgba(36, 182, 212, 0.08)",
  },
  optionLabel: { fontSize: fontSize.base, color: colors.text.primary },
  optionLabelActive: {
    fontWeight: fontWeight.semibold,
    color: colors.brand.teal,
  },
  check: { color: colors.brand.teal, fontWeight: fontWeight.bold },
});
