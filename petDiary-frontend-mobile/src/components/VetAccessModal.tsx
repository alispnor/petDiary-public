import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { ActiveAccess } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type Props = {
  visible: boolean;
  petId: string;
  onClose: () => void;
};

export function VetAccessModal({ visible, petId, onClose }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ActiveAccess[]>("/access/active/");
      setItems(data.filter((a) => a.pet.id === petId));
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleRevoke = (access: ActiveAccess) => {
    Alert.alert(
      t("vets.revoke_confirm_title"),
      t("vets.revoke_confirm_text", {
        name: access.vet.full_name,
        crmv: access.vet.crmv,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("vets.revoke_btn").replace("🚫 ", ""),
          style: "destructive",
          onPress: async () => {
            setRevokingId(access.id);
            try {
              await api.post(`/access/tokens/${access.id}/revoke/`);
              await load();
            } catch {
              Alert.alert(t("common.error"), t("vets.revoke_failed"));
            } finally {
              setRevokingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>{t("common.close")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("vets.modal_title")}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.brand.teal}
              style={{ marginTop: 32 }}
            />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>{t("vets.empty")}</Text>
          ) : (
            items.map((access) => (
              <View key={access.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>🩺</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vetName}>{access.vet.full_name}</Text>
                    <Text style={styles.vetMeta}>
                      {access.vet.crmv} · {access.vet.clinic_name}
                    </Text>
                    {access.vet.phone ? (
                      <Text style={styles.vetMeta}>{access.vet.phone}</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.dateLine}>
                  {t("vets.accessed_at", {
                    date: new Date(access.claimed_at).toLocaleDateString(),
                  })}
                </Text>
                {access.last_visit && (
                  <Text style={styles.dateLine}>
                    {t("vets.last_visit", {
                      date: new Date(access.last_visit).toLocaleDateString(),
                    })}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.revokeBtn,
                    revokingId === access.id && styles.disabled,
                  ]}
                  onPress={() => handleRevoke(access)}
                  disabled={revokingId === access.id}
                >
                  <Text style={styles.revokeText}>
                    {revokingId === access.id
                      ? t("vets.revoke_loading")
                      : t("vets.revoke_btn")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
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
  content: { padding: spacing[4], paddingBottom: spacing[10] },
  empty: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    paddingVertical: spacing[8],
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardEmoji: { fontSize: 28, marginRight: spacing[3] },
  vetName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  vetMeta: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dateLine: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  revokeBtn: {
    marginTop: spacing[3],
    backgroundColor: "#fee",
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcc",
  },
  revokeText: {
    color: "#c00",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  disabled: { opacity: 0.5 },
});
