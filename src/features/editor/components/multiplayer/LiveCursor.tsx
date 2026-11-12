"use client";

import { useOther } from "@liveblocks/react";
import type { CursorsCursorProps } from "@liveblocks/react-flow";

/** Another person's pointer on the canvas, tinted with their colour. */
export const LiveCursor = ({ connectionId }: CursorsCursorProps) => {
  const info = useOther(connectionId, (other) => other.info);
  if (!info) return null;

  return (
    <div className="flex items-start">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={info.color}
        stroke="white"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M4 3l16 7-7 2-2 7z" />
      </svg>
      <span
        className="-ml-1 mt-4 rounded-sm px-1.5 py-0.5 text-[11px] leading-4 font-medium text-white shadow-sm ring-1 ring-black/20"
        style={{ backgroundColor: info.color }}
      >
        {info.name}
      </span>
    </div>
  );
};
