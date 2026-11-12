// src/lib/browser-session.ts
//
// One Browserbase browser session is shared by every browser node in a workflow
// run. Inngest executes each node in its own step, so a live Stagehand object
// cannot be carried between nodes. Instead:
//   1. the first browser node creates a `keepAlive` session and records its ID
//      in the run context,
//   2. every browser node reconnects to that session by ID (the page it left
//      behind is still open), and
//   3. the run releases the session at the end, which also finalises the
//      recording used for session replay.

import Browserbase from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";
import type { StepTools, WorkflowContext } from "@/features/executions/types";

import { BROWSER_SESSION_KEY } from "./browser-session-key";

export { BROWSER_SESSION_KEY };

/** Safety cap so a forgotten session cannot run (and bill) indefinitely. */
const SESSION_TIMEOUT_SECONDS = 1800;

const baseOptions = () => ({
  env: "BROWSERBASE" as const,
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  disablePino: true,
  verbose: 0 as const,
});

export async function createBrowserSession(): Promise<string> {
  const stagehand = new Stagehand({
    ...baseOptions(),
    browserbaseSessionCreateParams: {
      keepAlive: true,
      timeout: SESSION_TIMEOUT_SECONDS,
    },
  });
  await stagehand.init();
  const sessionId = stagehand.browserbaseSessionId;
  // keepAlive means closing our connection leaves the session running
  await stagehand.close().catch(() => {});
  if (!sessionId) {
    throw new Error("Browserbase did not return a session ID");
  }
  return sessionId;
}

export async function connectBrowserSession(
  sessionId: string,
): Promise<Stagehand> {
  const stagehand = new Stagehand({
    ...baseOptions(),
    browserbaseSessionID: sessionId,
    // Without this, closing *this* connection would end the shared session and
    // the next node would fail with "Requested session is not running".
    keepAlive: true,
  });
  await stagehand.init();
  return stagehand;
}

export async function releaseBrowserSession(sessionId: string): Promise<void> {
  const client = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
  await client.sessions.update(sessionId, {
    projectId: process.env.BROWSERBASE_PROJECT_ID as string,
    status: "REQUEST_RELEASE",
  });
}

// Inngest memoises step results as JSON, so anything a browser call returns has
// to survive a JSON round trip.
const toJson = <T>(value: T): T =>
  value === undefined ? (null as T) : JSON.parse(JSON.stringify(value));

/**
 * Runs `fn` against the run's shared browser, creating the session first if
 * this is the first browser node. Returns the (JSON-safe) result and the
 * session ID so the caller can put the ID back into the context.
 */
export async function withBrowserSession<T>(
  params: { context: WorkflowContext; step: StepTools; stepId: string },
  fn: (stagehand: Stagehand) => Promise<T>,
): Promise<{ result: T; sessionId: string }> {
  const { context, step, stepId } = params;

  const existing = context[BROWSER_SESSION_KEY];
  const reused = typeof existing === "string" && existing.length > 0;
  const sessionId = reused
    ? (existing as string)
    : await step.run(`${stepId}:create-session`, () => createBrowserSession());

  let result: unknown;
  try {
    result = await step.run(stepId, async () => {
      const stagehand = await connectBrowserSession(sessionId);
      try {
        return toJson(await fn(stagehand));
      } finally {
        await stagehand.close().catch(() => {});
      }
    });
  } catch (error) {
    // If this node created the session and then failed, the run never learns
    // the session ID (it only reaches the context on success), so release it
    // here instead of leaving it running until the timeout.
    if (!reused) {
      await releaseBrowserSession(sessionId).catch(() => {});
    }
    throw error;
  }

  return { result: result as T, sessionId };
}
