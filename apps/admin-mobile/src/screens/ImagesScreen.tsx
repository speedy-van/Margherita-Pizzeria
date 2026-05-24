import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall, apiUpload, getBaseUrl } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import type { AdminImage } from "@/api/types";
import { Banner, PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { Card, EmptyState } from "@/components/ui";
import { palette } from "@/format";

// Sections the admin can attach an image to, with a plain-English description
// of WHERE that image will appear on the public website. Keep this list in
// sync with how the site actually consumes images (see lib/admin/queries.ts
// `getImagesBySection`). Only `hero` is currently wired into a page; the
// others are reserved for future use but kept here so the admin has a clear
// menu of choices instead of having to invent a label.
const SECTION_OPTIONS: ReadonlyArray<{
  value: string;
  title: string;
  where: string;
}> = [
  {
    value: "hero",
    title: "Homepage hero",
    where: "Big banner image at the top of the homepage.",
  },
  {
    value: "about",
    title: "About page",
    where: "Photos shown on the About page.",
  },
  {
    value: "menu",
    title: "Menu page",
    where: "Photos shown on the Menu page (not individual dish photos).",
  },
  {
    value: "booking",
    title: "Book a table",
    where: "Photo on the bookings page.",
  },
  {
    value: "contact",
    title: "Contact page",
    where: "Photo on the contact page.",
  },
  {
    value: "directions",
    title: "Directions page",
    where: "Photo on the directions page.",
  },
  {
    value: "landing",
    title: "Landing pages",
    where: "Used on marketing landing pages / campaigns.",
  },
];

function describeSection(section: string): string {
  const known = SECTION_OPTIONS.find((s) => s.value === section);
  return known ? known.where : `Custom section: "${section}"`;
}

function resolveDisplayUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  // Server-relative path (e.g. "/uploads/images/abc.jpg") — prepend the
  // configured API base so the device can fetch it.
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

export function ImagesScreen(): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminImage[]>(
    "/api/admin/images",
  );
  const [editing, setEditing] = useState<AdminImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSection, setNewSection] = useState<string>("");
  const [confirmDel, setConfirmDel] = useState<AdminImage | null>(null);
  const dialog = useDialog();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const open = (img: AdminImage): void => {
    setEditing(img);
    setUrl(img.url);
    setAdvanced(false);
  };

  const close = (): void => {
    if (busy) return;
    setEditing(null);
    setAdvanced(false);
  };

  const openCreate = (): void => {
    setNewLabel("");
    setNewSection("");
    setCreating(true);
  };

  const closeCreate = (): void => {
    if (busy) return;
    setCreating(false);
  };

  const submitCreate = async (): Promise<void> => {
    const label = newLabel.trim();
    const section = newSection.trim();
    if (!label) {
      void dialog.alert({
        title: "Missing name",
        message: "Please enter a name for this image.",
        tone: "warning",
      });
      return;
    }
    if (!section) {
      void dialog.alert({
        title: "Pick a location",
        message:
          "Please choose where this image will appear on the website.",
        tone: "warning",
      });
      return;
    }
    setBusy(true);
    const res = await apiCall<AdminImage>({
      method: "POST",
      path: "/api/admin/images",
      body: { label, section },
    });
    setBusy(false);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't add",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    setCreating(false);
    await reload();
    // Immediately open the new row so admin can pick a photo.
    open(res.data);
  };

  const confirmDelete = (img: AdminImage): void => {
    // Use a styled in-app modal on every platform so the experience matches
    // the rest of the app — the browser's window.confirm() looks out of place.
    setConfirmDel(img);
  };

  const runDelete = async (): Promise<void> => {
    const img = confirmDel;
    if (!img) return;
    setBusy(true);
    const res = await apiCall({
      method: "DELETE",
      path: `/api/admin/images/${img.id}`,
    });
    setBusy(false);
    setConfirmDel(null);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't delete",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    setEditing(null);
    setAdvanced(false);
    await reload();
  };

  const pickAndUpload = async (
    img: AdminImage,
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

      setBusy(true);

      const mime = asset.mimeType ?? guessMimeFromUri(asset.uri);
      const filename =
        asset.fileName ?? `photo-${Date.now()}.${extFromMime(mime)}`;

      let filePart: Blob | { uri: string; name: string; type: string };
      if (Platform.OS === "web") {
        // On web, expo-image-picker returns a blob:/data: URI — convert to File.
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        filePart = new File([blob], filename, { type: mime });
      } else {
        filePart = { uri: asset.uri, name: filename, type: mime };
      }

      const res = await apiUpload<AdminImage>({
        path: `/api/admin/images/${img.id}/upload`,
        fields: { file: filePart },
      });

      if (!res.ok) {
        void dialog.alert({
          title: "Upload failed",
          message: res.message,
          tone: "danger",
        });
        return;
      }
      setEditing(null);
      setAdvanced(false);
      await reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      void dialog.alert({
        title: "Upload failed",
        message,
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveUrl = async (): Promise<void> => {
    if (!editing) return;
    setBusy(true);
    const res = await apiCall({
      method: "PUT",
      path: `/api/admin/images/${editing.id}`,
      body: { url: url.trim() },
    });
    setBusy(false);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't save",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    setEditing(null);
    setAdvanced(false);
    await reload();
  };

  return (
    <View style={styles.wrap}>
      {error ? (
        <View style={{ padding: 12 }}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}
      <View style={styles.topBar}>
        <PrimaryButton
          label="Add image"
          icon="➕"
          onPress={openCreate}
        />
      </View>
      {loading && !data ? (
        <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState message="No images yet — tap '+ Add image' to add one" />
          }
          refreshing={loading}
          onRefresh={() => void reload()}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  {item.url ? (
                    <Image
                      source={{ uri: resolveDisplayUrl(item.url) }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Text style={{ color: palette.textMuted }}>No image</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.section}>
                      {describeSection(item.section)}
                    </Text>
                    <Text style={styles.tapHint}>Tap to change photo</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={editing !== null}
        animationType="slide"
        transparent
        onRequestClose={close}
      >
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing?.label ?? ""}</Text>
            <View style={styles.wherePill}>
              <Text style={styles.wherePillLabel}>Where this appears</Text>
              <Text style={styles.wherePillText}>
                {editing ? describeSection(editing.section) : ""}
              </Text>
            </View>

            {editing?.url ? (
              <Image
                source={{ uri: resolveDisplayUrl(editing.url) }}
                style={styles.preview}
              />
            ) : (
              <View style={[styles.preview, styles.previewEmpty]}>
                <Text style={{ color: palette.textMuted }}>No photo yet</Text>
              </View>
            )}

            {busy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.busyText}>Uploading…</Text>
              </View>
            ) : (
              <>
                <PrimaryButton
                  label="Choose from photos"
                  icon="🖼️"
                  onPress={() => editing && pickAndUpload(editing, "library")}
                  style={{ marginBottom: 8 }}
                />
                {Platform.OS !== "web" ? (
                  <SecondaryButton
                    label="Take a photo"
                    icon="📷"
                    onPress={() => editing && pickAndUpload(editing, "camera")}
                    style={{ marginBottom: 8 }}
                  />
                ) : null}

                <Pressable
                  onPress={() => setAdvanced((v) => !v)}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>
                    {advanced ? "Hide advanced" : "Paste an image URL instead"}
                  </Text>
                </Pressable>

                {advanced ? (
                  <View style={styles.advancedBox}>
                    <Text style={styles.modalLabel}>Image URL</Text>
                    <TextInput
                      value={url}
                      onChangeText={setUrl}
                      autoCapitalize="none"
                      keyboardType="url"
                      style={styles.input}
                      placeholder="https://..."
                      placeholderTextColor="#94a3b8"
                    />
                    <SecondaryButton
                      label="Save URL"
                      icon="💾"
                      onPress={saveUrl}
                    />
                  </View>
                ) : null}

                <SecondaryButton
                  label="Delete image"
                  icon="🗑️"
                  tone="danger"
                  onPress={() => editing && confirmDelete(editing)}
                  style={{ marginTop: 12 }}
                />

                <Pressable onPress={close} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={creating}
        animationType="slide"
        transparent
        onRequestClose={closeCreate}
      >
        <View style={styles.modalBack}>
          <View style={styles.modal}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Add new image</Text>
              <Text style={styles.modalSection}>
                Give the image a name and pick where it should appear on the
                website.
              </Text>

              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                value={newLabel}
                onChangeText={setNewLabel}
                style={styles.input}
                placeholder="e.g. Hero background"
                placeholderTextColor="#94a3b8"
                autoFocus
              />

              <Text style={styles.modalLabel}>Where should it appear?</Text>
              <View style={styles.sectionList}>
                {SECTION_OPTIONS.map((opt) => {
                  const selected = newSection === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNewSection(opt.value)}
                      style={[
                        styles.sectionOption,
                        selected && styles.sectionOptionSelected,
                      ]}
                    >
                      <View style={styles.sectionOptionTextWrap}>
                        <Text
                          style={[
                            styles.sectionOptionTitle,
                            selected && styles.sectionOptionTitleSelected,
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.sectionOptionWhere}>
                          {opt.where}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          selected && styles.radioSelected,
                        ]}
                      >
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {busy ? (
                <View style={styles.busy}>
                  <ActivityIndicator color={palette.primary} />
                  <Text style={styles.busyText}>Saving…</Text>
                </View>
              ) : (
                <>
                  <PrimaryButton
                    label="Create & choose photo"
                    icon="➕"
                    onPress={submitCreate}
                    style={{ marginBottom: 8 }}
                  />
                  <Pressable onPress={closeCreate} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Cancel</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmDel !== null}
        animationType="fade"
        transparent
        onRequestClose={() => !busy && setConfirmDel(null)}
      >
        <View style={styles.confirmBack}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete image?</Text>
            <Text style={styles.confirmBody}>
              &ldquo;{confirmDel?.label ?? ""}&rdquo; will be removed from the
              website. This cannot be undone.
            </Text>
            {busy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.busyText}>Deleting…</Text>
              </View>
            ) : (
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setConfirmDel(null)}
                  style={[styles.confirmBtn, styles.confirmBtnCancel]}
                >
                  <Text style={styles.confirmBtnCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void runDelete()}
                  style={[styles.confirmBtn, styles.confirmBtnDelete]}
                >
                  <Text style={styles.confirmBtnDeleteText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.bg },
  list: { padding: 12 },
  card: { marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: palette.border,
  },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  label: { color: palette.text, fontWeight: "700" },
  section: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  tapHint: { color: palette.primary, fontSize: 12, marginTop: 4 },
  err: {
    backgroundColor: palette.dangerBg,
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  errText: { color: palette.dangerFg },
  modalBack: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: palette.bg,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: palette.text },
  modalSection: { color: palette.textMuted, marginBottom: 12 },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: palette.border,
    marginBottom: 16,
  },
  previewEmpty: { alignItems: "center", justifyContent: "center" },
  busy: { alignItems: "center", paddingVertical: 24, gap: 8 },
  busyText: { color: palette.textMuted },
  modalLabel: { color: palette.text, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: palette.surface,
    color: palette.text,
    marginBottom: 12,
  },
  primary: {
    backgroundColor: palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryAlt: { backgroundColor: palette.primary, opacity: 0.85 },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryText: { color: palette.text, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 10 },
  linkText: { color: palette.primary, fontWeight: "600" },
  advancedBox: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    marginTop: 4,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  addBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  danger: {
    borderWidth: 1,
    borderColor: palette.dangerFg,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  dangerText: { color: palette.dangerFg, fontWeight: "700" },
  wherePill: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  wherePillLabel: {
    color: palette.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  wherePillText: { color: palette.text, fontWeight: "600" },
  sectionList: { gap: 8, marginBottom: 16 },
  sectionOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: palette.surface,
  },
  sectionOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.dangerBg,
  },
  sectionOptionTextWrap: { flex: 1 },
  sectionOptionTitle: { color: palette.text, fontWeight: "700" },
  sectionOptionTitleSelected: { color: palette.primary },
  sectionOptionWhere: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: palette.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primary,
  },
  confirmBack: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: palette.bg,
    borderRadius: 14,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
  },
  confirmBody: {
    color: palette.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnCancel: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  confirmBtnCancelText: { color: palette.text, fontWeight: "600" },
  confirmBtnDelete: { backgroundColor: palette.dangerFg },
  confirmBtnDeleteText: { color: "#fff", fontWeight: "700" },
});
