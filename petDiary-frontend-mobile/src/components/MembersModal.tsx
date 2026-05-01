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
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { PetMember } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function generatePassword(): string {
  return (
    "PD" + Math.random().toString(36).slice(2, 10).toUpperCase()
  ).slice(0, 10);
}

type Props = {
  visible: boolean;
  petId: string;
  onClose: () => void;
};

export function MembersModal({ visible, petId, onClose }: Props) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<PetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tempPwd, setTempPwd] = useState(generatePassword());
  const [inviting, setInviting] = useState(false);

  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PetMember[]>(`/pets/${petId}/members/`);
      setMembers(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setTempPwd(generatePassword());
    setShowInvite(false);
  };

  const handleInvite = async () => {
    if (
      !fullName.trim() ||
      username.trim().length < 3 ||
      !email.includes("@") ||
      !phone.trim() ||
      tempPwd.length < 8
    ) {
      Alert.alert(t("common.warning"), t("members.form_required"));
      return;
    }
    setInviting(true);
    try {
      await api.post(`/pets/${petId}/members/`, {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        phone,
        whatsapp: true,
        temporary_password: tempPwd,
      });
      setCredentials({
        username: username.trim().toLowerCase(),
        password: tempPwd,
      });
      resetForm();
      await load();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        typeof data === "object"
          ? Object.entries(data)
              .map(
                ([k, v]) =>
                  `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`
              )
              .join("\n")
          : t("members.invite_failed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (m: PetMember) => {
    Alert.alert(
      t("members.remove_confirm_title"),
      t("members.remove_confirm_text", { name: m.user.full_name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: async () => {
            setRemovingId(m.id);
            try {
              await api.delete(`/pets/${petId}/members/${m.id}/`);
              await load();
            } catch {
              Alert.alert(t("common.error"), t("members.remove_failed"));
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const copyCredentials = () => {
    if (!credentials) return;
    Clipboard.setString(
      `${t("members.credentials_username")}: ${credentials.username}\n${t("members.credentials_password")}: ${credentials.password}\n\n${t("members.credentials_copy_hint")}`
    );
    Alert.alert(t("common.copied"), t("members.credentials_copied"));
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
          <Text style={styles.title}>{t("members.modal_title")}</Text>
          <TouchableOpacity onPress={() => setShowInvite((v) => !v)}>
            <Text style={styles.actionText}>
              {showInvite
                ? t("members.invite_toggle_close")
                : t("members.invite_toggle_open")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {showInvite && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t("members.form_title")}</Text>
              <Text style={styles.formHint}>{t("members.form_hint")}</Text>

              <Text style={styles.label}>
                {t("members.form_name")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>
                {t("members.form_username")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) =>
                  setUsername(v.replace(/\s+/g, "").toLowerCase())
                }
                autoCapitalize="none"
              />

              <Text style={styles.label}>
                {t("members.form_email")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>
                {t("members.form_phone")} {t("common.required")}
              </Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(v) => setPhone(maskPhone(v))}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>
                {t("members.form_temp_password")} {t("common.required")}
              </Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={tempPwd}
                  onChangeText={setTempPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.regenBtn}
                  onPress={() => setTempPwd(generatePassword())}
                >
                  <Text style={styles.regenText}>↻</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, inviting && styles.disabled]}
                onPress={handleInvite}
                disabled={inviting}
              >
                <Text style={styles.btnPrimaryText}>
                  {inviting
                    ? t("members.form_submit_loading")
                    : t("members.form_submit")}
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
          ) : members.length === 0 ? (
            <Text style={styles.empty}>{t("members.empty")}</Text>
          ) : (
            members.map((m) => (
              <View key={m.id} style={styles.memberCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.memberEmoji}>
                    {m.role === "OWNER" ? "👤" : "🤝"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.user.full_name}</Text>
                    <Text style={styles.memberMeta}>
                      @{m.user.username} ·{" "}
                      {m.role === "OWNER"
                        ? t("members.owner_label")
                        : t("members.caretaker_label")}
                    </Text>
                    <Text style={styles.memberMeta}>{m.user.email}</Text>
                  </View>
                </View>
                {m.role === "CARETAKER" && (
                  <TouchableOpacity
                    style={[
                      styles.removeBtn,
                      removingId === m.id && styles.disabled,
                    ]}
                    onPress={() => handleRemove(m)}
                    disabled={removingId === m.id}
                  >
                    <Text style={styles.removeText}>
                      {removingId === m.id
                        ? t("members.remove_loading")
                        : `🗑 ${t("common.remove")}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Modal credenciais */}
        <Modal
          visible={!!credentials}
          transparent
          animationType="fade"
          onRequestClose={() => setCredentials(null)}
        >
          <View style={styles.overlay}>
            <View style={styles.credCard}>
              <Text style={styles.credTitle}>{t("members.credentials_title")}</Text>
              <Text style={styles.credSubtitle}>
                {t("members.credentials_subtitle")}
              </Text>
              <View style={styles.credBox}>
                <Text style={styles.credLine}>
                  {t("members.credentials_username")}:{" "}
                  <Text style={styles.credValue}>{credentials?.username}</Text>
                </Text>
                <Text style={styles.credLine}>
                  {t("members.credentials_password")}:{" "}
                  <Text style={styles.credValue}>{credentials?.password}</Text>
                </Text>
              </View>
              <View style={styles.credActions}>
                <TouchableOpacity style={styles.copyBtn} onPress={copyCredentials}>
                  <Text style={styles.copyText}>{t("common.copy")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setCredentials(null)}
                >
                  <Text style={styles.closeText}>{t("common.close")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    marginBottom: spacing[2],
  },
  formHint: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    lineHeight: 18,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing[3],
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
  pwdRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  regenBtn: {
    backgroundColor: "#f4f4f4",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
  },
  regenText: { fontSize: 18 },
  btnPrimary: {
    backgroundColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    marginTop: spacing[4],
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  disabled: { opacity: 0.5 },
  empty: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    paddingVertical: spacing[8],
  },
  memberCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  memberEmoji: { fontSize: 28, marginRight: spacing[3] },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  memberMeta: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  removeBtn: {
    marginTop: spacing[3],
    backgroundColor: "#fee",
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcc",
  },
  removeText: {
    color: "#c00",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: spacing[4],
  },
  credCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  credTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: "center",
  },
  credSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginVertical: spacing[3],
    lineHeight: 20,
  },
  credBox: {
    backgroundColor: "#f4f4f4",
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  credLine: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  credValue: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  credActions: { flexDirection: "row", gap: spacing[3] },
  copyBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  copyText: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontWeight: fontWeight.semibold },
});
