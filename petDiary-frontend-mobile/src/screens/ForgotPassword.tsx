import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import axios from "axios";
import api from "../services/api";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password/", { email: email.trim() });
      setSent(true);
    } catch {
      // resposta genérica do backend impede enumeração; mesmo em erro mostra confirmação
      setSent(true);
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
        <Text style={styles.title}>Recuperar senha</Text>

        {sent ? (
          <>
            <Text style={styles.success}>
              ✅ Se este email estiver cadastrado, você receberá um link de
              redefinição em instantes. Cheque sua caixa de entrada e a pasta
              de spam.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Voltar ao login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Informe seu email cadastrado. Enviaremos um link para você criar
              uma nova senha.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={[
                styles.btn,
                (loading || !email.includes("@")) && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !email.includes("@")}
            >
              <Text style={styles.btnText}>
                {loading ? "Enviando…" : "Enviar link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>
                Lembrou a senha?{" "}
                <Text style={styles.linkAccent}>Voltar ao login</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
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
  logo: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginBottom: spacing[3],
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
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[5],
  },
  success: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing[5],
    lineHeight: 22,
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
  linkBtn: { marginTop: spacing[4] },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  linkAccent: { color: colors.brand.teal, fontWeight: fontWeight.semibold },
});
