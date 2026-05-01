import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import api from "../services/api";
import type { Attachment } from "../types";
import { colors, radii, spacing, fontSize, fontWeight } from "../theme";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string, name: string): string {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "🖼";
  if (m === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "📕";
  if (m.startsWith("audio/")) return "🎵";
  if (m.startsWith("video/")) return "🎬";
  if (m.startsWith("text/")) return "📄";
  return "📎";
}

type Props = {
  petId: string;
  recordId: string;
};

export function AttachmentsList({ petId, recordId }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Attachment[]>(
        `/pets/${petId}/health-records/${recordId}/attachments/`
      );
      setItems(data);
    } catch {
      // silencioso — mostra empty state
    } finally {
      setLoading(false);
    }
  }, [petId, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      // RN aceita { uri, name, type } no FormData
      formData.append("file", {
        uri,
        name: fileName,
        type: mimeType,
      } as any);
      formData.append("file_name", fileName);
      await api.post(
        `/pets/${petId}/health-records/${recordId}/attachments/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await load();
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Acesso à câmera não autorizado.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const name =
      asset.fileName || `foto-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
    await upload(asset.uri, name, asset.mimeType || "image/jpeg");
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Acesso à galeria não autorizado.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const name = asset.fileName || `arquivo-${Date.now()}`;
    await upload(asset.uri, name, asset.mimeType || "application/octet-stream");
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await upload(
      asset.uri,
      asset.name || `documento-${Date.now()}`,
      asset.mimeType || "application/octet-stream"
    );
  };

  const showPicker = () => {
    const options = ["📷 Tirar foto", "🖼 Galeria", "📄 Documento", "Cancelar"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3 },
        (idx) => {
          if (idx === 0) pickFromCamera();
          else if (idx === 1) pickFromGallery();
          else if (idx === 2) pickDocument();
        }
      );
    } else {
      Alert.alert("Anexar arquivo", "Escolha uma opção", [
        { text: "📷 Câmera", onPress: pickFromCamera },
        { text: "🖼 Galeria", onPress: pickFromGallery },
        { text: "📄 Documento", onPress: pickDocument },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  };

  const handleDelete = (att: Attachment) => {
    Alert.alert("Remover anexo?", att.file_name, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/attachments/${att.id}/`);
            await load();
          } catch {
            Alert.alert("Erro", "Não foi possível remover.");
          }
        },
      },
    ]);
  };

  const handleOpen = (att: Attachment) => {
    const base = api.defaults.baseURL?.replace(/\/api\/v1\/?$/, "") ?? "";
    const url = `${base}${att.view_url}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o arquivo.")
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📎 Anexos ({items.length})</Text>
        <TouchableOpacity
          style={[styles.addBtn, uploading && styles.disabled]}
          onPress={showPicker}
          disabled={uploading}
        >
          <Text style={styles.addBtnText}>
            {uploading ? "Enviando…" : "+ Anexar"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.brand.teal} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum anexo. Use o botão acima para enviar foto, documento ou laudo.
        </Text>
      ) : (
        items.map((att) => (
          <View key={att.id} style={styles.row}>
            <TouchableOpacity
              style={styles.rowMain}
              onPress={() => handleOpen(att)}
            >
              <Text style={styles.rowIcon}>
                {iconFor(att.mime_type, att.file_name)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {att.file_name}
                </Text>
                <Text style={styles.rowMeta}>
                  {formatSize(att.file_size)}
                  {att.uploader_name ? ` · ${att.uploader_name}` : ""}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(att)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fafafa",
    borderRadius: radii.md,
    padding: spacing[3],
    marginTop: spacing[2],
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  addBtn: {
    backgroundColor: colors.brand.teal,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
  },
  addBtnText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  disabled: { opacity: 0.6 },
  empty: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontStyle: "italic",
    paddingVertical: spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: { fontSize: 22, marginRight: spacing[2] },
  rowName: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  rowMeta: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deleteBtn: { padding: spacing[2] },
  deleteIcon: { fontSize: 18 },
});
