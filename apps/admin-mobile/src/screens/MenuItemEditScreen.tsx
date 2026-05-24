import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall, apiUpload, getBaseUrl } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import type { AdminMenuItem, AdminMenuPayload } from "@/api/types";
import { PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "MenuItemEdit">;

function resolveDisplayUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

function guessMimeFromUri(uri: string): string {
  const lower = uri.split("?")[0]!.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/avif") return "avif";
  return "jpg";
}

export function MenuItemEditScreen({ route, navigation }: Props): JSX.Element {
  const { id, categoryId: initialCategory } = route.params;
  const isNew = id === null;
  const { data: menu, loading } = useApiGet<AdminMenuPayload>("/api/admin/menu");

  const item = useMemo<AdminMenuItem | null>(() => {
    if (isNew || !menu) return null;
    return menu.items.find((i) => i.id === id) ?? null;
  }, [menu, id, isNew]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [available, setAvailable] = useState(true);
  const [allergens, setAllergens] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(
    initialCategory ?? null,
  );
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setPriceText((item.pricePence / 100).toFixed(2));
      setAvailable(item.available);
      setAllergens(item.allergens.join(", "));
      setImageUrl(item.imageUrl ?? "");
      setCategoryId(item.categoryId);
    }
  }, [item]);

  const save = async (): Promise<void> => {
    const pricePence = Math.round(parseFloat(priceText) * 100);
    if (!name.trim() || Number.isNaN(pricePence) || pricePence < 1) {
      void dialog.alert({
        title: "Check the form",
        message: "Name and a valid price are required.",
        tone: "warning",
      });
      return;
    }
    setSaving(true);
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      pricePence,
      categoryId,
      available,
      allergens: allergens
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: imageUrl.trim() || null,
    };
    const res = isNew
      ? await apiCall({
          method: "POST",
          path: "/api/admin/menu/items",
          body,
        })
      : await apiCall({
          method: "PUT",
          path: `/api/admin/menu/items/${id}`,
          body,
        });
    setSaving(false);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't save",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    navigation.goBack();
  };

  const remove = async (): Promise<void> => {
    if (isNew || !id) return;
    const ok = await dialog.confirm({
      title: "Delete item?",
      message: `Remove "${name}" from the menu?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await apiCall({
      method: "DELETE",
      path: `/api/admin/menu/items/${id}`,
    });
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't delete",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    navigation.goBack();
  };

  const pickAndUpload = async (
    source: "library" | "camera",
  ): Promise<void> => {
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          void dialog.alert({
            title: "Camera blocked",
            message: "Allow camera access in Settings to take a photo.",
            tone: "warning",
          });
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          void dialog.alert({
            title: "Photos blocked",
            message: "Allow photo access in Settings to pick an image.",
            tone: "warning",
          });
          return;
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.85,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.85,
              allowsEditing: false,
            });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setUploading(true);
      const mime = asset.mimeType ?? guessMimeFromUri(asset.uri);
      const filename =
        asset.fileName ?? `photo-${Date.now()}.${extFromMime(mime)}`;

      let filePart: Blob | { uri: string; name: string; type: string };
      if (Platform.OS === "web") {
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        filePart = new File([blob], filename, { type: mime });
      } else {
        filePart = { uri: asset.uri, name: filename, type: mime };
      }

      const res = await apiUpload<{ url: string }>({
        path: "/api/admin/uploads",
        fields: { file: filePart, folder: "menu" },
      });

      if (!res.ok) {
        void dialog.alert({
          title: "Upload failed",
          message: res.message,
          tone: "danger",
        });
        return;
      }
      setImageUrl(res.data.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      void dialog.alert({
        title: "Upload failed",
        message,
        tone: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading && !isNew && !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.multiline]}
        multiline
      />

      <Text style={styles.label}>Price (£)</Text>
      <TextInput
        value={priceText}
        onChangeText={setPriceText}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholder="9.50"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {(menu?.categories ?? []).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                categoryId === c.id && styles.chipTextActive,
              ]}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Switch value={available} onValueChange={setAvailable} />
        <Text style={styles.rowLabel}>Available to customers</Text>
      </View>

      <Text style={styles.label}>Allergens (comma-separated)</Text>
      <TextInput
        value={allergens}
        onChangeText={setAllergens}
        style={styles.input}
        placeholder="gluten, dairy"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Photo</Text>
      {imageUrl ? (
        <Image
          source={{ uri: resolveDisplayUrl(imageUrl) }}
          style={styles.preview}
        />
      ) : (
        <View style={[styles.preview, styles.previewEmpty]}>
          <Text style={{ color: palette.textMuted }}>No photo yet</Text>
        </View>
      )}
      {uploading ? (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.uploadingText}>Uploading…</Text>
        </View>
      ) : (
        <>
          <PrimaryButton
            label={imageUrl ? "Change photo" : "Choose from photos"}
            icon="🖼️"
            onPress={() => void pickAndUpload("library")}
            style={{ marginTop: 4 }}
          />
          {Platform.OS !== "web" ? (
            <SecondaryButton
              label="Take a photo"
              icon="📷"
              onPress={() => void pickAndUpload("camera")}
              style={{ marginTop: 8 }}
            />
          ) : null}
          {imageUrl ? (
            <Pressable
              onPress={() => setImageUrl("")}
              style={styles.removePhotoBtn}
            >
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setShowUrlField((v) => !v)}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>
              {showUrlField ? "Hide advanced" : "Paste an image URL instead"}
            </Text>
          </Pressable>
          {showUrlField ? (
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#94a3b8"
            />
          ) : null}
        </>
      )}

      <PrimaryButton
        label={isNew ? "Create item" : "Save changes"}
        icon={isNew ? "➕" : "💾"}
        busy={saving}
        onPress={save}
        style={{ marginTop: 24 }}
      />

      {!isNew ? (
        <SecondaryButton
          label="Delete item"
          icon="🗑️"
          tone="danger"
          onPress={remove}
          style={{ marginTop: 12 }}
        />
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: palette.bg },
  container: { padding: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  label: {
    marginTop: 14,
    marginBottom: 6,
    color: palette.text,
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 8,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { color: palette.text, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: palette.primaryText },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  rowLabel: { color: palette.text, fontSize: 14 },
  primary: {
    backgroundColor: palette.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  danger: {
    padding: 14,
    alignItems: "center",
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.dangerBg,
  },
  dangerText: { color: palette.danger, fontWeight: "600" },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: palette.border,
    marginTop: 4,
    marginBottom: 8,
  },
  previewEmpty: { alignItems: "center", justifyContent: "center" },
  photoBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  photoBtnAlt: { opacity: 0.85, marginTop: 8 },
  photoBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  removePhotoBtn: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  removePhotoText: { color: palette.danger, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: palette.primary, fontWeight: "600" },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  uploadingText: { color: palette.textMuted },
});
