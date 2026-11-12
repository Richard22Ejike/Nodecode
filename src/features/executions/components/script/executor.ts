// src/features/executions/components/script/executor.ts

import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { scriptChannel } from "@/inngest/channels/script";

type ScriptData = {
  variableName?: string;
  script?: string;
  timeoutMs?: number;
};

// The user's code becomes the body of an async function, so plain
// `return`, `await` and `fetch` all work inside it.
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...fnArgs: unknown[]) => Promise<unknown>;

export const scriptExecutor: NodeExecutor<ScriptData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(scriptChannel().status({ nodeId, status: "loading" }));

  if (!data.script?.trim()) {
    await publish(scriptChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Script node: no script configured");
  }

  const script = data.script;

  try {
    const result = await step.run(`script:${nodeId}`, async () => {
      let fn: (...fnArgs: unknown[]) => Promise<unknown>;
      try {
        fn = new AsyncFunction("context", script);
      } catch (error) {
        throw new NonRetriableError(
          `Script node: syntax error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const timeoutMs = data.timeoutMs || 30000;
      const value = await Promise.race([
        fn(context),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Script timed out after ${timeoutMs}ms`)),
            timeoutMs,
          ),
        ),
      ]);

      // Inngest memoizes step results as JSON; make sure it survives the trip
      try {
        return value === undefined ? null : JSON.parse(JSON.stringify(value));
      } catch {
        throw new NonRetriableError(
          "Script node: the returned value is not JSON-serializable",
        );
      }
    });

    await publish(scriptChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      // Default alias always points at the most recent script node
      scriptResult: result,
      [data.variableName || "scriptResult"]: result,
    };
  } catch (error) {
    console.error(`❌ [Script Executor] Node ${nodeId} failed:`, error);
    await publish(scriptChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
