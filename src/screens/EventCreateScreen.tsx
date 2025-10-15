import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createEvent, type EventDTO } from "../services/api";
import { uploadImage } from "../services/imageApi";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../../App";
import type { StackNavigationProp } from "@react-navigation/stack";

type Nav = StackNavigationProp<RootStackParamList, "CreateEvent">;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function EventCreateScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [thumbUri, setThumbUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const latOk = useMemo(() => {
    const v = Number(latitude);
    return !Number.isNaN(v) && v >= -90 && v <= 90;
  }, [latitude]);

  const lonOk = useMemo(() => {
    const v = Number(longitude);
    return !Number.isNaN(v) && v >= -180 && v <= 180;
  }, [longitude]);

  const dateOk = useMemo(() => DATE_RE.test(date), [date]);
  const timeOk = useMemo(() => TIME_RE.test(time), [time]);

  const isoDateTime = useMemo(() => {
    if (!dateOk || !timeOk) return "";
    return new Date(`${date}T${time}:00`).toISOString();
  }, [dateOk, timeOk, date, time]);

  const allFilled = useMemo(() => {
    return (
      name.trim() &&
      description.trim() &&
      dateOk &&
      timeOk &&
      latOk &&
      lonOk &&
      !!imageUrl
    );
  }, [name, description, dateOk, timeOk, latOk, lonOk, imageUrl]);

  async function ensurePermissions(): Promise<boolean> {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cam.status !== "granted" || lib.status !== "granted") {
      Alert.alert(
        "Permissions needed",
        "Please allow camera and photo library access."
      );
      return false;
    }
    return true;
  }

  async function pickFromLibrary() {
    const ok = await ensurePermissions();
    if (!ok) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets?.length) {
      const a = res.assets[0];
      setThumbUri(a.uri);
      await doUpload(a.base64 || "");
    }
  }

  async function takePhoto() {
    const ok = await ensurePermissions();
    if (!ok) return;

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets?.length) {
      const a = res.assets[0];
      setThumbUri(a.uri);
      await doUpload(a.base64 || "");
    }
  }

  async function doUpload(base64: string) {
    if (!base64) {
      Alert.alert("No image data", "Please try again.");
      return;
    }
    try {
      setUploading(true);
      const res = await uploadImage(base64);

      const data = res?.data?.data;
      const url: string | undefined = data?.display_url;
      const size: number = Number(data?.size) || 0;
      const name: string = data?.image?.filename || "uploaded-image";

      if (!url) throw new Error("ImgBB did not return a URL");
      setImageUrl(url);
      setImageName(name);
      setImageSize(size);
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!allFilled || !isoDateTime) return;
    setSaving(true);
    try {
      const payload: EventDTO = {
        name: name.trim(),
        description: description.trim(),
        datetime: isoDateTime,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: imageUrl!,
      };
      await createEvent(payload);
      Alert.alert("Saved", "Event created successfully.", [
        { text: "Next", onPress: () => navigation.navigate("Map") },
      ]);
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Event name"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="What is this event about?"
        multiline
      />

      <Text style={styles.label}>Date *</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />
      {!dateOk && date.length > 0 ? (
        <Text style={styles.err}>Use YYYY-MM-DD</Text>
      ) : null}

      <Text style={styles.label}>Time *</Text>
      <TextInput
        style={styles.input}
        value={time}
        onChangeText={setTime}
        placeholder="HH:MM (24h)"
      />
      {!timeOk && time.length > 0 ? (
        <Text style={styles.err}>Use 24h HH:MM</Text>
      ) : null}

      <Text style={styles.label}>Latitude *</Text>
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        placeholder="e.g. 53.5461"
      />
      {!latOk && latitude.length > 0 ? (
        <Text style={styles.err}>-90 to 90</Text>
      ) : null}

      <Text style={styles.label}>Longitude *</Text>
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        placeholder="-113.4938"
      />
      {!lonOk && longitude.length > 0 ? (
        <Text style={styles.err}>-180 to 180</Text>
      ) : null}

      <Text style={styles.label}>Photo *</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btn}
          onPress={takePhoto}
          accessibilityLabel="Add photo from camera"
        >
          <Text style={styles.btnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={pickFromLibrary}
          accessibilityLabel="Add photo from library"
        >
          <Text style={styles.btnText}>Library</Text>
        </TouchableOpacity>
      </View>

      {uploading ? <Text style={styles.note}>Uploading...</Text> : null}
      {imageUrl ? (
        <View style={styles.preview}>
          {thumbUri ? (
            <Image source={{ uri: thumbUri }} style={styles.thumb} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.note} numberOfLines={1}>
              URL: {imageUrl}
            </Text>
            <Text style={styles.note}>Name: {imageName}</Text>
            <Text style={styles.note}>Size: {imageSize} bytes</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.saveBtn,
          {
            backgroundColor:
              allFilled && !uploading && !saving ? "#007bff" : "#9aa8b3",
          },
        ]}
        disabled={!allFilled || uploading || saving}
        onPress={onSave}
        accessibilityLabel="Save"
      >
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  label: { fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  err: { color: "#c1121f", marginTop: -4 },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnText: { color: "#fff" },
  note: { color: "#333", marginTop: 6 },
  preview: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginTop: 8,
  },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#eee" },
  saveBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
