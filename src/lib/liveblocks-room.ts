// src/lib/liveblocks-room.ts (client-safe)
const PREFIX = "workflow:";

export const workflowRoomId = (workflowId: string) => `${PREFIX}${workflowId}`;

export const workflowIdFromRoom = (roomId: string): string | null =>
  roomId.startsWith(PREFIX) && roomId.length > PREFIX.length
    ? roomId.slice(PREFIX.length)
    : null;

/** Stable per-user cursor/avatar colour. */
const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
export const colorForUser = (userId: string) => {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
};
