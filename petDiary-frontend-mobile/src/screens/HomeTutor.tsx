import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useAppStore } from "../store/useAppStore";
import { PetFormModal } from "../components/PetFormModal";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { Pet } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "HomeTutor">;

const SPECIES_EMOJI: Record<Pet["species"], string> = {
  DOG: "🐕",
  CAT: "🐱",
  BIRD: "🐦",
  OTHER: "🐾",
};

export function HomeTutor({ navigation }: Props) {
  const { t } = useTranslation();
  const setActivePet = useAppStore((s) => s.setActivePet);
  const user = useAppStore((s) => s.user);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [petModal, setPetModal] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const { data } = await api.get<{ count: number }>(
        "/notifications/unread-count/"
      );
      setUnread(data.count);
    } catch {
      // silencioso
    }
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Pet[]>("/pets/");
      setPets(data);
    } catch {
      setError(t("home.load_pets_failed"));
    } finally {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadUnread();
  }, [load, loadUnread]);

  const handleSelectPet = (pet: Pet) => {
    setActivePet(pet);
    navigation.navigate("PetDashboard", { pet });
  };

  const renderPet = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectPet(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{SPECIES_EMOJI[item.species]}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petBreed}>{item.breed || "—"}</Text>
        {item.weight_kg && (
          <Text style={styles.petWeight}>{item.weight_kg} kg</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>
            {user?.full_name
              ? t("home.greeting", {
                  name: user.full_name.split(" ")[0],
                })
              : t("home.greeting_no_name")}
          </Text>
          <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setPetModal(true)}
          style={styles.headerBtnAccent}
          accessibilityLabel={t("home.add_pet_a11y")}
        >
          <Text style={styles.headerBtnAccentText}>{t("home.new_pet_short")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Notifications");
            setUnread(0);
          }}
          style={styles.bellBtn}
          accessibilityLabel={t("home.notifications_a11y")}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unread > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unread > 9 ? "9+" : String(unread)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AccountSettings")}
          style={styles.logoutBtn}
          accessibilityLabel="Abrir conta"
        >
          <Text style={styles.logoutText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.teal} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.btnText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>{t("home.no_pets_title")}</Text>
          <Text style={styles.emptyText}>
            {t("home.no_pets_text").replace(/<\/?bold>/g, "")}
          </Text>
          <TouchableOpacity
            onPress={() => setPetModal(true)}
            style={styles.retryBtn}
          >
            <Text style={styles.btnText}>{t("home.add_first_pet")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderPet}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
          }
        />
      )}

      <PetFormModal
        visible={petModal}
        onClose={() => setPetModal(false)}
        onCreated={(p) => setPets((prev) => [p, ...prev])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greet: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: "#f4f4f4",
    marginLeft: spacing[2],
  },
  logoutText: { color: colors.text.secondary, fontSize: 22 },
  headerBtnAccent: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.brand.teal,
  },
  headerBtnAccentText: {
    color: "#fff",
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  bellBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginLeft: spacing[2],
    position: "relative",
  },
  bellIcon: { fontSize: 22 },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand.orange,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  list: { padding: spacing[4], gap: spacing[3] },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[4],
    marginBottom: spacing[3],
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E0F2F4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, marginLeft: spacing[3] },
  petName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  petBreed: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  petWeight: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  chevron: { fontSize: 28, color: "#bbb", fontWeight: "300" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  emptyEmoji: { fontSize: 64, marginBottom: spacing[4] },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    fontSize: fontSize.base,
    color: "#c00",
    textAlign: "center",
    marginBottom: spacing[4],
  },
  retryBtn: {
    backgroundColor: colors.brand.teal,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  btnText: { color: "#fff", fontWeight: fontWeight.semibold },
});
