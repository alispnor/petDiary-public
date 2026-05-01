import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Clipboard,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../services/api";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { HealthRecord, RecordType, VetAccessToken } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PetDashboard">;

const TYPE_ICONS: Record<RecordType, string> = {
  VACCINE: "💉",
  EXAM: "🔬",
  PRESCRIPTION: "💊",
  SURGERY: "🏥",
  NOTE: "📝",
};

const TYPE_LABELS: Record<RecordType, string> = {
  VACCINE: "Vacina",
  EXAM: "Exame",
  PRESCRIPTION: "Receita",
  SURGERY: "Cirurgia",
  NOTE: "Nota",
};

export function PetDashboard({ route }: Props) {
  const { pet } = route.params;

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinResult, setPinResult] = useState<VetAccessToken | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<HealthRecord[]>(
        `/pets/${pet.id}/health-records/`
      );
      setRecords(data);
    } catch {
      setError("Não foi possível carregar os registros.");
    } finally {
      setLoading(false);
    }
  }, [pet.id]);

  useEffect(() => {
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
      Alert.alert("Erro", "Não foi possível gerar o PIN.");
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCopyPin = () => {
    if (pinResult) {
      Clipboard.setString(pinResult.access_code);
      Alert.alert("Copiado!", "PIN copiado para a área de transferência.");
    }
  };

  const renderRecord = ({ item }: { item: HealthRecord }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot}>
        <Text style={styles.timelineIcon}>{TYPE_ICONS[item.record_type]}</Text>
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineDate}>{item.date_occurred}</Text>
        <Text style={styles.timelineTitle}>
          {TYPE_LABELS[item.record_type]} · {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.timelineDesc}>{item.description}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
            {generatingPin ? "Gerando…" : "🔑 Gerar PIN"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Histórico Clínico</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand.teal} style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRecords} style={styles.retryBtn}>
            <Text style={styles.btnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Nenhum registro ainda.{"\n"}Adicione pelo portal web.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeline}
        />
      )}

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
            <Text style={styles.modalTitle}>PIN gerado!</Text>
            <Text style={styles.modalSubtitle}>
              Compartilhe com o veterinário. Vale por 1 hora.
            </Text>
            <View style={styles.pinBox}>
              <Text style={styles.pinCode}>{pinResult?.access_code}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCopy} onPress={handleCopyPin}>
                <Text style={styles.btnCopyText}>Copiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnClose}
                onPress={() => setPinResult(null)}
              >
                <Text style={styles.btnText}>Fechar</Text>
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
  petName: { fontSize: fontSize["2xl"], fontWeight: fontWeight.bold, color: "#fff" },
  petDetail: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  actions: { flexDirection: "row", paddingHorizontal: spacing[4], gap: spacing[3] },
  btnPin: {
    flex: 1,
    backgroundColor: colors.brand.orange,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  timeline: { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
  timelineItem: { flexDirection: "row", marginBottom: spacing[4] },
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
  timelineDesc: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 4 },
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
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }) as any,
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
  btnCopyText: { color: colors.brand.teal, fontWeight: fontWeight.semibold },
  btnClose: {
    flex: 1,
    backgroundColor: colors.brand.teal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: "center",
  },
});
