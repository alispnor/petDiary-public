import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { colors, radii, spacing, fontSize, fontWeight, shadows } from "../theme";

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "Como compartilho o histórico do meu pet com um veterinário?",
    a:
      "Abra o pet, toque em \"Compartilhar com vet\" e gere um código de acesso temporário. " +
      "O veterinário usa esse código no portal web (vet.petdiary.com.br) e tem acesso " +
      "por 24 horas. Você pode revogar a qualquer momento na tela do pet.",
  },
  {
    q: "Quem mais pode acessar a conta do meu pet?",
    a:
      "Você pode convidar familiares como co-tutores na seção \"Familiares\" da conta " +
      "(disponível no portal web). Eles recebem acesso completo ao pet e ao plano PRO " +
      "(se você tiver um), mas não podem excluir a conta principal.",
  },
  {
    q: "Como funciona o plano PRO?",
    a:
      "O PRO custa R$ 14,90/mês via PIX. Inclui pets ilimitados, IA para extrair " +
      "informações de prescrições e exames, transcrição de áudio (Whisper), " +
      "co-tutores ilimitados e suporte prioritário. Cancele quando quiser.",
  },
  {
    q: "Como cancelo minha assinatura?",
    a:
      "Vá em Conta > Assinatura > Cancelar assinatura. Você mantém o PRO até o fim " +
      "do período pago. Não há multa.",
  },
  {
    q: "Posso excluir minha conta?",
    a:
      "Sim. Vá em Conta > Excluir minha conta. Os dados pessoais (nome, email, " +
      "telefone, CPF, endereço) são anonimizados conforme a LGPD. O histórico " +
      "clínico dos pets é preservado para co-tutores e veterinários autorizados.",
  },
  {
    q: "Esqueci minha senha. O que faço?",
    a:
      "Faça logout e na tela de login toque em \"Esqueci minha senha\" — você receberá " +
      "um link por email (válido por 30 minutos) para criar uma nova.",
  },
  {
    q: "A IA está errando informações. Posso corrigir?",
    a:
      "Sim. Toda extração da IA pode ser editada manualmente no registro. A IA serve " +
      "para acelerar o cadastro, mas você é a fonte de verdade.",
  },
];

const SUPPORT_EMAIL = "suporte@petdiary.com.br";
const SUPPORT_WHATSAPP = "5511999999999"; // mock — atualizar quando tiver número real

export function HelpCenter() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=Suporte%20PetDiary`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert("Email", `Envie sua dúvida para:\n${SUPPORT_EMAIL}`);
    }
  };

  const handleWhatsApp = async () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20PetDiary.`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert("WhatsApp", "Não foi possível abrir o WhatsApp neste dispositivo.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💬</Text>
        <Text style={styles.heroTitle}>Como podemos ajudar?</Text>
        <Text style={styles.heroSubtitle}>
          Confira as perguntas frequentes ou fale direto com nosso suporte.
        </Text>
      </View>

      {/* Contato */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fale com a gente</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
          <Text style={styles.contactEmoji}>📧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
          <Text style={styles.contactEmoji}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>Resposta em até 1 dia útil</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perguntas frequentes</Text>
        {FAQS.map((faq, idx) => {
          const open = openIdx === idx;
          return (
            <View key={idx} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => setOpenIdx(open ? null : idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQ}>{faq.q}</Text>
                <Text style={styles.faqToggle}>{open ? "−" : "+"}</Text>
              </TouchableOpacity>
              {open && <Text style={styles.faqA}>{faq.a}</Text>}
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>PetDiary · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  hero: {
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    ...shadows.soft,
  },
  heroEmoji: { fontSize: 56, marginBottom: spacing[2] },
  heroTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extraBold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "#f0eee9",
  },
  contactEmoji: { fontSize: 24, marginRight: spacing[3] },
  contactLabel: { fontSize: fontSize.base, color: colors.text.primary },
  contactValue: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  chevron: { fontSize: 22, color: "#bbb", fontWeight: "300" },
  faqItem: {
    borderTopWidth: 1,
    borderTopColor: "#f0eee9",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  faqQ: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    paddingRight: spacing[2],
  },
  faqToggle: {
    fontSize: fontSize.xl,
    color: colors.brand.teal,
    fontWeight: fontWeight.bold,
    width: 24,
    textAlign: "center",
  },
  faqA: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    paddingBottom: spacing[3],
  },
  footer: {
    textAlign: "center",
    color: colors.text.secondary,
    fontSize: fontSize.xs,
    marginTop: spacing[4],
  },
});
