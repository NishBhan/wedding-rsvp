// Room allotments: a short free-text room name per invite ("Villa 3").
export const ROOM_MAX = 60;

// Trims and collapses spaces; empty means no room. "invalid" if too long.
export function tidyRoom(raw: unknown): string | null | "invalid" {
  const room = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!room) return null;
  return room.length > ROOM_MAX ? "invalid" : room;
}

// Groups names that differ only in case or spacing ("villa 3" = "Villa 3").
export const roomKey = (room: string) => room.toLowerCase().replace(/\s+/g, " ").trim();
