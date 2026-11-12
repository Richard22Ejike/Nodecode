// src/features/executions/components/agent/executor.ts
import type { NodeExecutor } from "@/features/executions/types";
import { withBrowserSession } from "@/lib/browser-session";
import { renderRequired, withResult } from "../browser/shared";

type AgentData = {
  variableName?: string;
  instruction?: string;
  maxSteps?: number;
};

export const agentExecutor: NodeExecutor<AgentData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const instruction = renderRequired(
    data.instruction,
    context,
    "Agent node: instruction",
  );

  const { result, sessionId } = await withBrowserSession(
    { context, step, stepId: `agent:${nodeId}` },
    async (stagehand) => {
      const agent = stagehand.agent({
        systemPrompt:
          "You are a helpful assistant that can control a web browser to complete the user's goal.",
      });
      const outcome = await agent.execute({
        instruction,
        maxSteps: data.maxSteps || 20,
      });
      return {
        success: outcome.success,
        completed: outcome.completed,
        message: outcome.message,
      };
    },
  );

  return withResult(context, sessionId, data.variableName || "agent", result);
};
