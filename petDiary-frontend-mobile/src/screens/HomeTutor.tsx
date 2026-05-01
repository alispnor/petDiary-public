import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../services/api";
import { useAppStore } from "../store/useAppStore";
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
  const setActivePet = useAppStore((s) => s.setActivePet);
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Pet[]>("/pets/");
      setPets(data);
    } catch {
      setError("Não foi possível carregar seus pets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectPet = (pet: Pet) => {
    setActivePet(pet);
    navigation.navigate("PetDashboard", { pet });
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => logout() },
    ]);
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
          <Text style={styles.greet}>Olá, {user?.full_name?.split(" ")[0]}!</Text>
          <Text style={styles.subtitle}>Selecione um pet para gerenciar</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
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
            <Text style={styles.btnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Você ainda não tem pets</Text>
          <Text style={styles.emptyText}>
            Cadastre seu primeiro pet pelo portal web em
            {"\n"}http://localhost:5173/tutor
          </Text>
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
  },
  logoutText: { color: colors.text.secondary, fontSize: fontSize.sm },
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
