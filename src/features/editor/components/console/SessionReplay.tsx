// src/features/editor/components/console/SessionReplay.tsx
"use client";

import Hls from "hls.js";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type State = "loading" | "ready" | "unsupported" | "error";

const POLL_MS = 2000;
// Browserbase finalises the recording shortly after the session closes
const MAX_POLLS = 60;

export function SessionReplay({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    let hls: Hls | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let blobUrl: string | null = null;
    let attempts = 0;

    setState("loading");

    const poll = async () => {
      try {
        const response = await fetch(`/api/replays/${sessionId}`, {
          cache: "no-store",
        });
        if (cancelled) return;

        if (response.status === 202) {
          attempts += 1;
          if (attempts >= MAX_POLLS) {
            setState("error");
            return;
          }
          timer = setTimeout(poll, POLL_MS);
          return;
        }
        if (!response.ok) {
          setState("error");
          return;
        }

        const playlist = await response.text();
        if (cancelled) return;
        blobUrl = URL.createObjectURL(
          new Blob([playlist], { type: "application/vnd.apple.mpegurl" }),
        );

        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(blobUrl);
          hls.attachMedia(video);
          setState("ready");
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = blobUrl;
          setState("ready");
        } else {
          setState("unsupported");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      hls?.destroy();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [sessionId]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-card p-2">
      {state === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Preparing the recording…
        </div>
      )}
      {state === "error" && (
        <p className="text-sm text-muted-foreground">
          The recording isn&apos;t available yet. Try again in a moment.
        </p>
      )}
      {state === "unsupported" && (
        <p className="text-sm text-muted-foreground">
          This browser can&apos;t play the recording format.
        </p>
      )}
      {/* biome-ignore lint/a11y/useMediaCaption: browser session recordings have no audio track */}
      <video
        ref={videoRef}
        controls
        className={
          state === "ready"
            ? "max-h-full max-w-full rounded-md border"
            : "hidden"
        }
      />
    </div>
  );
}
