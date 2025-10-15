export type EventDTO = {
  id?: number | string;
  name: string;
  description: string;
  datetime: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
};

const BASE_URL = "http://0.0.0.0:3333";

export async function getEvents(): Promise<EventDTO[]> {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error(`GET /events failed: ${res.status}`);
  return res.json();
}

export async function createEvent(payload: EventDTO): Promise<EventDTO> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /events failed: ${res.status}`);
  return res.json();
}
