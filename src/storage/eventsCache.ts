import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventDTO } from "../services/api";

const KEY = "@events_cache";

export async function saveEvents(events: EventDTO[]) {
  const payload = { cachedAt: new Date().toISOString(), events };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}

export async function loadEvents(): Promise<{
  cachedAt: string;
  events: EventDTO[];
} | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { cachedAt: string; events: EventDTO[] };
  } catch {
    return null;
  }
}
