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
import { useTranslation } from "react-i18next";
import { colors, radii, spacing, fontSize, fontWeight, shadows } from "../theme";

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7];

const SUPPORT_EMAIL = "suporte@petdiary.com.br";
const SUPPORT_WHATSAPP = "5511999999999"; // mock — atualizar quando tiver número real

export function HelpCenter() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=Suporte%20PetDiary`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        t("help.contact_email_dialog_title"),
        t("help.contact_email_dialog_text", { email: SUPPORT_EMAIL })
      );
    }
  };

  const handleWhatsApp = async () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20PetDiary.`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert(t("help.contact_whatsapp_label"), t("help.contact_whatsapp_failed"));
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
        <Text style={styles.heroTitle}>{t("help.hero_title")}</Text>
        <Text style={styles.heroSubtitle}>{t("help.hero_subtitle")}</Text>
      </View>

      {/* Contato */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("help.section_contact")}</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
          <Text style={styles.contactEmoji}>📧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>{t("help.contact_email_label")}</Text>
            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
          <Text style={styles.contactEmoji}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>{t("help.contact_whatsapp_label")}</Text>
            <Text style={styles.contactValue}>{t("help.contact_whatsapp_hint")}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("help.section_faq")}</Text>
        {FAQ_KEYS.map((n, idx) => {
          const open = openIdx === idx;
          return (
            <View key={n} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => setOpenIdx(open ? null : idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQ}>{t(`help.faq_q${n}`)}</Text>
                <Text style={styles.faqToggle}>{open ? "−" : "+"}</Text>
              </TouchableOpacity>
              {open && <Text style={styles.faqA}>{t(`help.faq_a${n}`)}</Text>}
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>{t("help.footer_version")}</Text>
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
