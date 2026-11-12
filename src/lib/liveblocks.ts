// src/lib/liveblocks.ts (server only)
import { Liveblocks } from "@liveblocks/node";

let client: Liveblocks | null = null;

/** Multiplayer is optional: without a secret key the editor stays single-user. */
export const isLiveblocksConfigured = () =>
  Boolean(process.env.LIVEBLOCKS_SECRET_KEY);

export const getLiveblocks = (): Liveblocks => {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  client ??= new Liveblocks({ secret });
  return client;
};

export { workflowIdFromRoom, workflowRoomId } from "./liveblocks-room";

/** Deleting a workflow also deletes its room (and the stored canvas). */
export const deleteWorkflowRoom = async (roomId: string) => {
  if (!isLiveblocksConfigured()) return;
  try {
    await getLiveblocks().deleteRoom(roomId);
  } catch {
    // Room never existed (nobody opened the editor) or is already gone.
  }
};
