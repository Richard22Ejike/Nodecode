"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import type { ReactNode } from "react";
import { workflowRoomId } from "@/lib/liveblocks-room";

/**
 * Puts the editor (header and canvas) in the workflow's multiplayer room.
 * The room is created on first join; the auth endpoint decides who may enter.
 */
export const WorkflowRoom = ({
  workflowId,
  enabled,
  children,
}: {
  workflowId: string;
  enabled: boolean;
  children: ReactNode;
}) => {
  if (!enabled) return <>{children}</>;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={workflowRoomId(workflowId)}
        initialPresence={{ cursor: null }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
};
