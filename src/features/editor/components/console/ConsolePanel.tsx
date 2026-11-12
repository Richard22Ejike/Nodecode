// src/features/editor/components/console/ConsolePanel.tsx
"use client";

import { useMemo, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWorkflowRuns } from "@/features/executions-history/hooks/use-workflow-runs";
import { InspectorPanel } from "./InspectorPanel";
import { type ConsoleSelection, LogsPanel } from "./LogsPanel";
import { toConsoleRun } from "./run-data";

export function ConsolePanel({ workflowId }: { workflowId: string }) {
  const { data } = useWorkflowRuns(workflowId);
  const [selection, setSelection] = useState<ConsoleSelection | null>(null);

  const runs = useMemo(() => (data ?? []).map(toConsoleRun), [data]);
  const selectedRun = selection
    ? runs.find((run) => run.id === selection.runId)
    : undefined;

  // Clicking the selected row again closes the inspector
  const toggle = (next: ConsoleSelection) =>
    setSelection((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? null : next,
    );

  return (
    <ResizablePanelGroup direction="horizontal" className="border-t bg-card">
      <ResizablePanel defaultSize={selection ? 40 : 100} minSize={25}>
        <LogsPanel runs={runs} selection={selection} onSelect={toggle} />
      </ResizablePanel>
      {selection && selectedRun && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={25}>
            <InspectorPanel run={selectedRun} selection={selection} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
