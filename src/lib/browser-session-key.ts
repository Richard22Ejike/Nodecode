// src/lib/browser-session-key.ts
//
// Kept separate from browser-session.ts on purpose: that module imports
// Stagehand and the Browserbase SDK, which are Node-only and must never end up
// in a client bundle. Client code (e.g. the run console) imports from here.

/** Key under which the shared session ID travels through the run context. */
export const BROWSER_SESSION_KEY = "_browserbaseSessionId";
