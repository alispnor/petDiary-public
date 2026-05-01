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
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { AppNotification, NotificationType } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const TYPE_ICON: Record<NotificationType, string> = {
  VACCINE: "💉",
  VET_RETURN: "🏥",
  PAYMENT_DUE: "💳",
  PAYMENT_OK: "✅",
  PIN_GENERATED: "🔑",
  VET_ACCESS_CLAIMED: "🩺",
  SYSTEM: "📢",
};

function formatRelative(iso: string): string {
  const created = new Date(iso).getTime();
  const diffMs = Date.now() - created;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get<{ results: AppNotification[] }>(
        "/notifications/?page_size=50"
      );
      setItems(data.results);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTap = async (n: AppNotification) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read/`);
        setItems((prev) =>
          prev.map((it) =>
            it.id === n.id
              ? { ...it, is_read: true, read_at: new Date().toISOString() }
              : it
          )
        );
      } catch {
        // ignora
      }
    }
    const screen = n.data?.screen;
    if (screen === "PetDashboard") {
      navigation.navigate("HomeTutor");
    } else if (screen === "Subscription") {
      navigation.navigate("SubscriptionDashboard");
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await api.post("/notifications/read-all/");
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((it) => ({ ...it, is_read: true, read_at: now }))
      );
    } catch {
      // ignora
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = (n: AppNotification) => {
    Alert.alert("Excluir notificação?", n.title, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/notifications/${n.id}/`);
            setItems((prev) => prev.filter((it) => it.id !== n.id));
          } catch {
            Alert.alert("Erro", "Não foi possível excluir.");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Limpar todas?",
      "Todas as notificações serão removidas. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar tudo",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/notifications/clear-all/");
              setItems([]);
            } catch {
              Alert.alert("Erro", "Não foi possível limpar.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={() => handleTap(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{TYPE_ICON[item.type] || "📢"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.meta}>{formatRelative(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const hasUnread = items.some((it) => !it.is_read);

  return (
    <View style={styles.container}>
      {(hasUnread || items.length > 0) && (
        <View style={styles.actionsBar}>
          {hasUnread && (
            <TouchableOpacity
              onPress={handleMarkAll}
              style={styles.actionBtn}
              disabled={markingAll}
            >
              <Text style={styles.actionText}>
                {markingAll ? "Marcando…" : "✓ Marcar todas lidas"}
              </Text>
            </TouchableOpacity>
          )}
          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.actionBtn, styles.actionBtnDanger]}
            >
              <Text style={[styles.actionText, styles.actionTextDanger]}>
                🗑 Limpar tudo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.teal} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>Sem notificações</Text>
          <Text style={styles.emptyText}>
            Você verá aqui lembretes de vacina, retorno ao vet, vencimento de
            pagamento e quando algum vet acessar o prontuário.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.brand.teal}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  actionsBar: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(36,182,212,0.08)",
  },
  actionBtnDanger: { backgroundColor: "rgba(220,38,38,0.08)" },
  actionText: {
    color: colors.brand.teal,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  actionTextDanger: { color: "#dc2626" },
  deleteBtn: { padding: spacing[1], marginLeft: spacing[2] },
  deleteIcon: { fontSize: 16, opacity: 0.5 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    alignItems: "flex-start",
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.brand.teal,
    backgroundColor: "rgba(36,182,212,0.05)",
  },
  icon: { fontSize: 28, marginRight: spacing[3] },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  body: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.orange,
    marginLeft: spacing[2],
    marginTop: spacing[2],
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing[3] },
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
});
