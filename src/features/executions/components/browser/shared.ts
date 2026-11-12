// src/features/executions/components/browser/shared.ts
import { NonRetriableError } from "inngest";
import type { WorkflowContext } from "@/features/executions/types";
import { BROWSER_SESSION_KEY } from "@/lib/browser-session";
import { compileTemplate } from "@/lib/handlebars-template";

/** Resolve `{{variable}}` placeholders in a required text field. */
export function renderRequired(
  template: string | undefined,
  context: WorkflowContext,
  label: string,
): string {
  if (!template?.trim()) {
    throw new NonRetriableError(`${label} is required`);
  }
  return compileTemplate(
    template,
    context,
    `${label}: failed to resolve template`,
  );
}

/** Context update shared by every browser node: keep the session, store the result. */
export function withResult(
  context: WorkflowContext,
  sessionId: string,
  variableName: string,
  result: unknown,
): WorkflowContext {
  return {
    ...context,
    [BROWSER_SESSION_KEY]: sessionId,
    [variableName]: result,
  };
}
