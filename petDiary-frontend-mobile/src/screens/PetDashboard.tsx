import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Clipboard,
  Platform,
  RefreshControl,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { HealthRecord, RecordType, VetAccessToken } from "../types";
import { RecordFormModal } from "../components/RecordFormModal";
import { AttachmentsList } from "../components/AttachmentsList";
import { VetAccessModal } from "../components/VetAccessModal";
import { MembersModal } from "../components/MembersModal";
import { RemindersModal } from "../components/RemindersModal";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PetDashboard">;

const TYPE_ICONS: Record<RecordType, string> = {
  VACCINE: "💉",
  EXAM: "🔬",
  PRESCRIPTION: "💊",
  SURGERY: "🏥",
  NOTE: "📝",
};

const TYPE_KEYS: Record<RecordType, string> = {
  VACCINE: "records.type_vaccine",
  EXAM: "records.type_exam",
  PRESCRIPTION: "records.type_prescription",
  SURGERY: "records.type_surgery",
  NOTE: "records.type_note",
};

export function PetDashboard({ route }: Props) {
  const { t } = useTranslation();
  const { pet } = route.params;

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [recordModal, setRecordModal] = useState(false);
  const [vetsModal, setVetsModal] = useState(false);
  const [membersModal, setMembersModal] = useState(false);
  const [remindersModal, setRemindersModal] = useState(false);

  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinResult, setPinResult] = useState<VetAccessToken | null>(null);

  const loadRecords = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get<HealthRecord[]>(
        `/pets/${pet.id}/health-records/`
      );
      setRecords(data);
    } catch {
      setError(t("pet.dashboard_load_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pet.id]);

  useEffect(() => {
    setLoading(true);
    loadRecords();
  }, [loadRecords]);

  const handleGeneratePin = async () => {
    setGeneratingPin(true);
    try {
      const { data } = await api.post<VetAccessToken>("/access/generate-pin/", {
        pet: pet.id,
      });
      setPinResult(data);
    } catch {
      Alert.alert(t("common.error"), t("pet.dashboard_pin_failed"));
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCopyPin = () => {
    if (pinResult) {
      Clipboard.setString(pinResult.access_code);
      Alert.alert(t("common.copied"), t("pet.dashboard_pin_copied"));
    }
  };

  const handleRecordCreated = (rec: HealthRecord) => {
    setRecords((prev) => [rec, ...prev]);
    setExpandedId(rec.id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing[16] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRecords();
            }}
            tintColor={colors.brand.teal}
          />
        }
      >
        <View style={styles.petCard}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petDetail}>
            {pet.breed || "—"}
            {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnPin}
            onPress={handleGeneratePin}
            disabled={generatingPin}
          >
            <Text style={styles.btnText}>
              {generatingPin
                ? t("pet.dashboard_pin_loading")
                : t("pet.dashboard_pin_btn")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setVetsModal(true)}
          >
            <Text style={styles.btnSecondaryText}>{t("pet.dashboard_actions_vets")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setMembersModal(true)}
          >
            <Text style={styles.btnSecondaryText}>{t("pet.dashboard_actions_family")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setRemindersModal(true)}
          >
            <Text style={styles.btnSecondaryText}>{t("pet.dashboard_actions_reminders")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>{t("pet.dashboard_history_title")}</Text>
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => setRecordModal(true)}
          >
            <Text style={styles.btnAddText}>{t("pet.dashboard_new_record")}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.brand.teal}
            style={{ marginTop: 32 }}
          />
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadRecords} style={styles.retryBtn}>
              <Text style={styles.btnText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {t("pet.dashboard_empty_records").replace(/<\/?bold>/g, "")}
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {records.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.timelineItem}>
                  <TouchableOpacity
                    style={styles.timelineRow}
                    onPress={() =>
                      setExpandedId(isExpanded ? null : item.id)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.timelineDot}>
                      <Text style={styles.timelineIcon}>
                        {TYPE_ICONS[item.record_type]}
                      </Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>
                        {item.date_occurred}
                      </Text>
                      <Text style={styles.timelineTitle}>
                        {t(TYPE_KEYS[item.record_type])} · {item.title}
                      </Text>
                      {item.description ? (
                        <Text style={styles.timelineDesc}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text style={styles.expandHint}>
                        {isExpanded
                          ? t("pet.dashboard_hide_attachments")
                          : t("pet.dashboard_show_attachments")}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <AttachmentsList petId={pet.id} recordId={item.id} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <RecordFormModal
        visible={recordModal}
        petId={pet.id}
        onClose={() => setRecordModal(false)}
        onCreated={handleRecordCreated}
      />

      <VetAccessModal
        visible={vetsModal}
        petId={pet.id}
        onClose={() => setVetsModal(false)}
      />

      <MembersModal
        visible={membersModal}
        petId={pet.id}
        onClose={() => setMembersModal(false)}
      />

      <RemindersModal
        visible={remindersModal}
        petId={pet.id}
        petName={pet.name}
        onClose={() => setRemindersModal(false)}
      />

      {/* PIN Modal */}
      <Modal
        visible={!!pinResult}
        transparent
        animationType="fade"
        onRequestClose={() => setPinResult(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🔑</Text>
            <Text style={styles.modalTitle}>
              {t("pet.dashboard_pin_modal_title")}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t("pet.dashboard_pin_modal_subtitle")}
            </Text>
            <View style={styles.pinBox}>
              <Text style={styles.pinCode}>{pinResult?.access_code}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCopy} onPress={handleCopyPin}>
                <Text style={styles.btnCopyText}>{t("common.copy")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnClose}
                onPress={() => setPinResult(null)}
              >
                <Text style={styles.btnText}>{t("common.close")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  petCard: {
    backgroundColor: colors.brand.teal,
    margin: spacing[4],
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  petName: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: "#fff",
  },
  petDetail: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  btnPin: {
    flex: 1,
    backgroundColor: colors.brand.orange,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  secondaryActions: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[3],
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  btnAdd: {
    backgroundColor: colors.brand.teal,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  btnAddText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  timeline: { paddingHorizontal: spacing[4] },
  timelineItem: { marginBottom: spacing[3] },
  timelineRow: { flexDirection: "row" },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  timelineIcon: { fontSize: 18 },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[3],
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timelineDate: { fontSize: fontSize.xs, color: colors.text.secondary },
  timelineTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  timelineDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  expandHint: {
    fontSize: fontSize.xs,
    color: colors.brand.teal,
    marginTop: spacing[2],
    fontWeight: fontWeight.semibold,
  },
  center: { padding: spacing[8], alignItems: "center" },
  emptyText: { color: colors.text.secondary, textAlign: "center" },
  errorText: { color: "#c00", textAlign: "center", marginBottom: spacing[3] },
  retryBtn: {
    backgroundColor: colors.brand.teal,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing[6],
    alignItems: "center",
  },
  modalEmoji: { fontSize: 48 },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  pinBox: {
    width: "100%",
    backgroundColor: "#f4f4f4",
    borderRadius: radii.md,
    paddingVertical: spacing[6],
    alignItems: "center",
    marginBottom: spacing[5],
  },
  pinCode: {
    fontSize: 40,
    fontWeight: fontWeight.extraBold,
    letterSpacing: 8,
    color: colors.brand.teal,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "monospace",
    }) as any,
  },
  modalActions: { flexDirection: "row", gap: spacing[3], width: "100%" },
  btnCopy: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  btnCopyText: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
  },
  btnClose: {
    flex: 1,
    backgroundColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
});
