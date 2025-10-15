import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Region, LatLng } from "react-native-maps";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getEvents, type EventDTO } from "../services/api";
import { loadEvents, saveEvents } from "../storage/eventsCache";
import type { RootStackParamList } from "../../App";
import type { StackNavigationProp } from "@react-navigation/stack";

type Nav = StackNavigationProp<RootStackParamList, "Map">;

const INITIAL_REGION: Region = {
  latitude: 53.5461,
  longitude: -113.4938,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const mapRef = useRef<MapView | null>(null);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await getEvents();
      await saveEvents(remote);
      setEvents(remote);
    } catch (e: any) {
      const cached = await loadEvents();
      if (cached?.events) {
        setEvents(cached.events);
        setError("Showing cached events (network unavailable).");
      } else {
        setError(e?.message ?? "Failed to load events.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const futureEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.datetime) > now);
  }, [events]);

  useEffect(() => {
    if (mapRef.current && futureEvents.length) {
      const coords: LatLng[] = futureEvents.map((e) => ({
        latitude: e.latitude,
        longitude: e.longitude,
      }));
      setTimeout(() => {
        try {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 60, bottom: 160, left: 60, right: 60 },
            animated: true,
          });
        } catch {}
      }, 200);
    }
  }, [futureEvents]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={(r) => (mapRef.current = r)}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
      >
        {futureEvents.map((e) => (
          <Marker
            key={String(e.id ?? `${e.latitude}-${e.longitude}-${e.datetime}`)}
            coordinate={{ latitude: e.latitude, longitude: e.longitude }}
            title={e.name}
            description={e.description}
          />
        ))}
      </MapView>

      <View style={styles.bottomBar}>
        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.bottomText}> Loading events…</Text>
          </View>
        ) : (
          <Text style={styles.bottomText}>
            {futureEvents.length} future event
            {futureEvents.length === 1 ? "" : "s"} found
          </Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateEvent")}
        accessibilityLabel="Add new event"
      >
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  bottomText: { color: "#fff", textAlign: "center" },
  error: { color: "#ffb3b3", marginTop: 4, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 72,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabPlus: { color: "#fff", fontSize: 28, lineHeight: 28 },
});
