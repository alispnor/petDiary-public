import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import axios from "axios";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useAppStore } from "../store/useAppStore";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { User } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const setAuth = useAppStore((s) => s.setAuth);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      username.trim().length < 3 ||
      !email.includes("@") ||
      !phone.trim() ||
      password.length < 8
    ) {
      Alert.alert(t("common.warning"), t("auth.register_error_fields"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register/", {
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: "TUTOR",
        phone,
        whatsapp: true,
      });

      // login automático
      const { data: tokens } = await api.post<{
        access: string;
        refresh: string;
      }>("/auth/token/", {
        username: username.trim().toLowerCase(),
        password,
      });
      const { data: user } = await axios.get<User>(
        `${api.defaults.baseURL}/users/me/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );
      setAuth(tokens.access, tokens.refresh, user);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        const msg =
          typeof d === "object"
            ? Object.entries(d)
                .map(
                  ([k, v]) =>
                    `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`
                )
                .join("\n")
            : String(d);
        Alert.alert(t("common.error"), msg);
      } else {
        Alert.alert(t("common.error"), t("auth.register_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.langWrap}>
          <LanguageSwitcher />
        </View>
        <View style={styles.card}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t("auth.register_title")}</Text>
          <Text style={styles.subtitle}>{t("auth.register_subtitle")}</Text>

          <Text style={styles.label}>{t("auth.full_name")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.full_name_placeholder")}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>{t("auth.username")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.username_placeholder")}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={(v) => setUsername(v.replace(/\s+/g, "").toLowerCase())}
          />

          <Text style={styles.label}>{t("auth.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.email_placeholder")}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t("auth.phone")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.phone_placeholder")}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => setPhone(maskPhone(v))}
          />

          <Text style={styles.label}>{t("auth.password_min")}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t("auth.password_placeholder")}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPwd((v) => !v)}
            >
              <Text style={styles.eyeIcon}>{showPwd ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? t("auth.register_loading") : t("auth.register_submit")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>
              {t("auth.have_account")}{" "}
              <Text style={styles.linkAccent}>{t("auth.login_link")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing[4] },
  langWrap: { marginBottom: spacing[3], alignItems: "flex-end" },
  logo: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginBottom: spacing[2],
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.lg,
    padding: spacing[6],
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extraBold,
    color: colors.brand.teal,
    textAlign: "center",
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    marginTop: spacing[2],
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingRight: 50 },
  eyeBtn: { position: "absolute", right: spacing[3], padding: spacing[1] },
  eyeIcon: { fontSize: 20 },
  btn: {
    backgroundColor: colors.brand.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    marginTop: spacing[5],
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
    textAlign: "center",
  },
  linkBtn: { marginTop: spacing[4] },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  linkAccent: { color: colors.brand.teal, fontWeight: fontWeight.semibold },
});
