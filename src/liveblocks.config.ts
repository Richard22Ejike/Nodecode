// src/liveblocks.config.ts
//
// Global Liveblocks types: what each user publishes as presence, and the
// identity info the auth endpoint attaches to their token.

declare global {
  interface Liveblocks {
    Presence: {
      /** Pointer position in React Flow canvas coordinates; null = off-canvas. */
      cursor: { x: number; y: number } | null;
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        color: string;
      };
    };
  }
}

export {};
