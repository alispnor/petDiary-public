import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useAppStore } from "../store/useAppStore";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { User } from "../types";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { colors, radii, spacing, fontSize, fontWeight, shadows } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AccountSettings">;

export function AccountSettings({ navigation }: Props) {
  const { t } = useTranslation();
  const user = useAppStore((s) => s.user);
  const setAuth = useAppStore((s) => s.setAuth);
  const logout = useAppStore((s) => s.logout);
  const token = useAppStore((s) => s.token);
  const refreshToken = useAppStore((s) => s.refreshToken);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put<User>("/users/me/", {
        full_name: fullName,
        email,
        phone,
      });
      if (token && refreshToken) setAuth(token, refreshToken, data);
      Alert.alert("✓", t("account.profile_saved"));
    } catch {
      Alert.alert(t("common.error"), t("account.profile_failed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 8) {
      Alert.alert(t("common.warning"), t("account.change_password_min"));
      return;
    }
    if (!currentPwd && !user?.must_change_password) {
      Alert.alert(t("common.warning"), t("account.change_password_current_required"));
      return;
    }
    setSavingPwd(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: currentPwd,
        new_password: newPwd,
      });
      setPasswordModal(false);
      setCurrentPwd("");
      setNewPwd("");
      Alert.alert("✓", t("account.change_password_done"), [
        { text: t("common.ok"), onPress: () => logout() },
      ]);
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.current_password
          ? t("account.change_password_current_wrong")
          : t("account.change_password_failed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "EXCLUIR") {
      Alert.alert(t("common.warning"), t("account.delete_warn_word"));
      return;
    }
    if (!confirmPwd) {
      Alert.alert(t("common.warning"), t("account.delete_warn_password"));
      return;
    }
    setDeleting(true);
    try {
      await api.post("/auth/token/", {
        username: user?.username,
        password: confirmPwd,
      });
      await api.delete("/users/me/", {
        headers: { "X-Confirm-Delete": "EXCLUIR" },
      });
      Alert.alert(
        t("account.delete_done_title"),
        t("account.delete_done_text"),
        [{ text: t("common.ok"), onPress: () => logout() }],
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        Alert.alert(t("common.error"), t("account.delete_password_wrong"));
      } else {
        Alert.alert(t("common.error"), t("account.delete_failed"));
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing[10] }}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.full_name || user?.username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userMeta}>@{user?.username} · {user?.role}</Text>
      </View>

      {/* Editar perfil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("account.section_profile")}</Text>
        <Text style={styles.label}>{t("account.field_full_name")}</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t("account.field_full_name_placeholder")}
        />
        <Text style={styles.label}>{t("account.field_email")}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t("account.field_email_placeholder")}
        />
        <Text style={styles.label}>{t("account.field_phone")}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder={t("account.field_phone_placeholder")}
        />
        <TouchableOpacity
          style={[styles.btnPrimary, savingProfile && styles.btnDisabled]}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          <Text style={styles.btnPrimaryText}>
            {savingProfile ? t("account.saving_profile") : t("account.save_profile")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Idioma */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("account.section_language")}</Text>
        <LanguageSwitcher variant="row" />
      </View>

      {/* Atalhos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("account.section_more")}</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("SubscriptionDashboard")}
        >
          <Text style={styles.rowEmoji}>💳</Text>
          <Text style={styles.rowLabel}>{t("account.menu_subscription")}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("HelpCenter")}
        >
          <Text style={styles.rowEmoji}>❓</Text>
          <Text style={styles.rowLabel}>{t("account.menu_help")}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("NotificationPreferences")}
        >
          <Text style={styles.rowEmoji}>🔔</Text>
          <Text style={styles.rowLabel}>{t("account.menu_notifications")}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setPasswordModal(true)}
        >
          <Text style={styles.rowEmoji}>🔒</Text>
          <Text style={styles.rowLabel}>{t("account.menu_change_password")}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Zona de risco */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("account.section_session")}</Text>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() =>
            Alert.alert(t("common.logout"), t("account.logout_confirm"), [
              { text: t("common.cancel"), style: "cancel" },
              { text: t("common.logout"), style: "destructive", onPress: () => logout() },
            ])
          }
        >
          <Text style={styles.btnSecondaryText}>{t("account.logout_btn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnDanger}
          onPress={() => setDeleteModal(true)}
        >
          <Text style={styles.btnDangerText}>{t("account.delete_btn")}</Text>
        </TouchableOpacity>
        <Text style={styles.dangerHint}>{t("account.delete_hint")}</Text>
      </View>

      {/* Modal trocar senha */}
      <Modal visible={passwordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("account.change_password_title")}</Text>
            {!user?.must_change_password && (
              <>
                <Text style={styles.label}>{t("account.current_password")}</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  placeholder="••••••••"
                />
              </>
            )}
            <Text style={styles.label}>{t("account.new_password")}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="••••••••"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, marginRight: spacing[2] }]}
                onPress={() => {
                  setPasswordModal(false);
                  setCurrentPwd("");
                  setNewPwd("");
                }}
              >
                <Text style={styles.btnSecondaryText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  { flex: 1, marginLeft: spacing[2] },
                  savingPwd && styles.btnDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={savingPwd}
              >
                <Text style={styles.btnPrimaryText}>
                  {savingPwd ? t("common.saving") : t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal excluir conta */}
      <Modal visible={deleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("account.delete_modal_title")}</Text>
            <Text style={styles.modalText}>{t("account.delete_modal_text")}</Text>
            <Text style={styles.label}>{t("account.delete_confirm_label")}</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="EXCLUIR"
            />
            <Text style={styles.label}>{t("account.delete_password_label")}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="••••••••"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, marginRight: spacing[2] }]}
                onPress={() => {
                  setDeleteModal(false);
                  setConfirmText("");
                  setConfirmPwd("");
                }}
              >
                <Text style={styles.btnSecondaryText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnDanger,
                  { flex: 1, marginLeft: spacing[2] },
                  deleting && styles.btnDisabled,
                ]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnDangerText}>{t("common.delete")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  headerCard: {
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    ...shadows.soft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  avatarText: {
    color: "#fff",
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  userMeta: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radii.md,
    ...shadows.soft,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    marginTop: spacing[2],
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
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    marginTop: spacing[4],
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  btnSecondary: {
    backgroundColor: "#f4f4f4",
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    alignItems: "center",
    marginBottom: spacing[3],
  },
  btnSecondaryText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  btnDanger: {
    backgroundColor: "#dc2626",
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  btnDangerText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  btnDisabled: { opacity: 0.5 },
  dangerHint: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "#f0eee9",
  },
  rowEmoji: { fontSize: 22, marginRight: spacing[3] },
  rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.text.primary },
  rowChevron: { fontSize: 22, color: "#bbb", fontWeight: "300" },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  modalCard: {
    backgroundColor: colors.bg.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing[5],
    ...shadows.modal,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  modalText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  modalRow: {
    flexDirection: "row",
    marginTop: spacing[4],
  },
});
