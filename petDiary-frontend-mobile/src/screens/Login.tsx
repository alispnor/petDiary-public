import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import axios from "axios";
import api from "../services/api";
import { useAppStore } from "../store/useAppStore";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { User } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

export function LoginScreen({ navigation }: any) {
  const setAuth = useAppStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Atenção", "Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      const { data: tokens } = await api.post<{
        access: string;
        refresh: string;
      }>("/auth/token/", { username: username.trim().toLowerCase(), password });

      const { data: user } = await axios.get<User>(
        `${api.defaults.baseURL}/users/me/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );

      setAuth(tokens.access, tokens.refresh, user);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        Alert.alert("Erro", "Usuário ou senha inválidos.");
      } else {
        Alert.alert("Erro", "Não foi possível fazer login. Tente novamente.");
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
      <View style={styles.langWrap}>
        <LanguageSwitcher />
      </View>

      <View style={styles.card}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>PetDiary</Text>
        <Text style={styles.subtitle}>
          Acesse sua conta para gerenciar a saúde do seu pet
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Usuário"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Senha"
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
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Entrando…" : "Entrar"}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={styles.registerBtn}
        >
          <Text style={styles.registerText}>
            Ainda não tem conta?{" "}
            <Text style={styles.registerAccent}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  langWrap: {
    position: "absolute",
    top: spacing[6],
    right: spacing[4],
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
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.extraBold,
    color: colors.brand.teal,
    textAlign: "center",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[6],
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    marginBottom: spacing[3],
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingRight: 50 },
  eyeBtn: {
    position: "absolute",
    right: spacing[3],
    bottom: spacing[3] + 12,
    padding: spacing[1],
  },
  eyeIcon: { fontSize: 20 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: spacing[3] },
  forgotText: {
    fontSize: fontSize.xs,
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
  btn: {
    backgroundColor: colors.brand.teal,
    borderRadius: radii.pill,
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[5],
  },
  registerBtn: { marginTop: 0 },
  registerText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  registerAccent: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
});
