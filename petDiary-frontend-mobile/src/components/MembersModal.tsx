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
      Alert.alert(
        "Atenção",
        "Preencha nome, usuário (≥3), email, telefone. Senha temporária ≥ 8."
      );
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
          : "Não foi possível convidar o familiar.";
      Alert.alert("Erro", msg);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (m: PetMember) => {
    Alert.alert(
      "Remover familiar?",
      `${m.user.full_name} perderá acesso ao prontuário deste pet.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setRemovingId(m.id);
            try {
              await api.delete(`/pets/${petId}/members/${m.id}/`);
              await load();
            } catch {
              Alert.alert("Erro", "Não foi possível remover.");
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
      `Usuário: ${credentials.username}\nSenha: ${credentials.password}\n\nAcesse petdiary.com.br`
    );
    Alert.alert("Copiado!", "Credenciais copiadas.");
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
            <Text style={styles.cancelText}>Fechar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>👨‍👩‍👧 Familiares</Text>
          <TouchableOpacity onPress={() => setShowInvite((v) => !v)}>
            <Text style={styles.actionText}>
              {showInvite ? "Cancelar" : "+ Convidar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {showInvite && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Convidar familiar</Text>
              <Text style={styles.formHint}>
                Vamos criar uma conta CARETAKER para esta pessoa. Ela receberá
                a senha abaixo e poderá trocá-la depois.
              </Text>

              <Text style={styles.label}>Nome completo *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Usuário *</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) =>
                  setUsername(v.replace(/\s+/g, "").toLowerCase())
                }
                autoCapitalize="none"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Telefone *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(v) => setPhone(maskPhone(v))}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Senha temporária *</Text>
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
                  {inviting ? "Enviando…" : "Convidar"}
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
            <Text style={styles.empty}>Nenhum familiar cadastrado.</Text>
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
                      {m.role === "OWNER" ? "Tutor" : "Familiar"}
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
                      {removingId === m.id ? "Removendo…" : "🗑 Remover"}
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
              <Text style={styles.credTitle}>✅ Familiar convidado!</Text>
              <Text style={styles.credSubtitle}>
                Compartilhe estas credenciais com a pessoa. Ela deverá trocar a
                senha no primeiro login.
              </Text>
              <View style={styles.credBox}>
                <Text style={styles.credLine}>
                  Usuário:{" "}
                  <Text style={styles.credValue}>{credentials?.username}</Text>
                </Text>
                <Text style={styles.credLine}>
                  Senha:{" "}
                  <Text style={styles.credValue}>{credentials?.password}</Text>
                </Text>
              </View>
              <View style={styles.credActions}>
                <TouchableOpacity style={styles.copyBtn} onPress={copyCredentials}>
                  <Text style={styles.copyText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setCredentials(null)}
                >
                  <Text style={styles.closeText}>Fechar</Text>
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
